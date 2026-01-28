using Application.Common;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Application.Chat.Queries;

public class CheckChatExists : IRequest<bool>
{
    public int User1Id { get; set; }
    public int User2Id { get; set; }
}

public class CheckChatExistsHandler (IApplicationDbContext dbContext) : IRequestHandler<CheckChatExists, bool>
{
    public async Task<bool> Handle(CheckChatExists request, CancellationToken cancellationToken)
    {
        return await dbContext.Conversations.AnyAsync(c => 
            (c.User1 == request.User1Id && c.User2 == request.User2Id) || 
            (c.User1 == request.User2Id && c.User2 == request.User1Id), 
            cancellationToken);
    }
}