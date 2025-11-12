import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Param,
  Body,
  Req,
  BadRequestException,
  UsePipes,
  ValidationPipe,
  UseGuards,
  Inject,
  forwardRef,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { GroupsService } from './groups.service';
import { GroupMessageService } from './group-message.service';
import { GroupAIProfileService } from './group-ai-profile.service';
import { CreateGroupDto } from './dto/create-group.dto';
import { UpdateGroupDto } from './dto/update-group.dto';
import { AddMemberDto } from './dto/add-member.dto';
import { GroupResponseDto } from './dto/group-response.dto';
import { GroupMemberResponseDto } from './dto/group-member-response.dto';
import { GroupMessageResponseDto } from './dto/group-message-response.dto';
import { UnreadGroupCountResponseDto } from './dto/unread-group-count-response.dto';
import { AuthGuard } from '../lib/auth';
import { EventsGateway } from '../gateway/events.gateway';
import type { Request } from 'express';

@ApiTags('Groups')
@Controller('api/groups')
@UseGuards(AuthGuard)
@ApiBearerAuth()
export class GroupsController {
  constructor(
    private readonly groupsService: GroupsService,
    private readonly groupMessageService: GroupMessageService,
    private readonly groupAIProfileService: GroupAIProfileService,
    @Inject(forwardRef(() => EventsGateway))
    private readonly eventsGateway: EventsGateway,
  ) {}

  @Post()
  @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
  @ApiOperation({
    summary: 'Create new group',
    description: 'Create a new group chat with multiple members',
  })
  @ApiBody({ type: CreateGroupDto })
  @ApiResponse({
    status: 201,
    description: 'Group created successfully',
    type: GroupResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - invalid input or insufficient members',
  })
  async createGroup(
    @Req() req: Request,
    @Body() dto: CreateGroupDto,
  ): Promise<GroupResponseDto> {
    const userId = req.user?.id;
    if (!userId) {
      throw new BadRequestException('User not authenticated');
    }

    const group = await this.groupsService.createGroup(
      userId,
      dto.name,
      dto.description || null,
      dto.memberIds,
    );

    // Notify all members (including creator) about the new group
    for (const member of group.members) {
      await this.eventsGateway.emitGroupMemberAdded(group.id, member);
    }

    return group;
  }

  @Get()
  @ApiOperation({
    summary: "Get user's groups",
    description: 'Get all groups that the authenticated user is a member of',
  })
  @ApiResponse({
    status: 200,
    description: 'Groups retrieved successfully',
    type: [GroupResponseDto],
  })
  async getUserGroups(@Req() req: Request): Promise<GroupResponseDto[]> {
    const userId = req.user?.id;
    if (!userId) {
      throw new BadRequestException('User not authenticated');
    }

    return this.groupsService.getUserGroups(userId);
  }

  @Get('unread')
  @ApiOperation({
    summary: 'Get unread group message count',
    description: 'Get total count of unread messages across all groups',
  })
  @ApiResponse({
    status: 200,
    description: 'Unread count retrieved successfully',
    type: UnreadGroupCountResponseDto,
  })
  async getUnreadCount(
    @Req() req: Request,
  ): Promise<UnreadGroupCountResponseDto> {
    const userId = req.user?.id;
    if (!userId) {
      throw new BadRequestException('User not authenticated');
    }

    const unreadCount =
      await this.groupMessageService.getUnreadGroupMessageCount(userId);
    return { unreadCount };
  }

  @Get(':groupId')
  @ApiOperation({
    summary: 'Get group details',
    description: 'Get detailed information about a specific group',
  })
  @ApiParam({
    name: 'groupId',
    description: 'Group ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({
    status: 200,
    description: 'Group details retrieved successfully',
    type: GroupResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Group not found',
  })
  async getGroup(
    @Req() req: Request,
    @Param('groupId') groupId: string,
  ): Promise<GroupResponseDto> {
    const userId = req.user?.id;
    if (!userId) {
      throw new BadRequestException('User not authenticated');
    }

    // Verify user is a member
    const isMember = await this.groupsService.isUserInGroup(groupId, userId);
    if (!isMember) {
      throw new BadRequestException('You are not a member of this group');
    }

    return this.groupsService.getGroup(groupId);
  }

