using Application.Post.Commands;
using Application.Post.Queries;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace API.Controllers;

[ApiController]
[Route("api/posts")]
[Authorize]
public class PostController : ControllerBase
{
    private readonly IMediator _mediator;
    
    public PostController(IMediator mediator)
    {
        _mediator = mediator;
    }
    
    [HttpPost]
    public async Task<IActionResult> CreatePost([FromForm] CreatePost command)
    {
        
        var res = await _mediator.Send(command);
        return Ok(res);
    }
    
    [HttpGet]
    public async Task<IActionResult> GetPosts()
    {
        var res = await _mediator.Send(new GetPosts());
        return Ok(res);
    }
    
    [HttpGet("{id}")]
    public async Task<IActionResult> GetPostById(int id)
    {
        var query = new GetMyPosts() { UserId = id };
        var res = await _mediator.Send(query);
        return Ok(res);
    }
    
    [HttpGet("save/{id}")]
    public async Task<IActionResult> GetSavedPostById(int id)
    {
        var query = new GetSavedPosts() { UserId = id };
        var res = await _mediator.Send(query);
        return Ok(res);
    }
    
    [HttpDelete("{id}/user/{userId}")]
    public async Task<IActionResult> DeletePost(int id, int userId)
    {
        var command = new DeletePost() { PostId = id, UserId = userId };
        var res = await _mediator.Send(command);
        return Ok(res);
    }
    
    [HttpPut("{id}/user/{userId}/{type}")]
    public async Task<IActionResult> UpdatePost(int id, int userId, string type)
    {
        var res = await _mediator.Send(new UpdatePost() { PostId = id, UserId = userId, Type = type });
        return Ok(res);
    }
}