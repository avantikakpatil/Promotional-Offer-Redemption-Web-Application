-- SQL script to generate missing QR codes for all vouchers that do not have a QR code entry
-- This script assumes you have a QRCodes table with columns: Id, Code, VoucherId, CreatedAt, IsRedeemed, etc.
-- Adjust table/column names as needed for your schema

INSERT INTO QRCodes (Code, VoucherId, CreatedAt, IsRedeemed)
SELECT 
    CONCAT('QR-', v.VoucherCode, '-', SUBSTRING(CONVERT(varchar(36), NEWID()), 1, 8)),
    v.Id,
    GETDATE(),
    0
FROM Vouchers v
LEFT JOIN QRCodes q ON v.Id = q.VoucherId
WHERE q.Id IS NULL;

-- After running this script, every voucher will have a QR code entry.
-- You can now safely generate and scan QR codes for all vouchers.
