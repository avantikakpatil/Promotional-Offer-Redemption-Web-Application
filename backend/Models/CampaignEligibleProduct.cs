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
        public int ProductId { get; set; }

        [Required]
        public int PointCost { get; set; }

        public int? RedemptionLimit { get; set; }

        public bool IsActive { get; set; } = true;

        // Navigation properties
        [ForeignKey("CampaignId")]
        public virtual Campaign? Campaign { get; set; }

        [ForeignKey("ProductId")]
        public virtual Product? Product { get; set; }
    }
} 