using Microsoft.AspNetCore.Mvc;
using backend.Data;
using backend.Models;
using backend.Models.DTOs;
using System;
using System.Linq;

namespace backend.Controllers.Reseller
{
    [ApiController]
    [Route("api/coupons")]
    public class CouponController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public CouponController(ApplicationDbContext context)
        {
            _context = context;
        }

        [HttpPost("redeem")]
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

        [HttpPost("info")]
        public IActionResult GetQRInfo([FromBody] RedeemQRCodeDto dto)
        {
            if (string.IsNullOrEmpty(dto.Code))
                return BadRequest(new { error = "QR code is required." });
            // For demo: just return the raw QR code
            return Ok(new { raw = dto.Code });
        }
    }
} 