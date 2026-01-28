namespace Domain.System;

public class Items : BaseEntity
{
    public string? Name { get; set; }
    public string? Description { get; set; }
    public byte[][]? Images { get; set; }
    public string? Price { get; set; }
    public int? UserId { get; set; }
    public DateTime CreatedAt { get; set; }
}