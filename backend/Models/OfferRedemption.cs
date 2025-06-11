// Models/OfferRedemption.cs
using System.ComponentModel.DataAnnotations;

namespace backend.Models
{
    public class OfferRedemption
    {
        public int Id { get; set; }
        
        [Required]
        public int OfferId { get; set; }
        
        [Required]
        public int UserId { get; set; }
        
        public DateTime RedeemedAt { get; set; } = DateTime.Now;
        
        [Required]
        [StringLength(100)]
        public string RedemptionCode { get; set; } = string.Empty;
        
        public RedemptionStatus Status { get; set; } = RedemptionStatus.Pending;
        
        // Navigation properties
        public virtual Offer Offer { get; set; } = null!;
        public virtual User User { get; set; } = null!;
    }
    
    public enum RedemptionStatus
    {
        Pending,
        Approved,
        Rejected
    }
}
