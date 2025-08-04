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
        // Removed QRCodes DbSet (single-table QR code system)
        public DbSet<RedemptionHistory> RedemptionHistories { get; set; }
        public DbSet<UserPoints> UserPoints { get; set; }
        public DbSet<CampaignEligibleProduct> CampaignEligibleProducts { get; set; }
        public DbSet<CampaignVoucherProduct> CampaignVoucherProducts { get; set; }
        public DbSet<Product> Products { get; set; }
        public DbSet<Voucher> Vouchers { get; set; }
        public DbSet<CampaignReseller> CampaignResellers { get; set; }
        public DbSet<CampaignProduct> CampaignProducts { get; set; }
        public DbSet<RewardTier> RewardTiers { get; set; }
        public DbSet<CampaignPoints> CampaignPoints { get; set; }
        public DbSet<TempOrderPoints> TempOrderPoints { get; set; }

        protected override void OnModelCreating(ModelBuilder builder)
        {
            base.OnModelCreating(builder);

            // Configure User entity
            builder.Entity<User>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Name).IsRequired().HasMaxLength(255);
                entity.Property(e => e.Email).IsRequired().HasMaxLength(255);
                entity.Property(e => e.Phone).IsRequired().HasMaxLength(20);
                entity.Property(e => e.PasswordHash).IsRequired();
                entity.Property(e => e.Role).IsRequired().HasMaxLength(50);
                entity.Property(e => e.BusinessName).HasMaxLength(255);
                entity.Property(e => e.BusinessAddress).HasMaxLength(500);
                entity.Property(e => e.BusinessLicense).HasMaxLength(100);
                entity.Property(e => e.GSTNumber).HasMaxLength(20);
                
                entity.Property(e => e.CreatedAt)
                    .HasColumnType("timestamp(6)")
                    .HasDefaultValueSql("CURRENT_TIMESTAMP(6)")
                    .ValueGeneratedOnAdd();

                entity.Property(e => e.UpdatedAt)
                    .HasColumnType("timestamp(6)")
                    .ValueGeneratedOnAddOrUpdate();

                // Create unique index for email
                entity.HasIndex(e => e.Email).IsUnique();

                // Configure self-referencing relationships
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
                      
                // Configure relationship with CampaignResellers
                entity.HasMany(e => e.CampaignResellers)
                      .WithOne(e => e.Campaign)
                      .HasForeignKey(e => e.CampaignId)
                      .OnDelete(DeleteBehavior.Cascade);

                // Configure relationship with CampaignEligibleProducts
                entity.HasMany(e => e.EligibleProducts)
                      .WithOne(e => e.Campaign)
                      .HasForeignKey(e => e.CampaignId)
                      .OnDelete(DeleteBehavior.Cascade);
                      
                // Configure relationship with CampaignVoucherProducts
                entity.HasMany(e => e.VoucherProducts)
                      .WithOne(e => e.Campaign)
                      .HasForeignKey(e => e.CampaignId)
                      .OnDelete(DeleteBehavior.Cascade);
            });

            // Configure CampaignEligibleProduct entity
            builder.Entity<CampaignEligibleProduct>(entity =>
            {
                entity.HasKey(e => e.Id);
                
                // Configure relationships
                entity.HasOne(e => e.Campaign)
                      .WithMany(e => e.EligibleProducts)
                      .HasForeignKey(e => e.CampaignId)
                      .OnDelete(DeleteBehavior.Cascade);
                
                entity.HasOne(e => e.CampaignProduct)
                      .WithMany()
                      .HasForeignKey(e => e.CampaignProductId)
                      .OnDelete(DeleteBehavior.Cascade);
            });

            // Configure CampaignVoucherProduct entity
            builder.Entity<CampaignVoucherProduct>(entity =>
            {
                entity.HasKey(e => e.Id);
                
                // Configure relationships
                entity.HasOne(e => e.Campaign)
                      .WithMany(e => e.VoucherProducts)
                      .HasForeignKey(e => e.CampaignId)
                      .OnDelete(DeleteBehavior.Cascade);
                      
                entity.HasOne(e => e.Product)
                      .WithMany()
                      .HasForeignKey(e => e.ProductId)
                      .OnDelete(DeleteBehavior.Cascade);
            });

            // Configure CampaignProduct entity
            builder.Entity<CampaignProduct>(entity =>
            {
                entity.ToTable("campaignproducts"); // Map to the correct table name
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Name).IsRequired().HasMaxLength(255);
                entity.Property(e => e.Category).HasMaxLength(100);
                entity.Property(e => e.SKU).HasMaxLength(50);
                entity.Property(e => e.Brand).HasMaxLength(100);
                entity.Property(e => e.BasePrice).HasColumnType("decimal(18,2)");
                entity.Property(e => e.CreatedAt)
                    .HasColumnType("timestamp(6)")
                    .HasDefaultValueSql("CURRENT_TIMESTAMP(6)")
                    .ValueGeneratedOnAdd();
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

            // Configure RewardTier entity
            builder.Entity<RewardTier>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Threshold).IsRequired();
                entity.Property(e => e.Reward).IsRequired().HasMaxLength(500);
                
                entity.Property(e => e.CreatedAt)
                    .HasColumnType("timestamp(6)")
                    .HasDefaultValueSql("CURRENT_TIMESTAMP(6)")
                    .ValueGeneratedOnAdd();

                // Configure relationship with Campaign
                entity.HasOne(e => e.Campaign)
                      .WithMany(e => e.RewardTiers)
                      .HasForeignKey(e => e.CampaignId)
                      .OnDelete(DeleteBehavior.Cascade);
            });

            // Configure CampaignPoints entity
            builder.Entity<CampaignPoints>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.TotalPointsEarned).IsRequired();
                entity.Property(e => e.PointsUsedForVouchers).IsRequired();
                entity.Property(e => e.AvailablePoints).IsRequired();
                entity.Property(e => e.TotalOrderValue).HasColumnType("decimal(18,2)");
                entity.Property(e => e.TotalVoucherValueGenerated).HasColumnType("decimal(18,2)");
                
                entity.Property(e => e.CreatedAt)
                    .HasColumnType("timestamp(6)")
                    .HasDefaultValueSql("CURRENT_TIMESTAMP(6)")
                    .ValueGeneratedOnAdd();

                entity.Property(e => e.UpdatedAt).HasColumnType("timestamp(6)");
                entity.Property(e => e.LastVoucherGeneratedAt).HasColumnType("timestamp(6)");

                // Configure relationships
                entity.HasOne(e => e.Campaign)
                      .WithMany()
                      .HasForeignKey(e => e.CampaignId)
                      .OnDelete(DeleteBehavior.Cascade);
                      
                entity.HasOne(e => e.Reseller)
                      .WithMany()
                      .HasForeignKey(e => e.ResellerId)
                      .OnDelete(DeleteBehavior.Cascade);

                // Create unique index for CampaignId + ResellerId combination
                entity.HasIndex(e => new { e.CampaignId, e.ResellerId })
                      .IsUnique()
                      .HasDatabaseName("IX_CampaignPoints_CampaignId_ResellerId");
            });

            // Removed QRCode entity configuration (single-table QR code system)

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
            // TempOrderPoints configuration
            builder.Entity<TempOrderPoints>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.TotalAmount).HasColumnType("decimal(18,2)");
                entity.Property(e => e.Date).IsRequired();
                entity.Property(e => e.ResellerId).IsRequired();
                entity.Property(e => e.CampaignId).IsRequired();

                // Relationships
                entity.HasOne(e => e.Reseller)
                      .WithMany()
                      .HasForeignKey(e => e.ResellerId)
                      .OnDelete(DeleteBehavior.Restrict);

                entity.HasOne(e => e.Campaign)
                      .WithMany()
                      .HasForeignKey(e => e.CampaignId)
                      .OnDelete(DeleteBehavior.Restrict);
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