using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using backend.Models;

namespace backend.Data
{
    public class ApplicationDbContext : DbContext
    {
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
            : base(options)
        {
        }

        public DbSet<User> Users { get; set; }
        public DbSet<Campaign> Campaigns { get; set; }
        public DbSet<RewardTier> RewardTiers { get; set; }
        public DbSet<QRCode> QRCodes { get; set; }
        public DbSet<RedemptionHistory> RedemptionHistories { get; set; }
        public DbSet<UserPoints> UserPoints { get; set; }
        
        // B2B Models
        public DbSet<Product> Products { get; set; }
        public DbSet<Order> Orders { get; set; }
        public DbSet<OrderItem> OrderItems { get; set; }
        public DbSet<Voucher> Vouchers { get; set; }
        public DbSet<CampaignReseller> CampaignResellers { get; set; }
        public DbSet<CampaignEligibleProduct> CampaignEligibleProducts { get; set; }

        protected override void OnModelCreating(ModelBuilder builder)
        {
            base.OnModelCreating(builder);

            // Configure User entity
            builder.Entity<User>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Email).IsRequired().HasMaxLength(255);
                entity.Property(e => e.Name).IsRequired().HasMaxLength(255);
                entity.HasIndex(e => e.Email).IsUnique();
                entity.Property(e => e.Role).HasConversion<string>();
                
                // B2B relationships
                entity.HasOne(e => e.AssignedManufacturer)
                      .WithMany(e => e.AssignedResellers)
                      .HasForeignKey(e => e.AssignedManufacturerId)
                      .OnDelete(DeleteBehavior.SetNull);
                      
