using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using backend.Data;
using backend.Models;
using backend.Models.DTOs;
using backend.Services;
using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;

namespace backend.Controllers.Reseller
{
    [ApiController]
    [Route("api/reseller/[controller]")]
    public class OrderController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly ICampaignPointsService _campaignPointsService;

        public OrderController(ApplicationDbContext context, ICampaignPointsService campaignPointsService)
        {
            _context = context;
            _campaignPointsService = campaignPointsService;
        }

        // GET: api/reseller/order
        [HttpGet]
        public async Task<ActionResult<IEnumerable<object>>> GetOrders()
        {
            var resellerId = GetCurrentUserId();
            if (resellerId == null)
                return Unauthorized();

            var orders = await _context.TempOrderPoints
                .Where(o => o.ResellerId == resellerId)
                .OrderByDescending(o => o.Date)
                .Select(o => new
                {
                    id = o.Id,
                    date = o.Date,
                    resellerId = o.ResellerId,
                    campaignId = o.CampaignId,
                    points = o.Points,
                    orderNumber = o.OrderNumber,
                    status = o.Status,
                    totalAmount = o.TotalAmount,
                    totalPointsEarned = o.TotalPointsEarned,
                    shippingAddress = o.ShippingAddress,
                    notes = o.Notes,
                    approvedAt = o.ApprovedAt,
                    shippedAt = o.ShippedAt,
                    deliveredAt = o.DeliveredAt
                })
                .ToListAsync();

            return Ok(orders);
        }

        // GET: api/reseller/order/{id}
        [HttpGet("{id}")]
        public async Task<ActionResult<object>> GetOrder(int id)
        {
            var resellerId = GetCurrentUserId();
            if (resellerId == null)
                return Unauthorized();

            var order = await _context.TempOrderPoints
                .FirstOrDefaultAsync(o => o.Id == id && o.ResellerId == resellerId.Value);

            if (order == null)
                return NotFound();

            return Ok(new {
                id = order.Id,
                date = order.Date,
                resellerId = order.ResellerId,
                campaignId = order.CampaignId,
                points = order.Points,
                orderNumber = order.OrderNumber,
                status = order.Status,
                totalAmount = order.TotalAmount,
                totalPointsEarned = order.TotalPointsEarned,
                shippingAddress = order.ShippingAddress,
                notes = order.Notes,
                approvedAt = order.ApprovedAt,
                shippedAt = order.ShippedAt,
                deliveredAt = order.DeliveredAt
            });
        }

        // GET: api/reseller/order/available-campaigns
        [HttpGet("available-campaigns")]
        public async Task<ActionResult<IEnumerable<object>>> GetAvailableCampaigns()
        {
            var resellerId = GetCurrentUserId();
            if (resellerId == null)
                return Unauthorized();

            // Get all active campaigns with manufacturer information and assignment status
            var allCampaigns = await _context.Campaigns
                .Include(c => c.Manufacturer)
                .Include(c => c.EligibleProducts)
                .Include(c => c.VoucherProducts)
                .Where(c => c.IsActive)
                .Select(c => new
                {
                    id = c.Id,
                    name = c.Name,
                    productType = c.ProductType,
                    startDate = c.StartDate,
                    endDate = c.EndDate,
                    description = c.Description,
                    isActive = c.IsActive,
                    createdAt = c.CreatedAt,
                    // Voucher settings
                    voucherGenerationThreshold = c.VoucherGenerationThreshold,
                    voucherValue = c.VoucherValue,
                    voucherValidityDays = c.VoucherValidityDays,
                    // Campaign products
                    eligibleProducts = c.EligibleProducts.Select(ep => new
                    {
                        id = ep.Id,
                        campaignProductId = ep.CampaignProductId,
                        pointCost = ep.PointCost,
                        redemptionLimit = ep.RedemptionLimit,
                        isActive = ep.IsActive
                    }).ToList(),
                    voucherProducts = c.VoucherProducts.Select(vp => new
                    {
                        id = vp.Id,
                        productId = vp.ProductId,
                        voucherValue = vp.VoucherValue,
                        isActive = vp.IsActive
                    }).ToList(),
                    manufacturer = new
                    {
                        id = c.Manufacturer.Id,
                        name = c.Manufacturer.Name,
                        businessName = c.Manufacturer.BusinessName,
                        email = c.Manufacturer.Email
                    },
                    assignment = _context.CampaignResellers
                        .Where(cr => cr.CampaignId == c.Id && cr.ResellerId == resellerId)
                        .Select(cr => new
                        {
                            isApproved = cr.IsApproved,
                            assignedAt = cr.CreatedAt,
                            totalPointsEarned = cr.TotalPointsEarned,
                            totalOrderValue = cr.TotalOrderValue
                        })
                        .FirstOrDefault()
                })
                .ToListAsync();

            // Get reward tiers for all campaigns
            var campaignIds = allCampaigns.Select(c => c.id).ToList();
            var rewardTiers = await _context.RewardTiers
                .Where(rt => campaignIds.Contains(rt.CampaignId))
                .Select(rt => new
                {
                    campaignId = rt.CampaignId,
                    id = rt.Id,
                    threshold = rt.Threshold,
                    reward = rt.Reward
                })
                .ToListAsync();

            // Attach reward tiers to campaigns
            var campaignsWithRewardTiers = allCampaigns.Select(c => new
            {
                c.id,
                c.name,
                c.productType,
                c.startDate,
                c.endDate,
                c.description,
                c.isActive,
                c.createdAt,
                c.voucherGenerationThreshold,
                c.voucherValue,
                c.voucherValidityDays,
                c.eligibleProducts,
                c.voucherProducts,
                c.manufacturer,
                c.assignment,
                rewardTiers = rewardTiers.Where(rt => rt.campaignId == c.id).ToList()
            });

            return Ok(campaignsWithRewardTiers);
        }

