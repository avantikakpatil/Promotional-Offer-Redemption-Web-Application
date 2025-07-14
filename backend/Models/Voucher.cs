using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace backend.Models
{
    public class Voucher
    {
        [Key]
        public int Id { get; set; }

        [Required]
        [StringLength(50)]
        public string VoucherCode { get; set; } = string.Empty;

        [Required]
        public int ResellerId { get; set; }

        [Required]
        public int CampaignId { get; set; }

        [Column(TypeName = "decimal(18,2)")]
        public decimal Value { get; set; }

        public int PointsRequired { get; set; }

        [StringLength(500)]
        public string? EligibleProducts { get; set; } // JSON array of product IDs

        public bool IsRedeemed { get; set; } = false;

        public DateTime? RedeemedAt { get; set; }

        public int? RedeemedByShopkeeperId { get; set; }

        public DateTime ExpiryDate { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // Navigation properties
        [ForeignKey("ResellerId")]
        public virtual User? Reseller { get; set; }
        
        [ForeignKey("CampaignId")]
        public virtual Campaign? Campaign { get; set; }
        
        [ForeignKey("RedeemedByShopkeeperId")]
        public virtual User? RedeemedByShopkeeper { get; set; }
    }
} 