using Application.Common;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Application.Item.Queries;

public class GetItemsByUser : IRequest<List<UserItemResponse>>
{
    public int UserId { get; set; }
}

public class GetItemsByUserHandler(IApplicationDbContext dbContext)
    : IRequestHandler<GetItemsByUser, List<UserItemResponse>>
{
    public async Task<List<UserItemResponse>> Handle(GetItemsByUser request, CancellationToken cancellationToken)
    {
        var userItems = await dbContext.Items
            .AsNoTracking()
            .Where(i => i.UserId == request.UserId)
            .OrderByDescending(i => i.CreatedAt)
            .ToListAsync(cancellationToken);

        var items = userItems
            .Select(i => new UserItemResponse
            {
                Id = i.Id,
                Name = i.Name,
                Description = i.Description,
                Images = i.Images,
                Price = i.Price,
                UserId = i.UserId,
                CreatedAt = i.CreatedAt
            })
            .ToList();

        return items;
    }
}

public class UserItemResponse
{
    public int Id { get; set; }
    public string? Name { get; set; }
    public string? Description { get; set; }
    public byte[][]? Images { get; set; }
    public string? Price { get; set; }
    public int? UserId { get; set; }
    public DateTime CreatedAt { get; set; }
}