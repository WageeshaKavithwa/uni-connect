using Application.Common;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Application.Chat.Queries;

public class GetUnreadChats : IRequest<object>
{
    public int UserId { get; set; }
}

public class GetUnreadChatsHandler (IApplicationDbContext dbContext) : IRequestHandler<GetUnreadChats, object>
{
    public async Task<object> Handle(GetUnreadChats request, CancellationToken cancellationToken)
    {
        var chatIds = await dbContext.Conversations
            .Where(c => c.User1 == request.UserId || c.User2 == request.UserId)
            .Select(c => new
            {
                c.Id
            })
            .ToListAsync(cancellationToken);
        
        var unreadCount = 0;

        foreach (var chatId in chatIds)
        {
            var unreadMessagesCount = await dbContext.ChatMessages
                .Where(m => m.ConversationId == chatId.Id && m.Sender != request.UserId && !m.IsRead)
                .CountAsync(cancellationToken);
            unreadCount += unreadMessagesCount;
        }

        return unreadCount;
    }
}