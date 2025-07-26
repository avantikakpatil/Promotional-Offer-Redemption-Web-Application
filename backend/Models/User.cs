// Models/User.cs
using System.ComponentModel.DataAnnotations;

namespace backend.Models
{
    public class User
    {
        public int Id { get; set; }
        
        [Required]
        [StringLength(100)]
        public string Name { get; set; } = string.Empty;
        
        [Required]
        [EmailAddress]
        public string Email { get; set; } = string.Empty;
        
        [Required]
        [Phone]
        public string Phone { get; set; } = string.Empty;
        
        [Required]
        public string PasswordHash { get; set; } = string.Empty;
        
        [Required]
        public string Role { get; set; } = string.Empty; // "manufacturer", "reseller", or "shopkeeper"
        
        // Business Information
        [StringLength(200)]
        public string? BusinessName { get; set; }
        
        [StringLength(500)]
        public string? BusinessAddress { get; set; }
        
        [StringLength(50)]
        public string? BusinessLicense { get; set; }
        
        [StringLength(100)]
        public string? GSTNumber { get; set; }
        
        // For Resellers - assigned manufacturer
        public int? AssignedManufacturerId { get; set; }
        
        // For Shopkeepers - assigned reseller
        public int? AssignedResellerId { get; set; }
        
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? UpdatedAt { get; set; }
        public DateTime? LastLoginAt { get; set; }
        
        // Total points earned by the user (mainly for resellers)
        public int Points { get; set; } = 0;

        // Navigation properties
        public virtual UserPoints UserPoints { get; set; } = null!;
        public virtual User? AssignedManufacturer { get; set; }
        public virtual User? AssignedReseller { get; set; }
        public virtual ICollection<User> AssignedResellers { get; set; } = new List<User>();
        public virtual ICollection<User> AssignedShopkeepers { get; set; } = new List<User>();
    }
}
