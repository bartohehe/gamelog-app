namespace CloudBackend.Models;

public class MultiplayerEntry
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public User User { get; set; } = null!;

    public string GameTitle { get; set; } = "";
    public string? Mode { get; set; }          // "5v5 Tactical", "Battle Royale" etc.
    public string? Tier { get; set; }          // "diamond", "gold", "platinum" etc.
    public string? Rank { get; set; }          // "Diamond 2", "Gold IV" etc.
    public int? RankPoints { get; set; }       // current LP/RP/MMR
    public int? RankPointsMax { get; set; }    // max points for progress bar (e.g. 100)
    public double? WinRate { get; set; }       // 0-100
    public double? KdRatio { get; set; }
    public int? HoursPlayed { get; set; }
    public string? Platform { get; set; }      // "PC", "PS5", "Xbox"
    public string? InGameUsername { get; set; }
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
