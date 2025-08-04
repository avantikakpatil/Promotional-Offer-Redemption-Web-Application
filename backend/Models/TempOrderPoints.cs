using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace backend.Models
{
    public class TempOrderPoints
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public DateTime Date { get; set; }

        [Required]
        public int ResellerId { get; set; }

        [Required]
        public int CampaignId { get; set; }

        [Required]
        public int Points { get; set; }

        [StringLength(50)]
        public string? OrderNumber { get; set; }

        [StringLength(50)]
        public string? Status { get; set; }

        [Column(TypeName = "decimal(18,2)")]
        public decimal TotalAmount { get; set; }

        public int TotalPointsEarned { get; set; }

        [StringLength(500)]
        public string? ShippingAddress { get; set; }

        [StringLength(500)]
        public string? Notes { get; set; }

        public DateTime? ApprovedAt { get; set; }
        public DateTime? ShippedAt { get; set; }
        public DateTime? DeliveredAt { get; set; }

        // Navigation properties (without TempOrderPointsItem)
        [ForeignKey("ResellerId")]
        public virtual User? Reseller { get; set; }

        [ForeignKey("CampaignId")]
        public virtual Campaign? Campaign { get; set; }
    }
}