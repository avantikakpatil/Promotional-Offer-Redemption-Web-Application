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
        public int Points { get; set; }

        [Required]
        public DateTime StartDate { get; set; }

        [Required]
        public DateTime EndDate { get; set; }

        [Required]
        [StringLength(1000)]
        public string Description { get; set; } = string.Empty;

        [Column(TypeName = "decimal(18,2)")]
        public decimal? Budget { get; set; }

        [StringLength(500)]
        public string? TargetAudience { get; set; }

        public bool IsActive { get; set; } = true;

        [Required]
        public int ManufacturerId { get; set; }

        // Remove the DatabaseGenerated attribute and default value
        // Let the database handle the default value
        public DateTime CreatedAt { get; set; }

        public DateTime? UpdatedAt { get; set; }

        // Navigation properties
        public virtual User? Manufacturer { get; set; }
        public virtual ICollection<RewardTier> RewardTiers { get; set; } = new List<RewardTier>();

        public Campaign()
        {
            CreatedAt = DateTime.UtcNow;
        }
    }
}