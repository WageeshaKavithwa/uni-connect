using Application.Auth.Commands.CreateUser;
using Application.Auth.Commands.Login;
using Application.Auth.Queries.GetCoreUser;
using Application.Auth.Queries.GetUser;
using Application.Common;
using MediatR;
using Microsoft.AspNetCore.Identity.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace API.Controllers;

[ApiController]
[Route("api/auth/")]
public class AuthController : ControllerBase
{
    private readonly IMediator _mediator;
    private readonly ICoreDbContext _coreDbContext;
    private readonly IApplicationDbContext _applicationDbContext;
    
    public AuthController(
        IMediator mediator,
        ICoreDbContext coreDbContext,
        IApplicationDbContext applicationDbContext)
    {
        _mediator = mediator;
        _coreDbContext = coreDbContext;
        _applicationDbContext = applicationDbContext;
    }
    
    [HttpGet("get-core-user")]
    public async Task<IActionResult> GetCoreUserByEmail([FromQuery] string email)
    {
        if (string.IsNullOrEmpty(email))
        {
            return BadRequest("Email parameter is required.");
        }

        var query = new GetCoreUser
        {
            Email = email
        };

        var result = await _mediator.Send(query);
        return Ok(result);
    }

    [HttpGet("get-user")]
    public async Task<ActionResult> GetUserByEmail([FromQuery] string email)
    {
        if (String.IsNullOrEmpty(email))
        {
            return BadRequest("Email parameter is required.");
        }
        
        var query = new GetUser
        {
            Email = email
        };
        
        var result = await _mediator.Send(query);
        return Ok(result);
    }

    [HttpGet("get-users")]
    public async Task<ActionResult> GetUsers()
    {
        var result = await _mediator.Send(new GetAllUsers());
        return Ok(result);
    }
    
    [HttpPost("register")]
    public async Task<IActionResult> RegisterUser([FromBody] CreateUserDto userData)
    {
        var command = new CreateUser
        {
            Data = userData
        };

        var result = await _mediator.Send(command);
        return Ok(result);
    }
    
    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginDto loginRequest)
    {
        var command = new Login()
        {
             LoginDto = loginRequest
        };
        
        var result = await _mediator.Send(command);

        return Ok(result);
    }
}