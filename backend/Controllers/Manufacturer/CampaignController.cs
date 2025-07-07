using backend.Models.DTOs;
using backend.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace backend.Controllers.Manufacturer
{
    [ApiController]
    [Route("api/manufacturer/campaigns")]
    [Authorize] // Assuming you have JWT authentication
    public class CampaignController : ControllerBase
    {
        private readonly ICampaignService _campaignService;

        public CampaignController(ICampaignService campaignService)
        {
            _campaignService = campaignService;
        }

        [HttpPost]
        public async Task<ActionResult<ApiResponse<CampaignDto>>> CreateCampaign([FromBody] CreateCampaignDto createCampaignDto)
        {
            try
            {
                // Get manufacturer ID from JWT token
                var manufacturerIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;

                if (string.IsNullOrEmpty(manufacturerIdClaim) || !int.TryParse(manufacturerIdClaim, out int manufacturerId))
                {
                    return Unauthorized(new ApiResponse<CampaignDto>
                    {
                        Success = false,
                        Message = "Invalid or missing manufacturer authentication",
                        Errors = new List<string> { "User ID not found in token" }
                    });
                }

                // Validate user role (robust extraction and case-insensitive check)
                var roleClaim = User.FindFirst("http://schemas.microsoft.com/ws/2008/06/identity/claims/role")?.Value
                    ?? User.FindFirst(ClaimTypes.Role)?.Value;
                if (!string.Equals(roleClaim, "manufacturer", StringComparison.OrdinalIgnoreCase))
                {
                    return Forbid();
                }

                if (!ModelState.IsValid)
                {
                    var errors = ModelState
                        .SelectMany(x => x.Value!.Errors)
                        .Select(x => x.ErrorMessage)
                        .ToList();

                    return BadRequest(new ApiResponse<CampaignDto>
                    {
                        Success = false,
                        Message = "Validation failed",
                        Errors = errors
                    });
                }

                var result = await _campaignService.CreateCampaignAsync(createCampaignDto, manufacturerId);

                if (!result.Success)
                {
                    return BadRequest(result);
                }

                return CreatedAtAction(
                    nameof(GetCampaignById),
                    new { id = result.Data!.Id },
                    result
                );
            }
            catch (Exception ex)
            {
                return StatusCode(500, new ApiResponse<CampaignDto>
                {
                    Success = false,
                    Message = "An internal server error occurred",
                    Errors = new List<string> { ex.Message }
                });
            }
        }

        [HttpGet]
        public async Task<ActionResult<ApiResponse<List<CampaignDto>>>> GetCampaigns()
        {
            try
            {
                var manufacturerIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;

                if (string.IsNullOrEmpty(manufacturerIdClaim) || !int.TryParse(manufacturerIdClaim, out int manufacturerId))
                {
                    return Unauthorized(new ApiResponse<List<CampaignDto>>
                    {
                        Success = false,
                        Message = "Invalid or missing manufacturer authentication",
                        Errors = new List<string> { "User ID not found in token" }
                    });
                }

                var result = await _campaignService.GetCampaignsByManufacturerAsync(manufacturerId);

                if (!result.Success)
                {
                    return BadRequest(result);
                }

                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new ApiResponse<List<CampaignDto>>
                {
                    Success = false,
                    Message = "An internal server error occurred",
                    Errors = new List<string> { ex.Message }
                });
            }
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<ApiResponse<CampaignDto>>> GetCampaignById(int id)
        {
            try
            {
                var manufacturerIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;

                if (string.IsNullOrEmpty(manufacturerIdClaim) || !int.TryParse(manufacturerIdClaim, out int manufacturerId))
                {
                    return Unauthorized(new ApiResponse<CampaignDto>
                    {
                        Success = false,
                        Message = "Invalid or missing manufacturer authentication",
                        Errors = new List<string> { "User ID not found in token" }
                    });
                }

                var result = await _campaignService.GetCampaignByIdAsync(id, manufacturerId);

                if (!result.Success)
                {
                    return NotFound(result);
                }

                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new ApiResponse<CampaignDto>
                {
                    Success = false,
                    Message = "An internal server error occurred",
                    Errors = new List<string> { ex.Message }
                });
            }
        }

        [HttpPut("{id}")]
        public async Task<ActionResult<ApiResponse<CampaignDto>>> UpdateCampaign(int id, [FromBody] CreateCampaignDto updateCampaignDto)
        {
            try
            {
                var manufacturerIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;

                if (string.IsNullOrEmpty(manufacturerIdClaim) || !int.TryParse(manufacturerIdClaim, out int manufacturerId))
                {
                    return Unauthorized(new ApiResponse<CampaignDto>
                    {
                        Success = false,
                        Message = "Invalid or missing manufacturer authentication",
                        Errors = new List<string> { "User ID not found in token" }
                    });
                }

                if (!ModelState.IsValid)
                {
                    var errors = ModelState
                        .SelectMany(x => x.Value!.Errors)
                        .Select(x => x.ErrorMessage)
                        .ToList();

                    return BadRequest(new ApiResponse<CampaignDto>
                    {
                        Success = false,
                        Message = "Validation failed",
                        Errors = errors
                    });
                }

                var result = await _campaignService.UpdateCampaignAsync(id, updateCampaignDto, manufacturerId);

                if (!result.Success)
                {
                    return BadRequest(result);
                }

                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new ApiResponse<CampaignDto>
                {
                    Success = false,
                    Message = "An internal server error occurred",
                    Errors = new List<string> { ex.Message }
                });
            }
        }

        [HttpDelete("{id}")]
        public async Task<ActionResult<ApiResponse<bool>>> DeleteCampaign(int id)
        {
            try
            {
                var manufacturerIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;

                if (string.IsNullOrEmpty(manufacturerIdClaim) || !int.TryParse(manufacturerIdClaim, out int manufacturerId))
                {
                    return Unauthorized(new ApiResponse<bool>
                    {
                        Success = false,
                        Message = "Invalid or missing manufacturer authentication",
                        Errors = new List<string> { "User ID not found in token" }
                    });
                }

                var result = await _campaignService.DeleteCampaignAsync(id, manufacturerId);

                if (!result.Success)
                {
                    return NotFound(result);
                }

                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new ApiResponse<bool>
                {
                    Success = false,
                    Message = "An internal server error occurred",
                    Errors = new List<string> { ex.Message }
                });
            }
        }

        [HttpPatch("{id}/toggle-status")]
        public async Task<ActionResult<ApiResponse<bool>>> ToggleCampaignStatus(int id)
        {
            try
            {
                var manufacturerIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;

                if (string.IsNullOrEmpty(manufacturerIdClaim) || !int.TryParse(manufacturerIdClaim, out int manufacturerId))
                {
                    return Unauthorized(new ApiResponse<bool>
                    {
                        Success = false,
                        Message = "Invalid or missing manufacturer authentication",
                        Errors = new List<string> { "User ID not found in token" }
                    });
                }

                var result = await _campaignService.ToggleCampaignStatusAsync(id, manufacturerId);

                if (!result.Success)
                {
                    return NotFound(result);
                }

                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new ApiResponse<bool>
                {
                    Success = false,
                    Message = "An internal server error occurred",
                    Errors = new List<string> { ex.Message }
                });
            }
        }
    }
}