using CloudBackend.DTOs.Games;
using CloudBackend.Services;
using Microsoft.AspNetCore.Mvc;

namespace CloudBackend.Controllers;

[ApiController]
[Route("api/[controller]")]
public class GamesController : ControllerBase
{
    private readonly IIgdbService _igdb;

    public GamesController(IIgdbService igdb)
    {
        _igdb = igdb;
    }

    [HttpGet("search")]
    public async Task<ActionResult<List<GameDto>>> Search([FromQuery] string q)
    {
        if (string.IsNullOrWhiteSpace(q))
            return BadRequest(new { message = "Query parameter 'q' is required." });
        return Ok(await _igdb.SearchGamesAsync(q));
    }

    [HttpGet("popular")]
    public async Task<ActionResult<List<GameDto>>> Popular()
        => Ok(await _igdb.GetPopularGamesAsync());

    [HttpGet("{igdbId:int}")]
    public async Task<ActionResult<GameDto>> GetById(int igdbId)
    {
        var game = await _igdb.GetGameDetailsAsync(igdbId);
        if (game == null) return NotFound();
        return Ok(game);
    }
}
