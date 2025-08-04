-- Test Database Data for Reseller Orders and Points
USE promotionalofferredemption;

-- Check current data
SELECT '=== CURRENT DATA SUMMARY ===' as Info;

SELECT 'Users' as TableName, COUNT(*) as Count FROM Users
UNION ALL
SELECT 'Campaigns' as TableName, COUNT(*) as Count FROM Campaigns  
UNION ALL
SELECT 'Products' as TableName, COUNT(*) as Count FROM Products
UNION ALL
SELECT 'Orders' as TableName, COUNT(*) as Count FROM Orders
UNION ALL
SELECT 'OrderItems' as TableName, COUNT(*) as Count FROM OrderItems
UNION ALL
SELECT 'CampaignResellers' as TableName, COUNT(*) as Count FROM CampaignResellers;

-- Check sample data
SELECT '=== SAMPLE USERS ===' as Info;
SELECT Id, Name, Email, Role FROM Users LIMIT 5;

SELECT '=== SAMPLE CAMPAIGNS ===' as Info;
SELECT Id, Name, ManufacturerId, IsActive FROM Campaigns LIMIT 5;

SELECT '=== SAMPLE PRODUCTS ===' as Info;
SELECT Id, Name, ManufacturerId, PointsPerUnit, ResellerPrice FROM Products LIMIT 5;

SELECT '=== SAMPLE ORDERS ===' as Info;
SELECT Id, OrderNumber, ResellerId, CampaignId, TotalAmount, TotalPointsEarned, Status FROM Orders LIMIT 5;

SELECT '=== SAMPLE ORDER ITEMS ===' as Info;
SELECT Id, OrderId, ProductId, Quantity, UnitPrice, TotalPrice, PointsEarned FROM OrderItems LIMIT 5;

-- Check campaign assignments
SELECT '=== CAMPAIGN ASSIGNMENTS ===' as Info;
SELECT cr.CampaignId, c.Name as CampaignName, cr.ResellerId, u.Name as ResellerName, cr.IsApproved
FROM CampaignResellers cr
JOIN Campaigns c ON cr.CampaignId = c.Id
JOIN Users u ON cr.ResellerId = u.Id
LIMIT 10;

-- Check order details with relationships
SELECT '=== ORDER DETAILS ===' as Info;
SELECT 
    o.Id,
    o.OrderNumber,
    u.Name as ResellerName,
    c.Name as CampaignName,
    o.TotalAmount,
    o.TotalPointsEarned,
    o.Status,
    COUNT(oi.Id) as ItemCount,
    SUM(oi.PointsEarned) as CalculatedPoints
FROM Orders o
JOIN Users u ON o.ResellerId = u.Id
JOIN Campaigns c ON o.CampaignId = c.Id
LEFT JOIN OrderItems oi ON o.Id = oi.OrderId
GROUP BY o.Id, o.OrderNumber, u.Name, c.Name, o.TotalAmount, o.TotalPointsEarned, o.Status
LIMIT 10;

-- Check if points need to be calculated
SELECT '=== ORDERS NEEDING POINTS CALCULATION ===' as Info;
SELECT 
    o.Id,
    o.OrderNumber,
    o.TotalPointsEarned as CurrentPoints,
    SUM(oi.Quantity * p.PointsPerUnit) as ShouldBePoints,
    SUM(oi.PointsEarned) as ItemPoints
FROM Orders o
JOIN OrderItems oi ON o.Id = oi.OrderId
JOIN Products p ON oi.ProductId = p.Id
GROUP BY o.Id, o.OrderNumber, o.TotalPointsEarned
HAVING o.TotalPointsEarned != SUM(oi.Quantity * p.PointsPerUnit) OR o.TotalPointsEarned = 0
LIMIT 10; 