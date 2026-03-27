using CloudBackend.Data;
using CloudBackend.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace CloudBackend.Controllers;

[ApiController]
[Route("api/multiplayer-games")]
public class MultiplayerGamesController : ControllerBase
{
    private readonly AppDbContext _db;

    public MultiplayerGamesController(AppDbContext db) => _db = db;

    [HttpGet]
    public async Task<IActionResult> GetAll() =>
        Ok(await _db.MultiplayerGames.ToListAsync());

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        var game = await _db.MultiplayerGames.FindAsync(id);
        return game == null ? NotFound() : Ok(game);
    }

    [HttpPost]
    [Authorize]
    public async Task<IActionResult> Create(MultiplayerGame game)
    {
        _db.MultiplayerGames.Add(game);
        await _db.SaveChangesAsync();
        return CreatedAtAction(nameof(GetById), new { id = game.Id }, game);
    }

    [HttpPut("{id}")]
    [Authorize]
    public async Task<IActionResult> Update(int id, MultiplayerGame updated)
    {
        var game = await _db.MultiplayerGames.FindAsync(id);
        if (game == null) return NotFound();

        game.Title = updated.Title;
        game.Genre = updated.Genre;
        game.ReleaseDate = updated.ReleaseDate;
        game.CoverUrl = updated.CoverUrl;
        game.ApiSource = updated.ApiSource;
        game.ExternalId = updated.ExternalId;

        await _db.SaveChangesAsync();
        return Ok(game);
    }

    [HttpDelete("{id}")]
    [Authorize]
    public async Task<IActionResult> Delete(int id)
    {
        var game = await _db.MultiplayerGames.FindAsync(id);
        if (game == null) return NotFound();

        _db.MultiplayerGames.Remove(game);
        await _db.SaveChangesAsync();
        return NoContent();
    }
}
