using backend.Services;
using Microsoft.Extensions.DependencyInjection;

public static class ServiceRegistration
{
    public static void AddCustomServices(this IServiceCollection services)
    {
        // ...existing code...
        services.AddScoped<IQRCodeService, QRCodeService>();
        // ...existing code...
    }
}
