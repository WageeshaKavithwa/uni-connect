using Application.Common;
using Domain.System;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Persistence;

public class ApplicationDbContext : DbContext, IApplicationDbContext
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
        : base(options)
    {
    }
    
    public DbSet<Users> Users { get; set; }
    public DbSet<Posts> Posts { get; set; }
    public DbSet<Items> Items { get; set; }
    public DbSet<Conversations> Conversations { get; set; }
    public DbSet<ChatMessages> ChatMessages { get; set; }
    public DbSet<Events> Events { get; set; }
}