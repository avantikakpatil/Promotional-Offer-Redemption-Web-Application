using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using backend.Data;
using PromotionalOfferRedemption.Models;
using System.Security.Claims;

namespace PromotionalOfferRedemption.Controllers.Customer
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class PointsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public PointsController(ApplicationDbContext context)
        {
            _context = context;
        }

        [HttpGet("balance")]
        public async Task<IActionResult> GetPointsBalance()
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out int userId))
            {
                return Unauthorized();
            }

            var points = await _context.Points
                .FirstOrDefaultAsync(p => p.UserId == userId);

            return Ok(new { Balance = points?.Balance ?? 0 });
        }

        [HttpGet("history")]
        public async Task<IActionResult> GetPointsHistory()
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out int userId))
            {
                return Unauthorized();
            }

            var history = await _context.PointsHistory
                .Where(p => p.UserId == userId)
                .OrderByDescending(p => p.Date)
                .ToListAsync();

            return Ok(history);
        }

        [HttpPost("add")]
        [Authorize(Roles = "Manufacturer,Reseller")]
        public async Task<IActionResult> AddPoints([FromBody] AddPointsRequest request)
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out int userId))
            {
                return Unauthorized();
            }

            var points = await _context.Points.FirstOrDefaultAsync(p => p.UserId == request.UserId);

            if (points == null)
            {
                points = new Points
                {
                    UserId = request.UserId,
                    Balance = 0
                };
                _context.Points.Add(points);
            }

            points.Balance += request.Points;

            var transaction = new PointsHistory
            {
                UserId = request.UserId,
                Points = request.Points,
                Type = "earned",
                Description = request.Description,
                Date = DateTime.UtcNow
            };

            _context.PointsHistory.Add(transaction);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Points added successfully" });
        }
    }

    public class AddPointsRequest
    {
        public int UserId { get; set; }
        public int Points { get; set; }
        public string Description { get; set; } = string.Empty;
    }
} 