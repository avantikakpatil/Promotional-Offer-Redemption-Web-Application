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
        
        // B2B Specific Fields
        public int? ResellerId { get; set; } // For reseller QR codes
        
        public int? VoucherId { get; set; } // Link to voucher if applicable
        
        public int? RedeemedByShopkeeperId { get; set; } // Shopkeeper who redeemed
        
        public int? RedeemedByUserId { get; set; } // Legacy field for B2C

        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
        public DateTime? ExpiryDate { get; set; }

        // Navigation properties
        public virtual Campaign? Campaign { get; set; }
        public virtual User? Reseller { get; set; }
        public virtual Voucher? Voucher { get; set; }
        public virtual User? RedeemedByShopkeeper { get; set; }
        public virtual User? RedeemedByUser { get; set; }

        public QRCode()
        {
            CreatedAt = DateTime.UtcNow;
        }
    }
}
