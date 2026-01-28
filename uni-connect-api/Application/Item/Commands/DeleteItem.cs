using Application.Common;
using MediatR;

namespace Application.Item.Commands;

public class DeleteItem : IRequest<object>
{
    public int Id { get; set; }
}

public class DeleteItemHandler(IApplicationDbContext dbContext) : IRequestHandler<DeleteItem, object>
{
    public async Task<object> Handle(DeleteItem request, CancellationToken cancellationToken)
    {
        var item = await dbContext.Items.FindAsync(new object[] { request.Id }, cancellationToken);
        if (item == null)
        {
            return "Item not found";
        }

        dbContext.Items.Remove(item);
        await dbContext.SaveChangesAsync(cancellationToken);
        return "Item deleted successfully";
    }
}