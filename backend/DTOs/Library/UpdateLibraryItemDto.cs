using CloudBackend.Models;

namespace CloudBackend.DTOs.Library;

public class UpdateLibraryItemDto
{
    public GameStatus Status { get; set; }
    public string Platform { get; set; } = string.Empty;
    public int? Score { get; set; }
    public string? Review { get; set; }
}
