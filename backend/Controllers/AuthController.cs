using CloudBackend.Models;
using CloudBackend.Services;
using Microsoft.AspNetCore.Mvc;

namespace CloudBackend.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
    private readonly AuthService _auth;

    public AuthController(AuthService auth) => _auth = auth;

    [HttpPost("register")]
    public async Task<IActionResult> Register(RegisterDto dto)
    {
        var user = await _auth.RegisterAsync(dto.Email, dto.Username, dto.Password);
        if (user == null)
            return BadRequest(new { message = "Email already in use" });

        var token = _auth.GenerateToken(user);
        return Ok(new AuthResponseDto(token, user.Username, user.Id));
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login(LoginDto dto)
    {
        var user = await _auth.LoginAsync(dto.Email, dto.Password);
        if (user == null)
            return Unauthorized(new { message = "Invalid credentials" });

        var token = _auth.GenerateToken(user);
        return Ok(new AuthResponseDto(token, user.Username, user.Id));
    }

    [HttpPost("refresh")]
    public IActionResult Refresh() => Ok(new { message = "Token refresh not required for stateless JWT" });
}
