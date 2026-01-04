using Application.Common;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Application.Auth.Queries.GetCoreUser;

public class GetCoreUser : IRequest<object>
{
    public required string Email { get; set; }
}

public class GetCoreUserHandler : IRequestHandler<GetCoreUser, object>
{
    private readonly ICoreDbContext _coreDbContext;

    public GetCoreUserHandler(ICoreDbContext coreDbContext)
    {
        _coreDbContext = coreDbContext;
    }

    public async Task<object> Handle(GetCoreUser request, CancellationToken cancellationToken)
    {
        var coreUser = await _coreDbContext.CoreUsers.FirstOrDefaultAsync(
            cu => cu.Email == request.Email, cancellationToken);

        if (coreUser == null)
        {
            throw new NotFoundException($"Core user not found.");
        }

        // Map enum name and numeric value for the client
        var result = new
        {
            coreUser.Id,
            coreUser.Email,
            UserTypeName = coreUser.UserType?.ToString(),
            coreUser.Username,
            coreUser.Gender
        };

        return result;
    }
}