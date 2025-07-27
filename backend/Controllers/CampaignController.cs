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
                        manufacturer = new
                        {
                            id = c.Manufacturer.Id,
                            name = c.Manufacturer.Name,
                            businessName = c.Manufacturer.BusinessName
                        }
                    })
                    .ToListAsync();

                return Ok(new { 
                    success = true, 
                    data = campaigns,
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

                return Ok(new { 
                    success = true, 
                    data = campaign,
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