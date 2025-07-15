using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace backend.Models
{
    public class Product
    {
        [Key]
        public int Id { get; set; }

        [Required]
        [StringLength(255)]
        public string Name { get; set; } = string.Empty;

        [StringLength(1000)]
        public string? Description { get; set; }

        [Required]
        [StringLength(100)]
        public string Category { get; set; } = string.Empty;

        [StringLength(50)]
        public string? SKU { get; set; }

        [StringLength(100)]
        public string? Brand { get; set; }

        [Column(TypeName = "decimal(18,2)")]
        public decimal BasePrice { get; set; }

        [Column(TypeName = "decimal(18,2)")]
        public decimal ResellerPrice { get; set; }

        [Column(TypeName = "decimal(18,2)")]
        public decimal RetailPrice { get; set; }

        public int PointsPerUnit { get; set; } = 0;

        public bool IsActive { get; set; } = true;

        [Required]
        public int? ManufacturerId { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        
        public DateTime? UpdatedAt { get; set; }

        // Navigation properties
        [ForeignKey("ManufacturerId")]
        public virtual User? Manufacturer { get; set; }
    }
} 