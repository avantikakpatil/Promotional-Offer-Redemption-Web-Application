using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace backend.Services
{
    public class VoucherGenerationBackgroundService : BackgroundService
    {
        private readonly IServiceProvider _serviceProvider;
        private readonly ILogger<VoucherGenerationBackgroundService> _logger;
        private readonly TimeSpan _checkInterval = TimeSpan.FromMinutes(30); // Check every 30 minutes

        public VoucherGenerationBackgroundService(
            IServiceProvider serviceProvider,
            ILogger<VoucherGenerationBackgroundService> logger)
        {
            _serviceProvider = serviceProvider;
            _logger = logger;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            // _logger.LogInformation("Voucher Generation Background Service started");

            // while (!stoppingToken.IsCancellationRequested)
            // {
            //     try
            //     {
            //         await CheckAndGenerateVouchersAsync();
            //     }
            //     catch (Exception ex)
            //     {
            //         _logger.LogError(ex, "Error in voucher generation background service");
            //     }

            //     await Task.Delay(_checkInterval, stoppingToken);
            // }
        }

        private async Task CheckAndGenerateVouchersAsync()
        {
            using var scope = _serviceProvider.CreateScope();
            var voucherGenerationService = scope.ServiceProvider.GetRequiredService<IVoucherGenerationService>();
            
            await voucherGenerationService.CheckAndGenerateVouchersAsync();
        }
    }
} 