using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using backend.Data;
using backend.Models;
using backend.Models.DTOs;
using System.Security.Claims;

namespace backend.Controllers.Manufacturer
{
    [ApiController]
    [Route("api/manufacturer/[controller]")]
    public class ProductController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public ProductController(ApplicationDbContext context)
        {
            _context = context;
        }

        // GET: api/manufacturer/product
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Product>>> GetProducts()
        {
            var manufacturerId = GetCurrentUserId();
            if (manufacturerId == null)
                return Unauthorized();

            var products = await _context.Products
                .Where(p => p.ManufacturerId == manufacturerId)
                .OrderByDescending(p => p.CreatedAt)
                .ToListAsync();

            return Ok(products);
        }

        // GET: api/manufacturer/product/{id}
        [HttpGet("{id}")]
        public async Task<ActionResult<Product>> GetProduct(int id)
        {
            var manufacturerId = GetCurrentUserId();
            if (manufacturerId == null)
                return Unauthorized();

            var product = await _context.Products
                .FirstOrDefaultAsync(p => p.Id == id && p.ManufacturerId == manufacturerId);

            if (product == null)
                return NotFound();

            return Ok(product);
        }

        // POST: api/manufacturer/product
        [HttpPost]
        public async Task<ActionResult<Product>> CreateProduct(CreateProductDto createProductDto)
        {
            var manufacturerId = GetCurrentUserId();
            if (manufacturerId == null)
                return Unauthorized();

            var product = new Product
            {
                Name = createProductDto.Name,
                Description = createProductDto.Description,
                Category = createProductDto.Category,
                SKU = createProductDto.SKU,
                Brand = createProductDto.Brand,
                BasePrice = createProductDto.BasePrice,
                ResellerPrice = createProductDto.ResellerPrice,
                RetailPrice = createProductDto.RetailPrice,
                PointsPerUnit = createProductDto.PointsPerUnit,
                ManufacturerId = manufacturerId.Value,
                IsActive = true
            };

            _context.Products.Add(product);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetProduct), new { id = product.Id }, product);
        }

        // PUT: api/manufacturer/product/{id}
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateProduct(int id, CreateProductDto updateProductDto)
        {
            var manufacturerId = GetCurrentUserId();
            if (manufacturerId == null)
                return Unauthorized();

            var product = await _context.Products
                .FirstOrDefaultAsync(p => p.Id == id && p.ManufacturerId == manufacturerId);

            if (product == null)
                return NotFound();

            product.Name = updateProductDto.Name;
            product.Description = updateProductDto.Description;
            product.Category = updateProductDto.Category;
            product.SKU = updateProductDto.SKU;
            product.Brand = updateProductDto.Brand;
            product.BasePrice = updateProductDto.BasePrice;
            product.ResellerPrice = updateProductDto.ResellerPrice;
            product.RetailPrice = updateProductDto.RetailPrice;
            product.PointsPerUnit = updateProductDto.PointsPerUnit;
            product.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            return NoContent();
        }

        // DELETE: api/manufacturer/product/{id}
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteProduct(int id)
        {
            var manufacturerId = GetCurrentUserId();
            if (manufacturerId == null)
                return Unauthorized();

            var product = await _context.Products
                .FirstOrDefaultAsync(p => p.Id == id && p.ManufacturerId == manufacturerId);

            if (product == null)
                return NotFound();

            product.IsActive = false;
            product.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            return NoContent();
        }

        // GET: api/manufacturer/product/categories
        [HttpGet("categories")]
        public async Task<ActionResult<IEnumerable<string>>> GetCategories()
        {
            var manufacturerId = GetCurrentUserId();
            if (manufacturerId == null)
                return Unauthorized();

            var categories = await _context.Products
                .Where(p => p.ManufacturerId == manufacturerId && p.IsActive)
                .Select(p => p.Category)
                .Distinct()
                .ToListAsync();

            return Ok(categories);
        }

        private int? GetCurrentUserId()
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            return userIdClaim != null ? int.Parse(userIdClaim) : null;
        }
    }
} 