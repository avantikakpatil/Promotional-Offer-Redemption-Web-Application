using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using backend.Models;

namespace PromotionalOfferRedemption.Models
{
    public class Points
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public int UserId { get; set; }

        [ForeignKey("UserId")]
        public User User { get; set; } = null!;

        public int Balance { get; set; }

        public DateTime LastUpdated { get; set; } = DateTime.UtcNow;
    }

    public class PointsHistory
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public int UserId { get; set; }

        [ForeignKey("UserId")]
        public User User { get; set; } = null!;

        public int Points { get; set; }

        public string Type { get; set; } = string.Empty; // "earned", "redeemed", "expired"

        public string Description { get; set; } = string.Empty;

        public DateTime Date { get; set; } = DateTime.UtcNow;
    }
} 