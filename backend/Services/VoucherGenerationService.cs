using backend.Data;
using backend.Models;
using Microsoft.EntityFrameworkCore;

namespace backend.Services
{
    public class VoucherGenerationService : IVoucherGenerationService
    {
        private readonly ApplicationDbContext _context;
        private readonly ILogger<VoucherGenerationService> _logger;

        public VoucherGenerationService(ApplicationDbContext context, ILogger<VoucherGenerationService> logger)
        {
            _context = context;
            _logger = logger;
        }

        [Obsolete("Auto voucher generation is disabled. This method is obsolete.")]
        public async Task<bool> CheckAndGenerateVouchersAsync()
        {
            // Auto voucher generation is disabled. This method is now obsolete.
            return false;
        }

        public async Task<bool> GenerateVouchersForCampaignAsync(int campaignId)
        {
            try
            {
                var campaign = await _context.Campaigns
                    .FirstOrDefaultAsync(c => c.Id == campaignId);

                if (campaign == null || !campaign.VoucherGenerationThreshold.HasValue || !campaign.VoucherValue.HasValue)
                {
                    _logger.LogWarning($"Campaign {campaignId} not configured for voucher generation");
                    return false;
                }

                // Get all resellers for this campaign (remove IsApproved check)
                var campaignResellers = await _context.CampaignResellers
                    .Include(cr => cr.Reseller)
                    .Where(cr => cr.CampaignId == campaignId) // removed cr.IsApproved
                    .ToListAsync();

                Console.WriteLine($"[VoucherGen] Campaign {campaignId} has {campaignResellers.Count} approved resellers");

                foreach (var campaignReseller in campaignResellers)
                {
                    Console.WriteLine($"[VoucherGen] Processing reseller: {campaignReseller.Reseller?.Email} (ID: {campaignReseller.ResellerId})");
                    Console.WriteLine($"[VoucherGen] - TotalPointsEarned: {campaignReseller.TotalPointsEarned}");
                    Console.WriteLine($"[VoucherGen] - PointsUsedForVouchers: {campaignReseller.PointsUsedForVouchers}");
                    Console.WriteLine($"[VoucherGen] - Available Points: {campaignReseller.TotalPointsEarned - campaignReseller.PointsUsedForVouchers}");
                    
                    await GenerateVouchersForResellerAsync(campaignReseller.ResellerId, campaignId);
                }

                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error generating vouchers for campaign {campaignId}");
                return false;
            }
        }

        public async Task<bool> GenerateVouchersForResellerAsync(int resellerId, int campaignId)
        {
            // For interface compatibility, call the new method with 0 points (no-op if no voucher exists)
            return await GenerateOrUpdateVoucherForResellerAsync(resellerId, campaignId, 0);
        }

