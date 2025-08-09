using Microsoft.AspNetCore.Mvc;
using backend.Data;
using Microsoft.EntityFrameworkCore;
using backend.Models;
using System.Threading.Tasks;
using System;

namespace backend.Controllers.Shopkeeper
{
    [ApiController]
    [Route("api/shopkeeper/products")]

    public class ProductController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        public ProductController(ApplicationDbContext context)
        {
            _context = context;
        }

        // GET: api/shopkeeper/products
        [HttpGet]
        public async Task<IActionResult> GetAllProducts()
        {
            var products = await _context.Products.ToListAsync();
            return Ok(products);
        }

        public class ShopkeeperProductDto
        {
            public string? Name { get; set; }
            public string? Brand { get; set; }
            public decimal? RetailPrice { get; set; }
            public string? Description { get; set; }
            public string? Category { get; set; }
            public int? ManufacturerId { get; set; }
        }

        // POST: api/shopkeeper/products
        [HttpPost]
        public async Task<IActionResult> AddProduct([FromBody] ShopkeeperProductDto dto)
        {
            var product = new Product
            {
                Name = string.IsNullOrWhiteSpace(dto.Name) ? "Untitled Product" : dto.Name!,
                Brand = dto.Brand,
                RetailPrice = dto.RetailPrice ?? 0,
                Description = dto.Description,
                Category = string.IsNullOrWhiteSpace(dto.Category) ? "General" : dto.Category!,
                IsActive = true,
                CreatedAt = DateTime.UtcNow,
                ManufacturerId = dto.ManufacturerId ?? 0
            };

            _context.Products.Add(product);
            await _context.SaveChangesAsync();
            return Ok(new { message = "Product added successfully.", product });
        }
    }
} 