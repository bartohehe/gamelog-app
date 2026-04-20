using CloudBackend.DTOs.Games;
using CloudBackend.Models;

namespace CloudBackend.Services;

public interface IRawgService
{
    Task<List<GameDto>> SearchGamesAsync(string query);
    Task<GameDto?> GetGameDetailsAsync(int rawgId);
    Task<List<GameDto>> GetPopularGamesAsync();
    Task<Game> GetOrCreateCachedGameAsync(int rawgId);
}
