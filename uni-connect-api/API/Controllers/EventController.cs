using Application.Event.Commands;
using Application.Event.Queries;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class EventController (IMediator mediator) : ControllerBase
{
    [HttpPost]
    public async Task<IActionResult> CreateEvent([FromForm] CreateEvent command)
    {
        var result = await mediator.Send(command);
        return Ok(result);
    }
    
    [HttpGet]
    public async Task<IActionResult> GetEvents()
    {
        var result = await mediator.Send(new GetEvents());
        return Ok(result);
    }
    
    [HttpGet("{id}")]
    public async Task<IActionResult> GetEventById(int id)
    {
        var result = await mediator.Send(new GetEventsByUserId() { UserId = id });
        return Ok(result);
    }
    
    [HttpDelete("{id}/{userId}")]
    public async Task<IActionResult> DeleteEvent(int id, int userId)
    {
        var result = await mediator.Send(new DeleteEvent() { EventId = id, UserId = userId });
        return Ok(result);
    }
}