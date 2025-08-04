using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using backend.Services;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using System.Threading.Tasks;

namespace backend.Controllers.Manufacturer
{
    [ApiController]
    [Route("api/manufacturer/dashboard")]
    [Authorize(Roles = "manufacturer")]
    public class DashboardController : ControllerBase
    {
        private readonly ICampaignService _campaignService;
        private readonly backend.Data.ApplicationDbContext _context;

        public DashboardController(
            ICampaignService campaignService,
            backend.Data.ApplicationDbContext context)
        {
            _campaignService = campaignService;
            _context = context;
        }

        [HttpGet("stats")]
        public async Task<IActionResult> GetStats()
        {
            var manufacturerIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(manufacturerIdClaim) || !int.TryParse(manufacturerIdClaim, out int manufacturerId))
            {
                return Unauthorized();
            }

            var campaignCount = await _campaignService.GetCampaignCountAsync(manufacturerId);

            // Count vouchers with non-empty QrCode for this manufacturer's campaigns

            // Count vouchers with non-empty QrCode for this manufacturer's campaigns
            int qrCodeCount = await _context.Vouchers
                .Include(v => v.Campaign)
                .CountAsync(v => v.QrCode != "" && v.Campaign != null && v.Campaign.ManufacturerId == manufacturerId);

            return Ok(new
            {
                activeCampaigns = campaignCount,
                totalQRCodes = qrCodeCount, // Set to 0 or implement actual count as above
                activeResellers = 0,
                totalRedemptions = 0
            });
        }
    }
} 