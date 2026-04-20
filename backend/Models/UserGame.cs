namespace CloudBackend.Models;

public class UserGame
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public User User { get; set; } = null!;
    public int GameId { get; set; }
    public Game Game { get; set; } = null!;
    public GameStatus Status { get; set; }
    public string Platform { get; set; } = string.Empty;
    public int? Score { get; set; }
    public string? Review { get; set; }
    public DateTime AddedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}
