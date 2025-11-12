import { Injectable, NotFoundException } from '@nestjs/common';
import { db } from '../db';
import { messages } from '../db/schema';
import { eq, and, or, desc, count } from 'drizzle-orm';
import { MessageResponseDto } from './dto/message-response.dto';

@Injectable()
export class ChatService {
  async sendMessage(
    fromUserId: string,
    toUserId: string,
    content: string,
    isAIGenerated = false,
  ): Promise<MessageResponseDto> {
    const [message] = await db
      .insert(messages)
      .values({
        fromUserId,
        toUserId,
        content,
        isAIGenerated,
      })
      .returning();

    return message;
  }

  async getConversation(
    userId1: string,
    userId2: string,
    limit = 50,
  ): Promise<MessageResponseDto[]> {
    const conversation = await db
      .select()
      .from(messages)
      .where(
        or(
          and(eq(messages.fromUserId, userId1), eq(messages.toUserId, userId2)),
          and(eq(messages.fromUserId, userId2), eq(messages.toUserId, userId1)),
        ),
      )
      .orderBy(desc(messages.timestamp))
      .limit(limit);

    // Return in chronological order (oldest first)
    return conversation.reverse();
  }

  async markAsRead(messageId: string): Promise<void> {
    const result = await db
      .update(messages)
      .set({ isRead: true })
      .where(eq(messages.id, messageId))
      .returning();

    if (result.length === 0) {
      throw new NotFoundException(`Message with ID ${messageId} not found`);
    }
  }

  async getUnreadCount(userId: string): Promise<number> {
    const result = await db
      .select({ count: count() })
      .from(messages)
      .where(and(eq(messages.toUserId, userId), eq(messages.isRead, false)));

    return result[0]?.count || 0;
  }
}
