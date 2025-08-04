-- Check Database Data
-- This script checks what data exists before inserting orders

USE promotionalofferredemption;

-- Check table counts
SELECT '=== TABLE COUNTS ===' as Info;
SELECT 'Users' as TableName, COUNT(*) as Count FROM Users
UNION ALL
SELECT 'Campaigns' as TableName, COUNT(*) as Count FROM Campaigns  
UNION ALL
SELECT 'Products' as TableName, COUNT(*) as Count FROM Products
UNION ALL
SELECT 'Orders' as TableName, COUNT(*) as Count FROM Orders
UNION ALL
SELECT 'OrderItems' as TableName, COUNT(*) as Count FROM OrderItems;

-- Check users
SELECT '=== USERS ===' as Info;
SELECT Id, Name, Email, Role FROM Users ORDER BY Id;

-- Check campaigns
SELECT '=== CAMPAIGNS ===' as Info;
SELECT Id, Name, ManufacturerId FROM Campaigns ORDER BY Id;

-- Check products
SELECT '=== PRODUCTS ===' as Info;
SELECT Id, Name, Category, ResellerPrice FROM Products ORDER BY Id LIMIT 10;

-- Check if there are any reseller users
SELECT '=== RESELLER USERS ===' as Info;
SELECT Id, Name, Email, Role FROM Users WHERE Role = 'reseller';

-- Check if there are any manufacturer users
SELECT '=== MANUFACTURER USERS ===' as Info;
SELECT Id, Name, Email, Role FROM Users WHERE Role = 'manufacturer'; 