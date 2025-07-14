using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace backend.Models.DTOs
{
    public class RedeemQRCodeDto
    {
        [JsonPropertyName("code")]
        public string Code { get; set; } = string.Empty;
        public int CustomerId { get; set; }
        public int Points { get; set; }
    }
} 