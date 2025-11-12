import { Injectable } from '@nestjs/common';
import { db } from '../db';
import { groupStyleProfiles, groupMessages, userProfile } from '../db/schema';
import { eq, and } from 'drizzle-orm';
import { GroupAIStyleAnalysisService } from './group-ai-style-analysis.service';

export interface GroupStyleProfile {
  groupId: string;
  messageCount: number;
  memberContributions: Record<string, number>;
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

const UPDATE_INTERVAL = 20; // Update profile every 20 messages

@Injectable()
export class GroupAIProfileService {
  constructor(
    private readonly groupAIStyleAnalysisService: GroupAIStyleAnalysisService,
  ) { }

  /**
   * Update group style profile after analyzing messages
   * Should be called after every 20 new messages
   */
  async updateGroupStyleProfile(groupId: string): Promise<GroupStyleProfile> {
    // Get all group messages (excluding AI-generated ones)
    const messages = await db
      .select()
      .from(groupMessages)
      .where(
        and(
          eq(groupMessages.groupId, groupId),
          eq(groupMessages.isAIGenerated, false),
        ),
      );

    // Analyze messages
    const analysis =
      this.groupAIStyleAnalysisService.analyzeGroupMessages(messages);

    // Get member display names for the style prompt
    const memberIds = Object.keys(analysis.memberContributions);

    // Fetch all members
    const allMembers: Array<{ userId: string; displayName: string }> = [];
    for (const memberId of memberIds) {
      const [member] = await db
        .select({
          userId: userProfile.userId,
          displayName: userProfile.displayName,
        })
        .from(userProfile)
        .where(eq(userProfile.userId, memberId))
        .limit(1);

      if (member) {
        allMembers.push(member);
      }
    }

    // Generate style prompt
    const stylePrompt = this.generateGroupStylePrompt(analysis, allMembers);

    // Check if profile exists
    const existingProfile = await db
      .select()
      .from(groupStyleProfiles)
      .where(eq(groupStyleProfiles.groupId, groupId))
      .limit(1);

    const profileData = {
      groupId,
      messageCount: messages.length,
      memberContributions: analysis.memberContributions,
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
        .update(groupStyleProfiles)
        .set(profileData)
        .where(eq(groupStyleProfiles.groupId, groupId))
        .returning();

      return updated as GroupStyleProfile;
    } else {
      // Create new profile
      const [created] = await db
        .insert(groupStyleProfiles)
        .values(profileData)
        .returning();

      return created as GroupStyleProfile;
    }
  }

  /**
   * Get group's current style profile
   */
  async getGroupStyleProfile(
    groupId: string,
  ): Promise<GroupStyleProfile | null> {
    const [profile] = await db
      .select()
      .from(groupStyleProfiles)
      .where(eq(groupStyleProfiles.groupId, groupId))
      .limit(1);

    if (!profile) {
      return null;
    }

    // Get the actual current message count (excluding AI-generated messages)
    const messages = await db
      .select()
      .from(groupMessages)
      .where(
        and(
          eq(groupMessages.groupId, groupId),
          eq(groupMessages.isAIGenerated, false),
        ),
      );

    // Return profile with updated message count
    return {
      ...(profile as GroupStyleProfile),
      messageCount: messages.length,
    };
  } /**
   * Reset group's learned style data (admin only)
   */
  async resetGroupStyleProfile(groupId: string): Promise<void> {
    await db
      .update(groupStyleProfiles)
      .set({
        messageCount: 0,
        memberContributions: {},
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
      .where(eq(groupStyleProfiles.groupId, groupId));
  }

  /**
   * Check if group should trigger a style profile update
   * Updates every 20 messages
   */
  async shouldUpdateProfile(groupId: string): Promise<boolean> {
    const profile = await this.getGroupStyleProfile(groupId);

    // Get current message count (excluding AI-generated)
    const messages = await db
      .select()
      .from(groupMessages)
      .where(
        and(
          eq(groupMessages.groupId, groupId),
          eq(groupMessages.isAIGenerated, false),
        ),
      );

    const currentCount = messages.length;

    if (!profile) {
      // First time - only create profile if we have minimum messages
      return currentCount >= UPDATE_INTERVAL;
    }

    const lastCount = profile.messageCount;

    // Update every 20 messages
    return currentCount >= lastCount + UPDATE_INTERVAL;
  }

  /**
   * Generate style prompt text from analyzed patterns for LLM
   */
  private generateGroupStylePrompt(
    analysis: {
      commonPhrases: string[];
      emojiUsage: Record<string, number>;
      averageMessageLength: number;
      toneIndicators: {
        casual: number;
        formal: number;
        enthusiastic: number;
      };
      memberContributions: Record<string, number>;
    },
    members: Array<{ userId: string; displayName: string }>,
  ): string {
    const parts: string[] = [];

    parts.push(
      'You are an AI member of a group chat. You should mimic the collective chat style of the group members.',
    );
    parts.push('');

    // Group members
    if (members.length > 0) {
      parts.push(
        `Group has ${members.length} members: ${members.map((m) => m.displayName).join(', ')}`,
      );
      parts.push('');
    }

    // Common phrases
    if (analysis.commonPhrases.length > 0) {
      parts.push(`Common group phrases: ${analysis.commonPhrases.join(', ')}`);
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
      parts.push(`Group tone: ${toneDescriptions.join(', ')}`);
    }

    parts.push('');
    parts.push(
      "Respond naturally as a member of this group, reflecting the group's collective style.",
    );

    return parts.join('\n');
  }
}
