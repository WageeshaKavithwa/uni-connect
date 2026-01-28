using Application.Common;
using Domain.System;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Application.Event.Queries;

public class GetEvents : IRequest<List<Events>> {}

public class GetEventsHandler (IApplicationDbContext dbContext) : IRequestHandler<GetEvents, List<Events>>
{
    public async Task<List<Events>> Handle(GetEvents request, CancellationToken cancellationToken)
    {
        return await dbContext.Events.ToListAsync(cancellationToken);
    }
}