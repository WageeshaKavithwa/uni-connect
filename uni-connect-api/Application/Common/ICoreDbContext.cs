using Domain.Core;
using Microsoft.EntityFrameworkCore;

namespace Application.Common;

public interface ICoreDbContext
{
    DbSet<CoreUsers> CoreUsers { get; set; }
    
    #region Methods

    Task<int> SaveChangesAsync(CancellationToken cancellationToken);

    #endregion
}