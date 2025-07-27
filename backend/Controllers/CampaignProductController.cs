using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using backend.Data;
using backend.Models;
using Microsoft.AspNetCore.Authorization;

namespace backend.Controllers
{
    [ApiController]
    [Route("api/campaign-products")]
    public class CampaignProductController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public CampaignProductController(ApplicationDbContext context)
        {
            _context = context;
        }

        // GET: api/campaign-products
        [HttpGet]
        [AllowAnonymous]
        public async Task<IActionResult> GetCampaignProducts()
        {
            try
            {
                var products = await _context.CampaignProducts.ToListAsync();
                return Ok(products);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { 
                    success = false,
                    message = "An error occurred while fetching campaign products", 
                    error = ex.Message 
                });
            }
        }

        // GET: api/campaign-products/debug
        [HttpGet("debug")]
        [AllowAnonymous]
        public async Task<IActionResult> DebugCampaignProducts()
        {
            try
            {
                var count = await _context.CampaignProducts.CountAsync();
                var products = await _context.CampaignProducts.Take(5).ToListAsync();
                
                return Ok(new { 
                    count = count,
                    products = products,
                    message = $"Found {count} campaign products"
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { 
                    success = false,
                    message = "Error checking campaign products", 
                    error = ex.Message 
                });
            }
        }

        // POST: api/campaign-products/populate
        [HttpPost("populate")]
        [AllowAnonymous]
        public async Task<IActionResult> PopulateCampaignProducts()
        {
            try
            {
                // Check if campaign products already exist
                var existingCount = await _context.CampaignProducts.CountAsync();
                if (existingCount > 0)
                {
                    return Ok(new { message = $"Campaign products already exist ({existingCount} records)" });
                }

                // Convert DummyData.Products to CampaignProduct entities
                var campaignProducts = DummyData.Products.Select(p => new CampaignProduct
                {
                    Name = p.Name,
                    Category = p.Category,
                    SKU = p.SKU,
                    Brand = p.Brand,
                    BasePrice = p.BasePrice,
                    PointsPerUnit = p.PointsPerUnit,
                    ManufacturerId = p.ManufacturerId ?? 1, // Default to 1 if null
                    CreatedAt = DateTime.UtcNow
                }).ToList();

                // Add to database
                await _context.CampaignProducts.AddRangeAsync(campaignProducts);
                await _context.SaveChangesAsync();

                return Ok(new { 
                    success = true,
                    message = $"Successfully populated {campaignProducts.Count} campaign products",
                    count = campaignProducts.Count
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { 
                    success = false,
                    message = "Error populating campaign products",
                    error = ex.Message 
                });
            }
        }
    }
} 