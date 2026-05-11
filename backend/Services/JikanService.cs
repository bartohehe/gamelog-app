using System.Text.Json;
using System.Text.Json.Serialization;
using CloudBackend.DTOs.Media;

namespace CloudBackend.Services;

public class JikanService : IJikanService
{
    private readonly HttpClient _http;
    private readonly ILogger<JikanService> _logger;

    private static readonly JsonSerializerOptions JsonOpts = new() { PropertyNameCaseInsensitive = true };

    public JikanService(HttpClient http, ILogger<JikanService> logger)
    {
        _http = http;
        _logger = logger;
        _http.BaseAddress = new Uri("https://api.jikan.moe/");
        _http.DefaultRequestHeaders.Add("Accept", "application/json");
    }

    public async Task<List<MediaSearchResultDto>> SearchAsync(string query)
    {
        try
        {
            var url = $"v4/anime?q={Uri.EscapeDataString(query)}&limit=20&sfw=true";
            var json = await _http.GetStringAsync(url);
            var response = JsonSerializer.Deserialize<JikanResponse>(json, JsonOpts);
            if (response?.Data == null) return [];

            return response.Data.Select(item =>
            {
                var genres = item.Genres?.Select(g => g.Name).ToList() ?? [];
                var studio = item.Studios?.FirstOrDefault()?.Name ?? "";
                var cover = item.Images?.Jpg?.LargeImageUrl ?? item.Images?.Jpg?.ImageUrl;
                var year = item.Aired?.Prop?.From?.Year;
                var score = item.Score.HasValue
                    ? (int?)Math.Round(item.Score.Value * 10)
                    : null;
                var popularity = Math.Min(item.Members ?? 0, 999999);

                return new MediaSearchResultDto(
                    ExternalId: $"mal:{item.MalId}",
                    Title: item.TitleEnglish ?? item.Title ?? "",
                    Type: "Anime",
                    Year: year ?? 0,
                    Genres: genres,
                    Creator: studio,
                    CoverImageUrl: cover,
                    Runtime: null,
                    Episodes: item.Episodes,
                    CriticScore: score,
                    Popularity: popularity
                );
            }).ToList();
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Jikan search failed for query '{Query}'", query);
            return [];
        }
    }

    // ── JSON models ───────────────────────────────────────────────────────────

    private record JikanResponse(
        [property: JsonPropertyName("data")] List<JikanAnime>? Data
    );

    private record JikanAnime(
        [property: JsonPropertyName("mal_id")] int MalId,
        [property: JsonPropertyName("title")] string? Title,
        [property: JsonPropertyName("title_english")] string? TitleEnglish,
        [property: JsonPropertyName("images")] JikanImages? Images,
        [property: JsonPropertyName("episodes")] int? Episodes,
        [property: JsonPropertyName("score")] double? Score,
        [property: JsonPropertyName("members")] int? Members,
        [property: JsonPropertyName("genres")] List<JikanNamedEntity>? Genres,
        [property: JsonPropertyName("studios")] List<JikanNamedEntity>? Studios,
        [property: JsonPropertyName("aired")] JikanAired? Aired
    );

    private record JikanImages(
        [property: JsonPropertyName("jpg")] JikanJpg? Jpg
    );

    private record JikanJpg(
        [property: JsonPropertyName("image_url")] string? ImageUrl,
        [property: JsonPropertyName("large_image_url")] string? LargeImageUrl
    );

    private record JikanNamedEntity(
        [property: JsonPropertyName("name")] string Name
    );

    private record JikanAired(
        [property: JsonPropertyName("prop")] JikanAiredProp? Prop
    );

    private record JikanAiredProp(
        [property: JsonPropertyName("from")] JikanAiredFrom? From
    );

    private record JikanAiredFrom(
        [property: JsonPropertyName("year")] int? Year
    );
}
