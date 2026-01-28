using Application.Common;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Application.Post.Queries;

public class GetSavedPosts : IRequest<List<SavedPostResponse>>
{
    public int UserId { get; set; }
}

public class GetSavedPostsHandler(IApplicationDbContext dbContext)
    : IRequestHandler<GetSavedPosts, List<SavedPostResponse>>
{
    public async Task<List<SavedPostResponse>> Handle(GetSavedPosts request, CancellationToken cancellationToken)
    {
        var allPosts = await dbContext.Posts
            .AsNoTracking()
            .OrderByDescending(p => p.CreatedAt)
            .ToListAsync(cancellationToken);
        var userIds = allPosts.Select(p => p.UserId).Distinct().ToList();
        var users = await dbContext.Users
            .Where(u => userIds.Contains(u.Id))
            .ToDictionaryAsync(u => u.Id, u => u.Username, cancellationToken);
        var posts = allPosts
            .Where(p => p.UserIds != null && p.UserIds.Contains(request.UserId))
            .Select(p => new SavedPostResponse
            {
                Id = p.Id,
                Caption = p.Caption,
                Category = p.Category.HasValue ? p.Category.Value.ToString() : null,
                Images = p.Images,
                UserId = p.UserId,
                CreatedAt = p.CreatedAt,
                UserName = p.UserId.HasValue && users.ContainsKey(p.UserId.Value) ? users[p.UserId.Value] : null
            })
            .ToList();

        return posts;
    }
}

public class SavedPostResponse
{
    public int Id { get; set; }
    public string? Caption { get; set; }
    public string? Category { get; set; }
    public byte[][]? Images { get; set; }
    public int? UserId { get; set; }
    public DateTime CreatedAt { get; set; }
    public string? UserName { get; set; }
}