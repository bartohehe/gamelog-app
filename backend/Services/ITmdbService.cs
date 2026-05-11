using CloudBackend.DTOs.Media;

namespace CloudBackend.Services;

public interface ITmdbService
{
    Task<List<MediaSearchResultDto>> SearchAsync(string query, string type);
}
