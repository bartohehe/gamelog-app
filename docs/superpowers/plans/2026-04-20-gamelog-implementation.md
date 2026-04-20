# GameLog Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Przebudować aplikację task-manager na tracker gier wideo z auth JWT, integracją RAWG API, biblioteką statusów, oceną 0-100 i dashboardem statystyk.

**Architecture:** Backend .NET 9 jako proxy do RAWG (klucz API nigdy nie trafia do przeglądarki), cache gier w lokalnej tabeli `Games`, pełny CRUD biblioteki użytkownika w `UserGames`. Frontend React 19 + Tailwind z ciemnym motywem gaming.

**Tech Stack:** .NET 9, EF Core 9, Azure SQL, BCrypt.Net-Next, JWT Bearer, React 19, TypeScript, Tailwind v3, Vite, axios, react-router-dom, lucide-react

---

## Mapa plików

### Backend — do usunięcia
- `backend/Models/CloudTask.cs`
- `backend/Controllers/TaskController.cs`
- `backend/DTOs/CreateTaskDto.cs`
- `backend/DTOs/ReadTaskDto.cs`
- `backend/Migrations/20260322093132_InitialCreate.cs`
- `backend/Migrations/20260322093132_InitialCreate.Designer.cs`
- `backend/Migrations/AppDbContextModelSnapshot.cs`
- `backend/TaskManager.Tests/UnitTest1.cs`

### Backend — do stworzenia
- `backend/Models/GameStatus.cs`
- `backend/Models/User.cs`
- `backend/Models/Game.cs`
- `backend/Models/UserGame.cs`
- `backend/Data/AppDbContext.cs` (rewrite)
- `backend/DTOs/Auth/RegisterDto.cs`
- `backend/DTOs/Auth/LoginDto.cs`
- `backend/DTOs/Auth/AuthResponseDto.cs`
- `backend/DTOs/Games/GameDto.cs`
- `backend/DTOs/Library/AddToLibraryDto.cs`
- `backend/DTOs/Library/UpdateLibraryItemDto.cs`
- `backend/DTOs/Library/UserGameDto.cs`
- `backend/DTOs/Stats/UserStatsDto.cs`
- `backend/DTOs/Stats/TopGameDto.cs`
- `backend/Services/IAuthService.cs`
- `backend/Services/AuthService.cs`
- `backend/Services/IRawgService.cs`
- `backend/Services/RawgService.cs`
- `backend/Controllers/AuthController.cs`
- `backend/Controllers/GamesController.cs`
- `backend/Controllers/LibraryController.cs`
- `backend/Controllers/StatsController.cs`
- `backend/Program.cs` (rewrite)
- `backend/appsettings.json` (update)
- `backend/TaskManager.Tests/AuthServiceTests.cs`

### Frontend — do stworzenia/zmiany
- `frontend/tailwind.config.js` (nowy)
- `frontend/postcss.config.js` (nowy)
- `frontend/src/index.css` (rewrite)
- `frontend/src/types/index.ts` (nowy)
- `frontend/src/contexts/AuthContext.tsx` (nowy)
- `frontend/src/services/api.ts` (rewrite)
- `frontend/src/services/gamesService.ts` (nowy)
- `frontend/src/services/libraryService.ts` (nowy)
- `frontend/src/services/statsService.ts` (nowy)
- `frontend/src/components/ProtectedRoute.tsx` (nowy)
- `frontend/src/components/Navbar.tsx` (nowy)
- `frontend/src/components/StatusBadge.tsx` (nowy)
- `frontend/src/components/ScoreSlider.tsx` (nowy)
- `frontend/src/components/KpiCard.tsx` (nowy)
- `frontend/src/components/GameCard.tsx` (nowy)
- `frontend/src/components/AddToLibraryModal.tsx` (nowy)
- `frontend/src/pages/LoginPage.tsx` (nowy)
- `frontend/src/pages/RegisterPage.tsx` (nowy)
- `frontend/src/pages/HomePage.tsx` (nowy)
- `frontend/src/pages/SearchPage.tsx` (nowy)
- `frontend/src/pages/LibraryPage.tsx` (nowy)
- `frontend/src/pages/GameDetailPage.tsx` (nowy)
- `frontend/src/App.tsx` (rewrite)
- `frontend/src/pages/Dashboard.tsx` (usuń)

---

## Task 1: Usunięcie starego kodu i dodanie paczek NuGet

**Files:**
- Modify: `backend/CloudBackend.csproj`
- Delete: stare modele, kontrolery, DTOs, migracje

- [ ] **Krok 1: Usuń stare pliki**

```bash
cd backend
rm Models/CloudTask.cs
rm Controllers/TaskController.cs
rm DTOs/CreateTaskDto.cs
rm DTOs/ReadTaskDto.cs
rm Migrations/20260322093132_InitialCreate.cs
rm Migrations/20260322093132_InitialCreate.Designer.cs
rm Migrations/AppDbContextModelSnapshot.cs
rm TaskManager.Tests/UnitTest1.cs
```

- [ ] **Krok 2: Dodaj pakiety NuGet**

```bash
cd backend
dotnet add package BCrypt.Net-Next --version 4.0.3
dotnet add package Microsoft.AspNetCore.Authentication.JwtBearer --version 9.0.0
dotnet add package System.IdentityModel.Tokens.Jwt --version 8.3.3
dotnet add package Microsoft.EntityFrameworkCore.InMemory --version 9.0.0
```

- [ ] **Krok 3: Dodaj pakiety do projektu testowego**

```bash
cd backend/TaskManager.Tests
dotnet add reference ../CloudBackend.csproj
dotnet add package Microsoft.EntityFrameworkCore.InMemory --version 9.0.0
dotnet add package BCrypt.Net-Next --version 4.0.3
dotnet add package Microsoft.AspNetCore.Authentication.JwtBearer --version 9.0.0
dotnet add package System.IdentityModel.Tokens.Jwt --version 8.3.3
dotnet add package Microsoft.Extensions.Configuration --version 9.0.0
dotnet add package Microsoft.Extensions.Configuration.Memory --version 9.0.0
```

- [ ] **Krok 4: Sprawdź czy projekt się kompiluje (spodziewaj się błędów — AppDbContext odwołuje się do CloudTask)**

```bash
cd backend
dotnet build
```

Spodziewany wynik: błędy kompilacji bo `AppDbContext` i `Program.cs` nadal odwołują się do `CloudTask`. To normalne — naprawimy w kolejnych taskach.

- [ ] **Krok 5: Commit**

```bash
git add -A
git commit -m "chore: remove task-manager code, add NuGet packages for gamelog"
```

---

## Task 2: Modele domenowe

**Files:**
- Create: `backend/Models/GameStatus.cs`
- Create: `backend/Models/User.cs`
- Create: `backend/Models/Game.cs`
- Create: `backend/Models/UserGame.cs`

- [ ] **Krok 1: Stwórz enum statusów**

`backend/Models/GameStatus.cs`:
```csharp
namespace CloudBackend.Models;

public enum GameStatus
{
    Planned,
    InProgress,
    Completed,
    Abandoned
}
```

- [ ] **Krok 2: Stwórz model User**

`backend/Models/User.cs`:
```csharp
namespace CloudBackend.Models;

public class User
{
    public int Id { get; set; }
    public string Username { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public ICollection<UserGame> UserGames { get; set; } = new List<UserGame>();
}
```

- [ ] **Krok 3: Stwórz model Game**

`backend/Models/Game.cs`:
```csharp
namespace CloudBackend.Models;

public class Game
{
    public int Id { get; set; }
    public int RawgId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string CoverImageUrl { get; set; } = string.Empty;
    public int? ReleaseYear { get; set; }
    public string Genres { get; set; } = "[]";
    public ICollection<UserGame> UserGames { get; set; } = new List<UserGame>();
}
```

- [ ] **Krok 4: Stwórz model UserGame**

`backend/Models/UserGame.cs`:
```csharp
namespace CloudBackend.Models;

public class UserGame
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public User User { get; set; } = null!;
    public int GameId { get; set; }
    public Game Game { get; set; } = null!;
    public GameStatus Status { get; set; }
    public string Platform { get; set; } = string.Empty;
    public int? Score { get; set; }
    public string? Review { get; set; }
    public DateTime AddedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}
```

- [ ] **Krok 5: Commit**

```bash
git add backend/Models/
git commit -m "feat: add User, Game, UserGame models and GameStatus enum"
```

---

## Task 3: AppDbContext i DTOs

**Files:**
- Modify: `backend/Data/AppDbContext.cs`
- Create: wszystkie DTOs

- [ ] **Krok 1: Przepisz AppDbContext**

`backend/Data/AppDbContext.cs`:
```csharp
using Microsoft.EntityFrameworkCore;
using CloudBackend.Models;

namespace CloudBackend.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<User> Users { get; set; }
    public DbSet<Game> Games { get; set; }
    public DbSet<UserGame> UserGames { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<User>()
            .HasIndex(u => u.Email).IsUnique();
        modelBuilder.Entity<User>()
            .HasIndex(u => u.Username).IsUnique();

        modelBuilder.Entity<Game>()
            .HasIndex(g => g.RawgId).IsUnique();

        modelBuilder.Entity<UserGame>()
            .HasOne(ug => ug.User)
            .WithMany(u => u.UserGames)
            .HasForeignKey(ug => ug.UserId);

        modelBuilder.Entity<UserGame>()
            .HasOne(ug => ug.Game)
            .WithMany(g => g.UserGames)
            .HasForeignKey(ug => ug.GameId);

        modelBuilder.Entity<UserGame>()
            .HasIndex(ug => new { ug.UserId, ug.GameId }).IsUnique();
    }
}
```

