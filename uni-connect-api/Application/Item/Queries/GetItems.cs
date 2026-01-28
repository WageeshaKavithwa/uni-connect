using Application.Common;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Application.Item.Queries;

public class GetItems : IRequest<List<ItemResponse>>
{
}

public class GetItemsHandler(IApplicationDbContext dbContext)
    : IRequestHandler<GetItems, List<ItemResponse>>
{
    public async Task<List<ItemResponse>> Handle(GetItems request, CancellationToken cancellationToken)
    {
        var allItems = await dbContext.Items
            .AsNoTracking()
            .OrderByDescending(i => i.CreatedAt)
            .ToListAsync(cancellationToken);
        var userIds = allItems.Select(i => i.UserId).Distinct().ToList();
        var users = await dbContext.Users
            .Where(u => userIds.Contains(u.Id))
            .ToDictionaryAsync(u => u.Id, u => u.Username, cancellationToken);
        var items = allItems
            .Select(i => new ItemResponse
            {
                Id = i.Id,
                Name = i.Name,
                Description = i.Description,
                Images = i.Images,
                Price = i.Price,
                UserId = i.UserId,
                CreatedAt = i.CreatedAt,
                UserName = i.UserId.HasValue && users.ContainsKey(i.UserId.Value) ? users[i.UserId.Value] : null
            })
            .ToList();

        return items;
    }
}

public class ItemResponse
{
    public int Id { get; set; }
    public string? Name { get; set; }
    public string? Description { get; set; }
    public byte[][]? Images { get; set; }
    public string? Price { get; set; }
    public int? UserId { get; set; }
    public DateTime CreatedAt { get; set; }
    public string? UserName { get; set; }
}