# Redis Caching Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Redis-backed caching to eliminate repeat IGDB API calls on every page load and prevent Riot/Steam API spam when the user refreshes multiplayer ranks.

**Architecture:** A generic `ICacheService` wraps `IDistributedCache` (Redis) with automatic JSON serialization and graceful degradation. IGDB calls are wrapped with TTL-based caching. Multiplayer refresh is gated by a 5-minute cooldown key. A new `SyncIdentifier` field on `MultiplayerEntry` stores the external ID (Riot platform or Steam ID) needed to re-sync on demand.

**Tech Stack:** .NET 9, `Microsoft.Extensions.Caching.StackExchangeRedis`, `System.Text.Json`, Redis 7 (Docker), xUnit, React + TypeScript

---

### Task 1: Add Redis to docker-compose and install NuGet package

**Files:**
- Modify: `docker-compose.yml`
- Modify: `backend/CloudBackend.csproj`

- [ ] **Step 1: Add Redis service and connection string to docker-compose.yml**

Replace the `services:` block so the file reads exactly:

```yaml
services:
  frontend:
    build:
      context: ./frontend
      args:
        VITE_API_URL: http://localhost:8081
    container_name: gamelog-frontend
    ports:
      - "8080:80"
    networks:
      - gamelog-network
    depends_on:
      - backend

  backend:
    build: ./backend
    container_name: gamelog-backend
    ports:
      - "8081:8080"
    environment:
      - ASPNETCORE_HTTP_PORTS=8080
      - ASPNETCORE_ENVIRONMENT=Development
      - ConnectionStrings__DefaultConnection=Server=gamelog-db;Database=GameLog;User Id=sa;Password=StrongPassword123!;TrustServerCertificate=True
      - ConnectionStrings__Redis=redis:6379
      - JwtSettings__Secret=local-docker-secret-key-minimum-32-characters!!
      - ExternalApis__Igdb__ClientId=${IGDB_CLIENT_ID:-}
      - ExternalApis__Igdb__ClientSecret=${IGDB_CLIENT_SECRET:-}
      - Riot__ApiKey=${RIOT_API_KEY:-}
      - Steam__ApiKey=${STEAM_API_KEY:-}
    networks:
      - gamelog-network
    depends_on:
      - gamelog-db
      - redis

  gamelog-db:
    image: mcr.microsoft.com/azure-sql-edge
    container_name: gamelog-db
    restart: always
    environment:
      SA_PASSWORD: "StrongPassword123!"
      ACCEPT_EULA: "Y"
    ports:
      - "1433:1433"
    volumes:
      - sql-data:/var/opt/mssql
    networks:
      - gamelog-network

  redis:
    image: redis:7-alpine
    container_name: gamelog-redis
    restart: unless-stopped
    ports:
      - "6379:6379"
    networks:
      - gamelog-network

volumes:
  sql-data:

networks:
  gamelog-network:
    driver: bridge
```

- [ ] **Step 2: Add the NuGet package to CloudBackend.csproj**

```bash
cd backend
dotnet add package Microsoft.Extensions.Caching.StackExchangeRedis
```

Expected output: `PackageReference` for `Microsoft.Extensions.Caching.StackExchangeRedis` added.

- [ ] **Step 3: Verify the project still builds**

```bash
cd backend
dotnet build
```

Expected: `Build succeeded.`

- [ ] **Step 4: Commit**

```bash
git add docker-compose.yml backend/CloudBackend.csproj
git commit -m "chore: add Redis service to docker-compose and NuGet package"
```

---

### Task 2: Create ICacheService and CacheService

**Files:**
- Create: `backend/Services/ICacheService.cs`
- Create: `backend/Services/CacheService.cs`
- Create: `backend/TaskManager.Tests/CacheServiceTests.cs`

- [ ] **Step 1: Write the failing tests**

Create `backend/TaskManager.Tests/CacheServiceTests.cs`:

