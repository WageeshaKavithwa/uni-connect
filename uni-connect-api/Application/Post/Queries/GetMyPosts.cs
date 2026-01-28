using Application.Common;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Application.Post.Queries;

public class GetMyPosts : IRequest<List<MyPostResponse>>
{
    public int UserId { get; set; }
}

public class GetMyPostsHandler (IApplicationDbContext dbContext) : IRequestHandler<GetMyPosts, List<MyPostResponse>>
{
    public async Task<List<MyPostResponse>> Handle(GetMyPosts request, CancellationToken cancellationToken)
    {
        var posts = await dbContext.Posts
            .OrderByDescending(p => p.CreatedAt)
            .Where(p => p.UserId == request.UserId)
            .ToListAsync(cancellationToken);
        
        if (posts == null || posts.Count == 0)
        {
            throw new NotFoundException("No posts found for the specified user.");
        }
        
        var response = posts.Select(p => new MyPostResponse
        {
            Id = p.Id,
            Caption = p.Caption,
            Category = p.Category.HasValue ? p.Category.Value.ToString() : null,
            Images = p.Images,
            UserId = p.UserId,
            CreatedAt = p.CreatedAt
        }).ToList();
        
        return response;
    }
}

public class MyPostResponse
{
    public int Id { get; set; }
    public string? Caption { get; set; }
    public string? Category { get; set; }
    public byte[][]? Images { get; set; }
    public int? UserId { get; set; }
    public DateTime CreatedAt { get; set; }
}