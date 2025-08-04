using System;
using System.Linq;
using System.Threading.Tasks;
using backend.Data;
using backend.Models;
using Microsoft.EntityFrameworkCore;

namespace backend.Services
{
    public class DatabaseCleanupService
    {
        private readonly ApplicationDbContext _context;
        
        public DatabaseCleanupService(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<CleanupResult> CleanupDummyDataAsync()
        {
            var result = new CleanupResult();
            
            try
            {
                Console.WriteLine("=== DATABASE CLEANUP STARTED ===");
                
                // 1. Remove dummy vouchers
                var dummyVouchers = await _context.Vouchers
                    .Where(v => v.VoucherCode.StartsWith("TIER-VCH-"))
                    .ToListAsync();
                _context.Vouchers.RemoveRange(dummyVouchers);
                result.VouchersRemoved = dummyVouchers.Count;
                Console.WriteLine($"[CLEANUP] Removed {dummyVouchers.Count} dummy vouchers");

                // 2. Remove dummy redemption history
                var dummyRedemptions = await _context.RedemptionHistories
                    .Where(rh => rh.QRCode.StartsWith("TEST-") || rh.QRCode.StartsWith("DUMMY-"))
                    .ToListAsync();
                _context.RedemptionHistories.RemoveRange(dummyRedemptions);
                result.RedemptionHistoryRemoved = dummyRedemptions.Count;
                Console.WriteLine($"[CLEANUP] Removed {dummyRedemptions.Count} dummy redemption records");


                // 3. Remove dummy vouchers with dummy QR codes (single-table QR code system)
                var dummyVoucherQRCodes = await _context.Vouchers
                    .Where(v => v.QrCode.StartsWith("TEST-") || v.QrCode.StartsWith("DUMMY-"))
                    .ToListAsync();
                _context.Vouchers.RemoveRange(dummyVoucherQRCodes);
                result.QRCodesRemoved = dummyVoucherQRCodes.Count;
                Console.WriteLine($"[CLEANUP] Removed {dummyVoucherQRCodes.Count} dummy voucher QR codes");

                // 4. Remove dummy campaigns (optional - be careful with this)
                var dummyCampaigns = await _context.Campaigns
                    .Where(c => c.Name.Contains("Test") || c.Name.Contains("Dummy") || c.Name.Contains("Sample"))
                    .ToListAsync();
                _context.Campaigns.RemoveRange(dummyCampaigns);
                result.CampaignsRemoved = dummyCampaigns.Count;
                Console.WriteLine($"[CLEANUP] Removed {dummyCampaigns.Count} dummy campaigns");

                // 5. Remove dummy users (test accounts)
                var dummyUsers = await _context.Users
                    .Where(u => u.Email.Contains("test") || u.Email.Contains("dummy") || u.Email.Contains("sample") || 
                               u.Name.Contains("Test") || u.Name.Contains("Dummy") || u.Name.Contains("Sample"))
                    .ToListAsync();
                _context.Users.RemoveRange(dummyUsers);
                result.UsersRemoved = dummyUsers.Count;
                Console.WriteLine($"[CLEANUP] Removed {dummyUsers.Count} dummy users");

                // 6. Reset UserPoints to 0 for all users
                var allUserPoints = await _context.UserPoints.ToListAsync();
                foreach (var userPoint in allUserPoints)
                {
                    userPoint.Points = 0;
                    userPoint.RedeemedPoints = 0;
                    userPoint.LastUpdated = DateTime.UtcNow;
                }
                result.UserPointsReset = allUserPoints.Count;
                Console.WriteLine($"[CLEANUP] Reset points for {allUserPoints.Count} users");

                // 7. Reset CampaignReseller statistics
                var allCampaignResellers = await _context.CampaignResellers.ToListAsync();
                foreach (var cr in allCampaignResellers)
                {
                    cr.TotalPointsEarned = 0;
                    cr.PointsUsedForVouchers = 0;
                    cr.TotalVouchersGenerated = 0;
                    cr.TotalVoucherValueGenerated = 0;
                    cr.LastVoucherGeneratedAt = null;
                    cr.UpdatedAt = DateTime.UtcNow;
                }
                result.CampaignResellersReset = allCampaignResellers.Count;
                Console.WriteLine($"[CLEANUP] Reset statistics for {allCampaignResellers.Count} campaign resellers");

                // 8. Remove dummy orders
                var dummyOrders = await _context.TempOrderPoints
                    .Where(o => o.OrderNumber.StartsWith("TEST-") || o.OrderNumber.StartsWith("DUMMY-"))
                    .ToListAsync();
                _context.TempOrderPoints.RemoveRange(dummyOrders);
                result.OrdersRemoved = dummyOrders.Count;
                Console.WriteLine($"[CLEANUP] Removed {dummyOrders.Count} dummy orders");

                // 9. Remove dummy products
                var dummyProducts = await _context.Products
                    .Where(p => p.Name.Contains("Test") || p.Name.Contains("Dummy") || p.Name.Contains("Sample"))
                    .ToListAsync();
                _context.Products.RemoveRange(dummyProducts);
                result.ProductsRemoved = dummyProducts.Count;
                Console.WriteLine($"[CLEANUP] Removed {dummyProducts.Count} dummy products");

                await _context.SaveChangesAsync();
                
                Console.WriteLine("=== DATABASE CLEANUP COMPLETED ===");
                Console.WriteLine($"[CLEANUP] SUMMARY:");
                Console.WriteLine($"[CLEANUP] - Vouchers removed: {result.VouchersRemoved}");
                Console.WriteLine($"[CLEANUP] - Redemption history removed: {result.RedemptionHistoryRemoved}");
                Console.WriteLine($"[CLEANUP] - QR codes removed: {result.QRCodesRemoved}");
                Console.WriteLine($"[CLEANUP] - Campaigns removed: {result.CampaignsRemoved}");
                Console.WriteLine($"[CLEANUP] - Users removed: {result.UsersRemoved}");
                Console.WriteLine($"[CLEANUP] - Orders removed: {result.OrdersRemoved}");
                Console.WriteLine($"[CLEANUP] - Products removed: {result.ProductsRemoved}");
                Console.WriteLine($"[CLEANUP] - User points reset: {result.UserPointsReset}");
                Console.WriteLine($"[CLEANUP] - Campaign resellers reset: {result.CampaignResellersReset}");
                
                result.Success = true;
                return result;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[CLEANUP] ERROR: {ex.Message}");
                result.Success = false;
                result.ErrorMessage = ex.Message;
                return result;
            }
        }
    }

    public class CleanupResult
    {
        public bool Success { get; set; }
        public string ErrorMessage { get; set; }
        public int VouchersRemoved { get; set; }
        public int RedemptionHistoryRemoved { get; set; }
        public int QRCodesRemoved { get; set; }
        public int CampaignsRemoved { get; set; }
        public int UsersRemoved { get; set; }
        public int OrdersRemoved { get; set; }
        public int ProductsRemoved { get; set; }
        public int UserPointsReset { get; set; }
        public int CampaignResellersReset { get; set; }
    }
} 