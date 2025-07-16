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
                var campaign = await _context.Campaigns
                    .FirstOrDefaultAsync(c => c.Id == campaignId);

                if (campaign == null)
                {
                    _logger.LogWarning($"[VoucherGen] Campaign {campaignId} not found");
                    return false;
                }

                if (!campaign.IsActive || campaign.StartDate > DateTime.UtcNow || campaign.EndDate < DateTime.UtcNow)
                {
                    _logger.LogWarning($"[VoucherGen] Campaign {campaignId} is not active or not in date range");
                    return false;
                }

                // Use campaign-specific points from CampaignReseller
                var campaignReseller = await _context.CampaignResellers.FirstOrDefaultAsync(cr => cr.CampaignId == campaignId && cr.ResellerId == resellerId);
                if (campaignReseller == null)
                {
                    _logger.LogWarning($"[VoucherGen] No CampaignReseller found for reseller {resellerId} in campaign {campaignId}");
                    return false;
                }

                // Get eligible product IDs for this campaign
                var eligibleProductIds = await _context.CampaignEligibleProducts
                    .Where(ep => ep.CampaignId == campaignId && ep.IsActive)
                    .Select(ep => ep.ProductId)
                    .ToListAsync();
                var eligibleProductsJson = System.Text.Json.JsonSerializer.Serialize(eligibleProductIds);

                // Generate a voucher for this scan (pointsEarned)
                var voucherCode = $"QR-VCH-{DateTime.UtcNow:yyyyMMdd}-{Guid.NewGuid().ToString().Substring(0, 8).ToUpper()}";
                var voucher = new Voucher
                {
                    VoucherCode = voucherCode,
                    ResellerId = resellerId,
                    CampaignId = campaignId,
                    Value = campaign.VoucherValue ?? 100, // fallback value
                    PointsRequired = pointsEarned > 0 ? pointsEarned : campaign.Points,
                    EligibleProducts = eligibleProductsJson,
                    ExpiryDate = DateTime.UtcNow.AddDays(campaign.VoucherValidityDays ?? 90),
                    IsRedeemed = false,
                    CreatedAt = DateTime.UtcNow
                };
                _context.Vouchers.Add(voucher);
                await _context.SaveChangesAsync();

                // Optionally, generate a QR code for this voucher
                var qrCode = new QRCode
                {
                    Code = $"QR-{voucher.VoucherCode}-{Guid.NewGuid().ToString().Substring(0, 8).ToUpper()}",
                    CampaignId = voucher.CampaignId,
                    ResellerId = voucher.ResellerId,
                    VoucherId = voucher.Id,
                    Points = voucher.PointsRequired,
                    ExpiryDate = voucher.ExpiryDate,
                    IsRedeemed = false,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow,
                    Voucher = voucher,
                    Campaign = campaign
                };
                _context.QRCodes.Add(qrCode);
                await _context.SaveChangesAsync();

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
            try
            {
                var campaign = await _context.Campaigns.FirstOrDefaultAsync(c => c.Id == campaignId);
                if (campaign == null)
                {
                    _logger.LogWarning($"[VoucherGen] Campaign {campaignId} not found");
                    return false;
                }
                if (!campaign.IsActive || campaign.StartDate > DateTime.UtcNow || campaign.EndDate < DateTime.UtcNow)
                {
                    _logger.LogWarning($"[VoucherGen] Campaign {campaignId} is not active or not in date range");
                    return false;
                }
                // Find existing active voucher for this reseller and campaign
                var now = DateTime.UtcNow;
                var voucher = await _context.Vouchers.FirstOrDefaultAsync(v => v.ResellerId == resellerId && v.CampaignId == campaignId && !v.IsRedeemed && v.ExpiryDate > now);
                if (voucher != null)
                {
                    // Accumulate points
                    voucher.PointsRequired += pointsEarned;
                    voucher.UpdatedAt = now;
                    _context.Vouchers.Update(voucher);
                    _logger.LogInformation($"[VoucherGen] Updated voucher {voucher.VoucherCode} for reseller {resellerId}, campaign {campaignId}, new points: {voucher.PointsRequired}");
                }
                else
                {
                    // Get eligible product IDs for this campaign
                    var eligibleProductIds = await _context.CampaignEligibleProducts
                        .Where(ep => ep.CampaignId == campaignId && ep.IsActive)
                        .Select(ep => ep.ProductId)
                        .ToListAsync();
                    var eligibleProductsJson = System.Text.Json.JsonSerializer.Serialize(eligibleProductIds);
                    var voucherCode = $"QR-VCH-{now:yyyyMMdd}-{Guid.NewGuid().ToString().Substring(0, 8).ToUpper()}";
                    voucher = new Voucher
                    {
                        VoucherCode = voucherCode,
                        ResellerId = resellerId,
                        CampaignId = campaignId,
                        Value = campaign.VoucherValue ?? 100,
                        PointsRequired = pointsEarned,
                        EligibleProducts = eligibleProductsJson,
                        ExpiryDate = now.AddDays(campaign.VoucherValidityDays ?? 90),
                        IsRedeemed = false,
                        CreatedAt = now,
                        UpdatedAt = now
                    };
                    _context.Vouchers.Add(voucher);
                    _logger.LogInformation($"[VoucherGen] Created new voucher {voucher.VoucherCode} for reseller {resellerId}, campaign {campaignId}, points: {voucher.PointsRequired}");
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