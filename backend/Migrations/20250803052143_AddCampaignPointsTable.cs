using System;
using Microsoft.EntityFrameworkCore.Metadata;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace backend.Migrations
{
    /// <inheritdoc />
    public partial class AddCampaignPointsTable : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "CampaignPoints",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    CampaignId = table.Column<int>(type: "int", nullable: false),
                    ResellerId = table.Column<int>(type: "int", nullable: false),
                    TotalPointsEarned = table.Column<int>(type: "int", nullable: false),
                    PointsUsedForVouchers = table.Column<int>(type: "int", nullable: false),
                    AvailablePoints = table.Column<int>(type: "int", nullable: false),
                    TotalOrderValue = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    TotalOrders = table.Column<int>(type: "int", nullable: false),
                    TotalVouchersGenerated = table.Column<int>(type: "int", nullable: false),
                    TotalVoucherValueGenerated = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    LastVoucherGeneratedAt = table.Column<DateTime>(type: "timestamp(6)", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp(6)", nullable: false, defaultValueSql: "CURRENT_TIMESTAMP(6)"),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp(6)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CampaignPoints", x => x.Id);
                    table.ForeignKey(
                        name: "FK_CampaignPoints_Campaigns_CampaignId",
                        column: x => x.CampaignId,
                        principalTable: "Campaigns",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_CampaignPoints_Users_ResellerId",
                        column: x => x.ResellerId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateIndex(
                name: "IX_CampaignPoints_CampaignId_ResellerId",
                table: "CampaignPoints",
                columns: new[] { "CampaignId", "ResellerId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_CampaignPoints_ResellerId",
                table: "CampaignPoints",
                column: "ResellerId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "CampaignPoints");
        }
    }
}
