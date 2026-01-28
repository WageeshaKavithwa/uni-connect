namespace Domain.System;

public class Conversations : BaseEntity
{
    public int User1 { get; set; }
    public int User2 { get; set; }
    public DateTime StartAt { get; set; }
    public DateTime LastMessageAt { get; set; }
}