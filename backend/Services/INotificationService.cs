using backend.Models;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace backend.Services
{
    public interface INotificationService
    {
        Task CreateNotificationAsync(int userId, string message);
        Task<IEnumerable<Notification>> GetNotificationsAsync(int userId);
        Task MarkNotificationsAsReadAsync(int userId);
    }
}
