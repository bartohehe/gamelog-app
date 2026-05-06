namespace CloudBackend.DTOs.Multiplayer;

public class MultiplayerEntryDto
{
    public int Id { get; set; }
    public string GameTitle { get; set; } = "";
    public string? Mode { get; set; }
    public string? Tier { get; set; }
    public string? Rank { get; set; }
    public int? RankPoints { get; set; }
    public int? RankPointsMax { get; set; }
    public double? WinRate { get; set; }
    public double? KdRatio { get; set; }
    public int? HoursPlayed { get; set; }
    public string? Platform { get; set; }
    public string? InGameUsername { get; set; }
    public string? SyncIdentifier { get; set; }
    public DateTime UpdatedAt { get; set; }
}

public class UpsertMultiplayerEntryDto
{
    public string GameTitle { get; set; } = "";
    public string? Mode { get; set; }
    public string? Tier { get; set; }
    public string? Rank { get; set; }
    public int? RankPoints { get; set; }
    public int? RankPointsMax { get; set; }
    public double? WinRate { get; set; }
    public double? KdRatio { get; set; }
    public int? HoursPlayed { get; set; }
    public string? Platform { get; set; }
    public string? InGameUsername { get; set; }
    public string? SyncIdentifier { get; set; }
}
