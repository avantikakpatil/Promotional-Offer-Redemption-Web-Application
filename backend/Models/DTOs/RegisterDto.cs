// Models/DTOs/RegisterDto.cs
using System.ComponentModel.DataAnnotations;

namespace backend.Models.DTOs
{
    public class RegisterDto
    {
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
        [StringLength(100, MinimumLength = 6)]
        public string Password { get; set; } = string.Empty;
        
        [Required]
        public string Role { get; set; } = string.Empty; // "customer", "reseller", or "manufacturer"
    }
}