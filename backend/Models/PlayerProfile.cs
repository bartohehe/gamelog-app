namespace CloudBackend.Models;

public class PlayerProfile
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public User User { get; set; } = null!;
    public int GameId { get; set; }
    public Game Game { get; set; } = null!;

    public string Nickname { get; set; } = string.Empty;
    public string? Rank { get; set; }
    public string? Region { get; set; }
}
