using CloudBackend.Models;

namespace CloudBackend.DTOs.Media;

public class AddMediaDto
{
    public string Title { get; set; } = string.Empty;
    public MediaType Type { get; set; }
    public int Year { get; set; }
    public List<string> Genres { get; set; } = [];
    public string Creator { get; set; } = string.Empty;
    public MediaWatchStatus Status { get; set; }
    public int? Score { get; set; }
    public string? Runtime { get; set; }
    public int? Episodes { get; set; }
    public int? WatchedEpisodes { get; set; }
    public string? CoverImageUrl { get; set; }
    public string Review { get; set; } = string.Empty;
}
