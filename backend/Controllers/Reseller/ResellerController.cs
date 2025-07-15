using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using backend.Data;
using backend.Models;
using System.Security.Claims;

namespace backend.Controllers.Reseller
{
    [ApiController]
    [Route("api/reseller")]
    public class ResellerController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public ResellerController(ApplicationDbContext context)
        {
            _context = context;
        }

        // GET: api/reseller/points
        [HttpGet("points")]
        public async Task<ActionResult<object>> GetResellerPoints()
        {
            var resellerId = GetCurrentUserId();
            if (resellerId == null)
                return Unauthorized();

            var reseller = await _context.Users.FindAsync(resellerId!.Value);
            if (reseller == null)
                return NotFound();

            // Calculate used points (sum of PointsRequired for all vouchers)
            var usedPoints = await _context.Vouchers
                .Where(v => v.ResellerId == resellerId)
                .SumAsync(v => v.PointsRequired);

            return Ok(new
            {
                points = reseller.Points, // available points
                usedPoints = usedPoints
            });
        }

        // GET: api/reseller/vouchers
        [HttpGet("vouchers")]
        public async Task<ActionResult<IEnumerable<object>>> GetVouchers()
        {
            var resellerId = GetCurrentUserId();
            if (resellerId == null)
                return Unauthorized();

            var vouchers = await _context.Vouchers
                .Include(v => v.Campaign)
                .Include(v => v.RedeemedByShopkeeper)
                .Where(v => v.ResellerId == resellerId)
                .OrderByDescending(v => v.CreatedAt)
                .ToListAsync();

            // Fetch QR codes for these vouchers
            var voucherIds = vouchers.Select(v => v.Id).ToList();
            var qrCodes = await _context.QRCodes
                .Where(qr => qr.VoucherId != null && voucherIds.Contains(qr.VoucherId.Value))
                .ToListAsync();

            var result = vouchers.Select(v => {
                var qr = qrCodes.FirstOrDefault(q => q.VoucherId == v.Id);
                return new {
                    id = v.Id,
                    voucherCode = v.VoucherCode,
                    value = v.Value,
                    campaignName = v.Campaign?.Name,
                    campaignId = v.CampaignId,
                    pointsRequired = v.PointsRequired,
                    isRedeemed = v.IsRedeemed,
                    createdAt = v.CreatedAt,
                    expiryDate = v.ExpiryDate,
                    eligibleProducts = v.EligibleProducts,
                    qrCode = qr?.Code // Add QR code value
                };
            });

            return Ok(result);
        }

        // GET: api/reseller/redemption-history
        [HttpGet("redemption-history")]
        public async Task<ActionResult<IEnumerable<object>>> GetRedemptionHistory()
        {
            var resellerId = GetCurrentUserId();
            if (resellerId == null)
                return Unauthorized();

            var redemptionHistory = await _context.RedemptionHistories
                .Where(rh => rh.ResellerId == resellerId)
                .OrderByDescending(rh => rh.RedeemedAt)
                .ToListAsync();

            return Ok(redemptionHistory);
        }

        // GET: api/reseller/campaigns
        [HttpGet("campaigns")]
        public async Task<ActionResult<IEnumerable<object>>> GetCampaigns()
        {
            var resellerId = GetCurrentUserId();
            if (resellerId == null)
                return Unauthorized();

            var campaigns = await _context.CampaignResellers
                .Include(cr => cr.Campaign)
                .ThenInclude(c => c.RewardTiers)
                .Include(cr => cr.Campaign.Manufacturer)
                .Where(cr => cr.ResellerId == resellerId)
                .Select(cr => new
                {
                    id = cr.Campaign.Id,
                    name = cr.Campaign.Name,
                    productType = cr.Campaign.ProductType,
                    points = cr.Campaign.Points,
                    startDate = cr.Campaign.StartDate,
                    endDate = cr.Campaign.EndDate,
                    description = cr.Campaign.Description,
                    isActive = cr.Campaign.IsActive,
                    minimumOrderValue = cr.Campaign.MinimumOrderValue,
                    maximumOrderValue = cr.Campaign.MaximumOrderValue,
                    schemeType = cr.Campaign.SchemeType,
                    createdAt = cr.Campaign.CreatedAt,
                    manufacturer = new
                    {
                        id = cr.Campaign.Manufacturer.Id,
                        name = cr.Campaign.Manufacturer.Name,
                        businessName = cr.Campaign.Manufacturer.BusinessName
                    },
                    rewardTiers = cr.Campaign.RewardTiers
                        .OrderBy(rt => rt.Threshold)
                        .Select(rt => new {
                            id = rt.Id,
                            threshold = rt.Threshold,
                            reward = rt.Reward
                        }).ToList(),
                    assignment = new
                    {
                        isApproved = cr.IsApproved,
                        approvedAt = cr.ApprovedAt,
                        totalPointsEarned = cr.TotalPointsEarned,
                        totalOrderValue = cr.TotalOrderValue,
                        createdAt = cr.CreatedAt
                    }
                })
                .ToListAsync();

            return Ok(campaigns);
        }

