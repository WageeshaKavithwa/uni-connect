using Application.Common;
using Domain.System;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Application.Chat.Queries;

public class GetChatsQuery : IRequest<List<ConversationsDto>>
{
    public int UserId { get; set; }
}

public class GetChatsQueryHandler (IApplicationDbContext dbContext) : IRequestHandler<GetChatsQuery, List<ConversationsDto>>
{
    public async Task<List<ConversationsDto>> Handle(GetChatsQuery request, CancellationToken cancellationToken)
    {
        var conversations = await dbContext.Conversations
            .Where(c => c.User1 == request.UserId || c.User2 == request.UserId)
            .ToListAsync(cancellationToken);

        var conversationDtos = new List<ConversationsDto>();
        foreach (var c in conversations)
        {
            // Get last message for the conversation
            var lastMessage = await dbContext.ChatMessages
                .Where(m => m.ConversationId == c.Id)
                .OrderByDescending(m => m.SentAt)
                .Select(m => m.Message)
                .FirstOrDefaultAsync(cancellationToken);

            // Determine receiver name (assuming you have a Users table, otherwise set to null)
            string? receiverName = null;
            int receiverId = c.User1 == request.UserId ? c.User2 : c.User1;
            receiverName = await dbContext.Users.
                Where(u => u.Id == receiverId)
                .Select(u => u.Username)
                .FirstOrDefaultAsync(cancellationToken);
            
            // Calculate unread count for receiver
            var unreadCount = await dbContext.ChatMessages
                .Where(m => m.ConversationId == c.Id && m.Sender == receiverId && !m.IsRead)
                .CountAsync(cancellationToken);

            conversationDtos.Add(new ConversationsDto
            {
                Id = c.Id,
                User1 = c.User1,
                User2 = c.User2,
                CreatedAt = c.StartAt,
                LastMessage = lastMessage,
                ReceiverName = receiverName,
                UnreadCount = unreadCount
            });
        }
        return conversationDtos;
    }
}

public class ConversationsDto
{
    public int Id { get; set; }
    public int User1 { get; set; }
    public int User2 { get; set; }
    public DateTime CreatedAt { get; set; }
    public string? LastMessage { get; set; }
    public string? ReceiverName { get; set; }
    public int UnreadCount { get; set; }
}