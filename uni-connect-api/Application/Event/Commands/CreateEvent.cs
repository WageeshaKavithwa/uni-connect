using Application.Common;
using Application.Common.Exceptions;
using Domain.System;
using MediatR;
using Microsoft.AspNetCore.Http;

namespace Application.Event.Commands;

public class CreateEvent : IRequest<object>
{
    public string? EventName { get; set; }
    public DateTime? EventDate { get; set; }
    public string? Description { get; set; }
    public string? Location { get; set; }
    public IFormFile? Thumbnail { get; set; }
    public int? UserId { get; set; }
    public string? SpecialNote { get; set; }
}

public class CreateEventHandler (IApplicationDbContext dbContext) : IRequestHandler<CreateEvent, object>
{
    public async Task<object> Handle(CreateEvent request, CancellationToken cancellationToken)
    {
        try
        {
            var newEvent = new Events()
            {
                EventName = request.EventName,
                EventDate = request.EventDate,
                EventDescription = request.Description,
                EventLocation = request.Location,
                EventThumbnail = request.Thumbnail != null ? await ConvertFileToByteArray(request.Thumbnail) : null,
                CreatedBy = request.UserId,
                SpecialNote = request.SpecialNote
            };  
        
            dbContext.Events.Add(newEvent);
            await dbContext.SaveChangesAsync(cancellationToken);
            return new { Success = true, Message = "Event created successfully", EventId = newEvent.Id };
        }
        catch (Exception e)
        {
            throw new BadRequestException("Error creating event: " + e.Message);
        }
        
    }

    private async Task<byte[]> ConvertFileToByteArray(IFormFile file)
    {
        using (var memoryStream = new MemoryStream())
        {
            await file.CopyToAsync(memoryStream);
            return memoryStream.ToArray();
        }
    }
}