- [ ] **Krok 2: Utwórz DTOs Auth**

`backend/DTOs/Auth/RegisterDto.cs`:
```csharp
namespace CloudBackend.DTOs.Auth;

public class RegisterDto
{
    public string Username { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
}
```

`backend/DTOs/Auth/LoginDto.cs`:
```csharp
namespace CloudBackend.DTOs.Auth;

public class LoginDto
{
    public string Email { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
}
```

`backend/DTOs/Auth/AuthResponseDto.cs`:
```csharp
namespace CloudBackend.DTOs.Auth;

public class AuthResponseDto
{
    public string Token { get; set; } = string.Empty;
    public string Username { get; set; } = string.Empty;
    public int UserId { get; set; }
}
```

- [ ] **Krok 3: Utwórz GameDto**

`backend/DTOs/Games/GameDto.cs`:
```csharp
namespace CloudBackend.DTOs.Games;

public class GameDto
{
    public int RawgId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string CoverImageUrl { get; set; } = string.Empty;
    public int? ReleaseYear { get; set; }
    public List<string> Genres { get; set; } = new();
}
```

- [ ] **Krok 4: Utwórz DTOs Library**

`backend/DTOs/Library/AddToLibraryDto.cs`:
```csharp
using CloudBackend.Models;

namespace CloudBackend.DTOs.Library;

public class AddToLibraryDto
{
    public int RawgId { get; set; }
    public GameStatus Status { get; set; }
    public string Platform { get; set; } = string.Empty;
}
```

`backend/DTOs/Library/UpdateLibraryItemDto.cs`:
```csharp
using CloudBackend.Models;

namespace CloudBackend.DTOs.Library;

public class UpdateLibraryItemDto
{
    public GameStatus Status { get; set; }
    public string Platform { get; set; } = string.Empty;
    public int? Score { get; set; }
    public string? Review { get; set; }
}
```

`backend/DTOs/Library/UserGameDto.cs`:
```csharp
using CloudBackend.Models;

namespace CloudBackend.DTOs.Library;

public class UserGameDto
{
    public int Id { get; set; }
    public int RawgId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string CoverImageUrl { get; set; } = string.Empty;
    public GameStatus Status { get; set; }
    public string Platform { get; set; } = string.Empty;
    public int? Score { get; set; }
    public string? Review { get; set; }
    public DateTime AddedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}
```

- [ ] **Krok 5: Utwórz DTOs Stats**

`backend/DTOs/Stats/UserStatsDto.cs`:
```csharp
namespace CloudBackend.DTOs.Stats;

public class UserStatsDto
{
    public int TotalGames { get; set; }
    public int PlannedCount { get; set; }
    public int InProgressCount { get; set; }
    public int CompletedCount { get; set; }
    public int AbandonedCount { get; set; }
    public double? AverageScore { get; set; }
}
```

`backend/DTOs/Stats/TopGameDto.cs`:
```csharp
namespace CloudBackend.DTOs.Stats;

public class TopGameDto
{
    public int RawgId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string CoverImageUrl { get; set; } = string.Empty;
    public double AverageScore { get; set; }
    public int ReviewCount { get; set; }
}
```

- [ ] **Krok 6: Sprawdź kompilację**

```bash
cd backend
dotnet build
```

Spodziewany wynik: błędy tylko w `Program.cs` (odwołania do CloudTask). DTOs i modele powinny się kompilować.

- [ ] **Krok 7: Commit**

```bash
git add backend/Data/ backend/DTOs/
git commit -m "feat: add AppDbContext with relationships and all DTOs"
```

---

## Task 4: AuthService + test + AuthController

**Files:**
- Create: `backend/Services/IAuthService.cs`
- Create: `backend/Services/AuthService.cs`
- Create: `backend/Controllers/AuthController.cs`
- Modify: `backend/TaskManager.Tests/AuthServiceTests.cs`

- [ ] **Krok 1: Napisz failing test**

`backend/TaskManager.Tests/AuthServiceTests.cs`:
```csharp
using CloudBackend.Data;
using CloudBackend.DTOs.Auth;
using CloudBackend.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;

namespace TaskManager.Tests;

public class AuthServiceTests
{
    private static AppDbContext CreateDb()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        return new AppDbContext(options);
    }

    private static IAuthService CreateService(AppDbContext db)
    {
        var config = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["JwtSettings:Secret"] = "test-secret-key-minimum-32-characters!!"
            })
            .Build();
        return new AuthService(db, config);
    }

    [Fact]
    public async Task Register_WithNewEmail_ReturnsToken()
    {
        var db = CreateDb();
        var svc = CreateService(db);

        var result = await svc.RegisterAsync(new RegisterDto
        {
            Username = "testuser",
            Email = "test@example.com",
            Password = "password123"
        });

        Assert.NotNull(result);
        Assert.False(string.IsNullOrEmpty(result.Token));
        Assert.Equal("testuser", result.Username);
    }

    [Fact]
    public async Task Register_WithDuplicateEmail_ReturnsNull()
    {
        var db = CreateDb();
        var svc = CreateService(db);

        await svc.RegisterAsync(new RegisterDto
        {
            Username = "user1",
            Email = "dup@example.com",
            Password = "pass"
        });

        var result = await svc.RegisterAsync(new RegisterDto
        {
            Username = "user2",
            Email = "dup@example.com",
            Password = "pass"
        });

        Assert.Null(result);
    }

    [Fact]
    public async Task Login_WithValidCredentials_ReturnsToken()
    {
        var db = CreateDb();
        var svc = CreateService(db);

        await svc.RegisterAsync(new RegisterDto
        {
            Username = "loginuser",
            Email = "login@example.com",
            Password = "mypassword"
        });

        var result = await svc.LoginAsync(new LoginDto
        {
            Email = "login@example.com",
            Password = "mypassword"
        });

        Assert.NotNull(result);
        Assert.False(string.IsNullOrEmpty(result.Token));
    }

    [Fact]
    public async Task Login_WithWrongPassword_ReturnsNull()
    {
        var db = CreateDb();
        var svc = CreateService(db);

        await svc.RegisterAsync(new RegisterDto
        {
            Username = "loginuser2",
            Email = "login2@example.com",
            Password = "correctpassword"
        });

        var result = await svc.LoginAsync(new LoginDto
        {
            Email = "login2@example.com",
            Password = "wrongpassword"
        });

        Assert.Null(result);
    }
}
```

- [ ] **Krok 2: Uruchom test — spodziewaj się błędu kompilacji**

```bash
cd backend
dotnet test TaskManager.Tests/
```

Spodziewany wynik: błąd — `AuthService` nie istnieje.

- [ ] **Krok 3: Stwórz interfejs**

`backend/Services/IAuthService.cs`:
```csharp
using CloudBackend.DTOs.Auth;
using CloudBackend.Models;

namespace CloudBackend.Services;

public interface IAuthService
{
    Task<AuthResponseDto?> RegisterAsync(RegisterDto dto);
    Task<AuthResponseDto?> LoginAsync(LoginDto dto);
    string GenerateToken(User user);
}
```

- [ ] **Krok 4: Zaimplementuj AuthService**

`backend/Services/AuthService.cs`:
```csharp
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using CloudBackend.Data;
using CloudBackend.DTOs.Auth;
using CloudBackend.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;

namespace CloudBackend.Services;

public class AuthService : IAuthService
{
    private readonly AppDbContext _context;
    private readonly IConfiguration _config;

    public AuthService(AppDbContext context, IConfiguration config)
    {
        _context = context;
        _config = config;
    }

    public async Task<AuthResponseDto?> RegisterAsync(RegisterDto dto)
    {
        if (await _context.Users.AnyAsync(u => u.Email == dto.Email))
            return null;

        var user = new User
        {
            Username = dto.Username,
            Email = dto.Email,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password),
            CreatedAt = DateTime.UtcNow
        };

        _context.Users.Add(user);
        await _context.SaveChangesAsync();

        return new AuthResponseDto
        {
            Token = GenerateToken(user),
            Username = user.Username,
            UserId = user.Id
        };
    }

    public async Task<AuthResponseDto?> LoginAsync(LoginDto dto)
    {
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == dto.Email);
        if (user == null || !BCrypt.Net.BCrypt.Verify(dto.Password, user.PasswordHash))
            return null;

        return new AuthResponseDto
        {
            Token = GenerateToken(user),
            Username = user.Username,
            UserId = user.Id
        };
    }

    public string GenerateToken(User user)
    {
        var key = new SymmetricSecurityKey(
            Encoding.UTF8.GetBytes(_config["JwtSettings:Secret"]!));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var claims = new[]
        {
            new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new Claim(ClaimTypes.Name, user.Username),
            new Claim(ClaimTypes.Email, user.Email)
        };

        var token = new JwtSecurityToken(
            claims: claims,
            expires: DateTime.UtcNow.AddDays(7),
            signingCredentials: creds);

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}
```

