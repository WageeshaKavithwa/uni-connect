namespace Domain.System;

public class Events : BaseEntity
{
    public string? EventName { get; set; }
    public string? EventDescription { get; set; }
    public byte[]? EventThumbnail { get; set; }
    public DateTime? EventDate { get; set; }
    public string? EventLocation { get; set; }
    public string? SpecialNote { get; set; }
    public int? CreatedBy { get; set; }
}