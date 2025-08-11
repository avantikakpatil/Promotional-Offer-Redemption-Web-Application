using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace backend.Models
{
    public class CampaignEligibleProduct
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public int CampaignId { get; set; }

        [Required]
        public int CampaignProductId { get; set; }

        [Required]
        public int PointCost { get; set; }

        public int? RedemptionLimit { get; set; }

        public bool IsActive { get; set; } = true;

        // Free product reward configuration (optional, per eligible product)
        public int? MinPurchaseQuantity { get; set; }

        public int? FreeProductId { get; set; }

        public int? FreeProductQty { get; set; }

        // Navigation properties
        [ForeignKey("CampaignId")]
        public virtual Campaign? Campaign { get; set; }

        [ForeignKey("CampaignProductId")]
        public virtual CampaignProduct? CampaignProduct { get; set; }

        [ForeignKey("FreeProductId")]
        public virtual Product? FreeProduct { get; set; }
    }
} 