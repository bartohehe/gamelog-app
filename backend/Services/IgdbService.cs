using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using CloudBackend.Data;
using CloudBackend.DTOs.Games;
using CloudBackend.Models;
using CloudBackend.Options;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;

namespace CloudBackend.Services;

public class IgdbService : IIgdbService
{
    private readonly HttpClient _http;
    private readonly string _clientId;
    private readonly string _clientSecret;
    private readonly AppDbContext _context;
    private readonly ICacheService _cache;
    private readonly ITranslationService _translation;
    private readonly bool _translationEnabled;
    private static string? _accessToken;
    private static DateTime _tokenExpiry = DateTime.MinValue;

    public IgdbService(HttpClient http, IConfiguration config, AppDbContext context, ICacheService cache, ITranslationService translation, IOptions<FeatureFlags> flags)
    {
        _http = http;
        _clientId = config["ExternalApis:Igdb:ClientId"] ?? "";
        _clientSecret = config["ExternalApis:Igdb:ClientSecret"] ?? "";
        _context = context;
        _cache = cache;
        _translation = translation;
        _translationEnabled = flags.Value.TranslationEnabled;
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

    public Task<List<GameDto>?> GetPopularGamesAsync()
    {
        var monthAgo = DateTimeOffset.UtcNow.AddDays(-30).ToUnixTimeSeconds();
        var now      = DateTimeOffset.UtcNow.ToUnixTimeSeconds();
        var cacheKey = $"igdb:popular:recent:{DateTime.UtcNow:yyyyMMdd}";
        return _cache.GetOrSetAsync(
            cacheKey,
            () => PostQueryAsync(
                $"fields id,name,cover.image_id,first_release_date,genres.name; " +
                $"where first_release_date >= {monthAgo} & first_release_date <= {now} & rating_count > 0; " +
                $"sort rating desc; limit 12;"),
            TimeSpan.FromHours(6));
    }

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
        // DB cache takes priority (permanent storage); Redis adds in-memory speed for repeated detail lookups
        var cached = await _context.Games.FirstOrDefaultAsync(g => g.IgdbId == igdbId);
        if (cached != null) return MapCachedGame(cached);

        return await _cache.GetOrSetAsync(
            $"igdb:game:{igdbId}",
            async () =>
            {
                var results = await PostQueryAsync($"where id = {igdbId}; fields id,name,cover.image_id,first_release_date,genres.name,summary,rating,rating_count,involved_companies.developer,involved_companies.company.name,platforms.name;");
                var dto = results.FirstOrDefault();
                if (dto != null && _translationEnabled && !string.IsNullOrEmpty(dto.Summary))
                    dto.Summary = await _translation.TranslateToPolishAsync(dto.Summary) ?? dto.Summary;
                return dto!;
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
            Genres = JsonSerializer.Serialize(dto.Genres),
            Summary = dto.Summary,
            Rating = dto.Rating,
            RatingCount = dto.RatingCount,
            Developer = dto.Developer,
            Platforms = JsonSerializer.Serialize(dto.Platforms),
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
        Genres = g.Genres?.Select(x => x.Name).ToList() ?? new(),
        Summary = g.Summary,
        Rating = g.Rating.HasValue ? Math.Round(g.Rating.Value, 1) : null,
        RatingCount = g.RatingCount,
        Developer = g.InvolvedCompanies?.FirstOrDefault(c => c.Developer)?.Company?.Name,
        Platforms = g.Platforms?.Select(p => p.Name).ToList() ?? new(),
    };

    private static GameDto MapCachedGame(Game g) => new()
    {
        IgdbId = g.IgdbId,
        Title = g.Title,
        CoverImageUrl = g.CoverImageUrl,
        ReleaseYear = g.ReleaseYear,
        Genres = JsonSerializer.Deserialize<List<string>>(g.Genres) ?? new(),
        Summary = g.Summary,
        Rating = g.Rating,
        RatingCount = g.RatingCount,
        Developer = g.Developer,
        Platforms = string.IsNullOrEmpty(g.Platforms) ? new() : JsonSerializer.Deserialize<List<string>>(g.Platforms) ?? new(),
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
        public string? Summary { get; set; }
        public double? Rating { get; set; }
        [JsonPropertyName("rating_count")] public int? RatingCount { get; set; }
        [JsonPropertyName("involved_companies")] public List<IgdbInvolvedCompany>? InvolvedCompanies { get; set; }
        public List<IgdbPlatform>? Platforms { get; set; }
    }

    private class IgdbCover
    {
        [JsonPropertyName("image_id")] public string? ImageId { get; set; }
    }

    private class IgdbGenre
    {
        public string Name { get; set; } = "";
    }

    private class IgdbInvolvedCompany
    {
        public bool Developer { get; set; }
        public IgdbCompany? Company { get; set; }
    }

    private class IgdbCompany
    {
        public string Name { get; set; } = "";
    }

    private class IgdbPlatform
    {
        public string Name { get; set; } = "";
    }
}
