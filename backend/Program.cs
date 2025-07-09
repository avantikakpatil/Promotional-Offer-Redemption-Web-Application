using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using backend.Data;
using backend.Services;
using backend.Helpers;
using Microsoft.OpenApi.Models;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();

// Configure Swagger with JWT support
builder.Services.AddSwaggerGen(options =>
{
    options.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "Promotional Offer Redemption API",
        Version = "v1"
    });
    
    // Configure JWT authentication in Swagger
    options.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Description = "JWT Authorization header using the Bearer scheme. Example: \"Authorization: Bearer {token}\"",
        Name = "Authorization",
        In = ParameterLocation.Header,
        Type = SecuritySchemeType.ApiKey,
        Scheme = "Bearer"
    });

    options.AddSecurityRequirement(new OpenApiSecurityRequirement()
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id = "Bearer"
                },
                Scheme = "oauth2",
                Name = "Bearer",
                In = ParameterLocation.Header,
            },
            new List<string>()
        }
    });
});

// Configure CORS with enhanced settings for React frontend
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowReactApp", policy =>
    {
        policy.WithOrigins(
                // Development origins
                "http://localhost:3000",
                "https://localhost:3000",
                "http://localhost:3001",
                "https://localhost:3001",
                "http://localhost:5173",
                "https://localhost:5173",
                "http://localhost:5174",
                "https://localhost:5174",
                // Add production origins here when deploying
                "http://127.0.0.1:3000",
                "https://127.0.0.1:3000"
            )
            .AllowAnyMethod()
            .AllowAnyHeader()
            .AllowCredentials()
            .SetIsOriginAllowedToAllowWildcardSubdomains(); // Allow wildcard subdomains if needed
    });

    // Alternative policy for development (less restrictive)
    options.AddPolicy("AllowAll", policy =>
    {
        policy.AllowAnyOrigin()
            .AllowAnyMethod()
            .AllowAnyHeader();
        // Note: Cannot use AllowCredentials() with AllowAnyOrigin()
    });
});

// Configure Entity Framework with MySQL
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");

// Validate connection string
if (string.IsNullOrEmpty(connectionString))
{
    throw new InvalidOperationException("Connection string 'DefaultConnection' not found.");
}

builder.Services.AddDbContext<ApplicationDbContext>(options =>
{
    options.UseMySql(connectionString, ServerVersion.AutoDetect(connectionString));
    
    // Add logging for development
    if (builder.Environment.IsDevelopment())
    {
        options.EnableSensitiveDataLogging();
        options.LogTo(Console.WriteLine, LogLevel.Information);
    }
});

// Configure JWT settings with validation
var jwtKey = builder.Configuration["Jwt:Key"];
var jwtIssuer = builder.Configuration["Jwt:Issuer"];
var jwtAudience = builder.Configuration["Jwt:Audience"];

// Validate JWT configuration
if (string.IsNullOrEmpty(jwtKey) || string.IsNullOrEmpty(jwtIssuer) || string.IsNullOrEmpty(jwtAudience))
{
    throw new InvalidOperationException("JWT configuration is incomplete. Please check Jwt:Key, Jwt:Issuer, and Jwt:Audience in appsettings.json");
}

// Configure JWT Authentication
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = jwtIssuer,
            ValidAudience = jwtAudience,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey))
        };

        // Enhanced JWT error handling
        options.Events = new JwtBearerEvents
        {
            OnAuthenticationFailed = context =>
            {
                if (context.Exception.GetType() == typeof(SecurityTokenExpiredException))
                {
                    context.Response.Headers["Token-Expired"] = "true";
                }
                return Task.CompletedTask;
            }
        };
    });

// Register services
builder.Services.AddScoped<JwtHelper>();
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<IUserService, UserService>();
builder.Services.AddScoped<ICampaignService, CampaignService>();
builder.Services.AddScoped<IQRCodeService, QRCodeService>();

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(c =>
    {
        c.SwaggerEndpoint("/swagger/v1/swagger.json", "Promotional Offer Redemption API V1");
        c.RoutePrefix = string.Empty; // Swagger UI available at root URL
    });
}

app.UseHttpsRedirection();

// Use CORS (Order is CRITICAL - must be before Authentication and Authorization)
if (app.Environment.IsDevelopment())
{
    // Use more permissive CORS in development
    app.UseCors("AllowReactApp");
}
else
{
    // Use stricter CORS in production
    app.UseCors("AllowReactApp");
}

// Use Authentication & Authorization (Order matters!)
app.UseAuthentication();
app.UseAuthorization();

// Add middleware to log CORS requests in development
if (app.Environment.IsDevelopment())
{
    app.Use(async (context, next) =>
    {
        var logger = context.RequestServices.GetRequiredService<ILogger<Program>>();
        
        // Log incoming request origin
        var origin = context.Request.Headers["Origin"].FirstOrDefault();
        if (!string.IsNullOrEmpty(origin))
        {
            logger.LogInformation($"CORS Request from origin: {origin}");
        }
        
        // Log preflight requests
        if (context.Request.Method == "OPTIONS")
        {
            logger.LogInformation($"CORS Preflight request: {context.Request.Method} {context.Request.Path}");
        }
        
        await next();
        
        // Log response headers
        var accessControlAllowOrigin = context.Response.Headers["Access-Control-Allow-Origin"].FirstOrDefault();
        if (!string.IsNullOrEmpty(accessControlAllowOrigin))
        {
            logger.LogInformation($"CORS Response Allow-Origin: {accessControlAllowOrigin}");
        }
    });
}

app.MapControllers();

// Ensure database is created and migrated (Enhanced error handling)
using (var scope = app.Services.CreateScope())
{
    var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
    var logger = scope.ServiceProvider.GetRequiredService<ILogger<Program>>();
    
    try
    {
        logger.LogInformation("Testing database connection...");
        
        // Test database connection
        await context.Database.CanConnectAsync();
        logger.LogInformation("Database connection successful.");
        
        // Create database if it doesn't exist
        var created = await context.Database.EnsureCreatedAsync();
        if (created)
        {
            logger.LogInformation("Database created successfully.");
        }
        else
        {
            logger.LogInformation("Database already exists.");
        }
        
        // Uncomment the line below if you want to automatically apply migrations
        // await context.Database.MigrateAsync();
    }
    catch (Exception ex)
    {
        logger.LogError(ex, "An error occurred while setting up the database: {Message}", ex.Message);
        
        // Log more specific database connection issues
        if (ex.Message.Contains("Unknown database") || ex.Message.Contains("database does not exist"))
        {
            logger.LogError("Database does not exist. Please create the database first or check your connection string.");
        }
        else if (ex.Message.Contains("Access denied"))
        {
            logger.LogError("Database access denied. Please check your database credentials.");
        }
        else if (ex.Message.Contains("Unable to connect"))
        {
            logger.LogError("Unable to connect to database server. Please check if MySQL server is running and accessible.");
        }
        
        // Don't throw the exception in production, just log it
        if (app.Environment.IsDevelopment())
        {
            throw;
        }
    }
}

// Log the URLs the app is listening on
var appLogger = app.Services.GetRequiredService<ILogger<Program>>();
appLogger.LogInformation("Application starting...");



app.Run();