        // GET: api/reseller/order/eligible-products
        [HttpGet("eligible-products")]
        public async Task<ActionResult<object>> GetEligibleProducts()
        {
            var resellerId = GetCurrentUserId();
            if (resellerId == null)
                return Unauthorized();

            try
            {
                // Get all eligible products from all campaigns (do not filter by assignment or approval)
                var eligibleProducts = await _context.CampaignEligibleProducts
                    .Include(cep => cep.Campaign)
                    .Include(cep => cep.CampaignProduct)
                    .Where(cep => cep.IsActive && cep.Campaign.IsActive)
                    .Select(cep => new
                    {
                        eligibleProductId = cep.Id,
                        campaignId = cep.CampaignId,
                        campaignName = cep.Campaign.Name,
                        campaignDescription = cep.Campaign.Description,
                        productId = cep.CampaignProductId,
                        productName = cep.CampaignProduct.Name,
                        productCategory = cep.CampaignProduct.Category,
                        productSKU = cep.CampaignProduct.SKU,
                        productBrand = cep.CampaignProduct.Brand,
                        basePrice = cep.CampaignProduct.BasePrice,
                        pointsPerUnit = cep.CampaignProduct.PointsPerUnit,
                        pointCost = cep.PointCost,
                        redemptionLimit = cep.RedemptionLimit,
                        isActive = cep.IsActive
                    })
                    .ToListAsync();

                // Group by campaign
                var groupedProducts = eligibleProducts
                    .GroupBy(ep => new { ep.campaignId, ep.campaignName, ep.campaignDescription })
                    .Select(group => new
                    {
                        campaign = new
                        {
                            id = group.Key.campaignId,
                            name = group.Key.campaignName,
                            description = group.Key.campaignDescription
                        },
                        products = group.Select(p => new
                        {
                            eligibleProductId = p.eligibleProductId,
                            productId = p.productId,
                            name = p.productName,
                            category = p.productCategory,
                            sku = p.productSKU,
                            brand = p.productBrand,
                            basePrice = p.basePrice,
                            pointsPerUnit = p.pointsPerUnit,
                            pointCost = p.pointCost,
                            redemptionLimit = p.redemptionLimit,
                            isActive = p.isActive
                        }).ToList()
                    })
                    .ToList();

                return Ok(new
                {
                    campaigns = groupedProducts,
                    totalProducts = eligibleProducts.Count,
                    totalCampaigns = groupedProducts.Count
                });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error getting eligible products: {ex.Message}");
                return StatusCode(500, new { message = "Error getting eligible products", error = ex.Message });
            }
        }

