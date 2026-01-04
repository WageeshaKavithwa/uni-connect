using Application.Common;
using Application.Common.Exceptions;
using Domain.Enums;
using Domain.System;
using MediatR;
using BCrypt.Net;

namespace Application.Auth.Commands.CreateUser;

public class CreateUser : IRequest<object>
{
    public CreateUserDto? Data { get; set; }
}

public class CreateUserHandler(IApplicationDbContext dbContext) : IRequestHandler<CreateUser, object>
{
    public async Task<object> Handle(CreateUser request, CancellationToken cancellationToken)
    {
        if (request.Data == null)
            throw new BadRequestException("Invalid user data");

        var hashedPassword = BCrypt.Net.BCrypt.HashPassword(request.Data.Password);

        var newUser = new Users
        {
            Username = request.Data.UserName,
            Email = request.Data.Email,
            Gender = request.Data.Gender,
            UserType = request.Data.UserType,
            Password = hashedPassword
        };

        await dbContext.Users.AddAsync(newUser, cancellationToken);
        await dbContext.SaveChangesAsync(cancellationToken);
        return "User created successfully";
    }
}

public class CreateUserDto
{
    public string? UserName { get; set; }
    public string? Email { get; set; }
    public string? Gender { get; set; }
    public UserTypes UserType { get; set; }
    public string? Password { get; set; }
}