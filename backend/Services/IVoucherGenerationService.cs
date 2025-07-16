using backend.Models;

namespace backend.Services
{
    public interface IVoucherGenerationService
    {
        Task<bool> CheckAndGenerateVouchersAsync();
        Task<bool> GenerateVouchersForResellerAsync(int resellerId, int campaignId);
        Task<bool> GenerateVouchersForResellerAsync(int resellerId, int campaignId, int pointsEarned = 0);
        Task<bool> GenerateVouchersForCampaignAsync(int campaignId);
        Task<object> GetVoucherGenerationStatsAsync(int campaignId);
    }
} 