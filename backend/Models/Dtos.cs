namespace CloudBackend.Models;

public record RegisterDto(string Email, string Username, string Password);
public record LoginDto(string Email, string Password);
public record AuthResponseDto(string Token, string Username, int UserId);
public record UpdateUserDto(string? Username, string? Email);
