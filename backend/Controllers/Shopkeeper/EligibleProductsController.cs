using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using backend.Data;
using backend.Models;
using System.Text.Json;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

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
        public async Task<IActionResult> SetEligibleProducts(int campaignId, [FromBody] List<int> productIds)
        {
            var campaign = await _context.Campaigns.FindAsync(campaignId);
            if (campaign == null)
                return NotFound("Campaign not found");

            campaign.EligibleProducts = JsonSerializer.Serialize(productIds);
            await _context.SaveChangesAsync();
            return Ok(new { message = "Eligible products updated", eligibleProducts = productIds });
        }

        // GET: api/shopkeeper/campaigns/{campaignId}/eligible-products
        [HttpGet("{campaignId}/eligible-products")]
        public async Task<IActionResult> GetEligibleProducts(int campaignId)
        {
            var campaign = await _context.Campaigns.FindAsync(campaignId);
            if (campaign == null)
                return NotFound("Campaign not found");

            List<int> productIds = new List<int>();
            if (!string.IsNullOrEmpty(campaign.EligibleProducts))
            {
                try
                {
                    productIds = JsonSerializer.Deserialize<List<int>>(campaign.EligibleProducts);
                }
                catch { }
            }

            var products = await _context.Products
                .Where(p => productIds.Contains(p.Id) && p.IsActive)
                .ToListAsync();

            return Ok(products);
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