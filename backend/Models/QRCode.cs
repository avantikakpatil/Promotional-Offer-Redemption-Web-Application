using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace backend.Models
{
    public class QRCode
    {
        [Key]
        public int Id { get; set; }

        [Required]
        [StringLength(255)]
        public string Code { get; set; } = string.Empty;

        [Required]
        public int CampaignId { get; set; }

        public bool IsRedeemed { get; set; } = false;

        public DateTime? RedeemedAt { get; set; }

        public int Points { get; set; } = 0;
        public int? RedeemedByUserId { get; set; }

        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }

        // Navigation property
        public virtual Campaign? Campaign { get; set; }

        public QRCode()
        {
            CreatedAt = DateTime.UtcNow;
        }
    }
}