```csharp
using CloudBackend.Services;
using Microsoft.Extensions.Caching.Distributed;
using Microsoft.Extensions.Logging.Abstractions;

namespace TaskManager.Tests;

public class CacheServiceTests
{
    // In-memory fake for IDistributedCache — no extra packages needed
    private sealed class FakeCache : IDistributedCache
    {
        private readonly Dictionary<string, byte[]> _store = new();

        public byte[]? Get(string key) => _store.TryGetValue(key, out var v) ? v : null;
        public Task<byte[]?> GetAsync(string key, CancellationToken t = default) =>
            Task.FromResult(Get(key));
        public void Set(string key, byte[] value, DistributedCacheEntryOptions opts) =>
            _store[key] = value;
        public Task SetAsync(string key, byte[] value, DistributedCacheEntryOptions opts, CancellationToken t = default)
        { Set(key, value, opts); return Task.CompletedTask; }
        public void Refresh(string key) { }
        public Task RefreshAsync(string key, CancellationToken t = default) => Task.CompletedTask;
        public void Remove(string key) => _store.Remove(key);
        public Task RemoveAsync(string key, CancellationToken t = default)
        { Remove(key); return Task.CompletedTask; }
    }

    private static CacheService Build() =>
        new(new FakeCache(), NullLogger<CacheService>.Instance);

    // Cache miss: factory is called, result returned
    [Fact]
    public async Task GetOrSetAsync_CacheMiss_CallsFactoryAndReturnsResult()
    {
        var svc = Build();
        var calls = 0;

        var result = await svc.GetOrSetAsync("key1", async () =>
        {
            calls++;
            return "hello";
        }, TimeSpan.FromMinutes(1));

        Assert.Equal("hello", result);
        Assert.Equal(1, calls);
    }

    // Cache hit: factory is NOT called on second request
    [Fact]
    public async Task GetOrSetAsync_CacheHit_DoesNotCallFactory()
    {
        var svc = Build();
        var calls = 0;

        await svc.GetOrSetAsync("key2", async () => { calls++; return 42; }, TimeSpan.FromMinutes(1));
        var result = await svc.GetOrSetAsync("key2", async () => { calls++; return 99; }, TimeSpan.FromMinutes(1));

        Assert.Equal(42, result);
        Assert.Equal(1, calls); // factory called only once
    }

    // RemoveAsync clears the key so the next call misses
    [Fact]
    public async Task RemoveAsync_ClearsKey()
    {
        var svc = Build();
        await svc.GetOrSetAsync("key3", async () => "first", TimeSpan.FromMinutes(1));
        await svc.RemoveAsync("key3");
        var result = await svc.GetOrSetAsync("key3", async () => "second", TimeSpan.FromMinutes(1));
        Assert.Equal("second", result);
    }

    // ExistsAsync returns true when key present, false when absent
    [Fact]
    public async Task ExistsAsync_ReturnsTrueOnlyWhenKeyPresent()
    {
        var svc = Build();
        Assert.False(await svc.ExistsAsync("missing"));
        await svc.SetAsync("present", "value", TimeSpan.FromMinutes(1));
        Assert.True(await svc.ExistsAsync("present"));
    }

    // Graceful degradation: broken cache calls factory directly
    [Fact]
    public async Task GetOrSetAsync_WhenCacheThrows_FallsBackToFactory()
    {
        var broken = new BrokenCache();
        var svc = new CacheService(broken, NullLogger<CacheService>.Instance);

        var result = await svc.GetOrSetAsync("k", async () => "fallback", TimeSpan.FromMinutes(1));

        Assert.Equal("fallback", result);
    }

    private sealed class BrokenCache : IDistributedCache
    {
        public byte[]? Get(string key) => throw new InvalidOperationException("Redis down");
        public Task<byte[]?> GetAsync(string key, CancellationToken t = default) =>
            throw new InvalidOperationException("Redis down");
        public void Set(string key, byte[] v, DistributedCacheEntryOptions o) =>
            throw new InvalidOperationException("Redis down");
        public Task SetAsync(string key, byte[] v, DistributedCacheEntryOptions o, CancellationToken t = default) =>
            throw new InvalidOperationException("Redis down");
        public void Refresh(string key) { }
        public Task RefreshAsync(string key, CancellationToken t = default) => Task.CompletedTask;
        public void Remove(string key) { }
        public Task RemoveAsync(string key, CancellationToken t = default) => Task.CompletedTask;
    }
}
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
cd backend
dotnet test TaskManager.Tests --filter "FullyQualifiedName~CacheServiceTests"
```

Expected: build error — `CacheService` not found.

- [ ] **Step 3: Create ICacheService.cs**

Create `backend/Services/ICacheService.cs`:

```csharp
namespace CloudBackend.Services;

public interface ICacheService
{
    /// <summary>
    /// Returns the cached value for <paramref name="key"/>. On miss, calls
    /// <paramref name="factory"/>, stores the result (with optional TTL), and returns it.
    /// ttl = null means no expiration.
    /// </summary>
    Task<T?> GetOrSetAsync<T>(string key, Func<Task<T>> factory, TimeSpan? ttl = null);

    /// <summary>Unconditionally writes a value. ttl = null means no expiration.</summary>
    Task SetAsync<T>(string key, T value, TimeSpan? ttl = null);

    /// <summary>Removes a key from cache. No-op if key does not exist.</summary>
    Task RemoveAsync(string key);

    /// <summary>Returns true when the key exists in cache.</summary>
    Task<bool> ExistsAsync(string key);
}
```

- [ ] **Step 4: Create CacheService.cs**

Create `backend/Services/CacheService.cs`:

