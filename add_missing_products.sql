-- Add missing products to the products table for voucher redemption
INSERT INTO products (Id, Name, Description, Category, SKU, Brand, BasePrice, ResellerPrice, RetailPrice, PointsPerUnit, IsActive, ManufacturerId, CreatedAt, UpdatedAt) VALUES
(4, 'Aloo Bhujia', 'Crispy potato snack', 'Namkeen', 'NMK001', 'Haldiram', 60.00, 55.00, 70.00, 5, 1, 1, NOW(), NOW()),
(5, 'Moong Dal', 'Crunchy moong dal snack', 'Namkeen', 'NMK002', 'Haldiram', 65.00, 60.00, 75.00, 6, 1, 1, NOW(), NOW()); 