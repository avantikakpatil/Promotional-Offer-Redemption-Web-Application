using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.AspNetCore.Identity;

namespace PromotionalOfferRedemption.Models
{
    public class Reward
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public string Name { get; set; }

        [Required]
        public int Points { get; set; }

        [Required]
        public string Category { get; set; }

        [Required]
        public string Image { get; set; }

        [Required]
        public bool Available { get; set; }

        public string Description { get; set; }

        public DateTime? ExpiryDate { get; set; }
    }

    public class RewardRedemption
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public int UserId { get; set; }

        [Required]
        public int RewardId { get; set; }

        [Required]
        public DateTime RedeemedAt { get; set; }

        [Required]
        public string Status { get; set; } // "pending", "completed", "cancelled"

        [ForeignKey("UserId")]
        public backend.Models.User User { get; set; }

        [ForeignKey("RewardId")]
        public Reward Reward { get; set; }
    }
} 