using System.Text.Json;

namespace CloudBackend.Services;

public class RawgService
{
    private readonly HttpClient _http;
    private readonly string _apiKey;

    public RawgService(HttpClient http, IConfiguration config)
    {
        _http = http;
        _apiKey = config["ExternalApis:Rawg:ApiKey"] ?? string.Empty;
        _http.BaseAddress = new Uri("https://api.rawg.io/api/");
    }

    public async Task<object> SearchGamesAsync(string query)
    {
        if (string.IsNullOrEmpty(_apiKey))
            return Array.Empty<object>();

        var url = $"games?key={_apiKey}&search={Uri.EscapeDataString(query)}&page_size=20";
        var response = await _http.GetAsync(url);
        if (!response.IsSuccessStatusCode)
            return Array.Empty<object>();

        var json = await response.Content.ReadAsStringAsync();
        return JsonSerializer.Deserialize<object>(json) ?? Array.Empty<object>();
    }

    public async Task<object> GetGameByIdAsync(string rawgId)
    {
        if (string.IsNullOrEmpty(_apiKey))
            return new { };

        var url = $"games/{rawgId}?key={_apiKey}";
        var response = await _http.GetAsync(url);
        if (!response.IsSuccessStatusCode)
            return new { };

        var json = await response.Content.ReadAsStringAsync();
        return JsonSerializer.Deserialize<object>(json) ?? new { };
    }
}
