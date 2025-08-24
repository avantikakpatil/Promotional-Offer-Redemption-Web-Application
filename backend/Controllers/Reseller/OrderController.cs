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
        private readonly INotificationService _notificationService;
        private readonly ICampaignPointsService _campaignPointsService;

        public OrderController(
    ApplicationDbContext context, 
    ICampaignPointsService campaignPointsService,
    INotificationService notificationService) // Add this parameter
{
    _context = context;
    _campaignPointsService = campaignPointsService;
    _notificationService = notificationService; // Add this assignment
}

        // POST: api/reseller/order/campaign/{campaignId}/purge-free-product-vouchers?resellerId=3
        [HttpPost("campaign/{campaignId}/purge-free-product-vouchers")]
        public async Task<IActionResult> PurgeFreeProductVouchers(int campaignId, [FromQuery] int? resellerId)
        {
            var currentUserId = GetCurrentUserId();
            if (currentUserId == null && resellerId == null)
                return Unauthorized();

            var targetResellerId = resellerId ?? currentUserId!.Value;

            var toDelete = await _context.FreeProductVouchers
                .Where(v => v.CampaignId == campaignId && v.ResellerId == targetResellerId)
                .ToListAsync();

            if (toDelete.Count == 0)
                return Ok(new { success = true, deleted = 0, message = "No free product vouchers to delete" });

            _context.FreeProductVouchers.RemoveRange(toDelete);
            await _context.SaveChangesAsync();

            return Ok(new { success = true, deleted = toDelete.Count, campaignId, resellerId = targetResellerId });
        }

            // GET: api/reseller/free-product-vouchers?resellerId=123
            [HttpGet("/api/reseller/free-product-vouchers")]
            public async Task<IActionResult> GetFreeProductVouchers([FromQuery] int resellerId)
            {
                            var vouchers = await _context.FreeProductVouchers
                .Where(v => v.ResellerId == resellerId)
                .OrderByDescending(v => v.CreatedAt)
                .Select(v => new
                {
                    v.Id,
                    v.CampaignId,
                    v.FreeProductId,
                    v.EligibleProductId,
                    v.FreeProductQty,
                    v.Message,
                    v.CreatedAt,
                    Campaign = new { v.Campaign.Name },
                    FreeProduct = _context.Products
                        .Where(p => p.Id == v.FreeProductId)
                        .Select(p => new { p.Name, p.SKU })
                        .FirstOrDefault(),
                    EligibleProduct = _context.Products
                        .Where(p => p.Id == v.EligibleProductId)
                        .Select(p => new { p.Name, p.SKU })
                        .FirstOrDefault()
                })
                .ToListAsync();
                return Ok(new { success = true, freeProductVouchers = vouchers });
            }
        // GET: api/reseller/order
        [HttpGet]
        public async Task<ActionResult<IEnumerable<object>>> GetOrders()
        {
            var resellerId = GetCurrentUserId();
            if (resellerId == null)
                return Unauthorized();

                        var orders = await _context.TempOrderPoints
                .Include(o => o.Campaign)
                    .ThenInclude(c => c.Manufacturer)
                .Include(o => o.Items)
                    .ThenInclude(oi => oi.Product)
                .Where(o => o.ResellerId == resellerId)
                .OrderByDescending(o => o.Date)
                .Select(o => new
                {
                    id = o.Id,
                    orderDate = o.Date, // Renamed to orderDate for frontend consistency
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
                    deliveredAt = o.DeliveredAt,
                    campaign = new
                    {
                        id = o.Campaign.Id,
                        name = o.Campaign.Name,
                        manufacturer = new
                        {
                            id = o.Campaign.Manufacturer.Id,
                            name = o.Campaign.Manufacturer.Name
                        }
                    },
                    orderItems = o.Items.Select(oi => new
                    {
                        id = oi.Id,
                        productId = oi.ProductId,
                        productName = oi.Product.Name,
                        quantity = oi.Quantity
                    }).ToList()
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
                .Include(c => c.FreeProductRewards)
                    .ThenInclude(fpr => fpr.Product)
                .Where(c => c.IsActive)
                .Select(c => new
                {
                    id = c.Id,
                    name = c.Name,
                    productType = c.ProductType,
                    rewardType = c.RewardType,
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
                    freeProductRewards = c.FreeProductRewards.Select(fpr => new
                    {
                        id = fpr.Id,
                        productId = fpr.ProductId,
                        quantity = fpr.Quantity,
                        isActive = fpr.IsActive,
                        product = new
                        {
                            id = fpr.Product.Id,
                            name = fpr.Product.Name,
                            sku = fpr.Product.SKU
                        }
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
                c.rewardType,
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
                c.freeProductRewards,
                c.manufacturer,
                c.assignment,
                rewardTiers = rewardTiers.Where(rt => rt.campaignId == c.id).ToList()
            });

            // Check for campaigns ending soon and send notification
foreach (var campaign in allCampaigns)
{
    if (campaign.isActive)
    {
        var daysUntilEnd = (campaign.endDate - DateTime.UtcNow).TotalDays;
        if (daysUntilEnd > 0 && daysUntilEnd <= 7) // Campaign ends within 7 days
        {
            var message = $"The campaign '{campaign.name}' is ending soon! It will end on {campaign.endDate.ToShortDateString()}. Don't miss out!";
            await _notificationService.CreateNotificationAsync(resellerId.Value, message);
        }
    }
}

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
                    .Where(cep => cep.IsActive && cep.Campaign != null && cep.Campaign.IsActive && cep.CampaignProduct != null)
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

            // Log the incoming request for debugging
            Console.WriteLine($"CreateOrder request received: {System.Text.Json.JsonSerializer.Serialize(request)}");

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

                // Log calculated totals
                Console.WriteLine($"Calculated totals - Amount: {totalAmount}, Points: {totalPoints}");

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

                // Save order items
                if (request.Items != null && request.Items.Count > 0)
                {
                    foreach (var item in request.Items)
                    {
                        var eligibleProduct = await _context.CampaignEligibleProducts
                            .Include(ep => ep.CampaignProduct)
                            .FirstOrDefaultAsync(ep => ep.Id == item.EligibleProductId && ep.CampaignId == item.CampaignId);
                        if (eligibleProduct == null || eligibleProduct.CampaignProduct == null)
                        {
                            continue; // Already validated above, skip here
                        }
                        var orderItem = new TempOrderPointsItem
                        {
                            TempOrderPointsId = order.Id,
                            ProductId = eligibleProduct.CampaignProductId,
                            EligibleProductId = eligibleProduct.Id,
                            Quantity = item.Quantity
                        };
                        _context.TempOrderPointsItems.Add(orderItem);
                    }
                    await _context.SaveChangesAsync();
                }

                       await _campaignPointsService.UpdateCampaignPoints(order.CampaignId, resellerId.Value);

                // Create a notification for the reseller
                var campaign = await _context.Campaigns.Include(c => c.EligibleProducts).FirstOrDefaultAsync(c => c.Id == order.CampaignId);
                if (campaign != null)
                {
                    var message = $"You have successfully placed an order for the campaign '{campaign.Name}'.";
                    await _notificationService.CreateNotificationAsync(resellerId.Value, message);

                    if (campaign.RewardType == "free_product")
                    {
                        foreach (var item in request.Items)
                        {
                            var eligibleProduct = campaign.EligibleProducts.FirstOrDefault(ep => ep.Id == item.EligibleProductId);
                            if (eligibleProduct != null && eligibleProduct.FreeProductId.HasValue && eligibleProduct.MinPurchaseQuantity.HasValue && eligibleProduct.FreeProductQty.HasValue)
                            {
                                var campaignProduct = await _context.CampaignProducts.FindAsync(eligibleProduct.CampaignProductId);
                                if (campaignProduct != null)
                                {
                                    var totalUnitsPurchased = await _context.TempOrderPointsItems
                                        .Where(i => i.EligibleProductId == item.EligibleProductId)
                                        .Join(_context.TempOrderPoints,
                                              i => i.TempOrderPointsId,
                                              o => o.Id,
                                              (i, o) => new { item = i, order = o })
                                        .Where(x => x.order.ResellerId == resellerId.Value && x.order.CampaignId == campaign.Id)
                                        .SumAsync(x => x.item.Quantity);

                                    var minPurchaseQty = eligibleProduct.MinPurchaseQuantity.Value;
                                    var remainingQty = minPurchaseQty - (totalUnitsPurchased % minPurchaseQty);
                                    if (remainingQty > 0)
                                    {
                                        var freeProduct = await _context.Products.FindAsync(eligibleProduct.FreeProductId.Value);
                                        if (freeProduct != null)
                                        {
                                            var notificationMessage = $"You have ordered {totalUnitsPurchased} {campaignProduct.Name}. Order {remainingQty} more by {campaign.EndDate:yyyy-MM-dd} to receive a free {freeProduct.Name}.";
                                            await _notificationService.CreateNotificationAsync(resellerId.Value, notificationMessage);
                                        }
                                    }
                                }
                            }
                        }
                    }
                }


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
                Console.WriteLine($"Error creating order: {ex.ToString()}");
                return StatusCode(500, new { message = "An unexpected error occurred while creating the order.", error = ex.Message, details = ex.ToString() });
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
                // Relaxed policy: allow all resellers to view voucher info for any active campaign
                // (no assignment/approval check)

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
                    rewardType = c.RewardType,
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
                rewardType = campaign.rewardType,
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
                var campaign = await _context.Campaigns
                    .Include(c => c.EligibleProducts)
                    .Include(c => c.FreeProductRewards)
                        .ThenInclude(fpr => fpr.Product)
                    .FirstOrDefaultAsync(c => c.Id == campaignId);
                if (campaign == null || !campaign.IsActive)
                    return BadRequest(new { message = "Campaign not found or inactive" });

                // Relaxed policy: allow voucher generation for all resellers on any active campaign
                // (no assignment/approval check)

                                // Handle voucher campaigns
                if (campaign.RewardType == "voucher" || campaign.RewardType == "voucher_restricted")
                {
                    // Force-enable voucher generation for all campaigns
                    var threshold = campaign.VoucherGenerationThreshold ?? 50; // Default 50 points
                    var value = campaign.VoucherValue ?? 100; // Default ₹100
                    var validityDays = campaign.VoucherValidityDays ?? 90;

                    // Get current campaign points
                    var campaignPoints = await _campaignPointsService.GetCampaignPoints(campaignId, resellerId.Value);
                    if (campaignPoints == null)
                        return NotFound(new { message = "Campaign points not found" });

                    // Check if enough points are available
                    if (campaignPoints.AvailablePoints < threshold)
                    {
                        return BadRequest(new
                        {
                            message = "Insufficient points to generate voucher",
                            required = threshold,
                            available = campaignPoints.AvailablePoints,
                        });
                    }

                    // Check if there are enough points to generate at least one voucher
                    if (campaignPoints.AvailablePoints < threshold)
                    {
                        return BadRequest(new
                        {
                            message = "Insufficient points to generate voucher",
                            required = threshold,
                            available = campaignPoints.AvailablePoints,
                        });
                    }

                    // Calculate how many vouchers can be generated
                    int vouchersToGenerate = campaignPoints.AvailablePoints / threshold;
                    int pointsToUse = vouchersToGenerate * threshold;

                    // Generate vouchers
                    var generatedVouchers = new List<object>();
                    for (int i = 0; i < vouchersToGenerate; i++)
                    {
                        var voucherCode = GenerateVoucherCode();
                        var random = new Random();
                        var hex = random.Next(0x10000000, 0x7FFFFFFF).ToString("X8");
                        var qrCode = $"QR-{voucherCode}-{hex}";
                        var voucher = new Voucher
                        {
                            VoucherCode = voucherCode,
                            QrCode = qrCode,
                            Value = value,
                            CampaignId = campaignId,
                            ResellerId = resellerId.Value,
                            ExpiryDate = DateTime.UtcNow.AddDays(validityDays),
                            CreatedAt = DateTime.UtcNow,
                            PointsRequired = threshold
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
                    campaignPoints.TotalVoucherValueGenerated += vouchersToGenerate * value;
                    campaignPoints.LastVoucherGeneratedAt = DateTime.UtcNow;
                    campaignPoints.UpdatedAt = DateTime.UtcNow;

                    await _context.SaveChangesAsync();

                    // Notify the reseller
                    var message = $"You have successfully generated {vouchersToGenerate} voucher(s) for the campaign '{campaign.Name}'.";
                    await _notificationService.CreateNotificationAsync(resellerId.Value, message);

                    return Ok(new
                    {
                        success = true,
                        message = $"Successfully generated {vouchersToGenerate} voucher(s)",
                        voucherDetails = new
                        {
                            vouchersGenerated = vouchersToGenerate,
                            pointsUsed = pointsToUse,
                            totalValue = vouchersToGenerate * value,
                            voucherValue = value,
                            validityDays = validityDays
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

                // Handle free product campaigns
                if (campaign.RewardType == "free_product")
                {
                    // Find eligible products with free product rewards configured per eligible product
                    var eligibleProducts = campaign.EligibleProducts
                        .Where(ep => ep.IsActive && ep.FreeProductId.HasValue && ep.MinPurchaseQuantity.HasValue && ep.FreeProductQty.HasValue)
                        .ToList();
                    if (!eligibleProducts.Any())
                        return BadRequest(new { message = "No eligible products with free product rewards configured for this campaign" });

                    // Check if reseller has any order items under this campaign
                    var hasQualifyingOrders = await _context.TempOrderPointsItems
                        .Where(i => i.TempOrderPoints.ResellerId == resellerId.Value && i.TempOrderPoints.CampaignId == campaignId)
                        .AnyAsync();
                    if (!hasQualifyingOrders)
                        return BadRequest(new { message = "You need to place orders for this campaign to qualify for free products" });

                    var generatedFreeProductRewards = new List<object>();
                    int totalFreeProductsGiven = 0;

                    foreach (var ep in eligibleProducts)
                    {
                        // Total units purchased for this eligible product by reseller in this campaign
                        var totalUnitsPurchased = await _context.TempOrderPointsItems
                            .Where(i => i.EligibleProductId == ep.Id)
                            .Join(_context.TempOrderPoints,
                                  item => item.TempOrderPointsId,
                                  order => order.Id,
                                  (item, order) => new { item, order })
                            .Where(x => x.order.ResellerId == resellerId.Value && x.order.CampaignId == campaignId)
                            .SumAsync(x => x.item.Quantity);

                        int minPurchaseQty = ep.MinPurchaseQuantity ?? 0;
                        int freeProductQty = ep.FreeProductQty ?? 0;
                        if (minPurchaseQty <= 0 || freeProductQty <= 0)
                            continue;

                        // Total free products earned so far based on all orders to date
                        int totalFreeEarned = (totalUnitsPurchased / minPurchaseQty) * freeProductQty;

                        // Subtract already issued free products for this eligible product to avoid duplicates
                        int alreadyIssued = await _context.FreeProductVouchers
                            .Where(v => v.ResellerId == resellerId.Value
                                     && v.CampaignId == campaignId
                                     && v.FreeProductId == ep.FreeProductId
                                     && v.EligibleProductId == ep.CampaignProductId)
                            .SumAsync(v => (int?)v.FreeProductQty) ?? 0;

                        int freeProductsToGive = totalFreeEarned - alreadyIssued;

                        if (freeProductsToGive > 0 && ep.FreeProductId.HasValue)
                        {
                            var fpVoucher = new FreeProductVoucher
                            {
                                ResellerId = resellerId.Value,
                                CampaignId = campaignId,
                                FreeProductId = ep.FreeProductId.Value,
                                // Store the eligible product reference; use CampaignProductId as before
                                EligibleProductId = ep.CampaignProductId,
                                FreeProductQty = freeProductsToGive,
                                Message = $"You have earned {totalFreeEarned} free product(s) for ordering {totalUnitsPurchased} units. Previously issued: {alreadyIssued}. Issuing now: {freeProductsToGive}. Reward: {freeProductQty} free product(s) for every {minPurchaseQty} units.",
                                CreatedAt = DateTime.UtcNow
                            };
                            _context.FreeProductVouchers.Add(fpVoucher);
                            generatedFreeProductRewards.Add(new
                            {
                                freeProductId = ep.FreeProductId,
                                freeProductQty = freeProductsToGive,
                                eligibleProductId = ep.CampaignProductId,
                                minPurchaseQuantity = minPurchaseQty,
                                message = fpVoucher.Message,
                                totalUnitsPurchased,
                                totalFreeEarned,
                                alreadyIssued
                            });
                            totalFreeProductsGiven += freeProductsToGive;
                        }
                    }

                    await _context.SaveChangesAsync();

                    // Notify the reseller about free products earned
                    if (totalFreeProductsGiven > 0)
                    {
                        var message = $"Congratulations! You have earned {totalFreeProductsGiven} free product(s) from the campaign '{campaign.Name}'. Check your free product vouchers.";
                        await _notificationService.CreateNotificationAsync(resellerId.Value, message);
                    }

                    return Ok(new
                    {
                        success = true,
                        message = $"Calculated {totalFreeProductsGiven} free product(s) earned",
                        voucherDetails = new
                        {
                            totalFreeProductsGiven = totalFreeProductsGiven,
                            freeProductRewards = generatedFreeProductRewards
                        }
                    });
                }

                return BadRequest(new { message = "Unsupported campaign reward type" });
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
                var campaign = await _context.Campaigns
                    .Include(c => c.FreeProductRewards)
                        .ThenInclude(fpr => fpr.Product)
                    .FirstOrDefaultAsync(c => c.Id == campaignId);
                if (campaign == null || !campaign.IsActive)
                    return BadRequest(new { message = "Campaign not found or inactive" });

                // Check if reseller is assigned to this campaign
                var assignment = await _context.CampaignResellers
                    .FirstOrDefaultAsync(cr => cr.CampaignId == campaignId && cr.ResellerId == resellerId);
                if (assignment == null || !assignment.IsApproved)
                    return BadRequest(new { message = "You are not assigned to this campaign or not approved" });

                                // Handle different campaign types
                if (campaign.RewardType == "voucher" || campaign.RewardType == "voucher_restricted")
                {
                    // Get current campaign points for voucher campaigns
                    var campaignPoints = await _campaignPointsService.GetCampaignPoints(campaignId, resellerId.Value);

                    // Always report voucher generation as configured, use defaults if missing
                    var threshold = campaign.VoucherGenerationThreshold ?? 50;
                    var value = campaign.VoucherValue ?? 100;
                    var validityDays = campaign.VoucherValidityDays ?? 90;

                    var canGenerateVouchers = false;
                    var vouchersCanGenerate = 0;
                    var pointsNeeded = 0;

                    if (campaignPoints != null)
                    {
                        vouchersCanGenerate = campaignPoints.AvailablePoints / threshold;
                        canGenerateVouchers = vouchersCanGenerate > 0;
                        pointsNeeded = threshold - (campaignPoints.AvailablePoints % threshold);
                        if (pointsNeeded == threshold)
                            pointsNeeded = 0;
                    }

                    return Ok(new
                    {
                        campaign = new
                        {
                            id = campaign.Id,
                            name = campaign.Name,
                            description = campaign.Description,
                            rewardType = campaign.RewardType,
                            manufacturer = campaign.Manufacturer?.Name
                        },
                        voucherSettings = new
                        {
                            threshold = threshold,
                            value = value,
                            validityDays = validityDays,
                            isConfigured = true // Always true
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
                            nextVoucherValue = value
                        }
                    });
                }
                else if (campaign.RewardType == "free_product")
                {
                    // Ensure we have eligible products loaded with campaign product details
                    await _context.Entry(campaign)
                        .Collection(c => c.EligibleProducts)
                        .Query()
                        .Include(ep => ep.CampaignProduct)
                        .LoadAsync();

                    var rules = campaign.EligibleProducts
                        .Where(ep => ep.IsActive && ep.FreeProductId.HasValue && ep.MinPurchaseQuantity.HasValue && ep.FreeProductQty.HasValue)
                        .ToList();

                    var ruleDtos = new List<object>();
                    int totalCanGenerateNow = 0;
                    int totalOrderedQuantityAll = 0;

                    foreach (var ep in rules)
                    {
                        // Units purchased for this eligible product by this reseller in this campaign
                        var totalUnitsPurchased = await _context.TempOrderPointsItems
                            .Where(i => i.EligibleProductId == ep.Id)
                            .Join(_context.TempOrderPoints,
                                  item => item.TempOrderPointsId,
                                  order => order.Id,
                                  (item, order) => new { item, order })
                            .Where(x => x.order.ResellerId == resellerId.Value && x.order.CampaignId == campaignId)
                            .SumAsync(x => x.item.Quantity);

                        totalOrderedQuantityAll += totalUnitsPurchased;

                        int minQty = ep.MinPurchaseQuantity ?? 0;
                        int freeQty = ep.FreeProductQty ?? 0;
                        int earned = (minQty > 0) ? (totalUnitsPurchased / minQty) * freeQty : 0;

                        int alreadyIssued = await _context.FreeProductVouchers
                            .Where(v => v.ResellerId == resellerId.Value
                                     && v.CampaignId == campaignId
                                     && v.FreeProductId == ep.FreeProductId
                                     && v.EligibleProductId == ep.CampaignProductId)
                            .SumAsync(v => (int?)v.FreeProductQty) ?? 0;

                        int toGiveNow = Math.Max(0, earned - alreadyIssued);
                        totalCanGenerateNow += toGiveNow;

                        // Load free product details
                        var freeProduct = await _context.Products.FirstOrDefaultAsync(p => p.Id == ep.FreeProductId);

                        ruleDtos.Add(new
                        {
                            eligibleProduct = new
                            {
                                id = ep.CampaignProductId,
                                name = ep.CampaignProduct?.Name,
                                sku = ep.CampaignProduct?.SKU
                            },
                            freeProduct = new
                            {
                                id = ep.FreeProductId,
                                name = freeProduct?.Name,
                                sku = freeProduct?.SKU
                            },
                            minPurchaseQuantity = minQty,
                            freeProductQty = freeQty,
                            totalUnitsPurchased,
                            freeProductsEarned = earned,
                            alreadyIssued,
                            freeProductsToGive = toGiveNow
                        });
                    }

                    return Ok(new
                    {
                        campaign = new
                        {
                            id = campaign.Id,
                            name = campaign.Name,
                            description = campaign.Description,
                            rewardType = campaign.RewardType,
                            manufacturer = campaign.Manufacturer?.Name
                        },
                        freeProductSettings = new
                        {
                            rules = ruleDtos,
                            isConfigured = rules.Any()
                        },
                        currentStatus = new
                        {
                            totalQuantityOrdered = totalOrderedQuantityAll,
                            freeProductsEarned = ruleDtos.Sum(r => (int)r.GetType().GetProperty("freeProductsEarned").GetValue(r) ),
                            totalFreeProductVouchersGenerated = await _context.FreeProductVouchers.Where(v => v.CampaignId == campaignId && v.ResellerId == resellerId.Value).SumAsync(v => (int?)v.FreeProductQty) ?? 0
                        },
                        voucherGeneration = new
                        {
                            canGenerate = totalCanGenerateNow > 0,
                            vouchersCanGenerate = totalCanGenerateNow,
                            pointsNeeded = 0,
                            nextVoucherValue = 0
                        }
                    });
                }

                return BadRequest(new { message = "Unsupported campaign reward type" });
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
                    .Where(cr => cr.ResellerId == resellerId && cr.IsApproved && cr.Campaign != null && cr.Campaign.IsActive)
                    .Select(cr => cr.Campaign)
                    .ToListAsync();

                var suggestions = new List<object>();

                foreach (var campaign in approvedCampaigns)
                {
                    // Get products for this campaign's manufacturer
                    var products = await _context.Products
                        .Where(p => campaign != null && p.ManufacturerId == campaign.ManufacturerId && p.IsActive)
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
                                id = campaign != null ? campaign.Id : 0,
                                name = campaign != null ? campaign.Name : string.Empty,
                                description = campaign != null ? campaign.Description : string.Empty,
                                manufacturer = new
                                {
                                    id = (campaign != null && campaign.Manufacturer != null) ? campaign.Manufacturer.Id : 0,
                                    name = (campaign != null && campaign.Manufacturer != null) ? campaign.Manufacturer.Name : string.Empty,
                                    businessName = (campaign != null && campaign.Manufacturer != null) ? campaign.Manufacturer.BusinessName : string.Empty
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

                // Check for low points and send notification
                foreach (var cp in campaignPoints)
                {
                    if (cp.Campaign != null && cp.Campaign.VoucherGenerationThreshold.HasValue)
                    {
                        var threshold = cp.Campaign.VoucherGenerationThreshold.Value;
                        var lowPointThreshold = (int)(threshold * 0.2); // 20% of the voucher generation threshold

                        if (cp.AvailablePoints > 0 && cp.AvailablePoints <= lowPointThreshold)
                        {
                            var message = $"Your points for campaign '{cp.Campaign.Name}' are running low ({cp.AvailablePoints} points). Order more to earn {threshold - cp.AvailablePoints} points and generate a voucher!";
                            await _notificationService.CreateNotificationAsync(resellerId.Value, message);
                        }
                    }
                }

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

        // GET: api/reseller/order/redemption-history
        [HttpGet("redemption-history")]
        public async Task<ActionResult<IEnumerable<RedemptionHistory>>> GetRedemptionHistory()
        {
            var resellerId = GetCurrentUserId();
            if (resellerId == null)
                return Unauthorized();

            var history = await _context.RedemptionHistories
                .Include(rh => rh.Shopkeeper)
                .Include(rh => rh.Voucher)
                .Include(rh => rh.Campaign)
                .Where(rh => rh.ResellerId == resellerId)
                .OrderByDescending(rh => rh.RedeemedAt)
                .Select(rh => new
                {
                    rh.Id,
                    rh.UserId,
                    rh.QRCode,
                    rh.Points,
                    rh.RedeemedAt,
                    rh.ResellerId,
                    rh.ShopkeeperId,
                    rh.VoucherId,
                    rh.RedeemedProducts,
                    rh.RedemptionValue,
                    rh.RedemptionType,
                    rh.CampaignId,
                    Shopkeeper = rh.Shopkeeper != null ? new { rh.Shopkeeper.Id, rh.Shopkeeper.Name } : null,
                    Voucher = rh.Voucher != null ? new { rh.Voucher.Id, rh.Voucher.VoucherCode } : null,
                    Campaign = rh.Campaign != null ? new { rh.Campaign.Id, rh.Campaign.Name } : null,
                    RedeemedProductDetails = rh.RedeemedProductDetails // Include the deserialized product details
                })
                .ToListAsync();

            return Ok(history);
        }
    }
} 