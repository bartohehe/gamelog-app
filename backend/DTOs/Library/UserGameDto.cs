using CloudBackend.Models;

namespace CloudBackend.DTOs.Library;

public class UserGameDto
{
    public int Id { get; set; }
    public int RawgId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string CoverImageUrl { get; set; } = string.Empty;
    public GameStatus Status { get; set; }
    public string Platform { get; set; } = string.Empty;
    public int? Score { get; set; }
    public string? Review { get; set; }
    public DateTime AddedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}
