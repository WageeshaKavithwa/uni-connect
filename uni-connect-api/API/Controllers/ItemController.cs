using Application.Item.Commands;
using Application.Item.Queries;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace API.Controllers;

[ApiController]
[Route("api/items")]
[Authorize]
public class ItemController : ControllerBase
{
    public readonly IMediator _mediator;
    
    public ItemController(IMediator mediator)
    {
        _mediator = mediator;
    }
    
    [HttpPost]
    public async Task<IActionResult> CreateItem([FromForm] CreateItem command)
    {
        var res = await _mediator.Send(command);
        return Ok(res);
    }

    [HttpGet]
    public async Task<IActionResult> GetItems()
    {
        var res = await _mediator.Send(new GetItems());
        return Ok(res);
    }
    
    [HttpGet("{id}")]
    public async Task<IActionResult> GetItemsByUser(int id)
    {
        var query = new GetItemsByUser() { UserId = id };
        var res = await _mediator.Send(query);
        return Ok(res);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteItem(int id)
    {
        var command = new DeleteItem() { Id = id };
        var res = await _mediator.Send(command);
        return Ok(res);
    }
}