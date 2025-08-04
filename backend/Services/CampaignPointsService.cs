using backend.Data;
using backend.Models;
using Microsoft.EntityFrameworkCore;

namespace backend.Services
{
    public interface ICampaignPointsService
    {
        Task<int> CalculateOrderPoints(int orderId);
        Task<bool> UpdateCampaignPoints(int campaignId, int resellerId);
        Task<CampaignPoints?> GetCampaignPoints(int campaignId, int resellerId);
        Task<bool> GenerateVoucher(int campaignId, int resellerId);
        Task<List<CampaignPoints>> GetResellerCampaignPoints(int resellerId);
    }

    public class CampaignPointsService : ICampaignPointsService
    {
        private readonly ApplicationDbContext _context;

        public CampaignPointsService(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<int> CalculateOrderPoints(int orderId)
        {
            var order = await _context.TempOrderPoints
                .FirstOrDefaultAsync(o => o.Id == orderId);

            if (order == null)
                return 0;

            // Return the points directly from the TempOrderPoints table
            return order.TotalPointsEarned;
        }

        public async Task<bool> UpdateCampaignPoints(int campaignId, int resellerId)
        {
            try
            {
                // Get or create CampaignPoints record
                var campaignPoints = await _context.CampaignPoints
                    .FirstOrDefaultAsync(cp => cp.CampaignId == campaignId && cp.ResellerId == resellerId);

                if (campaignPoints == null)
                {
                    campaignPoints = new CampaignPoints
                    {
                        CampaignId = campaignId,
                        ResellerId = resellerId,
                        CreatedAt = DateTime.UtcNow
                    };
                    _context.CampaignPoints.Add(campaignPoints);
                }

                // Get all orders for this campaign and reseller from TempOrderPoints
                var orders = await _context.TempOrderPoints
                    .Where(o => o.CampaignId == campaignId && o.ResellerId == resellerId)
                    .ToListAsync();

                int totalPointsEarned = 0;
                decimal totalOrderValue = 0;
                int totalOrders = orders.Count;

                foreach (var order in orders)
                {
                    totalOrderValue += order.TotalAmount;
                    totalPointsEarned += order.TotalPointsEarned;
                }

                // Update CampaignPoints
                campaignPoints.TotalPointsEarned = totalPointsEarned;
                campaignPoints.TotalOrderValue = totalOrderValue;
                campaignPoints.TotalOrders = totalOrders;
                campaignPoints.AvailablePoints = totalPointsEarned - campaignPoints.PointsUsedForVouchers;
                campaignPoints.UpdatedAt = DateTime.UtcNow;

                await _context.SaveChangesAsync();
                return true;
            }
            catch (Exception ex)
            {
                // Log the exception
                Console.WriteLine($"Error updating campaign points: {ex.Message}");
                return false;
            }
        }

        public async Task<CampaignPoints?> GetCampaignPoints(int campaignId, int resellerId)
        {
            return await _context.CampaignPoints
                .Include(cp => cp.Campaign)
                .Include(cp => cp.Reseller)
                .FirstOrDefaultAsync(cp => cp.CampaignId == campaignId && cp.ResellerId == resellerId);
        }

        public async Task<bool> GenerateVoucher(int campaignId, int resellerId)
        {
            try
            {
                var campaignPoints = await GetCampaignPoints(campaignId, resellerId);
                if (campaignPoints == null)
                    return false;

                var campaign = await _context.Campaigns.FindAsync(campaignId);
                if (campaign == null || !campaign.VoucherGenerationThreshold.HasValue || !campaign.VoucherValue.HasValue)
                    return false;

                // Check if enough points are available
                if (campaignPoints.AvailablePoints < campaign.VoucherGenerationThreshold.Value)
                    return false;

                // Calculate how many vouchers can be generated
                int vouchersToGenerate = campaignPoints.AvailablePoints / campaign.VoucherGenerationThreshold.Value;
                int pointsToUse = vouchersToGenerate * campaign.VoucherGenerationThreshold.Value;

                // Generate vouchers
                for (int i = 0; i < vouchersToGenerate; i++)
                {
                    var voucher = new Voucher
                    {
                        VoucherCode = GenerateVoucherCode(),
                        Value = campaign.VoucherValue.Value,
                        CampaignId = campaignId,
                        ResellerId = resellerId,
                        ExpiryDate = DateTime.UtcNow.AddDays(campaign.VoucherValidityDays ?? 90),
                        CreatedAt = DateTime.UtcNow
                    };

                    _context.Vouchers.Add(voucher);
                }

                // Update CampaignPoints
                campaignPoints.PointsUsedForVouchers += pointsToUse;
                campaignPoints.AvailablePoints = campaignPoints.TotalPointsEarned - campaignPoints.PointsUsedForVouchers;
                campaignPoints.TotalVouchersGenerated += vouchersToGenerate;
                campaignPoints.TotalVoucherValueGenerated += vouchersToGenerate * campaign.VoucherValue.Value;
                campaignPoints.LastVoucherGeneratedAt = DateTime.UtcNow;
                campaignPoints.UpdatedAt = DateTime.UtcNow;

                await _context.SaveChangesAsync();
                return true;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error generating voucher: {ex.Message}");
                return false;
            }
        }

        public async Task<List<CampaignPoints>> GetResellerCampaignPoints(int resellerId)
        {
            return await _context.CampaignPoints
                .Include(cp => cp.Campaign)
                .Where(cp => cp.ResellerId == resellerId)
                .OrderByDescending(cp => cp.UpdatedAt ?? cp.CreatedAt)
                .ToListAsync();
        }

        private string GenerateVoucherCode()
        {
            const string chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
            var random = new Random();
            return new string(Enumerable.Repeat(chars, 8).Select(s => s[random.Next(s.Length)]).ToArray());
        }
    }
}