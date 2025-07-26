using backend.Models.DTOs;
using backend.Services;
using backend.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace backend.Controllers.Customer
{
    [ApiController]
    [Route("api/customer/qrcodes")]
    [Authorize(Roles = "customer")]
    public class QRCodeController : ControllerBase
    {
        private readonly IQRCodeService _qrCodeService;
        private readonly ApplicationDbContext _context;
        
        public QRCodeController(IQRCodeService qrCodeService, ApplicationDbContext context)
        {
            _qrCodeService = qrCodeService;
            _context = context;
        }

        [HttpPost("redeem")]
        public async Task<IActionResult> Redeem([FromBody] RedeemQRCodeDto dto)
        {
            // Get user ID from claims
            var userIdClaim = User.Claims.FirstOrDefault(c => c.Type == "id" || c.Type.EndsWith("/nameidentifier"));
            if (userIdClaim == null) return Unauthorized();
            if (!int.TryParse(userIdClaim.Value, out int userId)) return Unauthorized();

            var result = await _qrCodeService.RedeemQRCodeByCodeAsync(dto.Code ?? "", userId, dto.Points);
            if (!result.Success) return BadRequest(result);
            return Ok(result);
        }

        [HttpPost("info")]
        public async Task<IActionResult> GetQRInfo([FromBody] QRInfoRequestDto dto)
        {
            if (string.IsNullOrEmpty(dto.qrRawString))
                return BadRequest(new { error = "QR raw string is required." });

            try
            {
                // Extract the QR code from the raw string
                string qrCode = dto.qrRawString ?? "";
                
                // If it's a JSON object, try to extract the code
                if ((dto.qrRawString ?? "").TrimStart().StartsWith("{"))
                {
                    try
                    {
                        var qrInfo = System.Text.Json.JsonSerializer.Deserialize<Dictionary<string, object>>(dto.qrRawString ?? "");
                        if (qrInfo.ContainsKey("code"))
                        {
                            qrCode = qrInfo["code"]?.ToString() ?? "";
                        }
                        else if (qrInfo.ContainsKey("Code"))
                        {
                            qrCode = qrInfo["Code"]?.ToString() ?? "";
                        }
                        else if (qrInfo.ContainsKey("raw"))
                        {
                            qrCode = qrInfo["raw"]?.ToString() ?? "";
                        }
                    }
                    catch
                    {
                        // If JSON parsing fails, use the raw string
                        qrCode = dto.qrRawString;
                    }
                }

                // Validate the QR code exists in the database
                var qrCodeEntity = await _qrCodeService.GetQRCodeByCodeAsync(qrCode);
                if (qrCodeEntity == null)
                {
                    return BadRequest(new { 
                        error = "Invalid QR code. This QR code does not exist in our system.",
                        errorCode = "INVALID_QR_CODE"
                    });
                }

                // Check if QR code is already redeemed
                if (qrCodeEntity.IsRedeemed)
                {
                    return BadRequest(new { 
                        error = "This QR code has already been redeemed.",
                        errorCode = "ALREADY_REDEEMED"
                    });
                }

                // Get campaign information
                var campaign = await _context.Campaigns.FindAsync(qrCodeEntity.CampaignId);
                if (campaign == null)
                {
                    return BadRequest(new { 
                        error = "This QR code is associated with an invalid campaign.",
                        errorCode = "INVALID_CAMPAIGN"
                    });
                }

                // Check if campaign is active
                var now = DateTime.UtcNow;
                if (campaign.StartDate > now || campaign.EndDate < now)
                {
                    return BadRequest(new { 
                        error = $"This campaign is not active. Campaign period: {campaign.StartDate.ToString("MMM dd, yyyy")} to {campaign.EndDate.ToString("MMM dd, yyyy")}.",
                        errorCode = "CAMPAIGN_INACTIVE"
                    });
                }

                // Return the QR code information
                return Ok(new {
                    code = qrCode,
                    product = campaign.ProductType,
                    productId = $"CAMPAIGN-{campaign.Id}",
                    campaignName = campaign.Name,
                    description = campaign.Description,
                    startDate = campaign.StartDate,
                    endDate = campaign.EndDate
                });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Server error in GetQRInfo: {ex.Message}");
                return StatusCode(500, new { error = "Server error: " + ex.Message });
            }
        }

        [HttpGet("history")]
        public async Task<IActionResult> GetHistory()
        {
            // Get user ID from claims
            var userIdClaim = User.Claims.FirstOrDefault(c => c.Type == "id" || c.Type.EndsWith("/nameidentifier"));
            if (userIdClaim == null) return Unauthorized();
            if (!int.TryParse(userIdClaim.Value, out int userId)) return Unauthorized();

            var user = await _qrCodeService.GetUserWithHistoryAsync(userId);
            if (user == null) return NotFound();
            return Ok(user);
        }
    }
} 