        // POST: api/reseller/order/create
        [HttpPost("create")]
public async Task<ActionResult<object>> CreateOrder([FromBody] CreateOrderRequest request)
{
    var resellerId = GetCurrentUserId();
    if (resellerId == null)
        return Unauthorized();

    try
    {
        // Generate unique order number
        var today = DateTime.UtcNow.ToString("yyyyMMdd");
        var orderCountToday = await _context.TempOrderPoints.CountAsync(o => o.Date.Date == DateTime.UtcNow.Date);
        var orderNumber = $"ORD{today}-{(orderCountToday + 1).ToString("D4")}";

        // Calculate total amount and points from items
        decimal totalAmount = 0;
        int totalPoints = 0;
        int campaignId = 0;
        if (request.Items != null && request.Items.Count > 0)
        {
            foreach (var item in request.Items)
            {
                // Fetch eligible product and campaign product for price and point cost
                var eligibleProduct = await _context.CampaignEligibleProducts
                    .Include(ep => ep.CampaignProduct)
                    .FirstOrDefaultAsync(ep => ep.Id == item.EligibleProductId && ep.CampaignId == item.CampaignId);
                if (eligibleProduct == null || eligibleProduct.CampaignProduct == null)
                {
                    return BadRequest(new { message = $"Invalid eligible product or campaign for item (EligibleProductId: {item.EligibleProductId}, CampaignId: {item.CampaignId})" });
                }
                decimal price = eligibleProduct.CampaignProduct.BasePrice;
                int pointCost = eligibleProduct.PointCost;
                totalAmount += price * item.Quantity;
                totalPoints += pointCost * item.Quantity;
                campaignId = item.CampaignId; // All items should have same campaignId
            }
        }

        var order = new TempOrderPoints
        {
            OrderNumber = orderNumber,
            ResellerId = resellerId.Value,
            CampaignId = campaignId,
            Date = DateTime.UtcNow,
            Status = "Pending",
            TotalAmount = totalAmount,
            Points = totalPoints,
            TotalPointsEarned = totalPoints,
            ShippingAddress = request.ShippingAddress,
            Notes = request.Notes
        };

        _context.TempOrderPoints.Add(order);
        await _context.SaveChangesAsync();

        await _campaignPointsService.UpdateCampaignPoints(order.CampaignId, resellerId.Value);

        return Ok(new
        {
            success = true,
            message = "Order created successfully",
            order = new
            {
                id = order.Id,
                orderNumber = order.OrderNumber,
                resellerId = order.ResellerId,
                campaignId = order.CampaignId,
                totalAmount = order.TotalAmount,
                points = order.Points,
                totalPointsEarned = order.TotalPointsEarned,
                status = order.Status,
                shippingAddress = order.ShippingAddress,
                notes = order.Notes,
                orderDate = order.Date,
                approvedAt = order.ApprovedAt,
                shippedAt = order.ShippedAt,
                deliveredAt = order.DeliveredAt
            }
        });
    }
    catch (Exception ex)
    {
        Console.WriteLine($"Error creating order: {ex.Message}");
        return StatusCode(500, new { message = "Error creating order", error = ex.Message });
    }
}

        // GET: api/reseller/order/campaign/{campaignId}/products
        [HttpGet("campaign/{campaignId}/products")]
        public async Task<ActionResult<IEnumerable<object>>> GetCampaignProducts(int campaignId)
        {
            var resellerId = GetCurrentUserId();
            if (resellerId == null)
                return Unauthorized();

            try
            {
                // Check if reseller is assigned to this campaign
                var assignment = await _context.CampaignResellers
                    .FirstOrDefaultAsync(cr => cr.CampaignId == campaignId && cr.ResellerId == resellerId);
                if (assignment == null || !assignment.IsApproved)
                    return BadRequest(new { message = "You are not assigned to this campaign or not approved" });

                var eligibleProducts = await _context.CampaignEligibleProducts
                    .Include(cep => cep.CampaignProduct)
                    .Where(cep => cep.CampaignId == campaignId && cep.IsActive)
                    .Select(cep => new
                    {
                        eligibleProductId = cep.Id,
                        productId = cep.CampaignProductId,
                        name = cep.CampaignProduct.Name,
                        category = cep.CampaignProduct.Category,
                        sku = cep.CampaignProduct.SKU,
                        brand = cep.CampaignProduct.Brand,
                        basePrice = cep.CampaignProduct.BasePrice,
                        pointsPerUnit = cep.CampaignProduct.PointsPerUnit,
                        pointCost = cep.PointCost,
                        redemptionLimit = cep.RedemptionLimit,
                        isActive = cep.IsActive
                    })
                    .ToListAsync();

                return Ok(eligibleProducts);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error getting campaign products: {ex.Message}");
                return StatusCode(500, new { message = "Error getting campaign products", error = ex.Message });
            }
        }

