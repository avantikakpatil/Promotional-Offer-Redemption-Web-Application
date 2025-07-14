using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace backend.Models
{
    public class RedemptionHistory
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public int UserId { get; set; }
        [ForeignKey("UserId")]
        public User User { get; set; } = null!;

        [Required]
        public string QRCode { get; set; } = string.Empty;

        public int Points { get; set; }
        public DateTime RedeemedAt { get; set; } = DateTime.UtcNow;
        
        // B2B Specific Fields
        public int? ResellerId { get; set; }
        
        public int? ShopkeeperId { get; set; }
        
        public int? VoucherId { get; set; }
        
        [StringLength(500)]
        public string? RedeemedProducts { get; set; } // JSON array of redeemed products
        
        [Column(TypeName = "decimal(18,2)")]
        public decimal? RedemptionValue { get; set; }
        
        [StringLength(100)]
        public string? RedemptionType { get; set; } // "qr_code", "voucher", "points"
        
        public int? CampaignId { get; set; }
        
        // Navigation properties
        [ForeignKey("ResellerId")]
        public virtual User? Reseller { get; set; }
        
        [ForeignKey("ShopkeeperId")]
        public virtual User? Shopkeeper { get; set; }
        
        [ForeignKey("VoucherId")]
        public virtual Voucher? Voucher { get; set; }
        
        [ForeignKey("CampaignId")]
        public virtual Campaign? Campaign { get; set; }
    }
} 