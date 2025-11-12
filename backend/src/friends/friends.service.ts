import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { eq, and, or } from 'drizzle-orm';
import { db } from '../db';
import { friendRequests, friendships, user, userProfile } from '../db/schema';
import { FriendRequestResponseDto } from './dto/friend-request-response.dto';
import { FriendResponseDto } from './dto/friend-response.dto';
import { EventsGateway } from '../gateway/events.gateway';

@Injectable()
export class FriendsService {
  constructor(private readonly eventsGateway: EventsGateway) {}

  async sendFriendRequest(
    fromUserId: string,
    toUserId: string,
  ): Promise<FriendRequestResponseDto> {
    // Validate users exist
    if (fromUserId === toUserId) {
      throw new BadRequestException('Cannot send friend request to yourself');
    }

    const [fromUser, toUser] = await Promise.all([
      db.select().from(user).where(eq(user.id, fromUserId)).limit(1),
      db.select().from(user).where(eq(user.id, toUserId)).limit(1),
    ]);

    if (!fromUser || fromUser.length === 0) {
      throw new NotFoundException('Sender user not found');
    }

    if (!toUser || toUser.length === 0) {
      throw new NotFoundException('Recipient user not found');
    }

    // Check if friendship already exists
    const existingFriendship = await db
      .select()
      .from(friendships)
      .where(
        or(
          and(
            eq(friendships.userId1, fromUserId),
            eq(friendships.userId2, toUserId),
          ),
          and(
            eq(friendships.userId1, toUserId),
            eq(friendships.userId2, fromUserId),
          ),
        ),
      )
      .limit(1);

    if (existingFriendship && existingFriendship.length > 0) {
      throw new ConflictException('Users are already friends');
    }

    // Check if pending request already exists
    const existingRequest = await db
      .select()
      .from(friendRequests)
      .where(
        and(
          or(
            and(
              eq(friendRequests.fromUserId, fromUserId),
              eq(friendRequests.toUserId, toUserId),
            ),
            and(
              eq(friendRequests.fromUserId, toUserId),
              eq(friendRequests.toUserId, fromUserId),
            ),
          ),
          eq(friendRequests.status, 'pending'),
        ),
      )
      .limit(1);

    if (existingRequest && existingRequest.length > 0) {
      throw new ConflictException('Friend request already exists');
    }

    // Create friend request
    const [newRequest] = await db
      .insert(friendRequests)
      .values({
        fromUserId,
        toUserId,
        status: 'pending',
      })
      .returning();

    // Get sender profile for notification
    const [senderProfile] = await db
      .select({
        username: userProfile.username,
        displayName: userProfile.displayName,
        profilePictureUrl: userProfile.profilePictureUrl,
      })
      .from(userProfile)
      .where(eq(userProfile.userId, fromUserId))
      .limit(1);

    const response = {
      id: newRequest.id,
      fromUserId: newRequest.fromUserId,
      toUserId: newRequest.toUserId,
      status: newRequest.status,
      createdAt: newRequest.createdAt,
      fromUser:
        senderProfile && senderProfile.username && senderProfile.displayName
          ? {
              id: fromUserId,
              username: senderProfile.username,
              displayName: senderProfile.displayName,
              profilePictureUrl: senderProfile.profilePictureUrl,
            }
          : undefined,
    };

    // Emit WebSocket event to recipient
    this.eventsGateway.emitFriendRequest(toUserId, response);

    return response;
  }

  async acceptFriendRequest(
    requestId: string,
    userId: string,
  ): Promise<FriendRequestResponseDto> {
    // Find the friend request
    const [request] = await db
      .select()
      .from(friendRequests)
      .where(eq(friendRequests.id, requestId))
      .limit(1);

    if (!request) {
      throw new NotFoundException('Friend request not found');
    }

    // Verify the user is the recipient
    if (request.toUserId !== userId) {
      throw new BadRequestException(
        'You can only accept friend requests sent to you',
      );
    }

    // Verify request is pending
    if (request.status !== 'pending') {
      throw new BadRequestException('Friend request is not pending');
    }

    // Update request status to accepted
    const [updatedRequest] = await db
      .update(friendRequests)
      .set({ status: 'accepted' })
      .where(eq(friendRequests.id, requestId))
      .returning();

    // Create friendship
    await db.insert(friendships).values({
      userId1: request.fromUserId,
      userId2: request.toUserId,
    });

    // Get accepter profile for notification
    const [accepterProfile] = await db
      .select({
        username: userProfile.username,
        displayName: userProfile.displayName,
        profilePictureUrl: userProfile.profilePictureUrl,
      })
      .from(userProfile)
      .where(eq(userProfile.userId, userId))
      .limit(1);

    const response = {
      id: updatedRequest.id,
      fromUserId: updatedRequest.fromUserId,
      toUserId: updatedRequest.toUserId,
      status: updatedRequest.status,
      createdAt: updatedRequest.createdAt,
      toUser:
        accepterProfile &&
        accepterProfile.username &&
        accepterProfile.displayName
          ? {
              id: userId,
              username: accepterProfile.username,
              displayName: accepterProfile.displayName,
              profilePictureUrl: accepterProfile.profilePictureUrl,
            }
          : undefined,
    };

    // Emit WebSocket event to original sender
    this.eventsGateway.emitFriendAccepted(request.fromUserId, response);

    return response;
  }

