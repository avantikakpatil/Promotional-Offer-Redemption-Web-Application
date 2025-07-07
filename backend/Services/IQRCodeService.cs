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
        Task<bool> DeleteQRCodeAsync(int id);
        Task<QRCodeDto?> RedeemQRCodeAsync(int id);
    }
}