- [ ] **Krok 5: Uruchom testy — spodziewaj się PASS**

```bash
cd backend
dotnet test TaskManager.Tests/ -v normal
```

Spodziewany wynik: 4 testy PASS.

- [ ] **Krok 6: Stwórz AuthController**

`backend/Controllers/AuthController.cs`:
```csharp
using CloudBackend.DTOs.Auth;
using CloudBackend.Services;
using Microsoft.AspNetCore.Mvc;

namespace CloudBackend.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _auth;

    public AuthController(IAuthService auth)
    {
        _auth = auth;
    }

    [HttpPost("register")]
    public async Task<ActionResult<AuthResponseDto>> Register(RegisterDto dto)
    {
        var result = await _auth.RegisterAsync(dto);
        if (result == null)
            return Conflict(new { message = "Email already in use." });
        return Ok(result);
    }

    [HttpPost("login")]
    public async Task<ActionResult<AuthResponseDto>> Login(LoginDto dto)
    {
        var result = await _auth.LoginAsync(dto);
        if (result == null)
            return Unauthorized(new { message = "Invalid credentials." });
        return Ok(result);
    }
}
```

- [ ] **Krok 7: Commit**

```bash
git add backend/Services/ backend/Controllers/AuthController.cs backend/TaskManager.Tests/
git commit -m "feat: add AuthService with JWT and AuthController, 4 tests passing"
```

---

## Task 5: RawgService + GamesController

**Files:**
- Create: `backend/Services/IRawgService.cs`
- Create: `backend/Services/RawgService.cs`
- Create: `backend/Controllers/GamesController.cs`

- [ ] **Krok 1: Stwórz interfejs**

`backend/Services/IRawgService.cs`:
```csharp
using CloudBackend.DTOs.Games;
using CloudBackend.Models;

namespace CloudBackend.Services;

public interface IRawgService
{
    Task<List<GameDto>> SearchGamesAsync(string query);
    Task<GameDto?> GetGameDetailsAsync(int rawgId);
    Task<List<GameDto>> GetPopularGamesAsync();
    Task<Game> GetOrCreateCachedGameAsync(int rawgId);
}
```

- [ ] **Krok 2: Stwórz RawgService**

`backend/Services/RawgService.cs`:
```csharp
using System.Text.Json;
using System.Text.Json.Serialization;
using CloudBackend.Data;
using CloudBackend.DTOs.Games;
using CloudBackend.Models;
using Microsoft.EntityFrameworkCore;

namespace CloudBackend.Services;

public class RawgService : IRawgService
{
    private readonly HttpClient _http;
    private readonly string _apiKey;
    private readonly AppDbContext _context;

    public RawgService(HttpClient http, IConfiguration config, AppDbContext context)
    {
        _http = http;
        _apiKey = config["ExternalApis:Rawg:ApiKey"] ?? "";
        _context = context;
    }

    public async Task<List<GameDto>> SearchGamesAsync(string query)
    {
        var url = $"https://api.rawg.io/api/games?key={_apiKey}&search={Uri.EscapeDataString(query)}&page_size=12";
        return await FetchGamesFromUrl(url);
    }

    public async Task<GameDto?> GetGameDetailsAsync(int rawgId)
    {
        var cached = await _context.Games.FirstOrDefaultAsync(g => g.RawgId == rawgId);
        if (cached != null)
            return MapCachedGame(cached);

        var url = $"https://api.rawg.io/api/games/{rawgId}?key={_apiKey}";
        var response = await _http.GetStringAsync(url);
        var rawg = JsonSerializer.Deserialize<RawgGameDetail>(response, JsonOptions);
        if (rawg == null) return null;

        return new GameDto
        {
            RawgId = rawg.Id,
            Title = rawg.Name,
            CoverImageUrl = rawg.BackgroundImage ?? "",
            ReleaseYear = rawg.Released.HasValue ? rawg.Released.Value.Year : null,
            Genres = rawg.Genres?.Select(g => g.Name).ToList() ?? new()
        };
    }

    public async Task<List<GameDto>> GetPopularGamesAsync()
    {
        var url = $"https://api.rawg.io/api/games?key={_apiKey}&ordering=-rating&page_size=12";
        return await FetchGamesFromUrl(url);
    }

    public async Task<Game> GetOrCreateCachedGameAsync(int rawgId)
    {
        var existing = await _context.Games.FirstOrDefaultAsync(g => g.RawgId == rawgId);
        if (existing != null) return existing;

        var dto = await GetGameDetailsAsync(rawgId);
        if (dto == null) throw new Exception($"Game {rawgId} not found in RAWG.");

        var game = new Game
        {
            RawgId = dto.RawgId,
            Title = dto.Title,
            CoverImageUrl = dto.CoverImageUrl,
            ReleaseYear = dto.ReleaseYear,
            Genres = JsonSerializer.Serialize(dto.Genres)
        };

        _context.Games.Add(game);
        await _context.SaveChangesAsync();
        return game;
    }

    private async Task<List<GameDto>> FetchGamesFromUrl(string url)
    {
        var response = await _http.GetStringAsync(url);
        var result = JsonSerializer.Deserialize<RawgListResponse>(response, JsonOptions);
        return result?.Results?.Select(MapRawgGame).ToList() ?? new();
    }

    private static GameDto MapRawgGame(RawgGame rawg) => new()
    {
        RawgId = rawg.Id,
        Title = rawg.Name,
        CoverImageUrl = rawg.BackgroundImage ?? "",
        ReleaseYear = rawg.Released.HasValue ? rawg.Released.Value.Year : null,
        Genres = rawg.Genres?.Select(g => g.Name).ToList() ?? new()
    };

    private static GameDto MapCachedGame(Game g) => new()
    {
        RawgId = g.RawgId,
        Title = g.Title,
        CoverImageUrl = g.CoverImageUrl,
        ReleaseYear = g.ReleaseYear,
        Genres = JsonSerializer.Deserialize<List<string>>(g.Genres) ?? new()
    };

    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNameCaseInsensitive = true
    };

    // RAWG API response shapes
    private class RawgListResponse
    {
        public List<RawgGame>? Results { get; set; }
    }

    private class RawgGame
    {
        public int Id { get; set; }
        public string Name { get; set; } = "";
        [JsonPropertyName("background_image")]
        public string? BackgroundImage { get; set; }
        public DateOnly? Released { get; set; }
        public List<RawgGenre>? Genres { get; set; }
    }

    private class RawgGameDetail
    {
        public int Id { get; set; }
        public string Name { get; set; } = "";
        [JsonPropertyName("background_image")]
        public string? BackgroundImage { get; set; }
        public DateOnly? Released { get; set; }
        public List<RawgGenre>? Genres { get; set; }
    }

    private class RawgGenre
    {
        public string Name { get; set; } = "";
    }
}
```

- [ ] **Krok 3: Stwórz GamesController**

`backend/Controllers/GamesController.cs`:
```csharp
using CloudBackend.DTOs.Games;
using CloudBackend.Services;
using Microsoft.AspNetCore.Mvc;

namespace CloudBackend.Controllers;

[ApiController]
[Route("api/[controller]")]
public class GamesController : ControllerBase
{
    private readonly IRawgService _rawg;

    public GamesController(IRawgService rawg)
    {
        _rawg = rawg;
    }

    [HttpGet("search")]
    public async Task<ActionResult<List<GameDto>>> Search([FromQuery] string q)
    {
        if (string.IsNullOrWhiteSpace(q))
            return BadRequest(new { message = "Query parameter 'q' is required." });

        var results = await _rawg.SearchGamesAsync(q);
        return Ok(results);
    }

    [HttpGet("popular")]
    public async Task<ActionResult<List<GameDto>>> Popular()
    {
        var results = await _rawg.GetPopularGamesAsync();
        return Ok(results);
    }

    [HttpGet("{rawgId:int}")]
    public async Task<ActionResult<GameDto>> GetById(int rawgId)
    {
        var game = await _rawg.GetGameDetailsAsync(rawgId);
        if (game == null) return NotFound();
        return Ok(game);
    }
}
```

- [ ] **Krok 4: Commit**

```bash
git add backend/Services/IRawgService.cs backend/Services/RawgService.cs backend/Controllers/GamesController.cs
git commit -m "feat: add RawgService with caching and GamesController"
```

---

## Task 6: LibraryController

**Files:**
- Create: `backend/Controllers/LibraryController.cs`

- [ ] **Krok 1: Stwórz LibraryController**

