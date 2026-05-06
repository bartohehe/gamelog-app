namespace CloudBackend.Models;

public class MultiplayerEntry
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public User User { get; set; } = null!;

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
    /// <summary>
    /// Stores the external identifier needed for re-sync:
    /// LoL → Riot platform (e.g. "eun1"), CS2 → Steam 64-bit ID.
    /// </summary>
    public string? SyncIdentifier { get; set; }
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
