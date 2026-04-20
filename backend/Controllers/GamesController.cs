using CloudBackend.DTOs.Games;
using CloudBackend.Services;
using Microsoft.AspNetCore.Mvc;

namespace CloudBackend.Controllers;

[ApiController]
[Route("api/[controller]")]
public class GamesController : ControllerBase
{
    private readonly IRawgService _rawg;

    public GamesController(IRawgService rawg)
    {
        _rawg = rawg;
    }

    [HttpGet("search")]
    public async Task<ActionResult<List<GameDto>>> Search([FromQuery] string q)
    {
        if (string.IsNullOrWhiteSpace(q))
            return BadRequest(new { message = "Query parameter 'q' is required." });

        var results = await _rawg.SearchGamesAsync(q);
        return Ok(results);
    }

    [HttpGet("popular")]
    public async Task<ActionResult<List<GameDto>>> Popular()
    {
        var results = await _rawg.GetPopularGamesAsync();
        return Ok(results);
    }

    [HttpGet("{rawgId:int}")]
    public async Task<ActionResult<GameDto>> GetById(int rawgId)
    {
        var game = await _rawg.GetGameDetailsAsync(rawgId);
        if (game == null) return NotFound();
        return Ok(game);
    }
}
