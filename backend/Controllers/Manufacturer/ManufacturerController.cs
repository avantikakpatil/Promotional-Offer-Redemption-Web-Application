using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using backend.Data;
using backend.Models;
using System.Security.Claims;

namespace backend.Controllers.Manufacturer
{
    [ApiController]
    [Route("api/manufacturer")]
    public class ManufacturerController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public ManufacturerController(ApplicationDbContext context)
        {
            _context = context;
        }

        // GET: api/manufacturer/resellers
        [HttpGet("resellers")]
        public async Task<ActionResult<IEnumerable<object>>> GetResellers()
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

        // GET: api/manufacturer/analytics
        [HttpGet("analytics")]
        public async Task<ActionResult<object>> GetAnalytics([FromQuery] int? campaignId, [FromQuery] string? startDate, [FromQuery] string? endDate, [FromQuery] int? resellerId)
        {
            var manufacturerId = GetCurrentUserId();
            if (manufacturerId == null)
                return Unauthorized();

            // Get campaigns for this manufacturer
            var campaignsQuery = _context.Campaigns.Where(c => c.ManufacturerId == manufacturerId);
            if (campaignId.HasValue)
                campaignsQuery = campaignsQuery.Where(c => c.Id == campaignId.Value);

            var campaigns = await campaignsQuery.ToListAsync();


            // Get QR code scans (now using Vouchers table with QrCode property)
            var qrScansQuery = _context.Vouchers
                .Where(v => !string.IsNullOrEmpty(v.QrCode) && campaigns.Select(c => c.Id).Contains(v.CampaignId));
            if (resellerId.HasValue)
                qrScansQuery = qrScansQuery.Where(v => v.ResellerId == resellerId.Value);
            var qrScans = await qrScansQuery.ToListAsync();

            // Get redemptions
            var redemptionsQuery = _context.RedemptionHistories
                .Where(rh => campaigns.Select(c => c.Id).Contains(rh.CampaignId ?? 0));
            
            if (resellerId.HasValue)
                redemptionsQuery = redemptionsQuery.Where(rh => rh.ResellerId == resellerId.Value);

            var redemptions = await redemptionsQuery.ToListAsync();

            // Generate sample chart data (you can customize this based on your needs)
            var scanData = new
            {
                labels = new[] { "Jan", "Feb", "Mar", "Apr", "May", "Jun" },
                data = new[] { qrScans.Count, qrScans.Count * 2, qrScans.Count * 1.5, qrScans.Count * 3, qrScans.Count * 2.5, qrScans.Count * 4 }
            };

            var redemptionData = new
            {
                labels = new[] { "Jan", "Feb", "Mar", "Apr", "May", "Jun" },
                data = new[] { redemptions.Count, redemptions.Count * 1.5, redemptions.Count * 1.2, redemptions.Count * 2, redemptions.Count * 1.8, redemptions.Count * 2.5 }
            };

            return Ok(new
            {
                totalCampaigns = campaigns.Count,
                totalQrScans = qrScans.Count,
                totalRedemptions = redemptions.Count,
                scanData,
                redemptionData,
                campaigns = campaigns.Select(c => new { c.Id, c.Name, c.IsActive }),
                resellers = await _context.Users
                    .Where(u => u.Role == "reseller" && u.AssignedManufacturerId == manufacturerId)
                    .Select(u => new { u.Id, u.Name, u.BusinessName })
                    .ToListAsync()
            });
        }

        private int? GetCurrentUserId()
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            return userIdClaim != null ? int.Parse(userIdClaim) : null;
        }
    }
} 