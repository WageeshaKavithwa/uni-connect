using Application.Common;
using Domain.Core;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Persistence;

public class CoreDbContext : DbContext, ICoreDbContext
{
    public CoreDbContext(DbContextOptions<CoreDbContext> options) : base(options) { }
    
    public DbSet<CoreUsers> CoreUsers { get; set; }
}