```csharp
using System.Text.Json;
using Microsoft.Extensions.Caching.Distributed;

namespace CloudBackend.Services;

public class CacheService : ICacheService
{
    private readonly IDistributedCache _cache;
    private readonly ILogger<CacheService> _logger;

    private static readonly JsonSerializerOptions JsonOpts =
        new() { PropertyNameCaseInsensitive = true };

    public CacheService(IDistributedCache cache, ILogger<CacheService> logger)
    {
        _cache = cache;
        _logger = logger;
    }

    public async Task<T?> GetOrSetAsync<T>(string key, Func<Task<T>> factory, TimeSpan? ttl = null)
    {
        try
        {
            var bytes = await _cache.GetAsync(key);
            if (bytes != null)
                return JsonSerializer.Deserialize<T>(bytes, JsonOpts);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Redis GET failed for key {Key} — falling back to source", key);
            return await factory();
        }

        var value = await factory();

        try
        {
            var opts = new DistributedCacheEntryOptions();
            if (ttl.HasValue) opts.AbsoluteExpirationRelativeToNow = ttl;
            await _cache.SetAsync(key, JsonSerializer.SerializeToUtf8Bytes(value, JsonOpts), opts);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Redis SET failed for key {Key} — result not cached", key);
        }

        return value;
    }

    public async Task SetAsync<T>(string key, T value, TimeSpan? ttl = null)
    {
        try
        {
            var opts = new DistributedCacheEntryOptions();
            if (ttl.HasValue) opts.AbsoluteExpirationRelativeToNow = ttl;
            await _cache.SetAsync(key, JsonSerializer.SerializeToUtf8Bytes(value, JsonOpts), opts);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Redis SET failed for key {Key}", key);
        }
    }

    public async Task RemoveAsync(string key)
    {
        try { await _cache.RemoveAsync(key); }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Redis REMOVE failed for key {Key}", key);
        }
    }

    public async Task<bool> ExistsAsync(string key)
    {
        try { return await _cache.GetAsync(key) != null; }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Redis EXISTS failed for key {Key}", key);
            return false;
        }
    }
}
```

- [ ] **Step 5: Run tests to verify they pass**

```bash
cd backend
dotnet test TaskManager.Tests --filter "FullyQualifiedName~CacheServiceTests" -v normal
```

Expected: `5 passed, 0 failed`.

- [ ] **Step 6: Commit**

```bash
git add backend/Services/ICacheService.cs backend/Services/CacheService.cs backend/TaskManager.Tests/CacheServiceTests.cs
git commit -m "feat: add ICacheService and CacheService with Redis + graceful degradation"
```

---

### Task 3: Register Redis and ICacheService in Program.cs

**Files:**
- Modify: `backend/Program.cs`

- [ ] **Step 1: Add Redis cache and ICacheService registration**

In `backend/Program.cs`, add these two lines directly after `builder.Services.AddAuthorization();` (line 84):

```csharp
builder.Services.AddStackExchangeRedisCache(options =>
    options.Configuration = builder.Configuration.GetConnectionString("Redis"));

builder.Services.AddSingleton<ICacheService, CacheService>();
```

The `AddStackExchangeRedisCache` call requires the namespace — add `using Microsoft.Extensions.Caching.StackExchangeRedis;` is NOT needed; the extension method is discoverable without an explicit using statement in `Program.cs` because of global usings.

- [ ] **Step 2: Build to verify registration compiles**

```bash
cd backend
dotnet build
```

Expected: `Build succeeded.`

- [ ] **Step 3: Commit**

```bash
git add backend/Program.cs
git commit -m "feat: register Redis and ICacheService in DI"
```

---

### Task 4: Add SyncIdentifier to MultiplayerEntry + EF migration

`SyncIdentifier` stores the external account identifier required to re-sync data: the Riot platform (`eun1`, `euw1`, etc.) for League of Legends entries, and the 64-bit Steam ID for CS2 entries.

**Files:**
- Modify: `backend/Models/MultiplayerEntry.cs`
- Modify: `backend/DTOs/Multiplayer/MultiplayerEntryDto.cs`
- Create: EF Core migration (generated by CLI)

- [ ] **Step 1: Add SyncIdentifier to MultiplayerEntry model**

In `backend/Models/MultiplayerEntry.cs`, add one property after `InGameUsername`:

```csharp
namespace CloudBackend.Models;

public class MultiplayerEntry
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public User User { get; set; } = null!;

    public string GameTitle { get; set; } = "";
    public string? Mode { get; set; }
    public string? Tier { get; set; }
    public string? Rank { get; set; }
    public int? RankPoints { get; set; }
    public int? RankPointsMax { get; set; }
    public double? WinRate { get; set; }
    public double? KdRatio { get; set; }
    public int? HoursPlayed { get; set; }
    public string? Platform { get; set; }
    public string? InGameUsername { get; set; }
    /// <summary>
    /// Stores the external identifier needed for re-sync:
    /// LoL → Riot platform (e.g. "eun1"), CS2 → Steam 64-bit ID.
    /// </summary>
    public string? SyncIdentifier { get; set; }
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
```

- [ ] **Step 2: Add SyncIdentifier to both DTOs**

Replace the contents of `backend/DTOs/Multiplayer/MultiplayerEntryDto.cs`:

```csharp
namespace CloudBackend.DTOs.Multiplayer;

public class MultiplayerEntryDto
{
    public int Id { get; set; }
    public string GameTitle { get; set; } = "";
    public string? Mode { get; set; }
    public string? Tier { get; set; }
    public string? Rank { get; set; }
    public int? RankPoints { get; set; }
    public int? RankPointsMax { get; set; }
    public double? WinRate { get; set; }
    public double? KdRatio { get; set; }
    public int? HoursPlayed { get; set; }
    public string? Platform { get; set; }
    public string? InGameUsername { get; set; }
    public string? SyncIdentifier { get; set; }
    public DateTime UpdatedAt { get; set; }
}

public class UpsertMultiplayerEntryDto
{
    public string GameTitle { get; set; } = "";
    public string? Mode { get; set; }
    public string? Tier { get; set; }
    public string? Rank { get; set; }
    public int? RankPoints { get; set; }
    public int? RankPointsMax { get; set; }
    public double? WinRate { get; set; }
    public double? KdRatio { get; set; }
    public int? HoursPlayed { get; set; }
    public string? Platform { get; set; }
    public string? InGameUsername { get; set; }
    public string? SyncIdentifier { get; set; }
}
```

