using Microsoft.EntityFrameworkCore;
using CloudBackend.Models;

namespace CloudBackend.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<User> Users { get; set; }
    public DbSet<Game> Games { get; set; }
    public DbSet<UserGame> UserGames { get; set; }
    public DbSet<PlayerProfile> PlayerProfiles { get; set; }
    public DbSet<MultiplayerGame> MultiplayerGames { get; set; }
    public DbSet<Rank> Ranks { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<UserGame>()
            .HasOne(ug => ug.User)
            .WithMany(u => u.UserGames)
            .HasForeignKey(ug => ug.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<UserGame>()
            .HasOne(ug => ug.Game)
            .WithMany(g => g.UserGames)
            .HasForeignKey(ug => ug.GameId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<PlayerProfile>()
            .HasOne(pp => pp.User)
            .WithMany(u => u.PlayerProfiles)
            .HasForeignKey(pp => pp.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<PlayerProfile>()
            .HasOne(pp => pp.Game)
            .WithMany()
            .HasForeignKey(pp => pp.GameId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<Rank>()
            .HasOne(r => r.PlayerProfile)
            .WithMany()
            .HasForeignKey(r => r.PlayerProfileId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
