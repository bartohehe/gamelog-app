namespace CloudBackend.Models;

public class Rank
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Tier { get; set; }
    public int Points { get; set; }
    public int PlayerProfileId { get; set; }
    public PlayerProfile PlayerProfile { get; set; } = null!;
}
