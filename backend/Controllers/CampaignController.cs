using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using backend.Data;
using backend.Models;
using Microsoft.AspNetCore.Authorization;

namespace backend.Controllers
{
    [ApiController]
    [Route("api/campaigns")]
    public class CampaignController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public CampaignController(ApplicationDbContext context)
        {
            _context = context;
        }

        // GET: api/campaigns
        [HttpGet]
        public async Task<ActionResult<IEnumerable<object>>> GetCampaigns()
        {
            try
            {
                // Get all active campaigns created by manufacturers (like Haldiram) for dealers/resellers
                var campaigns = await _context.Campaigns
                    .Include(c => c.Manufacturer)
                    .Include(c => c.EligibleProducts)
                    .Include(c => c.VoucherProducts)
                    .Where(c => c.IsActive && c.StartDate <= DateTime.UtcNow && c.EndDate >= DateTime.UtcNow)
                    .OrderByDescending(c => c.CreatedAt)
                    .Select(c => new
                    {
                        id = c.Id,
                        name = c.Name,
                        productType = c.ProductType,
                        startDate = c.StartDate,
                        endDate = c.EndDate,
                        description = c.Description,
                        isActive = c.IsActive,
                        createdAt = c.CreatedAt,
                        // Voucher settings
                        voucherGenerationThreshold = c.VoucherGenerationThreshold,
                        voucherValue = c.VoucherValue,
                        voucherValidityDays = c.VoucherValidityDays,
                        // Campaign products
                        eligibleProducts = c.EligibleProducts.Select(ep => new
                        {
                            id = ep.Id,
                            campaignProductId = ep.CampaignProductId,
                            pointCost = ep.PointCost,
                            redemptionLimit = ep.RedemptionLimit,
                            isActive = ep.IsActive,
                            minPurchaseQuantity = ep.MinPurchaseQuantity,
                            freeProductId = ep.FreeProductId,
                            freeProductQty = ep.FreeProductQty
                        }).ToList(),
                        voucherProducts = c.VoucherProducts.Select(vp => new
                        {
                            id = vp.Id,
                            productId = vp.ProductId,
                            voucherValue = vp.VoucherValue,
                            isActive = vp.IsActive
                        }).ToList(),
                        manufacturer = new
                        {
                            id = c.Manufacturer.Id,
                            name = c.Manufacturer.Name,
                            businessName = c.Manufacturer.BusinessName
                        }
                    })
                    .ToListAsync();

                // Get reward tiers for each campaign
                var campaignIds = campaigns.Select(c => c.id).ToList();
                var rewardTiers = await _context.RewardTiers
                    .Where(rt => campaignIds.Contains(rt.CampaignId))
                    .Select(rt => new
                    {
                        campaignId = rt.CampaignId,
                        id = rt.Id,
                        threshold = rt.Threshold,
                        reward = rt.Reward
                    })
                    .ToListAsync();

                // Attach reward tiers to campaigns
                var campaignsWithRewardTiers = campaigns.Select(c => new
                {
                    c.id,
                    c.name,
                    c.productType,
                    c.startDate,
                    c.endDate,
                    c.description,
                    c.isActive,
                    c.createdAt,
                    c.voucherGenerationThreshold,
                    c.voucherValue,
                    c.voucherValidityDays,
                    c.eligibleProducts,
                    c.voucherProducts,
                    c.manufacturer,
                    rewardTiers = rewardTiers.Where(rt => rt.campaignId == c.id).ToList()
                }).ToList();

                return Ok(new { 
                    success = true, 
                    data = campaignsWithRewardTiers,
                    message = "Campaigns fetched successfully"
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { 
                    success = false,
                    message = "An error occurred while fetching campaigns", 
                    error = ex.Message 
                });
            }
        }



        // GET: api/campaigns/{id}
        [HttpGet("{id}")]
        public async Task<ActionResult<object>> GetCampaign(int id)
        {
            try
            {
                var campaign = await _context.Campaigns
                    .Include(c => c.Manufacturer)
                    .Include(c => c.EligibleProducts)
                    .Include(c => c.VoucherProducts)
                    .Where(c => c.Id == id && c.IsActive)
                    .Select(c => new
                    {
                        id = c.Id,
                        name = c.Name,
                        productType = c.ProductType,
                        startDate = c.StartDate,
                        endDate = c.EndDate,
                        description = c.Description,
                        isActive = c.IsActive,
                        createdAt = c.CreatedAt,
                        // Voucher settings
                        voucherGenerationThreshold = c.VoucherGenerationThreshold,
                        voucherValue = c.VoucherValue,
                        voucherValidityDays = c.VoucherValidityDays,
                        // Campaign products
                        eligibleProducts = c.EligibleProducts.Select(ep => new
                        {
                            id = ep.Id,
                            campaignProductId = ep.CampaignProductId,
                            pointCost = ep.PointCost,
                            redemptionLimit = ep.RedemptionLimit,
                            isActive = ep.IsActive
                        }).ToList(),
                        voucherProducts = c.VoucherProducts.Select(vp => new
                        {
                            id = vp.Id,
                            productId = vp.ProductId,
                            voucherValue = vp.VoucherValue,
                            isActive = vp.IsActive
                        }).ToList(),
                        manufacturer = new
                        {
                            id = c.Manufacturer.Id,
                            name = c.Manufacturer.Name,
                            businessName = c.Manufacturer.BusinessName
                        }
                    })
                    .FirstOrDefaultAsync();

                if (campaign == null)
                {
                    return NotFound(new { 
                        success = false,
                        message = "Campaign not found" 
                    });
                }

                // Get reward tiers for this campaign
                var rewardTiers = await _context.RewardTiers
                    .Where(rt => rt.CampaignId == id)
                    .Select(rt => new
                    {
                        id = rt.Id,
                        threshold = rt.Threshold,
                        reward = rt.Reward
                    })
                    .ToListAsync();

                // Attach reward tiers to campaign
                var campaignWithRewardTiers = new
                {
                    campaign.id,
                    campaign.name,
                    campaign.productType,
                    campaign.startDate,
                    campaign.endDate,
                    campaign.description,
                    campaign.isActive,
                    campaign.createdAt,
                    campaign.voucherGenerationThreshold,
                    campaign.voucherValue,
                    campaign.voucherValidityDays,
                    campaign.eligibleProducts,
                    campaign.voucherProducts,
                    campaign.manufacturer,
                    rewardTiers = rewardTiers
                };

                return Ok(new { 
                    success = true, 
                    data = campaignWithRewardTiers,
                    message = "Campaign fetched successfully"
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { 
                    success = false,
                    message = "An error occurred while fetching campaign", 
                    error = ex.Message 
                });
            }
        }
    }
} 