import { Injectable } from '@nestjs/common';
import { db } from '../db';
import { styleProfiles, messages, groupMessages } from '../db/schema';
import { eq, and, or } from 'drizzle-orm';
import { AIStyleAnalysisService } from './ai-style-analysis.service';

export interface StyleProfile {
  userId: string;
  messageCount: number;
  commonPhrases: string[];
  emojiUsage: Record<string, number>;
  averageMessageLength: number;
  toneIndicators: {
    casual: number;
    formal: number;
    enthusiastic: number;
  };
  stylePrompt: string;
  lastUpdated: Date;
}

@Injectable()
export class StyleProfileService {
  constructor(
    private readonly aiStyleAnalysisService: AIStyleAnalysisService,
  ) {}

  /**
   * Update style profile after every 10 messages
   */
  async updateStyleProfile(userId: string): Promise<StyleProfile> {
    // Get user's direct messages (excluding AI-generated ones)
    const userDirectMessages = await db
      .select()
      .from(messages)
      .where(
        and(
          or(eq(messages.fromUserId, userId), eq(messages.toUserId, userId)),
          eq(messages.isAIGenerated, false),
        ),
      );

    // Get user's group messages (excluding AI-generated ones)
    const userGroupMessages = await db
      .select()
      .from(groupMessages)
      .where(
        and(
          eq(groupMessages.fromUserId, userId),
          eq(groupMessages.isAIGenerated, false),
        ),
      );

    // Combine all messages sent by the user
    const sentMessages = [
      ...userDirectMessages.filter((msg) => msg.fromUserId === userId),
      ...userGroupMessages,
    ];

    // Analyze messages
    const analysis = this.aiStyleAnalysisService.analyzeMessages(
      sentMessages.map((msg) => ({
        content: msg.content,
        timestamp: msg.timestamp,
      })),
    );

    // Generate style prompt
    const stylePrompt = this.generateStylePrompt(analysis);

    // Check if profile exists
    const existingProfile = await db
      .select()
      .from(styleProfiles)
      .where(eq(styleProfiles.userId, userId))
      .limit(1);

    const profileData = {
      userId,
      messageCount: sentMessages.length,
      commonPhrases: analysis.commonPhrases,
      emojiUsage: analysis.emojiUsage,
      averageMessageLength: analysis.averageMessageLength,
      toneIndicators: analysis.toneIndicators,
      stylePrompt,
      lastUpdated: new Date(),
    };

    if (existingProfile.length > 0) {
      // Update existing profile
      const [updated] = await db
        .update(styleProfiles)
        .set(profileData)
        .where(eq(styleProfiles.userId, userId))
        .returning();

      return updated as StyleProfile;
    } else {
      // Create new profile
      const [created] = await db
        .insert(styleProfiles)
        .values(profileData)
        .returning();

      return created as StyleProfile;
    }
  }

  /**
   * Get user's current style profile
   */
  async getStyleProfile(userId: string): Promise<StyleProfile | null> {
    const [profile] = await db
      .select()
      .from(styleProfiles)
      .where(eq(styleProfiles.userId, userId))
      .limit(1);

    return profile ? (profile as StyleProfile) : null;
  }

  /**
   * Reset user's learned style data
   */
  async resetStyleProfile(userId: string): Promise<void> {
    await db
      .update(styleProfiles)
      .set({
        messageCount: 0,
        commonPhrases: [],
        emojiUsage: {},
        averageMessageLength: 0,
        toneIndicators: {
          casual: 0,
          formal: 0,
          enthusiastic: 0,
        },
        stylePrompt: '',
        lastUpdated: new Date(),
      })
      .where(eq(styleProfiles.userId, userId));
  }

  /**
   * Generate style prompt text from analyzed patterns for LLM
   */
  private generateStylePrompt(analysis: {
    commonPhrases: string[];
    emojiUsage: Record<string, number>;
    averageMessageLength: number;
    toneIndicators: {
      casual: number;
      formal: number;
      enthusiastic: number;
    };
  }): string {
    const parts: string[] = [];

    parts.push(
      'You are mimicking the chat style of a user. Here are their characteristics:',
    );
    parts.push('');

    // Common phrases
    if (analysis.commonPhrases.length > 0) {
      parts.push(`Common phrases: ${analysis.commonPhrases.join(', ')}`);
    }

    // Emoji usage
    const topEmojis = Object.entries(analysis.emojiUsage)
      .slice(0, 10)
      .map(([emoji, count]) => `${emoji} (${count} times)`);
    if (topEmojis.length > 0) {
      parts.push(`Frequently used emojis: ${topEmojis.join(', ')}`);
    }

    // Message length
    parts.push(
      `Average message length: ${analysis.averageMessageLength} characters`,
    );

    // Tone
    const toneDescriptions: string[] = [];
    if (analysis.toneIndicators.casual > 30) {
      toneDescriptions.push(`${analysis.toneIndicators.casual}% casual`);
    }
    if (analysis.toneIndicators.formal > 30) {
      toneDescriptions.push(`${analysis.toneIndicators.formal}% formal`);
    }
    if (analysis.toneIndicators.enthusiastic > 30) {
      toneDescriptions.push(
        `${analysis.toneIndicators.enthusiastic}% enthusiastic`,
      );
    }
    if (toneDescriptions.length > 0) {
      parts.push(`Tone: ${toneDescriptions.join(', ')}`);
    }

    parts.push('');
    parts.push(
      "Respond to messages in this user's style, keeping responses natural and conversational.",
    );

    return parts.join('\n');
  }

  /**
   * Check if user should trigger a style profile update
   */
  async shouldUpdateProfile(userId: string): Promise<boolean> {
    const profile = await this.getStyleProfile(userId);

    if (!profile) {
      return true; // First time, create profile
    }

    // Get current message count from both direct and group messages
    const userDirectMessages = await db
      .select()
      .from(messages)
      .where(
        and(eq(messages.fromUserId, userId), eq(messages.isAIGenerated, false)),
      );

    const userGroupMessages = await db
      .select()
      .from(groupMessages)
      .where(
        and(
          eq(groupMessages.fromUserId, userId),
          eq(groupMessages.isAIGenerated, false),
        ),
      );

    const currentCount = userDirectMessages.length + userGroupMessages.length;
    const lastCount = profile.messageCount;

    // Update every 10 messages
    return currentCount >= lastCount + 10;
  }
}
