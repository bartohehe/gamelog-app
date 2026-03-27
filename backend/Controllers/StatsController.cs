using System.Security.Claims;
using CloudBackend.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace CloudBackend.Controllers;

[ApiController]
[Route("api/stats")]
[Authorize]
public class StatsController : ControllerBase
{
    private readonly AppDbContext _db;

    public StatsController(AppDbContext db) => _db = db;

    private int GetUserId() =>
        int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    [HttpGet("summary")]
    public async Task<IActionResult> Summary()
    {
        var userId = GetUserId();
        var userGames = await _db.UserGames.Where(ug => ug.UserId == userId).ToListAsync();
        return Ok(new
        {
            TotalGames = userGames.Count,
            Completed = userGames.Count(ug => ug.Status == "completed"),
            Playing = userGames.Count(ug => ug.Status == "playing"),
            Backlog = userGames.Count(ug => ug.Status == "backlog"),
            Dropped = userGames.Count(ug => ug.Status == "dropped")
        });
    }

    [HttpGet("genres")]
    public async Task<IActionResult> Genres()
    {
        var userId = GetUserId();
        var genres = await _db.UserGames
            .Include(ug => ug.Game)
            .Where(ug => ug.UserId == userId)
            .GroupBy(ug => ug.Game.Genre ?? "Unknown")
            .Select(g => new { Genre = g.Key, Count = g.Count() })
            .OrderByDescending(g => g.Count)
            .ToListAsync();
        return Ok(genres);
    }

    [HttpGet("hours")]
    public IActionResult Hours()
    {
        // Steam API integration point – returns placeholder
        return Ok(new { TotalHours = 0, Message = "Connect Steam API key for real hours" });
    }

    [HttpGet("ratings")]
    public async Task<IActionResult> Ratings()
    {
        var userId = GetUserId();
        var ratings = await _db.UserGames
            .Where(ug => ug.UserId == userId && ug.Rating.HasValue)
            .Select(ug => ug.Rating!.Value)
            .ToListAsync();

        return Ok(new
        {
            Average = ratings.Count > 0 ? Math.Round(ratings.Average(), 1) : 0,
            Count = ratings.Count,
            Distribution = Enumerable.Range(0, 10)
                .Select(i => new
                {
                    Range = $"{i * 10}-{i * 10 + 9}",
                    Count = ratings.Count(r => r >= i * 10 && r <= i * 10 + 9)
                })
        });
    }
}
