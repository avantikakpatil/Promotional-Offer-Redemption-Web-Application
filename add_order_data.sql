-- Add Order Data to Database
-- This script adds sample orders and order items to the database
-- Updated to use correct foreign key IDs based on actual database data

-- First, let's check what data exists in the database
SELECT 'Users' as TableName, COUNT(*) as Count FROM Users
UNION ALL
SELECT 'Campaigns' as TableName, COUNT(*) as Count FROM Campaigns
UNION ALL
SELECT 'Products' as TableName, COUNT(*) as Count FROM Products;

-- Check specific users and campaigns
SELECT 'Users with Role=reseller' as Info, Id, Name, Email, Role FROM Users WHERE Role = 'reseller';
SELECT 'Campaigns' as Info, Id, Name, ManufacturerId FROM Campaigns;

-- First, let's add some sample orders using correct foreign keys
-- Using ResellerId = 101, 102 (from DummyData.cs) and assuming CampaignId = 1, 2 exist
INSERT INTO Orders (OrderNumber, ResellerId, CampaignId, TotalAmount, TotalPointsEarned, Status, ShippingAddress, Notes, OrderDate, ApprovedAt, ShippedAt, DeliveredAt)
VALUES 
    ('ORD-2024-001', 101, 1, 1500.00, 150, 'delivered', '123 Main Street, City Center, State 12345', 'First order from new reseller', '2024-01-15 10:30:00', '2024-01-15 14:00:00', '2024-01-16 09:00:00', '2024-01-18 15:30:00'),
    ('ORD-2024-002', 101, 1, 2200.00, 220, 'shipped', '456 Business Ave, Downtown, State 12345', 'Bulk order for retail store', '2024-01-20 11:45:00', '2024-01-20 16:30:00', '2024-01-21 08:00:00', NULL),
    ('ORD-2024-003', 102, 1, 1800.00, 180, 'approved', '789 Commerce St, Business District, State 12345', 'Regular monthly order', '2024-01-25 09:15:00', '2024-01-25 13:45:00', NULL, NULL),
    ('ORD-2024-004', 101, 1, 950.00, 95, 'pending', '321 Retail Blvd, Shopping Center, State 12345', 'Small order for testing', '2024-01-28 14:20:00', NULL, NULL, NULL),
    ('ORD-2024-005', 102, 1, 3200.00, 320, 'delivered', '654 Wholesale Rd, Industrial Area, State 12345', 'Large order for warehouse', '2024-02-01 08:00:00', '2024-02-01 12:00:00', '2024-02-02 07:30:00', '2024-02-05 11:00:00'),
    ('ORD-2024-006', 101, 1, 1200.00, 120, 'cancelled', '987 Market St, City Center, State 12345', 'Order cancelled due to stock issues', '2024-02-05 16:30:00', NULL, NULL, NULL),
    ('ORD-2024-007', 102, 1, 2800.00, 280, 'shipped', '147 Distribution Way, Logistics Park, State 12345', 'Express delivery requested', '2024-02-08 10:00:00', '2024-02-08 15:00:00', '2024-02-09 06:00:00', NULL),
    ('ORD-2024-008', 101, 1, 1600.00, 160, 'approved', '258 Trade Center, Business Hub, State 12345', 'Standard order processing', '2024-02-12 13:45:00', '2024-02-12 17:30:00', NULL, NULL);

-- Now let's add order items for each order using correct ProductIds (1-12 from DummyData.cs)
-- Order Items for ORD-2024-001
INSERT INTO OrderItems (OrderId, ProductId, Quantity, UnitPrice, TotalPrice, PointsEarned, CreatedAt)
VALUES 
    (1, 1, 5, 110.00, 550.00, 50, '2024-01-15 10:30:00'),
    (1, 2, 2, 120.00, 240.00, 24, '2024-01-15 10:30:00'),
    (1, 4, 10, 55.00, 550.00, 50, '2024-01-15 10:30:00'),
    (1, 7, 4, 35.00, 140.00, 16, '2024-01-15 10:30:00');

-- Order Items for ORD-2024-002
INSERT INTO OrderItems (OrderId, ProductId, Quantity, UnitPrice, TotalPrice, PointsEarned, CreatedAt)
VALUES 
    (2, 1, 8, 110.00, 880.00, 80, '2024-01-20 11:45:00'),
    (2, 3, 3, 80.00, 240.00, 24, '2024-01-20 11:45:00'),
    (2, 5, 15, 60.00, 900.00, 90, '2024-01-20 11:45:00'),
    (2, 8, 3, 55.00, 165.00, 18, '2024-01-20 11:45:00');

