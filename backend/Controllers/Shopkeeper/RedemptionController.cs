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

            string codeToValidate = validationDto.QRCode;
            // Try to parse as JSON and extract 'code' property if present
            if (!string.IsNullOrWhiteSpace(validationDto.QRCode) && validationDto.QRCode.Trim().StartsWith("{"))
            {
                try
                {
                    using var doc = System.Text.Json.JsonDocument.Parse(validationDto.QRCode);
                    if (doc.RootElement.TryGetProperty("code", out var codeProp) && codeProp.ValueKind == System.Text.Json.JsonValueKind.String)
                    {
                        codeToValidate = codeProp.GetString();
                    }
                }
                catch (Exception ex)
                {
                    return BadRequest($"Invalid QR code JSON: {ex.Message}");
                }
            }

            var voucher = await _context.Vouchers
                .Include(v => v.Reseller)
                .Include(v => v.Campaign)
                .FirstOrDefaultAsync(v => v.QrCode == codeToValidate);

            if (voucher == null)
                return BadRequest($"Invalid QR code: {codeToValidate} not found in database");

            if (voucher.IsRedeemed)
                return BadRequest($"Voucher '{voucher.VoucherCode}' has already been redeemed");

            if (voucher.ExpiryDate <= DateTime.UtcNow)
                return BadRequest($"Voucher '{voucher.VoucherCode}' has expired (expiry: {voucher.ExpiryDate})");

            // Get eligible products for redemption
            var eligibleProductIds = new List<int>();
            if (!string.IsNullOrEmpty(voucher.EligibleProducts))
            {
                try
                {
                    eligibleProductIds = JsonSerializer.Deserialize<List<int>>(voucher.EligibleProducts);
                }
                catch (Exception ex)
                {
                    return BadRequest($"EligibleProducts JSON parse error: {ex.Message}");
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
                QRCode = voucher.QrCode,
                VoucherCode = voucher.VoucherCode,
                VoucherValue = voucher.Value,
                PointsRequired = voucher.PointsRequired,
                ResellerName = voucher.Reseller?.Name,
                CampaignName = voucher.Campaign?.Name,
                EligibleProducts = products,
                ExpiryDate = voucher.ExpiryDate
            });
        }

        // POST: api/shopkeeper/redemption/redeem
        [HttpPost("redeem")]
        public async Task<ActionResult<object>> RedeemVoucher(RedeemVoucherDto redeemDto)
        {
            var voucher = await _context.Vouchers
                .Include(v => v.Reseller)
                .Include(v => v.Campaign)
                .FirstOrDefaultAsync(v => v.QrCode == redeemDto.QRCode);

            if (voucher == null)
                return BadRequest("Invalid QR code");

            if (voucher.IsRedeemed)
                return BadRequest("Voucher has already been redeemed");

            if (voucher.ExpiryDate <= DateTime.UtcNow)
                return BadRequest("Voucher has expired");

            // Validate selected products
            var eligibleProductIds = new List<int>();
            if (!string.IsNullOrEmpty(voucher.EligibleProducts))
            {
                try
                {
                    eligibleProductIds = JsonSerializer.Deserialize<List<int>>(voucher.EligibleProducts);
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

            // Process redemption
            var shopkeeperId = GetCurrentUserId();
            if (shopkeeperId == null)
                return Unauthorized();

            voucher.IsRedeemed = true;
            voucher.RedeemedAt = DateTime.UtcNow;
            voucher.RedeemedByShopkeeperId = shopkeeperId;

            // Create redemption history
            var redemptionHistory = new RedemptionHistory
            {
                UserId = shopkeeperId.Value,
                QRCode = voucher.QrCode,
                Points = voucher.PointsRequired,
                RedeemedAt = DateTime.UtcNow,
                ResellerId = voucher.ResellerId,
                ShopkeeperId = shopkeeperId,
                VoucherId = voucher.Id,
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
                VoucherCode = voucher.VoucherCode,
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

        // GET: api/shopkeeper/top-products
        [HttpGet("/api/shopkeeper/top-products")]
        public async Task<ActionResult<IEnumerable<object>>> GetTopProducts()
        {
            var shopkeeperId = GetCurrentUserId();
            if (shopkeeperId == null)
                return Unauthorized();

            var histories = await _context.RedemptionHistories
                .Where(rh => rh.ShopkeeperId == shopkeeperId && rh.RedeemedProducts != null)
                .Select(rh => rh.RedeemedProducts)
                .ToListAsync();

            var allProducts = new List<ProductInfo>();
            foreach (var json in histories)
            {
                if (!string.IsNullOrEmpty(json))
                {
                    try
                    {
                        var products = JsonSerializer.Deserialize<List<ProductInfo>>(json);
                        if (products != null)
                            allProducts.AddRange(products);
                    }
                    catch { }
                }
            }

            var topProducts = allProducts
                .GroupBy(p => p.Id)
                .Select(g => new
                {
                    Name = g.First().Name ?? string.Empty,
                    Id = g.Key,
                    Redemptions = g.Count(),
                    Value = g.Sum(p => p.RetailPrice)
                })
                .OrderByDescending(x => x.Redemptions)
                .Take(5)
                .ToList();

            return Ok(topProducts);
        }

        private int? GetCurrentUserId()
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            return userIdClaim != null ? int.Parse(userIdClaim) : null;
        }

        private class ProductInfo
        {
            public int Id { get; set; }
            public string Name { get; set; } = string.Empty;
            public decimal RetailPrice { get; set; }
        }
    }
} 