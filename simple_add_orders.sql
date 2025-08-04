-- Simple Add Orders Data
-- This script only adds orders assuming other tables already exist

-- First, let's check what users exist
SELECT '=== CHECKING EXISTING USERS ===' as Info;
SELECT Id, Name, Email, Role FROM Users WHERE Role = 'reseller';

-- Check what campaigns exist
SELECT '=== CHECKING EXISTING CAMPAIGNS ===' as Info;
SELECT Id, Name, ManufacturerId FROM Campaigns;

-- Check what products exist
SELECT '=== CHECKING EXISTING PRODUCTS ===' as Info;
SELECT Id, Name, Category, ResellerPrice FROM Products ORDER BY Id;

-- Clear any existing orders (using WHERE clause to satisfy safe update mode)
DELETE FROM OrderItems WHERE OrderId IN (SELECT Id FROM Orders);
DELETE FROM Orders WHERE Id > 0;

-- Now let's add sample orders using existing user IDs
-- First, let's find the actual reseller user IDs
SET @reseller1_id = (SELECT Id FROM Users WHERE Role = 'reseller' LIMIT 1);
SET @reseller2_id = (SELECT Id FROM Users WHERE Role = 'reseller' AND Id != @reseller1_id LIMIT 1);

-- If we don't have resellers, let's use any existing user IDs
SET @reseller1_id = COALESCE(@reseller1_id, (SELECT Id FROM Users LIMIT 1));
SET @reseller2_id = COALESCE(@reseller2_id, @reseller1_id);

-- Get campaign ID
SET @campaign_id = (SELECT Id FROM Campaigns LIMIT 1);
SET @campaign_id = COALESCE(@campaign_id, 1);

-- Add sample orders using existing user IDs
INSERT INTO Orders (Id, OrderNumber, ResellerId, CampaignId, TotalAmount, TotalPointsEarned, Status, ShippingAddress, Notes, OrderDate, ApprovedAt, ShippedAt, DeliveredAt)
VALUES 
    (1, 'ORD-2024-001', @reseller1_id, @campaign_id, 1480.00, 140, 'delivered', '123 Main Street, City Center, State 12345', 'First order from new reseller', '2024-01-15 10:30:00', '2024-01-15 14:00:00', '2024-01-16 09:00:00', '2024-01-18 15:30:00'),
    (2, 'ORD-2024-002', @reseller1_id, @campaign_id, 2185.00, 218, 'shipped', '456 Business Ave, Downtown, State 12345', 'Bulk order for retail store', '2024-01-20 11:45:00', '2024-01-20 16:30:00', '2024-01-21 08:00:00', NULL),
    (3, 'ORD-2024-003', @reseller2_id, @campaign_id, 1100.00, 100, 'approved', '789 Commerce St, Business District, State 12345', 'Regular monthly order', '2024-01-25 09:15:00', '2024-01-25 13:45:00', NULL, NULL),
    (4, 'ORD-2024-004', @reseller1_id, @campaign_id, 950.00, 95, 'pending', '321 Retail Blvd, Shopping Center, State 12345', 'Small order for testing', '2024-01-28 14:20:00', NULL, NULL, NULL),
    (5, 'ORD-2024-005', @reseller2_id, @campaign_id, 3200.00, 320, 'delivered', '654 Wholesale Rd, Industrial Area, State 12345', 'Large order for warehouse', '2024-02-01 08:00:00', '2024-02-01 12:00:00', '2024-02-02 07:30:00', '2024-02-05 11:00:00'),
    (6, 'ORD-2024-006', @reseller1_id, @campaign_id, 1200.00, 120, 'cancelled', '987 Market St, City Center, State 12345', 'Order cancelled due to stock issues', '2024-02-05 16:30:00', NULL, NULL, NULL),
    (7, 'ORD-2024-007', @reseller2_id, @campaign_id, 2800.00, 280, 'shipped', '147 Distribution Way, Logistics Park, State 12345', 'Express delivery requested', '2024-02-08 10:00:00', '2024-02-08 15:00:00', '2024-02-09 06:00:00', NULL),
    (8, 'ORD-2024-008', @reseller1_id, @campaign_id, 1600.00, 160, 'approved', '258 Trade Center, Business Hub, State 12345', 'Standard order processing', '2024-02-12 13:45:00', '2024-02-12 17:30:00', NULL, NULL);

-- Get product IDs that exist
SET @product1_id = (SELECT Id FROM Products WHERE Id = 1 LIMIT 1);
SET @product2_id = (SELECT Id FROM Products WHERE Id = 2 LIMIT 1);
SET @product4_id = (SELECT Id FROM Products WHERE Id = 4 LIMIT 1);
SET @product5_id = (SELECT Id FROM Products WHERE Id = 5 LIMIT 1);
SET @product6_id = (SELECT Id FROM Products WHERE Id = 6 LIMIT 1);
SET @product7_id = (SELECT Id FROM Products WHERE Id = 7 LIMIT 1);
SET @product8_id = (SELECT Id FROM Products WHERE Id = 8 LIMIT 1);
SET @product9_id = (SELECT Id FROM Products WHERE Id = 9 LIMIT 1);
SET @product10_id = (SELECT Id FROM Products WHERE Id = 10 LIMIT 1);
SET @product11_id = (SELECT Id FROM Products WHERE Id = 11 LIMIT 1);
SET @product12_id = (SELECT Id FROM Products WHERE Id = 12 LIMIT 1);

