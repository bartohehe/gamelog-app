namespace CloudBackend.DTOs.Games;

public class GameDto
{
    public int IgdbId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string CoverImageUrl { get; set; } = string.Empty;
    public int? ReleaseYear { get; set; }
    public List<string> Genres { get; set; } = new();
}