        // GET: api/reseller/order/campaign/{campaignId}/details
        [HttpGet("campaign/{campaignId}/details")]
        public async Task<ActionResult<object>> GetCampaignDetails(int campaignId)
        {
            var resellerId = GetCurrentUserId();
            if (resellerId == null)
                return Unauthorized();

            // Get detailed campaign information
            var campaign = await _context.Campaigns
                .Include(c => c.Manufacturer)
                .Include(c => c.EligibleProducts)
                .Include(c => c.VoucherProducts)
                .Where(c => c.Id == campaignId && c.IsActive)
                .Select(c => new
                {
                    id = c.Id,
                    name = c.Name,
                    productType = c.ProductType,
                    startDate = c.StartDate,
                    endDate = c.EndDate,
                    description = c.Description,
                    isActive = c.IsActive,
                    createdAt = c.CreatedAt,
                    // Voucher settings
                    voucherGenerationThreshold = c.VoucherGenerationThreshold,
                    voucherValue = c.VoucherValue,
                    voucherValidityDays = c.VoucherValidityDays,
                    // Campaign products
                    eligibleProducts = c.EligibleProducts.Select(ep => new
                    {
                        id = ep.Id,
                        campaignProductId = ep.CampaignProductId,
                        pointCost = ep.PointCost,
                        redemptionLimit = ep.RedemptionLimit,
                        isActive = ep.IsActive
                    }).ToList(),
                    voucherProducts = c.VoucherProducts.Select(vp => new
                    {
                        id = vp.Id,
                        productId = vp.ProductId,
                        voucherValue = vp.VoucherValue,
                        isActive = vp.IsActive
                    }).ToList(),
                    manufacturer = new
                    {
                        id = c.Manufacturer.Id,
                        name = c.Manufacturer.Name,
                        businessName = c.Manufacturer.BusinessName,
                        email = c.Manufacturer.Email
                    }
                })
                .FirstOrDefaultAsync();

            if (campaign == null)
                return NotFound("Campaign not found");

            // Get reward tiers for this campaign
            var rewardTiers = await _context.RewardTiers
                .Where(rt => rt.CampaignId == campaignId)
                .Select(rt => new
                {
                    id = rt.Id,
                    threshold = rt.Threshold,
                    reward = rt.Reward
                })
                .ToListAsync();

            // Get reseller assignment status
            var assignment = await _context.CampaignResellers
                .Where(cr => cr.CampaignId == campaignId && cr.ResellerId == resellerId)
                .Select(cr => new
                {
                    isApproved = cr.IsApproved,
                    assignedAt = cr.CreatedAt,
                    totalPointsEarned = cr.TotalPointsEarned,
                    totalOrderValue = cr.TotalOrderValue,
                    totalVouchersGenerated = cr.TotalVouchersGenerated,
                    totalVoucherValueGenerated = cr.TotalVoucherValueGenerated,
                    pointsUsedForVouchers = cr.PointsUsedForVouchers,
                    lastVoucherGeneratedAt = cr.LastVoucherGeneratedAt
                })
                .FirstOrDefaultAsync();

            // Get reseller's orders for this campaign
            var orders = await _context.TempOrderPoints
                .Where(o => o.CampaignId == campaignId && o.ResellerId == resellerId)
                .OrderByDescending(o => o.Date)
                .Select(o => new
                {
                    id = o.Id,
                    orderNumber = o.OrderNumber,
                    totalAmount = o.TotalAmount,
                    totalPointsEarned = o.TotalPointsEarned,
                    status = o.Status,
                    orderDate = o.Date
                })
                .ToListAsync();

            var campaignWithDetails = new
            {
                campaign.id,
                campaign.name,
                campaign.productType,
                campaign.startDate,
                campaign.endDate,
                campaign.description,
                campaign.isActive,
                campaign.createdAt,
                campaign.voucherGenerationThreshold,
                campaign.voucherValue,
                campaign.voucherValidityDays,
                campaign.eligibleProducts,
                campaign.voucherProducts,
                campaign.manufacturer,
                rewardTiers = rewardTiers,
                assignment = assignment,
                orders = orders
            };

            return Ok(campaignWithDetails);
        }

