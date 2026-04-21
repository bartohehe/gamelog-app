namespace CloudBackend.Models;

public class Game
{
    public int Id { get; set; }
    public int IgdbId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string CoverImageUrl { get; set; } = string.Empty;
    public int? ReleaseYear { get; set; }
    public string Genres { get; set; } = "[]";
    public ICollection<UserGame> UserGames { get; set; } = new List<UserGame>();
}
