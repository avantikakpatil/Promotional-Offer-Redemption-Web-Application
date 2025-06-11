// Services/IAuthService.cs
using backend.Models.DTOs;

namespace backend.Services
{
    public interface IAuthService
    {
        Task<LoginResponseDto?> LoginAsync(LoginDto loginDto);
        Task<LoginResponseDto?> RegisterAsync(RegisterDto registerDto);
    }
}