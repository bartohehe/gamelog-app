using CloudBackend.Data;
using CloudBackend.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace CloudBackend.Controllers;

[ApiController]
[Route("api/ranks")]
[Authorize]
public class RanksController : ControllerBase
{
    private readonly AppDbContext _db;

    public RanksController(AppDbContext db) => _db = db;

    [HttpGet]
    public async Task<IActionResult> GetAll() =>
        Ok(await _db.Ranks.Include(r => r.PlayerProfile).ToListAsync());

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        var rank = await _db.Ranks
            .Include(r => r.PlayerProfile)
            .FirstOrDefaultAsync(r => r.Id == id);
        return rank == null ? NotFound() : Ok(rank);
    }

    [HttpPost]
    public async Task<IActionResult> Create(Rank rank)
    {
        _db.Ranks.Add(rank);
        await _db.SaveChangesAsync();
        return CreatedAtAction(nameof(GetById), new { id = rank.Id }, rank);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, Rank updated)
    {
        var rank = await _db.Ranks.FindAsync(id);
        if (rank == null) return NotFound();

        rank.Name = updated.Name;
        rank.Tier = updated.Tier;
        rank.Points = updated.Points;

        await _db.SaveChangesAsync();
        return Ok(rank);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var rank = await _db.Ranks.FindAsync(id);
        if (rank == null) return NotFound();

        _db.Ranks.Remove(rank);
        await _db.SaveChangesAsync();
        return NoContent();
    }
}
