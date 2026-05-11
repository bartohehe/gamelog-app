namespace CloudBackend.Models;

public class UserMedia
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public User User { get; set; } = null!;

    public string Title { get; set; } = string.Empty;
    public MediaType Type { get; set; }
    public int Year { get; set; }
    public string Genres { get; set; } = string.Empty; // comma-separated
    public string Creator { get; set; } = string.Empty;
    public MediaWatchStatus Status { get; set; }
    public int? Score { get; set; }
    public string? Runtime { get; set; }       // e.g. "2h 46m" — films only
    public int? Episodes { get; set; }         // total episodes — serial/anime
    public int? WatchedEpisodes { get; set; }  // progress — serial/anime
    public string? CoverImageUrl { get; set; }
    public string Review { get; set; } = string.Empty;

    public DateTime AddedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}
