import { Injectable } from '@nestjs/common';
import { db } from '../db';
import { groupMessages, groupMessageReads, groupMembers } from '../db/schema';
import { eq, and, desc, count, inArray, sql } from 'drizzle-orm';

export interface GroupMessage {
  id: string;
  groupId: string;
  fromUserId: string;
  content: string;
  timestamp: Date;
  isAIGenerated: boolean;
  mentionedUserIds: string[];
}

@Injectable()
export class GroupMessageService {
  async sendGroupMessage(
    groupId: string,
    fromUserId: string,
    content: string,
    isAIGenerated = false,
  ): Promise<GroupMessage> {
    // Extract mentions from content
    const mentionedUserIds = this.extractMentions(content);

    const [message] = await db
      .insert(groupMessages)
      .values({
        groupId,
        fromUserId,
        content,
        isAIGenerated,
        mentionedUserIds,
      })
      .returning();

    return message;
  }

  async getGroupMessages(
    groupId: string,
    limit = 50,
    before?: Date,
  ): Promise<GroupMessage[]> {
    let query = db
      .select()
      .from(groupMessages)
      .where(eq(groupMessages.groupId, groupId))
      .orderBy(desc(groupMessages.timestamp))
      .limit(limit);

    // If 'before' timestamp is provided, fetch messages before that time
    if (before) {
      query = db
        .select()
        .from(groupMessages)
        .where(
          and(
            eq(groupMessages.groupId, groupId),
            sql`${groupMessages.timestamp} < ${before}`,
          ),
        )
        .orderBy(desc(groupMessages.timestamp))
        .limit(limit);
    }

    const messages = await query;

    // Return in chronological order (oldest first)
    return messages.reverse();
  }

  async markGroupMessagesAsRead(
    groupId: string,
    userId: string,
  ): Promise<void> {
    // Get all unread messages in this group for this user
    const unreadMessages = await db
      .select({ id: groupMessages.id })
      .from(groupMessages)
      .leftJoin(
        groupMessageReads,
        and(
          eq(groupMessageReads.groupMessageId, groupMessages.id),
          eq(groupMessageReads.userId, userId),
        ),
      )
      .where(
        and(
          eq(groupMessages.groupId, groupId),
          sql`${groupMessageReads.id} IS NULL`,
        ),
      );

    if (unreadMessages.length === 0) {
      return;
    }

    // Mark all as read by inserting read records
    await db.insert(groupMessageReads).values(
      unreadMessages.map((msg) => ({
        groupMessageId: msg.id,
        userId,
      })),
    );
  }

  async getUnreadGroupMessageCount(userId: string): Promise<number> {
    // Get all groups the user is a member of
    const userGroups = await db
      .select({ groupId: groupMembers.groupId })
      .from(groupMembers)
      .where(eq(groupMembers.userId, userId));

    if (userGroups.length === 0) {
      return 0;
    }

    const groupIds = userGroups.map((g) => g.groupId);

    // Count messages in user's groups that they haven't read
    const result = await db
      .select({ count: count() })
      .from(groupMessages)
      .leftJoin(
        groupMessageReads,
        and(
          eq(groupMessageReads.groupMessageId, groupMessages.id),
          eq(groupMessageReads.userId, userId),
        ),
      )
      .where(
        and(
          inArray(groupMessages.groupId, groupIds),
          sql`${groupMessageReads.id} IS NULL`,
          // Don't count user's own messages as unread
          sql`${groupMessages.fromUserId} != ${userId}`,
        ),
      );

    return result[0]?.count || 0;
  }

  extractMentions(content: string): string[] {
    // Match @username or @AI patterns
    const mentionRegex = /@(\w+)/g;
    const mentions: string[] = [];
    let match;

    while ((match = mentionRegex.exec(content)) !== null) {
      mentions.push(match[1]);
    }

    // Return unique mentions
    return [...new Set(mentions)];
  }
}
