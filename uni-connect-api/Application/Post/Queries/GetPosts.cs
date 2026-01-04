using Application.Common;
using Domain.Enums;
using Domain.System;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Application.Post.Queries;

public class GetPosts : IRequest<List<PostResponse>>{}

public class GetPostsHandler (IApplicationDbContext dbContext) : IRequestHandler<GetPosts, List<PostResponse>>
{
    public async Task<List<PostResponse>> Handle(GetPosts request, CancellationToken cancellationToken)
    {
        var posts = await dbContext.Posts
            .OrderByDescending(p => p.CreatedAt)
            .Take(50)
            .ToListAsync(cancellationToken);
        var userIds = posts.Select(p => p.UserId).Distinct().ToList();
        var users = await dbContext.Users
            .Where(u => userIds.Contains(u.Id))
            .ToDictionaryAsync(u => u.Id, u => u.Username, cancellationToken);
        var response = posts.Select(p => new PostResponse
        {
            Id = p.Id,
            Caption = p.Caption,
            Category = p.Category.HasValue ? p.Category.Value.ToString() : null,
            Images = p.Images,
            UserId = p.UserId,
            CreatedAt = p.CreatedAt,
            UserName = p.UserId.HasValue && users.ContainsKey(p.UserId.Value) ? users[p.UserId.Value] : null
        }).ToList();
        return response;
    }
}

public class PostResponse
{
    public int Id { get; set; }
    public string? Caption { get; set; }
    public string? Category { get; set; }
    public byte[][]? Images { get; set; }
    public int? UserId { get; set; }
    public DateTime CreatedAt { get; set; }
    public string? UserName { get; set; }
}