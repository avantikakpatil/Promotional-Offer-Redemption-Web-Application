using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace backend.Models
{
    public class FreeProductVoucher
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public int ResellerId { get; set; }

        [Required]
        public int CampaignId { get; set; }

        [Required]
        public int FreeProductId { get; set; }

        public int? EligibleProductId { get; set; }

        [Required]
        public int FreeProductQty { get; set; }

        [StringLength(500)]
        public string? Message { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        [ForeignKey("ResellerId")]
        public virtual User? Reseller { get; set; }

        [ForeignKey("CampaignId")]
        public virtual Campaign? Campaign { get; set; }
    }
}
