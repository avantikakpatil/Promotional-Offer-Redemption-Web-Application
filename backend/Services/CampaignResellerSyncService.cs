using System;
using System.Linq;
using System.Threading.Tasks;
using backend.Data;
using backend.Models;
using Microsoft.EntityFrameworkCore;

namespace backend.Services
{
    public class CampaignResellerSyncService
    {
        private readonly ApplicationDbContext _context;
        
        public CampaignResellerSyncService(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<int> AddMissingCampaignResellersAsync()
        {
            // Get all resellers (users with role "reseller")
            var resellers = await _context.Users
                .Where(u => u.Role == "reseller")
                .ToListAsync();

            // Get all active campaigns
            var campaigns = await _context.Campaigns
                .Where(c => c.IsActive)
                .ToListAsync();

            int addedCount = 0;
            
            foreach (var reseller in resellers)
            {
                foreach (var campaign in campaigns)
                {
                    // Check if CampaignReseller entry already exists
                    var existing = await _context.CampaignResellers
                        .FirstOrDefaultAsync(cr => cr.CampaignId == campaign.Id && cr.ResellerId == reseller.Id);
                    
                    if (existing == null)
                    {
                        // Create new CampaignReseller entry
                        var campaignReseller = new CampaignReseller
                        {
                            CampaignId = campaign.Id,
                            ResellerId = reseller.Id,
                            IsApproved = true, // Auto-approve for existing resellers
                            ApprovedAt = DateTime.UtcNow,
                            CreatedAt = DateTime.UtcNow,
                            UpdatedAt = DateTime.UtcNow
                        };
                        
                        _context.CampaignResellers.Add(campaignReseller);
                        addedCount++;
                        
                        Console.WriteLine($"[SYNC] Added CampaignReseller: Reseller {reseller.Email} -> Campaign {campaign.Name}");
                    }
                }
            }
            
            await _context.SaveChangesAsync();
            return addedCount;
        }

        public async Task<int> AddCampaignResellerForEmailAsync(string email, int campaignId, bool isApproved = true)
        {
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == email);
            if (user == null)
            {
                Console.WriteLine($"[SYNC] User with email {email} not found");
                return 0;
            }

            if (user.Role != "reseller")
            {
                Console.WriteLine($"[SYNC] User {email} is not a reseller (role: {user.Role})");
                return 0;
            }

            var campaign = await _context.Campaigns.FirstOrDefaultAsync(c => c.Id == campaignId);
            if (campaign == null)
            {
                Console.WriteLine($"[SYNC] Campaign with ID {campaignId} not found");
                return 0;
            }

            // Check if entry already exists
            var existing = await _context.CampaignResellers
                .FirstOrDefaultAsync(cr => cr.CampaignId == campaignId && cr.ResellerId == user.Id);
            
            if (existing != null)
            {
                Console.WriteLine($"[SYNC] CampaignReseller entry already exists for {email} in campaign {campaignId}");
                return 0;
            }

            // Create new CampaignReseller entry
            var campaignReseller = new CampaignReseller
            {
                CampaignId = campaignId,
                ResellerId = user.Id,
                IsApproved = isApproved,
                ApprovedAt = isApproved ? DateTime.UtcNow : null,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };
            
            _context.CampaignResellers.Add(campaignReseller);
            await _context.SaveChangesAsync();
            
            Console.WriteLine($"[SYNC] Added CampaignReseller: {email} -> Campaign {campaign.Name} (ID: {campaignId})");
            return 1;
        }
    }
} 