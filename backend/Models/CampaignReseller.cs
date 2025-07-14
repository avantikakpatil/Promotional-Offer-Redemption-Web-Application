using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace backend.Models
{
    public class CampaignReseller
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public int CampaignId { get; set; }

        [Required]
        public int ResellerId { get; set; }

        public bool IsApproved { get; set; } = false;
        
        public DateTime? ApprovedAt { get; set; }
        
        public int? ApprovedByUserId { get; set; }
        
        public int TotalPointsEarned { get; set; } = 0;
        
        public decimal TotalOrderValue { get; set; } = 0;
        
        // Voucher Generation Tracking
        public int PointsUsedForVouchers { get; set; } = 0;
        
        public int TotalVouchersGenerated { get; set; } = 0;
        
        public decimal TotalVoucherValueGenerated { get; set; } = 0;
        
        public DateTime? LastVoucherGeneratedAt { get; set; }
        
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        
        public DateTime? UpdatedAt { get; set; }

        // Navigation properties
        [ForeignKey("CampaignId")]
        public virtual Campaign? Campaign { get; set; }
        
        [ForeignKey("ResellerId")]
        public virtual User? Reseller { get; set; }
        
        [ForeignKey("ApprovedByUserId")]
        public virtual User? ApprovedBy { get; set; }
    }
} 