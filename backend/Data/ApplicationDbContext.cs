// Data/ApplicationDbContext.cs
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using backend.Models;
using PromotionalOfferRedemption.Models;

namespace backend.Data
{
    public class ApplicationDbContext : DbContext
    {
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
            : base(options)
        {
        }

        public DbSet<User> Users { get; set; }
        public DbSet<Offer> Offers { get; set; }
        public DbSet<OfferRedemption> OfferRedemptions { get; set; }
        public DbSet<Points> Points { get; set; }
        public DbSet<PointsHistory> PointsHistory { get; set; }
        public DbSet<Reward> Rewards { get; set; }
        public DbSet<RewardRedemption> RewardRedemptions { get; set; }
        
        protected override void OnModelCreating(ModelBuilder builder)
        {
            base.OnModelCreating(builder);
            
            // User configuration
            builder.Entity<User>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.HasIndex(e => e.Email).IsUnique();
                entity.Property(e => e.Role).HasConversion<string>();
            });
            
            // Offer configuration
            builder.Entity<Offer>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.HasOne(d => d.Manufacturer)
                      .WithMany(p => p.Offers)
                      .HasForeignKey(d => d.ManufacturerId)
                      .OnDelete(DeleteBehavior.Restrict);
            });
            
            // OfferRedemption configuration
            builder.Entity<OfferRedemption>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.HasIndex(e => e.RedemptionCode).IsUnique();
                entity.Property(e => e.Status).HasConversion<string>();
                
                entity.HasOne(d => d.Offer)
                      .WithMany(p => p.OfferRedemptions)
                      .HasForeignKey(d => d.OfferId)
                      .OnDelete(DeleteBehavior.Cascade);
                      
                entity.HasOne(d => d.User)
                      .WithMany(p => p.OfferRedemptions)
                      .HasForeignKey(d => d.UserId)
                      .OnDelete(DeleteBehavior.Cascade);
            });

            // Configure Points entity
            builder.Entity<Points>()
                .HasOne(p => p.User)
                .WithOne()
                .HasForeignKey<Points>(p => p.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            // Configure PointsHistory entity
            builder.Entity<PointsHistory>()
                .HasOne(p => p.User)
                .WithMany()
                .HasForeignKey(p => p.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            // Configure RewardRedemption entity
            builder.Entity<RewardRedemption>()
                .HasOne(r => r.User)
                .WithMany()
                .HasForeignKey(r => r.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            builder.Entity<RewardRedemption>()
                .HasOne(r => r.Reward)
                .WithMany()
                .HasForeignKey(r => r.RewardId)
                .OnDelete(DeleteBehavior.Restrict);

            // Seed some initial rewards
            builder.Entity<Reward>().HasData(
                new Reward
                {
                    Id = 1,
                    Name = "$5 Gift Card",
                    Points = 500,
                    Category = "gift-cards",
                    Image = "💳",
                    Available = true,
                    Description = "Get a $5 gift card to use at any participating store"
                },
                new Reward
                {
                    Id = 2,
                    Name = "$10 Gift Card",
                    Points = 1000,
                    Category = "gift-cards",
                    Image = "💳",
                    Available = true,
                    Description = "Get a $10 gift card to use at any participating store"
                },
                new Reward
                {
                    Id = 3,
                    Name = "Free Coffee",
                    Points = 150,
                    Category = "food",
                    Image = "☕",
                    Available = true,
                    Description = "Enjoy a free coffee at any participating café"
                },
                new Reward
                {
                    Id = 4,
                    Name = "Free Burger",
                    Points = 300,
                    Category = "food",
                    Image = "🍔",
                    Available = true,
                    Description = "Get a free burger at any participating restaurant"
                },
                new Reward
                {
                    Id = 5,
                    Name = "20% Off Coupon",
                    Points = 200,
                    Category = "discounts",
                    Image = "🎟️",
                    Available = true,
                    Description = "Get 20% off your next purchase"
                },
                new Reward
                {
                    Id = 6,
                    Name = "Free Movie Ticket",
                    Points = 800,
                    Category = "entertainment",
                    Image = "🎬",
                    Available = true,
                    Description = "Enjoy a free movie ticket at any participating theater"
                },
                new Reward
                {
                    Id = 7,
                    Name = "Premium Subscription (1 month)",
                    Points = 1500,
                    Category = "subscriptions",
                    Image = "⭐",
                    Available = true,
                    Description = "Get one month of premium subscription"
                },
                new Reward
                {
                    Id = 8,
                    Name = "$25 Gift Card",
                    Points = 2500,
                    Category = "gift-cards",
                    Image = "💳",
                    Available = true,
                    Description = "Get a $25 gift card to use at any participating store"
                }
            );
        }
    }
}