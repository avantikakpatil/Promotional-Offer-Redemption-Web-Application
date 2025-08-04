using System;
using Microsoft.EntityFrameworkCore.Metadata;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace backend.Migrations
{
    /// <inheritdoc />
    public partial class AddQrCodeToVouchers : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "QRCodes");

            migrationBuilder.AddColumn<string>(
                name: "QrCode",
                table: "Vouchers",
                type: "varchar(255)",
                maxLength: 255,
                nullable: false,
                defaultValue: "")
                .Annotation("MySql:CharSet", "utf8mb4");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "QrCode",
                table: "Vouchers");

            migrationBuilder.CreateTable(
                name: "QRCodes",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    CampaignId = table.Column<int>(type: "int", nullable: false),
                    RedeemedByShopkeeperId = table.Column<int>(type: "int", nullable: true),
                    RedeemedByUserId = table.Column<int>(type: "int", nullable: true),
                    ResellerId = table.Column<int>(type: "int", nullable: true),
                    VoucherId = table.Column<int>(type: "int", nullable: true),
                    Code = table.Column<string>(type: "varchar(255)", maxLength: 255, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    CreatedAt = table.Column<DateTime>(type: "timestamp(6)", nullable: false, defaultValueSql: "CURRENT_TIMESTAMP(6)"),
                    ExpiryDate = table.Column<DateTime>(type: "timestamp(6)", nullable: true),
                    IsRedeemed = table.Column<bool>(type: "tinyint(1)", nullable: false),
                    Points = table.Column<int>(type: "int", nullable: false),
                    RedeemedAt = table.Column<DateTime>(type: "timestamp(6)", nullable: true),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp(6)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_QRCodes", x => x.Id);
                    table.ForeignKey(
                        name: "FK_QRCodes_Campaigns_CampaignId",
                        column: x => x.CampaignId,
                        principalTable: "Campaigns",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_QRCodes_Users_RedeemedByShopkeeperId",
                        column: x => x.RedeemedByShopkeeperId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_QRCodes_Users_RedeemedByUserId",
                        column: x => x.RedeemedByUserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_QRCodes_Users_ResellerId",
                        column: x => x.ResellerId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_QRCodes_Vouchers_VoucherId",
                        column: x => x.VoucherId,
                        principalTable: "Vouchers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateIndex(
                name: "IX_QRCodes_CampaignId",
                table: "QRCodes",
                column: "CampaignId");

            migrationBuilder.CreateIndex(
                name: "IX_QRCodes_RedeemedByShopkeeperId",
                table: "QRCodes",
                column: "RedeemedByShopkeeperId");

            migrationBuilder.CreateIndex(
                name: "IX_QRCodes_RedeemedByUserId",
                table: "QRCodes",
                column: "RedeemedByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_QRCodes_ResellerId",
                table: "QRCodes",
                column: "ResellerId");

            migrationBuilder.CreateIndex(
                name: "IX_QRCodes_VoucherId",
                table: "QRCodes",
                column: "VoucherId");
        }
    }
}
