using Microsoft.EntityFrameworkCore.Migrations;

namespace backend.Migrations
{
    public partial class AddQrCodeToVouchersAndDropQRCodesTable : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Add QrCode column to Vouchers
            migrationBuilder.AddColumn<string>(
                name: "QrCode",
                table: "Vouchers",
                type: "varchar(255)",
                maxLength: 255,
                nullable: false,
                defaultValue: ""
            );

            // Optional: Migrate QR code data from QRCodes table to Vouchers (if needed)
            migrationBuilder.Sql(@"
                UPDATE Vouchers v
                JOIN QRCodes q ON v.Id = q.VoucherId
                SET v.QrCode = q.Code
                WHERE q.VoucherId IS NOT NULL
            ");

            // Drop QRCodes table
            migrationBuilder.DropTable(
                name: "QRCodes"
            );
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // Recreate QRCodes table (structure only, no data restore)

            migrationBuilder.CreateTable(
                name: "QRCodes",
                columns: table => new
                {
                    Id = table.Column<int>(nullable: false),
                    Code = table.Column<string>(maxLength: 255, nullable: false),
                    CampaignId = table.Column<int>(nullable: false),
                    IsRedeemed = table.Column<bool>(nullable: false),
                    RedeemedAt = table.Column<DateTime>(nullable: true),
                    Points = table.Column<int>(nullable: false),
                    ResellerId = table.Column<int>(nullable: true),
                    VoucherId = table.Column<int>(nullable: true),
                    RedeemedByShopkeeperId = table.Column<int>(nullable: true),
                    RedeemedByUserId = table.Column<int>(nullable: true),
                    CreatedAt = table.Column<DateTime>(nullable: false),
                    UpdatedAt = table.Column<DateTime>(nullable: true),
                    ExpiryDate = table.Column<DateTime>(nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_QRCodes", x => x.Id);
                }
            );

            // Remove QrCode column from Vouchers
            migrationBuilder.DropColumn(
                name: "QrCode",
                table: "Vouchers"
            );
        }
    }
}