- [ ] **Step 3: Create the EF Core migration**

```bash
cd backend
dotnet ef migrations add AddSyncIdentifierToMultiplayerEntry
```

Expected: `Done. To undo this action, use 'ef migrations remove'`

- [ ] **Step 4: Verify the migration file looks correct**

Open the generated file in `backend/Migrations/`. Confirm it contains:
- `migrationBuilder.AddColumn<string>(name: "SyncIdentifier", table: "MultiplayerEntries", nullable: true)`
- The corresponding `Down()` calls `migrationBuilder.DropColumn`

- [ ] **Step 5: Commit**

```bash
git add backend/Models/MultiplayerEntry.cs backend/DTOs/Multiplayer/MultiplayerEntryDto.cs backend/Migrations/
git commit -m "feat: add SyncIdentifier to MultiplayerEntry for re-sync support"
```

---

### Task 5: Update MultiplayerController — persist SyncIdentifier + add refresh-all

**Files:**
- Modify: `backend/Controllers/MultiplayerController.cs`

- [ ] **Step 1: Inject ICacheService and update Map helper**

Replace the full contents of `backend/Controllers/MultiplayerController.cs` with:

```csharp
using System.Security.Claims;
using CloudBackend.Data;
using CloudBackend.DTOs.Multiplayer;
using CloudBackend.Models;
using CloudBackend.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace CloudBackend.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class MultiplayerController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly IRiotService _riot;
    private readonly ISteamService _steam;
    private readonly ICacheService _cache;

    public MultiplayerController(AppDbContext db, IRiotService riot, ISteamService steam, ICacheService cache)
    {
        _db = db;
        _riot = riot;
        _steam = steam;
        _cache = cache;
    }

    private int UserId => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    private static MultiplayerEntryDto Map(MultiplayerEntry e) => new()
    {
        Id = e.Id,
        GameTitle = e.GameTitle,
        Mode = e.Mode,
        Tier = e.Tier,
        Rank = e.Rank,
        RankPoints = e.RankPoints,
        RankPointsMax = e.RankPointsMax,
        WinRate = e.WinRate,
        KdRatio = e.KdRatio,
        HoursPlayed = e.HoursPlayed,
        Platform = e.Platform,
        InGameUsername = e.InGameUsername,
        SyncIdentifier = e.SyncIdentifier,
        UpdatedAt = e.UpdatedAt,
    };

    [HttpGet]
    public async Task<ActionResult<List<MultiplayerEntryDto>>> GetAll()
    {
        var entries = await _db.MultiplayerEntries
            .Where(e => e.UserId == UserId)
            .OrderBy(e => e.GameTitle)
            .ToListAsync();
        return Ok(entries.Select(Map));
    }

    [HttpPost]
    public async Task<ActionResult<MultiplayerEntryDto>> Create([FromBody] UpsertMultiplayerEntryDto dto)
    {
        var entry = new MultiplayerEntry
        {
            UserId = UserId,
            GameTitle = dto.GameTitle,
            Mode = dto.Mode,
            Tier = dto.Tier,
            Rank = dto.Rank,
            RankPoints = dto.RankPoints,
            RankPointsMax = dto.RankPointsMax,
            WinRate = dto.WinRate,
            KdRatio = dto.KdRatio,
            HoursPlayed = dto.HoursPlayed,
            Platform = dto.Platform,
            InGameUsername = dto.InGameUsername,
            SyncIdentifier = dto.SyncIdentifier,
            UpdatedAt = DateTime.UtcNow,
        };
        _db.MultiplayerEntries.Add(entry);
        await _db.SaveChangesAsync();
        return CreatedAtAction(nameof(GetAll), Map(entry));
    }

    [HttpPut("{id:int}")]
    public async Task<ActionResult<MultiplayerEntryDto>> Update(int id, [FromBody] UpsertMultiplayerEntryDto dto)
    {
        var entry = await _db.MultiplayerEntries.FirstOrDefaultAsync(e => e.Id == id && e.UserId == UserId);
        if (entry == null) return NotFound();

        entry.GameTitle = dto.GameTitle;
        entry.Mode = dto.Mode;
        entry.Tier = dto.Tier;
        entry.Rank = dto.Rank;
        entry.RankPoints = dto.RankPoints;
        entry.RankPointsMax = dto.RankPointsMax;
        entry.WinRate = dto.WinRate;
        entry.KdRatio = dto.KdRatio;
        entry.HoursPlayed = dto.HoursPlayed;
        entry.Platform = dto.Platform;
        entry.InGameUsername = dto.InGameUsername;
        entry.SyncIdentifier = dto.SyncIdentifier;
        entry.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync();
        return Ok(Map(entry));
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var entry = await _db.MultiplayerEntries.FirstOrDefaultAsync(e => e.Id == id && e.UserId == UserId);
        if (entry == null) return NotFound();
        _db.MultiplayerEntries.Remove(entry);
        await _db.SaveChangesAsync();
        return NoContent();
    }

    // ── Sync endpoints ──────────────────────────────────────────

    public record SyncLolDto(string SummonerName, string Platform = "eun1");
    public record SyncSteamDto(string SteamId);

    /// <summary>
    /// Fetches LoL rank from Riot API and returns pre-filled DTO (does NOT save).
    /// SyncIdentifier is set to the Riot platform so refresh-all can re-use it.
    /// </summary>
    [HttpPost("sync/lol")]
    public async Task<ActionResult<UpsertMultiplayerEntryDto>> SyncLol([FromBody] SyncLolDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.SummonerName))
            return BadRequest(new { message = "SummonerName is required" });
        try
        {
            var result = await _riot.GetLoLRankAsync(dto.SummonerName.Trim(), dto.Platform);
            result.SyncIdentifier = dto.Platform;   // stored so refresh-all knows which region to use
            return Ok(result);
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPost("sync/cs2")]
    public async Task<ActionResult<UpsertMultiplayerEntryDto>> SyncCs2([FromBody] SyncSteamDto dto)
    {
        try
        {
            var result = await _steam.GetCs2StatsAsync(dto.SteamId);
            result.SyncIdentifier = dto.SteamId;    // stored so refresh-all knows the Steam ID to use
            return Ok(result);
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    // ── Refresh-all endpoint ─────────────────────────────────────

    public record RefreshAllResult(List<MultiplayerEntryDto> Entries, List<string> Errors);

    /// <summary>
    /// Re-fetches rank/stats from Riot/Steam for every entry that has a SyncIdentifier.
    /// Rate-limited to once per 5 minutes via Redis cooldown key.
    /// </summary>
    [HttpPost("refresh-all")]
    public async Task<ActionResult<RefreshAllResult>> RefreshAll()
    {
        var cooldownKey = $"multiplayer:refresh-cooldown:{UserId}";

        if (await _cache.ExistsAsync(cooldownKey))
            return StatusCode(429, new { message = "Odświeżanie jest możliwe raz na 5 minut. Spróbuj ponownie za chwilę." });

        var entries = await _db.MultiplayerEntries
            .Where(e => e.UserId == UserId)
            .ToListAsync();

        var errors = new List<string>();

        foreach (var entry in entries)
        {
            if (string.IsNullOrEmpty(entry.InGameUsername) || string.IsNullOrEmpty(entry.SyncIdentifier))
                continue;

            try
            {
                UpsertMultiplayerEntryDto fresh;

                if (entry.GameTitle == "League of Legends")
                {
                    fresh = await _riot.GetLoLRankAsync(entry.InGameUsername, entry.SyncIdentifier);
                }
                else if (entry.GameTitle == "Counter-Strike 2")
                {
                    fresh = await _steam.GetCs2StatsAsync(entry.SyncIdentifier);
                }
                else
                {
                    continue; // unsupported game for auto-sync
                }

                entry.Tier = fresh.Tier;
                entry.Rank = fresh.Rank;
                entry.RankPoints = fresh.RankPoints;
                entry.RankPointsMax = fresh.RankPointsMax;
                entry.WinRate = fresh.WinRate;
                entry.KdRatio = fresh.KdRatio;
                entry.HoursPlayed = fresh.HoursPlayed;
                entry.UpdatedAt = DateTime.UtcNow;
            }
            catch (Exception ex)
            {
                errors.Add($"{entry.GameTitle}: {ex.Message}");
            }
        }

        await _db.SaveChangesAsync();

        // Set cooldown AFTER saving so a failed run doesn't block the user
        await _cache.SetAsync(cooldownKey, true, TimeSpan.FromMinutes(5));

        var updated = await _db.MultiplayerEntries
            .Where(e => e.UserId == UserId)
            .OrderBy(e => e.GameTitle)
            .ToListAsync();

        return Ok(new RefreshAllResult(updated.Select(Map).ToList(), errors));
    }
}
```

