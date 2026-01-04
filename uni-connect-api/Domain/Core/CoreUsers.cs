using Domain.Enums;

namespace Domain.Core;

public class CoreUsers : BaseEntity
{
    public string? Email { get; set; }
    public string? Username { get; set; }
    public string? Gender { get; set; }
    public UserTypes? UserType { get; set; }
}