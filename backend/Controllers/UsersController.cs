using System.Security.Claims;
using CloudBackend.Data;
using CloudBackend.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace CloudBackend.Controllers;

[ApiController]
[Route("api/users")]
[Authorize]
public class UsersController : ControllerBase
{
    private readonly AppDbContext _db;

    public UsersController(AppDbContext db) => _db = db;

    private int GetUserId() =>
        int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    [HttpGet("me")]
    public async Task<IActionResult> GetMe()
    {
        var user = await _db.Users.FindAsync(GetUserId());
        if (user == null) return NotFound();
        return Ok(new { user.Id, user.Email, user.Username, user.CreatedAt });
    }

    [HttpPut("me")]
    public async Task<IActionResult> UpdateMe(UpdateUserDto dto)
    {
        var user = await _db.Users.FindAsync(GetUserId());
        if (user == null) return NotFound();

        if (dto.Username != null) user.Username = dto.Username;
        if (dto.Email != null) user.Email = dto.Email;

        await _db.SaveChangesAsync();
        return Ok(new { user.Id, user.Email, user.Username });
    }

    [HttpDelete("me")]
    public async Task<IActionResult> DeleteMe()
    {
        var user = await _db.Users.FindAsync(GetUserId());
        if (user == null) return NotFound();

        _db.Users.Remove(user);
        await _db.SaveChangesAsync();
        return NoContent();
    }
}
