using Infrastructure.Persistence;
using Microsoft.AspNetCore.Mvc;
using Domain.Core;
using Domain.Enums;
using Microsoft.EntityFrameworkCore;
using System.Linq;
using Domain.System;

namespace API.Controllers;

[ApiController]
public class SeedController : ControllerBase
{
    private readonly CoreDbContext _dbContext;
    private readonly ApplicationDbContext _appDbContext;

    public SeedController(CoreDbContext dbContext, ApplicationDbContext applicationDbContext)
    {
        _dbContext = dbContext;
        _appDbContext = applicationDbContext;
    }

    [HttpPost("api/seed-database")]
    public async Task<IActionResult> SeedDatabase()
    {
        try
        {
            // If there are already users, skip seeding
            if (await _dbContext.CoreUsers.AnyAsync())
            {
                return Ok(new
                {
                    StatusCode = "200",
                    Status = "Skipped",
                    Message = "Database already contains CoreUsers. Seeding skipped."
                });
            }

            var users = new List<CoreUsers>();

            var sampleEmails = new[]
            {
                "alice.smith@gmail.com",
                "bob.johnson@yahoo.com",
                "charles.lee@outlook.com",
                "danielle.kumar@university.edu",
                "elaine.wilson@college.edu",
                "frank.martin@school.edu",
                "grace.chen@gmail.com",
                "harry.patel@hotmail.com",
                "isabel.garcia@uni.edu",
                "jason.nguyen@gmail.com"
            };

            for (int i = 0; i < sampleEmails.Length; i++)
            {
                // Build a readable name from the email local part (e.g. "alice.smith" -> "Alice Smith")
                var localPart = sampleEmails[i].Split('@')[0];
                var nameParts = localPart.Split('.', '_');
                var displayName = string.Join(" ",
                    nameParts.Select(p => string.IsNullOrWhiteSpace(p) ? p : char.ToUpper(p[0]) + p.Substring(1)));

                users.Add(new CoreUsers
                {
                    Email = sampleEmails[i],
                    Username = displayName,
                    // Alternate types so both Student and Instructor records are created
                    UserType = ((i + 1) % 2 == 0) ? UserTypes.Student : UserTypes.Instructor,
                    // Alternate genders so the seeded data has both Male and Female values
                    Gender = (i % 2 == 0) ? "Female" : "Male"
                });
            }

            await _dbContext.CoreUsers.AddRangeAsync(users);
            await _dbContext.SaveChangesAsync();

            return Ok(new
            {
                StatusCode = "200",
                Status = "Success",
                Message = "Database seeded successfully with 10 CoreUsers."
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new
            {
                StatusCode = "500",
                Status = "Error",
                Message = $"An error occurred while seeding the database: {ex.Message}"
            });
        }
    }
}