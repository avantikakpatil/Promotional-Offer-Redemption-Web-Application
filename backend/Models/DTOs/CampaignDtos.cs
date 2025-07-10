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
        [Range(1, int.MaxValue, ErrorMessage = "Points must be greater than 0")]
        public int Points { get; set; }

        [Required]
        public DateTime StartDate { get; set; }

        [Required]
        public DateTime EndDate { get; set; }

        [Required]
        [StringLength(1000, MinimumLength = 10)]
        public string Description { get; set; } = string.Empty;

        [Range(0, double.MaxValue, ErrorMessage = "Budget must be greater than or equal to 0")]
        public decimal? Budget { get; set; }

        [StringLength(500)]
        public string? TargetAudience { get; set; }

        public bool IsActive { get; set; } = true;

        [Required]
        public List<CreateRewardTierDto> RewardTiers { get; set; } = new List<CreateRewardTierDto>();
    }

    public class CreateRewardTierDto
    {
        [Required]
        [Range(1, int.MaxValue, ErrorMessage = "Threshold must be greater than 0")]
        public int Threshold { get; set; }

        [Required]
        [StringLength(500, MinimumLength = 3)]
        public string Reward { get; set; } = string.Empty;
    }

    public class CampaignDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string ProductType { get; set; } = string.Empty;
        public int Points { get; set; }
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
        public string Description { get; set; } = string.Empty;
        public decimal? Budget { get; set; }
        public string? TargetAudience { get; set; }
        public bool IsActive { get; set; }
        public int ManufacturerId { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
        public List<RewardTierDto> RewardTiers { get; set; } = new List<RewardTierDto>();
    }

    public class RewardTierDto
    {
        public int Id { get; set; }
        public int CampaignId { get; set; }
        public int Threshold { get; set; }
        public string Reward { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
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