using Application.Common;
using MediatR;

namespace Application.Chat.Commands;

public class ReadMessagesCommand : IRequest<object>
{
    public int ConversationId { get; set; }
    public int UserId { get; set; }
}

public class ReadMessagesCommandHandler (IApplicationDbContext dbContext) : IRequestHandler<ReadMessagesCommand, object>
{
    public async Task<object> Handle(ReadMessagesCommand request, CancellationToken cancellationToken)
    {
        var conversation = await dbContext.Conversations.FindAsync(request.ConversationId);
        
        if (conversation == null)
        {
            throw new NotFoundException("Conversation not found");
        }
        
        var chats = dbContext.ChatMessages
            .Where(c => c.ConversationId == request.ConversationId && c.Sender != request.UserId && !c.IsRead);
        
        foreach (var chat in chats)
        {
            chat.IsRead = true;
            chat.ReadAt = DateTime.Now;
            dbContext.ChatMessages.Update(chat);
        }
        
        await dbContext.SaveChangesAsync(cancellationToken);
        return new { Success = true, Message = "Messages marked as read." };
    }
}