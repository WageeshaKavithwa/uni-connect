using Application.Common;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Application.Auth.Queries.GetUser;

public class GetAllUsers : IRequest<List<UserDto>>{}

public class GetAllUsersHandler(IApplicationDbContext dbContext) : IRequestHandler<GetAllUsers, List<UserDto>>
{
    public async Task<List<UserDto>> Handle(GetAllUsers request, CancellationToken cancellationToken)
    {
        var users = await dbContext.Users
            .Select(u => new UserDto
            {
                Id = u.Id,
                Username = u.Username
            })
            .ToListAsync(cancellationToken);

        return users;
    }
}
public class UserDto
{
    public int Id { get; set; }
    public string? Username { get; set; }
}