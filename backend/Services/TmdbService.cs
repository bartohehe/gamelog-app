using System.Text.Json;
using System.Text.Json.Serialization;
using CloudBackend.DTOs.Media;

namespace CloudBackend.Services;

public class TmdbService : ITmdbService
{
    private readonly HttpClient _http;
    private readonly string _apiKey;
    private readonly ILogger<TmdbService> _logger;

    private static readonly JsonSerializerOptions JsonOpts = new() { PropertyNameCaseInsensitive = true };

    // Stable TMDB genre IDs → names (avoids extra API call per search)
    private static readonly Dictionary<int, string> MovieGenres = new()
    {
        [28] = "Action", [12] = "Adventure", [16] = "Animation", [35] = "Comedy",
        [80] = "Crime", [99] = "Documentary", [18] = "Drama", [10751] = "Family",
        [14] = "Fantasy", [36] = "History", [27] = "Horror", [10402] = "Music",
        [9648] = "Mystery", [10749] = "Romance", [878] = "Sci-Fi", [10770] = "TV Movie",
        [53] = "Thriller", [10752] = "War", [37] = "Western",
    };

    private static readonly Dictionary<int, string> TvGenres = new()
    {
        [10759] = "Action & Adventure", [16] = "Animation", [35] = "Comedy",
        [80] = "Crime", [99] = "Documentary", [18] = "Drama", [10751] = "Family",
        [10762] = "Kids", [9648] = "Mystery", [10763] = "News", [10764] = "Reality",
        [10765] = "Sci-Fi & Fantasy", [10766] = "Soap", [10767] = "Talk",
        [10768] = "War & Politics", [37] = "Western",
    };

    public TmdbService(HttpClient http, IConfiguration config, ILogger<TmdbService> logger)
    {
        _http = http;
        _apiKey = config["ExternalApis:Tmdb:ApiKey"] ?? "";
        _logger = logger;
        _http.BaseAddress = new Uri("https://api.themoviedb.org/");
        _http.DefaultRequestHeaders.Add("Accept", "application/json");
    }

    public async Task<List<MediaSearchResultDto>> SearchAsync(string query, string type)
    {
        if (string.IsNullOrEmpty(_apiKey))
        {
            _logger.LogWarning("TMDB API key not configured — skipping TMDB search");
            return [];
        }

        try
        {
            var url = $"3/search/multi?query={Uri.EscapeDataString(query)}&language=pl-PL&page=1&api_key={_apiKey}";
            var json = await _http.GetStringAsync(url);
            var response = JsonSerializer.Deserialize<TmdbMultiSearchResponse>(json, JsonOpts);
            if (response?.Results == null) return [];

            var results = new List<MediaSearchResultDto>();

            foreach (var item in response.Results)
            {
                if (item.MediaType == "person") continue;

                var mediaType = item.MediaType == "movie" ? "Film" : "Serial";

                // Filter by requested type
                if (type == "Film" && mediaType != "Film") continue;
                if (type == "Serial" && mediaType != "Serial") continue;
                if (type == "Anime") continue; // Anime handled by Jikan

                var genreMap = mediaType == "Film" ? MovieGenres : TvGenres;
                var genres = item.GenreIds?
                    .Where(genreMap.ContainsKey)
                    .Select(id => genreMap[id])
                    .ToList() ?? [];

                var title = mediaType == "Film" ? item.Title : item.Name;
                var dateStr = mediaType == "Film" ? item.ReleaseDate : item.FirstAirDate;
                var year = dateStr?.Length >= 4 && int.TryParse(dateStr[..4], out var y) ? y : 0;

                var cover = item.PosterPath != null
                    ? $"https://image.tmdb.org/t/p/w500{item.PosterPath}"
                    : null;

                var creator = item.OriginalLanguage ?? "";

                results.Add(new MediaSearchResultDto(
                    ExternalId: $"tmdb:{item.Id}",
                    Title: title ?? "",
                    Type: mediaType,
                    Year: year,
                    Genres: genres,
                    Creator: creator,
                    CoverImageUrl: cover,
                    Runtime: null,
                    Episodes: null,
                    CriticScore: item.VoteAverage > 0
                        ? (int)Math.Round(item.VoteAverage * 10)
                        : null,
                    Popularity: (int)Math.Min(item.Popularity, 999999)
                ));
            }

            return results;
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "TMDB search failed for query '{Query}'", query);
            return [];
        }
    }

    // ── JSON models ───────────────────────────────────────────────────────────

    private record TmdbMultiSearchResponse(
        [property: JsonPropertyName("results")] List<TmdbItem>? Results
    );

    private record TmdbItem(
        [property: JsonPropertyName("id")] int Id,
        [property: JsonPropertyName("media_type")] string? MediaType,
        [property: JsonPropertyName("title")] string? Title,
        [property: JsonPropertyName("name")] string? Name,
        [property: JsonPropertyName("original_language")] string? OriginalLanguage,
        [property: JsonPropertyName("release_date")] string? ReleaseDate,
        [property: JsonPropertyName("first_air_date")] string? FirstAirDate,
        [property: JsonPropertyName("poster_path")] string? PosterPath,
        [property: JsonPropertyName("genre_ids")] List<int>? GenreIds,
        [property: JsonPropertyName("vote_average")] double VoteAverage,
        [property: JsonPropertyName("popularity")] double Popularity
    );
}
