using System.Text;
using System.Text.Json;
using Application;
using Application.Common;
using Infrastructure;
using Infrastructure.Persistence;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;

var builder = WebApplication.CreateBuilder(args);

ConfigurationManager configuration = builder.Configuration;

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = "[jwt:issuer]",
            ValidAudience = "[jwt:audience]",
            IssuerSigningKey =
                new SymmetricSecurityKey(Encoding.UTF8.GetBytes("your-32-characters-long-secret-key-here"))
        };
    });

builder.Services.AddAuthorization();
builder.Services.AddControllers();

// Add SignalR
builder.Services.AddSignalR();

var connectionString = builder.Configuration.GetConnectionString("CoreConnection");
builder.Services.AddDbContext<CoreDbContext>(options =>
    options.UseMySql(connectionString, ServerVersion.AutoDetect(connectionString)));
builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseMySql(connectionString, ServerVersion.AutoDetect(connectionString)));

// Map the ICoreDbContext interface to the CoreDbContext implementation so MediatR handlers can resolve it
builder.Services.AddScoped<ICoreDbContext>(provider => provider.GetRequiredService<CoreDbContext>());
builder.Services.AddScoped<IApplicationDbContext>(provider => provider.GetRequiredService<ApplicationDbContext>());

builder.Services.AddHttpContextAccessor();
builder.Services.AddApplication();
builder.Services.AddInfrastructure(configuration);

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

// Global exception handling middleware
app.Use(async (context, next) =>
{
    try
    {
        await next();
    }
    catch (NotFoundException nfEx)
    {
        context.Response.StatusCode = StatusCodes.Status404NotFound;
        context.Response.ContentType = "application/json";
        var payload = JsonSerializer.Serialize(new { Status = "NotFound", Message = nfEx.Message });
        await context.Response.WriteAsync(payload);
    }
    catch (Exception ex)
    {
        var logger = context.RequestServices.GetService<ILogger<Program>>();
        logger?.LogError(ex, "Unhandled exception occurred while processing request.");
        context.Response.StatusCode = StatusCodes.Status500InternalServerError;
        context.Response.ContentType = "application/json";
        var payload = JsonSerializer.Serialize(new { Status = "Error", Message = "An internal server error occurred." });
        await context.Response.WriteAsync(payload);
    }
});

// Ensure database is created / migrations are applied on startup
using (var scope = app.Services.CreateScope())
{
    var services = scope.ServiceProvider;
    try
    {
        var context = services.GetRequiredService<CoreDbContext>();
        // Applies any pending migrations for the CoreDbContext to the database.
        // Will create the database if it does not already exist.
        context.Database.Migrate();

        // Apply migrations for ApplicationDbContext if it is registered
        var appContext = services.GetService<ApplicationDbContext>();
        if (appContext != null)
        {
            appContext.Database.Migrate();
        }
    }
    catch (Exception ex)
    {
        var logger = services.GetService<ILogger<Program>>();
        logger?.LogError(ex, "An error occurred while migrating or initializing the database.");
        throw;
    }
}

app.UseCors(options =>
{
    options
        .AllowAnyOrigin()
        .AllowAnyMethod()
        .AllowAnyHeader();
});

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();

app.UseStaticFiles();

app.UseAuthentication();

app.UseAuthorization();

app.MapControllers();

app.Run();