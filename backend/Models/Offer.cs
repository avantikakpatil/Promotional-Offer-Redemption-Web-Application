
// Models/Offer.cs
using System.ComponentModel.DataAnnotations;

namespace backend.Models
{
    public class Offer
    {
        public int Id { get; set; }
        
        [Required]
        [StringLength(255)]
        public string Title { get; set; } = string.Empty;
        
        public string? Description { get; set; }
        
        [Range(0, 100)]
        public decimal DiscountPercentage { get; set; }
        
        [Required]
        public DateTime ValidFrom { get; set; }
        
        [Required]
        public DateTime ValidTo { get; set; }
        
        public int ManufacturerId { get; set; }
        public bool IsActive { get; set; } = true;
        public DateTime CreatedAt { get; set; } = DateTime.Now;
        public DateTime UpdatedAt { get; set; } = DateTime.Now;
        
        // Navigation properties
        public virtual User Manufacturer { get; set; } = null!;
        public virtual ICollection<OfferRedemption> OfferRedemptions { get; set; } = new List<OfferRedemption>();
    }
}
