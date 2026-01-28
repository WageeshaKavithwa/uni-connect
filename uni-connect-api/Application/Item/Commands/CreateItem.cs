using Application.Common;
using MediatR;
using Microsoft.AspNetCore.Http;

namespace Application.Item.Commands;

public class CreateItem : IRequest<object>
{
    public string? Name { get; set; }
    public string? Description { get; set; }
    public IFormFile[]? Images { get; set; }
    public string? Price { get; set; }
    public int? UserId { get; set; }
}

public class CreateItemHandler(IApplicationDbContext dbContext) : IRequestHandler<CreateItem, object>
{
    public async Task<object> Handle(CreateItem request, CancellationToken cancellationToken)
    {
        byte[][] imageBytes = null;
        if (request.Images != null)
        {
            var files = request.Images.Take(5).ToArray();
            imageBytes = new byte[files.Length][];
            for (int i = 0; i < files.Length; i++)
            {
                using (var ms = new MemoryStream())
                {
                    await files[i].CopyToAsync(ms, cancellationToken);
                    imageBytes[i] = ms.ToArray();
                }
            }
        }

        var newItem = new Domain.System.Items
        {
            Name = request.Name,
            Description = request.Description,
            Images = imageBytes,
            Price = request.Price,
            UserId = request.UserId,
            CreatedAt = DateTime.UtcNow
        };
        
        await dbContext.Items.AddAsync(newItem, cancellationToken);
        await dbContext.SaveChangesAsync(cancellationToken);
        return "Item created successfully";
    }
}

