namespace CloudBackend.Models;

public class User
{
    public int Id { get; set; }
    public string Email { get; set; } = string.Empty;
    public string Username { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public ICollection<UserGame> UserGames { get; set; } = new List<UserGame>();
    public ICollection<PlayerProfile> PlayerProfiles { get; set; } = new List<PlayerProfile>();
}
