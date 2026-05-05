# Redis Caching — GameLog App

**Date:** 2026-05-05  
**Status:** Approved

## Goal

Avoid unnecessary calls to external APIs (IGDB, Riot Games, Steam) on every page load. IGDB data is cached with TTLs; multiplayer rank data is cached indefinitely and refreshed only on explicit user request.

## Approach

Generic `ICacheService` wrapper over `IDistributedCache` (backed by Redis). All cache logic is centralized in one service; consumers call `GetOrSetAsync<T>` without knowing about serialization or Redis internals. Redis unavailability degrades gracefully — the app falls back to the upstream API call without crashing.

## Components

### New files

| File | Purpose |
|------|---------|
| `backend/Services/ICacheService.cs` | Interface: `GetOrSetAsync<T>`, `SetAsync<T>`, `RemoveAsync` |
| `backend/Services/CacheService.cs` | Implementation using `IDistributedCache` + `System.Text.Json` |

### Modified files

| File | Change |
|------|--------|
| `backend/Services/IgdbService.cs` | Wrap all IGDB calls with `ICacheService` |
| `backend/Services/RiotService.cs` | Write result to cache after successful fetch |
| `backend/Services/SteamService.cs` | Write result to cache after successful fetch |
| `backend/Controllers/MultiplayerController.cs` | Add `POST /api/multiplayer/refresh-all` endpoint with cooldown check |
| `backend/Program.cs` | Register Redis + `ICacheService` |
| `docker-compose.yml` | Add `redis:7-alpine` service; inject `ConnectionStrings__Redis` |

## Cache Key Schema

```
igdb:popular                      TTL: 6 hours
igdb:genre:{genreName}            TTL: 2 hours
igdb:search:{query}               TTL: 15 minutes
igdb:game:{igdbId}                TTL: 24 hours
multiplayer:refresh-cooldown:{userId}   TTL: 5 minutes (rate-limit for refresh-all)
```

Multiplayer rank data is persisted in the `MultiplayerEntry` DB table — Redis is not used to store rank values themselves, only to enforce a cooldown between refreshes.

## ICacheService Interface

```csharp
public interface ICacheService
{
    // Get from cache; if missing, call factory, store result, and return it.
    // ttl = null means no expiration.
    Task<T?> GetOrSetAsync<T>(string key, Func<Task<T>> factory, TimeSpan? ttl = null);

    // Unconditionally write a value to cache.
    Task SetAsync<T>(string key, T value, TimeSpan? ttl = null);

    // Remove a key from cache.
    Task RemoveAsync(string key);
}
```

Serialization: `System.Text.Json` with `PropertyNameCaseInsensitive = true`.

## Data Flows

### IGDB (popular, by-genre, search, game detail)

1. Service method calls `cache.GetOrSetAsync("igdb:popular", () => FetchFromApi(), TimeSpan.FromHours(6))`.
2. **Cache hit** → return immediately, no IGDB call.
3. **Cache miss** → fetch from IGDB, store in Redis, return result.

### Multiplayer page load (`GET /api/multiplayer`)

Reads directly from DB. No Redis, no external API calls. Rank data is persisted after each refresh, so DB is the source of truth.

### Refresh all (`POST /api/multiplayer/refresh-all`)

1. Check `multiplayer:refresh-cooldown:{userId}` in cache — if present, return `429 Too Many Requests` with seconds remaining.
2. Load all `MultiplayerEntry` records for the current user from DB.
3. For each entry that has `InGameUsername` set, determine the game from `GameTitle` and call the appropriate service (`RiotService` or `SteamService`) to fetch fresh data.
4. Update the DB record with the fresh values.
5. Set `multiplayer:refresh-cooldown:{userId}` with TTL of 5 minutes to prevent API spam.
6. Return the updated list of entries.

If any individual service call fails (e.g. Riot API error), that entry is skipped and the error is collected; the endpoint returns partial results with a list of errors per entry.

## Error Handling

| Scenario | Behaviour |
|----------|-----------|
| Redis unreachable | `CacheService` catches the exception, logs a warning, calls `factory()` directly — app continues working |
| IGDB/Riot/Steam error during factory | Exception propagates normally; nothing is written to cache |
| Riot/Steam error during refresh-all | That entry is skipped; other entries still refresh; errors returned in response |
| Private Steam profile | Already handled in `SteamService` (throws descriptive exception) |

## Infrastructure

### docker-compose.yml additions

```yaml
redis:
  image: redis:7-alpine
  restart: unless-stopped
  ports:
    - "6379:6379"

backend:
  environment:
    - ConnectionStrings__Redis=redis:6379
  depends_on:
    - redis
```

### Program.cs additions

```csharp
builder.Services.AddStackExchangeRedisCache(options =>
    options.Configuration = builder.Configuration.GetConnectionString("Redis"));

builder.Services.AddSingleton<ICacheService, CacheService>();
```

NuGet package required: `Microsoft.Extensions.Caching.StackExchangeRedis`

## Frontend Changes

- Add a **"Odśwież wszystkie"** button to the Multiplayer page header.
- On click: call `POST /api/multiplayer/refresh-all`, show loading spinner, refresh the entry list on success.
- Display a toast/error message if any entries failed to refresh.
- No other UI changes required.

## Out of Scope

- Per-entry refresh (one game at a time) — not requested.
- Cache warming on startup — not needed.
- Cache metrics / monitoring dashboard — not needed.
- Auth/user session caching — not needed.
