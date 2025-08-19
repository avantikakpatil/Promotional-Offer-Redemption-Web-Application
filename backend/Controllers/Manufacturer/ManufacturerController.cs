using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using backend.Data;
using backend.Models;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;

namespace backend.Controllers.Manufacturer
{
    [ApiController]
    [Route("api/manufacturer")]
    public class ManufacturerController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly backend.Services.IEmailService _emailService;

        public ManufacturerController(ApplicationDbContext context, backend.Services.IEmailService emailService)
        {
            _context = context;
            _emailService = emailService;
        }

        // POST: api/manufacturer/resellers
        [HttpPost("resellers")]
        public async Task<ActionResult<object>> CreateReseller([FromBody] CreateResellerRequest request)
        {
            var manufacturerId = GetCurrentUserId();
            if (manufacturerId == null)
                return Unauthorized();

            if (string.IsNullOrWhiteSpace(request.Name) || string.IsNullOrWhiteSpace(request.Email) ||
                string.IsNullOrWhiteSpace(request.Phone) || string.IsNullOrWhiteSpace(request.Password))
            {
                return BadRequest("Name, Email, Phone and Password are required");
            }

            // Ensure email is unique
            var existing = await _context.Users.FirstOrDefaultAsync(u => u.Email == request.Email);
            if (existing != null)
            {
                return BadRequest("Email already exists");
            }

            var user = new User
            {
                Name = request.Name,
                Email = request.Email,
                Phone = request.Phone,
                Role = "reseller",
                PasswordHash = HashPassword(request.Password!),
                AssignedManufacturerId = manufacturerId,
                CreatedAt = DateTime.UtcNow
            };

            _context.Users.Add(user);
            await _context.SaveChangesAsync();

            // Send credentials via email (best practice: send a temporary password)
            try
            {
                var subject = "Your Reseller Account Credentials";
                var body = $"<p>Hello {System.Net.WebUtility.HtmlEncode(user.Name)},</p>" +
                           "<p>Your reseller account has been created. You can log in with the following credentials:</p>" +
                           $"<p><b>Email:</b> {System.Net.WebUtility.HtmlEncode(user.Email)}<br/><b>Password:</b> {System.Net.WebUtility.HtmlEncode(request.Password!)}</p>" +
                           "<p>For security, please log in and change your password immediately.</p>" +
                           "<p>Regards,<br/>Manufacturer Team</p>";
                await _emailService.SendEmailAsync(user.Email, subject, body);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[EMAIL] Failed to send credentials to {user.Email}: {ex.Message}");
            }

            return Ok(new
            {
                Message = "Reseller created successfully",
                Reseller = new
                {
                    user.Id,
                    user.Name,
                    user.Email,
                    user.Phone,
                    user.Role,
                    user.AssignedManufacturerId,
                    user.CreatedAt
                }
            });
        }

        // PUT: api/manufacturer/resellers/{id}/password
        [HttpPut("resellers/{id}/password")]
        public async Task<ActionResult<object>> ResetResellerPassword(int id, [FromBody] ResetPasswordRequest request)
        {
            var manufacturerId = GetCurrentUserId();
            if (manufacturerId == null)
                return Unauthorized();

            if (string.IsNullOrWhiteSpace(request.NewPassword))
            {
                return BadRequest("New password is required");
            }

            var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == id && u.Role == "reseller");
            if (user == null)
            {
                return NotFound("Reseller not found");
            }

            if (user.AssignedManufacturerId != manufacturerId)
            {
                return Forbid();
            }

            user.PasswordHash = HashPassword(request.NewPassword);
            user.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            return Ok(new { Message = "Password updated successfully" });
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

        private static string HashPassword(string password)
        {
            using (var sha256 = SHA256.Create())
            {
                var hashedBytes = sha256.ComputeHash(Encoding.UTF8.GetBytes(password));
                return Convert.ToBase64String(hashedBytes);
            }
        }

    }

    public class CreateResellerRequest
    {
        public string Name { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Phone { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
    }

    public class ResetPasswordRequest
    {
        public string NewPassword { get; set; } = string.Empty;
    }
} 