`backend/Controllers/LibraryController.cs`:
```csharp
using System.Security.Claims;
using CloudBackend.Data;
using CloudBackend.DTOs.Library;
using CloudBackend.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace CloudBackend.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class LibraryController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly IRawgService _rawg;

    public LibraryController(AppDbContext context, IRawgService rawg)
    {
        _context = context;
        _rawg = rawg;
    }

    private int GetUserId() =>
        int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);

    [HttpGet]
    public async Task<ActionResult<List<UserGameDto>>> GetLibrary()
    {
        var userId = GetUserId();
        var items = await _context.UserGames
            .Include(ug => ug.Game)
            .Where(ug => ug.UserId == userId)
            .OrderByDescending(ug => ug.UpdatedAt)
            .Select(ug => new UserGameDto
            {
                Id = ug.Id,
                RawgId = ug.Game.RawgId,
                Title = ug.Game.Title,
                CoverImageUrl = ug.Game.CoverImageUrl,
                Status = ug.Status,
                Platform = ug.Platform,
                Score = ug.Score,
                Review = ug.Review,
                AddedAt = ug.AddedAt,
                UpdatedAt = ug.UpdatedAt
            })
            .ToListAsync();

        return Ok(items);
    }

    [HttpPost]
    public async Task<ActionResult<UserGameDto>> AddToLibrary(AddToLibraryDto dto)
    {
        var userId = GetUserId();

        var game = await _rawg.GetOrCreateCachedGameAsync(dto.RawgId);

        var exists = await _context.UserGames
            .AnyAsync(ug => ug.UserId == userId && ug.GameId == game.Id);
        if (exists)
            return Conflict(new { message = "Game already in library." });

        var userGame = new CloudBackend.Models.UserGame
        {
            UserId = userId,
            GameId = game.Id,
            Status = dto.Status,
            Platform = dto.Platform,
            AddedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.UserGames.Add(userGame);
        await _context.SaveChangesAsync();

        return Ok(new UserGameDto
        {
            Id = userGame.Id,
            RawgId = game.RawgId,
            Title = game.Title,
            CoverImageUrl = game.CoverImageUrl,
            Status = userGame.Status,
            Platform = userGame.Platform,
            AddedAt = userGame.AddedAt,
            UpdatedAt = userGame.UpdatedAt
        });
    }

    [HttpPut("{id:int}")]
    public async Task<ActionResult<UserGameDto>> UpdateLibraryItem(int id, UpdateLibraryItemDto dto)
    {
        var userId = GetUserId();
        var item = await _context.UserGames
            .Include(ug => ug.Game)
            .FirstOrDefaultAsync(ug => ug.Id == id && ug.UserId == userId);

        if (item == null) return NotFound();

        item.Status = dto.Status;
        item.Platform = dto.Platform;
        item.Score = dto.Score;
        item.Review = dto.Review;
        item.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return Ok(new UserGameDto
        {
            Id = item.Id,
            RawgId = item.Game.RawgId,
            Title = item.Game.Title,
            CoverImageUrl = item.Game.CoverImageUrl,
            Status = item.Status,
            Platform = item.Platform,
            Score = item.Score,
            Review = item.Review,
            AddedAt = item.AddedAt,
            UpdatedAt = item.UpdatedAt
        });
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> RemoveFromLibrary(int id)
    {
        var userId = GetUserId();
        var item = await _context.UserGames
            .FirstOrDefaultAsync(ug => ug.Id == id && ug.UserId == userId);

        if (item == null) return NotFound();

        _context.UserGames.Remove(item);
        await _context.SaveChangesAsync();
        return NoContent();
    }
}
```

- [ ] **Krok 2: Commit**

```bash
git add backend/Controllers/LibraryController.cs
git commit -m "feat: add LibraryController with full CRUD"
```

---

## Task 7: StatsController

**Files:**
- Create: `backend/Controllers/StatsController.cs`

- [ ] **Krok 1: Stwórz StatsController**

`backend/Controllers/StatsController.cs`:
```csharp
using System.Security.Claims;
using CloudBackend.Data;
using CloudBackend.DTOs.Stats;
using CloudBackend.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace CloudBackend.Controllers;

[ApiController]
[Route("api/[controller]")]
public class StatsController : ControllerBase
{
    private readonly AppDbContext _context;

    public StatsController(AppDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    [Authorize]
    public async Task<ActionResult<UserStatsDto>> GetMyStats()
    {
        var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);

        var items = await _context.UserGames
            .Where(ug => ug.UserId == userId)
            .ToListAsync();

        var scored = items.Where(ug => ug.Score.HasValue).ToList();

        return Ok(new UserStatsDto
        {
            TotalGames = items.Count,
            PlannedCount = items.Count(ug => ug.Status == GameStatus.Planned),
            InProgressCount = items.Count(ug => ug.Status == GameStatus.InProgress),
            CompletedCount = items.Count(ug => ug.Status == GameStatus.Completed),
            AbandonedCount = items.Count(ug => ug.Status == GameStatus.Abandoned),
            AverageScore = scored.Any() ? scored.Average(ug => ug.Score!.Value) : null
        });
    }

    [HttpGet("top")]
    public async Task<ActionResult<List<TopGameDto>>> GetTopGames()
    {
        var top = await _context.UserGames
            .Include(ug => ug.Game)
            .Where(ug => ug.Score.HasValue)
            .GroupBy(ug => ug.GameId)
            .Select(g => new TopGameDto
            {
                RawgId = g.First().Game.RawgId,
                Title = g.First().Game.Title,
                CoverImageUrl = g.First().Game.CoverImageUrl,
                AverageScore = g.Average(ug => ug.Score!.Value),
                ReviewCount = g.Count()
            })
            .OrderByDescending(t => t.AverageScore)
            .Take(12)
            .ToListAsync();

        return Ok(top);
    }
}
```

- [ ] **Krok 2: Commit**

```bash
git add backend/Controllers/StatsController.cs
git commit -m "feat: add StatsController with user KPIs and top games"
```

---

## Task 8: Program.cs + appsettings + migracja

**Files:**
- Modify: `backend/Program.cs`
- Modify: `backend/appsettings.json`

- [ ] **Krok 1: Przepisz Program.cs**

`backend/Program.cs`:
```csharp
using System.Text;
using Azure.Identity;
using CloudBackend.Data;
using CloudBackend.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;

var builder = WebApplication.CreateBuilder(args);

if (builder.Environment.IsProduction())
{
    var vaultName = builder.Configuration["KeyVaultName"];
    if (!string.IsNullOrEmpty(vaultName))
    {
        var keyVaultEndpoint = new Uri($"https://{vaultName}.vault.azure.net/");
        builder.Configuration.AddAzureKeyVault(keyVaultEndpoint, new DefaultAzureCredential());
    }
}

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        In = ParameterLocation.Header,
        Description = "Enter: Bearer {token}",
        Name = "Authorization",
        Type = SecuritySchemeType.ApiKey
    });
    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference { Type = ReferenceType.SecurityScheme, Id = "Bearer" }
            },
            Array.Empty<string>()
        }
    });
});

var connectionString = builder.Configuration["DbConnectionString"]
                       ?? builder.Configuration.GetConnectionString("DefaultConnection");

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlServer(connectionString,
        sql => sql.EnableRetryOnFailure(maxRetryCount: 5, maxRetryDelay: TimeSpan.FromSeconds(30), errorNumbersToAdd: null)));

builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddHttpClient<IRawgService, RawgService>();

var jwtSecret = builder.Configuration["JwtSettings:Secret"]
    ?? throw new InvalidOperationException("JwtSettings:Secret not configured.");

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSecret)),
            ValidateIssuer = false,
            ValidateAudience = false
        };
    });

builder.Services.AddAuthorization();

builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
        policy.AllowAnyOrigin().AllowAnyMethod().AllowAnyHeader());
});

var app = builder.Build();

using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    db.Database.Migrate();
}

app.UseSwagger();
app.UseSwaggerUI(c =>
{
    c.SwaggerEndpoint("/swagger/v1/swagger.json", "GameLog API V1");
    c.RoutePrefix = string.Empty;
});

app.UseCors();
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();
app.Run();
```

- [ ] **Krok 2: Zaktualizuj appsettings.json**

`backend/appsettings.json`:
```json
{
  "Logging": {
    "LogLevel": {
      "Default": "Information",
      "Microsoft.AspNetCore": "Warning"
    }
  },
  "AllowedHosts": "*",
  "JwtSettings": {
    "Secret": "dev-secret-key-minimum-32-characters-gamelog!!"
  },
  "ExternalApis": {
    "Rawg": {
      "ApiKey": ""
    }
  },
  "ConnectionStrings": {
    "DefaultConnection": "Server=(localdb)\\mssqllocaldb;Database=GameLog;Trusted_Connection=True;"
  }
}
```

- [ ] **Krok 3: Sprawdź kompilację**

```bash
cd backend
dotnet build
```

Spodziewany wynik: BUILD SUCCEEDED, 0 błędów.

- [ ] **Krok 4: Stwórz migrację**

```bash
cd backend
dotnet ef migrations add InitialGameLog
```

Spodziewany wynik: nowe pliki w `Migrations/` — `*_InitialGameLog.cs` i `AppDbContextModelSnapshot.cs`.

- [ ] **Krok 5: Uruchom wszystkie testy**

```bash
cd backend
dotnet test TaskManager.Tests/ -v normal
```

Spodziewany wynik: 4 testy PASS.

- [ ] **Krok 6: Commit**

```bash
git add -A
git commit -m "feat: finalize backend - Program.cs, appsettings, migration"
```

---

## Task 9: Frontend — pakiety i konfiguracja Tailwind

**Files:**
- Modify: `frontend/package.json`
- Create: `frontend/tailwind.config.js`
- Create: `frontend/postcss.config.js`
- Modify: `frontend/src/index.css`

- [ ] **Krok 1: Zainstaluj pakiety**

```bash
cd frontend
npm install react-router-dom lucide-react
npm install -D tailwindcss postcss autoprefixer
```

- [ ] **Krok 2: Stwórz tailwind.config.js**

