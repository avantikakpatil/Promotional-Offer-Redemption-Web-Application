using System;
using System.ComponentModel.DataAnnotations;

namespace backend.Models
{
    public class CampaignProduct
    {
        [Key]
        public int Id { get; set; }
        [Required]
        [StringLength(255)]
        public string Name { get; set; } = string.Empty;
        [StringLength(100)]
        public string Category { get; set; } = string.Empty;
        [StringLength(50)]
        public string? SKU { get; set; }
        [StringLength(100)]
        public string? Brand { get; set; }
        public decimal BasePrice { get; set; }
        public int PointsPerUnit { get; set; }
        public int ManufacturerId { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
} 