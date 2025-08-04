using Microsoft.EntityFrameworkCore.Migrations;

namespace backend.Migrations
{
    public partial class AddTempOrderPointsAndRemoveOrderTables : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Drop OrderItems table if exists
            migrationBuilder.DropTable(
                name: "OrderItems"
            );

            // Drop Orders table if exists
            migrationBuilder.DropTable(
                name: "Orders"
            );

            // Create TempOrderPoints table if not exists
            migrationBuilder.CreateTable(
                name: "TempOrderPoints",
                columns: table => new
                {
                    Id = table.Column<int>(nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    TotalAmount = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    Date = table.Column<DateTime>(nullable: false),
                    ResellerId = table.Column<int>(nullable: false),
                    CampaignId = table.Column<int>(nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TempOrderPoints", x => x.Id);
                    table.ForeignKey(
                        name: "FK_TempOrderPoints_Users_ResellerId",
                        column: x => x.ResellerId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_TempOrderPoints_Campaigns_CampaignId",
                        column: x => x.CampaignId,
                        principalTable: "Campaigns",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_TempOrderPoints_ResellerId",
                table: "TempOrderPoints",
                column: "ResellerId");

            migrationBuilder.CreateIndex(
                name: "IX_TempOrderPoints_CampaignId",
                table: "TempOrderPoints",
                column: "CampaignId");
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "TempOrderPoints");
            // Optionally, recreate Orders and OrderItems tables here if needed
        }
    }
}
