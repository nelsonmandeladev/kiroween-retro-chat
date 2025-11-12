import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { ChatService } from './chat.service';
import { MessageResponseDto } from './dto/message-response.dto';
import { UnreadCountResponseDto } from './dto/unread-count-response.dto';
import { AuthGuard } from '../lib/auth';
import type { Request } from 'express';

@ApiTags('chat')
@Controller('api/messages')
@UseGuards(AuthGuard)
@ApiBearerAuth()
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Get('unread')
  @ApiOperation({ summary: 'Get unread message count' })
  @ApiResponse({
    status: 200,
    description: 'Unread count retrieved successfully',
    type: UnreadCountResponseDto,
  })
  async getUnreadCount(@Req() req: Request): Promise<UnreadCountResponseDto> {
    const userId = req?.user?.id;
    const count = await this.chatService.getUnreadCount(userId!);
    return { count };
  }

  @Get(':userId')
  @ApiOperation({ summary: 'Get conversation with a specific user' })
  @ApiParam({
    name: 'userId',
    description: 'The ID of the user to get conversation with',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Maximum number of messages to retrieve',
    example: 50,
  })
  @ApiResponse({
    status: 200,
    description: 'Conversation retrieved successfully',
    type: [MessageResponseDto],
  })
  async getConversation(
    @Req() req: Request,
    @Param('userId') userId: string,
    @Query('limit') limit?: string,
  ): Promise<MessageResponseDto[]> {
    const currentUserId = req?.user?.id;
    const messageLimit = limit ? parseInt(limit, 10) : 50;
    return this.chatService.getConversation(
      currentUserId!,
      userId,
      messageLimit,
    );
  }

  @Post('read/:messageId')
  @ApiOperation({ summary: 'Mark a message as read' })
  @ApiParam({
    name: 'messageId',
    description: 'The ID of the message to mark as read',
  })
  @ApiResponse({
    status: 200,
    description: 'Message marked as read successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Message not found',
  })
  async markAsRead(@Param('messageId') messageId: string): Promise<void> {
    await this.chatService.markAsRead(messageId);
  }
}
