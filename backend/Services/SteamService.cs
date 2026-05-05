using System.Text.Json;
using System.Text.Json.Serialization;
using CloudBackend.DTOs.Multiplayer;

namespace CloudBackend.Services;

public interface ISteamService
{
    /// <summary>
    /// Fetches CS2 stats for a player by Steam ID (64-bit).
    /// Returns a pre-filled UpsertMultiplayerEntryDto ready to save.
    /// </summary>
    Task<UpsertMultiplayerEntryDto> GetCs2StatsAsync(string steamId);
}

public class SteamService : ISteamService
{
    private readonly HttpClient _http;
    private readonly string _apiKey;

    private const int Cs2AppId = 730;

    public SteamService(HttpClient http, IConfiguration config)
    {
        _http = http;
        _apiKey = config["Steam:ApiKey"] ?? throw new InvalidOperationException("Steam:ApiKey not configured.");
    }

    public async Task<UpsertMultiplayerEntryDto> GetCs2StatsAsync(string steamId)
    {
        // Stats for CS2 (appid 730)
        var statsUrl = $"https://api.steampowered.com/ISteamUserStats/GetUserStatsForGame/v0002/" +
                       $"?appid={Cs2AppId}&key={_apiKey}&steamid={steamId}";

        var statsResp = await _http.GetAsync(statsUrl);
        if (!statsResp.IsSuccessStatusCode)
        {
            var errBody = await statsResp.Content.ReadAsStringAsync();
            throw new HttpRequestException($"Steam API {(int)statsResp.StatusCode}: {errBody}");
        }
        var statsJson = await statsResp.Content.ReadAsStringAsync();
        var statsRoot = JsonSerializer.Deserialize<SteamStatsRoot>(statsJson, JsonOpts);

        // Steam returns HTTP 200 but with error field when profile/stats are private
        if (statsRoot?.PlayerStats?.Stats == null || statsRoot.PlayerStats.Stats.Count == 0)
            throw new HttpRequestException("Brak dostępu do statystyk. Upewnij się że profil Steam i statystyki gier są publiczne.");

        var stats = statsRoot?.PlayerStats?.Stats ?? new List<SteamStat>();
        long Get(string name) => stats.FirstOrDefault(s => s.Name == name)?.Value ?? 0;

        var kills   = Get("total_kills");
        var deaths  = Get("total_deaths");
        var wins    = Get("total_matches_won");
        var played  = Get("total_matches_played");
        var hours   = (int)(Get("total_time_played") / 3600);

        var kd      = deaths > 0 ? Math.Round((double)kills / deaths, 2) : (double?)null;
        var wr      = played > 0 ? Math.Round((double)wins / played * 100, 1) : (double?)null;

        // Fetch player profile for username
        var profileUrl = $"https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/" +
                         $"?key={_apiKey}&steamids={steamId}";
        var profileResp = await _http.GetAsync(profileUrl);
        string? personaName = null;
        if (profileResp.IsSuccessStatusCode)
        {
            var profileJson = await profileResp.Content.ReadAsStringAsync();
            var profile = JsonSerializer.Deserialize<SteamProfileRoot>(profileJson, JsonOpts);
            personaName = profile?.Response?.Players?.FirstOrDefault()?.PersonaName;
        }

        return new UpsertMultiplayerEntryDto
        {
            GameTitle = "Counter-Strike 2",
            Mode = "Competitive",
            KdRatio = kd,
            WinRate = wr,
            HoursPlayed = hours > 0 ? hours : null,
            Platform = "PC",
            InGameUsername = personaName,
        };
    }

    private static readonly JsonSerializerOptions JsonOpts = new() { PropertyNameCaseInsensitive = true };

    private class SteamStatsRoot
    {
        [JsonPropertyName("playerstats")] public SteamPlayerStats? PlayerStats { get; set; }
    }

    private class SteamPlayerStats
    {
        [JsonPropertyName("stats")] public List<SteamStat> Stats { get; set; } = new();
    }

    private class SteamStat
    {
        [JsonPropertyName("name")]  public string Name  { get; set; } = "";
        [JsonPropertyName("value")] public long   Value { get; set; }
    }

    private class SteamProfileRoot
    {
        [JsonPropertyName("response")] public SteamProfileResponse? Response { get; set; }
    }

    private class SteamProfileResponse
    {
        [JsonPropertyName("players")] public List<SteamPlayer> Players { get; set; } = new();
    }

    private class SteamPlayer
    {
        [JsonPropertyName("personaname")] public string PersonaName { get; set; } = "";
    }
}