- [ ] **Step 2: Build to verify no compilation errors**

```bash
cd backend
dotnet build
```

Expected: `Build succeeded.`

- [ ] **Step 3: Run existing tests to make sure nothing broke**

```bash
cd backend
dotnet test TaskManager.Tests -v normal
```

Expected: all tests pass.

- [ ] **Step 4: Commit**

```bash
git add backend/Controllers/MultiplayerController.cs
git commit -m "feat: persist SyncIdentifier and add refresh-all endpoint with cooldown"
```

---

### Task 6: Wrap IgdbService calls with ICacheService

**Files:**
- Modify: `backend/Services/IgdbService.cs`

- [ ] **Step 1: Inject ICacheService and wrap all public methods**

Replace the full contents of `backend/Services/IgdbService.cs`:

```csharp
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using CloudBackend.Data;
using CloudBackend.DTOs.Games;
using CloudBackend.Models;
using Microsoft.EntityFrameworkCore;

namespace CloudBackend.Services;

public class IgdbService : IIgdbService
{
    private readonly HttpClient _http;
    private readonly string _clientId;
    private readonly string _clientSecret;
    private readonly AppDbContext _context;
    private readonly ICacheService _cache;
    private static string? _accessToken;
    private static DateTime _tokenExpiry = DateTime.MinValue;

    public IgdbService(HttpClient http, IConfiguration config, AppDbContext context, ICacheService cache)
    {
        _http = http;
        _clientId = config["ExternalApis:Igdb:ClientId"] ?? "";
        _clientSecret = config["ExternalApis:Igdb:ClientSecret"] ?? "";
        _context = context;
        _cache = cache;
    }

    private async Task EnsureTokenAsync()
    {
        if (_accessToken != null && DateTime.UtcNow < _tokenExpiry) return;

        var url = $"https://id.twitch.tv/oauth2/token?client_id={_clientId}&client_secret={_clientSecret}&grant_type=client_credentials";
        var response = await _http.PostAsync(url, null);
        var json = await response.Content.ReadAsStringAsync();
        var tokenData = JsonSerializer.Deserialize<TwitchTokenResponse>(json, JsonOptions)!;
        _accessToken = tokenData.AccessToken;
        _tokenExpiry = DateTime.UtcNow.AddSeconds(tokenData.ExpiresIn - 60);
    }

    private async Task<List<GameDto>> PostQueryAsync(string body)
    {
        await EnsureTokenAsync();
        var request = new HttpRequestMessage(HttpMethod.Post, "https://api.igdb.com/v4/games");
        request.Headers.Add("Client-ID", _clientId);
        request.Headers.Add("Authorization", $"Bearer {_accessToken}");
        request.Content = new StringContent(body, Encoding.UTF8, "text/plain");
        var response = await _http.SendAsync(request);
        var json = await response.Content.ReadAsStringAsync();
        var games = JsonSerializer.Deserialize<List<IgdbGame>>(json, JsonOptions) ?? new();
        return games.Select(MapGame).ToList();
    }

    public Task<List<GameDto>?> SearchGamesAsync(string query) =>
        _cache.GetOrSetAsync(
            $"igdb:search:{query.ToLowerInvariant()}",
            () => PostQueryAsync($"search \"{query}\"; fields id,name,cover.image_id,first_release_date,genres.name; limit 12;"),
            TimeSpan.FromMinutes(15));

    public Task<List<GameDto>?> GetPopularGamesAsync() =>
        _cache.GetOrSetAsync(
            "igdb:popular",
            () => PostQueryAsync("fields id,name,cover.image_id,first_release_date,genres.name; where rating_count > 100; sort rating desc; limit 12;"),
            TimeSpan.FromHours(6));

    public Task<List<GameDto>?> GetGamesByGenreAsync(string genre)
    {
        var escaped = genre.Replace("\"", "\\\"");
        return _cache.GetOrSetAsync(
            $"igdb:genre:{genre.ToLowerInvariant()}",
            () => PostQueryAsync(
                $"fields id,name,cover.image_id,first_release_date,genres.name; " +
                $"where genres.name = \"{escaped}\" & first_release_date != null & first_release_date <= {DateTimeOffset.UtcNow.ToUnixTimeSeconds()}; " +
                $"sort first_release_date desc; limit 14;"),
            TimeSpan.FromHours(2));
    }

    public async Task<GameDto?> GetGameDetailsAsync(int igdbId)
    {
        // DB cache takes priority (permanent storage); Redis adds in-memory speed
        var cached = await _context.Games.FirstOrDefaultAsync(g => g.IgdbId == igdbId);
        if (cached != null) return MapCachedGame(cached);

        return await _cache.GetOrSetAsync(
            $"igdb:game:{igdbId}",
            async () =>
            {
                var results = await PostQueryAsync($"where id = {igdbId}; fields id,name,cover.image_id,first_release_date,genres.name;");
                return results.FirstOrDefault()!;
            },
            TimeSpan.FromHours(24));
    }

    public async Task<Game> GetOrCreateCachedGameAsync(int igdbId)
    {
        var existing = await _context.Games.FirstOrDefaultAsync(g => g.IgdbId == igdbId);
        if (existing != null) return existing;

        var dto = await GetGameDetailsAsync(igdbId);
        if (dto == null) throw new Exception($"Game {igdbId} not found in IGDB.");

        var game = new Game
        {
            IgdbId = dto.IgdbId,
            Title = dto.Title,
            CoverImageUrl = dto.CoverImageUrl,
            ReleaseYear = dto.ReleaseYear,
            Genres = JsonSerializer.Serialize(dto.Genres)
        };
        _context.Games.Add(game);
        await _context.SaveChangesAsync();
        return game;
    }

    private static GameDto MapGame(IgdbGame g) => new()
    {
        IgdbId = g.Id,
        Title = g.Name,
        CoverImageUrl = g.Cover?.ImageId != null
            ? $"https://images.igdb.com/igdb/image/upload/t_cover_big/{g.Cover.ImageId}.jpg"
            : "",
        ReleaseYear = g.FirstReleaseDate.HasValue
            ? DateTimeOffset.FromUnixTimeSeconds(g.FirstReleaseDate.Value).Year
            : null,
        Genres = g.Genres?.Select(x => x.Name).ToList() ?? new()
    };

    private static GameDto MapCachedGame(Game g) => new()
    {
        IgdbId = g.IgdbId,
        Title = g.Title,
        CoverImageUrl = g.CoverImageUrl,
        ReleaseYear = g.ReleaseYear,
        Genres = JsonSerializer.Deserialize<List<string>>(g.Genres) ?? new()
    };

    private static readonly JsonSerializerOptions JsonOptions = new() { PropertyNameCaseInsensitive = true };

    private class TwitchTokenResponse
    {
        [JsonPropertyName("access_token")] public string AccessToken { get; set; } = "";
        [JsonPropertyName("expires_in")] public long ExpiresIn { get; set; }
    }

    private class IgdbGame
    {
        public int Id { get; set; }
        public string Name { get; set; } = "";
        public IgdbCover? Cover { get; set; }
        [JsonPropertyName("first_release_date")] public long? FirstReleaseDate { get; set; }
        public List<IgdbGenre>? Genres { get; set; }
    }

    private class IgdbCover
    {
        [JsonPropertyName("image_id")] public string? ImageId { get; set; }
    }

    private class IgdbGenre
    {
        public string Name { get; set; } = "";
    }
}
```

