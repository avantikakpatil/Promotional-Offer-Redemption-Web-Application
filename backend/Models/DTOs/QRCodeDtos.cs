namespace backend.Models.DTOs
{
    public class QRCodeCreateDto
    {
        public string Code { get; set; } = string.Empty;
        public int CampaignId { get; set; }
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
    }
}