  @Patch(':groupId')
  @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
  @ApiOperation({
    summary: 'Update group',
    description: 'Update group name, description, or AI settings (admin only)',
  })
  @ApiParam({
    name: 'groupId',
    description: 'Group ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiBody({ type: UpdateGroupDto })
  @ApiResponse({
    status: 200,
    description: 'Group updated successfully',
    type: GroupResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - invalid input',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - user is not a group admin',
  })
  @ApiResponse({
    status: 404,
    description: 'Group not found',
  })
  async updateGroup(
    @Req() req: Request,
    @Param('groupId') groupId: string,
    @Body() dto: UpdateGroupDto,
  ): Promise<GroupResponseDto> {
    const userId = req.user?.id;
    if (!userId) {
      throw new BadRequestException('User not authenticated');
    }

    return this.groupsService.updateGroup(groupId, userId, dto);
  }

  @Delete(':groupId')
  @ApiOperation({
    summary: 'Delete group',
    description: 'Delete a group and all related data (admin only)',
  })
  @ApiParam({
    name: 'groupId',
    description: 'Group ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({
    status: 200,
    description: 'Group deleted successfully',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - user is not a group admin',
  })
  @ApiResponse({
    status: 404,
    description: 'Group not found',
  })
  async deleteGroup(
    @Req() req: Request,
    @Param('groupId') groupId: string,
  ): Promise<{ message: string }> {
    const userId = req.user?.id;
    if (!userId) {
      throw new BadRequestException('User not authenticated');
    }

    // Get group details and members before deletion
    const group = await this.groupsService.getGroup(groupId);

    // Delete the group
    await this.groupsService.deleteGroup(groupId, userId);

    // Notify all members about group deletion
    await this.eventsGateway.emitGroupDeleted(
      groupId,
      group.name,
      group.members,
    );

    return { message: 'Group deleted successfully' };
  }

  @Post(':groupId/members')
  @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
  @ApiOperation({
    summary: 'Add member',
    description: 'Add a new member to the group (admin only)',
  })
  @ApiParam({
    name: 'groupId',
    description: 'Group ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiBody({ type: AddMemberDto })
  @ApiResponse({
    status: 201,
    description: 'Member added successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - user already a member or not found',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - user is not a group admin',
  })
  @ApiResponse({
    status: 404,
    description: 'Group not found',
  })
  async addMember(
    @Req() req: Request,
    @Param('groupId') groupId: string,
    @Body() dto: AddMemberDto,
  ): Promise<{ message: string }> {
    const userId = req.user?.id;
    if (!userId) {
      throw new BadRequestException('User not authenticated');
    }

    await this.groupsService.addMember(groupId, dto.userId, userId);
    return { message: 'Member added successfully' };
  }

  @Delete(':groupId/members/:userId')
  @ApiOperation({
    summary: 'Remove member',
    description: 'Remove a member from the group (admin only)',
  })
  @ApiParam({
    name: 'groupId',
    description: 'Group ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiParam({
    name: 'userId',
    description: 'User ID to remove',
    example: 'user-id-123',
  })
  @ApiResponse({
    status: 200,
    description: 'Member removed successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - user not a member or cannot remove last admin',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - user is not a group admin',
  })
  @ApiResponse({
    status: 404,
    description: 'Group not found',
  })
  async removeMember(
    @Req() req: Request,
    @Param('groupId') groupId: string,
    @Param('userId') userIdToRemove: string,
  ): Promise<{ message: string }> {
    const userId = req.user?.id;
    if (!userId) {
      throw new BadRequestException('User not authenticated');
    }

    await this.groupsService.removeMember(groupId, userIdToRemove, userId);
    return { message: 'Member removed successfully' };
  }

  @Post(':groupId/leave')
  @ApiOperation({
    summary: 'Leave group',
    description: 'Leave a group voluntarily',
  })
  @ApiParam({
    name: 'groupId',
    description: 'Group ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({
    status: 200,
    description: 'Left group successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - user not a member',
  })
  @ApiResponse({
    status: 404,
    description: 'Group not found',
  })
  async leaveGroup(
    @Req() req: Request,
    @Param('groupId') groupId: string,
  ): Promise<{ message: string }> {
    const userId = req.user?.id;
    if (!userId) {
      throw new BadRequestException('User not authenticated');
    }

    await this.groupsService.leaveGroup(groupId, userId);
    return { message: 'Left group successfully' };
  }

  @Get(':groupId/members')
  @ApiOperation({
    summary: 'Get group members',
    description: 'Get all members of a specific group',
  })
  @ApiParam({
    name: 'groupId',
    description: 'Group ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({
    status: 200,
    description: 'Group members retrieved successfully',
    type: [GroupMemberResponseDto],
  })
  @ApiResponse({
    status: 404,
    description: 'Group not found',
  })
  async getGroupMembers(
    @Req() req: Request,
    @Param('groupId') groupId: string,
  ): Promise<GroupMemberResponseDto[]> {
    const userId = req.user?.id;
    if (!userId) {
      throw new BadRequestException('User not authenticated');
    }

    // Verify user is a member
    const isMember = await this.groupsService.isUserInGroup(groupId, userId);
    if (!isMember) {
      throw new BadRequestException('You are not a member of this group');
    }

    return this.groupsService.getGroupMembers(groupId);
  }

  @Get(':groupId/messages')
  @ApiOperation({
    summary: 'Get group messages',
    description: 'Get message history for a group with pagination',
  })
  @ApiParam({
    name: 'groupId',
    description: 'Group ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({
    status: 200,
    description: 'Group messages retrieved successfully',
    type: [GroupMessageResponseDto],
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - user not a member',
  })
  @ApiResponse({
    status: 404,
    description: 'Group not found',
  })
  async getGroupMessages(
    @Req() req: Request,
    @Param('groupId') groupId: string,
  ): Promise<GroupMessageResponseDto[]> {
    const userId = req.user?.id;
    if (!userId) {
      throw new BadRequestException('User not authenticated');
    }

    // Verify user is a member
    const isMember = await this.groupsService.isUserInGroup(groupId, userId);
    if (!isMember) {
      throw new BadRequestException('You are not a member of this group');
    }

    // Get query parameters for pagination
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
    const before = req.query.before
      ? new Date(req.query.before as string)
      : undefined;

    return this.groupMessageService.getGroupMessages(groupId, limit, before);
  }

  @Post(':groupId/messages/read')
  @ApiOperation({
    summary: 'Mark messages as read',
    description: 'Mark all messages in a group as read for the current user',
  })
  @ApiParam({
    name: 'groupId',
    description: 'Group ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({
    status: 200,
    description: 'Messages marked as read successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - user not a member',
  })
  @ApiResponse({
    status: 404,
    description: 'Group not found',
  })
  async markMessagesAsRead(
    @Req() req: Request,
    @Param('groupId') groupId: string,
  ): Promise<{ message: string }> {
    const userId = req.user?.id;
    if (!userId) {
      throw new BadRequestException('User not authenticated');
    }

    // Verify user is a member
    const isMember = await this.groupsService.isUserInGroup(groupId, userId);
    if (!isMember) {
      throw new BadRequestException('You are not a member of this group');
    }

    await this.groupMessageService.markGroupMessagesAsRead(groupId, userId);
    return { message: 'Messages marked as read' };
  }

  @Get(':groupId/ai/profile')
  @ApiOperation({
    summary: 'Get group AI style profile',
    description:
      "Get the Group AI's learned style profile for a specific group",
  })
  @ApiParam({
    name: 'groupId',
    description: 'Group ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({
    status: 200,
    description: 'Group AI profile retrieved successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - user not a member',
  })
  @ApiResponse({
    status: 404,
    description: 'Group not found or profile not yet created',
  })
  async getGroupAIProfile(
    @Req() req: Request,
    @Param('groupId') groupId: string,
  ): Promise<any> {
    const userId = req.user?.id;
    if (!userId) {
      throw new BadRequestException('User not authenticated');
    }

    // Verify user is a member
    const isMember = await this.groupsService.isUserInGroup(groupId, userId);
    if (!isMember) {
      throw new BadRequestException('You are not a member of this group');
    }

    const profile =
      await this.groupAIProfileService.getGroupStyleProfile(groupId);

    if (!profile) {
      throw new BadRequestException('Group AI profile not found');
    }

    return profile;
  }

  @Post(':groupId/ai/reset')
  @ApiOperation({
    summary: 'Reset group AI style',
    description: "Reset the Group AI's learned style (admin only)",
  })
  @ApiParam({
    name: 'groupId',
    description: 'Group ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({
    status: 200,
    description: 'Group AI style reset successfully',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - user is not a group admin',
  })
  @ApiResponse({
    status: 404,
    description: 'Group not found',
  })
  async resetGroupAIStyle(
    @Req() req: Request,
    @Param('groupId') groupId: string,
  ): Promise<{ message: string }> {
    const userId = req.user?.id;
    if (!userId) {
      throw new BadRequestException('User not authenticated');
    }

    // Verify user is an admin
    const isAdmin = await this.groupsService.isUserAdmin(groupId, userId);
    if (!isAdmin) {
      throw new BadRequestException('Only group admins can reset the AI style');
    }

    await this.groupAIProfileService.resetGroupStyleProfile(groupId);
    return { message: 'Group AI style reset successfully' };
  }

  @Patch(':groupId/ai/toggle')
  @ApiOperation({
    summary: 'Enable/disable group AI',
    description: 'Toggle the Group AI member on or off (admin only)',
  })
  @ApiParam({
    name: 'groupId',
    description: 'Group ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        aiEnabled: {
          type: 'boolean',
          description: 'Whether to enable or disable the Group AI',
          example: true,
        },
      },
      required: ['aiEnabled'],
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Group AI toggled successfully',
    type: GroupResponseDto,
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - user is not a group admin',
  })
  @ApiResponse({
    status: 404,
    description: 'Group not found',
  })
  async toggleGroupAI(
    @Req() req: Request,
    @Param('groupId') groupId: string,
    @Body() body: { aiEnabled: boolean },
  ): Promise<GroupResponseDto> {
    const userId = req.user?.id;
    if (!userId) {
      throw new BadRequestException('User not authenticated');
    }

    // Verify user is an admin
    const isAdmin = await this.groupsService.isUserAdmin(groupId, userId);
    if (!isAdmin) {
      throw new BadRequestException('Only group admins can toggle the AI');
    }

    return this.groupsService.updateGroup(groupId, userId, {
      aiEnabled: body.aiEnabled,
    });
  }
}
