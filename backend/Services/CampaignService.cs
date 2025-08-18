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
                // Validate reward type
                if (string.IsNullOrWhiteSpace(createCampaignDto.RewardType) ||
                    (createCampaignDto.RewardType != "voucher" && createCampaignDto.RewardType != "free_product" && createCampaignDto.RewardType != "voucher_restricted"))
                {
                    return new ApiResponse<CampaignDto>
                    {
                        Success = false,
                        Message = "Invalid reward type. Must be 'voucher', 'voucher_restricted' or 'free_product'.",
                        Errors = new List<string> { "RewardType must be 'voucher', 'voucher_restricted' or 'free_product'" }
                    };
                }

                // Enforce only one reward type
                if (createCampaignDto.RewardType == "voucher" || createCampaignDto.RewardType == "voucher_restricted")
                {
                    if (createCampaignDto.VoucherGenerationThreshold == null || createCampaignDto.VoucherValue == null)
                    {
                        return new ApiResponse<CampaignDto>
                        {
                            Success = false,
                            Message = "Voucher generation threshold and value are required.",
                            Errors = new List<string> { "Please enter both threshold and value for voucher generation." }
                        };
                    }
                    if (createCampaignDto.RewardType == "voucher_restricted")
                    {
                        bool hasVoucherProducts = createCampaignDto.VoucherProducts != null && createCampaignDto.VoucherProducts.Any();
                        if (!hasVoucherProducts)
                        {
                            return new ApiResponse<CampaignDto>
                            {
                                Success = false,
                                Message = "At least one voucher redemption product is required for restricted voucher campaigns.",
                                Errors = new List<string> { "Specify at least one voucher redemption product." }
                            };
                        }
                    }
                }
                else if (createCampaignDto.RewardType == "free_product")
                {
                    // Allow either separate FreeProductRewards (legacy) OR inline eligible product free reward config
                    bool hasSeparateRewards = createCampaignDto.FreeProductRewards != null && createCampaignDto.FreeProductRewards.Any();
                    bool hasInlineRewards = createCampaignDto.EligibleProducts != null &&
                        createCampaignDto.EligibleProducts.Any(ep => ep.FreeProductId.HasValue && ep.MinPurchaseQuantity.HasValue && ep.FreeProductQty.HasValue);

                    if (!hasSeparateRewards && !hasInlineRewards)
                    {
                        return new ApiResponse<CampaignDto>
                        {
                            Success = false,
                            Message = "At least one free product reward is required.",
                            Errors = new List<string> { "Specify free product reward on at least one eligible product or in FreeProductRewards." }
                        };
                    }
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

                // Validate free product IDs from inline eligible products (if any)
                var inlineFreeProductIds = createCampaignDto.EligibleProducts?
                    .Where(ep => ep.FreeProductId.HasValue)
                    .Select(ep => ep.FreeProductId!.Value)
                    .Distinct()
                    .ToList() ?? new List<int>();
                if (inlineFreeProductIds.Any())
                {
                    var existingFreeIds = await _context.Products.Where(p => inlineFreeProductIds.Contains(p.Id)).Select(p => p.Id).ToListAsync();
                    var missingFreeIds = inlineFreeProductIds.Except(existingFreeIds).ToList();
                    if (missingFreeIds.Any())
                    {
                        return new ApiResponse<CampaignDto>
                        {
                            Success = false,
                            Message = "One or more selected free products do not exist.",
                            Errors = new List<string> { $"Missing FreeProductIds: {string.Join(", ", missingFreeIds)}" }
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

                // Set default values for voucher campaigns if not provided
                int defaultThreshold = 1;
                decimal defaultValue = 1;
                var campaign = new Campaign
                {
                    Name = createCampaignDto.Name,
                    ProductType = createCampaignDto.ProductType,
                    StartDate = createCampaignDto.StartDate,
                    EndDate = createCampaignDto.EndDate,
                    Description = createCampaignDto.Description,
                    IsActive = createCampaignDto.IsActive,
                    ManufacturerId = manufacturerId,
                    VoucherGenerationThreshold = (createCampaignDto.RewardType == "voucher" || createCampaignDto.RewardType == "voucher_restricted") ? (createCampaignDto.VoucherGenerationThreshold ?? defaultThreshold) : null,
                    VoucherValue = (createCampaignDto.RewardType == "voucher" || createCampaignDto.RewardType == "voucher_restricted") ? (createCampaignDto.VoucherValue ?? defaultValue) : null,
                    VoucherValidityDays = (createCampaignDto.RewardType == "voucher" || createCampaignDto.RewardType == "voucher_restricted") ? (createCampaignDto.VoucherValidityDays ?? 90) : null,
                    RewardType = createCampaignDto.RewardType,
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
                            IsActive = ep.IsActive,
                            MinPurchaseQuantity = ep.MinPurchaseQuantity,
                            FreeProductId = ep.FreeProductId,
                            FreeProductQty = ep.FreeProductQty
                        });
                    }
                }

                // Add voucher products for redemption (if voucher/voucher_restricted type)
                if ((createCampaignDto.RewardType == "voucher" || createCampaignDto.RewardType == "voucher_restricted") && createCampaignDto.VoucherProducts != null)
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

                // Add free product rewards (if free_product type)
                if (createCampaignDto.RewardType == "free_product" && createCampaignDto.FreeProductRewards != null)
                {
                    foreach (var fr in createCampaignDto.FreeProductRewards)
                    {
                        campaign.FreeProductRewards.Add(new CampaignFreeProductReward
                        {
                            ProductId = fr.ProductId,
                            Quantity = fr.Quantity,
                            IsActive = fr.IsActive
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
                // Validate reward type
                if (string.IsNullOrWhiteSpace(updateCampaignDto.RewardType) ||
                    (updateCampaignDto.RewardType != "voucher" && updateCampaignDto.RewardType != "free_product" && updateCampaignDto.RewardType != "voucher_restricted"))
                {
                    return new ApiResponse<CampaignDto>
                    {
                        Success = false,
                        Message = "Invalid reward type. Must be 'voucher', 'voucher_restricted' or 'free_product'.",
                        Errors = new List<string> { "RewardType must be 'voucher', 'voucher_restricted' or 'free_product'" }
                    };
                }

                // Enforce only one reward type
                if (string.Equals(updateCampaignDto.RewardType, "voucher", StringComparison.OrdinalIgnoreCase) || string.Equals(updateCampaignDto.RewardType, "voucher_restricted", StringComparison.OrdinalIgnoreCase))
                {
                    if (updateCampaignDto.VoucherGenerationThreshold == null || updateCampaignDto.VoucherValue == null)
                    {
                        return new ApiResponse<CampaignDto>
                        {
                            Success = false,
                            Message = "Voucher generation threshold and value are required.",
                            Errors = new List<string> { "Please enter both threshold and value for voucher generation." }
                        };
                    }
                    if (string.Equals(updateCampaignDto.RewardType, "voucher_restricted", StringComparison.OrdinalIgnoreCase))
                    {
                        if (updateCampaignDto.VoucherProducts == null || !updateCampaignDto.VoucherProducts.Any())
                        {
                            return new ApiResponse<CampaignDto>
                            {
                                Success = false,
                                Message = "At least one voucher redemption product is required for restricted voucher campaigns.",
                                Errors = new List<string> { "Please specify at least one voucher redemption product." }
                            };
                        }
                    }
                }
                else if (string.Equals(updateCampaignDto.RewardType, "free_product", StringComparison.OrdinalIgnoreCase))
                {
                    if (updateCampaignDto.FreeProductRewards == null || !updateCampaignDto.FreeProductRewards.Any())
                    {
                        return new ApiResponse<CampaignDto>
                        {
                            Success = false,
                            Message = "At least one free product reward is required.",
                            Errors = new List<string> { "Please specify at least one free product and quantity." }
                        };
                    }
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
                campaign.UpdatedAt = DateTime.UtcNow;

                // Update reward type
                campaign.RewardType = updateCampaignDto.RewardType;
                campaign.VoucherGenerationThreshold = (updateCampaignDto.RewardType == "voucher" || updateCampaignDto.RewardType == "voucher_restricted") ? updateCampaignDto.VoucherGenerationThreshold : null;
                campaign.VoucherValue = (updateCampaignDto.RewardType == "voucher" || updateCampaignDto.RewardType == "voucher_restricted") ? updateCampaignDto.VoucherValue : null;
                campaign.VoucherValidityDays = (updateCampaignDto.RewardType == "voucher" || updateCampaignDto.RewardType == "voucher_restricted") ? updateCampaignDto.VoucherValidityDays : null;

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
                            IsActive = ep.IsActive,
                            MinPurchaseQuantity = ep.MinPurchaseQuantity,
                            FreeProductId = ep.FreeProductId,
                            FreeProductQty = ep.FreeProductQty
                        });
                    }
                }

                // Remove and update voucher products if reward type is voucher
                if (string.Equals(updateCampaignDto.RewardType, "voucher", StringComparison.OrdinalIgnoreCase) || string.Equals(updateCampaignDto.RewardType, "voucher_restricted", StringComparison.OrdinalIgnoreCase))
                {
                    _context.CampaignVoucherProducts.RemoveRange(campaign.VoucherProducts);
                    if (updateCampaignDto.VoucherProducts != null)
                    {
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
                    // Remove any free product rewards
                    _context.CampaignFreeProductRewards.RemoveRange(campaign.FreeProductRewards);
                }
                // Remove and update free product rewards if reward type is free_product
                else if (string.Equals(updateCampaignDto.RewardType, "free_product", StringComparison.OrdinalIgnoreCase))
                {
                    _context.CampaignFreeProductRewards.RemoveRange(campaign.FreeProductRewards);
                    if (updateCampaignDto.FreeProductRewards != null)
                    {
                        foreach (var fr in updateCampaignDto.FreeProductRewards)
                        {
                            campaign.FreeProductRewards.Add(new CampaignFreeProductReward
                            {
                                ProductId = fr.ProductId,
                                Quantity = fr.Quantity,
                                IsActive = fr.IsActive
                            });
                        }
                    }
                    // Remove any voucher products
                    _context.CampaignVoucherProducts.RemoveRange(campaign.VoucherProducts);
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
                RewardType = campaign.RewardType,
                VoucherGenerationThreshold = campaign.VoucherGenerationThreshold,
                VoucherValue = campaign.VoucherValue,
                VoucherValidityDays = campaign.VoucherValidityDays,
                FreeProductRewards = campaign.FreeProductRewards?.Select(fr => new CampaignFreeProductRewardDto
                {
                    ProductId = fr.ProductId,
                    Quantity = fr.Quantity,
                    IsActive = fr.IsActive
                }).ToList() ?? new List<CampaignFreeProductRewardDto>(),
                EligibleProducts = campaign.EligibleProducts?.Select(ep => new CampaignEligibleProductDto
                {
                    CampaignProductId = ep.CampaignProductId,
                    PointCost = ep.PointCost,
                    RedemptionLimit = ep.RedemptionLimit,
                    IsActive = ep.IsActive,
                    MinPurchaseQuantity = ep.MinPurchaseQuantity,
                    FreeProductId = ep.FreeProductId,
                    FreeProductQty = ep.FreeProductQty
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