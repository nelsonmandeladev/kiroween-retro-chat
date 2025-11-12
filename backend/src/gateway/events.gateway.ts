import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger, Inject, forwardRef } from '@nestjs/common';
import { auth } from '../lib/auth';
import { RedisService } from './redis.service';
import { ChatService } from '../chat/chat.service';
import { StyleProfileService } from '../ai-friend/style-profile.service';
import { AIFriendService } from '../ai-friend/ai-friend.service';
import { GroupsService } from '../groups/groups.service';
import { GroupMessageService } from '../groups/group-message.service';
import { GroupAIService } from '../groups/group-ai.service';
import { GroupAIProfileService } from '../groups/group-ai-profile.service';

interface SocketData {
  userId?: string;
}

@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  },
})
export class EventsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(EventsGateway.name);

  constructor(
    private readonly redisService: RedisService,
    private readonly chatService: ChatService,
    @Inject(forwardRef(() => StyleProfileService))
    private readonly styleProfileService: StyleProfileService,
    @Inject(forwardRef(() => AIFriendService))
    private readonly aiFriendService: AIFriendService,
    private readonly groupsService: GroupsService,
    private readonly groupMessageService: GroupMessageService,
    private readonly groupAIService: GroupAIService,
    private readonly groupAIProfileService: GroupAIProfileService,
  ) { }

  async handleConnection(client: Socket<any, any, any, SocketData>) {
    this.logger.log(`Client attempting connection: ${client.id}`);

    try {
      // Validate session with Better-auth using cookies from handshake
      const session = await auth.api.getSession({
        headers: client.handshake.headers as any,
      });

      if (!session || !session.user) {
        this.logger.warn(`Invalid session for socket ${client.id}`);
        client.disconnect();
        return;
      }

      const userId = session.user.id;
      client.data.userId = userId;

      // Store user connection in Redis
      await this.redisService.setUserOnline(userId, client.id);

      // Emit user online status to all connected clients
      this.server.emit('user:status', {
        userId,
        status: 'online',
      });

      this.logger.log(`User ${userId} connected with socket ${client.id}`);
    } catch (error) {
      this.logger.error(
        `Connection error: ${error instanceof Error ? error.message : String(error)}`,
      );
      client.disconnect();
    }
  }

  async handleDisconnect(client: Socket<any, any, any, SocketData>) {
    this.logger.log(`Client disconnected: ${client.id}`);

    const userId = client.data.userId;
    if (userId) {
      // Remove user from Redis
      await this.redisService.setUserOffline(userId);

      // Emit user offline status
      this.server.emit('user:status', {
        userId,
        status: 'offline',
      });

      this.logger.log(`User ${userId} disconnected`);
    }
  }

  // Helper method to emit to a specific user
  async emitToUser(userId: string, event: string, data: any) {
    const socketId = await this.redisService.getSocketByUser(userId);
    if (socketId) {
      this.server.to(socketId).emit(event, data);
      this.logger.log(`Emitted ${event} to user ${userId}`);
      return true;
    }
    return false;
  }

  // Friend request notifications
  async emitFriendRequest(toUserId: string, requestData: any) {
    await this.emitToUser(toUserId, 'friend:request', requestData);
  }

  async emitFriendAccepted(toUserId: string, acceptData: any) {
    await this.emitToUser(toUserId, 'friend:accepted', acceptData);
  }

  // Message events
  @SubscribeMessage('message:send')
  async handleMessageSend(
    @ConnectedSocket() client: Socket<any, any, any, SocketData>,
    @MessageBody() payload: { toUserId: string; content: string },
  ) {
    const fromUserId = client.data.userId;

    if (!fromUserId) {
      this.logger.warn('Unauthenticated message send attempt');
      return;
    }

    try {
      // Save message to database
      const message = await this.chatService.sendMessage(
        fromUserId,
        payload.toUserId,
        payload.content,
      );

      // Trigger style profile update when user sends messages (async, non-blocking)
      this.styleProfileService
        .shouldUpdateProfile(fromUserId)
        .then((shouldUpdate) => {
          if (shouldUpdate) {
            return this.styleProfileService.updateStyleProfile(fromUserId);
          }
        })
        .catch((error) => {
          this.logger.error(
            `Error updating style profile: ${error instanceof Error ? error.message : String(error)}`,
          );
        });

      // Emit to recipient if online
      const sent = await this.emitToUser(
        payload.toUserId,
        'message:receive',
        message,
      );

      if (sent) {
        this.logger.log(
          `Message sent from ${fromUserId} to ${payload.toUserId}`,
        );
      } else {
        this.logger.log(
          `Message saved but recipient ${payload.toUserId} is offline`,
        );
      }

      // Send acknowledgment back to sender
      client.emit('message:sent', message);
    } catch (error) {
      this.logger.error(
        `Error sending message: ${error instanceof Error ? error.message : String(error)}`,
      );
      client.emit('message:error', { error: 'Failed to send message' });
    }
  }

  @SubscribeMessage('user:typing')
  async handleTyping(
    @ConnectedSocket() client: Socket<any, any, any, SocketData>,
    @MessageBody() payload: { toUserId: string },
  ) {
    const fromUserId = client.data.userId;

    if (!fromUserId) {
      return;
    }

    // Emit typing indicator to recipient
    await this.emitToUser(payload.toUserId, 'user:typing', {
      fromUserId,
    });
  }

  // Check online status of multiple users
  @SubscribeMessage('user:check-status')
  async handleCheckStatus(
    @ConnectedSocket() client: Socket<any, any, any, SocketData>,
    @MessageBody() payload: { userIds: string[] },
  ) {
    const requestingUserId = client.data.userId;

    if (!requestingUserId) {
      return;
    }

    try {
      // Check online status for each user
      const statuses = await Promise.all(
        payload.userIds.map(async (userId) => {
          const isOnline = await this.redisService.isUserOnline(userId);
          return {
            userId,
            status: isOnline ? 'online' : 'offline',
          };
        }),
      );

      // Send back the statuses
      client.emit('user:status-batch', { statuses });
    } catch (error) {
      this.logger.error(
        `Error checking user statuses: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  // AI Friend streaming message handler
  @SubscribeMessage('ai-friend:message')
  async handleAIFriendMessage(
    @ConnectedSocket() client: Socket<any, any, any, SocketData>,
    @MessageBody() payload: { content: string },
  ) {
    const userId = client.data.userId;

    if (!userId) {
      this.logger.warn('Unauthenticated AI Friend message attempt');
      return;
    }

    try {
      const AI_FRIEND_USER_ID = this.aiFriendService.getAIFriendUserId();

      // Store user's message to AI Friend
      const userMessage = await this.chatService.sendMessage(
        userId,
        AI_FRIEND_USER_ID,
        payload.content,
        false,
      );

      // Send user message acknowledgment
      client.emit('ai-friend:user-message-sent', userMessage);

      // Check if we should update the style profile (async, non-blocking)
      this.styleProfileService
        .shouldUpdateProfile(userId)
        .then((shouldUpdate) => {
          if (shouldUpdate) {
            return this.styleProfileService.updateStyleProfile(userId);
          }
        })
        .catch((error) => {
          this.logger.error(
            `Error updating style profile: ${error instanceof Error ? error.message : String(error)}`,
          );
        });

      // Generate and stream AI response
      let fullResponse = '';

      // Emit streaming start
      client.emit('ai-friend:stream-start', {
        messageId: userMessage.id,
      });

      // Stream the response chunks
      for await (const chunk of this.aiFriendService.generateAIResponseStream(
        userId,
        payload.content,
      )) {
        fullResponse += chunk;
        client.emit('ai-friend:stream-chunk', {
          chunk,
          fullResponse,
        });
      }

      // Store the complete AI-generated message
      const aiMessage = await this.chatService.sendMessage(
        AI_FRIEND_USER_ID,
        userId,
        fullResponse,
        true, // isAIGenerated = true
      );

      // Emit streaming end with complete message
      client.emit('ai-friend:stream-end', {
        message: aiMessage,
      });

      this.logger.log(`AI Friend responded to user ${userId}`);
    } catch (error) {
      this.logger.error(
        `Error in AI Friend message: ${error instanceof Error ? error.message : String(error)}`,
      );
      client.emit('ai-friend:error', {
        error: 'Failed to generate AI response',
      });
    }
  }

  // Group messaging events
  @SubscribeMessage('group:message:send')
  async handleGroupMessageSend(
    @ConnectedSocket() client: Socket<any, any, any, SocketData>,
    @MessageBody() payload: { groupId: string; content: string },
  ) {
    const fromUserId = client.data.userId;

    if (!fromUserId) {
      this.logger.warn('Unauthenticated group message send attempt');
      return;
    }

    try {
      // Verify user is a member of the group
      const isMember = await this.groupsService.isUserInGroup(
        payload.groupId,
        fromUserId,
      );

      if (!isMember) {
        this.logger.warn(
          `User ${fromUserId} attempted to send message to group ${payload.groupId} without membership`,
        );
        client.emit('group:message:error', {
          error: 'You are not a member of this group',
        });
        return;
      }

      // Save message to database
      const message = await this.groupMessageService.sendGroupMessage(
        payload.groupId,
        fromUserId,
        payload.content,
      );

      // Get all group members
      const groupMembers = await this.groupsService.getGroupMembers(
        payload.groupId,
      );

      // Emit to all online group members
      for (const member of groupMembers) {
        if (member.userId !== fromUserId) {
          await this.emitToUser(
            member.userId,
            'group:message:receive',
            message,
          );
        }
      }

      // Send acknowledgment back to sender
      client.emit('group:message:sent', message);

      // Trigger style profile update when group messages are sent (async, non-blocking)
      this.groupAIProfileService
        .shouldUpdateProfile(payload.groupId)
        .then((shouldUpdate) => {
          if (shouldUpdate) {
            return this.groupAIProfileService.updateGroupStyleProfile(
              payload.groupId,
            );
          }
        })
        .catch((error) => {
          this.logger.error(
            `Error updating group style profile: ${error instanceof Error ? error.message : String(error)}`,
          );
        });

      this.logger.log(
        `Group message sent by ${fromUserId} to group ${payload.groupId}`,
      );
    } catch (error) {
      this.logger.error(
        `Error sending group message: ${error instanceof Error ? error.message : String(error)}`,
      );
      client.emit('group:message:error', { error: 'Failed to send message' });
    }
  }

  @SubscribeMessage('group:typing')
  async handleGroupTyping(
    @ConnectedSocket() client: Socket<any, any, any, SocketData>,
    @MessageBody() payload: { groupId: string },
  ) {
    const fromUserId = client.data.userId;

    if (!fromUserId) {
      return;
    }

    try {
      // Verify user is a member of the group
      const isMember = await this.groupsService.isUserInGroup(
        payload.groupId,
        fromUserId,
      );

      if (!isMember) {
        return;
      }

      // Get user profile for display name
      const group = await this.groupsService.getGroup(payload.groupId);
      const member = group.members.find((m) => m.userId === fromUserId);

      if (!member) {
        return;
      }

      // Get all group members
      const groupMembers = await this.groupsService.getGroupMembers(
        payload.groupId,
      );

      // Emit typing indicator to all other online group members
      for (const groupMember of groupMembers) {
        if (groupMember.userId !== fromUserId) {
          await this.emitToUser(groupMember.userId, 'group:typing', {
            groupId: payload.groupId,
            userId: fromUserId,
            username: member.user.displayName,
          });
        }
      }
    } catch (error) {
      this.logger.error(
        `Error handling group typing: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  // Helper methods for group events
  async emitGroupMemberAdded(
    groupId: string,
    member: {
      id: string;
      userId: string;
      isAdmin: boolean;
      joinedAt: Date;
      notificationsMuted: boolean;
      user: {
        id: string;
        username: string;
        displayName: string;
        profilePictureUrl: string | null;
      };
    },
  ) {
    try {
      const groupMembers = await this.groupsService.getGroupMembers(groupId);

      for (const groupMember of groupMembers) {
        await this.emitToUser(groupMember.userId, 'group:member:added', {
          groupId,
          member,
        });
      }

      this.logger.log(`Emitted member added event for group ${groupId}`);
    } catch (error) {
      this.logger.error(
        `Error emitting group member added: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  async emitGroupMemberRemoved(groupId: string, userId: string) {
    try {
      const groupMembers = await this.groupsService.getGroupMembers(groupId);

      for (const groupMember of groupMembers) {
        await this.emitToUser(groupMember.userId, 'group:member:removed', {
          groupId,
          userId,
        });
      }

      // Also notify the removed user
      await this.emitToUser(userId, 'group:member:removed', {
        groupId,
        userId,
      });

      this.logger.log(`Emitted member removed event for group ${groupId}`);
    } catch (error) {
      this.logger.error(
        `Error emitting group member removed: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  async emitGroupDeleted(
    groupId: string,
    groupName: string,
    members: Array<{ userId: string }>,
  ) {
    try {
      // Notify all members about group deletion
      for (const member of members) {
        await this.emitToUser(member.userId, 'group:deleted', {
          groupId,
          groupName,
        });
      }

      this.logger.log(`Emitted group deleted event for group ${groupId}`);
    } catch (error) {
      this.logger.error(
        `Error emitting group deleted: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  // Group AI streaming message handler
  @SubscribeMessage('group:ai:mention')
  async handleGroupAIMention(
    @ConnectedSocket() client: Socket<any, any, any, SocketData>,
    @MessageBody() payload: { groupId: string; content: string },
  ) {
    const mentionedBy = client.data.userId;

    if (!mentionedBy) {
      this.logger.warn('Unauthenticated Group AI mention attempt');
      return;
    }

    try {
      // Verify user is a member of the group
      const isMember = await this.groupsService.isUserInGroup(
        payload.groupId,
        mentionedBy,
      );

      if (!isMember) {
        this.logger.warn(
          `User ${mentionedBy} attempted to mention Group AI in group ${payload.groupId} without membership`,
        );
        client.emit('group:ai:error', {
          error: 'You are not a member of this group',
        });
        return;
      }

      // Check if we should update the profile BEFORE generating response
      const shouldUpdate = await this.groupAIProfileService.shouldUpdateProfile(
        payload.groupId,
      );
      if (shouldUpdate) {
        this.logger.log(
          `Updating group style profile for ${payload.groupId} before AI response`,
        );
        await this.groupAIProfileService.updateGroupStyleProfile(
          payload.groupId,
        );
      }

      // Get all group members to broadcast streaming
      const groupMembers = await this.groupsService.getGroupMembers(
        payload.groupId,
      );

      // Generate and stream AI response
      let fullResponse = '';
      const messageId = `temp-${Date.now()}`; // Temporary ID for streaming

      // Emit streaming start to all group members
      for (const member of groupMembers) {
        await this.emitToUser(member.userId, 'group:ai:stream-start', {
          groupId: payload.groupId,
          messageId,
        });
      }

      // Stream the response chunks
      for await (const chunk of this.groupAIService.generateGroupAIResponseStream(
        payload.groupId,
        payload.content,
      )) {
        fullResponse += chunk;

        // Emit chunk to all group members
        for (const member of groupMembers) {
          await this.emitToUser(member.userId, 'group:ai:stream-chunk', {
            groupId: payload.groupId,
            chunk,
            fullResponse,
          });
        }
      }

      // Store the complete AI-generated message
      const aiMessage = await this.groupAIService.sendGroupAIMessage(
        payload.groupId,
        fullResponse,
      );

      // Emit streaming end with complete message to all group members
      for (const member of groupMembers) {
        await this.emitToUser(member.userId, 'group:ai:stream-end', {
          groupId: payload.groupId,
          message: aiMessage,
        });
      }

      this.logger.log(
        `Group AI responded in group ${payload.groupId} (mentioned by ${mentionedBy})`,
      );
    } catch (error) {
      this.logger.error(
        `Error in Group AI mention: ${error instanceof Error ? error.message : String(error)}`,
      );

      // Emit error to the user who mentioned
      client.emit('group:ai:error', {
        error: 'Failed to generate AI response',
      });
    }
  }
}
