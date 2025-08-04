using backend.Models.DTOs;
using backend.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using backend.Data;
using backend.Models;
using System.Security.Claims;

namespace backend.Controllers.Manufacturer
{
    [ApiController]
    [Route("api/manufacturer/campaigns")]
    [Authorize] // Assuming you have JWT authentication
    public class CampaignController : ControllerBase
    {
        private readonly ICampaignService _campaignService;
        private readonly ApplicationDbContext _context;

        public CampaignController(ICampaignService campaignService, ApplicationDbContext context)
        {
            _campaignService = campaignService;
            _context = context;
        }

        [HttpPost]
        public async Task<ActionResult<ApiResponse<CampaignDto>>> CreateCampaign([FromBody] CreateCampaignDto createCampaignDto)
        {
            try
            {
                // Get manufacturer ID from JWT token
                var manufacturerIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;

                if (string.IsNullOrEmpty(manufacturerIdClaim) || !int.TryParse(manufacturerIdClaim, out int manufacturerId))
                {
                    return Unauthorized(new ApiResponse<CampaignDto>
                    {
                        Success = false,
                        Message = "Invalid or missing manufacturer authentication",
                        Errors = new List<string> { "User ID not found in token" }
                    });
                }

                // Validate user role (robust extraction and case-insensitive check)
                var roleClaim = User.FindFirst("http://schemas.microsoft.com/ws/2008/06/identity/claims/role")?.Value
                    ?? User.FindFirst(ClaimTypes.Role)?.Value;
                if (!string.Equals(roleClaim, "manufacturer", StringComparison.OrdinalIgnoreCase))
                {
                    return Forbid();
                }

                if (!ModelState.IsValid)
                {
                    var errors = ModelState
                        .SelectMany(x => x.Value!.Errors)
                        .Select(x => x.ErrorMessage)
                        .ToList();

                    return BadRequest(new ApiResponse<CampaignDto>
                    {
                        Success = false,
                        Message = "Validation failed",
                        Errors = errors
                    });
                }

                var result = await _campaignService.CreateCampaignAsync(createCampaignDto, manufacturerId);

                if (!result.Success)
                {
                    return BadRequest(result);
                }

                return CreatedAtAction(
                    nameof(GetCampaignById),
                    new { id = result.Data!.Id },
                    result
                );
            }
            catch (Exception ex)
            {
                return StatusCode(500, new ApiResponse<CampaignDto>
                {
                    Success = false,
                    Message = "An internal server error occurred",
                    Errors = new List<string> { ex.Message }
                });
            }
        }

        [HttpGet]
        public async Task<ActionResult<ApiResponse<List<CampaignDto>>>> GetCampaigns()
        {
            try
            {
                var manufacturerIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;

                if (string.IsNullOrEmpty(manufacturerIdClaim) || !int.TryParse(manufacturerIdClaim, out int manufacturerId))
                {
                    return Unauthorized(new ApiResponse<List<CampaignDto>>
                    {
                        Success = false,
                        Message = "Invalid or missing manufacturer authentication",
                        Errors = new List<string> { "User ID not found in token" }
                    });
                }

                var result = await _campaignService.GetCampaignsByManufacturerAsync(manufacturerId);

                if (!result.Success)
                {
                    return BadRequest(result);
                }

                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new ApiResponse<List<CampaignDto>>
                {
                    Success = false,
                    Message = "An internal server error occurred",
                    Errors = new List<string> { ex.Message }
                });
            }
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<ApiResponse<CampaignDto>>> GetCampaignById(int id)
        {
            try
            {
                var manufacturerIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;

                if (string.IsNullOrEmpty(manufacturerIdClaim) || !int.TryParse(manufacturerIdClaim, out int manufacturerId))
                {
                    return Unauthorized(new ApiResponse<CampaignDto>
                    {
                        Success = false,
                        Message = "Invalid or missing manufacturer authentication",
                        Errors = new List<string> { "User ID not found in token" }
                    });
                }

                var result = await _campaignService.GetCampaignByIdAsync(id, manufacturerId);

                if (!result.Success)
                {
                    return NotFound(result);
                }

                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new ApiResponse<CampaignDto>
                {
                    Success = false,
                    Message = "An internal server error occurred",
                    Errors = new List<string> { ex.Message }
                });
            }
        }

