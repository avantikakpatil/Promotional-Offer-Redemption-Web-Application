using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace backend.Models
{
    public class RedemptionHistory
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public int UserId { get; set; }
        [ForeignKey("UserId")]
        public User User { get; set; }

        [Required]
        public string QRCode { get; set; } = string.Empty;

        public int Points { get; set; }
        public DateTime RedeemedAt { get; set; } = DateTime.UtcNow;
    }
} 