using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CloudBackend.Migrations
{
    /// <inheritdoc />
    public partial class AddSyncIdentifierToMultiplayerEntry : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "SyncIdentifier",
                table: "MultiplayerEntries",
                type: "nvarchar(max)",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "SyncIdentifier",
                table: "MultiplayerEntries");
        }
    }
}
