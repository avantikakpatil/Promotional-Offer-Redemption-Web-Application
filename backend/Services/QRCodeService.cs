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
            if (qr == null || qr.IsRedeemed)
                return new ApiResponse<string> { Success = false, Message = "QR code not found or already redeemed." };

            var customer = await _context.Users.FindAsync(customerId);
            if (customer == null)
                return new ApiResponse<string> { Success = false, Message = "Customer not found." };

            // Use UserPoints table
            var userPoints = await _context.UserPoints.FirstOrDefaultAsync(up => up.UserId == customerId);
            if (userPoints == null)
            {
                userPoints = new UserPoints { UserId = customerId, Points = 0, RedeemedPoints = 0, LastUpdated = DateTime.UtcNow };
                _context.UserPoints.Add(userPoints);
            }
            userPoints.Points += points;
            userPoints.LastUpdated = DateTime.UtcNow;

            qr.IsRedeemed = true;
            qr.RedeemedAt = DateTime.UtcNow;
            qr.UpdatedAt = DateTime.UtcNow;
            qr.RedeemedByUserId = customerId;

            // Store redemption history
            var history = new RedemptionHistory
            {
                UserId = customerId,
                QRCode = code,
                Points = points,
                RedeemedAt = DateTime.UtcNow
            };
            _context.RedemptionHistories.Add(history);

            await _context.SaveChangesAsync();

            return new ApiResponse<string> { Success = true, Message = "QR code redeemed and points added." };
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
            return new UserHistoryDto
            {
                Id = user.Id,
                Name = user.Name,
                Email = user.Email,
                Points = userPoints?.Points ?? 0,
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