        // POST: api/reseller/campaigns/{campaignId}/participate
        [HttpPost("campaigns/{campaignId}/participate")]
        public async Task<IActionResult> ParticipateInCampaign(int campaignId)
        {
            var resellerId = GetCurrentUserId();
            if (resellerId == null)
                return Unauthorized();

            // Check if already participating
            var existing = await _context.CampaignResellers
                .FirstOrDefaultAsync(cr => cr.CampaignId == campaignId && cr.ResellerId == resellerId);
            if (existing != null)
            {
                return BadRequest(new { success = false, message = "You are already participating in this campaign." });
            }

            // Check if campaign exists and is active
            var campaign = await _context.Campaigns.FindAsync(campaignId);
            if (campaign == null || !campaign.IsActive)
            {
                return NotFound(new { success = false, message = "Campaign not found or inactive." });
            }

            var campaignReseller = new CampaignReseller
            {
                CampaignId = campaignId,
                ResellerId = resellerId.Value,
                IsApproved = !campaign.RequiresApproval, // auto-approve if not required
                CreatedAt = DateTime.UtcNow
            };
            _context.CampaignResellers.Add(campaignReseller);
            await _context.SaveChangesAsync();

            return Ok(new { success = true, message = "Successfully participated in the campaign." });
        }

        // POST: api/reseller/generate-vouchers
        [HttpPost("generate-vouchers")]
        public async Task<IActionResult> GenerateVouchersManually()
        {
            var resellerId = GetCurrentUserId();
            if (resellerId == null)
                return Unauthorized();

            // Get all campaigns the reseller is participating in
            var campaignIds = await _context.CampaignResellers
                .Where(cr => cr.ResellerId == resellerId)
                .Select(cr => cr.CampaignId)
                .ToListAsync();

            int totalGenerated = 0;
            foreach (var campaignId in campaignIds)
            {
                var voucherService = HttpContext.RequestServices.GetService(typeof(backend.Services.IVoucherGenerationService)) as backend.Services.IVoucherGenerationService;
                if (voucherService != null)
                {
                    var result = await voucherService.GenerateVouchersForResellerAsync(resellerId.Value, campaignId);
                    if (result) totalGenerated++;
                }
            }

            return Ok(new { success = true, message = $"Voucher generation triggered for {campaignIds.Count} campaigns. Success: {totalGenerated}" });
        }

        // GET: api/reseller/voucher-debug
        [HttpGet("voucher-debug")]
        public async Task<IActionResult> VoucherDebug()
        {
            var resellerId = GetCurrentUserId();
            if (resellerId == null)
                return Unauthorized();

            var userPoints = await _context.UserPoints.FirstOrDefaultAsync(up => up.UserId == resellerId);
            var points = userPoints?.Points ?? 0;

            var campaignResellers = await _context.CampaignResellers
                .Include(cr => cr.Campaign)
                .ThenInclude(c => c.RewardTiers)
                .Where(cr => cr.ResellerId == resellerId)
                .ToListAsync();

            var debugInfo = campaignResellers.Select(cr => new
            {
                CampaignId = cr.CampaignId,
                CampaignName = cr.Campaign?.Name,
                IsActive = cr.Campaign?.IsActive,
                StartDate = cr.Campaign?.StartDate,
                EndDate = cr.Campaign?.EndDate,
                EnableAutoVoucherGeneration = cr.Campaign?.EnableAutoVoucherGeneration,
                RewardTiers = cr.Campaign?.RewardTiers.Select(rt => new {
                    rt.Id,
                    rt.Threshold,
                    rt.Reward
                }),
                ResellerPoints = points,
                PointsUsedForVouchers = cr.PointsUsedForVouchers,
                TotalPointsEarned = cr.TotalPointsEarned,
                EligibleTiers = cr.Campaign?.RewardTiers
                    .Where(rt => points >= rt.Threshold)
                    .Select(rt => rt.Threshold)
                    .ToList(),
                ExistingVouchers = _context.Vouchers
                    .Where(v => v.ResellerId == resellerId && v.CampaignId == cr.CampaignId)
                    .Select(v => new { v.Id, v.PointsRequired, v.Value, v.CreatedAt })
                    .ToList()
            });

            return Ok(new
            {
                ResellerId = resellerId,
                Points = points,
                Campaigns = debugInfo
            });
        }

        private int? GetCurrentUserId()
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            return userIdClaim != null ? int.Parse(userIdClaim) : null;
        }
    }
} 