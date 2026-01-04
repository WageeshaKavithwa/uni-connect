using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Application.Common;
using Application.Common.Exceptions;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;

namespace Application.Auth.Commands.Login;

public class Login : IRequest<object>
{
    public LoginDto? LoginDto { get; set; } = new();
}

public class LoginHandler (IApplicationDbContext dbContext) : IRequestHandler<Login, object>
{
    public async Task<object> Handle(Login request, CancellationToken cancellationToken)
    {
        if (request.LoginDto == null)
            throw new BadRequestException("Invalid login data");

        var user = await dbContext.Users
            .FirstOrDefaultAsync(u => u.Email == request.LoginDto.Email, cancellationToken);

        if (user == null)
        {
            throw new NotFoundException("Invalid email");
        }

        bool isPasswordValid = BCrypt.Net.BCrypt.Verify(request.LoginDto.Password, user.Password);
        if (!isPasswordValid)
        {
            throw new NotFoundException("Invalid password");
        }
        
        var claims = new[]
        {
            new Claim(ClaimTypes.Name, user.Username),
        };

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes("your-32-characters-long-secret-key-here"));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var token = new JwtSecurityToken(
            issuer: "[jwt:issuer]",
            audience: "[jwt:audience]",
            claims: claims,
            expires: DateTime.Now.AddMinutes(1440),
            signingCredentials: creds
        );

        // Return user details or token as needed
        return new
        {
            user.Id,
            user.Username,
            user.Email,
            user.UserType,
            Token = new JwtSecurityTokenHandler().WriteToken(token)
        };
    }
}

public class LoginDto
{
    public string? Email { get; set; }
    public string? Password { get; set; }
}