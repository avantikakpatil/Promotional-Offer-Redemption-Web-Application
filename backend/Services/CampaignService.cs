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
                // Validate voucher generation fields
                if (createCampaignDto.VoucherGenerationThreshold == null || createCampaignDto.VoucherValue == null)
                {
                    return new ApiResponse<CampaignDto>
                    {
                        Success = false,
                        Message = "Voucher generation threshold and value are required.",
                        Errors = new List<string> { "Please enter both threshold and value for voucher generation." }
                    };
                }

                // Check that all eligible product IDs exist in CampaignProducts table
                var eligibleProductIds = createCampaignDto.EligibleProducts?.Select(ep => ep.CampaignProductId).ToList() ?? new List<int>();
                if (eligibleProductIds.Any())
                {
                    var existingEligibleProductIds = await _context.CampaignProducts.Where(p => eligibleProductIds.Contains(p.Id)).Select(p => p.Id).ToListAsync();
                    var missingEligibleProductIds = eligibleProductIds.Except(existingEligibleProductIds).ToList();
                    if (missingEligibleProductIds.Any())
                    {
                        return new ApiResponse<CampaignDto>
                        {
                            Success = false,
                            Message = "One or more selected eligible products do not exist.",
                            Errors = new List<string> { $"Missing CampaignProductIds: {string.Join(", ", missingEligibleProductIds)}" }
                        };
                    }
                }

                // Check that all voucher product IDs exist in Products table
                var voucherProductIds = createCampaignDto.VoucherProducts?.Select(vp => vp.ProductId).ToList() ?? new List<int>();
                if (voucherProductIds.Any())
                {
                    var existingVoucherProductIds = await _context.Products.Where(p => voucherProductIds.Contains(p.Id)).Select(p => p.Id).ToListAsync();
                    var missingVoucherProductIds = voucherProductIds.Except(existingVoucherProductIds).ToList();
                    if (missingVoucherProductIds.Any())
                    {
                        return new ApiResponse<CampaignDto>
                        {
                            Success = false,
                            Message = "One or more selected voucher products do not exist.",
                            Errors = new List<string> { $"Missing ProductIds: {string.Join(", ", missingVoucherProductIds)}" }
                        };
                    }
                }

                var campaign = new Campaign
                {
                    Name = createCampaignDto.Name,
                    ProductType = createCampaignDto.ProductType,
                    StartDate = createCampaignDto.StartDate,
                    EndDate = createCampaignDto.EndDate,
                    Description = createCampaignDto.Description,
                    IsActive = createCampaignDto.IsActive,
                    ManufacturerId = manufacturerId,
                    VoucherGenerationThreshold = createCampaignDto.VoucherGenerationThreshold,
                    VoucherValue = createCampaignDto.VoucherValue,
                    VoucherValidityDays = createCampaignDto.VoucherValidityDays,
                    CreatedAt = DateTime.UtcNow
                };

                // Add eligible products for points earning
                if (createCampaignDto.EligibleProducts != null)
                {
                    foreach (var ep in createCampaignDto.EligibleProducts)
                    {
                        campaign.EligibleProducts.Add(new CampaignEligibleProduct
                        {
                            CampaignProductId = ep.CampaignProductId,
                            PointCost = ep.PointCost,
                            RedemptionLimit = ep.RedemptionLimit,
                            IsActive = ep.IsActive
                        });
                    }
                }

                // Add voucher products for redemption
                if (createCampaignDto.VoucherProducts != null)
                {
                    foreach (var vp in createCampaignDto.VoucherProducts)
                    {
                        campaign.VoucherProducts.Add(new CampaignVoucherProduct
                        {
                            ProductId = vp.ProductId,
                            VoucherValue = vp.VoucherValue,
                            IsActive = vp.IsActive
                        });
                    }
                }

                _context.Campaigns.Add(campaign);
                await _context.SaveChangesAsync();

                // Auto-assign all resellers to this campaign
                var allResellers = await _context.Users.Where(u => u.Role == "reseller").ToListAsync();
                foreach (var reseller in allResellers)
                {
                    var campaignReseller = new CampaignReseller
                    {
                        CampaignId = campaign.Id,
                        ResellerId = reseller.Id,
                        IsApproved = true,
                        ApprovedAt = DateTime.UtcNow,
                        CreatedAt = DateTime.UtcNow,
                        UpdatedAt = DateTime.UtcNow
                    };
                    _context.CampaignResellers.Add(campaignReseller);
                }
                await _context.SaveChangesAsync();

                // Load the created campaign
                var createdCampaign = await _context.Campaigns
                    .Include(c => c.EligibleProducts).ThenInclude(ep => ep.CampaignProduct)
                    .Include(c => c.VoucherProducts).ThenInclude(vp => vp.Product)
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
                    .Include(c => c.EligibleProducts).ThenInclude(ep => ep.CampaignProduct)
                    .Include(c => c.VoucherProducts).ThenInclude(vp => vp.Product)
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
                    .Include(c => c.EligibleProducts).ThenInclude(ep => ep.CampaignProduct)
                    .Include(c => c.VoucherProducts).ThenInclude(vp => vp.Product)
                    .FirstOrDefaultAsync(c => c.Id == campaignId && c.ManufacturerId == manufacturerId);

                if (campaign == null)
                {
                    return new ApiResponse<CampaignDto>
                    {
                        Success = false,
                        Message = "Campaign not found",
                        Errors = new List<string> { "Campaign with the specified ID was not found" }
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
                // Validate voucher generation fields
                if (updateCampaignDto.VoucherGenerationThreshold == null || updateCampaignDto.VoucherValue == null)
                {
                    return new ApiResponse<CampaignDto>
                    {
                        Success = false,
                        Message = "Voucher generation threshold and value are required.",
                        Errors = new List<string> { "Please enter both threshold and value for voucher generation." }
                    };
                }

                var campaign = await _context.Campaigns
                    .Include(c => c.EligibleProducts).ThenInclude(ep => ep.CampaignProduct)
                    .Include(c => c.VoucherProducts).ThenInclude(vp => vp.Product)
                    .FirstOrDefaultAsync(c => c.Id == campaignId && c.ManufacturerId == manufacturerId);

                if (campaign == null)
                {
                    return new ApiResponse<CampaignDto>
                    {
                        Success = false,
                        Message = "Campaign not found",
                        Errors = new List<string> { "Campaign with the specified ID was not found" }
                    };
                }

                // Update basic properties
                campaign.Name = updateCampaignDto.Name;
                campaign.ProductType = updateCampaignDto.ProductType;
                campaign.StartDate = updateCampaignDto.StartDate;
                campaign.EndDate = updateCampaignDto.EndDate;
                campaign.Description = updateCampaignDto.Description;
                campaign.IsActive = updateCampaignDto.IsActive;
                campaign.VoucherGenerationThreshold = updateCampaignDto.VoucherGenerationThreshold;
                campaign.VoucherValue = updateCampaignDto.VoucherValue;
                campaign.VoucherValidityDays = updateCampaignDto.VoucherValidityDays;
                campaign.UpdatedAt = DateTime.UtcNow;

                // Update eligible products
                if (updateCampaignDto.EligibleProducts != null)
                {
                    // Remove existing eligible products
                    _context.CampaignEligibleProducts.RemoveRange(campaign.EligibleProducts);

                    // Add new eligible products
                    foreach (var ep in updateCampaignDto.EligibleProducts)
                    {
                        campaign.EligibleProducts.Add(new CampaignEligibleProduct
                        {
                            CampaignProductId = ep.CampaignProductId,
                            PointCost = ep.PointCost,
                            RedemptionLimit = ep.RedemptionLimit,
                            IsActive = ep.IsActive
                        });
                    }
                }

                // Update voucher products
                if (updateCampaignDto.VoucherProducts != null)
                {
                    // Remove existing voucher products
                    _context.CampaignVoucherProducts.RemoveRange(campaign.VoucherProducts);

                    // Add new voucher products
                    foreach (var vp in updateCampaignDto.VoucherProducts)
                    {
                        campaign.VoucherProducts.Add(new CampaignVoucherProduct
                        {
                            ProductId = vp.ProductId,
                            VoucherValue = vp.VoucherValue,
                            IsActive = vp.IsActive
                        });
                    }
                }

                await _context.SaveChangesAsync();

                var campaignDto = MapToDto(campaign);

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
                    .FirstOrDefaultAsync(c => c.Id == campaignId && c.ManufacturerId == manufacturerId);

                if (campaign == null)
                {
                    return new ApiResponse<bool>
                    {
                        Success = false,
                        Message = "Campaign not found",
                        Errors = new List<string> { "Campaign with the specified ID was not found" }
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
                        Errors = new List<string> { "Campaign with the specified ID was not found" }
                    };
                }

                campaign.IsActive = !campaign.IsActive;
                campaign.UpdatedAt = DateTime.UtcNow;

                await _context.SaveChangesAsync();

                return new ApiResponse<bool>
                {
                    Success = true,
                    Message = $"Campaign {(campaign.IsActive ? "activated" : "deactivated")} successfully",
                    Data = campaign.IsActive
                };
            }
            catch (Exception ex)
            {
                return new ApiResponse<bool>
                {
                    Success = false,
                    Message = "An error occurred while toggling campaign status",
                    Errors = new List<string> { ex.Message }
                };
            }
        }

        private static CampaignDto MapToDto(Campaign campaign)
        {
            return new CampaignDto
            {
                Id = campaign.Id,
                Name = campaign.Name,
                ProductType = campaign.ProductType,
                StartDate = campaign.StartDate,
                EndDate = campaign.EndDate,
                Description = campaign.Description,
                IsActive = campaign.IsActive,
                ManufacturerId = campaign.ManufacturerId,
                VoucherGenerationThreshold = campaign.VoucherGenerationThreshold,
                VoucherValue = campaign.VoucherValue,
                VoucherValidityDays = campaign.VoucherValidityDays,
                CreatedAt = campaign.CreatedAt,
                UpdatedAt = campaign.UpdatedAt,
                EligibleProducts = campaign.EligibleProducts?.Select(ep => new CampaignEligibleProductDto
                {
                    CampaignProductId = ep.CampaignProductId,
                    PointCost = ep.PointCost,
                    RedemptionLimit = ep.RedemptionLimit,
                    IsActive = ep.IsActive
                }).ToList() ?? new List<CampaignEligibleProductDto>(),
                VoucherProducts = campaign.VoucherProducts?.Select(vp => new CampaignVoucherProductDto
                {
                    ProductId = vp.ProductId,
                    VoucherValue = vp.VoucherValue,
                    IsActive = vp.IsActive
                }).ToList() ?? new List<CampaignVoucherProductDto>()
            };
        }
    }
}