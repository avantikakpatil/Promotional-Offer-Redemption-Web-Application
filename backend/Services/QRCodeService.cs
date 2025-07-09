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

        public async Task<QRCodeDto?> RedeemQRCodeAsync(int id)
        {
            var qr = await _context.QRCodes.FindAsync(id);
            if (qr == null || qr.IsRedeemed) return null;
            qr.IsRedeemed = true;
            qr.RedeemedAt = DateTime.UtcNow;
            qr.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();
            return ToDto(qr);
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
