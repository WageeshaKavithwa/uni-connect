using Application.Chat.Commands;
using Application.Chat.Queries;
using MediatR;
using Microsoft.AspNetCore.Mvc;

namespace API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ChatController : ControllerBase
    {
        private readonly IMediator _mediator;
        public ChatController(IMediator mediator)
        {
            _mediator = mediator;
        }
        
        [HttpPost("create-conversation")]
        public async Task<IActionResult> CreateConversation([FromBody] StartChatCommand command)
        {
            var result = await _mediator.Send(command);
            return Ok(result);
        }

        [HttpPost("send")]
        public async Task<IActionResult> SendMessage([FromForm] SendMessageCommand command)
        {
            var result = await _mediator.Send(command);
            return Ok(result);
        }

        [HttpPost("read")]
        public async Task<IActionResult> ReadMessages([FromBody] ReadMessagesCommand command)
        {
            var result = await _mediator.Send(command);
            return Ok(result);
        }

        [HttpGet("conversations/{userId}")]
        public async Task<IActionResult> GetConversations([FromRoute] int userId)
        {
            var result = await _mediator.Send(new GetChatsQuery() { UserId = userId });
            return Ok(result);
        }

        [HttpGet("messages/{conversationId}")]
        public async Task<IActionResult> GetMessages(int conversationId)
        {
            var result = await _mediator.Send(new GetMessagesQuery { ConversationId = conversationId });
            return Ok(result);
        }
        
        [HttpGet("unread-count/{userId}")]
        public async Task<IActionResult> GetUnreadChatsCount(int userId)
        {
            var result = await _mediator.Send(new GetUnreadChats() { UserId = userId });
            return Ok(result);
        }

        [HttpGet("check-exists/{userAId}/{userBId}")]
        public async Task<IActionResult> CheckConversationExists(int userAId, int userBId)
        {
            var result = await _mediator.Send(new CheckChatExists()
            {
                User1Id = userAId,
                User2Id = userBId
            });
            return Ok(result);
        }
    }
}