-- Use first available product if specific ones don't exist
SET @product1_id = COALESCE(@product1_id, (SELECT Id FROM Products LIMIT 1));
SET @product2_id = COALESCE(@product2_id, @product1_id);
SET @product4_id = COALESCE(@product4_id, @product1_id);
SET @product5_id = COALESCE(@product5_id, @product1_id);
SET @product6_id = COALESCE(@product6_id, @product1_id);
SET @product7_id = COALESCE(@product7_id, @product1_id);
SET @product8_id = COALESCE(@product8_id, @product1_id);
SET @product9_id = COALESCE(@product9_id, @product1_id);
SET @product10_id = COALESCE(@product10_id, @product1_id);
SET @product11_id = COALESCE(@product11_id, @product1_id);
SET @product12_id = COALESCE(@product12_id, @product1_id);

-- Add order items for each order using existing product IDs
INSERT INTO OrderItems (OrderId, ProductId, Quantity, UnitPrice, TotalPrice, PointsEarned, CreatedAt)
VALUES 
    -- Order 1 items
    (1, @product1_id, 5, 110.00, 550.00, 50, '2024-01-15 10:30:00'),
    (1, @product2_id, 2, 120.00, 240.00, 24, '2024-01-15 10:30:00'),
    (1, @product4_id, 10, 55.00, 550.00, 50, '2024-01-15 10:30:00'),
    (1, @product1_id, 2, 110.00, 220.00, 20, '2024-01-15 10:30:00'),
    
    -- Order 2 items
    (2, @product1_id, 8, 110.00, 880.00, 80, '2024-01-20 11:45:00'),
    (2, @product2_id, 3, 120.00, 360.00, 36, '2024-01-20 11:45:00'),
    (2, @product4_id, 15, 55.00, 825.00, 75, '2024-01-20 11:45:00'),
    (2, @product1_id, 1, 110.00, 110.00, 10, '2024-01-20 11:45:00'),
    
    -- Order 3 items
    (3, @product4_id, 20, 55.00, 1100.00, 100, '2024-01-25 09:15:00'),
    
    -- Order 4 items
    (4, @product1_id, 3, 110.00, 330.00, 30, '2024-01-28 14:20:00'),
    (4, @product2_id, 1, 120.00, 120.00, 12, '2024-01-28 14:20:00'),
    (4, @product5_id, 5, 60.00, 300.00, 30, '2024-01-28 14:20:00'),
    (4, @product7_id, 5, 35.00, 175.00, 20, '2024-01-28 14:20:00'),
    (4, @product11_id, 1, 45.00, 45.00, 5, '2024-01-28 14:20:00'),
    
    -- Order 5 items
    (5, @product4_id, 30, 55.00, 1650.00, 150, '2024-02-01 08:00:00'),
    (5, @product6_id, 20, 65.00, 1300.00, 140, '2024-02-01 08:00:00'),
    (5, @product10_id, 3, 90.00, 270.00, 30, '2024-02-01 08:00:00'),
    
    -- Order 6 items (cancelled)
    (6, @product1_id, 4, 110.00, 440.00, 40, '2024-02-05 16:30:00'),
    (6, @product2_id, 2, 80.00, 160.00, 16, '2024-02-05 16:30:00'),
    (6, @product5_id, 8, 60.00, 480.00, 48, '2024-02-05 16:30:00'),
    (6, @product8_id, 3, 55.00, 165.00, 18, '2024-02-05 16:30:00'),
    
    -- Order 7 items
    (7, @product4_id, 25, 55.00, 1375.00, 125, '2024-02-08 10:00:00'),
    (7, @product7_id, 10, 35.00, 350.00, 40, '2024-02-08 10:00:00'),
    (7, @product9_id, 5, 85.00, 425.00, 40, '2024-02-08 10:00:00'),
    (7, @product12_id, 8, 50.00, 400.00, 40, '2024-02-08 10:00:00'),
    (7, @product11_id, 3, 45.00, 135.00, 15, '2024-02-08 10:00:00'),
    
    -- Order 8 items
    (8, @product1_id, 6, 110.00, 660.00, 60, '2024-02-12 13:45:00'),
    (8, @product2_id, 1, 120.00, 120.00, 12, '2024-02-12 13:45:00'),
    (8, @product5_id, 8, 60.00, 480.00, 48, '2024-02-12 13:45:00'),
    (8, @product7_id, 3, 35.00, 105.00, 12, '2024-02-12 13:45:00'),
    (8, @product11_id, 2, 45.00, 90.00, 10, '2024-02-12 13:45:00'),
    (8, @product12_id, 1, 50.00, 50.00, 5, '2024-02-12 13:45:00'),
    (8, @product8_id, 1, 55.00, 55.00, 6, '2024-02-12 13:45:00'),
    (8, @product10_id, 1, 90.00, 90.00, 9, '2024-02-12 13:45:00');

-- Verify the orders were added
SELECT 'Orders Added Successfully!' as Status;
SELECT COUNT(*) as TotalOrders FROM Orders;
SELECT COUNT(*) as TotalOrderItems FROM OrderItems;

-- Show the orders with details
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