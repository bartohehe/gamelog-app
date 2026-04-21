using System.Security.Claims;
using CloudBackend.Data;
using CloudBackend.DTOs.Stats;
using CloudBackend.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace CloudBackend.Controllers;

[ApiController]
[Route("api/[controller]")]
public class StatsController : ControllerBase
{
    private readonly AppDbContext _context;

    public StatsController(AppDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    [Authorize]
    public async Task<ActionResult<UserStatsDto>> GetMyStats()
    {
        var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);

        var items = await _context.UserGames
            .Where(ug => ug.UserId == userId)
            .ToListAsync();

        var scored = items.Where(ug => ug.Score.HasValue).ToList();

        return Ok(new UserStatsDto
        {
            TotalGames = items.Count,
            PlannedCount = items.Count(ug => ug.Status == GameStatus.Planned),
            InProgressCount = items.Count(ug => ug.Status == GameStatus.InProgress),
            CompletedCount = items.Count(ug => ug.Status == GameStatus.Completed),
            AbandonedCount = items.Count(ug => ug.Status == GameStatus.Abandoned),
            AverageScore = scored.Any() ? scored.Average(ug => ug.Score!.Value) : null
        });
    }

    [HttpGet("top")]
    public async Task<ActionResult<List<TopGameDto>>> GetTopGames()
    {
        var top = await _context.UserGames
            .Include(ug => ug.Game)
            .Where(ug => ug.Score.HasValue)
            .GroupBy(ug => ug.GameId)
            .Select(g => new TopGameDto
            {
                IgdbId = g.First().Game.IgdbId,
                Title = g.First().Game.Title,
                CoverImageUrl = g.First().Game.CoverImageUrl,
                AverageScore = g.Average(ug => ug.Score!.Value),
                ReviewCount = g.Count()
            })
            .OrderByDescending(t => t.AverageScore)
            .Take(12)
            .ToListAsync();

        return Ok(top);
    }
}