> **Note:** The return types of `SearchGamesAsync`, `GetPopularGamesAsync`, and `GetGamesByGenreAsync` change from `Task<List<GameDto>>` to `Task<List<GameDto>?>` because `GetOrSetAsync<T>` returns `T?`. Update `IIgdbService.cs` to match.

- [ ] **Step 2: Update IIgdbService interface to match nullable return types**

Open `backend/Services/IIgdbService.cs` and change the three method signatures:

```csharp
Task<List<GameDto>?> SearchGamesAsync(string query);
Task<List<GameDto>?> GetPopularGamesAsync();
Task<List<GameDto>?> GetGamesByGenreAsync(string genre);
```

(`GetGameDetailsAsync` already returns `Task<GameDto?>` so no change needed there.)

- [ ] **Step 3: Fix any callers that now need null-coalescing**

Search for usages in controllers:

```bash
cd backend
grep -rn "GetPopularGamesAsync\|SearchGamesAsync\|GetGamesByGenreAsync" --include="*.cs" .
```

For each call site that assigns the result to `List<GameDto>` (non-nullable), add `?? new()` at the end. For example in `GamesController.cs`:

```csharp
// Before:
var games = await _igdb.GetPopularGamesAsync();

// After:
var games = await _igdb.GetPopularGamesAsync() ?? new();
```

