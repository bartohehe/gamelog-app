namespace CloudBackend.DTOs.Stats;

public class TopGameDto
{
    public int IgdbId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string CoverImageUrl { get; set; } = string.Empty;
    public double AverageScore { get; set; }
    public int ReviewCount { get; set; }
}
