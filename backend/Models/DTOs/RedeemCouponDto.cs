using System.ComponentModel.DataAnnotations;

namespace backend.Models.DTOs
{
    public class RedeemQRCodeDto
    {
        public int QRCodeId { get; set; }
        public int CustomerId { get; set; }
        public int Points { get; set; }
    }
} 