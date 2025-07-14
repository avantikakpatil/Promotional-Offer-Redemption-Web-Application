// Controllers/AuthController.cs
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using backend.Models;
using backend.Data;
using System.Security.Cryptography;
using System.Text;
using Microsoft.AspNetCore.Authorization;
using System.IdentityModel.Tokens.Jwt;
using Microsoft.IdentityModel.Tokens;
using System.Security.Claims;

namespace backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly IConfiguration _configuration;

        public AuthController(ApplicationDbContext context, IConfiguration configuration)
        {
            _context = context;
            _configuration = configuration;
        }

        [HttpGet("health")]
        public async Task<IActionResult> HealthCheck()
        {
            try
            {
                // Test database connection
                var userCount = await _context.Users.CountAsync();
                
                // Test JWT configuration
                var jwtKey = _configuration["Jwt:Key"];
                var jwtIssuer = _configuration["Jwt:Issuer"];
                var jwtAudience = _configuration["Jwt:Audience"];
                
                return Ok(new
                {
                    status = "healthy",
                    database = "connected",
                    userCount = userCount,
                    jwtConfigured = !string.IsNullOrEmpty(jwtKey) && !string.IsNullOrEmpty(jwtIssuer) && !string.IsNullOrEmpty(jwtAudience),
                    timestamp = DateTime.UtcNow
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    status = "unhealthy",
                    error = ex.Message,
                    timestamp = DateTime.UtcNow
                });
            }
        }

        [HttpPost("signup")]
        public async Task<IActionResult> Signup([FromBody] SignupRequest request)
        {
            try
            {
                if (await _context.Users.AnyAsync(u => u.Email == request.Email))
                {
                    return BadRequest("Email already exists");
                }

                var user = new User
                {
                    Name = request.Name,
                    Email = request.Email,
                    Phone = request.Phone,
                    Role = request.Role,
                    PasswordHash = HashPassword(request.Password),
                    CreatedAt = DateTime.UtcNow
                };

                _context.Users.Add(user);
                await _context.SaveChangesAsync();

                var token = GenerateJwtToken(user);

                return Ok(new
                {
                    token,
                    user = new
                    {
                        id = user.Id,
                        name = user.Name,
                        email = user.Email,
                        role = user.Role,
                        points = user.Points
                    }
                });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Signup error: {ex.Message}");
                return StatusCode(500, new { error = "Internal server error during signup", details = ex.Message });
            }
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginRequest request)
        {
            try
            {
                if (request == null)
                {
                    return BadRequest("Request body is null");
                }

                if (string.IsNullOrEmpty(request.Email) || string.IsNullOrEmpty(request.Password))
                {
                    return BadRequest("Email and password are required");
                }

                var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == request.Email);

                if (user == null)
                {
                    return Unauthorized("Invalid email or password");
                }

                if (!VerifyPassword(request.Password, user.PasswordHash))
                {
                    return Unauthorized("Invalid email or password");
                }

                user.LastLoginAt = DateTime.UtcNow;
                await _context.SaveChangesAsync();

                var token = GenerateJwtToken(user);

                return Ok(new
                {
                    token,
                    user = new
                    {
                        id = user.Id,
                        name = user.Name,
                        email = user.Email,
                        role = user.Role,
                        points = user.Points
                    }
                });
            }
            catch (Exception ex)
            {
                // Log the exception details
                Console.WriteLine($"Login error: {ex.Message}");
                Console.WriteLine($"Stack trace: {ex.StackTrace}");
                return StatusCode(500, new { error = "Internal server error during login", details = ex.Message });
            }
        }

        [HttpPost("google/signup")]
        public async Task<IActionResult> GoogleSignUp([FromBody] GoogleAuthRequest request)
        {
            try
            {
                // Check if user already exists
                var existingUser = await _context.Users.FirstOrDefaultAsync(u => u.Email == request.Email);

                if (existingUser != null)
                {
                    // User exists, update last login and return token
                    existingUser.LastLoginAt = DateTime.UtcNow;
                    await _context.SaveChangesAsync();

                    var token = GenerateJwtToken(existingUser);

                    return Ok(new
                    {
                        token,
                        user = new
                        {
                            id = existingUser.Id,
                            name = existingUser.Name,
                            email = existingUser.Email,
                            role = existingUser.Role,
                            points = existingUser.Points
                        }
                    });
                }

                // Create new user for Google signup
                var newUser = new User
                {
                    Name = request.Name,
                    Email = request.Email,
                    Role = "customer", // Always customer for Google signup
                    Phone = "", // Google doesn't provide phone
                    PasswordHash = "GOOGLE_AUTH", // Special marker for Google-authenticated users
                    CreatedAt = DateTime.UtcNow,
                    LastLoginAt = DateTime.UtcNow
                };

                _context.Users.Add(newUser);
                await _context.SaveChangesAsync();

                var newToken = GenerateJwtToken(newUser);

                return Ok(new
                {
                    token = newToken,
                    user = new
                    {
                        id = newUser.Id,
                        name = newUser.Name,
                        email = newUser.Email,
                        role = newUser.Role,
                        points = newUser.Points
                    }
                });
            }
            catch (Exception ex)
            {
                return BadRequest($"Google signup failed: {ex.Message}");
            }
        }

        [HttpPost("google")]
        public async Task<IActionResult> GoogleAuth([FromBody] GoogleAuthRequest request)
        {
            try
            {
                // Check if user already exists
                var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == request.Email);

                if (user == null)
                {
                    // Create new user for Google authentication
                    user = new User
                    {
                        Name = request.Name,
                        Email = request.Email,
                        Role = "customer", // Always customer for Google auth
                        Phone = "", // Google doesn't provide phone
                        PasswordHash = "GOOGLE_AUTH", // Special marker for Google-authenticated users
                        CreatedAt = DateTime.UtcNow,
                        LastLoginAt = DateTime.UtcNow
                    };
                    _context.Users.Add(user);
                }
                else
                {
                    // Update existing user's last login
                    user.LastLoginAt = DateTime.UtcNow;
                }

                await _context.SaveChangesAsync();

                var token = GenerateJwtToken(user);

                return Ok(new
                {
                    token,
                    user = new
                    {
                        id = user.Id,
                        name = user.Name,
                        email = user.Email,
                        role = user.Role,
                        points = user.Points
                    }
                });
            }
            catch (Exception ex)
            {
                return BadRequest($"Google authentication failed: {ex.Message}");
            }
        }

        [HttpGet("roles")]
        public IActionResult GetRoles()
        {
            return Ok(new
            {
                roles = new[] { "manufacturer", "reseller", "shopkeeper", "customer" }
            });
        }

        private string GenerateJwtToken(User user)
        {
            try
            {
                var jwtKey = _configuration["Jwt:Key"];
                var jwtIssuer = _configuration["Jwt:Issuer"];
                var jwtAudience = _configuration["Jwt:Audience"];

                if (string.IsNullOrEmpty(jwtKey))
                {
                    throw new InvalidOperationException("JWT Key is not configured");
                }

                if (string.IsNullOrEmpty(jwtIssuer))
                {
                    throw new InvalidOperationException("JWT Issuer is not configured");
                }

                if (string.IsNullOrEmpty(jwtAudience))
                {
                    throw new InvalidOperationException("JWT Audience is not configured");
                }

                var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey));
                var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

                var claims = new[]
                {
                    new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
                    new Claim(ClaimTypes.Email, user.Email),
                    new Claim(ClaimTypes.Role, user.Role)
                };

                var token = new JwtSecurityToken(
                    issuer: jwtIssuer,
                    audience: jwtAudience,
                    claims: claims,
                    expires: DateTime.UtcNow.AddDays(7),
                    signingCredentials: credentials
                );

                return new JwtSecurityTokenHandler().WriteToken(token);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"JWT Token generation error: {ex.Message}");
                throw;
            }
        }

        private string HashPassword(string password)
        {
            using (var sha256 = SHA256.Create())
            {
                var hashedBytes = sha256.ComputeHash(Encoding.UTF8.GetBytes(password));
                return Convert.ToBase64String(hashedBytes);
            }
        }

        private bool VerifyPassword(string password, string hash)
        {
            return HashPassword(password) == hash;
        }
    }

    public class SignupRequest
    {
        public string Name { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Phone { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
        public string Role { get; set; } = string.Empty;
    }

    public class LoginRequest
    {
        public string Email { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
    }

    public class GoogleAuthRequest
    {
        public string Name { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Role { get; set; } = string.Empty;
        public string GoogleToken { get; set; } = string.Empty;
    }
} 