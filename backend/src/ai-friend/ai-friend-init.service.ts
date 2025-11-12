import { Injectable, OnModuleInit } from '@nestjs/common';
import { db } from '../db';
import { user, userProfile } from '../db/schema';
import { eq } from 'drizzle-orm';

const AI_FRIEND_USER_ID = 'kirhost';

@Injectable()
export class AIFriendInitService implements OnModuleInit {
  async onModuleInit() {
    await this.ensureAIFriendExists();
  }

  /**
   * Create special kirhost  contact if it doesn't exist
   */
  private async ensureAIFriendExists(): Promise<void> {
    try {
      // Check if kirhost user exists
      const existingUser = await db
        .select()
        .from(user)
        .where(eq(user.id, AI_FRIEND_USER_ID))
        .limit(1);

      if (existingUser.length === 0) {
        // Create kirhost user
        await db.insert(user).values({
          id: AI_FRIEND_USER_ID,
          name: 'kirhost',
          email: 'kirhost@retrochat.app',
          emailVerified: true,
        });

        // Create kirhost profile
        await db.insert(userProfile).values({
          userId: AI_FRIEND_USER_ID,
          username: 'kirhost',
          displayName: '🤖 kirhost',
          statusMessage: 'I learn from you and chat like you! 👻',
          profilePictureUrl: null,
        });

        console.log('kirhost user created successfully');
      }
    } catch (error) {
      console.error('Error ensuring kirhost exists:', error);
    }
  }
}