        // POST: api/reseller/order/campaign/{campaignId}/generate-voucher
        [HttpPost("campaign/{campaignId}/generate-voucher")]
        public async Task<ActionResult<object>> GenerateVoucher(int campaignId)
        {
            var resellerId = GetCurrentUserId();
            if (resellerId == null)
                return Unauthorized();

            try
            {
                // Check if campaign exists and is active
                var campaign = await _context.Campaigns.FindAsync(campaignId);
                if (campaign == null || !campaign.IsActive)
                    return BadRequest(new { message = "Campaign not found or inactive" });

                // Check if reseller is assigned to this campaign
                var assignment = await _context.CampaignResellers
                    .FirstOrDefaultAsync(cr => cr.CampaignId == campaignId && cr.ResellerId == resellerId);
                if (assignment == null || !assignment.IsApproved)
                    return BadRequest(new { message = "You are not assigned to this campaign or not approved" });

                // Check if campaign has voucher settings configured
                if (!campaign.VoucherGenerationThreshold.HasValue || !campaign.VoucherValue.HasValue)
                    return BadRequest(new { message = "Voucher generation is not configured for this campaign" });

                // Get current campaign points
                var campaignPoints = await _campaignPointsService.GetCampaignPoints(campaignId, resellerId.Value);
                if (campaignPoints == null)
                    return NotFound(new { message = "Campaign points not found" });

                // Check if enough points are available
                if (campaignPoints.AvailablePoints < campaign.VoucherGenerationThreshold.Value)
                {
                    return BadRequest(new
                    {
                        message = "Insufficient points to generate voucher",
                        required = campaign.VoucherGenerationThreshold.Value,
                        available = campaignPoints.AvailablePoints,
                    });
                }

                // Calculate how many vouchers can be generated
                int vouchersToGenerate = campaignPoints.AvailablePoints / campaign.VoucherGenerationThreshold.Value;
                int pointsToUse = vouchersToGenerate * campaign.VoucherGenerationThreshold.Value;

                // Generate vouchers
                var generatedVouchers = new List<object>();
                for (int i = 0; i < vouchersToGenerate; i++)
                {
                    var voucherCode = GenerateVoucherCode();
                    // Generate 8-character uppercase hex string
                    var random = new Random();
                    var hex = random.Next(0x10000000, 0x7FFFFFFF).ToString("X8");
                    var qrCode = $"QR-{voucherCode}-{hex}";
                    var voucher = new Voucher
                    {
                        VoucherCode = voucherCode,
                        QrCode = qrCode, // Set QRCode field to the required format
                        Value = campaign.VoucherValue.Value,
                        CampaignId = campaignId,
                        ResellerId = resellerId.Value,
                        ExpiryDate = DateTime.UtcNow.AddDays(campaign.VoucherValidityDays ?? 90),
                        CreatedAt = DateTime.UtcNow,
                        PointsRequired = campaign.VoucherGenerationThreshold ?? 0
                    };

                    _context.Vouchers.Add(voucher);
                    generatedVouchers.Add(new
                    {
                        voucherCode = voucher.VoucherCode,
                        qrCode = voucher.QrCode,
                        value = voucher.Value,
                        expiryDate = voucher.ExpiryDate,
                        pointsRequired = voucher.PointsRequired
                    });
                }

                // Update CampaignPoints
                campaignPoints.PointsUsedForVouchers += pointsToUse;
                campaignPoints.AvailablePoints = campaignPoints.TotalPointsEarned - campaignPoints.PointsUsedForVouchers;
                campaignPoints.TotalVouchersGenerated += vouchersToGenerate;
                campaignPoints.TotalVoucherValueGenerated += vouchersToGenerate * campaign.VoucherValue.Value;
                campaignPoints.LastVoucherGeneratedAt = DateTime.UtcNow;
                campaignPoints.UpdatedAt = DateTime.UtcNow;

                await _context.SaveChangesAsync();

                return Ok(new
                {
                    success = true,
                    message = $"Successfully generated {vouchersToGenerate} voucher(s)",
                    voucherDetails = new
                    {
                        vouchersGenerated = vouchersToGenerate,
                        pointsUsed = pointsToUse,
                        totalValue = vouchersToGenerate * campaign.VoucherValue.Value,
                        voucherValue = campaign.VoucherValue.Value,
                        validityDays = campaign.VoucherValidityDays ?? 90
                    },
                    generatedVouchers = generatedVouchers,
                    campaignPoints = new
                    {
                        campaignId = campaignPoints.CampaignId,
                        campaignName = campaignPoints.Campaign?.Name,
                        totalPointsEarned = campaignPoints.TotalPointsEarned,
                        pointsUsedForVouchers = campaignPoints.PointsUsedForVouchers,
                        availablePoints = campaignPoints.AvailablePoints,
                        totalVouchersGenerated = campaignPoints.TotalVouchersGenerated,
                        totalVoucherValueGenerated = campaignPoints.TotalVoucherValueGenerated,
                        lastVoucherGeneratedAt = campaignPoints.LastVoucherGeneratedAt
                    }
                });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error generating voucher: {ex.Message}");
                return StatusCode(500, new { message = "Error generating voucher", error = ex.Message });
            }
        }

        // GET: api/reseller/order/campaign/{campaignId}/voucher-info
        [HttpGet("campaign/{campaignId}/voucher-info")]
        public async Task<ActionResult<object>> GetVoucherInfo(int campaignId)
        {
            var resellerId = GetCurrentUserId();
            if (resellerId == null)
                return Unauthorized();

            try
            {
                // Check if campaign exists and is active
                var campaign = await _context.Campaigns.FindAsync(campaignId);
                if (campaign == null || !campaign.IsActive)
                    return BadRequest(new { message = "Campaign not found or inactive" });

                // Check if reseller is assigned to this campaign
                var assignment = await _context.CampaignResellers
                    .FirstOrDefaultAsync(cr => cr.CampaignId == campaignId && cr.ResellerId == resellerId);
                if (assignment == null || !assignment.IsApproved)
                    return BadRequest(new { message = "You are not assigned to this campaign or not approved" });

                // Get current campaign points
                var campaignPoints = await _campaignPointsService.GetCampaignPoints(campaignId, resellerId.Value);

                // Calculate voucher generation info
                var canGenerateVouchers = false;
                var vouchersCanGenerate = 0;
                var pointsNeeded = 0;

                if (campaign.VoucherGenerationThreshold.HasValue && campaign.VoucherValue.HasValue && campaignPoints != null)
                {
                    vouchersCanGenerate = campaignPoints.AvailablePoints / campaign.VoucherGenerationThreshold.Value;
                    canGenerateVouchers = vouchersCanGenerate > 0;
                    pointsNeeded = campaign.VoucherGenerationThreshold.Value - (campaignPoints.AvailablePoints % campaign.VoucherGenerationThreshold.Value);
                    if (pointsNeeded == campaign.VoucherGenerationThreshold.Value)
                        pointsNeeded = 0; // Can generate at least one voucher
                }

                return Ok(new
                {
                    campaign = new
                    {
                        id = campaign.Id,
                        name = campaign.Name,
                        description = campaign.Description,
                        manufacturer = campaign.Manufacturer?.Name
                    },
                    voucherSettings = new
                    {
                        threshold = campaign.VoucherGenerationThreshold,
                        value = campaign.VoucherValue,
                        validityDays = campaign.VoucherValidityDays ?? 90,
                        isConfigured = campaign.VoucherGenerationThreshold.HasValue && campaign.VoucherValue.HasValue
                    },
                    currentStatus = campaignPoints != null ? new
                    {
                        totalPointsEarned = campaignPoints.TotalPointsEarned,
                        pointsUsedForVouchers = campaignPoints.PointsUsedForVouchers,
                        availablePoints = campaignPoints.AvailablePoints,
                        totalVouchersGenerated = campaignPoints.TotalVouchersGenerated,
                        totalVoucherValueGenerated = campaignPoints.TotalVoucherValueGenerated
                    } : null,
                    voucherGeneration = new
                    {
                        canGenerate = canGenerateVouchers,
                        vouchersCanGenerate = vouchersCanGenerate,
                        pointsNeeded = pointsNeeded,
                        nextVoucherValue = campaign.VoucherValue ?? 0
                    }
                });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error getting voucher info: {ex.Message}");
                return StatusCode(500, new { message = "Error getting voucher information", error = ex.Message });
            }
        }

