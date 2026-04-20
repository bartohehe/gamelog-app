using CloudBackend.Data;
using CloudBackend.DTOs.Auth;
using CloudBackend.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;

namespace TaskManager.Tests;

public class AuthServiceTests
{
    private static AppDbContext CreateDb()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        return new AppDbContext(options);
    }

    private static IAuthService CreateService(AppDbContext db)
    {
        var config = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["JwtSettings:Secret"] = "test-secret-key-minimum-32-characters!!"
            })
            .Build();
        return new AuthService(db, config);
    }

    [Fact]
    public async Task Register_WithNewEmail_ReturnsToken()
    {
        var db = CreateDb();
        var svc = CreateService(db);

        var result = await svc.RegisterAsync(new RegisterDto
        {
            Username = "testuser",
            Email = "test@example.com",
            Password = "password123"
        });

        Assert.NotNull(result);
        Assert.False(string.IsNullOrEmpty(result.Token));
        Assert.Equal("testuser", result.Username);
    }

    [Fact]
    public async Task Register_WithDuplicateEmail_ReturnsNull()
    {
        var db = CreateDb();
        var svc = CreateService(db);

        await svc.RegisterAsync(new RegisterDto
        {
            Username = "user1",
            Email = "dup@example.com",
            Password = "pass"
        });

        var result = await svc.RegisterAsync(new RegisterDto
        {
            Username = "user2",
            Email = "dup@example.com",
            Password = "pass"
        });

        Assert.Null(result);
    }

    [Fact]
    public async Task Login_WithValidCredentials_ReturnsToken()
    {
        var db = CreateDb();
        var svc = CreateService(db);

        await svc.RegisterAsync(new RegisterDto
        {
            Username = "loginuser",
            Email = "login@example.com",
            Password = "mypassword"
        });

        var result = await svc.LoginAsync(new LoginDto
        {
            Email = "login@example.com",
            Password = "mypassword"
        });

        Assert.NotNull(result);
        Assert.False(string.IsNullOrEmpty(result.Token));
    }

    [Fact]
    public async Task Login_WithWrongPassword_ReturnsNull()
    {
        var db = CreateDb();
        var svc = CreateService(db);

        await svc.RegisterAsync(new RegisterDto
        {
            Username = "loginuser2",
            Email = "login2@example.com",
            Password = "correctpassword"
        });

        var result = await svc.LoginAsync(new LoginDto
        {
            Email = "login2@example.com",
            Password = "wrongpassword"
        });

        Assert.Null(result);
    }
}
