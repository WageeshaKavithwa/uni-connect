using Application.Common;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Application.Auth.Queries.GetUser;

public class GetUser : IRequest<object>
{
    public required string Email { get; set; }
}

public class GetUserHandler (IApplicationDbContext dbContext) : IRequestHandler<GetUser, object>
{
    public async Task<object> Handle(GetUser request, CancellationToken cancellationToken)
    {
        var user = await dbContext.Users
            .FirstOrDefaultAsync(u => u.Email == request.Email, cancellationToken);

        if (user == null)
        {
            throw new NotFoundException("User not found");
        }
        
        var result = new
        {
            user.Id,
            user.Email,
            UserTypeName = user.UserType?.ToString(),
            user.Username,
            user.Gender
        };

        return result;
    }
}