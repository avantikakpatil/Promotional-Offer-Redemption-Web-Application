using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using backend.Data;
using backend.Models;
using backend.Models.DTOs;
using System.Security.Claims;
using System.Text.Json;

namespace backend.Controllers.Shopkeeper
{
    [ApiController]
    [Route("api/shopkeeper/[controller]")]
    public class RedemptionController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public RedemptionController(ApplicationDbContext context)
        {
            _context = context;
        }

        // POST: api/shopkeeper/redemption/validate-qr
        [HttpPost("validate-qr")]
        public async Task<ActionResult<object>> ValidateQRCode(VoucherValidationDto validationDto)
        {
            var shopkeeperId = GetCurrentUserId();
            if (shopkeeperId == null)
                return Unauthorized();

            var qrCode = await _context.QRCodes
                .Include(q => q.Voucher)
                .Include(q => q.Reseller)
                .Include(q => q.Campaign)
                .FirstOrDefaultAsync(q => q.Code == validationDto.QRCode);

            if (qrCode == null)
                return BadRequest("Invalid QR code");

            if (qrCode.IsRedeemed)
                return BadRequest("QR code has already been redeemed");

            if (qrCode.ExpiryDate.HasValue && qrCode.ExpiryDate <= DateTime.UtcNow)
                return BadRequest("QR code has expired");

            if (qrCode.Voucher == null)
                return BadRequest("No voucher associated with this QR code");

            if (qrCode.Voucher.IsRedeemed)
                return BadRequest("Voucher has already been redeemed");

            if (qrCode.Voucher.ExpiryDate <= DateTime.UtcNow)
                return BadRequest("Voucher has expired");

            // Get eligible products for redemption
            var eligibleProductIds = new List<int>();
            if (!string.IsNullOrEmpty(qrCode.Voucher.EligibleProducts))
            {
                try
                {
                    eligibleProductIds = JsonSerializer.Deserialize<List<int>>(qrCode.Voucher.EligibleProducts);
                }
                catch
                {
                    // If JSON parsing fails, return empty list
                }
            }

            var products = new List<object>();
            if (eligibleProductIds.Any())
            {
                var productList = await _context.Products
                    .Where(p => eligibleProductIds.Contains(p.Id) && p.IsActive)
                    .Select(p => new
                    {
                        p.Id,
                        p.Name,
                        p.Description,
                        p.Category,
                        p.RetailPrice,
                        p.Brand
                    })
                    .ToListAsync();
                products = productList.Cast<object>().ToList();
            }

            return Ok(new
            {
                QRCode = qrCode.Code,
                VoucherCode = qrCode.Voucher.VoucherCode,
                VoucherValue = qrCode.Voucher.Value,
                PointsRequired = qrCode.Points,
                ResellerName = qrCode.Reseller?.Name,
                CampaignName = qrCode.Campaign?.Name,
                EligibleProducts = products,
                ExpiryDate = qrCode.Voucher.ExpiryDate
            });
        }

        // POST: api/shopkeeper/redemption/redeem
        [HttpPost("redeem")]
        public async Task<ActionResult<object>> RedeemVoucher(RedeemVoucherDto redeemDto)
        {
            var shopkeeperId = GetCurrentUserId();
            if (shopkeeperId == null)
                return Unauthorized();

            var qrCode = await _context.QRCodes
                .Include(q => q.Voucher)
                .Include(q => q.Reseller)
                .Include(q => q.Campaign)
                .FirstOrDefaultAsync(q => q.Code == redeemDto.QRCode);

            if (qrCode == null)
                return BadRequest("Invalid QR code");

            if (qrCode.IsRedeemed)
                return BadRequest("QR code has already been redeemed");

            if (qrCode.ExpiryDate.HasValue && qrCode.ExpiryDate <= DateTime.UtcNow)
                return BadRequest("QR code has expired");

            if (qrCode.Voucher == null)
                return BadRequest("No voucher associated with this QR code");

            if (qrCode.Voucher.IsRedeemed)
                return BadRequest("Voucher has already been redeemed");

            if (qrCode.Voucher.ExpiryDate <= DateTime.UtcNow)
                return BadRequest("Voucher has expired");

            // Validate selected products
            var eligibleProductIds = new List<int>();
            if (!string.IsNullOrEmpty(qrCode.Voucher.EligibleProducts))
            {
                try
                {
                    eligibleProductIds = JsonSerializer.Deserialize<List<int>>(qrCode.Voucher.EligibleProducts);
                }
                catch
                {
                    // If JSON parsing fails, return empty list
                }
            }

            if (eligibleProductIds.Any() && redeemDto.SelectedProductIds != null && !redeemDto.SelectedProductIds.All(id => eligibleProductIds.Contains(id)))
                return BadRequest("Some selected products are not eligible for this voucher");

            // Get selected products
            var selectedProducts = await _context.Products
                .Where(p => redeemDto.SelectedProductIds != null && redeemDto.SelectedProductIds.Contains(p.Id))
                .ToListAsync();

            var totalValue = selectedProducts.Sum(p => p.RetailPrice);

            if (totalValue > qrCode.Voucher.Value)
                return BadRequest("Selected products exceed voucher value");

            // Process redemption
            qrCode.IsRedeemed = true;
            qrCode.RedeemedAt = DateTime.UtcNow;
            qrCode.RedeemedByShopkeeperId = shopkeeperId;

            qrCode.Voucher.IsRedeemed = true;
            qrCode.Voucher.RedeemedAt = DateTime.UtcNow;
            qrCode.Voucher.RedeemedByShopkeeperId = shopkeeperId;

            // Create redemption history
            var redemptionHistory = new RedemptionHistory
            {
                UserId = shopkeeperId.Value,
                QRCode = qrCode.Code,
                Points = qrCode.Points,
                RedeemedAt = DateTime.UtcNow,
                ResellerId = qrCode.ResellerId,
                ShopkeeperId = shopkeeperId,
                VoucherId = qrCode.VoucherId,
                RedeemedProducts = JsonSerializer.Serialize(selectedProducts.Select(p => new { p.Id, p.Name, p.RetailPrice })),
                RedemptionValue = totalValue,
                RedemptionType = "voucher"
            };

            _context.RedemptionHistories.Add(redemptionHistory);

            await _context.SaveChangesAsync();

            return Ok(new
            {
                Success = true,
                Message = "Voucher redeemed successfully",
                VoucherCode = qrCode.Voucher.VoucherCode,
                RedeemedValue = totalValue,
                RedeemedProducts = selectedProducts.Select(p => new { p.Name, p.RetailPrice }),
                RedeemedAt = DateTime.UtcNow
            });
        }

