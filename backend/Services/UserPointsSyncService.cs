using System;
using System.Linq;
using System.Threading.Tasks;
using backend.Data;
using backend.Models;
using Microsoft.EntityFrameworkCore;

namespace backend.Services
{
    public class UserPointsSyncService
    {
        private readonly ApplicationDbContext _context;
        public UserPointsSyncService(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<int> SyncUserPointsWithRedemptionHistoryAsync()
        {
            // Get all users who have redemption history
            var userIds = await _context.RedemptionHistories
                .Select(rh => rh.UserId)
                .Distinct()
                .ToListAsync();

            int updatedCount = 0;
            foreach (var userId in userIds)
            {
                var totalPoints = await _context.RedemptionHistories
                    .Where(rh => rh.UserId == userId)
                    .SumAsync(rh => rh.Points);

                var userPoints = await _context.UserPoints.FirstOrDefaultAsync(up => up.UserId == userId);
                if (userPoints == null)
                {
                    userPoints = new UserPoints
                    {
                        UserId = userId,
                        Points = totalPoints,
                        RedeemedPoints = 0,
                        LastUpdated = DateTime.UtcNow
                    };
                    _context.UserPoints.Add(userPoints);
                }
                else
                {
                    userPoints.Points = totalPoints;
                    userPoints.LastUpdated = DateTime.UtcNow;
                }
                updatedCount++;
            }
            await _context.SaveChangesAsync();
            return updatedCount;
        }
    }
} 