using Application.Common;
using Domain.System;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Application.Chat.Commands;

public class StartChatCommand : IRequest<object>
{
    public int User1 { get; set; }
    public int User2 { get; set; }
}

public class StartChatCommandHandler (IApplicationDbContext dbContext) : IRequestHandler<StartChatCommand, object>
{
    public async Task<object> Handle(StartChatCommand request, CancellationToken cancellationToken)
    {
        var user1 = await dbContext.Users.Where(u => u.Id == request.User1).FirstOrDefaultAsync(cancellationToken);
        var user2 = await dbContext.Users.Where(u => u.Id == request.User2).FirstOrDefaultAsync(cancellationToken);
        
        if (user1 == null)
        {
            throw new NotFoundException("User1 not found");
        }
        if (user2 == null)
        {
            throw new NotFoundException("User2 not found");
        }
        
        var conversationExists = await dbContext.Conversations
            .Where(c => (c.User1 == request.User1 && c.User2 == request.User2) ||
                        (c.User1 == request.User2 && c.User2 == request.User1))
            .AnyAsync(cancellationToken);
        
        if (conversationExists)
        {
            throw new InvalidOperationException("Conversation between these users already exists");
        }
        
        var chat = new Conversations()
        {
            User1 = request.User1,
            User2 = request.User2,
            StartAt = DateTime.UtcNow,
            LastMessageAt = DateTime.UtcNow,
        };
        
        dbContext.Conversations.Add(chat);
        await dbContext.SaveChangesAsync(cancellationToken);
        return new { chat.Id, Message = "Chat started successfully" };
    }
}