-- Order Items for ORD-2024-003
INSERT INTO OrderItems (OrderId, ProductId, Quantity, UnitPrice, TotalPrice, PointsEarned, CreatedAt)
VALUES 
    (3, 4, 20, 55.00, 1100.00, 100, '2024-01-25 09:15:00'),
    (3, 6, 10, 65.00, 650.00, 70, '2024-01-25 09:15:00'),
    (3, 9, 2, 85.00, 170.00, 16, '2024-01-25 09:15:00');

-- Order Items for ORD-2024-004
INSERT INTO OrderItems (OrderId, ProductId, Quantity, UnitPrice, TotalPrice, PointsEarned, CreatedAt)
VALUES 
    (4, 1, 3, 110.00, 330.00, 30, '2024-01-28 14:20:00'),
    (4, 2, 1, 120.00, 120.00, 12, '2024-01-28 14:20:00'),
    (4, 5, 5, 60.00, 300.00, 30, '2024-01-28 14:20:00'),
    (4, 7, 5, 35.00, 175.00, 20, '2024-01-28 14:20:00'),
    (4, 11, 1, 45.00, 45.00, 5, '2024-01-28 14:20:00');

-- Order Items for ORD-2024-005
INSERT INTO OrderItems (OrderId, ProductId, Quantity, UnitPrice, TotalPrice, PointsEarned, CreatedAt)
VALUES 
    (5, 4, 30, 55.00, 1650.00, 150, '2024-02-01 08:00:00'),
    (5, 6, 20, 65.00, 1300.00, 140, '2024-02-01 08:00:00'),
    (5, 10, 3, 90.00, 270.00, 30, '2024-02-01 08:00:00');

-- Order Items for ORD-2024-006 (Cancelled order - still has items for record keeping)
INSERT INTO OrderItems (OrderId, ProductId, Quantity, UnitPrice, TotalPrice, PointsEarned, CreatedAt)
VALUES 
    (6, 1, 4, 110.00, 440.00, 40, '2024-02-05 16:30:00'),
    (6, 3, 2, 80.00, 160.00, 16, '2024-02-05 16:30:00'),
    (6, 5, 8, 60.00, 480.00, 48, '2024-02-05 16:30:00'),
    (6, 8, 3, 55.00, 165.00, 18, '2024-02-05 16:30:00');

-- Order Items for ORD-2024-007
INSERT INTO OrderItems (OrderId, ProductId, Quantity, UnitPrice, TotalPrice, PointsEarned, CreatedAt)
VALUES 
    (7, 4, 25, 55.00, 1375.00, 125, '2024-02-08 10:00:00'),
    (7, 7, 10, 35.00, 350.00, 40, '2024-02-08 10:00:00'),
    (7, 9, 5, 85.00, 425.00, 40, '2024-02-08 10:00:00'),
    (7, 12, 8, 50.00, 400.00, 40, '2024-02-08 10:00:00'),
    (7, 11, 3, 45.00, 135.00, 15, '2024-02-08 10:00:00');

-- Order Items for ORD-2024-008
INSERT INTO OrderItems (OrderId, ProductId, Quantity, UnitPrice, TotalPrice, PointsEarned, CreatedAt)
VALUES 
    (8, 1, 6, 110.00, 660.00, 60, '2024-02-12 13:45:00'),
    (8, 2, 1, 120.00, 120.00, 12, '2024-02-12 13:45:00'),
    (8, 5, 8, 60.00, 480.00, 48, '2024-02-12 13:45:00'),
    (8, 7, 3, 35.00, 105.00, 12, '2024-02-12 13:45:00'),
    (8, 11, 2, 45.00, 90.00, 10, '2024-02-12 13:45:00'),
    (8, 12, 1, 50.00, 50.00, 5, '2024-02-12 13:45:00'),
    (8, 8, 1, 55.00, 55.00, 6, '2024-02-12 13:45:00'),
    (8, 10, 1, 90.00, 90.00, 9, '2024-02-12 13:45:00');

-- Verify the data was inserted correctly
SELECT 
    o.OrderNumber,
    o.Status,
    o.TotalAmount,
    o.TotalPointsEarned,
    COUNT(oi.Id) as ItemCount
FROM Orders o
LEFT JOIN OrderItems oi ON o.Id = oi.OrderId
GROUP BY o.Id, o.OrderNumber, o.Status, o.TotalAmount, o.TotalPointsEarned
ORDER BY o.OrderDate;

-- Show detailed order information
SELECT 
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