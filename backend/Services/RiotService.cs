using System.Text.Json;
using System.Text.Json.Serialization;
using CloudBackend.DTOs.Multiplayer;

namespace CloudBackend.Services;

public interface IRiotService
{
    /// <summary>
    /// Fetches LoL ranked data by summoner name (no tag needed).
    /// Returns a pre-filled UpsertMultiplayerEntryDto ready to save.
    /// </summary>
    Task<UpsertMultiplayerEntryDto> GetLoLRankAsync(string summonerName, string platform = "eun1");
}

public class RiotService : IRiotService
{
    private readonly HttpClient _http;
    private readonly string _apiKey;

    // Maps LoL tier name to our internal tier key
    private static readonly Dictionary<string, string> TierMap = new(StringComparer.OrdinalIgnoreCase)
    {
        ["IRON"]        = "iron",
        ["BRONZE"]      = "bronze",
        ["SILVER"]      = "silver",
        ["GOLD"]        = "gold",
        ["PLATINUM"]    = "platinum",
        ["EMERALD"]     = "emerald",
        ["DIAMOND"]     = "diamond",
        ["MASTER"]      = "master",
        ["GRANDMASTER"] = "grandmaster",
        ["CHALLENGER"]  = "challenger",
    };

    // Roman numeral rank → number (for display)
    private static readonly Dictionary<string, string> RankMap = new(StringComparer.OrdinalIgnoreCase)
    {
        ["I"] = "1", ["II"] = "2", ["III"] = "3", ["IV"] = "4",
    };

    public RiotService(HttpClient http, IConfiguration config)
    {
        _http = http;
        _apiKey = config["Riot:ApiKey"] ?? throw new InvalidOperationException("Riot:ApiKey not configured.");
    }

    public async Task<UpsertMultiplayerEntryDto> GetLoLRankAsync(string summonerName, string platform = "eun1")
    {
        // Determine regional routing from platform
        var region = platform switch
        {
            "na1" or "br1" or "la1" or "la2" => "americas",
            "kr"  or "jp1"                   => "asia",
            "oc1" or "ph2" or "sg2" or "th2" or "tw2" or "vn2" => "sea",
            _                                => "europe",  // eun1, euw1, tr1, ru
        };

        // 1. Riot ID → PUUID (requires Personal API Key / registered app)
        var parts = summonerName.Split('#', 2);
        if (parts.Length != 2)
            throw new HttpRequestException(
                "Podaj Riot ID w formacie NazwaGracza#TAG (np. Faker#KR1). " +
                "Auto-generowany klucz dev nie obsługuje tego endpointu — " +
                "zarejestruj Personal API Key na developer.riotgames.com.");

        var account = await GetAsync<RiotAccount>(
            $"https://{region}.api.riotgames.com/riot/account/v1/accounts/by-riot-id/{Uri.EscapeDataString(parts[0].Trim())}/{Uri.EscapeDataString(parts[1].Trim())}");

        // 2. PUUID → Summoner
        var summoner = await GetAsync<LoLSummoner>(
            $"https://{platform}.api.riotgames.com/lol/summoner/v4/summoners/by-puuid/{account.Puuid}");

        // 2. Summoner ID → Ranked entries
        var entries = await GetAsync<List<LoLLeagueEntry>>(
            $"https://{platform}.api.riotgames.com/lol/league/v4/entries/by-summoner/{summoner.Id}");

        // Prefer RANKED_SOLO_5x5, fall back to first entry
        var entry = entries.FirstOrDefault(e => e.QueueType == "RANKED_SOLO_5x5")
                    ?? entries.FirstOrDefault();

        var riotId = $"{parts[0].Trim()}#{parts[1].Trim()}";

        if (entry == null)
        {
            return new UpsertMultiplayerEntryDto
            {
                GameTitle = "League of Legends",
                Mode = "5v5 Ranked Solo/Duo",
                Platform = "PC",
                InGameUsername = riotId,
            };
        }

        TierMap.TryGetValue(entry.Tier, out var tier);
        RankMap.TryGetValue(entry.Rank, out var rankNum);
        var rankStr = rankNum != null
            ? $"{char.ToUpper(entry.Tier[0])}{entry.Tier[1..].ToLower()} {rankNum}"
            : entry.Tier;

        var totalGames = entry.Wins + entry.Losses;
        var winRate = totalGames > 0 ? Math.Round((double)entry.Wins / totalGames * 100, 1) : (double?)null;

        return new UpsertMultiplayerEntryDto
        {
            GameTitle = "League of Legends",
            Mode = "5v5 Ranked Solo/Duo",
            Tier = tier ?? entry.Tier.ToLower(),
            Rank = rankStr,
            RankPoints = entry.LeaguePoints,
            RankPointsMax = 100,
            WinRate = winRate,
            Platform = "PC",
            InGameUsername = riotId,
        };
    }

    private async Task<T> GetAsync<T>(string url)
    {
        // Append api_key as query parameter — more reliable than header in some .NET HttpClient configs
        var separator = url.Contains('?') ? "&" : "?";
        var fullUrl = $"{url}{separator}api_key={Uri.EscapeDataString(_apiKey)}";

        var resp = await _http.GetAsync(fullUrl);
        if (!resp.IsSuccessStatusCode)
        {
            var body = await resp.Content.ReadAsStringAsync();
            throw new HttpRequestException($"Riot API {(int)resp.StatusCode}: {body}");
        }
        var json = await resp.Content.ReadAsStringAsync();
        return JsonSerializer.Deserialize<T>(json, JsonOpts)!;
    }

    private static readonly JsonSerializerOptions JsonOpts = new() { PropertyNameCaseInsensitive = true };

    private record RiotAccount([property: JsonPropertyName("puuid")] string Puuid);
    private record LoLSummoner([property: JsonPropertyName("id")] string Id);

    private class LoLLeagueEntry
    {
        [JsonPropertyName("queueType")]     public string QueueType    { get; set; } = "";
        [JsonPropertyName("tier")]          public string Tier          { get; set; } = "";
        [JsonPropertyName("rank")]          public string Rank          { get; set; } = "";
        [JsonPropertyName("leaguePoints")]  public int    LeaguePoints  { get; set; }
        [JsonPropertyName("wins")]          public int    Wins          { get; set; }
        [JsonPropertyName("losses")]        public int    Losses        { get; set; }
    }
}
