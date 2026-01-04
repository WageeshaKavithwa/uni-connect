using Domain.Enums;

namespace Domain.System;

public class Users : BaseEntity
{
    public string? Username { get; set; }
    public string? Email { get; set; }
    public string? Password { get; set; }
    public UserTypes? UserType { get; set; }
    public string? Gender { get; set; }
}