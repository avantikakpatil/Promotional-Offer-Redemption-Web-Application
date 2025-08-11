-- Backfill all voucher campaigns with missing voucher generation settings
UPDATE Campaigns
SET VoucherGenerationThreshold = 1
WHERE RewardType = 'voucher' AND (VoucherGenerationThreshold IS NULL OR VoucherGenerationThreshold = 0);

UPDATE Campaigns
SET VoucherValue = 1
WHERE RewardType = 'voucher' AND (VoucherValue IS NULL OR VoucherValue = 0);

UPDATE Campaigns
SET VoucherValidityDays = 90
WHERE RewardType = 'voucher' AND (VoucherValidityDays IS NULL OR VoucherValidityDays = 0);
