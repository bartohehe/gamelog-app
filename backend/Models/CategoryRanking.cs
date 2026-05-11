namespace CloudBackend.Models;

public class CategoryRanking
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public User User { get; set; } = null!;
    public string CategoryId { get; set; } = string.Empty;  // "gameplay", "story", etc.
    public int UserGameId { get; set; }
    public UserGame UserGame { get; set; } = null!;
    public int Position { get; set; }  // 0-indexed, lower = better
    public DateTime UpdatedAt { get; set; }
}
