namespace CloudBackend.Models;

public class MultiplayerGame
{
    public int Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Genre { get; set; }
    public DateTime? ReleaseDate { get; set; }
    public string? CoverUrl { get; set; }
    public string GameMode { get; set; } = "multiplayer";
    public string? ApiSource { get; set; }  // riot | steam
    public string? ExternalId { get; set; }
}