`frontend/tailwind.config.js`:
```js
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        'bg-primary': '#0F0E17',
        'bg-card': '#1A1828',
        'accent-purple': '#7C3AED',
        'accent-gold': '#F5A623',
        'text-primary': '#E8E8F0',
        'status-planned': '#3B82F6',
        'status-inprogress': '#7C3AED',
        'status-completed': '#10B981',
        'status-abandoned': '#6B7280',
      }
    }
  },
  plugins: []
}
```

- [ ] **Krok 3: Stwórz postcss.config.js**

`frontend/postcss.config.js`:
```js
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
```

- [ ] **Krok 4: Przepisz index.css**

`frontend/src/index.css`:
```css
@tailwind base;
@tailwind components;
@tailwind utilities;

* {
  box-sizing: border-box;
}

body {
  margin: 0;
  background-color: #0F0E17;
  color: #E8E8F0;
  font-family: system-ui, -apple-system, sans-serif;
}
```

- [ ] **Krok 5: Sprawdź czy frontend się buduje**

```bash
cd frontend
npm run build
```

Spodziewany wynik: BUILD SUCCESS. Może być warning o pustym App.tsx.

- [ ] **Krok 6: Commit**

```bash
git add frontend/
git commit -m "feat: add Tailwind v3 with gaming color palette"
```

---

## Task 10: Typy TypeScript + AuthContext + api.ts

**Files:**
- Create: `frontend/src/types/index.ts`
- Modify: `frontend/src/services/api.ts`
- Create: `frontend/src/contexts/AuthContext.tsx`
- Create: `frontend/src/components/ProtectedRoute.tsx`

- [ ] **Krok 1: Stwórz typy**

`frontend/src/types/index.ts`:
```ts
export type GameStatus = 'Planned' | 'InProgress' | 'Completed' | 'Abandoned';

export interface GameDto {
  rawgId: number;
  title: string;
  coverImageUrl: string;
  releaseYear?: number;
  genres: string[];
}

export interface UserGameDto {
  id: number;
  rawgId: number;
  title: string;
  coverImageUrl: string;
  status: GameStatus;
  platform: string;
  score?: number;
  review?: string;
  addedAt: string;
  updatedAt: string;
}

export interface AddToLibraryDto {
  rawgId: number;
  status: GameStatus;
  platform: string;
}

export interface UpdateLibraryItemDto {
  status: GameStatus;
  platform: string;
  score?: number;
  review?: string;
}

export interface UserStatsDto {
  totalGames: number;
  plannedCount: number;
  inProgressCount: number;
  completedCount: number;
  abandonedCount: number;
  averageScore?: number;
}

export interface TopGameDto {
  rawgId: number;
  title: string;
  coverImageUrl: string;
  averageScore: number;
  reviewCount: number;
}

export interface AuthResponseDto {
  token: string;
  username: string;
  userId: number;
}
```

- [ ] **Krok 2: Przepisz api.ts**

`frontend/src/services/api.ts`:
```ts
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:5000/api',
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
```

- [ ] **Krok 3: Stwórz AuthContext**

`frontend/src/contexts/AuthContext.tsx`:
```tsx
import { createContext, useContext, useState, ReactNode } from 'react';

interface AuthUser {
  id: number;
  username: string;
}

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  login: (token: string, userId: number, username: string) => void;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(
    () => localStorage.getItem('token')
  );
  const [user, setUser] = useState<AuthUser | null>(() => {
    const stored = localStorage.getItem('user');
    return stored ? JSON.parse(stored) : null;
  });

  const login = (token: string, userId: number, username: string) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify({ id: userId, username }));
    setToken(token);
    setUser({ id: userId, username });
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isAuthenticated: !!token }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
```

- [ ] **Krok 4: Stwórz ProtectedRoute**

`frontend/src/components/ProtectedRoute.tsx`:
```tsx
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
}
```

- [ ] **Krok 5: Commit**

```bash
git add frontend/src/types/ frontend/src/services/api.ts frontend/src/contexts/ frontend/src/components/ProtectedRoute.tsx
git commit -m "feat: add TypeScript types, AuthContext, ProtectedRoute"
```

---

## Task 11: App.tsx routing + serwisy

**Files:**
- Modify: `frontend/src/App.tsx`
- Create: `frontend/src/services/gamesService.ts`
- Create: `frontend/src/services/libraryService.ts`
- Create: `frontend/src/services/statsService.ts`

- [ ] **Krok 1: Stwórz serwisy**

`frontend/src/services/gamesService.ts`:
```ts
import api from './api';
import { GameDto } from '../types';

export const searchGames = (q: string) =>
  api.get<GameDto[]>(`/games/search?q=${encodeURIComponent(q)}`);

export const getPopularGames = () =>
  api.get<GameDto[]>('/games/popular');

export const getGameDetails = (rawgId: number) =>
  api.get<GameDto>(`/games/${rawgId}`);
```

`frontend/src/services/libraryService.ts`:
```ts
import api from './api';
import { UserGameDto, AddToLibraryDto, UpdateLibraryItemDto } from '../types';

export const getLibrary = () =>
  api.get<UserGameDto[]>('/library');

export const addToLibrary = (dto: AddToLibraryDto) =>
  api.post<UserGameDto>('/library', dto);

export const updateLibraryItem = (id: number, dto: UpdateLibraryItemDto) =>
  api.put<UserGameDto>(`/library/${id}`, dto);

export const deleteFromLibrary = (id: number) =>
  api.delete(`/library/${id}`);
```

`frontend/src/services/statsService.ts`:
```ts
import api from './api';
import { UserStatsDto, TopGameDto } from '../types';

export const getUserStats = () =>
  api.get<UserStatsDto>('/stats');

export const getTopGames = () =>
  api.get<TopGameDto[]>('/stats/top');
```

- [ ] **Krok 2: Przepisz App.tsx**

`frontend/src/App.tsx`:
```tsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import LibraryPage from './pages/LibraryPage';
import SearchPage from './pages/SearchPage';
import GameDetailPage from './pages/GameDetailPage';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="min-h-screen bg-bg-primary text-text-primary">
          <Navbar />
          <main className="max-w-7xl mx-auto px-4 py-8">
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/library" element={
                <ProtectedRoute><LibraryPage /></ProtectedRoute>
              } />
              <Route path="/search" element={
                <ProtectedRoute><SearchPage /></ProtectedRoute>
              } />
              <Route path="/game/:rawgId" element={
                <ProtectedRoute><GameDetailPage /></ProtectedRoute>
              } />
            </Routes>
          </main>
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}
```

- [ ] **Krok 3: Commit**

```bash
git add frontend/src/services/ frontend/src/App.tsx
git commit -m "feat: add routing and frontend services"
```

---

## Task 12: Komponenty wspólne

**Files:**
- Create: `frontend/src/components/Navbar.tsx`
- Create: `frontend/src/components/StatusBadge.tsx`
- Create: `frontend/src/components/ScoreSlider.tsx`
- Create: `frontend/src/components/KpiCard.tsx`
- Create: `frontend/src/components/GameCard.tsx`

- [ ] **Krok 1: Navbar**

`frontend/src/components/Navbar.tsx`:
```tsx
import { Link, useNavigate } from 'react-router-dom';
import { Gamepad2, Library, Search, LogOut, LogIn, UserPlus } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function Navbar() {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="bg-bg-card border-b border-white/10 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 text-accent-purple font-bold text-xl hover:opacity-80 transition">
          <Gamepad2 size={24} />
          GameLog
        </Link>

        <div className="flex items-center gap-4">
          {isAuthenticated ? (
            <>
              <Link to="/library" className="flex items-center gap-1.5 text-text-primary/70 hover:text-text-primary transition">
                <Library size={18} />
                <span className="hidden sm:inline">Biblioteka</span>
              </Link>
              <Link to="/search" className="flex items-center gap-1.5 text-text-primary/70 hover:text-text-primary transition">
                <Search size={18} />
                <span className="hidden sm:inline">Szukaj</span>
              </Link>
              <span className="text-text-primary/50 text-sm hidden sm:inline">{user?.username}</span>
              <button
                onClick={handleLogout}
                className="flex items-center gap-1.5 text-text-primary/70 hover:text-red-400 transition"
              >
                <LogOut size={18} />
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="flex items-center gap-1.5 text-text-primary/70 hover:text-text-primary transition">
                <LogIn size={18} />
                Zaloguj
              </Link>
              <Link
                to="/register"
                className="bg-accent-purple hover:bg-purple-600 text-white px-4 py-1.5 rounded-lg transition flex items-center gap-1.5"
              >
                <UserPlus size={16} />
                Zarejestruj
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
```

- [ ] **Krok 2: StatusBadge**

`frontend/src/components/StatusBadge.tsx`:
```tsx
import { GameStatus } from '../types';

const config: Record<GameStatus, { label: string; className: string }> = {
  Planned: { label: 'Planowane', className: 'bg-status-planned/20 text-status-planned border-status-planned/30' },
  InProgress: { label: 'W trakcie', className: 'bg-status-inprogress/20 text-status-inprogress border-status-inprogress/30' },
  Completed: { label: 'Ukończone', className: 'bg-status-completed/20 text-status-completed border-status-completed/30' },
  Abandoned: { label: 'Porzucone', className: 'bg-status-abandoned/20 text-status-abandoned border-status-abandoned/30' },
};

export default function StatusBadge({ status }: { status: GameStatus }) {
  const { label, className } = config[status];
  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${className}`}>
      {label}
    </span>
  );
}
```

- [ ] **Krok 3: ScoreSlider**

`frontend/src/components/ScoreSlider.tsx`:
```tsx
interface ScoreSliderProps {
  value: number;
  onChange: (v: number) => void;
}