Apply the same pattern to `SearchGamesAsync` and `GetGamesByGenreAsync` callers.

- [ ] **Step 4: Build to verify no compilation errors**

```bash
cd backend
dotnet build
```

Expected: `Build succeeded.`

- [ ] **Step 5: Run all tests**

```bash
cd backend
dotnet test TaskManager.Tests -v normal
```

Expected: all tests pass.

- [ ] **Step 6: Commit**

```bash
git add backend/Services/IgdbService.cs backend/Services/IIgdbService.cs backend/Controllers/
git commit -m "feat: cache IGDB responses in Redis (popular 6h, genre 2h, search 15m, detail 24h)"
```

---

### Task 7: Frontend — add refreshAll service function and "Odśwież wszystkie" button

**Files:**
- Modify: `frontend/src/services/multiplayerService.ts`
- Modify: `frontend/src/pages/MultiplayerPage.tsx`

- [ ] **Step 1: Add refreshAll and the response type to multiplayerService.ts**

Replace the contents of `frontend/src/services/multiplayerService.ts`:

```typescript
import api from './api';

export interface MultiplayerEntryDto {
  id: number;
  gameTitle: string;
  mode?: string;
  tier?: string;
  rank?: string;
  rankPoints?: number;
  rankPointsMax?: number;
  winRate?: number;
  kdRatio?: number;
  hoursPlayed?: number;
  platform?: string;
  inGameUsername?: string;
  syncIdentifier?: string;
  updatedAt: string;
}

export interface UpsertMultiplayerEntryDto {
  gameTitle: string;
  mode?: string;
  tier?: string;
  rank?: string;
  rankPoints?: number;
  rankPointsMax?: number;
  winRate?: number;
  kdRatio?: number;
  hoursPlayed?: number;
  platform?: string;
  inGameUsername?: string;
  syncIdentifier?: string;
}

export interface RefreshAllResult {
  entries: MultiplayerEntryDto[];
  errors: string[];
}

export const getMultiplayerEntries = () =>
  api.get<MultiplayerEntryDto[]>('/api/multiplayer').then(r => r.data);

export const createMultiplayerEntry = (dto: UpsertMultiplayerEntryDto) =>
  api.post<MultiplayerEntryDto>('/api/multiplayer', dto).then(r => r.data);

export const updateMultiplayerEntry = (id: number, dto: UpsertMultiplayerEntryDto) =>
  api.put<MultiplayerEntryDto>(`/api/multiplayer/${id}`, dto).then(r => r.data);

export const deleteMultiplayerEntry = (id: number) =>
  api.delete(`/api/multiplayer/${id}`);

export const syncLolRank = (summonerName: string, platform = 'eun1') =>
  api.post<UpsertMultiplayerEntryDto>('/api/multiplayer/sync/lol', { summonerName, platform }).then(r => r.data);

export const syncCs2Stats = (steamId: string) =>
  api.post<UpsertMultiplayerEntryDto>('/api/multiplayer/sync/cs2', { steamId }).then(r => r.data);

export const refreshAllMultiplayer = () =>
  api.post<RefreshAllResult>('/api/multiplayer/refresh-all').then(r => r.data);
```

