using System.ComponentModel.DataAnnotations;

namespace Domain;

public abstract class BaseEntity
{
    [Key]
    public int Id { get; set; }
}