export default function ScoreSlider({ value, onChange }: ScoreSliderProps) {
  const color = value < 40 ? '#ef4444' : value < 70 ? '#eab308' : '#22c55e';

  return (
    <div className="space-y-1">
      <div className="flex justify-between text-sm text-text-primary/60">
        <span>Ocena</span>
        <span className="font-bold text-accent-gold text-base">{value}/100</span>
      </div>
      <input
        type="range"
        min={0}
        max={100}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-2 rounded-lg appearance-none cursor-pointer"
        style={{
          background: `linear-gradient(to right, #ef4444 0%, #eab308 50%, ${color} ${value}%, #374151 ${value}%)`
        }}
      />
    </div>
  );
}
```

- [ ] **Krok 4: KpiCard**

`frontend/src/components/KpiCard.tsx`:
```tsx
import { ReactNode } from 'react';

interface KpiCardProps {
  label: string;
  value: number | string;
  colorClass: string;
  icon: ReactNode;
}

export default function KpiCard({ label, value, colorClass, icon }: KpiCardProps) {
  return (
    <div className="bg-bg-card rounded-xl p-5 border border-white/5 flex items-center gap-4">
      <div className={`p-3 rounded-lg ${colorClass} bg-opacity-20`}>
        {icon}
      </div>
      <div>
        <p className="text-text-primary/60 text-sm">{label}</p>
        <p className="text-2xl font-bold text-text-primary">{value}</p>
      </div>
    </div>
  );
}
```

- [ ] **Krok 5: GameCard**

`frontend/src/components/GameCard.tsx`:
```tsx
import { Link } from 'react-router-dom';
import { Star } from 'lucide-react';
import StatusBadge from './StatusBadge';
import { UserGameDto, GameDto } from '../types';

type GameCardProps =
  | { type: 'library'; game: UserGameDto }
  | { type: 'search'; game: GameDto; onAdd?: (game: GameDto) => void }
  | { type: 'top'; game: { rawgId: number; title: string; coverImageUrl: string; averageScore: number; reviewCount: number } };

