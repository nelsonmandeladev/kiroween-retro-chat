import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  Req,
  BadRequestException,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';
import { FriendsService } from './friends.service';
import { SendFriendRequestDto } from './dto/send-friend-request.dto';
import { FriendRequestResponseDto } from './dto/friend-request-response.dto';
import { FriendResponseDto } from './dto/friend-response.dto';
import type { Request } from 'express';

@ApiTags('Friends')
@Controller('api/friends')
export class FriendsController {
  constructor(private readonly friendsService: FriendsService) {}

  @Post('request')
  @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
  @ApiOperation({
    summary: 'Send friend request',
    description: 'Send a friend request to another user',
  })
  @ApiBody({ type: SendFriendRequestDto })
  @ApiResponse({
    status: 201,
    description: 'Friend request sent successfully',
    type: FriendRequestResponseDto,
  })
  @ApiResponse({
    status: 400,
    description:
      'Bad request - user not authenticated, cannot send request to self, or invalid user',
  })
  @ApiResponse({
    status: 404,
    description: 'Sender or recipient user not found',
  })
  @ApiResponse({
    status: 409,
    description: 'Users are already friends or friend request already exists',
  })
  async sendFriendRequest(
    @Req() req: Request,
    @Body() dto: SendFriendRequestDto,
  ): Promise<FriendRequestResponseDto> {
    const userId = req.user?.id;
    if (!userId) {
      throw new BadRequestException('User not authenticated');
    }

    return this.friendsService.sendFriendRequest(userId, dto.toUserId);
  }

  @Post('accept/:requestId')
  @ApiOperation({
    summary: 'Accept friend request',
    description: 'Accept a pending friend request',
  })
  @ApiParam({
    name: 'requestId',
    description: 'Friend request ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({
    status: 200,
    description: 'Friend request accepted successfully',
    type: FriendRequestResponseDto,
  })
  @ApiResponse({
    status: 400,
    description:
      'Bad request - user not authenticated, not the recipient, or request not pending',
  })
  @ApiResponse({
    status: 404,
    description: 'Friend request not found',
  })
  async acceptFriendRequest(
    @Req() req: Request,
    @Param('requestId') requestId: string,
  ): Promise<FriendRequestResponseDto> {
    const userId = req.user?.id;
    if (!userId) {
      throw new BadRequestException('User not authenticated');
    }

    return this.friendsService.acceptFriendRequest(requestId, userId);
  }

  @Post('reject/:requestId')
  @ApiOperation({
    summary: 'Reject friend request',
    description: 'Reject a pending friend request',
  })
  @ApiParam({
    name: 'requestId',
    description: 'Friend request ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({
    status: 200,
    description: 'Friend request rejected successfully',
    type: FriendRequestResponseDto,
  })
  @ApiResponse({
    status: 400,
    description:
      'Bad request - user not authenticated, not the recipient, or request not pending',
  })
  @ApiResponse({
    status: 404,
    description: 'Friend request not found',
  })
  async rejectFriendRequest(
    @Req() req: Request,
    @Param('requestId') requestId: string,
  ): Promise<FriendRequestResponseDto> {
    const userId = req.user?.id;
    if (!userId) {
      throw new BadRequestException('User not authenticated');
    }

    return this.friendsService.rejectFriendRequest(requestId, userId);
  }

  @Get('requests')
  @ApiOperation({
    summary: 'Get pending friend requests',
    description: 'Get all pending friend requests for the authenticated user',
  })
  @ApiResponse({
    status: 200,
    description: 'Friend requests retrieved successfully',
    type: [FriendRequestResponseDto],
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - user not authenticated',
  })
  async getFriendRequests(
    @Req() req: Request,
  ): Promise<FriendRequestResponseDto[]> {
    const userId = req.user?.id;
    if (!userId) {
      throw new BadRequestException('User not authenticated');
    }

    return this.friendsService.getFriendRequests(userId);
  }

  @Get()
  @ApiOperation({
    summary: 'Get friends list',
    description: 'Get all friends for the authenticated user',
  })
  @ApiResponse({
    status: 200,
    description: 'Friends list retrieved successfully',
    type: [FriendResponseDto],
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - user not authenticated',
  })
  async getFriends(@Req() req: Request): Promise<FriendResponseDto[]> {
    const userId = req.user?.id;
    if (!userId) {
      throw new BadRequestException('User not authenticated');
    }

    return this.friendsService.getFriends(userId);
  }
}
