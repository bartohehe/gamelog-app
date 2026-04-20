using CloudBackend.DTOs.Auth;
using CloudBackend.Models;

namespace CloudBackend.Services;

public interface IAuthService
{
    Task<AuthResponseDto?> RegisterAsync(RegisterDto dto);
    Task<AuthResponseDto?> LoginAsync(LoginDto dto);
    string GenerateToken(User user);
}
