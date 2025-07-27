using System;
using Microsoft.EntityFrameworkCore.Metadata;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace backend.Migrations
{
    /// <inheritdoc />
    public partial class AddCampaignProductTable : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_CampaignEligibleProducts_Products_ProductId",
                table: "CampaignEligibleProducts");

            migrationBuilder.RenameColumn(
                name: "ProductId",
                table: "CampaignEligibleProducts",
                newName: "CampaignProductId");

            migrationBuilder.RenameIndex(
                name: "IX_CampaignEligibleProducts_ProductId",
                table: "CampaignEligibleProducts",
                newName: "IX_CampaignEligibleProducts_CampaignProductId");

            migrationBuilder.CreateTable(
                name: "CampaignProducts",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    Name = table.Column<string>(type: "varchar(255)", maxLength: 255, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Category = table.Column<string>(type: "varchar(100)", maxLength: 100, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    SKU = table.Column<string>(type: "varchar(50)", maxLength: 50, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Brand = table.Column<string>(type: "varchar(100)", maxLength: 100, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    BasePrice = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    PointsPerUnit = table.Column<int>(type: "int", nullable: false),
                    ManufacturerId = table.Column<int>(type: "int", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp(6)", nullable: false, defaultValueSql: "CURRENT_TIMESTAMP(6)")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CampaignProducts", x => x.Id);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AddForeignKey(
                name: "FK_CampaignEligibleProducts_CampaignProducts_CampaignProductId",
                table: "CampaignEligibleProducts",
                column: "CampaignProductId",
                principalTable: "CampaignProducts",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_CampaignEligibleProducts_CampaignProducts_CampaignProductId",
                table: "CampaignEligibleProducts");

            migrationBuilder.DropTable(
                name: "CampaignProducts");

            migrationBuilder.RenameColumn(
                name: "CampaignProductId",
                table: "CampaignEligibleProducts",
                newName: "ProductId");

            migrationBuilder.RenameIndex(
                name: "IX_CampaignEligibleProducts_CampaignProductId",
                table: "CampaignEligibleProducts",
                newName: "IX_CampaignEligibleProducts_ProductId");

            migrationBuilder.AddForeignKey(
                name: "FK_CampaignEligibleProducts_Products_ProductId",
                table: "CampaignEligibleProducts",
                column: "ProductId",
                principalTable: "Products",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
