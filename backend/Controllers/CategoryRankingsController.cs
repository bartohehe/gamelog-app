using System.Security.Claims;
using CloudBackend.Data;
using CloudBackend.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace CloudBackend.Controllers;

[ApiController]
[Route("api/categoryRankings")]
[Authorize]
public class CategoryRankingsController : ControllerBase
{
    private readonly AppDbContext _context;

    public CategoryRankingsController(AppDbContext context)
    {
        _context = context;
    }

    private int GetUserId() =>
        int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);

    // GET /api/categoryRankings
    // Returns all rankings for the current user as a dictionary keyed by categoryId.
    [HttpGet]
    public async Task<ActionResult<Dictionary<string, List<CategoryRankingItemDto>>>> GetAll()
    {
        var userId = GetUserId();
        var rankings = await _context.CategoryRankings
            .Where(r => r.UserId == userId)
            .Include(r => r.UserGame)
                .ThenInclude(ug => ug.Game)
            .OrderBy(r => r.Position)
            .ToListAsync();

        var grouped = rankings
            .GroupBy(r => r.CategoryId)
            .ToDictionary(
                g => g.Key,
                g => g.Select(r => new CategoryRankingItemDto(
                    r.UserGameId,
                    r.UserGame.Game.IgdbId,
                    r.UserGame.Game.Title,
                    r.UserGame.Game.CoverImageUrl,
                    r.Position
                )).ToList()
            );

        return Ok(grouped);
    }

    // GET /api/categoryRankings/{categoryId}
    // Returns the ranking for a specific category, sorted by position ascending.
    [HttpGet("{categoryId}")]
    public async Task<ActionResult<List<CategoryRankingItemDto>>> GetByCategory(string categoryId)
    {
        var userId = GetUserId();
        var rankings = await _context.CategoryRankings
            .Where(r => r.UserId == userId && r.CategoryId == categoryId)
            .Include(r => r.UserGame)
                .ThenInclude(ug => ug.Game)
            .OrderBy(r => r.Position)
            .ToListAsync();

        var result = rankings.Select(r => new CategoryRankingItemDto(
            r.UserGameId,
            r.UserGame.Game.IgdbId,
            r.UserGame.Game.Title,
            r.UserGame.Game.CoverImageUrl,
            r.Position
        )).ToList();

        return Ok(result);
    }

    // PUT /api/categoryRankings/{categoryId}
    // Replaces the entire ranking for a category. Body: list of UserGameIds ordered best-to-worst.
    [HttpPut("{categoryId}")]
    public async Task<IActionResult> UpdateCategory(string categoryId, [FromBody] UpdateCategoryRankingDto dto)
    {
        var userId = GetUserId();

        // Remove existing entries for this (userId, categoryId)
        var existing = await _context.CategoryRankings
            .Where(r => r.UserId == userId && r.CategoryId == categoryId)
            .ToListAsync();
        _context.CategoryRankings.RemoveRange(existing);

        // Insert new entries with position = index (0 = best)
        var now = DateTime.UtcNow;
        for (var i = 0; i < dto.UserGameIds.Count; i++)
        {
            _context.CategoryRankings.Add(new CategoryRanking
            {
                UserId = userId,
                CategoryId = categoryId,
                UserGameId = dto.UserGameIds[i],
                Position = i,
                UpdatedAt = now,
            });
        }

        await _context.SaveChangesAsync();
        return Ok();
    }
}

public record CategoryRankingItemDto(
    int UserGameId,
    int IgdbId,
    string Title,
    string CoverImageUrl,
    int Position
);

public record UpdateCategoryRankingDto(List<int> UserGameIds);
