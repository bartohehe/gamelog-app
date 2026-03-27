using System.Text.Json;

namespace CloudBackend.Services;

public class SteamService
{
    private readonly HttpClient _http;
    private readonly string _apiKey;

    public SteamService(HttpClient http, IConfiguration config)
    {
        _http = http;
        _apiKey = config["ExternalApis:Steam:ApiKey"] ?? string.Empty;
        _http.BaseAddress = new Uri("https://api.steampowered.com/");
    }

    public async Task<object> GetPlayerSummaryAsync(string steamId)
    {
        if (string.IsNullOrEmpty(_apiKey))
            return new { };

        var url = $"ISteamUser/GetPlayerSummaries/v2/?key={_apiKey}&steamids={steamId}";
        var response = await _http.GetAsync(url);
        if (!response.IsSuccessStatusCode)
            return new { };

        var json = await response.Content.ReadAsStringAsync();
        return JsonSerializer.Deserialize<object>(json) ?? new { };
    }

    public async Task<object> GetOwnedGamesAsync(string steamId)
    {
        if (string.IsNullOrEmpty(_apiKey))
            return new { };

        var url = $"IPlayerService/GetOwnedGames/v1/?key={_apiKey}&steamid={steamId}&include_appinfo=true";
        var response = await _http.GetAsync(url);
        if (!response.IsSuccessStatusCode)
            return new { };

        var json = await response.Content.ReadAsStringAsync();
        return JsonSerializer.Deserialize<object>(json) ?? new { };
    }
}
