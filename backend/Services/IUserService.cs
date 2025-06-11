// Services/IUserService.cs
using backend.Models.DTOs;

namespace backend.Services
{
    public interface IUserService
    {
        Task<UserDto?> GetUserByIdAsync(int id);
        Task<IEnumerable<UserDto>> GetAllUsersAsync();
    }
}