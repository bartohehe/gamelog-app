namespace CloudBackend.Models;

public class UserGame
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public User User { get; set; } = null!;
    public int GameId { get; set; }
    public Game Game { get; set; } = null!;

    public string Status { get; set; } = "backlog"; // playing | completed | backlog | dropped
    public int? Rating { get; set; }  // 0–100
    public string? Notes { get; set; }
    public DateTime AddedAt { get; set; } = DateTime.UtcNow;
    public string? Platform { get; set; }
}