                entity.HasOne(e => e.AssignedReseller)
                      .WithMany(e => e.AssignedShopkeepers)
                      .HasForeignKey(e => e.AssignedResellerId)
                      .OnDelete(DeleteBehavior.SetNull);
            });

            // Configure Campaign entity
            builder.Entity<Campaign>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Name).IsRequired().HasMaxLength(255);
                entity.Property(e => e.ProductType).IsRequired().HasMaxLength(100);
                entity.Property(e => e.Description).IsRequired().HasMaxLength(1000);
                entity.Property(e => e.TargetAudience).HasMaxLength(500);
                entity.Property(e => e.Budget).HasColumnType("decimal(18,2)");
                entity.Property(e => e.MinimumOrderValue).HasColumnType("decimal(18,2)");
                entity.Property(e => e.MaximumOrderValue).HasColumnType("decimal(18,2)");
                
                // Fix: Use TIMESTAMP instead of DATETIME for better MySQL compatibility
                entity.Property(e => e.CreatedAt)
                    .HasColumnType("timestamp(6)")
                    .HasDefaultValueSql("CURRENT_TIMESTAMP(6)")
                    .ValueGeneratedOnAdd();

                entity.Property(e => e.UpdatedAt)
                    .HasColumnType("timestamp(6)")
                    .ValueGeneratedOnAddOrUpdate();

                // Configure relationship with User (Manufacturer)
                entity.HasOne(e => e.Manufacturer)
                      .WithMany()
                      .HasForeignKey(e => e.ManufacturerId)
                      .OnDelete(DeleteBehavior.Cascade);

                // Configure relationship with RewardTiers
                entity.HasMany(e => e.RewardTiers)
                      .WithOne(e => e.Campaign)
                      .HasForeignKey(e => e.CampaignId)
                      .OnDelete(DeleteBehavior.Cascade);
                      
                // Configure relationship with CampaignResellers
                entity.HasMany(e => e.CampaignResellers)
                      .WithOne(e => e.Campaign)
                      .HasForeignKey(e => e.CampaignId)
                      .OnDelete(DeleteBehavior.Cascade);
            });

            // Configure RewardTier entity
            builder.Entity<RewardTier>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Reward).IsRequired().HasMaxLength(500);
                
                // Fix: Use TIMESTAMP for RewardTier as well
                entity.Property(e => e.CreatedAt)
                    .HasColumnType("timestamp(6)")
                    .HasDefaultValueSql("CURRENT_TIMESTAMP(6)")
                    .ValueGeneratedOnAdd();

                // Configure relationship with Campaign
                entity.HasOne(e => e.Campaign)
                      .WithMany(e => e.RewardTiers)
                      .HasForeignKey(e => e.CampaignId)
                      .OnDelete(DeleteBehavior.Cascade);

                // Create unique index for campaign-threshold combination
                entity.HasIndex(e => new { e.CampaignId, e.Threshold })
                      .IsUnique()
                      .HasDatabaseName("IX_RewardTiers_CampaignId_Threshold");
            });

            // Configure Product entity
            builder.Entity<Product>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Name).IsRequired().HasMaxLength(255);
                entity.Property(e => e.Description).HasMaxLength(1000);
                entity.Property(e => e.Category).IsRequired().HasMaxLength(100);
                entity.Property(e => e.SKU).HasMaxLength(50);
                entity.Property(e => e.Brand).HasMaxLength(100);
                entity.Property(e => e.BasePrice).HasColumnType("decimal(18,2)");
                entity.Property(e => e.ResellerPrice).HasColumnType("decimal(18,2)");
                entity.Property(e => e.RetailPrice).HasColumnType("decimal(18,2)");
                
                entity.Property(e => e.CreatedAt)
                    .HasColumnType("timestamp(6)")
                    .HasDefaultValueSql("CURRENT_TIMESTAMP(6)")
                    .ValueGeneratedOnAdd();

                entity.Property(e => e.UpdatedAt)
                    .HasColumnType("timestamp(6)")
                    .ValueGeneratedOnAddOrUpdate();

                // Configure relationship with User (Manufacturer)
                entity.HasOne(e => e.Manufacturer)
                      .WithMany()
                      .HasForeignKey(e => e.ManufacturerId)
                      .OnDelete(DeleteBehavior.Cascade);
            });

            // Configure Order entity
            builder.Entity<Order>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.OrderNumber).IsRequired().HasMaxLength(50);
                entity.Property(e => e.Status).IsRequired().HasMaxLength(50);
                entity.Property(e => e.ShippingAddress).HasMaxLength(500);
                entity.Property(e => e.Notes).HasMaxLength(500);
                entity.Property(e => e.TotalAmount).HasColumnType("decimal(18,2)");
                
                entity.Property(e => e.OrderDate)
                    .HasColumnType("timestamp(6)")
                    .HasDefaultValueSql("CURRENT_TIMESTAMP(6)")
                    .ValueGeneratedOnAdd();

                entity.Property(e => e.ApprovedAt).HasColumnType("timestamp(6)");
                entity.Property(e => e.ShippedAt).HasColumnType("timestamp(6)");
                entity.Property(e => e.DeliveredAt).HasColumnType("timestamp(6)");

                // Configure relationships
                entity.HasOne(e => e.Reseller)
                      .WithMany()
                      .HasForeignKey(e => e.ResellerId)
                      .OnDelete(DeleteBehavior.Cascade);
                      
                entity.HasOne(e => e.Campaign)
                      .WithMany()
                      .HasForeignKey(e => e.CampaignId)
                      .OnDelete(DeleteBehavior.Cascade);
                      
                entity.HasMany(e => e.OrderItems)
                      .WithOne(e => e.Order)
                      .HasForeignKey(e => e.OrderId)
                      .OnDelete(DeleteBehavior.Cascade);
            });

            // Configure OrderItem entity
            builder.Entity<OrderItem>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.UnitPrice).HasColumnType("decimal(18,2)");
                entity.Property(e => e.TotalPrice).HasColumnType("decimal(18,2)");

                // Configure relationships
                entity.HasOne(e => e.Order)
                      .WithMany(e => e.OrderItems)
                      .HasForeignKey(e => e.OrderId)
                      .OnDelete(DeleteBehavior.Cascade);
                      
                entity.HasOne(e => e.Product)
                      .WithMany()
                      .HasForeignKey(e => e.ProductId)
                      .OnDelete(DeleteBehavior.Cascade);
            });

            // Configure Voucher entity
            builder.Entity<Voucher>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.VoucherCode).IsRequired().HasMaxLength(50);
                entity.Property(e => e.EligibleProducts).HasMaxLength(500);
                entity.Property(e => e.Value).HasColumnType("decimal(18,2)");
                
                entity.Property(e => e.CreatedAt)
                    .HasColumnType("timestamp(6)")
                    .HasDefaultValueSql("CURRENT_TIMESTAMP(6)")
                    .ValueGeneratedOnAdd();

                entity.Property(e => e.ExpiryDate).HasColumnType("timestamp(6)");
                entity.Property(e => e.RedeemedAt).HasColumnType("timestamp(6)");

                // Configure relationships
                entity.HasOne(e => e.Reseller)
                      .WithMany()
                      .HasForeignKey(e => e.ResellerId)
                      .OnDelete(DeleteBehavior.Cascade);
                      
                entity.HasOne(e => e.Campaign)
                      .WithMany()
                      .HasForeignKey(e => e.CampaignId)
                      .OnDelete(DeleteBehavior.Cascade);
                      
                entity.HasOne(e => e.RedeemedByShopkeeper)
                      .WithMany()
                      .HasForeignKey(e => e.RedeemedByShopkeeperId)
                      .OnDelete(DeleteBehavior.SetNull);
            });

            // Configure CampaignReseller entity
            builder.Entity<CampaignReseller>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.TotalOrderValue).HasColumnType("decimal(18,2)");
                
                entity.Property(e => e.CreatedAt)
                    .HasColumnType("timestamp(6)")
                    .HasDefaultValueSql("CURRENT_TIMESTAMP(6)")
                    .ValueGeneratedOnAdd();

                entity.Property(e => e.UpdatedAt).HasColumnType("timestamp(6)");
                entity.Property(e => e.ApprovedAt).HasColumnType("timestamp(6)");

                // Configure relationships
                entity.HasOne(e => e.Campaign)
                      .WithMany(e => e.CampaignResellers)
                      .HasForeignKey(e => e.CampaignId)
                      .OnDelete(DeleteBehavior.Cascade);
                      
                entity.HasOne(e => e.Reseller)
                      .WithMany()
                      .HasForeignKey(e => e.ResellerId)
                      .OnDelete(DeleteBehavior.Cascade);
                      
                entity.HasOne(e => e.ApprovedBy)
                      .WithMany()
                      .HasForeignKey(e => e.ApprovedByUserId)
                      .OnDelete(DeleteBehavior.SetNull);
            });

            // Configure QRCode entity for B2B
            builder.Entity<QRCode>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Code).IsRequired().HasMaxLength(255);
                
                entity.Property(e => e.CreatedAt)
                    .HasColumnType("timestamp(6)")
                    .HasDefaultValueSql("CURRENT_TIMESTAMP(6)")
                    .ValueGeneratedOnAdd();

                entity.Property(e => e.UpdatedAt).HasColumnType("timestamp(6)");
                entity.Property(e => e.ExpiryDate).HasColumnType("timestamp(6)");
                entity.Property(e => e.RedeemedAt).HasColumnType("timestamp(6)");

                // Configure relationships
                entity.HasOne(e => e.Campaign)
                      .WithMany()
                      .HasForeignKey(e => e.CampaignId)
                      .OnDelete(DeleteBehavior.Cascade);
                      
                entity.HasOne(e => e.Reseller)
                      .WithMany()
                      .HasForeignKey(e => e.ResellerId)
                      .OnDelete(DeleteBehavior.SetNull);
                      
                entity.HasOne(e => e.Voucher)
                      .WithMany()
                      .HasForeignKey(e => e.VoucherId)
                      .OnDelete(DeleteBehavior.SetNull);
                      
                entity.HasOne(e => e.RedeemedByShopkeeper)
                      .WithMany()
                      .HasForeignKey(e => e.RedeemedByShopkeeperId)
                      .OnDelete(DeleteBehavior.SetNull);
                      
                entity.HasOne(e => e.RedeemedByUser)
                      .WithMany()
                      .HasForeignKey(e => e.RedeemedByUserId)
                      .OnDelete(DeleteBehavior.SetNull);
            });

            // Configure RedemptionHistory entity for B2B
            builder.Entity<RedemptionHistory>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.QRCode).IsRequired().HasMaxLength(255);
                entity.Property(e => e.RedeemedProducts).HasMaxLength(500);
                entity.Property(e => e.RedemptionValue).HasColumnType("decimal(18,2)");
                entity.Property(e => e.RedemptionType).HasMaxLength(100);
                
                entity.Property(e => e.RedeemedAt)
                    .HasColumnType("timestamp(6)")
                    .HasDefaultValueSql("CURRENT_TIMESTAMP(6)")
                    .ValueGeneratedOnAdd();

                // Configure relationships
                entity.HasOne(e => e.User)
                      .WithMany()
                      .HasForeignKey(e => e.UserId)
                      .OnDelete(DeleteBehavior.Cascade);
                      
                entity.HasOne(e => e.Reseller)
                      .WithMany()
                      .HasForeignKey(e => e.ResellerId)
                      .OnDelete(DeleteBehavior.SetNull);
                      
                entity.HasOne(e => e.Shopkeeper)
                      .WithMany()
                      .HasForeignKey(e => e.ShopkeeperId)
                      .OnDelete(DeleteBehavior.SetNull);
                      
                entity.HasOne(e => e.Voucher)
                      .WithMany()
                      .HasForeignKey(e => e.VoucherId)
                      .OnDelete(DeleteBehavior.SetNull);
            });

            // Configure indexes for better performance
            builder.Entity<Campaign>()
                .HasIndex(e => e.ManufacturerId)
                .HasDatabaseName("IX_Campaigns_ManufacturerId");

            builder.Entity<Campaign>()
                .HasIndex(e => e.IsActive)
                .HasDatabaseName("IX_Campaigns_IsActive");

            builder.Entity<Campaign>()
                .HasIndex(e => new { e.StartDate, e.EndDate })
                .HasDatabaseName("IX_Campaigns_DateRange");

            builder.Entity<Campaign>()
                .HasIndex(e => e.ProductType)
                .HasDatabaseName("IX_Campaigns_ProductType");
                
            builder.Entity<Product>()
                .HasIndex(e => e.ManufacturerId)
                .HasDatabaseName("IX_Products_ManufacturerId");
                
            builder.Entity<Product>()
                .HasIndex(e => e.Category)
                .HasDatabaseName("IX_Products_Category");
                
            builder.Entity<Order>()
                .HasIndex(e => e.ResellerId)
                .HasDatabaseName("IX_Orders_ResellerId");
                
            builder.Entity<Order>()
                .HasIndex(e => e.CampaignId)
                .HasDatabaseName("IX_Orders_CampaignId");
                
            builder.Entity<Voucher>()
                .HasIndex(e => e.VoucherCode)
                .IsUnique()
                .HasDatabaseName("IX_Vouchers_VoucherCode");
                
            builder.Entity<Voucher>()
                .HasIndex(e => e.ResellerId)
                .HasDatabaseName("IX_Vouchers_ResellerId");
                
            builder.Entity<CampaignReseller>()
                .HasIndex(e => new { e.CampaignId, e.ResellerId })
                .IsUnique()
                .HasDatabaseName("IX_CampaignResellers_CampaignId_ResellerId");
        }
    }
}