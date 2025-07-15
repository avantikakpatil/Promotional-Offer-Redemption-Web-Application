using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace backend.Models
{
    public class Campaign
    {
        [Key]
        public int Id { get; set; }

        [Required]
        [StringLength(255)]
        public string Name { get; set; } = string.Empty;

        [Required]
        [StringLength(100)]
        public string ProductType { get; set; } = string.Empty;

        [Required]
        public int Points { get; set; }

        [Required]
        public DateTime StartDate { get; set; }

        [Required]
        public DateTime EndDate { get; set; }

        [Required]
        [StringLength(1000)]
        public string Description { get; set; } = string.Empty;

        [Column(TypeName = "decimal(18,2)")]
        public decimal? Budget { get; set; }

        [StringLength(500)]
        public string? TargetAudience { get; set; }

        public bool IsActive { get; set; } = true;

        [Required]
        public int ManufacturerId { get; set; }

        // B2B Specific Fields
        public virtual ICollection<CampaignEligibleProduct> EligibleProducts { get; set; } = new List<CampaignEligibleProduct>();
        
        [Column(TypeName = "decimal(18,2)")]
        public decimal? MinimumOrderValue { get; set; }
        
        [Column(TypeName = "decimal(18,2)")]
        public decimal? MaximumOrderValue { get; set; }
        
        public int? MaxResellersAllowed { get; set; }
        
        public bool RequiresApproval { get; set; } = false;
        
        [StringLength(100)]
        public string? SchemeType { get; set; } // "volume_based", "time_based", "product_specific"

        // Voucher Generation Settings
        public bool EnableAutoVoucherGeneration { get; set; } = false;
        
        public int? VoucherGenerationThreshold { get; set; } // Points required to generate voucher
        
        [Column(TypeName = "decimal(18,2)")]
        public decimal? VoucherValue { get; set; } // Value of generated voucher
        
        public int? VoucherValidityDays { get; set; } = 90; // Default 90 days
        
        [StringLength(500)]
        public string? VoucherEligibleProducts { get; set; } // JSON array of product IDs for voucher
        
        public bool VoucherPointsEqualsMoney { get; set; } = true; // 1 point = ₹1
        
        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }

        // Navigation properties
        public virtual User? Manufacturer { get; set; }
        public virtual ICollection<RewardTier> RewardTiers { get; set; } = new List<RewardTier>();
        public virtual ICollection<CampaignReseller> CampaignResellers { get; set; } = new List<CampaignReseller>();

        public Campaign()
        {
            CreatedAt = DateTime.UtcNow;
        }
    }
}