        // POST: api/reseller/order/sync-campaign-points
        [HttpPost("sync-campaign-points")]
        public async Task<ActionResult<object>> SyncAllCampaignPoints()
        {
            var resellerId = GetCurrentUserId();
            if (resellerId == null)
                return Unauthorized();

            try
            {
                // Get all campaigns this reseller is assigned to
                var assignedCampaigns = await _context.CampaignResellers
                    .Where(cr => cr.ResellerId == resellerId && cr.IsApproved)
                    .Select(cr => cr.CampaignId)
                    .ToListAsync();

                var results = new List<object>();
                int totalCampaignsUpdated = 0;

                foreach (var campaignId in assignedCampaigns)
                {
                    var success = await _campaignPointsService.UpdateCampaignPoints(campaignId, resellerId.Value);
                    if (success)
                    {
                        totalCampaignsUpdated++;
                        var campaignPoints = await _campaignPointsService.GetCampaignPoints(campaignId, resellerId.Value);
                        if (campaignPoints != null)
                        {
                            results.Add(new
                            {
                                campaignId = campaignId,
                                campaignName = campaignPoints.Campaign?.Name,
                                totalPointsEarned = campaignPoints.TotalPointsEarned,
                                availablePoints = campaignPoints.AvailablePoints,
                                totalOrders = campaignPoints.TotalOrders,
                                totalOrderValue = campaignPoints.TotalOrderValue
                            });
                        }
                    }
                }

                return Ok(new
                {
                    success = true,
                    message = $"Successfully synced points for {totalCampaignsUpdated} campaigns",
                    totalCampaignsUpdated,
                    campaigns = results
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error syncing campaign points", error = ex.Message });
            }
        }

        // POST: api/reseller/order/calculate-points
        [HttpPost("calculate-points")]
        public async Task<ActionResult<object>> CalculateAndUpdatePoints()
        {
            var resellerId = GetCurrentUserId();
            if (resellerId == null)
                return Unauthorized();

            try
            {
                // Get all orders for this reseller

                var allOrders = await _context.TempOrderPoints
                    .Where(o => o.ResellerId == resellerId)
                    .ToListAsync();

                if (!allOrders.Any())
                {
                    return Ok(new
                    {
                        success = true,
                        message = "No orders found for this reseller",
                        totalOrdersUpdated = 0,
                        totalPointsCalculated = 0,
                        ordersUpdated = new List<object>()
                    });
                }

                int totalOrdersUpdated = 0;
                int totalPointsCalculated = 0;
                var updatedOrders = new List<object>();
                var campaignIds = new HashSet<int>();

                foreach (var order in allOrders)
                {
                    // For TempOrderPoints, just use the stored points
                    int orderPoints = order.TotalPointsEarned;
                    totalPointsCalculated += orderPoints;
                    totalOrdersUpdated++;
                    campaignIds.Add(order.CampaignId);
                    updatedOrders.Add(new
                    {
                        orderId = order.Id,
                        orderNumber = order.OrderNumber,
                        pointsCalculated = orderPoints,
                        campaignId = order.CampaignId,
                        campaignName = order.Campaign?.Name
                    });
                }

                // Save all changes
                await _context.SaveChangesAsync();

                // Update campaign points for all affected campaigns
                foreach (var campaignId in campaignIds)
                {
                    await _campaignPointsService.UpdateCampaignPoints(campaignId, resellerId.Value);
                }

                return Ok(new
                {
                    success = true,
                    message = $"Successfully calculated points for {totalOrdersUpdated} orders",
                    totalOrdersUpdated,
                    totalPointsCalculated,
                    campaignsUpdated = campaignIds.Count,
                    ordersUpdated = updatedOrders
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error calculating points", error = ex.Message });
            }
        }

        // GET: api/reseller/order/suggestions
        [HttpGet("suggestions")]
        public async Task<ActionResult<object>> GetOrderSuggestions()
        {
            var resellerId = GetCurrentUserId();
            if (resellerId == null)
                return Unauthorized();

            try
            {
                // Get approved campaigns for this reseller
                var approvedCampaigns = await _context.CampaignResellers
                    .Include(cr => cr.Campaign)
                    .ThenInclude(c => c.Manufacturer)
                    .Where(cr => cr.ResellerId == resellerId && cr.IsApproved && cr.Campaign.IsActive)
                    .Select(cr => cr.Campaign)
                    .ToListAsync();

                var suggestions = new List<object>();

                foreach (var campaign in approvedCampaigns)
                {
                    // Get products for this campaign's manufacturer
                    var products = await _context.Products
                        .Where(p => p.ManufacturerId == campaign.ManufacturerId && p.IsActive)
                        .Take(3) // Limit to 3 products per campaign
                        .ToListAsync();

                    foreach (var product in products)
                    {
                        // Generate suggestion based on product points and value
                        var suggestedQuantity = Math.Max(1, Math.Min(10, 1000 / (product.PointsPerUnit * 10 + 1)));
                        var totalValue = suggestedQuantity * product.ResellerPrice;
                        var totalPoints = suggestedQuantity * product.PointsPerUnit;

                        suggestions.Add(new
                        {
                            campaign = new
                            {
                                id = campaign.Id,
                                name = campaign.Name,
                                description = campaign.Description,
                                manufacturer = new
                                {
                                    id = campaign.Manufacturer.Id,
                                    name = campaign.Manufacturer.Name,
                                    businessName = campaign.Manufacturer.BusinessName
                                }
                            },
                            product = new
                            {
                                id = product.Id,
                                name = product.Name,
                                description = product.Description,
                                brand = product.Brand,
                                category = product.Category,
                                pointsPerUnit = product.PointsPerUnit,
                                resellerPrice = product.ResellerPrice
                            },
                            suggestion = new
                            {
                                suggestedQuantity,
                                totalValue,
                                totalPoints,
                                benefit = $"Earn {totalPoints} points with ₹{totalValue} order",
                                recommendation = $"Order {suggestedQuantity} units of {product.Name} to maximize points earning"
                            }
                        });
                    }
                }

                return Ok(new
                {
                    suggestions,
                    totalSuggestions = suggestions.Count,
                    message = "Order suggestions based on your approved campaigns"
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error generating suggestions", error = ex.Message });
            }
        }

        // GET: api/reseller/order/points
        [HttpGet("points")]
        public async Task<ActionResult<object>> GetPoints()
        {
            try
            {
                var resellerId = GetCurrentUserId();
                Console.WriteLine($"GetPoints called - ResellerId: {resellerId}");
                
                if (resellerId == null)
                    return Unauthorized(new { message = "User not authenticated" });

                var reseller = await _context.Users.FindAsync(resellerId!.Value);
                if (reseller == null)
                    return NotFound(new { message = "Reseller not found" });

                Console.WriteLine($"Reseller found: {reseller.Name}");

                // Get campaign-specific points for this reseller
                var campaignPoints = await _campaignPointsService.GetResellerCampaignPoints(resellerId.Value);
                Console.WriteLine($"Campaign points found: {campaignPoints.Count}");

                // If no campaign points exist, create them from orders
                if (!campaignPoints.Any())
                {
                    Console.WriteLine("No campaign points found, creating from orders...");
                    var orders = await _context.TempOrderPoints
                        .Where(o => o.ResellerId == resellerId.Value)
                        .Select(o => o.CampaignId)
                        .Distinct()
                        .ToListAsync();

                    foreach (var campaignId in orders)
                    {
                        await _campaignPointsService.UpdateCampaignPoints(campaignId, resellerId.Value);
                    }

                    // Get campaign points again
                    campaignPoints = await _campaignPointsService.GetResellerCampaignPoints(resellerId.Value);
                    Console.WriteLine($"Campaign points after creation: {campaignPoints.Count}");
                }

                // Calculate totals across all campaigns
                var totalPointsEarned = campaignPoints.Sum(cp => cp.TotalPointsEarned);
                var totalPointsUsed = campaignPoints.Sum(cp => cp.PointsUsedForVouchers);
                var totalAvailablePoints = campaignPoints.Sum(cp => cp.AvailablePoints);
                var totalOrderValue = campaignPoints.Sum(cp => cp.TotalOrderValue);
                var totalOrders = campaignPoints.Sum(cp => cp.TotalOrders);
                var totalVouchersGenerated = campaignPoints.Sum(cp => cp.TotalVouchersGenerated);
                var totalVoucherValueGenerated = campaignPoints.Sum(cp => cp.TotalVoucherValueGenerated);

                Console.WriteLine($"Calculated totals - Points: {totalPointsEarned}, Available: {totalAvailablePoints}");

                return Ok(new
                {
                    summary = new
                    {
                        totalPointsEarned,
                        totalPointsUsed,
                        totalAvailablePoints,
                        totalOrderValue,
                        totalOrders,
                        totalVouchersGenerated,
                        totalVoucherValueGenerated
                    },
                    campaignPoints = campaignPoints.Select(cp => new
                    {
                        campaignId = cp.CampaignId,
                        campaignName = cp.Campaign?.Name,
                        totalPointsEarned = cp.TotalPointsEarned,
                        pointsUsedForVouchers = cp.PointsUsedForVouchers,
                        availablePoints = cp.AvailablePoints,
                        totalOrderValue = cp.TotalOrderValue,
                        totalOrders = cp.TotalOrders,
                        totalVouchersGenerated = cp.TotalVouchersGenerated,
                        totalVoucherValueGenerated = cp.TotalVoucherValueGenerated,
                        lastVoucherGeneratedAt = cp.LastVoucherGeneratedAt,
                        lastUpdated = cp.UpdatedAt ?? cp.CreatedAt
                    }).ToList()
                });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error in GetPoints: {ex.Message}");
                Console.WriteLine($"Stack trace: {ex.StackTrace}");
                return StatusCode(500, new { message = "Error loading points data", error = ex.Message });
            }
        }

        // GET: api/reseller/order/public-test
        [HttpGet("public-test")]
        [AllowAnonymous]
        public async Task<ActionResult<object>> PublicTest()
        {
            try
            {
                // Test database connection
                var resellerCount = await _context.Users.Where(u => u.Role == "reseller").CountAsync();
                var campaignCount = await _context.Campaigns.CountAsync();
                var orderCount = await _context.TempOrderPoints.CountAsync();
                var campaignPointsCount = await _context.CampaignPoints.CountAsync();

                return Ok(new
                {
                    success = true,
                    message = "Public test endpoint working",
                    databaseStats = new
                    {
                        resellerCount,
                        campaignCount,
                        orderCount,
                        campaignPointsCount
                    },
                    timestamp = DateTime.UtcNow
                });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error in PublicTest: {ex.Message}");
                return StatusCode(500, new { message = "Error in public test", error = ex.Message });
            }
        }

        // GET: api/reseller/order/test-points
        [HttpGet("test-points")]
        public async Task<ActionResult<object>> TestPoints()
        {
            try
            {
                var resellerId = GetCurrentUserId();
                if (resellerId == null)
                    return Unauthorized(new { message = "User not authenticated", resellerId = resellerId });

                // Test database connection
                var reseller = await _context.Users.FindAsync(resellerId.Value);
                if (reseller == null)
                    return NotFound(new { message = "Reseller not found", resellerId = resellerId });

                // Test campaign points
                var campaignPoints = await _context.CampaignPoints
                    .Include(cp => cp.Campaign)
                    .Where(cp => cp.ResellerId == resellerId.Value)
                    .ToListAsync();

                // Test orders
                var orders = await _context.TempOrderPoints
                    .Where(o => o.ResellerId == resellerId.Value)
                    .ToListAsync();

                return Ok(new
                {
                    success = true,
                    resellerId = resellerId.Value,
                    resellerName = reseller.Name,
                    campaignPointsCount = campaignPoints.Count,
                    ordersCount = orders.Count,
                    campaignPoints = campaignPoints.Select(cp => new
                    {
                        campaignId = cp.CampaignId,
                        campaignName = cp.Campaign?.Name,
                        totalPointsEarned = cp.TotalPointsEarned,
                        availablePoints = cp.AvailablePoints
                    }).ToList(),
                    orders = orders.Select(o => new
                    {
                        orderId = o.Id,
                        orderNumber = o.OrderNumber,
                        totalPointsEarned = o.TotalPointsEarned,
                        totalAmount = o.TotalAmount
                    }).ToList()
                });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error in TestPoints: {ex.Message}");
                Console.WriteLine($"Stack trace: {ex.StackTrace}");
                return StatusCode(500, new { message = "Error in test endpoint", error = ex.Message });
            }
        }

        private int? GetCurrentUserId()
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            return userIdClaim != null ? int.Parse(userIdClaim) : null;
        }

        private string GenerateVoucherCode()
        {
            const string chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
            var random = new Random();
            return new string(Enumerable.Repeat(chars, 8).Select(s => s[random.Next(s.Length)]).ToArray());
        }
    }
} 