        public async Task<bool> GenerateVouchersForResellerAsync(int resellerId, int campaignId, int pointsEarned = 0)
        {
            try
            {
                var now = DateTime.UtcNow;
                var points = pointsEarned > 0 ? pointsEarned : 1;
                var voucherValue = 100m; // Default value
                var voucherExpiry = now.AddDays(90); // Default 90 days

                var voucherCode = $"QR-VCH-{now:yyyyMMdd}-{Guid.NewGuid().ToString().Substring(0, 8).ToUpper()}";
                var voucher = new Voucher
                {
                    VoucherCode = voucherCode,
                    ResellerId = resellerId,
                    CampaignId = campaignId,
                    Value = voucherValue,
                    PointsRequired = points,
                    EligibleProducts = null,
                    ExpiryDate = voucherExpiry,
                    IsRedeemed = false,
                    CreatedAt = now
                };
                _logger.LogInformation($"[VoucherGen] Creating voucher: {System.Text.Json.JsonSerializer.Serialize(voucher)}");
                _context.Vouchers.Add(voucher);
                await _context.SaveChangesAsync();
                _logger.LogInformation($"[VoucherGen] Voucher saved with ID: {voucher.Id}");

                // Create and link QR code
                var qrCode = new QRCode
                {
                    Code = $"QR-{voucher.VoucherCode}-{Guid.NewGuid().ToString().Substring(0, 8).ToUpper()}",
                    CampaignId = voucher.CampaignId,
                    ResellerId = voucher.ResellerId,
                    VoucherId = voucher.Id,
                    Points = voucher.PointsRequired,
                    ExpiryDate = voucher.ExpiryDate,
                    IsRedeemed = false,
                    CreatedAt = now,
                    UpdatedAt = now,
                    Voucher = voucher
                };
                _logger.LogInformation($"[VoucherGen] Creating QRCode: {System.Text.Json.JsonSerializer.Serialize(qrCode)}");
                _context.QRCodes.Add(qrCode);
                await _context.SaveChangesAsync();
                _logger.LogInformation($"[VoucherGen] QRCode saved with ID: {qrCode.Id}");

                _logger.LogInformation($"[VoucherGen] Voucher created for reseller {resellerId}, campaign {campaignId}, points {voucher.PointsRequired}");
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"[VoucherGen] Error generating voucher for reseller {resellerId} in campaign {campaignId}");
                return false;
            }
        }

        public async Task<bool> GenerateOrUpdateVoucherForResellerAsync(int resellerId, int campaignId, int pointsEarned)
        {
            // Always create a new voucher with the given points
            return await GenerateVouchersForResellerAsync(resellerId, campaignId, pointsEarned);
        }

        public async Task<object> GetVoucherGenerationStatsAsync(int campaignId)
        {
            try
            {
                var campaign = await _context.Campaigns
                    .FirstOrDefaultAsync(c => c.Id == campaignId);

                if (campaign == null)
                {
                    return new { error = "Campaign not found" };
                }

                var campaignResellers = await _context.CampaignResellers
                    .Include(cr => cr.Reseller)
                    .Where(cr => cr.CampaignId == campaignId)
                    .ToListAsync();

                var totalResellers = campaignResellers.Count;
                var approvedResellers = campaignResellers.Count(cr => cr.IsApproved);
                var totalVouchersGenerated = campaignResellers.Sum(cr => cr.TotalVouchersGenerated);
                var totalVoucherValue = campaignResellers.Sum(cr => cr.TotalVoucherValueGenerated);
                var totalPointsUsed = campaignResellers.Sum(cr => cr.PointsUsedForVouchers);

                return new
                {
                    CampaignId = campaignId,
                    CampaignName = campaign.Name,
                    EnableAutoVoucherGeneration = campaign.EnableAutoVoucherGeneration,
                    VoucherGenerationThreshold = campaign.VoucherGenerationThreshold,
                    VoucherValue = campaign.VoucherValue,
                    VoucherValidityDays = campaign.VoucherValidityDays,
                    TotalResellers = totalResellers,
                    ApprovedResellers = approvedResellers,
                    TotalVouchersGenerated = totalVouchersGenerated,
                    TotalVoucherValueGenerated = totalVoucherValue,
                    TotalPointsUsedForVouchers = totalPointsUsed,
                    ResellerStats = campaignResellers.Select(cr => new
                    {
                        ResellerId = cr.ResellerId,
                        ResellerName = cr.Reseller?.Name,
                        TotalPointsEarned = cr.TotalPointsEarned,
                        PointsUsedForVouchers = cr.PointsUsedForVouchers,
                        AvailablePoints = cr.TotalPointsEarned - cr.PointsUsedForVouchers,
                        TotalVouchersGenerated = cr.TotalVouchersGenerated,
                        TotalVoucherValueGenerated = cr.TotalVoucherValueGenerated,
                        LastVoucherGeneratedAt = cr.LastVoucherGeneratedAt
                    })
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error getting voucher generation stats for campaign {campaignId}");
                return new { error = "Error retrieving stats" };
            }
        }
    }
} 