- [ ] **Step 2: Add refreshing state and handler to MultiplayerPage**

In `frontend/src/pages/MultiplayerPage.tsx`:

**2a.** Add the import for `refreshAllMultiplayer` and `RefreshAllResult` to the existing import from `multiplayerService` (the import is on lines 4–12). Update it to:

```typescript
import {
  getMultiplayerEntries,
  createMultiplayerEntry,
  updateMultiplayerEntry,
  deleteMultiplayerEntry,
  syncLolRank,
  syncCs2Stats,
  refreshAllMultiplayer,
  type MultiplayerEntryDto,
  type UpsertMultiplayerEntryDto,
} from '../services/multiplayerService';
```

**2b.** In the main `MultiplayerPage` component function, find where `const [modal, setModal]` state is declared. Add two new state variables directly after it:

```typescript
const [refreshing, setRefreshing] = useState(false);
const [refreshError, setRefreshError] = useState<string | null>(null);
```

**2c.** Add the `handleRefreshAll` handler function, placed just before the `return (` statement of the main component:

```typescript
const handleRefreshAll = async () => {
  setRefreshing(true);
  setRefreshError(null);
  try {
    const result = await refreshAllMultiplayer();
    setEntries(result.entries);
    if (result.errors.length > 0) {
      setRefreshError(`Częściowe odświeżenie. Błędy: ${result.errors.join('; ')}`);
    }
  } catch (err: any) {
    const msg = err?.response?.data?.message ?? 'Nie udało się odświeżyć danych.';
    setRefreshError(msg);
  } finally {
    setRefreshing(false);
  }
};
```

**2d.** In the list view header (around line 437 where the `+ Dodaj grę` button is), add the "Odśwież wszystkie" button and error message. Replace the existing header `<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>` block with:

```tsx
<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
  <div>
    <h1 style={{ fontFamily: 'Syne, sans-serif', fontSize: 26, fontWeight: 700, color: t.text, margin: 0 }}>Multiplayer</h1>
    <div style={{ fontSize: 13, color: t.textMuted, marginTop: 4 }}>{entries.length} {entries.length === 1 ? 'gra' : 'gier'} w trackingu</div>
  </div>
  <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
    <button
      onClick={handleRefreshAll}
      disabled={refreshing}
      style={{ padding: '9px 18px', background: t.bgElevated, border: `1px solid ${t.border}`, borderRadius: 9, color: t.textMuted, cursor: refreshing ? 'not-allowed' : 'pointer', fontSize: 13, fontWeight: 600, fontFamily: 'Inter, sans-serif', opacity: refreshing ? 0.6 : 1 }}
    >
      {refreshing ? '↻ Odświeżanie…' : '↻ Odśwież wszystkie'}
    </button>
    <button
      onClick={() => setModal('add')}
      style={{ padding: '9px 18px', background: t.accent, border: 'none', borderRadius: 9, color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600, fontFamily: 'Inter, sans-serif', boxShadow: `0 0 20px ${t.accentGlow}` }}
    >
      + Dodaj grę
    </button>
  </div>
</div>
{refreshError && (
  <div style={{ marginBottom: 16, padding: '10px 14px', background: '#ff6b6b18', border: '1px solid #ff6b6b40', borderRadius: 8, fontSize: 13, color: '#ff6b6b' }}>
    {refreshError}
  </div>
)}
```

- [ ] **Step 3: Build the frontend to verify no TypeScript errors**

```bash
cd frontend
npm run build
```

Expected: `built in Xs` with no errors.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/services/multiplayerService.ts frontend/src/pages/MultiplayerPage.tsx
git commit -m "feat: add 'Odśwież wszystkie' button to Multiplayer page"
```

---

## Self-Review

**Spec coverage check:**

| Spec requirement | Task |
|---|---|
| `ICacheService` with `GetOrSetAsync`, `SetAsync`, `RemoveAsync` | Task 2 |
| `ExistsAsync` (for cooldown check) | Task 2 |
| Redis in docker-compose with `redis:7-alpine` | Task 1 |
| `ConnectionStrings__Redis` env var | Task 1 |
| `AddStackExchangeRedisCache` + `AddSingleton<ICacheService>` in Program.cs | Task 3 |
| IGDB popular cached 6h | Task 6 |
| IGDB genre cached 2h | Task 6 |
| IGDB search cached 15m | Task 6 |
| IGDB game detail cached 24h | Task 6 |
| `multiplayer:refresh-cooldown:{userId}` TTL 5min | Task 5 |
| `POST /api/multiplayer/refresh-all` endpoint | Task 5 |
| Partial results with error list | Task 5 |
| "Odśwież wszystkie" button in frontend | Task 7 |
| `SyncIdentifier` stored to enable re-sync | Task 4 + Task 5 |
| Graceful Redis degradation | Task 2 (tests + implementation) |

All spec requirements are covered. ✓
