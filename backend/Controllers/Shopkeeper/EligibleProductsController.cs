using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using backend.Data;
using backend.Models;
using System.Text.Json;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using backend.Models.DTOs;

namespace backend.Controllers.Shopkeeper
{
    [ApiController]
    [Route("api/shopkeeper/campaigns")]
    public class EligibleProductsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        public EligibleProductsController(ApplicationDbContext context)
        {
            _context = context;
        }

        // POST: api/shopkeeper/campaigns/{campaignId}/eligible-products
        [HttpPost("{campaignId}/eligible-products")]
        public async Task<IActionResult> SetEligibleProducts(int campaignId, [FromBody] List<CampaignEligibleProductDto> eligibleProducts)
        {
            var campaign = await _context.Campaigns
                .Include(c => c.EligibleProducts)
                .FirstOrDefaultAsync(c => c.Id == campaignId);
            if (campaign == null)
                return NotFound("Campaign not found");

            // Remove old eligible products
            _context.CampaignEligibleProducts.RemoveRange(campaign.EligibleProducts);

            // Add new eligible products
            foreach (var ep in eligibleProducts)
            {
                campaign.EligibleProducts.Add(new CampaignEligibleProduct
                {
                    CampaignProductId = ep.CampaignProductId,
                    PointCost = ep.PointCost,
                    RedemptionLimit = ep.RedemptionLimit,
                    IsActive = ep.IsActive
                });
            }

            await _context.SaveChangesAsync();
            return Ok(new { message = "Eligible products updated", eligibleProducts });
        }

        // GET: api/shopkeeper/campaigns/{campaignId}/eligible-products
        [HttpGet("{campaignId}/eligible-products")]
        public async Task<IActionResult> GetEligibleProducts(int campaignId)
        {
            // Use CampaignVoucherProduct for eligible products
            var voucherProducts = await _context.CampaignVoucherProducts
                .Include(vp => vp.Product)
                .Where(vp => vp.CampaignId == campaignId && vp.IsActive)
                .ToListAsync();

            var result = voucherProducts.Select(vp => new
            {
                id = vp.ProductId,
                name = vp.Product?.Name ?? "",
                description = vp.Product?.Description ?? "",
                brand = vp.Product?.Brand ?? "",
                retailPrice = vp.Product?.RetailPrice ?? 0,
                campaignVoucherProductId = vp.Id,
                voucherValue = vp.VoucherValue,
                isActive = vp.IsActive
            });

            return Ok(result);
        }

        // GET: api/shopkeeper/campaigns/products
        [HttpGet("products")]
        public async Task<ActionResult<IEnumerable<Product>>> GetAllProducts()
        {
            var products = await _context.Products.ToListAsync();
            return Ok(products);
        }
        
        // Add this method inside the EligibleProductsController class

// GET: api/shopkeeper/campaigns/{campaignId}/campaignvoucherproducts
[HttpGet("{campaignId}/campaignvoucherproducts")]
public async Task<IActionResult> GetCampaignVoucherProducts(int campaignId)
{
    var voucherProducts = await _context.CampaignVoucherProducts
        .Include(vp => vp.Product)
        .Where(vp => vp.CampaignId == campaignId && vp.IsActive)
        .ToListAsync();

    var result = voucherProducts.Select(vp => new {
        id = vp.ProductId,
        name = vp.Product?.Name ?? "",
        description = vp.Product?.Description ?? "",
        brand = vp.Product?.Brand ?? "",
        retailPrice = vp.Product?.RetailPrice ?? 0,
        campaignVoucherProductId = vp.Id,
        voucherValue = vp.VoucherValue,
        isActive = vp.IsActive
    });

    return Ok(result);
}
    }
}