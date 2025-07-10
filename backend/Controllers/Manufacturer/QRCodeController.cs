using backend.Models.DTOs;
using backend.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace backend.Controllers.Manufacturer
{
    [ApiController]
    [Route("api/manufacturer/qrcodes")]
    [Authorize(Roles = "manufacturer")]
    public class QRCodeController : ControllerBase
    {
        private readonly IQRCodeService _qrCodeService;
        public QRCodeController(IQRCodeService qrCodeService)
        {
            _qrCodeService = qrCodeService;
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] QRCodeCreateDto dto)
        {
            var result = await _qrCodeService.CreateQRCodeAsync(dto);
            return Ok(result);
        }

        [HttpGet("by-campaign/{campaignId}")]
        public async Task<IActionResult> GetByCampaign(int campaignId)
        {
            var result = await _qrCodeService.GetQRCodesByCampaignAsync(campaignId);
            return Ok(result);
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var success = await _qrCodeService.DeleteQRCodeAsync(id);
            if (!success) return NotFound();
            return NoContent();
        }
    }
}
