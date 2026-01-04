using Application.Common;
using Domain.Enums;
using MediatR;
using Microsoft.AspNetCore.Http;

namespace Application.Post.Commands;

public class CreatePost : IRequest<object>
{
    public string? Caption { get; set; }
    public IFormFile[] Images { get; set; }
    public int? UserId { get; set; }
    public CategoryTypes? Category { get; set; }
}

public class CreatePostHandler (IApplicationDbContext dbContext) : IRequestHandler<CreatePost, object>
{
    public async Task<object> Handle(CreatePost request, CancellationToken cancellationToken)
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

        var newPost = new Domain.System.Posts
        {
            Caption = request.Caption,
            Images = imageBytes,
            UserId = request.UserId,
            Category = request.Category,
            CreatedAt = DateTime.UtcNow
        };
        
        await dbContext.Posts.AddAsync(newPost, cancellationToken);
        await dbContext.SaveChangesAsync(cancellationToken);
        return "Post created successfully";
    }
}