  async rejectFriendRequest(
    requestId: string,
    userId: string,
  ): Promise<FriendRequestResponseDto> {
    // Find the friend request
    const [request] = await db
      .select()
      .from(friendRequests)
      .where(eq(friendRequests.id, requestId))
      .limit(1);

    if (!request) {
      throw new NotFoundException('Friend request not found');
    }

    // Verify the user is the recipient
    if (request.toUserId !== userId) {
      throw new BadRequestException(
        'You can only reject friend requests sent to you',
      );
    }

    // Verify request is pending
    if (request.status !== 'pending') {
      throw new BadRequestException('Friend request is not pending');
    }

    // Update request status to rejected
    const [updatedRequest] = await db
      .update(friendRequests)
      .set({ status: 'rejected' })
      .where(eq(friendRequests.id, requestId))
      .returning();

    return {
      id: updatedRequest.id,
      fromUserId: updatedRequest.fromUserId,
      toUserId: updatedRequest.toUserId,
      status: updatedRequest.status,
      createdAt: updatedRequest.createdAt,
    };
  }

  async getFriendRequests(userId: string): Promise<FriendRequestResponseDto[]> {
    // Get pending requests where user is the recipient
    const requests = await db
      .select({
        id: friendRequests.id,
        fromUserId: friendRequests.fromUserId,
        toUserId: friendRequests.toUserId,
        status: friendRequests.status,
        createdAt: friendRequests.createdAt,
        fromUsername: userProfile.username,
        fromDisplayName: userProfile.displayName,
        fromProfilePictureUrl: userProfile.profilePictureUrl,
      })
      .from(friendRequests)
      .leftJoin(userProfile, eq(friendRequests.fromUserId, userProfile.userId))
      .where(
        and(
          eq(friendRequests.toUserId, userId),
          eq(friendRequests.status, 'pending'),
        ),
      )
      .orderBy(friendRequests.createdAt);

    return requests.map((req) => ({
      id: req.id,
      fromUserId: req.fromUserId,
      toUserId: req.toUserId,
      status: req.status,
      createdAt: req.createdAt,
      fromUser:
        req.fromUsername && req.fromDisplayName
          ? {
              id: req.fromUserId,
              username: req.fromUsername,
              displayName: req.fromDisplayName,
              profilePictureUrl: req.fromProfilePictureUrl,
            }
          : undefined,
    }));
  }

  async getFriends(userId: string): Promise<FriendResponseDto[]> {
    // Get all friendships where user is either userId1 or userId2
    const friendshipsData = await db
      .select({
        friendshipId: friendships.id,
        userId1: friendships.userId1,
        userId2: friendships.userId2,
        createdAt: friendships.createdAt,
      })
      .from(friendships)
      .where(
        or(eq(friendships.userId1, userId), eq(friendships.userId2, userId)),
      )
      .orderBy(friendships.createdAt);

    // Process friendships to get friend data
    const friendsMap = new Map<string, FriendResponseDto>();

    for (const friendship of friendshipsData) {
      const friendId =
        friendship.userId1 === userId ? friendship.userId2 : friendship.userId1;

      if (!friendsMap.has(friendId)) {
        // Get friend's profile
        const [friendProfile] = await db
          .select({
            username: userProfile.username,
            displayName: userProfile.displayName,
            statusMessage: userProfile.statusMessage,
            profilePictureUrl: userProfile.profilePictureUrl,
          })
          .from(userProfile)
          .where(eq(userProfile.userId, friendId))
          .limit(1);

        if (
          friendProfile &&
          friendProfile.username &&
          friendProfile.displayName
        ) {
          friendsMap.set(friendId, {
            id: friendId,
            username: friendProfile.username,
            displayName: friendProfile.displayName,
            statusMessage: friendProfile.statusMessage,
            profilePictureUrl: friendProfile.profilePictureUrl,
            friendsSince: friendship.createdAt,
          });
        }
      }
    }

    return Array.from(friendsMap.values());
  }
}
