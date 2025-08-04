-- Simple Orders Final
-- This script will work with whatever data exists in your database

USE promotionalofferredemption;

-- Step 1: Check what we have
SELECT '=== CURRENT DATA ===' as Info;
SELECT 'Users' as TableName, COUNT(*) as Count FROM Users
UNION ALL
SELECT 'Campaigns' as TableName, COUNT(*) as Count FROM Campaigns  
UNION ALL
SELECT 'Products' as TableName, COUNT(*) as Count FROM Products;

-- Step 2: Get the first available user ID (any role)
SET @user_id = (SELECT Id FROM Users LIMIT 1);

-- Step 3: Get the first available campaign ID
SET @campaign_id = (SELECT Id FROM Campaigns LIMIT 1);

-- Step 4: Get the first available product ID
SET @product_id = (SELECT Id FROM Products LIMIT 1);

-- Step 5: Show what IDs we found
SELECT '=== FOUND IDs ===' as Info;
SELECT @user_id as UserId, @campaign_id as CampaignId, @product_id as ProductId;

-- Step 6: Clear existing orders safely
DELETE FROM OrderItems WHERE OrderId IN (SELECT Id FROM Orders);
DELETE FROM Orders WHERE Id > 0;

-- Step 7: Insert orders using the found IDs
INSERT INTO Orders (Id, OrderNumber, ResellerId, CampaignId, TotalAmount, TotalPointsEarned, Status, ShippingAddress, Notes, OrderDate, ApprovedAt, ShippedAt, DeliveredAt)
VALUES 
    (1, 'ORD-2024-001', @user_id, @campaign_id, 1480.00, 140, 'delivered', '123 Main Street, City Center, State 12345', 'First order from new reseller', '2024-01-15 10:30:00', '2024-01-15 14:00:00', '2024-01-16 09:00:00', '2024-01-18 15:30:00'),
    (2, 'ORD-2024-002', @user_id, @campaign_id, 2185.00, 218, 'shipped', '456 Business Ave, Downtown, State 12345', 'Bulk order for retail store', '2024-01-20 11:45:00', '2024-01-20 16:30:00', '2024-01-21 08:00:00', NULL),
    (3, 'ORD-2024-003', @user_id, @campaign_id, 1100.00, 100, 'approved', '789 Commerce St, Business District, State 12345', 'Regular monthly order', '2024-01-25 09:15:00', '2024-01-25 13:45:00', NULL, NULL),
    (4, 'ORD-2024-004', @user_id, @campaign_id, 950.00, 95, 'pending', '321 Retail Blvd, Shopping Center, State 12345', 'Small order for testing', '2024-01-28 14:20:00', NULL, NULL, NULL),
    (5, 'ORD-2024-005', @user_id, @campaign_id, 3200.00, 320, 'delivered', '654 Wholesale Rd, Industrial Area, State 12345', 'Large order for warehouse', '2024-02-01 08:00:00', '2024-02-01 12:00:00', '2024-02-02 07:30:00', '2024-02-05 11:00:00');

-- Step 8: Insert order items
INSERT INTO OrderItems (OrderId, ProductId, Quantity, UnitPrice, TotalPrice, PointsEarned, CreatedAt)
VALUES 
    (1, @product_id, 5, 110.00, 550.00, 50, '2024-01-15 10:30:00'),
    (1, @product_id, 2, 120.00, 240.00, 24, '2024-01-15 10:30:00'),
    (1, @product_id, 10, 55.00, 550.00, 50, '2024-01-15 10:30:00'),
    
    (2, @product_id, 8, 110.00, 880.00, 80, '2024-01-20 11:45:00'),
    (2, @product_id, 3, 120.00, 360.00, 36, '2024-01-20 11:45:00'),
    (2, @product_id, 15, 55.00, 825.00, 75, '2024-01-20 11:45:00'),
    
    (3, @product_id, 20, 55.00, 1100.00, 100, '2024-01-25 09:15:00'),
    
    (4, @product_id, 3, 110.00, 330.00, 30, '2024-01-28 14:20:00'),
    (4, @product_id, 1, 120.00, 120.00, 12, '2024-01-28 14:20:00'),
    (4, @product_id, 5, 60.00, 300.00, 30, '2024-01-28 14:20:00'),
    
    (5, @product_id, 30, 55.00, 1650.00, 150, '2024-02-01 08:00:00'),
    (5, @product_id, 20, 65.00, 1300.00, 140, '2024-02-01 08:00:00');

-- Step 9: Verify the results
SELECT '=== VERIFICATION ===' as Info;
SELECT COUNT(*) as TotalOrders FROM Orders;
SELECT COUNT(*) as TotalOrderItems FROM OrderItems;

-- Step 10: Show the orders
SELECT 
    o.Id,
    o.OrderNumber,
    u.Name as ResellerName,
    c.Name as CampaignName,
    o.Status,
    o.TotalAmount,
    o.TotalPointsEarned,
    o.OrderDate
FROM Orders o
JOIN Users u ON o.ResellerId = u.Id
JOIN Campaigns c ON o.CampaignId = c.Id
ORDER BY o.OrderDate; 