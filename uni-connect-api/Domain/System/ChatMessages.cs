namespace Domain.System;

public class ChatMessages : BaseEntity
{
    public int ConversationId { get; set; }
    public int Sender { get; set; }
    public string? Message { get; set; }
    public string? FileName { get; set; }
    public string? FileType { get; set; }
    public byte[][]? FileData { get; set; }
    public DateTime SentAt { get; set; }
    public bool IsRead { get; set; }
    public DateTime ReadAt { get; set; }
}