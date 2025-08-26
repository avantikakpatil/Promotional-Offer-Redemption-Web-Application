using backend.Models;

namespace backend.Services
{
    public interface INotificationService
    {
        Task<Notification> GetNotificationByIdAsync(int id, int userId);
        Task CreateNotificationAsync(int userId, string message);
        Task<IEnumerable<Notification>> GetNotificationsAsync(int userId);
        Task MarkNotificationsAsReadAsync(int userId);
        Task DeleteNotificationAsync(int id, int userId);
        Task DeleteAllNotificationsAsync(int userId);
    }
}