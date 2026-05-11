using System.Text;
using Azure.Identity;
using CloudBackend.Data;
using CloudBackend.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;

var builder = WebApplication.CreateBuilder(args);

// Załaduj przed zmiennymi środowiskowymi — env vars mają wyższy priorytet (Docker)
builder.Configuration.Sources.Insert(
    2,
    new Microsoft.Extensions.Configuration.Json.JsonConfigurationSource
    {
        Path = "appsettings.Local.json",
        Optional = true,
        ReloadOnChange = true,
    });

if (builder.Environment.IsProduction())
{
    var vaultName = builder.Configuration["KeyVaultName"];
    if (!string.IsNullOrEmpty(vaultName))
    {
        var keyVaultEndpoint = new Uri($"https://{vaultName}.vault.azure.net/");
        builder.Configuration.AddAzureKeyVault(keyVaultEndpoint, new DefaultAzureCredential());
    }
}

builder.Services.AddControllers()
    .AddJsonOptions(opts =>
        opts.JsonSerializerOptions.Converters.Add(new System.Text.Json.Serialization.JsonStringEnumConverter()));
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        In = ParameterLocation.Header,
        Description = "Enter: Bearer {token}",
        Name = "Authorization",
        Type = SecuritySchemeType.ApiKey
    });
    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference { Type = ReferenceType.SecurityScheme, Id = "Bearer" }
            },
            Array.Empty<string>()
        }
    });
});

var connectionString = builder.Configuration["DbConnectionString"]
                       ?? builder.Configuration.GetConnectionString("DefaultConnection");

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(connectionString,
        npgsql => npgsql.EnableRetryOnFailure(maxRetryCount: 5, maxRetryDelay: TimeSpan.FromSeconds(30), errorCodesToAdd: null)));

builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddHttpClient<IIgdbService, IgdbService>();
builder.Services.AddHttpClient<ITranslationService, TranslationService>();
builder.Services.AddHttpClient<IRiotService, RiotService>();
builder.Services.AddHttpClient<ISteamService, SteamService>();
builder.Services.AddHttpClient<ITmdbService, TmdbService>();
builder.Services.AddHttpClient<IJikanService, JikanService>();

var jwtSecret = builder.Configuration["JwtSettings:Secret"]
    ?? throw new InvalidOperationException("JwtSettings:Secret not configured.");

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSecret)),
            ValidateIssuer = false,
            ValidateAudience = false
        };
    });

builder.Services.AddAuthorization();

builder.Services.Configure<CloudBackend.Options.FeatureFlags>(
    builder.Configuration.GetSection("FeatureFlags"));

builder.Services.AddStackExchangeRedisCache(options =>
    options.Configuration = builder.Configuration.GetConnectionString("Redis"));

builder.Services.AddSingleton<ICacheService, CacheService>();

builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
        policy.AllowAnyOrigin().AllowAnyMethod().AllowAnyHeader());
});

var app = builder.Build();

var authEnabled = app.Configuration.GetValue<bool>("FeatureFlags:AuthEnabled", true);

using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    db.Database.Migrate();

    // When auth is disabled, ensure a default user exists so library operations have a userId to work with
    if (!authEnabled && !db.Users.Any())
    {
        db.Users.Add(new CloudBackend.Models.User
        {
            Username = "admin",
            Email = "admin@localhost",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(Guid.NewGuid().ToString()),
            CreatedAt = DateTime.UtcNow,
        });
        db.SaveChanges();
    }
}

// When auth is disabled, inject the first user's identity into every request
// so [Authorize] passes and GetUserId() returns a valid user ID
if (!authEnabled)
{
    app.Use(async (context, next) =>
    {
        using var scope = context.RequestServices.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var userId = db.Users.Select(u => u.Id).FirstOrDefault();
        var claims = new[] { new System.Security.Claims.Claim(System.Security.Claims.ClaimTypes.NameIdentifier, userId.ToString()) };
        context.User = new System.Security.Claims.ClaimsPrincipal(
            new System.Security.Claims.ClaimsIdentity(claims, "AuthDisabled"));
        await next();
    });
}

app.UseSwagger();
app.UseSwaggerUI(c =>
{
    c.SwaggerEndpoint("/swagger/v1/swagger.json", "GameLog API V1");
    c.RoutePrefix = string.Empty;
});

app.UseCors();
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();
app.Run();
