using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CloudBackend.Migrations
{
    /// <inheritdoc />
    public partial class AddMultiplayerEntries : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "MultiplayerEntries",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    UserId = table.Column<int>(type: "int", nullable: false),
                    GameTitle = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Mode = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Tier = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Rank = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    RankPoints = table.Column<int>(type: "int", nullable: true),
                    RankPointsMax = table.Column<int>(type: "int", nullable: true),
                    WinRate = table.Column<double>(type: "float", nullable: true),
                    KdRatio = table.Column<double>(type: "float", nullable: true),
                    HoursPlayed = table.Column<int>(type: "int", nullable: true),
                    Platform = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    InGameUsername = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MultiplayerEntries", x => x.Id);
                    table.ForeignKey(
                        name: "FK_MultiplayerEntries_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_MultiplayerEntries_UserId",
                table: "MultiplayerEntries",
                column: "UserId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "MultiplayerEntries");
        }
    }
}
