using backend.Models.DTOs;
using backend.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace backend.Controllers.Customer
{
    [ApiController]
    [Route("api/customer/qrcodes")]
    [Authorize(Roles = "customer")]
    public class QRCodeController : ControllerBase
    {
        private readonly IQRCodeService _qrCodeService;
        public QRCodeController(IQRCodeService qrCodeService)
        {
            _qrCodeService = qrCodeService;
        }

        [HttpPost("redeem")]
        public async Task<IActionResult> Redeem([FromBody] RedeemQRCodeDto dto)
        {
            // Get user ID from claims
            var userIdClaim = User.Claims.FirstOrDefault(c => c.Type == "id" || c.Type.EndsWith("/nameidentifier"));
            if (userIdClaim == null) return Unauthorized();
            if (!int.TryParse(userIdClaim.Value, out int userId)) return Unauthorized();

            var result = await _qrCodeService.RedeemQRCodeByCodeAsync(dto.Code, userId, dto.Points);
            if (!result.Success) return BadRequest(result.Message);
            return Ok(result);
        }

        [HttpPost("info")]
        public IActionResult GetQRInfo([FromBody] QRInfoRequestDto dto)
        {
            if (string.IsNullOrEmpty(dto.qrRawString))
                return BadRequest(new { error = "QR raw string is required." });

            try
            {
                // If it's already a JSON object, just return it
                if (dto.qrRawString.TrimStart().StartsWith("{"))
                {
                    var qrInfo = System.Text.Json.JsonSerializer.Deserialize<object>(dto.qrRawString);
                    return Ok(qrInfo);
                }
                else
                {
                    // If it's not a JSON string, just return the raw string
                    return Ok(new { raw = dto.qrRawString });
                }
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