using CloudBackend.DTOs.Games;
using CloudBackend.Models;

namespace CloudBackend.Services;

public interface IIgdbService
{
    Task<List<GameDto>> SearchGamesAsync(string query);
    Task<GameDto?> GetGameDetailsAsync(int igdbId);
    Task<List<GameDto>> GetPopularGamesAsync();
    Task<Game> GetOrCreateCachedGameAsync(int igdbId);
}
