using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace backend.Models
{
    public class Order
    {
        [Key]
        public int Id { get; set; }

        [Required]
        [StringLength(50)]
        public string OrderNumber { get; set; } = string.Empty;

        [Required]
        public int ResellerId { get; set; }

        [Required]
        public int CampaignId { get; set; }

        [Column(TypeName = "decimal(18,2)")]
        public decimal TotalAmount { get; set; }

        public int TotalPointsEarned { get; set; } = 0;

        [Required]
        [StringLength(50)]
        public string Status { get; set; } = "pending"; // pending, approved, shipped, delivered, cancelled

        [StringLength(500)]
        public string? ShippingAddress { get; set; }

        [StringLength(500)]
        public string? Notes { get; set; }

        public DateTime OrderDate { get; set; } = DateTime.UtcNow;
        
        public DateTime? ApprovedAt { get; set; }
        
        public DateTime? ShippedAt { get; set; }
        
        public DateTime? DeliveredAt { get; set; }

        // Navigation properties
        [ForeignKey("ResellerId")]
        public virtual User? Reseller { get; set; }
        
        [ForeignKey("CampaignId")]
        public virtual Campaign? Campaign { get; set; }
        
        public virtual ICollection<OrderItem> OrderItems { get; set; } = new List<OrderItem>();
    }
} 