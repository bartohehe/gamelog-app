using System.Security.Claims;
using CloudBackend.Data;
using CloudBackend.DTOs.Media;
using CloudBackend.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace CloudBackend.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class MediaController : ControllerBase
{
    private readonly AppDbContext _context;

    public MediaController(AppDbContext context)
    {
        _context = context;
    }

    private int GetUserId() =>
        int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);

    private static UserMediaDto ToDto(UserMedia m) => new()
    {
        Id = m.Id,
        Title = m.Title,
        Type = m.Type,
        Year = m.Year,
        Genres = m.Genres.Length > 0
            ? [.. m.Genres.Split(',', StringSplitOptions.RemoveEmptyEntries)]
            : [],
        Creator = m.Creator,
        Status = m.Status,
        Score = m.Score,
        Runtime = m.Runtime,
        Episodes = m.Episodes,
        WatchedEpisodes = m.WatchedEpisodes,
        CoverImageUrl = m.CoverImageUrl,
        Review = m.Review,
        AddedAt = m.AddedAt,
        UpdatedAt = m.UpdatedAt,
    };

    [HttpGet]
    public async Task<ActionResult<List<UserMediaDto>>> GetMedia()
    {
        var userId = GetUserId();
        var items = await _context.UserMedia
            .Where(m => m.UserId == userId)
            .OrderByDescending(m => m.UpdatedAt)
            .ToListAsync();
        return Ok(items.Select(ToDto).ToList());
    }

    [HttpPost]
    public async Task<ActionResult<UserMediaDto>> AddMedia(AddMediaDto dto)
    {
        var userId = GetUserId();

        var exists = await _context.UserMedia
            .AnyAsync(m => m.UserId == userId && m.Title == dto.Title && m.Type == dto.Type);
        if (exists)
            return Conflict(new { message = "Media already in your library." });

        var item = new UserMedia
        {
            UserId = userId,
            Title = dto.Title,
            Type = dto.Type,
            Year = dto.Year,
            Genres = string.Join(',', dto.Genres),
            Creator = dto.Creator,
            Status = dto.Status,
            Score = dto.Score,
            Runtime = dto.Runtime,
            Episodes = dto.Episodes,
            WatchedEpisodes = dto.WatchedEpisodes,
            CoverImageUrl = dto.CoverImageUrl,
            Review = dto.Review,
            AddedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
        };
        _context.UserMedia.Add(item);
        await _context.SaveChangesAsync();
        return Ok(ToDto(item));
    }

    [HttpPut("{id:int}")]
    public async Task<ActionResult<UserMediaDto>> UpdateMedia(int id, UpdateMediaDto dto)
    {
        var userId = GetUserId();
        var item = await _context.UserMedia
            .FirstOrDefaultAsync(m => m.Id == id && m.UserId == userId);
        if (item == null) return NotFound();

        item.Status = dto.Status;
        item.Score = dto.Score;
        item.WatchedEpisodes = dto.WatchedEpisodes;
        item.Review = dto.Review;
        item.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();
        return Ok(ToDto(item));
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> RemoveMedia(int id)
    {
        var userId = GetUserId();
        var item = await _context.UserMedia
            .FirstOrDefaultAsync(m => m.Id == id && m.UserId == userId);
        if (item == null) return NotFound();
        _context.UserMedia.Remove(item);
        await _context.SaveChangesAsync();
        return NoContent();
    }
}
