using Application.Common;
using Domain.System;
using MediatR;
using Microsoft.AspNetCore.Http;

namespace Application.Chat.Commands
{
    public class SendMessageCommand : IRequest<int>
    {
        public int ConversationId { get; set; }
        public int Sender { get; set; }
        public string? Message { get; set; }
        public IFormFile[]? Attachments { get; set; }
    }
    
    public class SendMessageCommandHandler(IApplicationDbContext dbContext) : IRequestHandler<SendMessageCommand, int>
    {
        public async Task<int> Handle(SendMessageCommand request, CancellationToken cancellationToken)
        {
            byte[][]? fileData = null;
            if (request.Attachments != null && request.Attachments.Length > 0)
            {
                fileData = new byte[request.Attachments.Length][];
                for (int i = 0; i < request.Attachments.Length; i++)
                {
                    using var ms = new MemoryStream();
                    await request.Attachments[i].CopyToAsync(ms, cancellationToken);
                    fileData[i] = ms.ToArray();
                }
            }

            var chatMessage = new ChatMessages
            {
                ConversationId = request.ConversationId,
                Sender = request.Sender,
                Message = request.Message,
                FileData = fileData,
                SentAt = DateTime.UtcNow,
                IsRead = false
            };
            dbContext.ChatMessages.Add(chatMessage);
            await dbContext.SaveChangesAsync(cancellationToken);
            return chatMessage.Id;
        }
    }
}
