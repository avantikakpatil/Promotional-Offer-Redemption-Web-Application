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
                var voucher = await _context.Vouchers
                    .FirstOrDefaultAsync(v => v.ResellerId == resellerId && v.CampaignId == campaignId && !v.IsRedeemed);
                if (voucher != null)
                {
                    // Accumulate points in existing voucher
                    voucher.PointsRequired += points;
                    voucher.Value = voucher.PointsRequired; // Value always matches points
                    voucher.UpdatedAt = now;
                    _logger.LogInformation($"[VoucherGen] Updated voucher {voucher.Id}: PointsRequired={voucher.PointsRequired}, Value={voucher.Value}");
                }
                else
                {
                    // If campaign is voucher_restricted, restrict to campaign's voucher products; else unrestricted
                    string eligibleProductsJson = null;
                    var campaign = await _context.Campaigns
                        .Include(c => c.VoucherProducts)
                        .FirstOrDefaultAsync(c => c.Id == campaignId);
                    if (campaign != null && string.Equals(campaign.RewardType, "voucher_restricted", StringComparison.OrdinalIgnoreCase))
                    {
                        var productIds = campaign.VoucherProducts?.Where(vp => vp.IsActive).Select(vp => vp.ProductId).Distinct().ToList() ?? new List<int>();
                        if (productIds.Any())
                        {
                            eligibleProductsJson = System.Text.Json.JsonSerializer.Serialize(productIds);
                        }
                    }
                    var voucherExpiry = now.AddDays(90); // Default 90 days
                    var voucherCode = $"QR-VCH-{now:yyyyMMdd}-{Guid.NewGuid().ToString().Substring(0, 8).ToUpper()}";
                    var qrCodeString = $"QR-{voucherCode}-{Guid.NewGuid().ToString().Substring(0, 8).ToUpper()}";
                    voucher = new Voucher
                    {
                        VoucherCode = voucherCode,
                        ResellerId = resellerId,
                        CampaignId = campaignId,
                        Value = points, // Value = PointsRequired
                        PointsRequired = points,
                        EligibleProducts = eligibleProductsJson,
                        ExpiryDate = voucherExpiry,
                        IsRedeemed = false,
                        CreatedAt = now,
                        UpdatedAt = now,
                        QrCode = qrCodeString
                    };
                    _logger.LogInformation($"[VoucherGen] Creating new voucher: {System.Text.Json.JsonSerializer.Serialize(voucher)}");
                    _context.Vouchers.Add(voucher);
                }
                await _context.SaveChangesAsync();
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"[VoucherGen] Error generating/updating voucher for reseller {resellerId} in campaign {campaignId}");
                return false;
            }
        }

        public async Task<bool> GenerateOrUpdateVoucherForResellerAsync(int resellerId, int campaignId, int pointsEarned)
        {
            // Accumulate points in a single voucher per reseller per campaign
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

        // Backfill QR codes for all existing vouchers that do not have one
        public async Task<int> BackfillVoucherQRCodesAsync()
        {
            var vouchers = await _context.Vouchers.ToListAsync();
            int updatedCount = 0;
            foreach (var voucher in vouchers)
            {
                if (string.IsNullOrEmpty(voucher.QrCode))
                {
                    var qrCodeString = $"QR-{voucher.VoucherCode}-{Guid.NewGuid().ToString().Substring(0, 8).ToUpper()}";
                    voucher.QrCode = qrCodeString;
                    updatedCount++;
                }
            }
            await _context.SaveChangesAsync();
            return updatedCount;
        }

        // Backfill eligible products: if campaign is voucher_restricted, set allowed product list; otherwise leave unrestricted
        public async Task<int> BackfillVoucherEligibleProductsAsync()
        {
            int updatedCount = 0;
            var vouchers = await _context.Vouchers
                .Include(v => v.Campaign)
                .ToListAsync();
            foreach (var v in vouchers)
            {
                if (v.Campaign != null && string.Equals(v.Campaign.RewardType, "voucher_restricted", StringComparison.OrdinalIgnoreCase))
                {
                    var campaign = await _context.Campaigns
                        .Include(c => c.VoucherProducts)
                        .FirstOrDefaultAsync(c => c.Id == v.CampaignId);
                    var productIds = campaign?.VoucherProducts?.Where(vp => vp.IsActive).Select(vp => vp.ProductId).Distinct().ToList() ?? new List<int>();
                    if (productIds.Any())
                    {
                        v.EligibleProducts = System.Text.Json.JsonSerializer.Serialize(productIds);
                        updatedCount++;
                    }
                }
                else
                {
                    // Make unrestricted for non-restricted campaigns
                    if (!string.IsNullOrEmpty(v.EligibleProducts))
                    {
                        v.EligibleProducts = null;
                        updatedCount++;
                    }
                }
            }
            await _context.SaveChangesAsync();
            return updatedCount;
        }
    }
} 