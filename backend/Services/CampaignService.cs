using backend.Data;
using backend.Models;
using backend.Models.DTOs;
using Microsoft.EntityFrameworkCore;

namespace backend.Services
{
    public interface ICampaignService
    {
        Task<ApiResponse<CampaignDto>> CreateCampaignAsync(CreateCampaignDto createCampaignDto, int manufacturerId);
        Task<ApiResponse<List<CampaignDto>>> GetCampaignsByManufacturerAsync(int manufacturerId);
        Task<ApiResponse<CampaignDto>> GetCampaignByIdAsync(int campaignId, int manufacturerId);
        Task<ApiResponse<CampaignDto>> UpdateCampaignAsync(int campaignId, CreateCampaignDto updateCampaignDto, int manufacturerId);
        Task<ApiResponse<bool>> DeleteCampaignAsync(int campaignId, int manufacturerId);
        Task<ApiResponse<bool>> ToggleCampaignStatusAsync(int campaignId, int manufacturerId);
        Task<int> GetCampaignCountAsync(int manufacturerId);
    }

    public class CampaignService : ICampaignService
    {
        private readonly ApplicationDbContext _context;

        public CampaignService(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<ApiResponse<CampaignDto>> CreateCampaignAsync(CreateCampaignDto createCampaignDto, int manufacturerId)
        {
            try
            {
                // Validate dates
                if (createCampaignDto.StartDate >= createCampaignDto.EndDate)
                {
                    return new ApiResponse<CampaignDto>
                    {
                        Success = false,
                        Message = "End date must be after start date",
                        Errors = new List<string> { "End date must be after start date" }
                    };
                }

                if (createCampaignDto.StartDate < DateTime.UtcNow.Date)
                {
                    return new ApiResponse<CampaignDto>
                    {
                        Success = false,
                        Message = "Start date cannot be in the past",
                        Errors = new List<string> { "Start date cannot be in the past" }
                    };
                }

                // Validate reward tiers
                if (!createCampaignDto.RewardTiers.Any())
                {
                    return new ApiResponse<CampaignDto>
                    {
                        Success = false,
                        Message = "At least one reward tier is required",
                        Errors = new List<string> { "At least one reward tier is required" }
                    };
                }

                // Check for duplicate thresholds
                var duplicateThresholds = createCampaignDto.RewardTiers
                    .GroupBy(t => t.Threshold)
                    .Where(g => g.Count() > 1)
                    .Select(g => g.Key);

                if (duplicateThresholds.Any())
                {
                    return new ApiResponse<CampaignDto>
                    {
                        Success = false,
                        Message = "Duplicate reward tier thresholds are not allowed",
                        Errors = new List<string> { "Duplicate reward tier thresholds are not allowed" }
                    };
                }

                // Create campaign entity
                var campaign = new Campaign
                {
                    Name = createCampaignDto.Name,
                    ProductType = createCampaignDto.ProductType,
                    Points = createCampaignDto.Points,
                    StartDate = createCampaignDto.StartDate,
                    EndDate = createCampaignDto.EndDate,
                    Description = createCampaignDto.Description,
                    Budget = createCampaignDto.Budget,
                    TargetAudience = createCampaignDto.TargetAudience,
                    IsActive = createCampaignDto.IsActive,
                    ManufacturerId = manufacturerId,
                    CreatedAt = DateTime.UtcNow
                };

                // Add reward tiers
                foreach (var tierDto in createCampaignDto.RewardTiers)
                {
                    campaign.RewardTiers.Add(new RewardTier
                    {
                        Threshold = tierDto.Threshold,
                        Reward = tierDto.Reward,
                        CreatedAt = DateTime.UtcNow
                    });
                }

                // Add eligible products
                if (createCampaignDto.EligibleProducts != null)
                {
                    foreach (var ep in createCampaignDto.EligibleProducts)
                    {
                        campaign.EligibleProducts.Add(new CampaignEligibleProduct
                        {
                            ProductId = ep.ProductId,
                            PointCost = ep.PointCost,
                            RedemptionLimit = ep.RedemptionLimit,
                            IsActive = ep.IsActive
                        });
                    }
                }

                _context.Campaigns.Add(campaign);
                await _context.SaveChangesAsync();

                // Load the created campaign with reward tiers
                var createdCampaign = await _context.Campaigns
                    .Include(c => c.RewardTiers)
                    .FirstOrDefaultAsync(c => c.Id == campaign.Id);

                var campaignDto = MapToDto(createdCampaign!);

                return new ApiResponse<CampaignDto>
                {
                    Success = true,
                    Message = "Campaign created successfully",
                    Data = campaignDto
                };
            }
            catch (Exception ex)
            {
                // Recursively get all inner exception messages
                string GetFullExceptionMessage(Exception e)
                {
                    if (e == null) return "";
                    return e.Message + (e.InnerException != null ? " | Inner: " + GetFullExceptionMessage(e.InnerException) : "");
                }

                var errorMsg = GetFullExceptionMessage(ex);

                return new ApiResponse<CampaignDto>
                {
                    Success = false,
                    Message = "An error occurred while creating the campaign",
                    Errors = new List<string> { errorMsg }
                };
            }
        }

        public async Task<int> GetCampaignCountAsync(int manufacturerId)
{
    return await _context.Campaigns.CountAsync(c => c.ManufacturerId == manufacturerId);
}

        public async Task<ApiResponse<List<CampaignDto>>> GetCampaignsByManufacturerAsync(int manufacturerId)
        {
            try
            {
                var campaigns = await _context.Campaigns
                    .Include(c => c.RewardTiers)
                    .Where(c => c.ManufacturerId == manufacturerId)
                    .OrderByDescending(c => c.CreatedAt)
                    .ToListAsync();

                var campaignDtos = campaigns.Select(MapToDto).ToList();

                return new ApiResponse<List<CampaignDto>>
                {
                    Success = true,
                    Message = "Campaigns retrieved successfully",
                    Data = campaignDtos
                };
            }
            catch (Exception ex)
            {
                return new ApiResponse<List<CampaignDto>>
                {
                    Success = false,
                    Message = "An error occurred while retrieving campaigns",
                    Errors = new List<string> { ex.Message }
                };
            }
        }

        public async Task<ApiResponse<CampaignDto>> GetCampaignByIdAsync(int campaignId, int manufacturerId)
        {
            try
            {
                var campaign = await _context.Campaigns
                    .Include(c => c.RewardTiers)
                    .FirstOrDefaultAsync(c => c.Id == campaignId && c.ManufacturerId == manufacturerId);

                if (campaign == null)
                {
                    return new ApiResponse<CampaignDto>
                    {
                        Success = false,
                        Message = "Campaign not found",
                        Errors = new List<string> { "Campaign not found" }
                    };
                }

                var campaignDto = MapToDto(campaign);

                return new ApiResponse<CampaignDto>
                {
                    Success = true,
                    Message = "Campaign retrieved successfully",
                    Data = campaignDto
                };
            }
            catch (Exception ex)
            {
                return new ApiResponse<CampaignDto>
                {
                    Success = false,
                    Message = "An error occurred while retrieving the campaign",
                    Errors = new List<string> { ex.Message }
                };
            }
        }

        public async Task<ApiResponse<CampaignDto>> UpdateCampaignAsync(int campaignId, CreateCampaignDto updateCampaignDto, int manufacturerId)
        {
            try
            {
                var campaign = await _context.Campaigns
                    .Include(c => c.RewardTiers)
                    .FirstOrDefaultAsync(c => c.Id == campaignId && c.ManufacturerId == manufacturerId);

                if (campaign == null)
                {
                    return new ApiResponse<CampaignDto>
                    {
                        Success = false,
                        Message = "Campaign not found",
                        Errors = new List<string> { "Campaign not found" }
                    };
                }

                // Validate dates
                if (updateCampaignDto.StartDate >= updateCampaignDto.EndDate)
                {
                    return new ApiResponse<CampaignDto>
                    {
                        Success = false,
                        Message = "End date must be after start date",
                        Errors = new List<string> { "End date must be after start date" }
                    };
                }

                // Update campaign properties
                campaign.Name = updateCampaignDto.Name;
                campaign.ProductType = updateCampaignDto.ProductType;
                campaign.Points = updateCampaignDto.Points;
                campaign.StartDate = updateCampaignDto.StartDate;
                campaign.EndDate = updateCampaignDto.EndDate;
                campaign.Description = updateCampaignDto.Description;
                campaign.Budget = updateCampaignDto.Budget;
                campaign.TargetAudience = updateCampaignDto.TargetAudience;
                campaign.IsActive = updateCampaignDto.IsActive;
                campaign.UpdatedAt = DateTime.UtcNow;

                // Update reward tiers
                _context.RewardTiers.RemoveRange(campaign.RewardTiers);
                campaign.RewardTiers.Clear();

                foreach (var tierDto in updateCampaignDto.RewardTiers)
                {
                    campaign.RewardTiers.Add(new RewardTier
                    {
                        Threshold = tierDto.Threshold,
                        Reward = tierDto.Reward,
                        CreatedAt = DateTime.UtcNow
                    });
                }

                // Update eligible products
                if (updateCampaignDto.EligibleProducts != null)
                {
                    // Remove old eligible products
                    var oldEligibleProducts = campaign.EligibleProducts.ToList();
                    foreach (var oldEp in oldEligibleProducts)
                    {
                        _context.CampaignEligibleProducts.Remove(oldEp);
                    }
                    // Add new eligible products
                    foreach (var ep in updateCampaignDto.EligibleProducts)
                    {
                        campaign.EligibleProducts.Add(new CampaignEligibleProduct
                        {
                            ProductId = ep.ProductId,
                            PointCost = ep.PointCost,
                            RedemptionLimit = ep.RedemptionLimit,
                            IsActive = ep.IsActive
                        });
                    }
                }

                await _context.SaveChangesAsync();

                var updatedCampaign = await _context.Campaigns
                    .Include(c => c.RewardTiers)
                    .FirstOrDefaultAsync(c => c.Id == campaign.Id);

                var campaignDto = MapToDto(updatedCampaign!);

                return new ApiResponse<CampaignDto>
                {
                    Success = true,
                    Message = "Campaign updated successfully",
                    Data = campaignDto
                };
            }
            catch (Exception ex)
            {
                return new ApiResponse<CampaignDto>
                {
                    Success = false,
                    Message = "An error occurred while updating the campaign",
                    Errors = new List<string> { ex.Message }
                };
            }
        }

        public async Task<ApiResponse<bool>> DeleteCampaignAsync(int campaignId, int manufacturerId)
        {
            try
            {
                var campaign = await _context.Campaigns
                    .Include(c => c.RewardTiers)
                    .FirstOrDefaultAsync(c => c.Id == campaignId && c.ManufacturerId == manufacturerId);

                if (campaign == null)
                {
                    return new ApiResponse<bool>
                    {
                        Success = false,
                        Message = "Campaign not found",
                        Errors = new List<string> { "Campaign not found" }
                    };
                }

                _context.Campaigns.Remove(campaign);
                await _context.SaveChangesAsync();

                return new ApiResponse<bool>
                {
                    Success = true,
                    Message = "Campaign deleted successfully",
                    Data = true
                };
            }
            catch (Exception ex)
            {
                return new ApiResponse<bool>
                {
                    Success = false,
                    Message = "An error occurred while deleting the campaign",
                    Errors = new List<string> { ex.Message }
                };
            }
        }

        public async Task<ApiResponse<bool>> ToggleCampaignStatusAsync(int campaignId, int manufacturerId)
        {
            try
            {
                var campaign = await _context.Campaigns
                    .FirstOrDefaultAsync(c => c.Id == campaignId && c.ManufacturerId == manufacturerId);

                if (campaign == null)
                {
                    return new ApiResponse<bool>
                    {
                        Success = false,
                        Message = "Campaign not found",
                        Errors = new List<string> { "Campaign not found" }
                    };
                }

                campaign.IsActive = !campaign.IsActive;
                campaign.UpdatedAt = DateTime.UtcNow;

                await _context.SaveChangesAsync();

                return new ApiResponse<bool>
                {
                    Success = true,
                    Message = $"Campaign {(campaign.IsActive ? "activated" : "deactivated")} successfully",
                    Data = true
                };
            }
            catch (Exception ex)
            {
                return new ApiResponse<bool>
                {
                    Success = false,
                    Message = "An error occurred while updating campaign status",
                    Errors = new List<string> { ex.Message }
                };
            }
        }

        private static CampaignDto MapToDto(Campaign campaign)
        {
            var dto = new CampaignDto
            {
                Id = campaign.Id,
                Name = campaign.Name,
                ProductType = campaign.ProductType,
                Points = campaign.Points,
                StartDate = campaign.StartDate,
                EndDate = campaign.EndDate,
                Description = campaign.Description,
                Budget = campaign.Budget,
                TargetAudience = campaign.TargetAudience,
                IsActive = campaign.IsActive,
                ManufacturerId = campaign.ManufacturerId,
                CreatedAt = campaign.CreatedAt,
                UpdatedAt = campaign.UpdatedAt,
                RewardTiers = campaign.RewardTiers.Select(rt => new RewardTierDto
                {
                    Id = rt.Id,
                    CampaignId = rt.CampaignId,
                    Threshold = rt.Threshold,
                    Reward = rt.Reward,
                    CreatedAt = rt.CreatedAt
                }).ToList(),
                EligibleProducts = campaign.EligibleProducts.Select(ep => new EligibleProductDto
                {
                    ProductId = ep.ProductId,
                    ProductName = ep.Product != null ? ep.Product.Name : string.Empty,
                    PointCost = ep.PointCost,
                    RedemptionLimit = ep.RedemptionLimit,
                    IsActive = ep.IsActive
                }).ToList()
            };
            return dto;
        }
    }
}