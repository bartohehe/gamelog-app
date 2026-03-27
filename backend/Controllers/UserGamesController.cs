using System.Security.Claims;
using CloudBackend.Data;
using CloudBackend.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace CloudBackend.Controllers;

[ApiController]
[Route("api/usergames")]
[Authorize]
public class UserGamesController : ControllerBase
{
    private readonly AppDbContext _db;

    public UserGamesController(AppDbContext db) => _db = db;

    private int GetUserId() =>
        int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    [HttpGet]
    public async Task<IActionResult> GetAll() =>
        Ok(await _db.UserGames
            .Include(ug => ug.Game)
            .Where(ug => ug.UserId == GetUserId())
            .ToListAsync());

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        var ug = await _db.UserGames
            .Include(ug => ug.Game)
            .FirstOrDefaultAsync(ug => ug.Id == id && ug.UserId == GetUserId());
        return ug == null ? NotFound() : Ok(ug);
    }

    [HttpPost]
    public async Task<IActionResult> Create(UserGame userGame)
    {
        userGame.UserId = GetUserId();
        userGame.AddedAt = DateTime.UtcNow;
        _db.UserGames.Add(userGame);
        await _db.SaveChangesAsync();
        return CreatedAtAction(nameof(GetById), new { id = userGame.Id }, userGame);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, UserGame updated)
    {
        var ug = await _db.UserGames
            .FirstOrDefaultAsync(ug => ug.Id == id && ug.UserId == GetUserId());
        if (ug == null) return NotFound();

        ug.Status = updated.Status;
        ug.Rating = updated.Rating;
        ug.Notes = updated.Notes;
        ug.Platform = updated.Platform;

        await _db.SaveChangesAsync();
        return Ok(ug);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var ug = await _db.UserGames
            .FirstOrDefaultAsync(ug => ug.Id == id && ug.UserId == GetUserId());
        if (ug == null) return NotFound();

        _db.UserGames.Remove(ug);
        await _db.SaveChangesAsync();
        return NoContent();
    }
}
