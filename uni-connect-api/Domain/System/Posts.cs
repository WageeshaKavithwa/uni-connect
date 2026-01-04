using Domain.Enums;

namespace Domain.System;

public class Posts : BaseEntity
{
    public string? Caption { get; set; }
    public byte[][]? Images { get; set; }
    public CategoryTypes? Category { get; set; }
    public int? UserId { get; set; }
    public int[]? UserIds { get; set; }
    public DateTime CreatedAt { get; set; }
}