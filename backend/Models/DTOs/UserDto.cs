// Models/DTOs/UserDto.cs
using System.ComponentModel.DataAnnotations;

namespace backend.Models.DTOs
{
    public class UserDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Phone { get; set; } = string.Empty;
        public string Role { get; set; } = string.Empty; // "customer", "reseller", or "manufacturer"
        public DateTime CreatedAt { get; set; }
        public bool IsActive { get; set; }
        public int Points { get; set; }
    }
    
    public class LoginResponseDto
    {
        public string Token { get; set; } = string.Empty;
        public UserDto User { get; set; } = null!;
    }
}