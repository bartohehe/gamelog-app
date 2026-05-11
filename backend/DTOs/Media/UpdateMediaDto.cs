using CloudBackend.Models;

namespace CloudBackend.DTOs.Media;

public class UpdateMediaDto
{
    public MediaWatchStatus Status { get; set; }
    public int? Score { get; set; }
    public int? WatchedEpisodes { get; set; }
    public string Review { get; set; } = string.Empty;
}
