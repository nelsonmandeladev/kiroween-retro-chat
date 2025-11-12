import { Injectable } from '@nestjs/common';
import { db } from '../db';
import { user, userProfile, groupMembers } from '../db/schema';
import { eq, and } from 'drizzle-orm';

@Injectable()
export class GroupAIInitService {
  /**
   * Create Group AI Member for a specific group
   * AI user ID follows pattern: 'group-ai-{groupId}'
   */
  async createGroupAIMember(groupId: string): Promise<void> {
    const aiUserId = this.getGroupAIUserId(groupId);

    try {
      // Check if AI user already exists
      const existingUser = await db
        .select()
        .from(user)
        .where(eq(user.id, aiUserId))
        .limit(1);

      if (existingUser.length === 0) {
        // Create AI user
        await db.insert(user).values({
          id: aiUserId,
          name: 'Group AI',
          email: `group-ai-${groupId}@retrochat.app`,
          emailVerified: true,
        });

        // Create AI profile
        await db.insert(userProfile).values({
          userId: aiUserId,
          username: `group-ai-${groupId}`,
          displayName: '🤖 Group AI',
          statusMessage: 'Learning from the group!',
          profilePictureUrl: null,
        });

        console.log(`Group AI member created for group ${groupId}`);
      }

      // Check if AI is already a group member
      const existingMembership = await db
        .select()
        .from(groupMembers)
        .where(
          and(
            eq(groupMembers.groupId, groupId),
            eq(groupMembers.userId, aiUserId),
          ),
        )
        .limit(1);

      if (existingMembership.length === 0) {
        // Add AI as group member (not admin)
        await db.insert(groupMembers).values({
          groupId,
          userId: aiUserId,
          isAdmin: false,
        });

        console.log(`Group AI member added to group ${groupId}`);
      }
    } catch (error) {
      console.error(
        `Error creating Group AI member for group ${groupId}:`,
        error,
      );
      throw error;
    }
  }

  /**
   * Get the AI user ID for a specific group
   */
  getGroupAIUserId(groupId: string): string {
    return `group-ai-${groupId}`;
  }

  /**
   * Check if a user ID is a Group AI member
   */
  isGroupAIMember(userId: string): boolean {
    return userId.startsWith('group-ai-');
  }

  /**
   * Extract group ID from Group AI user ID
   */
  extractGroupIdFromAIUserId(aiUserId: string): string | null {
    if (!this.isGroupAIMember(aiUserId)) {
      return null;
    }
    return aiUserId.replace('group-ai-', '');
  }
}
