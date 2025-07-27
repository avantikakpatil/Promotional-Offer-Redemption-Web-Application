-- Populate campaign_products table with data from DummyData.cs
INSERT INTO campaign_products (Name, Category, SKU, Brand, BasePrice, PointsPerUnit, ManufacturerId, CreatedAt) VALUES
-- Sweets
('Rasgulla', 'Sweets', 'SWT001', 'Haldiram', 120.00, 10, 1, NOW()),
('Gulab Jamun', 'Sweets', 'SWT002', 'Haldiram', 130.00, 12, 1, NOW()),
('Soan Papdi', 'Sweets', 'SWT003', 'Haldiram', 90.00, 8, 1, NOW()),

-- Namkeen
('Aloo Bhujia', 'Namkeen', 'NMK001', 'Haldiram', 60.00, 5, 1, NOW()),
('Moong Dal', 'Namkeen', 'NMK002', 'Haldiram', 65.00, 6, 1, NOW()),
('Khatta Meetha', 'Namkeen', 'NMK003', 'Haldiram', 70.00, 7, 1, NOW()),

-- Beverages
('Aam Panna', 'Beverages', 'BEV001', 'Haldiram', 40.00, 4, 1, NOW()),
('Thandai', 'Beverages', 'BEV002', 'Haldiram', 60.00, 6, 1, NOW()),

-- Ready-to-Eat
('Rajma Chawal', 'Ready-to-Eat', 'RTE001', 'Haldiram', 90.00, 8, 1, NOW()),
('Dal Makhani', 'Ready-to-Eat', 'RTE002', 'Haldiram', 95.00, 9, 1, NOW()),

-- Bakery
('Atta Cookies', 'Bakery', 'BKY001', 'Haldiram', 50.00, 5, 1, NOW()),
('Jeera Biscuit', 'Bakery', 'BKY002', 'Haldiram', 55.00, 5, 1, NOW()); 