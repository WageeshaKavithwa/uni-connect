using Application.Common;
using MediatR;

namespace Application.Event.Commands;

public class DeleteEvent : IRequest<object>
{
    public int EventId { get; set; }
    public int UserId { get; set; }
}

public class DeleteEventHandler(IApplicationDbContext dbContext) : IRequestHandler<DeleteEvent, object>
{
    public async Task<object> Handle(DeleteEvent request, CancellationToken cancellationToken)
    {
        var eventEntity = await dbContext.Events.FindAsync(new object[] { request.EventId }, cancellationToken);
        if (eventEntity == null)
        {
            throw new NotFoundException("Event not found");
        }

        if (eventEntity.CreatedBy != request.UserId)
        {
            throw new UnauthorizedAccessException("Unauthorized: Only the creator can delete this event") ;
        }

        dbContext.Events.Remove(eventEntity);
        await dbContext.SaveChangesAsync(cancellationToken);
        return "Event deleted successfully";
    }
}