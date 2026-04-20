using CloudBackend.Models;

namespace CloudBackend.DTOs.Library;

public class AddToLibraryDto
{
    public int RawgId { get; set; }
    public GameStatus Status { get; set; }
    public string Platform { get; set; } = string.Empty;
}
