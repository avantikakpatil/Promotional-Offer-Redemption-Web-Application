using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using backend.Data;
using backend.Models;
using backend.Models.DTOs;
using System.Security.Claims;

namespace backend.Controllers.Reseller
{
    [ApiController]
    [Route("api/reseller/[controller]")]
    public class VoucherController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public VoucherController(ApplicationDbContext context)
        {
            _context = context;
        }

        // GET: api/reseller/voucher
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Voucher>>> GetVouchers()
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

            return Ok(vouchers);
        }

        // GET: api/reseller/voucher/{id}
        [HttpGet("{id}")]
        public async Task<ActionResult<Voucher>> GetVoucher(int id)
        {
            var resellerId = GetCurrentUserId();
            if (resellerId == null)
                return Unauthorized();

            var voucher = await _context.Vouchers
                .Include(v => v.Campaign)
                .Include(v => v.RedeemedByShopkeeper)
                .FirstOrDefaultAsync(v => v.Id == id && v.ResellerId == resellerId);

            if (voucher == null)
                return NotFound();

            return Ok(voucher);
        }

        // POST: api/reseller/voucher
        [HttpPost]
        public async Task<ActionResult<Voucher>> CreateVoucher(CreateVoucherDto createVoucherDto)
        {
            var resellerId = GetCurrentUserId();
            if (resellerId == null)
                return Unauthorized();

            // Validate campaign exists and reseller is assigned
            var campaignReseller = await _context.CampaignResellers
                .FirstOrDefaultAsync(cr => cr.CampaignId == createVoucherDto.CampaignId && 
                                         cr.ResellerId == resellerId && 
                                         cr.IsApproved);

            if (campaignReseller == null)
                return BadRequest("Campaign not found or not approved for this reseller");

            // Check campaign-specific points
            int availablePoints = campaignReseller.TotalPointsEarned - campaignReseller.PointsUsedForVouchers;
            if (availablePoints < createVoucherDto.PointsRequired)
                return BadRequest("Insufficient campaign points to create voucher");

            // Generate voucher code
            var voucherCode = $"VCH-{DateTime.UtcNow:yyyyMMdd}-{Guid.NewGuid().ToString().Substring(0, 8).ToUpper()}";

            var voucher = new Voucher
            {
                VoucherCode = voucherCode,
                ResellerId = resellerId!.Value,
                CampaignId = createVoucherDto.CampaignId,
                Value = createVoucherDto.Value,
                PointsRequired = createVoucherDto.PointsRequired,
                EligibleProducts = createVoucherDto.EligibleProducts,
                ExpiryDate = createVoucherDto.ExpiryDate,
                IsRedeemed = false
            };

            _context.Vouchers.Add(voucher);

            // Deduct points from campaignReseller
            campaignReseller.PointsUsedForVouchers += createVoucherDto.PointsRequired;

            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetVoucher), new { id = voucher.Id }, voucher);
        }

        // POST: api/reseller/voucher/{id}/generate-qr
        [HttpPost("{id}/generate-qr")]
        public async Task<ActionResult<QRCode>> GenerateQRCode(int id, GenerateQRCodeDto generateQRCodeDto)
        {
            var resellerId = GetCurrentUserId();
            if (resellerId == null)
                return Unauthorized();

            var voucher = await _context.Vouchers
                .FirstOrDefaultAsync(v => v.Id == id && v.ResellerId == resellerId);

            if (voucher == null)
                return NotFound();

            if (voucher.IsRedeemed)
                return BadRequest("Voucher has already been redeemed");

            if (voucher.ExpiryDate <= DateTime.UtcNow)
                return BadRequest("Voucher has expired");

            // Generate QR code
            var qrCode = new QRCode
            {
                Code = $"QR-{voucher.VoucherCode}-{Guid.NewGuid().ToString().Substring(0, 8).ToUpper()}",
                CampaignId = voucher.CampaignId,
                ResellerId = resellerId,
                VoucherId = voucher.Id,
                Points = voucher.PointsRequired,
                ExpiryDate = generateQRCodeDto.ExpiryDate ?? voucher.ExpiryDate,
                IsRedeemed = false
            };

            _context.QRCodes.Add(qrCode);
            await _context.SaveChangesAsync();

            return Ok(qrCode);
        }

        // GET: api/reseller/voucher/points-required
        [HttpGet("points-required")]
        public async Task<ActionResult<object>> GetPointsRequired()
        {
            var resellerId = GetCurrentUserId();
            if (resellerId == null)
                return Unauthorized();

            var reseller = await _context.Users.FindAsync(resellerId!.Value);
            if (reseller == null)
                return NotFound();

            // Get available campaigns for voucher creation
            var campaigns = await _context.CampaignResellers
                .Include(cr => cr.Campaign)
                .Where(cr => cr.ResellerId == resellerId && 
                           cr.IsApproved && 
                           cr.Campaign.IsActive &&
                           cr.Campaign.StartDate <= DateTime.UtcNow &&
                           cr.Campaign.EndDate >= DateTime.UtcNow)
                .Select(cr => cr.Campaign)
                .ToListAsync();

            return Ok(new
            {
                CurrentPoints = reseller.Points,
                AvailableCampaigns = campaigns
            });
        }

        // GET: api/reseller/voucher/statistics
        [HttpGet("statistics")]
        public async Task<ActionResult<object>> GetVoucherStatistics()
        {
            var resellerId = GetCurrentUserId();
            if (resellerId == null)
                return Unauthorized();

            var totalVouchers = await _context.Vouchers
                .Where(v => v.ResellerId == resellerId)
                .CountAsync();

            var redeemedVouchers = await _context.Vouchers
                .Where(v => v.ResellerId == resellerId && v.IsRedeemed)
                .CountAsync();

            var totalVoucherValue = await _context.Vouchers
                .Where(v => v.ResellerId == resellerId && v.IsRedeemed)
                .SumAsync(v => v.Value);

            var activeVouchers = await _context.Vouchers
                .Where(v => v.ResellerId == resellerId && !v.IsRedeemed && v.ExpiryDate > DateTime.UtcNow)
                .CountAsync();

            return Ok(new
            {
                TotalVouchers = totalVouchers,
                RedeemedVouchers = redeemedVouchers,
                ActiveVouchers = activeVouchers,
                TotalRedeemedValue = totalVoucherValue,
                RedemptionRate = totalVouchers > 0 ? (double)redeemedVouchers / totalVouchers * 100 : 0
            });
        }

        // GET: api/reseller/voucher/redemption-history
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

        // GET: api/reseller/campaign/{campaignId}/auto-voucher-info
        [HttpGet("campaign/{campaignId}/auto-voucher-info")]
        public async Task<ActionResult<object>> GetAutoVoucherInfo(int campaignId)
        {
            var resellerId = GetCurrentUserId();
            if (resellerId == null)
                return Unauthorized();

            var campaignReseller = await _context.CampaignResellers
                .Include(cr => cr.Campaign)
                .FirstOrDefaultAsync(cr => cr.CampaignId == campaignId && 
                                         cr.ResellerId == resellerId && 
                                         cr.IsApproved);

            if (campaignReseller == null)
                return NotFound("Campaign not found or not approved for this reseller");

            var campaign = campaignReseller.Campaign;
            if (campaign == null)
                return NotFound("Campaign not found");

            var availablePoints = campaignReseller.TotalPointsEarned - campaignReseller.PointsUsedForVouchers;
            var vouchersCanGenerate = campaign.EnableAutoVoucherGeneration && 
                                     campaign.VoucherGenerationThreshold.HasValue ? 
                                     availablePoints / campaign.VoucherGenerationThreshold.Value : 0;

            return Ok(new
            {
                CampaignId = campaignId,
                CampaignName = campaign.Name,
                EnableAutoVoucherGeneration = campaign.EnableAutoVoucherGeneration,
                VoucherGenerationThreshold = campaign.VoucherGenerationThreshold,
                VoucherValue = campaign.VoucherValue,
                VoucherValidityDays = campaign.VoucherValidityDays,
                TotalPointsEarned = campaignReseller.TotalPointsEarned,
                PointsUsedForVouchers = campaignReseller.PointsUsedForVouchers,
                AvailablePoints = availablePoints,
                VouchersCanGenerate = vouchersCanGenerate,
                TotalVouchersGenerated = campaignReseller.TotalVouchersGenerated,
                TotalVoucherValueGenerated = campaignReseller.TotalVoucherValueGenerated,
                LastVoucherGeneratedAt = campaignReseller.LastVoucherGeneratedAt
            });
        }

        [HttpGet("reseller/{resellerId}/all-vouchers")]
        public async Task<IActionResult> GetAllVouchersForReseller(int resellerId)
        {
            try
            {
                var vouchers = await _context.Vouchers
                    .Include(v => v.Campaign)
                    .Where(v => v.ResellerId == resellerId)
                    .OrderByDescending(v => v.CreatedAt)
                    .Select(v => new
                    {
                        VoucherCode = v.VoucherCode,
                        Value = v.Value,
                        CampaignName = v.Campaign.Name,
                        CampaignId = v.CampaignId,
                        PointsRequired = v.PointsRequired,
                        IsRedeemed = v.IsRedeemed,
                        CreatedAt = v.CreatedAt,
                        ExpiryDate = v.ExpiryDate,
                        EligibleProducts = v.EligibleProducts
                    })
                    .ToListAsync();

                return Ok(new
                {
                    Success = true,
                    Message = $"Found {vouchers.Count} vouchers for reseller {resellerId}",
                    Data = vouchers
                });
            }
            catch (Exception ex)
            {
                return BadRequest(new { Success = false, Message = ex.Message });
            }
        }

        private int? GetCurrentUserId()
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            return userIdClaim != null ? int.Parse(userIdClaim) : null;
        }
    }
} 