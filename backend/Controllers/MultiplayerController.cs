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
    private readonly ICacheService _cache;

    public MultiplayerController(AppDbContext db, IRiotService riot, ISteamService steam, ICacheService cache)
    {
        _db = db;
        _riot = riot;
        _steam = steam;
        _cache = cache;
    }

    private int UserId => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

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
        SyncIdentifier = e.SyncIdentifier,
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
            SyncIdentifier = dto.SyncIdentifier,
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
        entry.SyncIdentifier = dto.SyncIdentifier;
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
    /// SyncIdentifier is set to the Riot platform so refresh-all can re-use it.
    /// </summary>
    [HttpPost("sync/lol")]
    public async Task<ActionResult<UpsertMultiplayerEntryDto>> SyncLol([FromBody] SyncLolDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.SummonerName))
            return BadRequest(new { message = "SummonerName is required" });
        try
        {
            var result = await _riot.GetLoLRankAsync(dto.SummonerName.Trim(), dto.Platform);
            result.SyncIdentifier = dto.Platform;
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
            result.SyncIdentifier = dto.SteamId;
            return Ok(result);
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    // ── Refresh-all endpoint ─────────────────────────────────────

    public record RefreshAllResult(List<MultiplayerEntryDto> Entries, List<string> Errors);

    /// <summary>
    /// Re-fetches rank/stats from Riot/Steam for every entry that has a SyncIdentifier.
    /// Rate-limited to once per 5 minutes via Redis cooldown key.
    /// </summary>
    [HttpPost("refresh-all")]
    public async Task<ActionResult<RefreshAllResult>> RefreshAll()
    {
        var cooldownKey = $"multiplayer:refresh-cooldown:{UserId}";

        if (await _cache.ExistsAsync(cooldownKey))
            return StatusCode(429, new { message = "Odświeżanie jest możliwe raz na 5 minut. Spróbuj ponownie za chwilę." });

        var entries = await _db.MultiplayerEntries
            .Where(e => e.UserId == UserId)
            .ToListAsync();

        var errors = new List<string>();

        foreach (var entry in entries)
        {
            if (string.IsNullOrEmpty(entry.InGameUsername) || string.IsNullOrEmpty(entry.SyncIdentifier))
                continue;

            try
            {
                UpsertMultiplayerEntryDto fresh;

                if (entry.GameTitle == "League of Legends")
                {
                    fresh = await _riot.GetLoLRankAsync(entry.InGameUsername, entry.SyncIdentifier);
                }
                else if (entry.GameTitle == "Counter-Strike 2")
                {
                    fresh = await _steam.GetCs2StatsAsync(entry.SyncIdentifier);
                }
                else
                {
                    continue;
                }

                entry.Tier = fresh.Tier;
                entry.Rank = fresh.Rank;
                entry.RankPoints = fresh.RankPoints;
                entry.RankPointsMax = fresh.RankPointsMax;
                entry.WinRate = fresh.WinRate;
                entry.KdRatio = fresh.KdRatio;
                entry.HoursPlayed = fresh.HoursPlayed;
                entry.UpdatedAt = DateTime.UtcNow;
            }
            catch (Exception ex)
            {
                errors.Add($"{entry.GameTitle}: {ex.Message}");
            }
        }

        await _db.SaveChangesAsync();

        // Set cooldown AFTER saving so a failed run doesn't block the user
        await _cache.SetAsync(cooldownKey, true, TimeSpan.FromMinutes(5));

        var updated = await _db.MultiplayerEntries
            .Where(e => e.UserId == UserId)
            .OrderBy(e => e.GameTitle)
            .ToListAsync();

        return Ok(new RefreshAllResult(updated.Select(Map).ToList(), errors));
    }
}
