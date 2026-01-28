using Application.Common;
using Domain.System;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Application.Event.Queries;

public class GetEventsByUserId : IRequest<List<Events>>
{
    public int UserId { get; set; }
}

public class GetEventsByUserIdHandler (IApplicationDbContext dbContext) : IRequestHandler<GetEventsByUserId, List<Events>>
{
    public async Task<List<Events>> Handle(GetEventsByUserId request, CancellationToken cancellationToken)
    {
        return await dbContext.Events.Where(e => e.CreatedBy == request.UserId).ToListAsync(cancellationToken);
    }
}