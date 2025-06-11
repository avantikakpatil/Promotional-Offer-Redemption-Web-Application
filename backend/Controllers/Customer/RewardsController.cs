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
    public class RewardsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public RewardsController(ApplicationDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<IActionResult> GetRewards()
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out int userId))
            {
                return Unauthorized();
            }

            var rewards = await _context.Rewards
                .Where(r => r.Available)
                .OrderBy(r => r.Points)
                .ToListAsync();

            return Ok(rewards);
        }

        [HttpPost("redeem/{rewardId}")]
        public async Task<IActionResult> RedeemReward(int rewardId)
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out int userId))
            {
                return Unauthorized();
            }

            var reward = await _context.Rewards.FindAsync(rewardId);
            if (reward == null || !reward.Available)
            {
                return NotFound("Reward not found or inactive");
            }

            var points = await _context.Points
                .FirstOrDefaultAsync(p => p.UserId == userId);

            if (points == null || points.Balance < reward.Points)
            {
                return BadRequest("Insufficient points");
            }

            // Create redemption record
            var redemption = new RewardRedemption
            {
                UserId = userId,
                RewardId = rewardId,
                RedeemedAt = DateTime.UtcNow,
                Status = "Pending"
            };

            _context.RewardRedemptions.Add(redemption);
            await _context.SaveChangesAsync();

            return Ok(new { Message = "Reward redemption request submitted successfully" });
        }

        [HttpGet("redemptions")]
        public async Task<IActionResult> GetRedemptions()
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out int userId))
            {
                return Unauthorized();
            }

            var redemptions = await _context.RewardRedemptions
                .Where(r => r.UserId == userId)
                .Include(r => r.Reward)
                .OrderByDescending(r => r.RedeemedAt)
                .ToListAsync();

            return Ok(redemptions);
        }
    }
} 