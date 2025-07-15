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
        public async Task<IActionResult> SetEligibleProducts(int campaignId, [FromBody] List<EligibleProductDto> eligibleProducts)
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
                    ProductId = ep.ProductId,
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
            var eligibleProducts = await _context.CampaignEligibleProducts
                .Include(ep => ep.Product)
                .Where(ep => ep.CampaignId == campaignId && ep.IsActive)
                .ToListAsync();

            var result = eligibleProducts.Select(ep => new
            {
                ep.ProductId,
                ProductName = ep.Product != null ? ep.Product.Name : string.Empty,
                ep.PointCost,
                ep.RedemptionLimit,
                ep.IsActive
            });

            return Ok(result);
        }

        // GET: api/shopkeeper/products
        [HttpGet("/api/shopkeeper/products")]
        public async Task<ActionResult<IEnumerable<Product>>> GetAllProducts()
        {
            var products = await _context.Products.ToListAsync();
            return Ok(products);
        }
    }
} 