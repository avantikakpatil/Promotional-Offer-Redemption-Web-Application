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
        }
    }
}