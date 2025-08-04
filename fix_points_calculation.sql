-- Fix Points Calculation for Reseller Orders
USE promotionalofferredemption;

-- Step 1: Fix OrderItems PointsEarned based on Quantity * Product.PointsPerUnit
UPDATE OrderItems oi
JOIN Products p ON oi.ProductId = p.Id
SET oi.PointsEarned = oi.Quantity * p.PointsPerUnit
WHERE oi.PointsEarned != oi.Quantity * p.PointsPerUnit OR oi.PointsEarned IS NULL;

-- Step 2: Fix Orders TotalPointsEarned based on sum of OrderItems
UPDATE Orders o
SET o.TotalPointsEarned = (
    SELECT COALESCE(SUM(oi.PointsEarned), 0)
    FROM OrderItems oi
    WHERE oi.OrderId = o.Id
)
WHERE o.TotalPointsEarned != (
    SELECT COALESCE(SUM(oi.PointsEarned), 0)
    FROM OrderItems oi
    WHERE oi.OrderId = o.Id
) OR o.TotalPointsEarned IS NULL;

-- Step 3: Clear existing CampaignPoints to recalculate
DELETE FROM CampaignPoints WHERE ResellerId = 2;

-- Step 4: Insert fresh CampaignPoints records
INSERT INTO CampaignPoints (CampaignId, ResellerId, TotalPointsEarned, PointsUsedForVouchers, AvailablePoints, TotalOrderValue, TotalOrders, TotalVouchersGenerated, TotalVoucherValueGenerated, CreatedAt, UpdatedAt)
SELECT 
    o.CampaignId,
    o.ResellerId,
    SUM(o.TotalPointsEarned) as TotalPointsEarned,
    0 as PointsUsedForVouchers,
    SUM(o.TotalPointsEarned) as AvailablePoints,
    SUM(o.TotalAmount) as TotalOrderValue,
    COUNT(o.Id) as TotalOrders,
    0 as TotalVouchersGenerated,
    0 as TotalVoucherValueGenerated,
    NOW() as CreatedAt,
    NOW() as UpdatedAt
FROM Orders o
WHERE o.ResellerId = 2
GROUP BY o.CampaignId, o.ResellerId;

-- Step 5: Verify the fixes
SELECT '=== VERIFICATION ===' as Info;

SELECT 'OrderItems Points Fixed:' as Info;
SELECT 
    oi.Id,
    oi.OrderId,
    oi.ProductId,
    oi.Quantity,
    p.PointsPerUnit,
    oi.PointsEarned,
    (oi.Quantity * p.PointsPerUnit) as ShouldBePoints
FROM OrderItems oi
JOIN Products p ON oi.ProductId = p.Id
WHERE oi.OrderId IN (SELECT Id FROM Orders WHERE ResellerId = 2)
ORDER BY oi.OrderId, oi.Id;

SELECT 'Orders Total Points Fixed:' as Info;
SELECT 
    o.Id,
    o.OrderNumber,
    o.TotalPointsEarned,
    (SELECT COALESCE(SUM(oi.PointsEarned), 0) FROM OrderItems oi WHERE oi.OrderId = o.Id) as CalculatedPoints
FROM Orders o
WHERE o.ResellerId = 2
ORDER BY o.Id;

SELECT 'CampaignPoints Summary:' as Info;
SELECT 
    cp.CampaignId,
    c.Name as CampaignName,
    cp.TotalPointsEarned,
    cp.PointsUsedForVouchers,
    cp.AvailablePoints,
    cp.TotalOrderValue,
    cp.TotalOrders
FROM CampaignPoints cp
JOIN Campaigns c ON cp.CampaignId = c.Id
WHERE cp.ResellerId = 2; 