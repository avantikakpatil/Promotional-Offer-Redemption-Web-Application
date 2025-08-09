using System.ComponentModel.DataAnnotations;

namespace backend.Models.DTOs
{
    // Manufacturer DTOs
    public class CreateB2BCampaignDto
    {
        [Required]
        public string Name { get; set; } = string.Empty;
        
        [Required]
        public string ProductType { get; set; } = string.Empty;
        
        [Required]
        public int Points { get; set; }
        
        [Required]
        public DateTime StartDate { get; set; }
        
        [Required]
        public DateTime EndDate { get; set; }
        
        public decimal? Budget { get; set; }
        
        public string? TargetAudience { get; set; }
        
        public string? EligibleProducts { get; set; }
    }

    public class AssignResellerDto
    {
        [Required]
        public int CampaignId { get; set; }
        
        [Required]
        public int ResellerId { get; set; }
        
        public bool IsApproved { get; set; } = false;
    }

    public class CreateProductDto
    {
        [Required]
        public string Name { get; set; } = string.Empty;
        
        public string? Description { get; set; }
        
        [Required]
        public string Category { get; set; } = string.Empty;
        
        public string? SKU { get; set; }
        
        public string? Brand { get; set; }
        
        [Required]
        public decimal BasePrice { get; set; }
        
        [Required]
        public decimal ResellerPrice { get; set; }
        
        [Required]
        public decimal RetailPrice { get; set; }
        
        public int PointsPerUnit { get; set; } = 0;
    }

    // Reseller DTOs
    public class CreateOrderDto
    {
        [Required]
        public int CampaignId { get; set; }
        
        [Required]
        public List<OrderItemDto> Items { get; set; } = new List<OrderItemDto>();
        
        public string? ShippingAddress { get; set; }
        
        public string? Notes { get; set; }
    }

    public class OrderItemDto
    {
        [Required]
        public int ProductId { get; set; }
        
        [Required]
        public int Quantity { get; set; }
    }

    public class CreateVoucherDto
    {
        [Required]
        public int CampaignId { get; set; }
        
        [Required]
        public decimal Value { get; set; }
        
        [Required]
        public int PointsRequired { get; set; }
        
        public string? EligibleProducts { get; set; }
        
        [Required]
        public DateTime ExpiryDate { get; set; }
    }

    public class GenerateQRCodeDto
    {
        [Required]
        public int VoucherId { get; set; }
        
        public DateTime? ExpiryDate { get; set; }
    }

    // Shopkeeper DTOs
    public class RedeemVoucherDto
    {
        [Required]
        public string QRCode { get; set; } = string.Empty;
        
        [Required]
        public List<int> SelectedProductIds { get; set; } = new List<int>();
        
        public string? Notes { get; set; }
    }

    public class VoucherValidationDto
    {
        [Required]
        public string QRCode { get; set; } = string.Empty;
        public int? CampaignId { get; set; } // Added for shopkeeper QR validation
    }

    // Common DTOs
    public class BusinessUserDto
    {
        [Required]
        public string Name { get; set; } = string.Empty;
        
        [Required]
        [EmailAddress]
        public string Email { get; set; } = string.Empty;
        
        [Required]
        [Phone]
        public string Phone { get; set; } = string.Empty;
        
        [Required]
        public string Password { get; set; } = string.Empty;
        
        [Required]
        public string Role { get; set; } = string.Empty;
        
        public string? BusinessName { get; set; }
        
        public string? BusinessAddress { get; set; }
        
        public string? BusinessLicense { get; set; }
        
        public string? GSTNumber { get; set; }
        
        public int? AssignedManufacturerId { get; set; }
        
        public int? AssignedResellerId { get; set; }
    }

    public class CampaignResellerDto
    {
        public int Id { get; set; }
        public int CampaignId { get; set; }
        public int ResellerId { get; set; }
        public bool IsApproved { get; set; }
        public DateTime? ApprovedAt { get; set; }
        public int TotalPointsEarned { get; set; }
        public decimal TotalOrderValue { get; set; }
        public DateTime CreatedAt { get; set; }
        public User? Reseller { get; set; }
        public Campaign? Campaign { get; set; }
    }

    public class VoucherSettingsDto
    {
        public int? VoucherGenerationThreshold { get; set; }
        
        public decimal? VoucherValue { get; set; }
        
        public int? VoucherValidityDays { get; set; } = 90;
    }

    public class CreateOrderRequest
    {
        [Required]
        public List<CreateOrderItemRequest> Items { get; set; } = new List<CreateOrderItemRequest>();

        public string? ShippingAddress { get; set; }
        public string? Notes { get; set; }
    }

    public class CreateOrderItemRequest
    {
        [Required]
        public int EligibleProductId { get; set; }

        [Required]
        public int CampaignId { get; set; }

        [Required]
        [Range(1, int.MaxValue, ErrorMessage = "Quantity must be at least 1")]
        public int Quantity { get; set; }
    }
} 