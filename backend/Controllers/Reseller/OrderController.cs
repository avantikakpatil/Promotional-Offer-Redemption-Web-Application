using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using backend.Data;
using backend.Models;
using backend.Models.DTOs;
using backend.Services;
using System.Security.Claims;

namespace backend.Controllers.Reseller
{
    [ApiController]
    [Route("api/reseller/[controller]")]
    public class OrderController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public OrderController(ApplicationDbContext context)
        {
            _context = context;
        }

        // GET: api/reseller/order
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Order>>> GetOrders()
        {
            var resellerId = GetCurrentUserId();
            if (resellerId == null)
                return Unauthorized();

            var orders = await _context.Orders
                .Include(o => o.Campaign)
                .Include(o => o.OrderItems)
                    .ThenInclude(oi => oi.Product)
                .Where(o => o.ResellerId == resellerId)
                .OrderByDescending(o => o.OrderDate)
                .ToListAsync();

            return Ok(orders);
        }

        // GET: api/reseller/order/{id}
        [HttpGet("{id}")]
        public async Task<ActionResult<Order>> GetOrder(int id)
        {
            var resellerId = GetCurrentUserId();
            if (resellerId == null)
                return Unauthorized();

            var order = await _context.Orders
                .Include(o => o.Campaign)
                .Include(o => o.OrderItems)
                    .ThenInclude(oi => oi.Product)
                .FirstOrDefaultAsync(o => o.Id == id && o.ResellerId == resellerId!.Value);

            if (order == null)
                return NotFound();

            return Ok(order);
        }

        // POST: api/reseller/order
        [HttpPost]
        public async Task<ActionResult<Order>> CreateOrder(CreateOrderDto createOrderDto)
        {
            var resellerId = GetCurrentUserId();
            if (resellerId == null)
                return Unauthorized();

            // Validate campaign exists and reseller is assigned
            var campaignReseller = await _context.CampaignResellers
                .Include(cr => cr.Campaign)
                .FirstOrDefaultAsync(cr => cr.CampaignId == createOrderDto.CampaignId && 
                                         cr.ResellerId == resellerId!.Value && 
                                         cr.IsApproved);

            if (campaignReseller == null)
                return BadRequest("Campaign not found or not approved for this reseller");

            // Generate order number
            var orderNumber = $"ORD-{DateTime.UtcNow:yyyyMMdd}-{Guid.NewGuid().ToString().Substring(0, 8).ToUpper()}";

            var order = new Order
            {
                OrderNumber = orderNumber,
                ResellerId = resellerId!.Value,
                CampaignId = createOrderDto.CampaignId,
                Status = "pending",
                ShippingAddress = createOrderDto.ShippingAddress,
                Notes = createOrderDto.Notes,
                TotalAmount = 0,
                TotalPointsEarned = 0
            };

            _context.Orders.Add(order);
            await _context.SaveChangesAsync();

            // Add order items
            decimal totalAmount = 0;
            int totalPoints = 0;

            foreach (var itemDto in createOrderDto.Items)
            {
                var product = await _context.Products
                    .FirstOrDefaultAsync(p => p.Id == itemDto.ProductId && p.IsActive);

                if (product == null)
                    continue;

                var orderItem = new OrderItem
                {
                    OrderId = order.Id,
                    ProductId = itemDto.ProductId,
                    Quantity = itemDto.Quantity,
                    UnitPrice = product.ResellerPrice,
                    TotalPrice = product.ResellerPrice * itemDto.Quantity,
                    PointsEarned = product.PointsPerUnit * itemDto.Quantity
                };

                _context.OrderItems.Add(orderItem);

                totalAmount += orderItem.TotalPrice;
                totalPoints += orderItem.PointsEarned ?? 0;
            }

            // Update order totals
            order.TotalAmount = totalAmount;
            order.TotalPointsEarned = totalPoints;

            // Update reseller points
            var reseller = await _context.Users.FindAsync(resellerId!.Value);
            if (reseller != null)
            {
                reseller.Points += totalPoints;
                // Remove UserPoints table update
            }

            // Update campaign reseller totals
            campaignReseller.TotalOrderValue += totalAmount;
            campaignReseller.TotalPointsEarned += totalPoints;
            campaignReseller.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            // Check for automatic voucher generation
            try
            {
                var voucherGenerationService = HttpContext.RequestServices.GetRequiredService<IVoucherGenerationService>();
                await voucherGenerationService.GenerateVouchersForResellerAsync(resellerId!.Value, createOrderDto.CampaignId);
            }
            catch (Exception ex)
            {
                // Log error but don't fail the order creation
                var logger = HttpContext.RequestServices.GetRequiredService<ILogger<OrderController>>();
                logger.LogError(ex, "Error in automatic voucher generation for reseller {ResellerId} in campaign {CampaignId}", resellerId, createOrderDto.CampaignId);
            }

            return CreatedAtAction(nameof(GetOrder), new { id = order.Id }, order);
        }

        // GET: api/reseller/order/available-campaigns
        [HttpGet("available-campaigns")]
        public async Task<ActionResult<IEnumerable<object>>> GetAvailableCampaigns()
        {
            var resellerId = GetCurrentUserId();
            if (resellerId == null)
                return Unauthorized();

            // Get all active campaigns with manufacturer information
            var allCampaigns = await _context.Campaigns
                .Include(c => c.Manufacturer)
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
                    manufacturer = new
                    {
                        id = c.Manufacturer.Id,
                        name = c.Manufacturer.Name,
                        businessName = c.Manufacturer.BusinessName
                    }
                })
                .ToListAsync();

            return Ok(allCampaigns);
        }

        // GET: api/reseller/order/campaign/{campaignId}/products
        [HttpGet("campaign/{campaignId}/products")]
        public async Task<ActionResult<IEnumerable<Product>>> GetCampaignProducts(int campaignId)
        {
            var resellerId = GetCurrentUserId();
            if (resellerId == null)
                return Unauthorized();

            // Check if reseller is approved for this campaign
            var campaignReseller = await _context.CampaignResellers
                .FirstOrDefaultAsync(cr => cr.CampaignId == campaignId && 
                                         cr.ResellerId == resellerId && 
                                         cr.IsApproved);

            if (campaignReseller == null)
                return BadRequest("Campaign not found or not approved for this reseller");

            var campaign = await _context.Campaigns.FindAsync(campaignId);
            if (campaign == null)
                return NotFound();

            var products = await _context.Products
                .Where(p => p.ManufacturerId == campaign.ManufacturerId && p.IsActive)
                .ToListAsync();

            return Ok(products);
        }

        // GET: api/reseller/order/points
        [HttpGet("points")]
        public async Task<ActionResult<object>> GetPoints()
        {
            var resellerId = GetCurrentUserId();
            if (resellerId == null)
                return Unauthorized();

            var reseller = await _context.Users.FindAsync(resellerId!.Value);
            if (reseller == null)
                return NotFound();

            var totalOrders = await _context.Orders
                .Where(o => o.ResellerId == resellerId)
                .CountAsync();

            var totalOrderValue = await _context.Orders
                .Where(o => o.ResellerId == resellerId)
                .SumAsync(o => o.TotalAmount);

            return Ok(new
            {
                CurrentPoints = reseller.Points,
                TotalOrders = totalOrders,
                TotalOrderValue = totalOrderValue
            });
        }

        private int? GetCurrentUserId()
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            return userIdClaim != null ? int.Parse(userIdClaim) : null;
        }
    }
} 