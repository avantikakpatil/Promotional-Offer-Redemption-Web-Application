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

                // Removed EnableAutoVoucherGeneration check
                if (!campaign.IsActive || campaign.StartDate > DateTime.UtcNow || campaign.EndDate < DateTime.UtcNow)
                {
                    Console.WriteLine($"[VoucherGen] Campaign {campaignId} is not active or not in date range");
                    _logger.LogWarning($"[VoucherGen] Campaign {campaignId} is not active or not in date range");
                    return false;
                }

                // REMOVE CampaignReseller check: allow all resellers for all campaigns
                // var campaignReseller = await _context.CampaignResellers
                //     .FirstOrDefaultAsync(cr => cr.CampaignId == campaignId && cr.ResellerId == resellerId);
                //
                // if (campaignReseller == null)
                // {
                //     Console.WriteLine($"[VoucherGen] No CampaignReseller found for reseller {resellerId} in campaign {campaignId}");
                //     _logger.LogWarning($"[VoucherGen] No CampaignReseller found for reseller {resellerId} in campaign {campaignId}");
                //     return false;
                // }

                var rewardTiers = campaign.RewardTiers.OrderBy(rt => rt.Threshold).ToList();
                if (rewardTiers.Count == 0)
                {
                    Console.WriteLine($"[VoucherGen] No reward tiers found for campaign {campaignId}");
                    _logger.LogWarning($"[VoucherGen] No reward tiers found for campaign {campaignId}");
                    return false;
                }

                // Use Users.Points instead of UserPoints.Points
                var resellerUser = await _context.Users.FirstOrDefaultAsync(u => u.Id == resellerId);
                int availableUserPoints = resellerUser?.Points ?? 0;
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
                            // Deduct points from reseller
                            if (resellerUser != null)
                            {
                                resellerUser.Points -= tier.Threshold;
                                availableUserPoints -= tier.Threshold;
                            }
                            await _context.SaveChangesAsync(); // Save to get voucher.Id

                            // Automatically generate a QR code for this voucher
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
                                // Navigation properties (optional, for EF tracking)
                                Voucher = voucher,
                                Campaign = campaign
                            };
                            _context.QRCodes.Add(qrCode);
                            await _context.SaveChangesAsync();

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