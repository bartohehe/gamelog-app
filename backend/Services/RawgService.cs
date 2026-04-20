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

    // RAWG API response shapes — private nested classes
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
