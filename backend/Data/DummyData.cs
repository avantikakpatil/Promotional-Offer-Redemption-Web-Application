using System;
using System.Collections.Generic;
using backend.Models;

namespace backend.Data
{
    public static class DummyData
    {
        // Dummy categories for Haldiram
        public static List<string> Categories = new List<string>
        {
            "Sweets",
            "Namkeen",
            "Beverages",
            "Ready-to-Eat",
            "Bakery"
        };

        // Dummy products for Haldiram
        public static List<Product> Products = new List<Product>
        {
            // Sweets
            new Product { Id = 1, Name = "Rasgulla", Category = "Sweets", SKU = "SWT001", Brand = "Haldiram", BasePrice = 120, ResellerPrice = 110, RetailPrice = 140, PointsPerUnit = 10, ManufacturerId = 1 },
            new Product { Id = 2, Name = "Gulab Jamun", Category = "Sweets", SKU = "SWT002", Brand = "Haldiram", BasePrice = 130, ResellerPrice = 120, RetailPrice = 150, PointsPerUnit = 12, ManufacturerId = 1 },
            new Product { Id = 3, Name = "Soan Papdi", Category = "Sweets", SKU = "SWT003", Brand = "Haldiram", BasePrice = 90, ResellerPrice = 80, RetailPrice = 100, PointsPerUnit = 8, ManufacturerId = 1 },
            // Namkeen
            new Product { Id = 4, Name = "Aloo Bhujia", Category = "Namkeen", SKU = "NMK001", Brand = "Haldiram", BasePrice = 60, ResellerPrice = 55, RetailPrice = 70, PointsPerUnit = 5, ManufacturerId = 1 },
            new Product { Id = 5, Name = "Moong Dal", Category = "Namkeen", SKU = "NMK002", Brand = "Haldiram", BasePrice = 65, ResellerPrice = 60, RetailPrice = 75, PointsPerUnit = 6, ManufacturerId = 1 },
            new Product { Id = 6, Name = "Khatta Meetha", Category = "Namkeen", SKU = "NMK003", Brand = "Haldiram", BasePrice = 70, ResellerPrice = 65, RetailPrice = 80, PointsPerUnit = 7, ManufacturerId = 1 },
            // Beverages
            new Product { Id = 7, Name = "Aam Panna", Category = "Beverages", SKU = "BEV001", Brand = "Haldiram", BasePrice = 40, ResellerPrice = 35, RetailPrice = 50, PointsPerUnit = 4, ManufacturerId = 1 },
            new Product { Id = 8, Name = "Thandai", Category = "Beverages", SKU = "BEV002", Brand = "Haldiram", BasePrice = 60, ResellerPrice = 55, RetailPrice = 70, PointsPerUnit = 6, ManufacturerId = 1 },
            // Ready-to-Eat
            new Product { Id = 9, Name = "Rajma Chawal", Category = "Ready-to-Eat", SKU = "RTE001", Brand = "Haldiram", BasePrice = 90, ResellerPrice = 85, RetailPrice = 100, PointsPerUnit = 8, ManufacturerId = 1 },
            new Product { Id = 10, Name = "Dal Makhani", Category = "Ready-to-Eat", SKU = "RTE002", Brand = "Haldiram", BasePrice = 95, ResellerPrice = 90, RetailPrice = 110, PointsPerUnit = 9, ManufacturerId = 1 },
            // Bakery
            new Product { Id = 11, Name = "Atta Cookies", Category = "Bakery", SKU = "BKY001", Brand = "Haldiram", BasePrice = 50, ResellerPrice = 45, RetailPrice = 60, PointsPerUnit = 5, ManufacturerId = 1 },
            new Product { Id = 12, Name = "Jeera Biscuit", Category = "Bakery", SKU = "BKY002", Brand = "Haldiram", BasePrice = 55, ResellerPrice = 50, RetailPrice = 65, PointsPerUnit = 5, ManufacturerId = 1 }
        };

        // Dummy resellers
        public static List<User> Resellers = new List<User>
        {
            new User { Id = 101, Name = "Reseller One", Email = "reseller1@example.com", Phone = "1234567890", PasswordHash = "hash1", Role = "reseller" },
            new User { Id = 102, Name = "Reseller Two", Email = "reseller2@example.com", Phone = "1234567891", PasswordHash = "hash2", Role = "reseller" }
        };

        // All code referencing Order and OrderItem has been removed. Add dummy data for TempOrderPoints if needed.
    }
} 