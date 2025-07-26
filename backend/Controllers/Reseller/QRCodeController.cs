using backend.Models.DTOs;
using backend.Services;
using backend.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace backend.Controllers.Reseller
{
    [ApiController]
    [Route("api/reseller/qrcodes")]
    [Authorize(Roles = "reseller")]
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
        public async Task<IActionResult> Redeem([FromBody] RedeemQRCodeByResellerDto dto)
        {
            // Get reseller ID from claims
            var userIdClaim = User.Claims.FirstOrDefault(c => c.Type == "id" || c.Type.EndsWith("/nameidentifier"));
            if (userIdClaim == null) return Unauthorized();
            if (!int.TryParse(userIdClaim.Value, out int resellerId)) return Unauthorized();

            var result = await _qrCodeService.RedeemQRCodeByResellerAsync(dto.Code ?? "", resellerId, dto.CustomerId);
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

                // Try to extract customer information from QR code if it's a JSON object
                string? customerName = null;
                int? customerId = null;
                
                if ((dto.qrRawString ?? "").TrimStart().StartsWith("{"))
                {
                    try
                    {
                        var qrInfo = System.Text.Json.JsonSerializer.Deserialize<Dictionary<string, object>>(dto.qrRawString ?? "");
                        if (qrInfo.ContainsKey("customerId") && int.TryParse(qrInfo["customerId"]?.ToString(), out int extractedCustomerId))
                        {
                            customerId = extractedCustomerId;
                            var customer = await _context.Users.FindAsync(customerId);
                            customerName = customer?.Name;
                        }
                    }
                    catch
                    {
                        // Ignore parsing errors
                    }
                }

                // Return the QR code information
                return Ok(new {
                    code = qrCode,
                    product = campaign.ProductType,
                    productId = $"CAMPAIGN-{campaign.Id}",
                    campaignName = campaign.Name,
                    description = campaign.Description,
                    startDate = campaign.StartDate,
                    endDate = campaign.EndDate,
                    customerId = customerId,
                    customerName = customerName
                });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Server error in GetQRInfo: {ex.Message}");
                return StatusCode(500, new { error = "Server error: " + ex.Message });
            }
        }

        [HttpGet]
        public async Task<IActionResult> GetQRCodes()
        {
            // Get reseller ID from claims
            var userIdClaim = User.Claims.FirstOrDefault(c => c.Type == "id" || c.Type.EndsWith("/nameidentifier"));
            if (userIdClaim == null) return Unauthorized();
            if (!int.TryParse(userIdClaim.Value, out int resellerId)) return Unauthorized();

            try
            {
                var qrCodes = await _context.QRCodes
                    .Where(q => q.ResellerId == resellerId)
                    .Include(q => q.Voucher)
                    .Include(q => q.Campaign)
                    .OrderByDescending(q => q.CreatedAt)
                    .Select(q => new
                    {
                        id = q.Id,
                        code = q.Code,
                        points = q.Points,
                        isRedeemed = q.IsRedeemed,
                        createdAt = q.CreatedAt,
                        redeemedAt = q.RedeemedAt,
                        expiryDate = q.ExpiryDate,
                        voucherId = q.VoucherId,
                        campaignId = q.CampaignId,
                        campaignName = q.Campaign.Name,
                        voucherCode = q.Voucher.VoucherCode
                    })
                    .ToListAsync();

                return Ok(qrCodes);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error fetching QR codes: {ex.Message}");
                return StatusCode(500, new { error = "Failed to fetch QR codes." });
            }
        }

        [HttpGet("history")]
        public async Task<IActionResult> GetRedemptionHistory()
        {
            // Get reseller ID from claims
            var userIdClaim = User.Claims.FirstOrDefault(c => c.Type == "id" || c.Type.EndsWith("/nameidentifier"));
            if (userIdClaim == null) return Unauthorized();
            if (!int.TryParse(userIdClaim.Value, out int resellerId)) return Unauthorized();

            try
            {
                var history = await _context.RedemptionHistories
                    .Where(h => h.ResellerId == resellerId)
                    .Include(h => h.User)
                    .Include(h => h.Campaign)
                    .OrderByDescending(h => h.RedeemedAt)
                    .Select(h => new
                    {
                        id = h.Id,
                        customerName = h.User.Name,
                        customerEmail = h.User.Email,
                        qrCode = h.QRCode,
                        points = h.Points,
                        redeemedAt = h.RedeemedAt,
                        campaignName = h.Campaign.Name,
                        redemptionType = h.RedemptionType
                    })
                    .ToListAsync();

                return Ok(new { redemptionHistory = history });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error fetching redemption history: {ex.Message}");
                return StatusCode(500, new { error = "Failed to fetch redemption history." });
            }
        }
    }
} 