        [HttpPut("{id}")]
        public async Task<ActionResult<ApiResponse<CampaignDto>>> UpdateCampaign(int id, [FromBody] CreateCampaignDto updateCampaignDto)
        {
            try
            {
                var manufacturerIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;

                if (string.IsNullOrEmpty(manufacturerIdClaim) || !int.TryParse(manufacturerIdClaim, out int manufacturerId))
                {
                    return Unauthorized(new ApiResponse<CampaignDto>
                    {
                        Success = false,
                        Message = "Invalid or missing manufacturer authentication",
                        Errors = new List<string> { "User ID not found in token" }
                    });
                }

                if (!ModelState.IsValid)
                {
                    var errors = ModelState
                        .SelectMany(x => x.Value!.Errors)
                        .Select(x => x.ErrorMessage)
                        .ToList();

                    return BadRequest(new ApiResponse<CampaignDto>
                    {
                        Success = false,
                        Message = "Validation failed",
                        Errors = errors
                    });
                }

                var result = await _campaignService.UpdateCampaignAsync(id, updateCampaignDto, manufacturerId);

                if (!result.Success)
                {
                    return BadRequest(result);
                }

                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new ApiResponse<CampaignDto>
                {
                    Success = false,
                    Message = "An internal server error occurred",
                    Errors = new List<string> { ex.Message }
                });
            }
        }

        [HttpDelete("{id}")]
        public async Task<ActionResult<ApiResponse<bool>>> DeleteCampaign(int id)
        {
            try
            {
                var manufacturerIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;

                if (string.IsNullOrEmpty(manufacturerIdClaim) || !int.TryParse(manufacturerIdClaim, out int manufacturerId))
                {
                    return Unauthorized(new ApiResponse<bool>
                    {
                        Success = false,
                        Message = "Invalid or missing manufacturer authentication",
                        Errors = new List<string> { "User ID not found in token" }
                    });
                }

                var result = await _campaignService.DeleteCampaignAsync(id, manufacturerId);

                if (!result.Success)
                {
                    return NotFound(result);
                }

                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new ApiResponse<bool>
                {
                    Success = false,
                    Message = "An internal server error occurred",
                    Errors = new List<string> { ex.Message }
                });
            }
        }

        [HttpPatch("{id}/toggle-status")]
        public async Task<ActionResult<ApiResponse<bool>>> ToggleCampaignStatus(int id)
        {
            try
            {
                var manufacturerIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;

                if (string.IsNullOrEmpty(manufacturerIdClaim) || !int.TryParse(manufacturerIdClaim, out int manufacturerId))
                {
                    return Unauthorized(new ApiResponse<bool>
                    {
                        Success = false,
                        Message = "Invalid or missing manufacturer authentication",
                        Errors = new List<string> { "User ID not found in token" }
                    });
                }

                var result = await _campaignService.ToggleCampaignStatusAsync(id, manufacturerId);

                if (!result.Success)
                {
                    return BadRequest(result);
                }

                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new ApiResponse<bool>
                {
                    Success = false,
                    Message = "An internal server error occurred",
                    Errors = new List<string> { ex.Message }
                });
            }
        }

        // B2B Specific Endpoints

        // POST: api/manufacturer/campaigns/{id}/assign-reseller
        [HttpPost("{id}/assign-reseller")]
        public async Task<ActionResult<object>> AssignReseller(int id, AssignResellerDto assignResellerDto)
        {
            var manufacturerId = GetCurrentUserId();
            if (manufacturerId == null)
                return Unauthorized();

            // Validate campaign belongs to manufacturer
            var campaign = await _context.Campaigns
                .FirstOrDefaultAsync(c => c.Id == id && c.ManufacturerId == manufacturerId);

            if (campaign == null)
                return NotFound("Campaign not found");

            // Validate reseller exists and is assigned to this manufacturer
            var reseller = await _context.Users
                .FirstOrDefaultAsync(u => u.Id == assignResellerDto.ResellerId && 
                                        u.Role == "reseller" && 
                                        u.AssignedManufacturerId == manufacturerId);

            if (reseller == null)
                return BadRequest("Reseller not found or not assigned to this manufacturer");

            // Check if already assigned
            var existingAssignment = await _context.CampaignResellers
                .FirstOrDefaultAsync(cr => cr.CampaignId == id && cr.ResellerId == assignResellerDto.ResellerId);

            if (existingAssignment != null)
                return BadRequest("Reseller is already assigned to this campaign");

            var campaignReseller = new CampaignReseller
            {
                CampaignId = id,
                ResellerId = assignResellerDto.ResellerId,
                IsApproved = assignResellerDto.IsApproved,
                ApprovedAt = assignResellerDto.IsApproved ? DateTime.UtcNow : null,
                ApprovedByUserId = assignResellerDto.IsApproved ? manufacturerId : null
            };

            _context.CampaignResellers.Add(campaignReseller);
            await _context.SaveChangesAsync();

            return Ok(new { Message = "Reseller assigned successfully", CampaignReseller = campaignReseller });
        }

        // GET: api/manufacturer/campaigns/{id}/resellers
        [HttpGet("{id}/resellers")]
        public async Task<ActionResult<IEnumerable<CampaignResellerDto>>> GetCampaignResellers(int id)
        {
            var manufacturerId = GetCurrentUserId();
            if (manufacturerId == null)
                return Unauthorized();

            // Validate campaign belongs to manufacturer
            var campaign = await _context.Campaigns
                .FirstOrDefaultAsync(c => c.Id == id && c.ManufacturerId == manufacturerId);

            if (campaign == null)
                return NotFound("Campaign not found");

            var campaignResellers = await _context.CampaignResellers
                .Include(cr => cr.Reseller)
                .Include(cr => cr.Campaign)
                .Where(cr => cr.CampaignId == id)
                .Select(cr => new CampaignResellerDto
                {
                    Id = cr.Id,
                    CampaignId = cr.CampaignId,
                    ResellerId = cr.ResellerId,
                    IsApproved = cr.IsApproved,
                    ApprovedAt = cr.ApprovedAt,
                    TotalPointsEarned = cr.TotalPointsEarned,
                    TotalOrderValue = cr.TotalOrderValue,
                    CreatedAt = cr.CreatedAt,
                    Reseller = cr.Reseller,
                    Campaign = cr.Campaign
                })
                .ToListAsync();

            return Ok(campaignResellers);
        }

        // PUT: api/manufacturer/campaigns/{id}/resellers/{resellerId}/approve
        [HttpPut("{id}/resellers/{resellerId}/approve")]
        public async Task<ActionResult<object>> ApproveReseller(int id, int resellerId)
        {
            var manufacturerId = GetCurrentUserId();
            if (manufacturerId == null)
                return Unauthorized();

            var campaignReseller = await _context.CampaignResellers
                .Include(cr => cr.Campaign)
                .FirstOrDefaultAsync(cr => cr.CampaignId == id && 
                                         cr.ResellerId == resellerId && 
                                         cr.Campaign.ManufacturerId == manufacturerId);

            if (campaignReseller == null)
                return NotFound("Campaign reseller assignment not found");

            campaignReseller.IsApproved = true;
            campaignReseller.ApprovedAt = DateTime.UtcNow;
            campaignReseller.ApprovedByUserId = manufacturerId;

            await _context.SaveChangesAsync();

            return Ok(new { Message = "Reseller approved successfully" });
        }

        // GET: api/manufacturer/campaigns/{id}/analytics
        [HttpGet("{id}/analytics")]
        public async Task<ActionResult<object>> GetCampaignAnalytics(int id)
        {
            var manufacturerId = GetCurrentUserId();
            if (manufacturerId == null)
                return Unauthorized();

            // Validate campaign belongs to manufacturer
            var campaign = await _context.Campaigns
                .FirstOrDefaultAsync(c => c.Id == id && c.ManufacturerId == manufacturerId);

            if (campaign == null)
                return NotFound("Campaign not found");

            // Get campaign statistics
            var totalResellers = await _context.CampaignResellers
                .Where(cr => cr.CampaignId == id)
                .CountAsync();

            var approvedResellers = await _context.CampaignResellers
                .Where(cr => cr.CampaignId == id && cr.IsApproved)
                .CountAsync();

            var totalOrders = await _context.Orders
                .Where(o => o.CampaignId == id)
                .CountAsync();

            var totalOrderValue = await _context.Orders
                .Where(o => o.CampaignId == id)
                .SumAsync(o => o.TotalAmount);

            var totalPointsEarned = await _context.Orders
                .Where(o => o.CampaignId == id)
                .SumAsync(o => o.TotalPointsEarned);

            var totalVouchers = await _context.Vouchers
                .Where(v => v.CampaignId == id)
                .CountAsync();

            var redeemedVouchers = await _context.Vouchers
                .Where(v => v.CampaignId == id && v.IsRedeemed)
                .CountAsync();

            var totalRedemptionValue = await _context.Vouchers
                .Where(v => v.CampaignId == id && v.IsRedeemed)
                .SumAsync(v => v.Value);

            return Ok(new
            {
                CampaignId = id,
                CampaignName = campaign?.Name ?? "",
                TotalResellers = totalResellers,
                ApprovedResellers = approvedResellers,
                TotalOrders = totalOrders,
                TotalOrderValue = totalOrderValue,
                TotalPointsEarned = totalPointsEarned,
                TotalVouchers = totalVouchers,
                RedeemedVouchers = redeemedVouchers,
                TotalRedemptionValue = totalRedemptionValue,
                RedemptionRate = totalVouchers > 0 ? (double)redeemedVouchers / totalVouchers * 100 : 0
            });
        }

        // GET: api/manufacturer/campaigns/available-resellers
        [HttpGet("available-resellers")]
        public async Task<ActionResult<IEnumerable<object>>> GetAvailableResellers()
        {
            var manufacturerId = GetCurrentUserId();
            if (manufacturerId == null)
                return Unauthorized();

            var resellers = await _context.Users
                .Where(u => u.Role == "reseller" && u.AssignedManufacturerId == manufacturerId)
                .Select(u => new
                {
                    u.Id,
                    u.Name,
                    u.BusinessName,
                    u.Email,
                    u.Phone,
                    u.Points,
                    u.CreatedAt
                })
                .ToListAsync();

            return Ok(resellers);
        }



        // PUT: api/manufacturer/campaigns/{id}/voucher-settings
        [HttpPut("{id}/voucher-settings")]
        public async Task<ActionResult<object>> UpdateVoucherSettings(int id, [FromBody] VoucherSettingsDto voucherSettingsDto)
        {
            var manufacturerId = GetCurrentUserId();
            if (manufacturerId == null)
                return Unauthorized();

            var campaign = await _context.Campaigns
                .FirstOrDefaultAsync(c => c.Id == id && c.ManufacturerId == manufacturerId);

            if (campaign == null)
                return NotFound("Campaign not found");

            // Update voucher generation settings
            campaign.VoucherGenerationThreshold = voucherSettingsDto.VoucherGenerationThreshold;
            campaign.VoucherValue = voucherSettingsDto.VoucherValue;
            campaign.VoucherValidityDays = voucherSettingsDto.VoucherValidityDays;
            campaign.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            return Ok(new { Message = "Voucher settings updated successfully", Campaign = campaign });
        }

        // POST: api/manufacturer/campaigns/{id}/add-voucher-products
        [HttpPost("{id}/add-voucher-products")]
        public async Task<ActionResult<object>> AddVoucherProducts(int id)
        {
            var manufacturerId = GetCurrentUserId();
            if (manufacturerId == null)
                return Unauthorized();

            var campaign = await _context.Campaigns
                .FirstOrDefaultAsync(c => c.Id == id && c.ManufacturerId == manufacturerId);

            if (campaign == null)
                return NotFound("Campaign not found");

            // Get manufacturer's products
            var manufacturerProducts = await _context.Products
                .Where(p => p.ManufacturerId == manufacturerId && p.IsActive)
                .Take(3) // Add first 3 products as voucher products
                .ToListAsync();

            if (!manufacturerProducts.Any())
                return BadRequest("No products found for this manufacturer");

            // Add voucher products
            var voucherProducts = manufacturerProducts.Select(p => new CampaignVoucherProduct
            {
                CampaignId = id,
                ProductId = p.Id,
                VoucherValue = p.RetailPrice * 0.1m, // 10% of retail price
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            }).ToList();

            await _context.CampaignVoucherProducts.AddRangeAsync(voucherProducts);
            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = $"Added {voucherProducts.Count} voucher products to campaign",
                voucherProducts = voucherProducts.Select(vp => new
                {
                    vp.ProductId,
                    vp.VoucherValue,
                    vp.IsActive
                }).ToList()
            });
        }

        // GET: api/manufacturer/campaigns/{id}/debug
        [HttpGet("{id}/debug")]
        public async Task<ActionResult<object>> DebugCampaign(int id)
        {
            var manufacturerId = GetCurrentUserId();
            if (manufacturerId == null)
                return Unauthorized();

            var campaign = await _context.Campaigns
                .Include(c => c.EligibleProducts).ThenInclude(ep => ep.CampaignProduct)
                .Include(c => c.VoucherProducts).ThenInclude(vp => vp.Product)
                .FirstOrDefaultAsync(c => c.Id == id && c.ManufacturerId == manufacturerId);

            if (campaign == null)
                return NotFound("Campaign not found");

            object eligibleProducts;
            if (campaign.EligibleProducts != null)
            {
                eligibleProducts = campaign.EligibleProducts.Select(ep => new
                {
                    ep.CampaignProductId,
                    ep.PointCost,
                    ep.IsActive,
                    ProductName = ep.CampaignProduct?.Name
                }).ToList();
            }
            else
            {
                eligibleProducts = new List<object>();
            }

            object voucherProducts;
            if (campaign.VoucherProducts != null)
            {
                voucherProducts = campaign.VoucherProducts.Select(vp => new
                {
                    vp.ProductId,
                    vp.VoucherValue,
                    vp.IsActive,
                    ProductName = vp.Product?.Name
                }).ToList();
            }
            else
            {
                voucherProducts = new List<object>();
            }

            return Ok(new
            {
                CampaignId = id,
                CampaignName = campaign.Name,
                EligibleProductsCount = campaign.EligibleProducts?.Count ?? 0,
                VoucherProductsCount = campaign.VoucherProducts?.Count ?? 0,
                EligibleProducts = eligibleProducts,
                VoucherProducts = voucherProducts
            });
        }

        // GET: api/manufacturer/campaigns/{id}/voucher-stats
        [HttpGet("{id}/voucher-stats")]
        public async Task<ActionResult<object>> GetVoucherStats(int id)
        {
            var manufacturerId = GetCurrentUserId();
            if (manufacturerId == null)
                return Unauthorized();

            var campaign = await _context.Campaigns
                .FirstOrDefaultAsync(c => c.Id == id && c.ManufacturerId == manufacturerId);

            if (campaign == null)
                return NotFound("Campaign not found");

            // Get voucher generation statistics
            var campaignResellers = await _context.CampaignResellers
                .Include(cr => cr.Reseller)
                .Where(cr => cr.CampaignId == id)
                .ToListAsync();

            var totalResellers = campaignResellers.Count;
            var approvedResellers = campaignResellers.Count(cr => cr.IsApproved);
            var totalVouchersGenerated = campaignResellers.Sum(cr => cr.TotalVouchersGenerated);
            var totalVoucherValue = campaignResellers.Sum(cr => cr.TotalVoucherValueGenerated);
            var totalPointsUsed = campaignResellers.Sum(cr => cr.PointsUsedForVouchers);

            return Ok(new
            {
                CampaignId = id,
                CampaignName = campaign.Name,
                VoucherGenerationThreshold = campaign.VoucherGenerationThreshold,
                VoucherValue = campaign.VoucherValue,
                VoucherValidityDays = campaign.VoucherValidityDays,
                TotalResellers = totalResellers,
                ApprovedResellers = approvedResellers,
                TotalVouchersGenerated = totalVouchersGenerated,
                TotalVoucherValueGenerated = totalVoucherValue,
                TotalPointsUsedForVouchers = totalPointsUsed,
                ResellerStats = campaignResellers.Select(cr => new
                {
                    ResellerId = cr.ResellerId,
                    ResellerName = cr.Reseller?.Name,
                    TotalPointsEarned = cr.TotalPointsEarned,
                    PointsUsedForVouchers = cr.PointsUsedForVouchers,
                    AvailablePoints = cr.TotalPointsEarned - cr.PointsUsedForVouchers,
                    TotalVouchersGenerated = cr.TotalVouchersGenerated,
                    TotalVoucherValueGenerated = cr.TotalVoucherValueGenerated,
                    LastVoucherGeneratedAt = cr.LastVoucherGeneratedAt
                })
            });
        }

        // POST: api/manufacturer/campaigns/{id}/generate-vouchers
        [HttpPost("{id}/generate-vouchers")]
        public async Task<ActionResult<object>> GenerateVouchers(int id)
        {
            var manufacturerId = GetCurrentUserId();
            if (manufacturerId == null)
                return Unauthorized();

            var campaign = await _context.Campaigns
                .FirstOrDefaultAsync(c => c.Id == id && c.ManufacturerId == manufacturerId);

            if (campaign == null)
                return NotFound("Campaign not found");

            if (!campaign.VoucherGenerationThreshold.HasValue || !campaign.VoucherValue.HasValue)
                return BadRequest("Voucher generation settings are not configured for this campaign");

            // Use the voucher generation service
            var voucherGenerationService = HttpContext.RequestServices.GetRequiredService<IVoucherGenerationService>();
            var result = await voucherGenerationService.GenerateVouchersForCampaignAsync(id);

            if (result)
            {
                return Ok(new { Message = "Vouchers generated successfully" });
            }
            else
            {
                return BadRequest("Failed to generate vouchers");
            }
        }

        private int? GetCurrentUserId()
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            return userIdClaim != null ? int.Parse(userIdClaim) : null;
        }
    }
}