        // GET: api/shopkeeper/redemption/history
        [HttpGet("history")]
        public async Task<ActionResult<IEnumerable<RedemptionHistory>>> GetRedemptionHistory()
        {
            var shopkeeperId = GetCurrentUserId();
            if (shopkeeperId == null)
                return Unauthorized();

            var history = await _context.RedemptionHistories
                .Include(rh => rh.Reseller)
                .Include(rh => rh.Voucher)
                .Include(rh => rh.Campaign)
                .Where(rh => rh.ShopkeeperId == shopkeeperId)
                .OrderByDescending(rh => rh.RedeemedAt)
                .ToListAsync();

            return Ok(history);
        }

        // GET: api/shopkeeper/redemption/statistics
        [HttpGet("statistics")]
        public async Task<ActionResult<object>> GetRedemptionStatistics()
        {
            var shopkeeperId = GetCurrentUserId();
            if (shopkeeperId == null)
                return Unauthorized();

            var totalRedemptions = await _context.RedemptionHistories
                .Where(rh => rh.ShopkeeperId == shopkeeperId)
                .CountAsync();

            var totalValue = await _context.RedemptionHistories
                .Where(rh => rh.ShopkeeperId == shopkeeperId)
                .SumAsync(rh => rh.RedemptionValue ?? 0);

            var todayRedemptions = await _context.RedemptionHistories
                .Where(rh => rh.ShopkeeperId == shopkeeperId && 
                           rh.RedeemedAt.Date == DateTime.UtcNow.Date)
                .CountAsync();

            var todayValue = await _context.RedemptionHistories
                .Where(rh => rh.ShopkeeperId == shopkeeperId && 
                           rh.RedeemedAt.Date == DateTime.UtcNow.Date)
                .SumAsync(rh => rh.RedemptionValue ?? 0);

            return Ok(new
            {
                TotalRedemptions = totalRedemptions,
                TotalValue = totalValue,
                TodayRedemptions = todayRedemptions,
                TodayValue = todayValue,
                AverageValue = totalRedemptions > 0 ? totalValue / totalRedemptions : 0
            });
        }

        // GET: api/shopkeeper/redemption/resellers
        [HttpGet("resellers")]
        public async Task<ActionResult<IEnumerable<object>>> GetAssignedResellers()
        {
            var shopkeeperId = GetCurrentUserId();
            if (shopkeeperId == null)
                return Unauthorized();

            var shopkeeper = await _context.Users
                .Include(u => u.AssignedReseller)
                .FirstOrDefaultAsync(u => u.Id == shopkeeperId);

            if (shopkeeper?.AssignedReseller == null)
                return Ok(new List<object>());

            return Ok(new[]
            {
                new
                {
                    shopkeeper.AssignedReseller.Id,
                    shopkeeper.AssignedReseller.Name,
                    shopkeeper.AssignedReseller.BusinessName,
                    shopkeeper.AssignedReseller.Email,
                    shopkeeper.AssignedReseller.Phone
                }
            });
        }

        private int? GetCurrentUserId()
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            return userIdClaim != null ? int.Parse(userIdClaim) : null;
        }
    }
} 