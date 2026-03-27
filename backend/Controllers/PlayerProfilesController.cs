using System.Security.Claims;
using CloudBackend.Data;
using CloudBackend.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace CloudBackend.Controllers;

[ApiController]
[Route("api/player-profiles")]
[Authorize]
public class PlayerProfilesController : ControllerBase
{
    private readonly AppDbContext _db;

    public PlayerProfilesController(AppDbContext db) => _db = db;

    private int GetUserId() =>
        int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    [HttpGet]
    public async Task<IActionResult> GetAll() =>
        Ok(await _db.PlayerProfiles
            .Include(pp => pp.Game)
            .Where(pp => pp.UserId == GetUserId())
            .ToListAsync());

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        var pp = await _db.PlayerProfiles
            .Include(pp => pp.Game)
            .FirstOrDefaultAsync(pp => pp.Id == id && pp.UserId == GetUserId());
        return pp == null ? NotFound() : Ok(pp);
    }

    [HttpPost]
    public async Task<IActionResult> Create(PlayerProfile profile)
    {
        profile.UserId = GetUserId();
        _db.PlayerProfiles.Add(profile);
        await _db.SaveChangesAsync();
        return CreatedAtAction(nameof(GetById), new { id = profile.Id }, profile);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, PlayerProfile updated)
    {
        var pp = await _db.PlayerProfiles
            .FirstOrDefaultAsync(pp => pp.Id == id && pp.UserId == GetUserId());
        if (pp == null) return NotFound();

        pp.Nickname = updated.Nickname;
        pp.Rank = updated.Rank;
        pp.Region = updated.Region;

        await _db.SaveChangesAsync();
        return Ok(pp);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var pp = await _db.PlayerProfiles
            .FirstOrDefaultAsync(pp => pp.Id == id && pp.UserId == GetUserId());
        if (pp == null) return NotFound();

        _db.PlayerProfiles.Remove(pp);
        await _db.SaveChangesAsync();
        return NoContent();
    }
}
