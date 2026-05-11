using CloudBackend.DTOs.Media;

namespace CloudBackend.Services;

public interface IJikanService
{
    Task<List<MediaSearchResultDto>> SearchAsync(string query);
}
