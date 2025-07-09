using System.ComponentModel.DataAnnotations;

namespace backend.Models.DTOs
{
    public class RedeemCouponDto
    {
        public string? QrData { get; set; }
        [Required]
        public int CustomerId { get; set; }
    }
} 