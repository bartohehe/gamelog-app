using System.Security.Claims;
using CloudBackend.Data;
using CloudBackend.DTOs.Multiplayer;
using CloudBackend.Models;
using CloudBackend.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace CloudBackend.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class MultiplayerController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly IRiotService _riot;
    private readonly ISteamService _steam;

    public MultiplayerController(AppDbContext db, IRiotService riot, ISteamService steam)
    {
        _db = db;
        _riot = riot;
        _steam = steam;
    }

    private int UserId => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    [HttpGet("config-check")]
    public ActionResult ConfigCheck([FromServices] IConfiguration cfg) => Ok(new
    {
        riotKeyLength  = (cfg["Riot:ApiKey"]  ?? "").Length,
        riotKeyPrefix  = (cfg["Riot:ApiKey"]  ?? "").Length > 5 ? cfg["Riot:ApiKey"]![..5] : "EMPTY",
        steamKeyLength = (cfg["Steam:ApiKey"] ?? "").Length,
        steamKeyPrefix = (cfg["Steam:ApiKey"] ?? "").Length > 5 ? cfg["Steam:ApiKey"]![..5] : "EMPTY",
    });

    private static MultiplayerEntryDto Map(MultiplayerEntry e) => new()
    {
        Id = e.Id,
        GameTitle = e.GameTitle,
        Mode = e.Mode,
        Tier = e.Tier,
        Rank = e.Rank,
        RankPoints = e.RankPoints,
        RankPointsMax = e.RankPointsMax,
        WinRate = e.WinRate,
        KdRatio = e.KdRatio,
        HoursPlayed = e.HoursPlayed,
        Platform = e.Platform,
        InGameUsername = e.InGameUsername,
        UpdatedAt = e.UpdatedAt,
    };

    [HttpGet]
    public async Task<ActionResult<List<MultiplayerEntryDto>>> GetAll()
    {
        var entries = await _db.MultiplayerEntries
            .Where(e => e.UserId == UserId)
            .OrderBy(e => e.GameTitle)
            .ToListAsync();
        return Ok(entries.Select(Map));
    }

    [HttpPost]
    public async Task<ActionResult<MultiplayerEntryDto>> Create([FromBody] UpsertMultiplayerEntryDto dto)
    {
        var entry = new MultiplayerEntry
        {
            UserId = UserId,
            GameTitle = dto.GameTitle,
            Mode = dto.Mode,
            Tier = dto.Tier,
            Rank = dto.Rank,
            RankPoints = dto.RankPoints,
            RankPointsMax = dto.RankPointsMax,
            WinRate = dto.WinRate,
            KdRatio = dto.KdRatio,
            HoursPlayed = dto.HoursPlayed,
            Platform = dto.Platform,
            InGameUsername = dto.InGameUsername,
            UpdatedAt = DateTime.UtcNow,
        };
        _db.MultiplayerEntries.Add(entry);
        await _db.SaveChangesAsync();
        return CreatedAtAction(nameof(GetAll), Map(entry));
    }

    [HttpPut("{id:int}")]
    public async Task<ActionResult<MultiplayerEntryDto>> Update(int id, [FromBody] UpsertMultiplayerEntryDto dto)
    {
        var entry = await _db.MultiplayerEntries.FirstOrDefaultAsync(e => e.Id == id && e.UserId == UserId);
        if (entry == null) return NotFound();

        entry.GameTitle = dto.GameTitle;
        entry.Mode = dto.Mode;
        entry.Tier = dto.Tier;
        entry.Rank = dto.Rank;
        entry.RankPoints = dto.RankPoints;
        entry.RankPointsMax = dto.RankPointsMax;
        entry.WinRate = dto.WinRate;
        entry.KdRatio = dto.KdRatio;
        entry.HoursPlayed = dto.HoursPlayed;
        entry.Platform = dto.Platform;
        entry.InGameUsername = dto.InGameUsername;
        entry.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync();
        return Ok(Map(entry));
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var entry = await _db.MultiplayerEntries.FirstOrDefaultAsync(e => e.Id == id && e.UserId == UserId);
        if (entry == null) return NotFound();
        _db.MultiplayerEntries.Remove(entry);
        await _db.SaveChangesAsync();
        return NoContent();
    }

    // ── Sync endpoints ──────────────────────────────────────────

    public record SyncLolDto(string SummonerName, string Platform = "eun1");
    public record SyncSteamDto(string SteamId);

    /// <summary>
    /// Fetches LoL rank from Riot API and returns pre-filled DTO (does NOT save).
    /// Frontend can then confirm + save via POST /api/multiplayer.
    /// </summary>
    [HttpPost("sync/lol")]
    public async Task<ActionResult<UpsertMultiplayerEntryDto>> SyncLol([FromBody] SyncLolDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.SummonerName))
            return BadRequest(new { message = "SummonerName is required" });
        try
        {
            var result = await _riot.GetLoLRankAsync(dto.SummonerName.Trim(), dto.Platform);
            return Ok(result);
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPost("sync/cs2")]
    public async Task<ActionResult<UpsertMultiplayerEntryDto>> SyncCs2([FromBody] SyncSteamDto dto)
    {
        try
        {
            var result = await _steam.GetCs2StatsAsync(dto.SteamId);
            return Ok(result);
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }
}
