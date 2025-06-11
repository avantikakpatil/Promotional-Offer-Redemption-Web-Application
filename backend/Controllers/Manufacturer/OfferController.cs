// Controllers/OfferController.cs
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using backend.Data;
using backend.Models;
using System.Security.Claims;

namespace backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class OfferController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        
        public OfferController(ApplicationDbContext context)
        {
            _context = context;
        }
        
        [HttpGet]
        public async Task<IActionResult> GetOffers()
        {
            var offers = await _context.Offers
                .Where(o => o.IsActive && o.ValidTo > DateTime.Now)
                .Include(o => o.Manufacturer)
                .Select(o => new
                {
                    o.Id,
                    o.Title,
                    o.Description,
                    o.DiscountPercentage,
                    o.ValidFrom,
                    o.ValidTo,
                    Manufacturer = o.Manufacturer.Name,
                    o.CreatedAt
                })
                .ToListAsync();
                
            return Ok(offers);
        }
        
        [HttpGet("{id}")]
        public async Task<IActionResult> GetOffer(int id)
        {
            var offer = await _context.Offers
                .Include(o => o.Manufacturer)
                .FirstOrDefaultAsync(o => o.Id == id && o.IsActive);
                
            if (offer == null)
            {
                return NotFound();
            }
            
            return Ok(new
            {
                offer.Id,
                offer.Title,
                offer.Description,
                offer.DiscountPercentage,
                offer.ValidFrom,
                offer.ValidTo,
                Manufacturer = offer.Manufacturer.Name,
                offer.CreatedAt
            });
        }
        
        [HttpPost]
        [Authorize(Roles = "Manufacturer")]
        public async Task<IActionResult> CreateOffer([FromBody] CreateOfferDto createOfferDto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }
            
            var userIdClaim = User.FindFirst("id")?.Value;
            if (userIdClaim == null || !int.TryParse(userIdClaim, out int userId))
            {
                return Unauthorized();
            }
            
            var offer = new Offer
            {
                Title = createOfferDto.Title,
                Description = createOfferDto.Description,
                DiscountPercentage = createOfferDto.DiscountPercentage,
                ValidFrom = createOfferDto.ValidFrom,
                ValidTo = createOfferDto.ValidTo,
                ManufacturerId = userId
            };
            
            _context.Offers.Add(offer);
            await _context.SaveChangesAsync();
            
            return CreatedAtAction(nameof(GetOffer), new { id = offer.Id }, offer);
        }
        
        [HttpPut("{id}")]
        [Authorize(Roles = "Manufacturer")]
        public async Task<IActionResult> UpdateOffer(int id, [FromBody] CreateOfferDto updateOfferDto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }
            
            var userIdClaim = User.FindFirst("id")?.Value;
            if (userIdClaim == null || !int.TryParse(userIdClaim, out int userId))
            {
                return Unauthorized();
            }
            
            var offer = await _context.Offers
                .FirstOrDefaultAsync(o => o.Id == id && o.ManufacturerId == userId);
                
            if (offer == null)
            {
                return NotFound();
            }
            
            offer.Title = updateOfferDto.Title;
            offer.Description = updateOfferDto.Description;
            offer.DiscountPercentage = updateOfferDto.DiscountPercentage;
            offer.ValidFrom = updateOfferDto.ValidFrom;
            offer.ValidTo = updateOfferDto.ValidTo;
            offer.UpdatedAt = DateTime.Now;
            
            await _context.SaveChangesAsync();
            
            return Ok(offer);
        }
        
        [HttpDelete("{id}")]
        [Authorize(Roles = "Manufacturer")]
        public async Task<IActionResult> DeleteOffer(int id)
        {
            var userIdClaim = User.FindFirst("id")?.Value;
            if (userIdClaim == null || !int.TryParse(userIdClaim, out int userId))
            {
                return Unauthorized();
            }
            
            var offer = await _context.Offers
                .FirstOrDefaultAsync(o => o.Id == id && o.ManufacturerId == userId);
                
            if (offer == null)
            {
                return NotFound();
            }
            
            offer.IsActive = false;
            offer.UpdatedAt = DateTime.Now;
            
            await _context.SaveChangesAsync();
            
            return NoContent();
        }
        
        [HttpPost("{id}/redeem")]
        [Authorize(Roles = "Customer")]
        public async Task<IActionResult> RedeemOffer(int id)
        {
            var userIdClaim = User.FindFirst("id")?.Value;
            if (userIdClaim == null || !int.TryParse(userIdClaim, out int userId))
            {
                return Unauthorized();
            }
            
            var offer = await _context.Offers
                .FirstOrDefaultAsync(o => o.Id == id && o.IsActive && o.ValidTo > DateTime.Now);
                
            if (offer == null)
            {
                return NotFound(new { message = "Offer not found or expired" });
            }
            
            // Check if user has already redeemed this offer
            var existingRedemption = await _context.OfferRedemptions
                .FirstOrDefaultAsync(or => or.OfferId == id && or.UserId == userId);
                
            if (existingRedemption != null)
            {
                return BadRequest(new { message = "You have already redeemed this offer" });
            }
            
            var redemptionCode = Guid.NewGuid().ToString("N")[..10].ToUpper();
            
            var redemption = new OfferRedemption
            {
                OfferId = id,
                UserId = userId,
                RedemptionCode = redemptionCode,
                Status = RedemptionStatus.Pending
            };
            
            _context.OfferRedemptions.Add(redemption);
            await _context.SaveChangesAsync();
            
            return Ok(new { 
                message = "Offer redeemed successfully", 
                redemptionCode = redemptionCode,
                status = redemption.Status.ToString()
            });
        }
        
        [HttpGet("my-offers")]
        [Authorize(Roles = "Manufacturer")]
        public async Task<IActionResult> GetMyOffers()
        {
            var userIdClaim = User.FindFirst("id")?.Value;
            if (userIdClaim == null || !int.TryParse(userIdClaim, out int userId))
            {
                return Unauthorized();
            }
            
            var offers = await _context.Offers
                .Where(o => o.ManufacturerId == userId && o.IsActive)
                .Select(o => new
                {
                    o.Id,
                    o.Title,
                    o.Description,
                    o.DiscountPercentage,
                    o.ValidFrom,
                    o.ValidTo,
                    o.CreatedAt,
                    RedemptionsCount = o.OfferRedemptions.Count()
                })
                .ToListAsync();
                
            return Ok(offers);
        }
        
        [HttpGet("my-redemptions")]
        [Authorize(Roles = "Customer")]
        public async Task<IActionResult> GetMyRedemptions()
        {
            var userIdClaim = User.FindFirst("id")?.Value;
            if (userIdClaim == null || !int.TryParse(userIdClaim, out int userId))
            {
                return Unauthorized();
            }
            
            var redemptions = await _context.OfferRedemptions
                .Where(or => or.UserId == userId)
                .Include(or => or.Offer)
                .Select(or => new
                {
                    or.Id,
                    or.RedemptionCode,
                    or.RedeemedAt,
                    or.Status,
                    Offer = new
                    {
                        or.Offer.Title,
                        or.Offer.Description,
                        or.Offer.DiscountPercentage
                    }
                })
                .ToListAsync();
                
            return Ok(redemptions);
        }
    }
    
    // DTO for creating offers
    public class CreateOfferDto
    {
        public string Title { get; set; } = string.Empty;
        public string? Description { get; set; }
        public decimal DiscountPercentage { get; set; }
        public DateTime ValidFrom { get; set; }
        public DateTime ValidTo { get; set; }
    }
}