using Microsoft.AspNetCore.Mvc;
using backend.Data;
using backend.Models;
using System.Collections.Generic;

namespace backend.Controllers
{
    [ApiController]
    [Route("api/dummy")]
    public class DummyDataController : ControllerBase
    {
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
    }
} 