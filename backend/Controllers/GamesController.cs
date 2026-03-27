using CloudBackend.Data;
using CloudBackend.Models;
using CloudBackend.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace CloudBackend.Controllers;

[ApiController]
[Route("api/games")]
public class GamesController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly RawgService _rawg;

    public GamesController(AppDbContext db, RawgService rawg)
    {
        _db = db;
        _rawg = rawg;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll() =>
        Ok(await _db.Games.ToListAsync());

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        var game = await _db.Games.FindAsync(id);
        return game == null ? NotFound() : Ok(game);
    }

    [HttpPost]
    [Authorize]
    public async Task<IActionResult> Create(Game game)
    {
        _db.Games.Add(game);
        await _db.SaveChangesAsync();
        return CreatedAtAction(nameof(GetById), new { id = game.Id }, game);
    }

    [HttpPut("{id}")]
    [Authorize]
    public async Task<IActionResult> Update(int id, Game updated)
    {
        var game = await _db.Games.FindAsync(id);
        if (game == null) return NotFound();

        game.Title = updated.Title;
        game.Genre = updated.Genre;
        game.ReleaseDate = updated.ReleaseDate;
        game.CoverUrl = updated.CoverUrl;
        game.GameMode = updated.GameMode;
        game.RawgId = updated.RawgId;

        await _db.SaveChangesAsync();
        return Ok(game);
    }

    [HttpDelete("{id}")]
    [Authorize]
    public async Task<IActionResult> Delete(int id)
    {
        var game = await _db.Games.FindAsync(id);
        if (game == null) return NotFound();

        _db.Games.Remove(game);
        await _db.SaveChangesAsync();
        return NoContent();
    }

    [HttpGet("search")]
    public async Task<IActionResult> Search([FromQuery] string q)
    {
        if (string.IsNullOrWhiteSpace(q))
            return BadRequest(new { message = "Query parameter 'q' is required" });

        // Search local DB first
        var local = await _db.Games
            .Where(g => g.Title.Contains(q))
            .ToListAsync();

        if (local.Count > 0)
            return Ok(local);

        // Fall back to RAWG API
        var results = await _rawg.SearchGamesAsync(q);
        return Ok(results);
    }
}
