 using System.ComponentModel.DataAnnotations;

namespace backend.Models.DTOs
{
    public class CreateCampaignDto
    {
        [Required]
        [StringLength(255, MinimumLength = 3)]
        public string Name { get; set; } = string.Empty;

        [Required]
        [StringLength(100)]
        public string ProductType { get; set; } = string.Empty;

        [Required]
        public DateTime StartDate { get; set; }

        [Required]
        public DateTime EndDate { get; set; }

        [Required]
        [StringLength(1000, MinimumLength = 10)]
        public string Description { get; set; } = string.Empty;

        public bool IsActive { get; set; } = true;

        // Eligible products for points earning
        [MinLength(1, ErrorMessage = "At least one eligible product is required")]
        public List<CampaignEligibleProductDto>? EligibleProducts { get; set; }

        // Voucher redemption products
        [MinLength(1, ErrorMessage = "At least one voucher product is required")]
        public List<CampaignVoucherProductDto>? VoucherProducts { get; set; }

        public decimal? VoucherValue { get; set; }
        public int? VoucherGenerationThreshold { get; set; }
        public int? VoucherValidityDays { get; set; }
    }

    public class CampaignDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string ProductType { get; set; } = string.Empty;
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
        public string Description { get; set; } = string.Empty;
        public bool IsActive { get; set; }
        public int ManufacturerId { get; set; }
        public decimal? VoucherValue { get; set; }
        public int? VoucherGenerationThreshold { get; set; }
        public int? VoucherValidityDays { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
        public List<CampaignEligibleProductDto>? EligibleProducts { get; set; }
        public List<CampaignVoucherProductDto>? VoucherProducts { get; set; }
    }

    public class CampaignEligibleProductDto
    {
        public int CampaignProductId { get; set; }
        public int PointCost { get; set; }
        public int? RedemptionLimit { get; set; }
        public bool IsActive { get; set; } = true;
    }

    public class CampaignVoucherProductDto
    {
        public int ProductId { get; set; }
        public decimal VoucherValue { get; set; }
        public bool IsActive { get; set; } = true;
    }

    public class ApiResponse<T>
    {
        public bool Success { get; set; }
        public string Message { get; set; } = string.Empty;
        public T? Data { get; set; }
        public List<string> Errors { get; set; } = new List<string>();
        public string? ErrorCode { get; set; }
    }
}