using Microsoft.AspNetCore.Mvc;
using backend.Data;
using backend.Models;
using backend.Services;
using System.Collections.Generic;
using Microsoft.EntityFrameworkCore;

namespace backend.Controllers
{
    [ApiController]
    [Route("api/dummy")]
    public class DummyDataController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly ICampaignPointsService _campaignPointsService;

        public DummyDataController(ApplicationDbContext context, ICampaignPointsService campaignPointsService)
        {
            _context = context;
            _campaignPointsService = campaignPointsService;
        }

        // GET: api/dummy/categories
        [HttpGet("categories")]
        public ActionResult<IEnumerable<string>> GetCategories()
        {
            return Ok(DummyData.Categories);
        }

        // GET: api/dummy/products
        [HttpGet("products")]
        public ActionResult<IEnumerable<Product>> GetProducts([FromQuery] string? category)
        {
            var products = string.IsNullOrEmpty(category)
                ? DummyData.Products
                : DummyData.Products.FindAll(p => p.Category == category);
            return Ok(products);
        }

        // POST: api/dummy/populate-campaign-products
        [HttpPost("populate-campaign-products")]
        public async Task<IActionResult> PopulateCampaignProducts()
        {
            try
            {
                // Check if campaign products already exist
                var existingCount = await _context.CampaignProducts.CountAsync();
                if (existingCount > 0)
                {
                    return Ok(new { message = $"Campaign products already exist ({existingCount} records)" });
                }

                // Convert DummyData.Products to CampaignProduct entities
                var campaignProducts = DummyData.Products.Select(p => new CampaignProduct
                {
                    Name = p.Name,
                    Category = p.Category,
                    SKU = p.SKU,
                    Brand = p.Brand,
                    BasePrice = p.BasePrice,
                    PointsPerUnit = p.PointsPerUnit,
                    ManufacturerId = p.ManufacturerId ?? 1, // Default to 1 if null
                    CreatedAt = DateTime.UtcNow
                }).ToList();

                // Add to database
                await _context.CampaignProducts.AddRangeAsync(campaignProducts);
                await _context.SaveChangesAsync();

                return Ok(new { 
                    success = true,
                    message = $"Successfully populated {campaignProducts.Count} campaign products",
                    count = campaignProducts.Count
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { 
                    success = false,
                    message = "Error populating campaign products",
                    error = ex.Message 
                });
            }
        }

        // POST: api/dummy/create-dummy-orders
        [HttpPost("create-dummy-orders")]
        public async Task<IActionResult> CreateDummyOrders()
        {
            try
            {
                // Check if orders already exist
                var existingCount = await _context.TempOrderPoints.CountAsync();
                if (existingCount > 0)
                {
                    return Ok(new { message = $"Orders already exist ({existingCount} records)" });
                }

                // Get some campaigns and resellers
                var campaigns = await _context.Campaigns.Take(3).ToListAsync();
                var resellers = await _context.Users.Where(u => u.Role == "reseller").Take(2).ToListAsync();

                if (!campaigns.Any() || !resellers.Any())
                {
                    return BadRequest("Need campaigns and resellers to create dummy orders");
                }

                var orders = new List<TempOrderPoints>();
                var random = new Random();

                // Create 10 dummy orders
                for (int i = 1; i <= 10; i++)
                {
                    var campaign = campaigns[random.Next(campaigns.Count)];
                    var reseller = resellers[random.Next(resellers.Count)];
                    var orderDate = DateTime.UtcNow.AddDays(-random.Next(1, 30));

                    var order = new TempOrderPoints
                    {
                        OrderNumber = $"ORD-{DateTime.Now:yyyyMMdd}-{i:D4}",
                        ResellerId = reseller.Id,
                        CampaignId = campaign.Id,
                        Status = "Dummy",
                        ShippingAddress = $"Dummy Address {i}, City, State",
                        Notes = $"Dummy order {i}",
                        TotalAmount = random.Next(100, 1000),
                        TotalPointsEarned = random.Next(10, 100),
                        Date = orderDate
                    };

                    orders.Add(order);
                }

                await _context.TempOrderPoints.AddRangeAsync(orders);
                await _context.SaveChangesAsync();

                return Ok(new { 
                    success = true,
                    message = $"Successfully created {orders.Count} dummy orders",
                    ordersCount = orders.Count
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { 
                    success = false,
                    message = "Error creating dummy orders",
                    error = ex.Message 
                });
            }
        }

        private string GetRandomStatus()
        {
            var statuses = new[] { "pending", "approved", "shipped", "delivered" };
            var random = new Random();
            return statuses[random.Next(statuses.Length)];
        }

        // GET: api/dummy/campaign-suggestions
        [HttpGet("campaign-suggestions")]
        public async Task<ActionResult<IEnumerable<object>>> GetCampaignSuggestions()
        {
            try
            {
                var campaigns = await _context.Campaigns
                    .Include(c => c.Manufacturer)
                    .Where(c => c.IsActive)
                    .Take(5)
                    .ToListAsync();

                var suggestions = new List<object>();
                var random = new Random();

                foreach (var campaign in campaigns)
                {
                    // Get products for this manufacturer
                    var products = await _context.Products
                        .Where(p => p.ManufacturerId == campaign.ManufacturerId && p.IsActive)
                        .Take(3)
                        .ToListAsync();

                    foreach (var product in products)
                    {
                        var suggestedQuantity = random.Next(1, 6);
                        var totalPoints = product.PointsPerUnit * suggestedQuantity;
                        var totalValue = product.ResellerPrice * suggestedQuantity;

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
                                category = product.Category,
                                brand = product.Brand,
                                pointsPerUnit = product.PointsPerUnit,
                                resellerPrice = product.ResellerPrice
                            },
                            suggestion = new
                            {
                                suggestedQuantity = suggestedQuantity,
                                totalPoints = totalPoints,
                                totalValue = totalValue,
                                benefit = $"Earn {totalPoints} points with ₹{totalValue:N0} order"
                            }
                        });
                    }
                }

                return Ok(suggestions);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { 
                    success = false,
                    message = "Error generating campaign suggestions",
                    error = ex.Message 
                });
            }
        }

        // POST: api/dummy/populate-reward-tiers
        [HttpPost("populate-reward-tiers")]
        public async Task<IActionResult> PopulateRewardTiers()
        {
            try
            {
                // Check if reward tiers already exist
                var existingCount = await _context.RewardTiers.CountAsync();
                if (existingCount > 0)
                {
                    return Ok(new { message = $"Reward tiers already exist ({existingCount} records)" });
                }

                // Get all active campaigns
                var campaigns = await _context.Campaigns.Where(c => c.IsActive).ToListAsync();
                if (!campaigns.Any())
                {
                    return BadRequest(new { message = "No active campaigns found. Please create campaigns first." });
                }

                var rewardTiers = new List<RewardTier>();
                var random = new Random();

                foreach (var campaign in campaigns)
                {
                    // Create 3-5 reward tiers for each campaign
                    var tierCount = random.Next(3, 6);
                    var baseThreshold = 100;

                    for (int i = 0; i < tierCount; i++)
                    {
                        var threshold = baseThreshold * (i + 1);
                        var reward = GetRandomReward(random);

                        rewardTiers.Add(new RewardTier
                        {
                            CampaignId = campaign.Id,
                            Threshold = threshold,
                            Reward = reward,
                            CreatedAt = DateTime.UtcNow
                        });
                    }
                }

                // Add to database
                await _context.RewardTiers.AddRangeAsync(rewardTiers);
                await _context.SaveChangesAsync();

                return Ok(new { 
                    success = true,
                    message = $"Successfully populated {rewardTiers.Count} reward tiers for {campaigns.Count} campaigns",
                    rewardTiersCount = rewardTiers.Count,
                    campaignsCount = campaigns.Count
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { 
                    success = false,
                    message = "Error populating reward tiers",
                    error = ex.Message 
                });
            }
        }

        private string GetRandomReward(Random random)
        {
            var rewards = new[]
            {
                "5% discount on next order",
                "Free shipping on orders above ₹500",
                "10% bonus points on next purchase",
                "Priority customer support",
                "Exclusive product access",
                "Double points on weekend orders",
                "Free gift with purchase",
                "Early access to new products",
                "Special member-only deals",
                "Extended return period"
            };

            return rewards[random.Next(rewards.Length)];
        }

        // POST: api/dummy/create-free-product-vouchers
        [HttpPost("create-free-product-vouchers")]
        public async Task<IActionResult> CreateFreeProductVouchers()
        {
            try
            {
                // Check if free product vouchers already exist
                var existingCount = await _context.FreeProductVouchers.CountAsync();
                if (existingCount > 0)
                {
                    return Ok(new { message = $"Free product vouchers already exist ({existingCount} records)" });
                }

                // Get some campaigns and resellers
                var campaigns = await _context.Campaigns.Take(3).ToListAsync();
                var resellers = await _context.Users.Where(u => u.Role == "reseller").Take(2).ToListAsync();

                if (!campaigns.Any() || !resellers.Any())
                {
                    return BadRequest(new { message = "No campaigns or resellers found. Please create them first." });
                }

                var freeProductVouchers = new List<FreeProductVoucher>();
                var random = new Random();

                foreach (var reseller in resellers)
                {
                    // Create 2-4 free product vouchers for each reseller
                    var voucherCount = random.Next(2, 5);
                    
                    for (int i = 0; i < voucherCount; i++)
                    {
                        var campaign = campaigns[random.Next(campaigns.Count)];
                        var freeProductId = random.Next(1, 13); // Product IDs 1-12
                        var eligibleProductId = random.Next(1, 13); // Product IDs 1-12
                        var quantity = random.Next(1, 4); // 1-3 products

                        var messages = new[]
                        {
                            "Congratulations! You've earned a free product voucher.",
                            "Special reward for your loyalty!",
                            "Enjoy your free product on us!",
                            "Thank you for being a valued customer!",
                            "Here's a little something extra for you!"
                        };

                        freeProductVouchers.Add(new FreeProductVoucher
                        {
                            ResellerId = reseller.Id,
                            CampaignId = campaign.Id,
                            FreeProductId = freeProductId,
                            EligibleProductId = eligibleProductId,
                            FreeProductQty = quantity,
                            Message = messages[random.Next(messages.Length)],
                            CreatedAt = DateTime.UtcNow.AddDays(-random.Next(1, 30)) // Random date within last 30 days
                        });
                    }
                }

                // Add to database
                await _context.FreeProductVouchers.AddRangeAsync(freeProductVouchers);
                await _context.SaveChangesAsync();

                return Ok(new { 
                    success = true,
                    message = $"Successfully created {freeProductVouchers.Count} free product vouchers",
                    count = freeProductVouchers.Count,
                    resellersCount = resellers.Count,
                    campaignsCount = campaigns.Count
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { 
                    success = false,
                    message = "Error creating free product vouchers",
                    error = ex.Message 
                });
            }
        }
    }
} 