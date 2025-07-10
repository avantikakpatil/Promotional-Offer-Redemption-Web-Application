public class RedeemQRCodeDto
{
    public string? Code { get; set; } = string.Empty;
    public int CustomerId { get; set; }
    public int Points { get; set; }
}

public class RedeemRewardFromCustomerDto
{
    public int CustomerId { get; set; }
    public int ResellerId { get; set; }
    public int RewardId { get; set; }
    public int Points { get; set; }
    public string? RewardTitle { get; set; }
    public long Timestamp { get; set; }
} 