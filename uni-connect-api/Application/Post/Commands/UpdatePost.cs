using Application.Common;
using MediatR;

namespace Application.Post.Commands;

public class UpdatePost : IRequest<object>
{
    public int PostId { get; set; }
    public int UserId { get; set; }
    public string Type { get; set; }
}

public class UpdatePostHandler(IApplicationDbContext dbContext) : IRequestHandler<UpdatePost, object>
{
    public async Task<object> Handle(UpdatePost request, CancellationToken cancellationToken)
    {
        var post = await dbContext.Posts.FindAsync(new object[] { request.PostId }, cancellationToken);
        if (post == null)
        {
            throw new NotFoundException("Post not found");
        }

        if (request.Type == "Add")
        {
            var userIds = post.UserIds?.ToList() ?? new List<int>();
                    if (!userIds.Contains(request.UserId))
                    {
                        userIds.Add(request.UserId);
                        post.UserIds = userIds.ToArray();
                        dbContext.Posts.Update(post);
                        await dbContext.SaveChangesAsync(cancellationToken);
                    }
        } else if (request.Type == "Remove")
        {
            var userIds = post.UserIds?.ToList() ?? new List<int>();
                    if (userIds.Contains(request.UserId))
                    {
                        userIds.Remove(request.UserId);
                        post.UserIds = userIds.ToArray();
                        dbContext.Posts.Update(post);
                        await dbContext.SaveChangesAsync(cancellationToken);
                    }
        }
        
        return "Post updated successfully";
    }
}