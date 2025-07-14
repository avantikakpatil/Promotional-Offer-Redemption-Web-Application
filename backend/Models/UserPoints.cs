using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace backend.Models
{
    public class UserPoints
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public int UserId { get; set; }
        [ForeignKey("UserId")]
        public User User { get; set; } = null!;

        public int Points { get; set; }
        public int RedeemedPoints { get; set; }
        public DateTime LastUpdated { get; set; } = DateTime.UtcNow;
    }
} 