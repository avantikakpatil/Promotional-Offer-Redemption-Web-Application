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
            try
            {
                Console.WriteLine("=== VOUCHER GENERATION STARTED ===");
                _logger.LogInformation("Starting automatic voucher generation check");

                // Diagnostic: Check all campaigns and their voucher generation settings
                var allCampaigns = await _context.Campaigns.ToListAsync();
                Console.WriteLine($"[VoucherGen] Total campaigns in database: {allCampaigns.Count}");
                
                foreach (var campaign in allCampaigns)
                {
                    Console.WriteLine($"[VoucherGen] Campaign: {campaign.Name} (ID: {campaign.Id})");
                    Console.WriteLine($"[VoucherGen] - IsActive: {campaign.IsActive}");
                    Console.WriteLine($"[VoucherGen] - EnableAutoVoucherGeneration: {campaign.EnableAutoVoucherGeneration}");
                    Console.WriteLine($"[VoucherGen] - VoucherGenerationThreshold: {campaign.VoucherGenerationThreshold}");
                    Console.WriteLine($"[VoucherGen] - VoucherValue: {campaign.VoucherValue}");
                    Console.WriteLine($"[VoucherGen] - StartDate: {campaign.StartDate}, EndDate: {campaign.EndDate}");
                    Console.WriteLine($"[VoucherGen] - Current Time: {DateTime.UtcNow}");
                    Console.WriteLine($"[VoucherGen] - Date Range Valid: {campaign.StartDate <= DateTime.UtcNow && campaign.EndDate >= DateTime.UtcNow}");
                    Console.WriteLine("---");
                }

                // Get all active campaigns with auto voucher generation enabled
                var campaignsWithAutoVoucher = await _context.Campaigns
                    .Where(c => c.IsActive && 
                               c.EnableAutoVoucherGeneration && 
                               c.VoucherGenerationThreshold.HasValue &&
                               c.VoucherValue.HasValue &&
                               c.StartDate <= DateTime.UtcNow &&
                               c.EndDate >= DateTime.UtcNow)
                    .ToListAsync();

                Console.WriteLine($"[VoucherGen] Found {campaignsWithAutoVoucher.Count} campaigns eligible for voucher generation");
                
                int totalVouchersCreated = 0;
                foreach (var campaign in campaignsWithAutoVoucher)
                {
                    Console.WriteLine($"[VoucherGen] Processing campaign: {campaign.Name} (ID: {campaign.Id})");
                    Console.WriteLine($"[VoucherGen] - EnableAutoVoucherGeneration: {campaign.EnableAutoVoucherGeneration}");
                    Console.WriteLine($"[VoucherGen] - VoucherGenerationThreshold: {campaign.VoucherGenerationThreshold}");
                    Console.WriteLine($"[VoucherGen] - VoucherValue: {campaign.VoucherValue}");
                    Console.WriteLine($"[VoucherGen] - StartDate: {campaign.StartDate}, EndDate: {campaign.EndDate}");
                    Console.WriteLine($"[VoucherGen] - IsActive: {campaign.IsActive}");
                    
                    var vouchersCreated = await GenerateVouchersForCampaignAsync(campaign.Id);
                    if (vouchersCreated)
                    {
                        totalVouchersCreated++;
                    }
                }

                Console.WriteLine($"[VoucherGen] SUMMARY: Created vouchers for {totalVouchersCreated} campaigns");
                Console.WriteLine("=== VOUCHER GENERATION COMPLETED ===");
                _logger.LogInformation($"Processed {campaignsWithAutoVoucher.Count} campaigns for voucher generation");
                return true;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"=== VOUCHER GENERATION ERROR: {ex.Message} ===");
                _logger.LogError(ex, "Error in CheckAndGenerateVouchersAsync");
                return false;
            }
        }

        public async Task<bool> GenerateVouchersForCampaignAsync(int campaignId)
        {
            try
            {
                var campaign = await _context.Campaigns
                    .FirstOrDefaultAsync(c => c.Id == campaignId && c.EnableAutoVoucherGeneration);

                if (campaign == null || !campaign.VoucherGenerationThreshold.HasValue || !campaign.VoucherValue.HasValue)
                {
                    _logger.LogWarning($"Campaign {campaignId} not configured for auto voucher generation");
                    return false;
                }

                // Get all approved resellers for this campaign
                var campaignResellers = await _context.CampaignResellers
                    .Include(cr => cr.Reseller)
                    .Where(cr => cr.CampaignId == campaignId && cr.IsApproved)
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
            try
            {
                var campaign = await _context.Campaigns
                    .Include(c => c.RewardTiers)
                    .FirstOrDefaultAsync(c => c.Id == campaignId);

                if (campaign == null)
                {
                    Console.WriteLine($"[VoucherGen] Campaign {campaignId} not found");
                    _logger.LogWarning($"[VoucherGen] Campaign {campaignId} not found");
                    return false;
                }

                if (!campaign.EnableAutoVoucherGeneration)
                {
                    Console.WriteLine($"[VoucherGen] Campaign {campaignId} does not have auto voucher generation enabled");
                    _logger.LogWarning($"[VoucherGen] Campaign {campaignId} does not have auto voucher generation enabled");
                    return false;
                }

                if (!campaign.IsActive || campaign.StartDate > DateTime.UtcNow || campaign.EndDate < DateTime.UtcNow)
                {
                    Console.WriteLine($"[VoucherGen] Campaign {campaignId} is not active or not in date range");
                    _logger.LogWarning($"[VoucherGen] Campaign {campaignId} is not active or not in date range");
                    return false;
                }

                var campaignReseller = await _context.CampaignResellers
                    .FirstOrDefaultAsync(cr => cr.CampaignId == campaignId && cr.ResellerId == resellerId);

                if (campaignReseller == null)
                {
                    Console.WriteLine($"[VoucherGen] No CampaignReseller found for reseller {resellerId} in campaign {campaignId}");
                    _logger.LogWarning($"[VoucherGen] No CampaignReseller found for reseller {resellerId} in campaign {campaignId}");
                    return false;
                }

                var rewardTiers = campaign.RewardTiers.OrderBy(rt => rt.Threshold).ToList();
                if (rewardTiers.Count == 0)
                {
                    Console.WriteLine($"[VoucherGen] No reward tiers found for campaign {campaignId}");
                    _logger.LogWarning($"[VoucherGen] No reward tiers found for campaign {campaignId}");
                    return false;
                }

                var userPoints = await _context.UserPoints.FirstOrDefaultAsync(up => up.UserId == resellerId);
                int availableUserPoints = userPoints?.Points ?? 0;
                Console.WriteLine($"[VoucherGen] Reseller {resellerId} has {availableUserPoints} points for campaign {campaignId}");
                Console.WriteLine($"[VoucherGen] Reward tiers for campaign {campaignId}: {string.Join(", ", rewardTiers.Select(rt => $"{rt.Threshold}:{rt.Reward}"))}");

                foreach (var tier in rewardTiers)
                {
                    if (availableUserPoints >= tier.Threshold)
                    {
                        bool alreadyHasVoucher = await _context.Vouchers.AnyAsync(v => v.ResellerId == resellerId && v.CampaignId == campaignId && v.PointsRequired == tier.Threshold);
                        if (!alreadyHasVoucher)
                        {
                            decimal value = 0;
                            var rewardStr = tier.Reward ?? "";
                            var match = System.Text.RegularExpressions.Regex.Match(rewardStr, @"[₹\$]?(\d+)");
                            if (match.Success && decimal.TryParse(match.Groups[1].Value, out var parsedValue))
                                value = parsedValue;
                            else if (campaign.VoucherValue.HasValue)
                                value = campaign.VoucherValue.Value;
                            else
                                value = 100; // fallback default

                            var voucherCode = $"TIER-VCH-{DateTime.UtcNow:yyyyMMdd}-{Guid.NewGuid().ToString().Substring(0, 8).ToUpper()}";

                            var voucher = new Voucher
                            {
                                VoucherCode = voucherCode,
                                ResellerId = resellerId,
                                CampaignId = campaignId,
                                Value = value,
                                PointsRequired = tier.Threshold,
                                EligibleProducts = campaign.VoucherEligibleProducts,
                                ExpiryDate = DateTime.UtcNow.AddDays(campaign.VoucherValidityDays ?? 90),
                                IsRedeemed = false,
                                CreatedAt = DateTime.UtcNow
                            };
                            _context.Vouchers.Add(voucher);

                            if (userPoints != null)
                            {
                                userPoints.Points = Math.Max(0, userPoints.Points - tier.Threshold);
                                userPoints.LastUpdated = DateTime.UtcNow;
                                availableUserPoints = userPoints.Points;
                            }
                            campaignReseller.PointsUsedForVouchers += tier.Threshold;
                            campaignReseller.TotalVouchersGenerated += 1;
                            campaignReseller.TotalVoucherValueGenerated += value;
                            campaignReseller.LastVoucherGeneratedAt = DateTime.UtcNow;
                            Console.WriteLine($"[VoucherGen] Voucher created for reseller {resellerId}, campaign {campaignId}, tier {tier.Threshold}, value {value}");
                            Console.WriteLine($"[VoucherGen] Voucher Code: {voucherCode}");
                            Console.WriteLine($"[VoucherGen] Expiry Date: {voucher.ExpiryDate}");
                            Console.WriteLine($"[VoucherGen] Points deducted: {tier.Threshold}, Remaining points: {availableUserPoints}");
                            _logger.LogInformation($"[VoucherGen] Voucher created for reseller {resellerId}, campaign {campaignId}, tier {tier.Threshold}, value {value}");
                        }
                        else
                        {
                            Console.WriteLine($"[VoucherGen] Voucher already exists for reseller {resellerId}, campaign {campaignId}, tier {tier.Threshold}");
                            _logger.LogInformation($"[VoucherGen] Voucher already exists for reseller {resellerId}, campaign {campaignId}, tier {tier.Threshold}");
                        }
                    }
                    else
                    {
                        Console.WriteLine($"[VoucherGen] Reseller {resellerId} does not have enough points for tier {tier.Threshold} in campaign {campaignId}");
                        _logger.LogInformation($"[VoucherGen] Reseller {resellerId} does not have enough points for tier {tier.Threshold} in campaign {campaignId}");
                    }
                }

                await _context.SaveChangesAsync();
                Console.WriteLine($"[VoucherGen] Finished voucher generation for reseller {resellerId} in campaign {campaignId}");
                _logger.LogInformation($"[VoucherGen] Finished voucher generation for reseller {resellerId} in campaign {campaignId}");
                return true;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[VoucherGen] Error generating vouchers for reseller {resellerId} in campaign {campaignId}: {ex.Message}");
                _logger.LogError(ex, $"[VoucherGen] Error generating vouchers for reseller {resellerId} in campaign {campaignId}");
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