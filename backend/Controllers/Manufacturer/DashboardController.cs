using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using backend.Services;
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
        private readonly IQRCodeService _qrCodeService;

        public DashboardController(
            ICampaignService campaignService,
            IQRCodeService qrCodeService)
        {
            _campaignService = campaignService;
            _qrCodeService = qrCodeService;
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
            var qrCodeCount = await _qrCodeService.GetQRCodeCountAsync(manufacturerId);

            return Ok(new
            {
                activeCampaigns = campaignCount,
                totalQRCodes = qrCodeCount,
                activeResellers = 0,
                totalRedemptions = 0
            });
        }
    }
} 