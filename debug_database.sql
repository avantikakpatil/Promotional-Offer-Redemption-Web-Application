-- Debug Database Data
-- This script helps identify why the order insertion is failing

-- 1. Check if tables exist and their structure
SELECT 'Checking table structure...' as Info;

-- 2. Check Users table
SELECT '=== USERS TABLE ===' as Info;
SELECT Id, Name, Email, Role FROM Users ORDER BY Id;

-- 3. Check Campaigns table  
SELECT '=== CAMPAIGNS TABLE ===' as Info;
SELECT Id, Name, ManufacturerId, IsActive FROM Campaigns ORDER BY Id;

-- 4. Check Products table
SELECT '=== PRODUCTS TABLE ===' as Info;
SELECT Id, Name, Category, ResellerPrice, ManufacturerId FROM Products ORDER BY Id;

-- 5. Check if Orders table has any data
SELECT '=== ORDERS TABLE ===' as Info;
SELECT COUNT(*) as OrderCount FROM Orders;

-- 6. Check if OrderItems table has any data
SELECT '=== ORDERITEMS TABLE ===' as Info;
SELECT COUNT(*) as OrderItemCount FROM OrderItems;

-- 7. Check for specific reseller users (IDs 101, 102)
SELECT '=== CHECKING RESELLER USERS ===' as Info;
SELECT Id, Name, Email, Role FROM Users WHERE Id IN (101, 102) OR Role = 'reseller';

-- 8. Check for campaigns with ID 1
SELECT '=== CHECKING CAMPAIGNS ===' as Info;
SELECT Id, Name, ManufacturerId, IsActive FROM Campaigns WHERE Id = 1;

-- 9. Check for products with IDs 1-12
SELECT '=== CHECKING PRODUCTS ===' as Info;
SELECT Id, Name, Category, ResellerPrice FROM Products WHERE Id BETWEEN 1 AND 12;

-- 10. Show table row counts
SELECT '=== TABLE ROW COUNTS ===' as Info;
SELECT 'Users' as TableName, COUNT(*) as Count FROM Users
UNION ALL
SELECT 'Campaigns' as TableName, COUNT(*) as Count FROM Campaigns  
UNION ALL
SELECT 'Products' as TableName, COUNT(*) as Count FROM Products
UNION ALL
SELECT 'Orders' as TableName, COUNT(*) as Count FROM Orders
UNION ALL
SELECT 'OrderItems' as TableName, COUNT(*) as Count FROM OrderItems; 