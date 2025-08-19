using System.Net;
using System.Net.Mail;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace backend.Services
{
    public class EmailService : IEmailService
    {
        private readonly IConfiguration _configuration;
        private readonly ILogger<EmailService> _logger;

        public EmailService(IConfiguration configuration, ILogger<EmailService> logger)
        {
            _configuration = configuration;
            _logger = logger;
        }

        public async Task SendEmailAsync(string toEmail, string subject, string htmlBody)
        {
            var host = _configuration["Smtp:Host"];
            var port = int.Parse(_configuration["Smtp:Port"] ?? "587");
            var username = _configuration["Smtp:Username"];
            var password = _configuration["Smtp:Password"];
            var from = _configuration["Smtp:From"] ?? username;
            var enableSsl = bool.Parse(_configuration["Smtp:EnableSsl"] ?? "true");

            if (string.IsNullOrWhiteSpace(host) || string.IsNullOrWhiteSpace(username) || string.IsNullOrWhiteSpace(password))
            {
                _logger.LogWarning("SMTP not configured. Emails will not be sent. Configure Smtp:Host, Username, and Password.");
                return;
            }

            try
            {
                _logger.LogInformation("Sending email via {Host}:{Port} (SSL: {EnableSsl}) to {ToEmail} with subject '{Subject}'", host, port, enableSsl, toEmail, subject);

                using var client = new SmtpClient(host, port)
                {
                    Credentials = new NetworkCredential(username, password),
                    EnableSsl = enableSsl
                };

                var mail = new MailMessage(from!, toEmail)
                {
                    Subject = subject,
                    Body = htmlBody,
                    IsBodyHtml = true
                };

                await client.SendMailAsync(mail);
                _logger.LogInformation("Email sent successfully to {ToEmail}", toEmail);
            }
            catch (SmtpException ex)
            {
                _logger.LogError(ex, "SMTP error while sending email to {ToEmail}: {Message}", toEmail, ex.Message);
                throw;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Unexpected error while sending email to {ToEmail}: {Message}", toEmail, ex.Message);
                throw;
            }
        }
    }
}


