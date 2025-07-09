namespace backend.Models.DTOs
{
    public class QRCodeCreateDto
    {
        public string Code { get; set; } = string.Empty;
        public int CampaignId { get; set; }
    }

    public class QRCodeRewardTierDto
    {
        public int Id { get; set; }
        public int Threshold { get; set; }
        public string Reward { get; set; } = string.Empty;
    }

    public class QRCodeDto
    {
        public int Id { get; set; }
        public string Code { get; set; } = string.Empty;
        public int CampaignId { get; set; }
        public bool IsRedeemed { get; set; }
        public DateTime? RedeemedAt { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }

        // Campaign Info
        public int Points { get; set; }
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
        public List<QRCodeRewardTierDto> RewardTiers { get; set; } = new();
    }
}
