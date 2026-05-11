using CloudBackend.DTOs.Media;
using CloudBackend.Services;
using Microsoft.AspNetCore.Mvc;

namespace CloudBackend.Controllers;

[ApiController]
[Route("api/[controller]")]
public class MediaSearchController : ControllerBase
{
    private readonly ITmdbService _tmdb;
    private readonly IJikanService _jikan;
    private readonly ICacheService _cache;
    private readonly ILogger<MediaSearchController> _logger;

    public MediaSearchController(
        ITmdbService tmdb,
        IJikanService jikan,
        ICacheService cache,
        ILogger<MediaSearchController> logger)
    {
        _tmdb = tmdb;
        _jikan = jikan;
        _cache = cache;
        _logger = logger;
    }

    [HttpGet]
    public async Task<ActionResult<List<MediaSearchResultDto>>> Search(
        [FromQuery] string q = "",
        [FromQuery] string type = "all")
    {
        q = q.Trim();
        if (q.Length < 2)
            return Ok(Array.Empty<MediaSearchResultDto>());

        var cacheKey = $"mediasearch:{type.ToLower()}:{q.ToLower()}";

        var cached = await _cache.GetOrSetAsync<List<MediaSearchResultDto>>(
            cacheKey,
            () => FetchFromApis(q, type),
            TimeSpan.FromHours(1));

        return Ok(cached ?? []);
    }

    private async Task<List<MediaSearchResultDto>> FetchFromApis(string q, string type)
    {
        var results = new List<MediaSearchResultDto>();

        if (type == "all" || type == "Film" || type == "Serial")
        {
            var tmdbResults = await _tmdb.SearchAsync(q, type);
            results.AddRange(tmdbResults);
        }

        if (type == "all" || type == "Anime")
        {
            var jikanResults = await _jikan.SearchAsync(q);
            results.AddRange(jikanResults);
        }

        return [.. results.OrderByDescending(r => r.Popularity)];
    }
}
