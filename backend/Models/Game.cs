namespace CloudBackend.Models;

public class Game
{
    public int Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Genre { get; set; }
    public DateTime? ReleaseDate { get; set; }
    public string? CoverUrl { get; set; }
    public string GameMode { get; set; } = "singleplayer"; // singleplayer | multiplayer | both
    public string? RawgId { get; set; }

    public ICollection<UserGame> UserGames { get; set; } = new List<UserGame>();
}
