using Application.Common;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Application.Post.Commands;

public class DeletePost : IRequest<object>
{
    public int PostId { get; set; }
    public int UserId { get; set; }
}

public class DeletePostHandler(IApplicationDbContext dbContext) : IRequestHandler<DeletePost, object>
{
    public async Task<object> Handle(DeletePost request, CancellationToken cancellationToken)
    {
        var post = await dbContext.Posts.Where(p => p.Id == request.PostId && p.UserId == request.UserId)
            .FirstOrDefaultAsync(cancellationToken);

        if (post == null)
        {
            throw new NotFoundException("Post not found or you do not have permission to delete this post");
        }
        
        dbContext.Posts.Remove(post);
        await dbContext.SaveChangesAsync(cancellationToken);
        return "Post deleted successfully";
    }
}