
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using backend.Data;
using backend.Models;
using backend.Services;
using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;

namespace backend.Controllers.Manufacturer
{
    [ApiController]
    [Route("api/manufacturer/orders")]
    [Authorize(Roles = "manufacturer")]
    public class OrderManagementController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly INotificationService _notificationService;

        public OrderManagementController(ApplicationDbContext context, INotificationService notificationService)
        {
            _context = context;
            _notificationService = notificationService;
        }

        // GET: api/manufacturer/orders
        [HttpGet]
        public async Task<ActionResult<IEnumerable<object>>> GetOrders()
        {
            var manufacturerId = GetCurrentUserId();
            if (manufacturerId == null)
                return Unauthorized();

            var orders = await _context.TempOrderPoints
                .Include(o => o.Reseller)
                .Include(o => o.Campaign)
                .Where(o => o.Campaign.ManufacturerId == manufacturerId)
                .OrderByDescending(o => o.Date)
                .Select(o => new
                {
                    id = o.Id,
                    date = o.Date,
                    resellerName = o.Reseller.Name,
                    campaignName = o.Campaign.Name,
                    points = o.Points,
                    orderNumber = o.OrderNumber,
                    status = o.Status,
                    totalAmount = o.TotalAmount,
                })
                .ToListAsync();

            return Ok(orders);
        }

        // PUT: api/manufacturer/orders/{id}/status
        [HttpPut("{id}/status")]
        public async Task<IActionResult> UpdateOrderStatus(int id, [FromBody] UpdateOrderStatusRequest request)
        {
            var manufacturerId = GetCurrentUserId();
            if (manufacturerId == null)
                return Unauthorized();

            var order = await _context.TempOrderPoints
                .Include(o => o.Campaign)
                .FirstOrDefaultAsync(o => o.Id == id && o.Campaign.ManufacturerId == manufacturerId);

            if (order == null)
                return NotFound();

            order.Status = request.Status;

            switch (request.Status.ToLower())
            {
                case "approved":
                    order.ApprovedAt = DateTime.UtcNow;
                    break;
                case "shipped":
                    order.ShippedAt = DateTime.UtcNow;
                    break;
                case "delivered":
                    order.DeliveredAt = DateTime.UtcNow;
                    break;
            }

            await _context.SaveChangesAsync();

            // Notify the reseller
            var message = $"The status of your order {order.OrderNumber} has been updated to {order.Status}.";
            await _notificationService.CreateNotificationAsync(order.ResellerId, message);

            return Ok(new { message = "Order status updated successfully" });
        }

        private int? GetCurrentUserId()
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            return userIdClaim != null ? int.Parse(userIdClaim) : null;
        }
    }

    public class UpdateOrderStatusRequest
    {
        public string Status { get; set; }
    }
}
