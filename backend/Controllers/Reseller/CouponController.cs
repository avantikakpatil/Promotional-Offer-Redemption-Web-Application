using Microsoft.AspNetCore.Mvc;
using backend.Data;
using backend.Models;
using backend.Models.DTOs;
using System;
using System.Linq;
using Microsoft.AspNetCore.Authorization;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;

namespace backend.Controllers.Reseller
{
    [ApiController]
    [Route("api/reseller")]
    [Authorize(Roles = "reseller")]
    public class CouponController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public CouponController(ApplicationDbContext context)
        {
            _context = context;
        }

        [HttpPost("coupons/redeem")]
        public IActionResult RedeemCoupon([FromBody] RedeemQRCodeDto dto)
        {
            var coupon = _context.QRCodes.FirstOrDefault(q => q.Code == dto.Code);
            if (coupon == null || coupon.IsRedeemed)
                return BadRequest(new { error = "Invalid or already redeemed coupon." });

            var customer = _context.Users.FirstOrDefault(u => u.Id == dto.CustomerId);
            if (customer == null)
                return BadRequest(new { error = "Customer not found." });

            coupon.IsRedeemed = true;
            coupon.RedeemedByUserId = dto.CustomerId;
            coupon.RedeemedAt = DateTime.UtcNow;

            customer.Points += dto.Points;

            _context.SaveChanges();

            return Ok(new { message = "Coupon redeemed!", newPoints = customer.Points });
        }

        [HttpPost("coupons/info")]
        public IActionResult GetQRInfo([FromBody] RedeemQRCodeDto dto)
        {
            if (string.IsNullOrEmpty(dto.Code))
                return BadRequest(new { error = "QR code is required." });
            // For demo: just return the raw QR code
            return Ok(new { raw = dto.Code });
        }

        [HttpPost("rewards/redeem-from-customer")]
        public async Task<IActionResult> RedeemRewardFromCustomer([FromBody] RedeemRewardFromCustomerDto dto)
        {
            // Validate input
            if (dto.CustomerId <= 0 || dto.ResellerId <= 0 || dto.Points <= 0)
                return BadRequest(new { success = false, message = "Invalid data." });

            var customer = await _context.Users.Include(u => u.UserPoints).FirstOrDefaultAsync(u => u.Id == dto.CustomerId);
            var reseller = await _context.Users.Include(u => u.UserPoints).FirstOrDefaultAsync(u => u.Id == dto.ResellerId);
            if (customer == null || reseller == null)
                return BadRequest(new { success = false, message = "Customer or reseller not found." });

            var customerPoints = customer.UserPoints ?? await _context.UserPoints.FirstOrDefaultAsync(up => up.UserId == customer.Id);
            var resellerPoints = reseller.UserPoints ?? await _context.UserPoints.FirstOrDefaultAsync(up => up.UserId == reseller.Id);
            if (customerPoints == null || customerPoints.Points < dto.Points)
                return BadRequest(new { success = false, message = "Customer does not have enough points." });

            // Subtract from customer
            customerPoints.Points -= dto.Points;
            customerPoints.LastUpdated = DateTime.UtcNow;
            // Add to reseller
            if (resellerPoints == null)
            {
                resellerPoints = new UserPoints { UserId = reseller.Id, Points = 0, RedeemedPoints = 0, LastUpdated = DateTime.UtcNow };
                _context.UserPoints.Add(resellerPoints);
            }
            resellerPoints.Points += dto.Points;
            resellerPoints.LastUpdated = DateTime.UtcNow;

            // Add to redemption history for both
            _context.RedemptionHistories.Add(new RedemptionHistory
            {
                UserId = customer.Id,
                QRCode = $"Reward:{dto.RewardId}",
                Points = -dto.Points,
                RedeemedAt = DateTime.UtcNow
            });
            _context.RedemptionHistories.Add(new RedemptionHistory
            {
                UserId = reseller.Id,
                QRCode = $"Reward:{dto.RewardId}",
                Points = dto.Points,
                RedeemedAt = DateTime.UtcNow
            });

            await _context.SaveChangesAsync();
            return Ok(new { success = true, message = $"{dto.Points} points transferred from customer to reseller." });
        }

        [HttpGet("rewards")]
        public async Task<IActionResult> GetResellerRewards()
        {
            var rewards = await _context.RewardTiers.ToListAsync();
            return Ok(rewards);
        }

        [HttpGet("history")]
        public async Task<IActionResult> GetResellerHistory()
        {
            // Get reseller id from token/claims
            var userIdClaim = User.Claims.FirstOrDefault(c => c.Type == "id" || c.Type.EndsWith("/nameidentifier"));
            if (userIdClaim == null) return Unauthorized();
            if (!int.TryParse(userIdClaim.Value, out int resellerId)) return Unauthorized();

            var user = await _context.Users.FindAsync(resellerId);
            if (user == null) return NotFound();
            
            var userPoints = await _context.UserPoints.FirstOrDefaultAsync(up => up.UserId == resellerId);
            var history = await _context.RedemptionHistories
                .Where(h => h.UserId == resellerId)
                .OrderByDescending(h => h.RedeemedAt)
                .Select(h => new {
                    id = h.Id,
                    qrCode = h.QRCode,
                    points = h.Points,
                    redeemedAt = h.RedeemedAt
                })
                .ToListAsync();
            
            Console.WriteLine($"GetResellerHistory for user {resellerId}: User.Points = {user.Points}, UserPoints.Points = {userPoints?.Points ?? 0}");
            
            return Ok(new {
                id = user.Id,
                name = user.Name,
                email = user.Email,
                points = userPoints?.Points ?? user.Points, // Use UserPoints table for available points, fallback to User.Points
                redemptionHistory = history
            });
        }
    }
} 