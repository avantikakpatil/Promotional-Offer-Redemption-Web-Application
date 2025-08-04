-- Populate CampaignEligibleProducts table with sample data
-- This script creates eligible products for the existing campaigns

-- First, let's check what campaigns and products we have
SELECT 'Campaigns:' as info;
SELECT id, name, manufacturer_id FROM campaigns;

SELECT 'Campaign Products:' as info;
SELECT id, name, manufacturer_id, points_per_unit, base_price FROM campaign_products;

-- Insert eligible products for the Good Friday 2025 campaign (assuming campaign_id = 1)
INSERT INTO campaign_eligible_products (campaign_id, campaign_product_id, point_cost, redemption_limit, is_active) VALUES
(1, 1, 50, 100, true),   -- Premium Rice - 50 points cost, limit 100
(1, 2, 30, 200, true),   -- Organic Wheat - 30 points cost, limit 200
(1, 3, 40, 150, true),   -- Pure Honey - 40 points cost, limit 150
(1, 4, 25, 300, true),   -- Fresh Milk - 25 points cost, limit 300
(1, 5, 35, 180, true);   -- Natural Oil - 35 points cost, limit 180

-- Insert eligible products for the Summer Sale 2025 campaign (assuming campaign_id = 2)
INSERT INTO campaign_eligible_products (campaign_id, campaign_product_id, point_cost, redemption_limit, is_active) VALUES
(2, 6, 60, 80, true),    -- Premium Tea - 60 points cost, limit 80
(2, 7, 45, 120, true),   -- Organic Coffee - 45 points cost, limit 120
(2, 8, 55, 90, true),    -- Natural Spices - 55 points cost, limit 90
(2, 9, 40, 150, true),   -- Fresh Fruits - 40 points cost, limit 150
(2, 10, 50, 100, true);  -- Healthy Snacks - 50 points cost, limit 100

-- Insert eligible products for the Diwali Special 2025 campaign (assuming campaign_id = 3)
INSERT INTO campaign_eligible_products (campaign_id, campaign_product_id, point_cost, redemption_limit, is_active) VALUES
(3, 11, 70, 60, true),   -- Premium Sweets - 70 points cost, limit 60
(3, 12, 65, 70, true),   -- Traditional Snacks - 65 points cost, limit 70
(3, 13, 80, 50, true),   -- Gift Hampers - 80 points cost, limit 50
(3, 14, 55, 100, true),  -- Dry Fruits - 55 points cost, limit 100
(3, 15, 60, 80, true);   -- Festive Items - 60 points cost, limit 80

-- Verify the data
SELECT 'Campaign Eligible Products:' as info;
SELECT 
    cep.id,
    c.name as campaign_name,
    cp.name as product_name,
    cep.point_cost,
    cep.redemption_limit,
    cep.is_active
FROM campaign_eligible_products cep
JOIN campaigns c ON cep.campaign_id = c.id
JOIN campaign_products cp ON cep.campaign_product_id = cp.id
ORDER BY c.name, cp.name;

-- Show summary
SELECT 
    c.name as campaign_name,
    COUNT(cep.id) as eligible_products_count,
    SUM(cep.redemption_limit) as total_redemption_limit
FROM campaigns c
LEFT JOIN campaign_eligible_products cep ON c.id = cep.campaign_id
GROUP BY c.id, c.name
ORDER BY c.name; 