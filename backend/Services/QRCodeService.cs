using backend.Models;
using backend.Models.DTOs;
using backend.Data;
using Microsoft.EntityFrameworkCore;

namespace backend.Services
{
    public class QRCodeService : IQRCodeService
    {
        private readonly ApplicationDbContext _context;
        public QRCodeService(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<QRCodeDto> CreateQRCodeAsync(QRCodeCreateDto dto)
        {
            var qr = new QRCode
            {
                Code = dto.Code,
                CampaignId = dto.CampaignId
            };
            _context.QRCodes.Add(qr);
            await _context.SaveChangesAsync();
            // Fetch campaign info and reward tiers
            var campaign = await _context.Campaigns
                .Include(c => c.RewardTiers)
                .FirstOrDefaultAsync(c => c.Id == qr.CampaignId);
            return ToDto(qr, campaign);
        }

        public async Task<IEnumerable<QRCodeDto>> GetQRCodesByCampaignAsync(int campaignId)
        {
            var qrs = await _context.QRCodes.Where(q => q.CampaignId == campaignId).ToListAsync();
            var campaign = await _context.Campaigns
                .Include(c => c.RewardTiers)
                .FirstOrDefaultAsync(c => c.Id == campaignId);
            return qrs.Select(qr => ToDto(qr, campaign));
        }

        public async Task<QRCodeDto?> GetQRCodeByIdAsync(int id)
        {
            var qr = await _context.QRCodes.FindAsync(id);
            return qr == null ? null : ToDto(qr);
        }

        public async Task<QRCodeDto?> GetQRCodeByCodeAsync(string code)
        {
            var qr = await _context.QRCodes.FirstOrDefaultAsync(q => q.Code == code);
            if (qr == null) return null;
            
            var campaign = await _context.Campaigns
                .Include(c => c.RewardTiers)
                .FirstOrDefaultAsync(c => c.Id == qr.CampaignId);
            return ToDto(qr, campaign);
        }

        public async Task<bool> DeleteQRCodeAsync(int id)
        {
            var qr = await _context.QRCodes.FindAsync(id);
            if (qr == null) return false;
            _context.QRCodes.Remove(qr);
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<ApiResponse<string>> RedeemQRCodeAsync(int qrCodeId, int customerId, int points)
        {
            var qr = await _context.QRCodes.FindAsync(qrCodeId);
            if (qr == null || qr.IsRedeemed)
                return new ApiResponse<string> { Success = false, Message = "QR code not found or already redeemed." };

            var customer = await _context.Users.FindAsync(customerId);
            if (customer == null)
                return new ApiResponse<string> { Success = false, Message = "Customer not found." };

            qr.IsRedeemed = true;
            qr.RedeemedAt = DateTime.UtcNow;
            qr.UpdatedAt = DateTime.UtcNow;
            qr.RedeemedByUserId = customerId;

            // Add points from QR code info
            customer.Points += points;

            await _context.SaveChangesAsync();

            return new ApiResponse<string> { Success = true, Message = "QR code redeemed and points added." };
        }

        public async Task<ApiResponse<string>> RedeemQRCodeByCodeAsync(string code, int customerId, int points)
        {
            var qr = await _context.QRCodes.FirstOrDefaultAsync(q => q.Code == code);
            if (qr == null)
            {
                Console.WriteLine($"QR not found: {code}");
                return new ApiResponse<string> { Success = false, Message = "Invalid QR code.", ErrorCode = "INVALID_QR_CODE" };
            }

            if (qr.IsRedeemed)
            {
                Console.WriteLine($"QR already redeemed: {code}");
                return new ApiResponse<string> { Success = false, Message = "QR code already redeemed.", ErrorCode = "ALREADY_REDEEMED" };
            }

            var customer = await _context.Users.FindAsync(customerId);
            if (customer == null)
            {
                Console.WriteLine($"Customer not found: {customerId}");
                return new ApiResponse<string> { Success = false, Message = "Customer not found.", ErrorCode = "CUSTOMER_NOT_FOUND" };
            }

            var campaign = await _context.Campaigns.FindAsync(qr.CampaignId);
            if (campaign == null)
            {
                Console.WriteLine($"Campaign not found: {qr.CampaignId}");
                return new ApiResponse<string> { Success = false, Message = "Invalid campaign.", ErrorCode = "INVALID_CAMPAIGN" };
            }

            var now = DateTime.UtcNow;
            if (campaign.StartDate > now || campaign.EndDate < now)
            {
                Console.WriteLine($"Campaign not active: now={now}, start={campaign.StartDate}, end={campaign.EndDate}");
                return new ApiResponse<string> { Success = false, Message = "Campaign not active.", ErrorCode = "CAMPAIGN_INACTIVE" };
            }

            int pointsToAdd = campaign.Points;
            if (pointsToAdd <= 0)
            {
                Console.WriteLine($"Invalid points for campaign {campaign.Id}: {pointsToAdd}");
                return new ApiResponse<string> { Success = false, Message = "Invalid points.", ErrorCode = "INVALID_POINTS" };
            }

            // Add points to User and UserPoints
            customer.Points += pointsToAdd;
            var userPoints = await _context.UserPoints.FirstOrDefaultAsync(up => up.UserId == customerId);
            if (userPoints == null)
            {
                userPoints = new UserPoints { UserId = customerId, Points = 0, RedeemedPoints = 0, LastUpdated = now };
                _context.UserPoints.Add(userPoints);
            }
            userPoints.Points += pointsToAdd;
            userPoints.LastUpdated = now;

            // Mark QR as redeemed
            qr.IsRedeemed = true;
            qr.RedeemedAt = now;
            qr.UpdatedAt = now;
            qr.RedeemedByUserId = customerId;

            // Add redemption history
            var history = new RedemptionHistory
            {
                UserId = customerId,
                QRCode = code,
                Points = pointsToAdd,
                RedeemedAt = now
            };
            _context.RedemptionHistories.Add(history);

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (Exception ex)
            {
                Console.WriteLine("Error saving changes: " + ex.ToString());
                throw;
            }

            return new ApiResponse<string>
            {
                Success = true,
                Message = $"QR code redeemed successfully! {pointsToAdd} points added.",
                Data = $"Points added: {pointsToAdd}"
            };
        }

        public async Task<UserHistoryDto?> GetUserWithHistoryAsync(int userId)
        {
            var user = await _context.Users.FindAsync(userId);
            if (user == null) return null;
            var userPoints = await _context.UserPoints.FirstOrDefaultAsync(up => up.UserId == userId);
            var history = await _context.RedemptionHistories
                .Where(h => h.UserId == userId)
                .OrderByDescending(h => h.RedeemedAt)
                .Select(h => new RedemptionHistoryDto
                {
                    QRCode = h.QRCode,
                    Points = h.Points,
                    RedeemedAt = h.RedeemedAt
                })
                .ToListAsync();
            
            Console.WriteLine($"GetUserWithHistoryAsync for user {userId}: User.Points = {user.Points}, UserPoints.Points = {userPoints?.Points ?? 0}");
            
            return new UserHistoryDto
            {
                Id = user.Id,
                Name = user.Name,
                Email = user.Email,
                Points = userPoints?.Points ?? user.Points, // Use UserPoints table for available points
                RedemptionHistory = history
            };
        }

        public async Task<int> GetQRCodeCountAsync(int manufacturerId)
{
    var campaignIds = await _context.Campaigns
        .Where(c => c.ManufacturerId == manufacturerId)
        .Select(c => c.Id)
        .ToListAsync();

    return await _context.QRCodes.CountAsync(qr => campaignIds.Contains(qr.CampaignId));
}

        private static QRCodeDto ToDto(QRCode qr, Campaign? campaign = null)
        {
            var dto = new QRCodeDto
            {
                Id = qr.Id,
                Code = qr.Code,
                CampaignId = qr.CampaignId,
                IsRedeemed = qr.IsRedeemed,
                RedeemedAt = qr.RedeemedAt,
                CreatedAt = qr.CreatedAt,
                UpdatedAt = qr.UpdatedAt,
                Points = campaign?.Points ?? 0,
                StartDate = campaign?.StartDate ?? DateTime.MinValue,
                EndDate = campaign?.EndDate ?? DateTime.MinValue,
                RewardTiers = campaign?.RewardTiers?.Select(rt => new QRCodeRewardTierDto
                {
                    Id = rt.Id,
                    Threshold = rt.Threshold,
                    Reward = rt.Reward
                }).ToList() ?? new List<QRCodeRewardTierDto>()
            };
            return dto;
        }
    }
}
