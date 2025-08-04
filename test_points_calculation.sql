-- Comprehensive Test for Points Calculation
USE promotionalofferredemption;

-- Test 1: Verify OrderItems Points Calculation
SELECT '=== TEST 1: OrderItems Points Calculation ===' as Info;
SELECT 
    oi.Id,
    oi.OrderId,
    oi.ProductId,
    p.Name as ProductName,
    oi.Quantity,
    p.PointsPerUnit,
    oi.PointsEarned as CurrentPoints,
    (oi.Quantity * p.PointsPerUnit) as ShouldBePoints,
    CASE 
        WHEN oi.PointsEarned = (oi.Quantity * p.PointsPerUnit) THEN '✅ CORRECT'
        ELSE '❌ INCORRECT'
    END as Status
FROM OrderItems oi
JOIN Products p ON oi.ProductId = p.Id
WHERE oi.OrderId IN (SELECT Id FROM Orders WHERE ResellerId = 2)
ORDER BY oi.OrderId, oi.Id;

-- Test 2: Verify Orders Total Points
SELECT '=== TEST 2: Orders Total Points ===' as Info;
SELECT 
    o.Id,
    o.OrderNumber,
    o.TotalPointsEarned as CurrentTotal,
    (SELECT COALESCE(SUM(oi.PointsEarned), 0) FROM OrderItems oi WHERE oi.OrderId = o.Id) as CalculatedTotal,
    CASE 
        WHEN o.TotalPointsEarned = (SELECT COALESCE(SUM(oi.PointsEarned), 0) FROM OrderItems oi WHERE oi.OrderId = o.Id) THEN '✅ CORRECT'
        ELSE '❌ INCORRECT'
    END as Status
FROM Orders o
WHERE o.ResellerId = 2
ORDER BY o.Id;

-- Test 3: Verify CampaignPoints Calculation
SELECT '=== TEST 3: CampaignPoints Calculation ===' as Info;
SELECT 
    cp.CampaignId,
    c.Name as CampaignName,
    cp.TotalPointsEarned as CampaignPoints,
    (SELECT COALESCE(SUM(o.TotalPointsEarned), 0) FROM Orders o WHERE o.CampaignId = cp.CampaignId AND o.ResellerId = cp.ResellerId) as CalculatedCampaignPoints,
    cp.TotalOrders,
    (SELECT COUNT(*) FROM Orders o WHERE o.CampaignId = cp.CampaignId AND o.ResellerId = cp.ResellerId) as ActualOrders,
    CASE 
        WHEN cp.TotalPointsEarned = (SELECT COALESCE(SUM(o.TotalPointsEarned), 0) FROM Orders o WHERE o.CampaignId = cp.CampaignId AND o.ResellerId = cp.ResellerId) THEN '✅ CORRECT'
        ELSE '❌ INCORRECT'
    END as Status
FROM CampaignPoints cp
JOIN Campaigns c ON cp.CampaignId = c.Id
WHERE cp.ResellerId = 2;

-- Test 4: Summary Statistics
SELECT '=== TEST 4: Summary Statistics ===' as Info;
SELECT 
    'Total Orders' as Metric,
    COUNT(*) as Value
FROM Orders 
WHERE ResellerId = 2
UNION ALL
SELECT 
    'Total Points Earned',
    SUM(TotalPointsEarned)
FROM Orders 
WHERE ResellerId = 2
UNION ALL
SELECT 
    'Total Order Value',
    SUM(TotalAmount)
FROM Orders 
WHERE ResellerId = 2
UNION ALL
SELECT 
    'Campaigns with Points',
    COUNT(*)
FROM CampaignPoints 
WHERE ResellerId = 2;

-- Test 5: Points per Campaign Breakdown
SELECT '=== TEST 5: Points per Campaign Breakdown ===' as Info;
SELECT 
    c.Name as CampaignName,
    COUNT(o.Id) as OrderCount,
    SUM(o.TotalPointsEarned) as TotalPoints,
    SUM(o.TotalAmount) as TotalValue,
    AVG(o.TotalPointsEarned) as AvgPointsPerOrder,
    AVG(o.TotalAmount) as AvgValuePerOrder
FROM Orders o
JOIN Campaigns c ON o.CampaignId = c.Id
WHERE o.ResellerId = 2
GROUP BY c.Id, c.Name
ORDER BY TotalPoints DESC;

-- Test 6: Product Performance
SELECT '=== TEST 6: Product Performance ===' as Info;
SELECT 
    p.Name as ProductName,
    SUM(oi.Quantity) as TotalQuantity,
    SUM(oi.PointsEarned) as TotalPoints,
    SUM(oi.TotalPrice) as TotalValue,
    p.PointsPerUnit,
    AVG(oi.Quantity) as AvgQuantityPerOrder
FROM OrderItems oi
JOIN Products p ON oi.ProductId = p.Id
JOIN Orders o ON oi.OrderId = o.Id
WHERE o.ResellerId = 2
GROUP BY p.Id, p.Name, p.PointsPerUnit
ORDER BY TotalPoints DESC; 