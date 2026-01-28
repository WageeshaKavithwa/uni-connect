using MediatR;
using Domain.System;
using System.Collections.Generic;
using Application.Common;
using Microsoft.EntityFrameworkCore;

namespace Application.Chat.Queries
{
    public class GetMessagesQuery : IRequest<List<ChatMessages>>
    {
        public int ConversationId { get; set; }
    }
    
    public class GetMessagesQueryHandler : IRequestHandler<GetMessagesQuery, List<ChatMessages>>
    {
        private readonly IApplicationDbContext _dbContext;
        public GetMessagesQueryHandler(IApplicationDbContext dbContext)
        {
            _dbContext = dbContext;
        }

        public async Task<List<ChatMessages>> Handle(GetMessagesQuery request, CancellationToken cancellationToken)
        {
            return await _dbContext.ChatMessages
                .Where(m => m.ConversationId == request.ConversationId)
                .OrderBy(m => m.SentAt)
                .ToListAsync(cancellationToken);
        }
    }
}

