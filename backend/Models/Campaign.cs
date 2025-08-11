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
        public DateTime StartDate { get; set; }

        [Required]
        public DateTime EndDate { get; set; }

        [Required]
        [StringLength(1000)]
        public string Description { get; set; } = string.Empty;

        public bool IsActive { get; set; } = true;

        [Required]
        public int ManufacturerId { get; set; }

        // Reward type: "voucher" or "free_product"
        [Required]
        [StringLength(20)]
        public string RewardType { get; set; } = "voucher";

        // Free product rewards (if RewardType == "free_product")
        public virtual ICollection<CampaignFreeProductReward> FreeProductRewards { get; set; } = new List<CampaignFreeProductReward>();

        // Voucher Generation Settings
        public int? VoucherGenerationThreshold { get; set; } // Points required to generate voucher
        
        [Column(TypeName = "decimal(18,2)")]
        public decimal? VoucherValue { get; set; } // Value of generated voucher
        
        public int? VoucherValidityDays { get; set; } = 90; // Default 90 days
        
        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }

        // Navigation properties
        public virtual User? Manufacturer { get; set; }
        public virtual ICollection<CampaignEligibleProduct> EligibleProducts { get; set; } = new List<CampaignEligibleProduct>();
        public virtual ICollection<CampaignVoucherProduct> VoucherProducts { get; set; } = new List<CampaignVoucherProduct>();
        public virtual ICollection<CampaignReseller> CampaignResellers { get; set; } = new List<CampaignReseller>();
        public virtual ICollection<RewardTier> RewardTiers { get; set; } = new List<RewardTier>();

        public Campaign()
        {
            CreatedAt = DateTime.UtcNow;
        }
    }
}