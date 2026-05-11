using Microsoft.EntityFrameworkCore;
using CloudBackend.Models;

namespace CloudBackend.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<User> Users { get; set; }
    public DbSet<Game> Games { get; set; }
    public DbSet<UserGame> UserGames { get; set; }
    public DbSet<MultiplayerEntry> MultiplayerEntries { get; set; }
    public DbSet<CategoryRanking> CategoryRankings => Set<CategoryRanking>();
    public DbSet<UserMedia> UserMedia => Set<UserMedia>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<User>()
            .HasIndex(u => u.Email).IsUnique();
        modelBuilder.Entity<User>()
            .HasIndex(u => u.Username).IsUnique();

        modelBuilder.Entity<Game>()
            .HasIndex(g => g.IgdbId).IsUnique();

        modelBuilder.Entity<UserGame>()
            .HasOne(ug => ug.User)
            .WithMany(u => u.UserGames)
            .HasForeignKey(ug => ug.UserId);

        modelBuilder.Entity<UserGame>()
            .HasOne(ug => ug.Game)
            .WithMany(g => g.UserGames)
            .HasForeignKey(ug => ug.GameId);

        modelBuilder.Entity<UserGame>()
            .HasIndex(ug => new { ug.UserId, ug.GameId }).IsUnique();

        modelBuilder.Entity<MultiplayerEntry>()
            .HasOne(m => m.User)
            .WithMany()
            .HasForeignKey(m => m.UserId);

        modelBuilder.Entity<CategoryRanking>()
            .HasOne(r => r.User)
            .WithMany()
            .HasForeignKey(r => r.UserId);

        modelBuilder.Entity<CategoryRanking>()
            .HasOne(r => r.UserGame)
            .WithMany()
            .HasForeignKey(r => r.UserGameId);

        modelBuilder.Entity<CategoryRanking>()
            .HasIndex(r => new { r.UserId, r.CategoryId, r.UserGameId })
            .IsUnique();

        modelBuilder.Entity<UserMedia>()
            .HasOne(m => m.User)
            .WithMany()
            .HasForeignKey(m => m.UserId);

        modelBuilder.Entity<UserMedia>()
            .HasIndex(m => new { m.UserId, m.Title, m.Type })
            .IsUnique();
    }
}