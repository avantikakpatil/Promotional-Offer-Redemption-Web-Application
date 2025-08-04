using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace backend.Models
{
    public class CampaignPoints
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public int CampaignId { get; set; }

        [Required]
        public int ResellerId { get; set; }

        // Points earned from orders for this specific campaign
        public int TotalPointsEarned { get; set; } = 0;

        // Points used for voucher generation for this specific campaign
        public int PointsUsedForVouchers { get; set; } = 0;

        // Available points for this campaign (TotalPointsEarned - PointsUsedForVouchers)
        public int AvailablePoints { get; set; } = 0;

        // Total order value for this campaign
        [Column(TypeName = "decimal(18,2)")]
        public decimal TotalOrderValue { get; set; } = 0;

        // Number of orders for this campaign
        public int TotalOrders { get; set; } = 0;

        // Voucher generation tracking for this campaign
        public int TotalVouchersGenerated { get; set; } = 0;

        [Column(TypeName = "decimal(18,2)")]
        public decimal TotalVoucherValueGenerated { get; set; } = 0;

        public DateTime? LastVoucherGeneratedAt { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public DateTime? UpdatedAt { get; set; }

        // Navigation properties
        [ForeignKey("CampaignId")]
        public virtual Campaign? Campaign { get; set; }

        [ForeignKey("ResellerId")]
        public virtual User? Reseller { get; set; }
    }
} 