export default function GameCard(props: GameCardProps) {
  const { type, game } = props;

  const rawgId = 'rawgId' in game ? game.rawgId : 0;
  const title = 'title' in game ? game.title : '';
  const cover = 'coverImageUrl' in game ? game.coverImageUrl : '';

  return (
    <div className="bg-bg-card rounded-xl overflow-hidden border border-white/5 hover:border-accent-purple/40 transition group">
      <div className="relative">
        <img
          src={cover || '/placeholder.png'}
          alt={title}
          className="w-full h-40 object-cover group-hover:opacity-90 transition"
          onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder.png'; }}
        />
        {type === 'library' && (
          <div className="absolute top-2 right-2">
            <StatusBadge status={(game as UserGameDto).status} />
          </div>
        )}
      </div>

      <div className="p-3 space-y-2">
        <h3 className="font-semibold text-sm text-text-primary line-clamp-2">{title}</h3>

        {type === 'library' && (
          <div className="flex items-center justify-between">
            <span className="text-xs text-text-primary/50">{(game as UserGameDto).platform}</span>
            {(game as UserGameDto).score != null && (
              <span className="flex items-center gap-1 text-accent-gold text-xs font-bold">
                <Star size={12} fill="currentColor" />
                {(game as UserGameDto).score}/100
              </span>
            )}
          </div>
        )}

        {type === 'top' && (
          <div className="flex items-center justify-between">
            <span className="text-xs text-text-primary/50">{(game as any).reviewCount} ocen</span>
            <span className="flex items-center gap-1 text-accent-gold text-xs font-bold">
              <Star size={12} fill="currentColor" />
              {((game as any).averageScore as number).toFixed(1)}/100
            </span>
          </div>
        )}

        {type === 'search' && (
          <button
            onClick={() => (props as any).onAdd?.(game as GameDto)}
            className="w-full bg-accent-purple hover:bg-purple-600 text-white text-xs py-1.5 rounded-lg transition"
          >
            + Dodaj do biblioteki
          </button>
        )}

        {type === 'library' && (
          <Link
            to={`/game/${rawgId}`}
            className="block w-full text-center bg-white/5 hover:bg-white/10 text-xs py-1.5 rounded-lg transition"
          >
            Szczegóły
          </Link>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Krok 6: Commit**

```bash
git add frontend/src/components/
git commit -m "feat: add Navbar, StatusBadge, ScoreSlider, KpiCard, GameCard components"
```

---

## Task 13: AddToLibraryModal

**Files:**
- Create: `frontend/src/components/AddToLibraryModal.tsx`

- [ ] **Krok 1: Stwórz modal**

`frontend/src/components/AddToLibraryModal.tsx`:
```tsx
import { useState } from 'react';
import { X } from 'lucide-react';
import { GameDto, GameStatus, AddToLibraryDto } from '../types';

const PLATFORMS = ['PC', 'PS5', 'PS4', 'Xbox Series X', 'Xbox One', 'Nintendo Switch', 'Mobile', 'Inne'];

const STATUS_OPTIONS: { value: GameStatus; label: string }[] = [
  { value: 'Planned', label: 'Planowane' },
  { value: 'InProgress', label: 'W trakcie' },
  { value: 'Completed', label: 'Ukończone' },
  { value: 'Abandoned', label: 'Porzucone' },
];

interface Props {
  game: GameDto;
  onClose: () => void;
  onAdd: (dto: AddToLibraryDto) => Promise<void>;
}

export default function AddToLibraryModal({ game, onClose, onAdd }: Props) {
  const [status, setStatus] = useState<GameStatus>('Planned');
  const [platform, setPlatform] = useState('PC');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await onAdd({ rawgId: game.rawgId, status, platform });
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div
        className="bg-bg-card rounded-2xl p-6 w-full max-w-md border border-white/10 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-start mb-4">
          <h2 className="text-lg font-bold text-text-primary">Dodaj do biblioteki</h2>
          <button onClick={onClose} className="text-text-primary/40 hover:text-text-primary transition">
            <X size={20} />
          </button>
        </div>

        <div className="flex gap-3 mb-5">
          <img
            src={game.coverImageUrl || '/placeholder.png'}
            alt={game.title}
            className="w-16 h-20 object-cover rounded-lg"
          />
          <div>
            <p className="font-semibold text-text-primary">{game.title}</p>
            {game.releaseYear && (
              <p className="text-sm text-text-primary/50">{game.releaseYear}</p>
            )}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-text-primary/70 mb-1.5">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as GameStatus)}
              className="w-full bg-bg-primary border border-white/10 text-text-primary rounded-lg px-3 py-2 focus:outline-none focus:border-accent-purple"
            >
              {STATUS_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm text-text-primary/70 mb-1.5">Platforma</label>
            <select
              value={platform}
              onChange={(e) => setPlatform(e.target.value)}
              className="w-full bg-bg-primary border border-white/10 text-text-primary rounded-lg px-3 py-2 focus:outline-none focus:border-accent-purple"
            >
              {PLATFORMS.map(p => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-accent-purple hover:bg-purple-600 disabled:opacity-50 text-white font-semibold py-2.5 rounded-xl transition"
          >
            {loading ? 'Dodawanie...' : 'Dodaj do biblioteki'}
          </button>
        </form>
      </div>
    </div>
  );
}
```

- [ ] **Krok 2: Commit**

```bash
git add frontend/src/components/AddToLibraryModal.tsx
git commit -m "feat: add AddToLibraryModal component"
```

---

## Task 14: Strony Auth (Login + Register)

**Files:**
- Create: `frontend/src/pages/LoginPage.tsx`
- Create: `frontend/src/pages/RegisterPage.tsx`

- [ ] **Krok 1: LoginPage**

`frontend/src/pages/LoginPage.tsx`:
```tsx
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Gamepad2 } from 'lucide-react';
import api from '../services/api';
import { AuthResponseDto } from '../types';
import { useAuth } from '../contexts/AuthContext';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await api.post<AuthResponseDto>('/auth/login', { email, password });
      login(res.data.token, res.data.userId, res.data.username);
      navigate('/');
    } catch {
      setError('Nieprawidłowy email lub hasło.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-sm mx-auto mt-16">
      <div className="text-center mb-8">
        <Gamepad2 size={40} className="text-accent-purple mx-auto mb-3" />
        <h1 className="text-2xl font-bold">Zaloguj się</h1>
        <p className="text-text-primary/50 text-sm mt-1">Wróć do swojej biblioteki</p>
      </div>

      <div className="bg-bg-card rounded-2xl p-6 border border-white/5">
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg px-4 py-2 mb-4 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-text-primary/70 mb-1.5">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full bg-bg-primary border border-white/10 text-text-primary rounded-lg px-3 py-2.5 focus:outline-none focus:border-accent-purple"
              placeholder="ty@email.com"
            />
          </div>

          <div>
            <label className="block text-sm text-text-primary/70 mb-1.5">Hasło</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full bg-bg-primary border border-white/10 text-text-primary rounded-lg px-3 py-2.5 focus:outline-none focus:border-accent-purple"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-accent-purple hover:bg-purple-600 disabled:opacity-50 text-white font-semibold py-2.5 rounded-xl transition"
          >
            {loading ? 'Logowanie...' : 'Zaloguj się'}
          </button>
        </form>

        <p className="text-center text-sm text-text-primary/50 mt-4">
          Nie masz konta?{' '}
          <Link to="/register" className="text-accent-purple hover:underline">Zarejestruj się</Link>
        </p>
      </div>
    </div>
  );
}
```

- [ ] **Krok 2: RegisterPage**

`frontend/src/pages/RegisterPage.tsx`:
```tsx
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Gamepad2 } from 'lucide-react';
import api from '../services/api';
import { AuthResponseDto } from '../types';
import { useAuth } from '../contexts/AuthContext';

export default function RegisterPage() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await api.post<AuthResponseDto>('/auth/register', { username, email, password });
      login(res.data.token, res.data.userId, res.data.username);
      navigate('/');
    } catch {
      setError('Rejestracja nieudana. Email może być już zajęty.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-sm mx-auto mt-16">
      <div className="text-center mb-8">
        <Gamepad2 size={40} className="text-accent-purple mx-auto mb-3" />
        <h1 className="text-2xl font-bold">Utwórz konto</h1>
        <p className="text-text-primary/50 text-sm mt-1">Zacznij śledzić swoje gry</p>
      </div>

      <div className="bg-bg-card rounded-2xl p-6 border border-white/5">
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg px-4 py-2 mb-4 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-text-primary/70 mb-1.5">Nazwa użytkownika</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              className="w-full bg-bg-primary border border-white/10 text-text-primary rounded-lg px-3 py-2.5 focus:outline-none focus:border-accent-purple"
              placeholder="GraczXD"
            />
          </div>

          <div>
            <label className="block text-sm text-text-primary/70 mb-1.5">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full bg-bg-primary border border-white/10 text-text-primary rounded-lg px-3 py-2.5 focus:outline-none focus:border-accent-purple"
              placeholder="ty@email.com"
            />
          </div>

          <div>
            <label className="block text-sm text-text-primary/70 mb-1.5">Hasło</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full bg-bg-primary border border-white/10 text-text-primary rounded-lg px-3 py-2.5 focus:outline-none focus:border-accent-purple"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-accent-purple hover:bg-purple-600 disabled:opacity-50 text-white font-semibold py-2.5 rounded-xl transition"
          >
            {loading ? 'Tworzenie konta...' : 'Zarejestruj się'}
          </button>
        </form>

        <p className="text-center text-sm text-text-primary/50 mt-4">
          Masz już konto?{' '}
          <Link to="/login" className="text-accent-purple hover:underline">Zaloguj się</Link>
        </p>
      </div>
    </div>
  );
}
```

- [ ] **Krok 3: Commit**

```bash
git add frontend/src/pages/LoginPage.tsx frontend/src/pages/RegisterPage.tsx
git commit -m "feat: add Login and Register pages"
```

---

## Task 15: HomePage

**Files:**
- Create: `frontend/src/pages/HomePage.tsx`

- [ ] **Krok 1: Stwórz HomePage**

`frontend/src/pages/HomePage.tsx`:
```tsx
import { useEffect, useState } from 'react';
import { Trophy, Clock, CheckCircle, XCircle, Star, TrendingUp } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import KpiCard from '../components/KpiCard';
import GameCard from '../components/GameCard';
import { getTopGames, getUserStats } from '../services/statsService';
import { getPopularGames } from '../services/gamesService';
import { TopGameDto, GameDto, UserStatsDto } from '../types';

export default function HomePage() {
  const { isAuthenticated } = useAuth();
  const [stats, setStats] = useState<UserStatsDto | null>(null);
  const [topGames, setTopGames] = useState<TopGameDto[]>([]);
  const [popular, setPopular] = useState<GameDto[]>([]);

  useEffect(() => {
    getTopGames().then(r => setTopGames(r.data)).catch(() => {});
    getPopularGames().then(r => setPopular(r.data)).catch(() => {});
    if (isAuthenticated) {
      getUserStats().then(r => setStats(r.data)).catch(() => {});
    }
  }, [isAuthenticated]);

  return (
    <div className="space-y-12">
      {isAuthenticated && stats && (
        <section>
          <h2 className="text-xl font-bold mb-4 text-text-primary">Twoje statystyki</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            <KpiCard
              label="Wszystkie gry"
              value={stats.totalGames}
              colorClass="bg-accent-purple text-accent-purple"
              icon={<Trophy size={20} className="text-accent-purple" />}
            />
            <KpiCard
              label="Planowane"
              value={stats.plannedCount}
              colorClass="bg-status-planned text-status-planned"
              icon={<Clock size={20} className="text-status-planned" />}
            />
            <KpiCard
              label="W trakcie"
              value={stats.inProgressCount}
              colorClass="bg-status-inprogress text-status-inprogress"
              icon={<TrendingUp size={20} className="text-status-inprogress" />}
            />
            <KpiCard
              label="Ukończone"
              value={stats.completedCount}
              colorClass="bg-status-completed text-status-completed"
              icon={<CheckCircle size={20} className="text-status-completed" />}
            />
            <KpiCard
              label="Śr. ocena"
              value={stats.averageScore != null ? `${stats.averageScore.toFixed(1)}/100` : '—'}
              colorClass="bg-accent-gold text-accent-gold"
              icon={<Star size={20} className="text-accent-gold" />}
            />
          </div>
        </section>
      )}

      {topGames.length > 0 && (
        <section>
          <h2 className="text-xl font-bold mb-4 text-text-primary">Top oceniane przez społeczność</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
            {topGames.map(game => (
              <GameCard key={game.rawgId} type="top" game={game} />
            ))}
          </div>
        </section>
      )}

      {popular.length > 0 && (
        <section>
          <h2 className="text-xl font-bold mb-4 text-text-primary">Popularne na RAWG</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
            {popular.map(game => (
              <GameCard key={game.rawgId} type="search" game={game} />
            ))}
          </div>
        </section>
      )}

      {topGames.length === 0 && popular.length === 0 && (
        <div className="text-center py-24 text-text-primary/40">
          <Trophy size={48} className="mx-auto mb-4 opacity-30" />
          <p>Ładowanie gier...</p>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Krok 2: Commit**

```bash
git add frontend/src/pages/HomePage.tsx
git commit -m "feat: add HomePage with KPI cards and top/popular games"
```

---

## Task 16: SearchPage

**Files:**
- Create: `frontend/src/pages/SearchPage.tsx`

- [ ] **Krok 1: Stwórz SearchPage**

`frontend/src/pages/SearchPage.tsx`:
```tsx
import { useState } from 'react';
import { Search } from 'lucide-react';
import { searchGames } from '../services/gamesService';
import { addToLibrary } from '../services/libraryService';
import GameCard from '../components/GameCard';
import AddToLibraryModal from '../components/AddToLibraryModal';
import { GameDto, AddToLibraryDto } from '../types';

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<GameDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedGame, setSelectedGame] = useState<GameDto | null>(null);
  const [addedIds, setAddedIds] = useState<Set<number>>(new Set());
  const [error, setError] = useState('');

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    setError('');
    try {
      const res = await searchGames(query);
      setResults(res.data);
    } catch {
      setError('Błąd podczas wyszukiwania.');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async (dto: AddToLibraryDto) => {
    await addToLibrary(dto);
    setAddedIds(prev => new Set(prev).add(dto.rawgId));
    setSelectedGame(null);
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Wyszukaj grę</h1>

      <form onSubmit={handleSearch} className="flex gap-3">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Nazwa gry..."
          className="flex-1 bg-bg-card border border-white/10 text-text-primary rounded-xl px-4 py-3 focus:outline-none focus:border-accent-purple"
        />
        <button
          type="submit"
          disabled={loading}
          className="bg-accent-purple hover:bg-purple-600 disabled:opacity-50 text-white px-6 py-3 rounded-xl transition flex items-center gap-2"
        >
          <Search size={18} />
          {loading ? 'Szukam...' : 'Szukaj'}
        </button>
      </form>

      {error && (
        <div className="text-red-400 text-sm">{error}</div>
      )}

      {results.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
          {results.map(game => (
            <div key={game.rawgId} className="relative">
              <GameCard
                type="search"
                game={game}
                onAdd={addedIds.has(game.rawgId) ? undefined : setSelectedGame}
              />
              {addedIds.has(game.rawgId) && (
                <div className="absolute inset-0 bg-bg-card/80 rounded-xl flex items-center justify-center">
                  <span className="text-status-completed font-semibold text-sm">✓ Dodano</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {selectedGame && (
        <AddToLibraryModal
          game={selectedGame}
          onClose={() => setSelectedGame(null)}
          onAdd={handleAdd}
        />
      )}
    </div>
  );
}
```

- [ ] **Krok 2: Commit**

```bash
git add frontend/src/pages/SearchPage.tsx
git commit -m "feat: add SearchPage with RAWG search and add-to-library modal"
```

---

## Task 17: LibraryPage

**Files:**
- Create: `frontend/src/pages/LibraryPage.tsx`

- [ ] **Krok 1: Stwórz LibraryPage**

`frontend/src/pages/LibraryPage.tsx`:
```tsx
import { useEffect, useState } from 'react';
import { Library } from 'lucide-react';
import { getLibrary } from '../services/libraryService';
import GameCard from '../components/GameCard';
import { UserGameDto, GameStatus } from '../types';

const FILTERS: { value: GameStatus | 'All'; label: string }[] = [
  { value: 'All', label: 'Wszystkie' },
  { value: 'Planned', label: 'Planowane' },
  { value: 'InProgress', label: 'W trakcie' },
  { value: 'Completed', label: 'Ukończone' },
  { value: 'Abandoned', label: 'Porzucone' },
];

export default function LibraryPage() {
  const [games, setGames] = useState<UserGameDto[]>([]);
  const [filter, setFilter] = useState<GameStatus | 'All'>('All');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getLibrary()
      .then(r => setGames(r.data))
      .finally(() => setLoading(false));
  }, []);

  const filtered = filter === 'All' ? games : games.filter(g => g.status === filter);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Moja biblioteka</h1>
        <span className="text-text-primary/50 text-sm">{games.length} gier</span>
      </div>

      <div className="flex gap-2 flex-wrap">
        {FILTERS.map(f => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={`px-4 py-1.5 rounded-full text-sm transition ${
              filter === f.value
                ? 'bg-accent-purple text-white'
                : 'bg-bg-card text-text-primary/60 hover:text-text-primary border border-white/5'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-16 text-text-primary/40">Ładowanie...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-text-primary/40">
          <Library size={48} className="mx-auto mb-4 opacity-30" />
          <p>Brak gier w tej kategorii.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
          {filtered.map(game => (
            <GameCard key={game.id} type="library" game={game} />
          ))}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Krok 2: Commit**

```bash
git add frontend/src/pages/LibraryPage.tsx
git commit -m "feat: add LibraryPage with status filters"
```

---

## Task 18: GameDetailPage

**Files:**
- Create: `frontend/src/pages/GameDetailPage.tsx`

- [ ] **Krok 1: Stwórz GameDetailPage**

`frontend/src/pages/GameDetailPage.tsx`:
```tsx
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Trash2, Save } from 'lucide-react';
import { getLibrary, updateLibraryItem, deleteFromLibrary } from '../services/libraryService';
import ScoreSlider from '../components/ScoreSlider';
import StatusBadge from '../components/StatusBadge';
import { UserGameDto, GameStatus, UpdateLibraryItemDto } from '../types';

const STATUS_OPTIONS: { value: GameStatus; label: string }[] = [
  { value: 'Planned', label: 'Planowane' },
  { value: 'InProgress', label: 'W trakcie' },
  { value: 'Completed', label: 'Ukończone' },
  { value: 'Abandoned', label: 'Porzucone' },
];

const PLATFORMS = ['PC', 'PS5', 'PS4', 'Xbox Series X', 'Xbox One', 'Nintendo Switch', 'Mobile', 'Inne'];

export default function GameDetailPage() {
  const { rawgId } = useParams<{ rawgId: string }>();
  const navigate = useNavigate();
  const [item, setItem] = useState<UserGameDto | null>(null);
  const [status, setStatus] = useState<GameStatus>('Planned');
  const [platform, setPlatform] = useState('PC');
  const [score, setScore] = useState(50);
  const [hasScore, setHasScore] = useState(false);
  const [review, setReview] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    getLibrary().then(res => {
      const found = res.data.find(g => g.rawgId === Number(rawgId));
      if (!found) { navigate('/library'); return; }
      setItem(found);
      setStatus(found.status);
      setPlatform(found.platform);
      setHasScore(found.score != null);
      setScore(found.score ?? 50);
      setReview(found.review ?? '');
    });
  }, [rawgId, navigate]);

  const handleSave = async () => {
    if (!item) return;
    setSaving(true);
    const dto: UpdateLibraryItemDto = {
      status,
      platform,
      score: hasScore ? score : undefined,
      review: review || undefined,
    };
    const res = await updateLibraryItem(item.id, dto);
    setItem(res.data);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleDelete = async () => {
    if (!item || !confirm('Usunąć grę z biblioteki?')) return;
    await deleteFromLibrary(item.id);
    navigate('/library');
  };

  if (!item) return <div className="text-center py-16 text-text-primary/40">Ładowanie...</div>;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-text-primary/50 hover:text-text-primary transition"
      >
        <ArrowLeft size={18} />
        Wróć
      </button>

      <div className="bg-bg-card rounded-2xl overflow-hidden border border-white/5">
        {item.coverImageUrl && (
          <img
            src={item.coverImageUrl}
            alt={item.title}
            className="w-full h-48 object-cover object-top"
          />
        )}

        <div className="p-6 space-y-6">
          <div className="flex items-start justify-between gap-4">
            <h1 className="text-2xl font-bold text-text-primary">{item.title}</h1>
            <StatusBadge status={item.status} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-text-primary/70 mb-1.5">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as GameStatus)}
                className="w-full bg-bg-primary border border-white/10 text-text-primary rounded-lg px-3 py-2 focus:outline-none focus:border-accent-purple"
              >
                {STATUS_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm text-text-primary/70 mb-1.5">Platforma</label>
              <select
                value={platform}
                onChange={(e) => setPlatform(e.target.value)}
                className="w-full bg-bg-primary border border-white/10 text-text-primary rounded-lg px-3 py-2 focus:outline-none focus:border-accent-purple"
              >
                {PLATFORMS.map(p => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="hasScore"
                checked={hasScore}
                onChange={(e) => setHasScore(e.target.checked)}
                className="accent-accent-purple"
              />
              <label htmlFor="hasScore" className="text-sm text-text-primary/70">
                Chcę ocenić tę grę
              </label>
            </div>
            {hasScore && <ScoreSlider value={score} onChange={setScore} />}
          </div>

          <div>
            <label className="block text-sm text-text-primary/70 mb-1.5">Recenzja (opcjonalnie)</label>
            <textarea
              value={review}
              onChange={(e) => setReview(e.target.value)}
              rows={4}
              placeholder="Napisz co sądzisz o tej grze..."
              className="w-full bg-bg-primary border border-white/10 text-text-primary rounded-lg px-3 py-2.5 focus:outline-none focus:border-accent-purple resize-none"
            />
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 bg-accent-purple hover:bg-purple-600 disabled:opacity-50 text-white font-semibold py-2.5 rounded-xl transition flex items-center justify-center gap-2"
            >
              <Save size={16} />
              {saved ? 'Zapisano!' : saving ? 'Zapisywanie...' : 'Zapisz zmiany'}
            </button>

            <button
              onClick={handleDelete}
              className="bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 px-4 py-2.5 rounded-xl transition"
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Krok 2: Usuń stary Dashboard**

```bash
rm frontend/src/pages/Dashboard.tsx
```

- [ ] **Krok 3: Sprawdź czy frontend się buduje bez błędów**

```bash
cd frontend
npm run build
```

Spodziewany wynik: BUILD SUCCESS, 0 błędów TypeScript.

- [ ] **Krok 4: Commit**

```bash
git add -A
git commit -m "feat: add GameDetailPage, remove old Dashboard - frontend complete"
```

---

## Task 19: Weryfikacja końcowa

- [ ] **Krok 1: Backend — pełny build i testy**

```bash
cd backend
dotnet build
dotnet test TaskManager.Tests/ -v normal
```

Spodziewany wynik: BUILD SUCCEEDED, 4 testy PASS.

- [ ] **Krok 2: Frontend — pełny build**

```bash
cd frontend
npm run build
```

Spodziewany wynik: BUILD SUCCESS.

- [ ] **Krok 3: Uzupełnij klucz RAWG w appsettings.json**

Otwórz `backend/appsettings.json` i wpisz klucz RAWG w polu `"ExternalApis.Rawg.ApiKey"`.
Klucz możesz pobrać bezpłatnie na https://rawg.io/apidocs

- [ ] **Krok 4: Uruchom backend lokalnie (opcjonalnie)**

```bash
cd backend
dotnet run
```

Backend będzie dostępny na http://localhost:5000, Swagger UI na http://localhost:5000 (root).

- [ ] **Krok 5: Uruchom frontend lokalnie (opcjonalnie)**

Stwórz `frontend/.env`:
```
VITE_API_URL=http://localhost:5000/api
```

```bash
cd frontend
npm run dev
```

Frontend będzie dostępny na http://localhost:5173.

- [ ] **Krok 6: Commit końcowy**

```bash
git add -A
git commit -m "chore: finalize gamelog app - ready for Azure deployment"
```

---

## Notatki Azure Deploy

Po wdrożeniu ustaw w Azure App Service > Configuration:
- `JwtSettings__Secret` → silny losowy string (min. 32 znaki)
- `ExternalApis__Rawg__ApiKey` → twój klucz RAWG
- `DbConnectionString` → connection string do Azure SQL

Lub przez Key Vault z Managed Identity (infrastruktura już skonfigurowana w `Program.cs`).

Frontend: wdróż build (`frontend/dist`) na Azure Static Web Apps.
Ustaw CORS w Azure App Service żeby akceptował domenę Static Web App.
