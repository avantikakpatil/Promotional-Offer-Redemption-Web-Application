using backend.Models;
using backend.Models.DTOs;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace backend.Services
{
    public interface IQRCodeService
    {
        Task<QRCodeDto> CreateQRCodeAsync(QRCodeCreateDto dto);
        Task<IEnumerable<QRCodeDto>> GetQRCodesByCampaignAsync(int campaignId);
        Task<QRCodeDto?> GetQRCodeByIdAsync(int id);
        Task<QRCodeDto?> GetQRCodeByCodeAsync(string code);
        Task<bool> DeleteQRCodeAsync(int id);
        Task<ApiResponse<string>> RedeemQRCodeAsync(int qrCodeId, int customerId, int points);
        Task<ApiResponse<string>> RedeemQRCodeByCodeAsync(string code, int customerId, int points);
        Task<ApiResponse<string>> RedeemQRCodeByResellerAsync(string code, int resellerId, int? customerId = null);
        Task<int> GetQRCodeCountAsync(int manufacturerId);
        Task<UserHistoryDto?> GetUserWithHistoryAsync(int userId);
    }
}
