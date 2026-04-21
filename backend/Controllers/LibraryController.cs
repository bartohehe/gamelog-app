using System.Security.Claims;
using CloudBackend.Data;
using CloudBackend.DTOs.Library;
using CloudBackend.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace CloudBackend.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class LibraryController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly IIgdbService _igdb;

    public LibraryController(AppDbContext context, IIgdbService igdb)
    {
        _context = context;
        _igdb = igdb;
    }

    private int GetUserId() =>
        int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);

    [HttpGet]
    public async Task<ActionResult<List<UserGameDto>>> GetLibrary()
    {
        var userId = GetUserId();
        var items = await _context.UserGames
            .Include(ug => ug.Game)
            .Where(ug => ug.UserId == userId)
            .OrderByDescending(ug => ug.UpdatedAt)
            .Select(ug => new UserGameDto
            {
                Id = ug.Id,
                IgdbId = ug.Game.IgdbId,
                Title = ug.Game.Title,
                CoverImageUrl = ug.Game.CoverImageUrl,
                Status = ug.Status,
                Platform = ug.Platform,
                Score = ug.Score,
                Review = ug.Review,
                AddedAt = ug.AddedAt,
                UpdatedAt = ug.UpdatedAt
            })
            .ToListAsync();
        return Ok(items);
    }

    [HttpPost]
    public async Task<ActionResult<UserGameDto>> AddToLibrary(AddToLibraryDto dto)
    {
        var userId = GetUserId();
        var game = await _igdb.GetOrCreateCachedGameAsync(dto.IgdbId);

        var exists = await _context.UserGames
            .AnyAsync(ug => ug.UserId == userId && ug.GameId == game.Id);
        if (exists)
            return Conflict(new { message = "Game already in library." });

        var userGame = new CloudBackend.Models.UserGame
        {
            UserId = userId,
            GameId = game.Id,
            Status = dto.Status,
            Platform = dto.Platform,
            AddedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        _context.UserGames.Add(userGame);
        await _context.SaveChangesAsync();

        return Ok(new UserGameDto
        {
            Id = userGame.Id,
            IgdbId = game.IgdbId,
            Title = game.Title,
            CoverImageUrl = game.CoverImageUrl,
            Status = userGame.Status,
            Platform = userGame.Platform,
            AddedAt = userGame.AddedAt,
            UpdatedAt = userGame.UpdatedAt
        });
    }

    [HttpPut("{id:int}")]
    public async Task<ActionResult<UserGameDto>> UpdateLibraryItem(int id, UpdateLibraryItemDto dto)
    {
        var userId = GetUserId();
        var item = await _context.UserGames
            .Include(ug => ug.Game)
            .FirstOrDefaultAsync(ug => ug.Id == id && ug.UserId == userId);
        if (item == null) return NotFound();

        item.Status = dto.Status;
        item.Platform = dto.Platform;
        item.Score = dto.Score;
        item.Review = dto.Review;
        item.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        return Ok(new UserGameDto
        {
            Id = item.Id,
            IgdbId = item.Game.IgdbId,
            Title = item.Game.Title,
            CoverImageUrl = item.Game.CoverImageUrl,
            Status = item.Status,
            Platform = item.Platform,
            Score = item.Score,
            Review = item.Review,
            AddedAt = item.AddedAt,
            UpdatedAt = item.UpdatedAt
        });
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> RemoveFromLibrary(int id)
    {
        var userId = GetUserId();
        var item = await _context.UserGames
            .FirstOrDefaultAsync(ug => ug.Id == id && ug.UserId == userId);
        if (item == null) return NotFound();
        _context.UserGames.Remove(item);
        await _context.SaveChangesAsync();
        return NoContent();
    }
}
