using System.Text.Json;

namespace CloudBackend.Services;

public class RiotService
{
    private readonly HttpClient _http;
    private readonly string _apiKey;

    public RiotService(HttpClient http, IConfiguration config)
    {
        _http = http;
        _apiKey = config["ExternalApis:Riot:ApiKey"] ?? string.Empty;
    }

    public async Task<object> GetSummonerByNameAsync(string summonerName, string region = "eun1")
    {
        if (string.IsNullOrEmpty(_apiKey))
            return new { };

        var url = $"https://{region}.api.riotgames.com/lol/summoner/v4/summoners/by-name/{Uri.EscapeDataString(summonerName)}";
        var request = new HttpRequestMessage(HttpMethod.Get, url);
        request.Headers.Add("X-Riot-Token", _apiKey);

        var response = await _http.SendAsync(request);
        if (!response.IsSuccessStatusCode)
            return new { };

        var json = await response.Content.ReadAsStringAsync();
        return JsonSerializer.Deserialize<object>(json) ?? new { };
    }

    public async Task<object> GetRankedDataAsync(string summonerId, string region = "eun1")
    {
        if (string.IsNullOrEmpty(_apiKey))
            return new { };

        var url = $"https://{region}.api.riotgames.com/lol/league/v4/entries/by-summoner/{summonerId}";
        var request = new HttpRequestMessage(HttpMethod.Get, url);
        request.Headers.Add("X-Riot-Token", _apiKey);

        var response = await _http.SendAsync(request);
        if (!response.IsSuccessStatusCode)
            return new { };

        var json = await response.Content.ReadAsStringAsync();
        return JsonSerializer.Deserialize<object>(json) ?? new { };
    }
}
