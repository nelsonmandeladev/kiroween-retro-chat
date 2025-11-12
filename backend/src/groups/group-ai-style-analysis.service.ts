import { Injectable } from '@nestjs/common';
import { AIStyleAnalysisService } from '../ai-friend/ai-style-analysis.service';

interface GroupMessage {
  content: string;
  timestamp: Date;
  fromUserId: string;
}

interface GroupStyleAnalysis {
  commonPhrases: string[];
  emojiUsage: Record<string, number>;
  averageMessageLength: number;
  toneIndicators: {
    casual: number;
    formal: number;
    enthusiastic: number;
  };
  memberContributions: Record<string, number>;
}

@Injectable()
export class GroupAIStyleAnalysisService {
  constructor(
    private readonly aiStyleAnalysisService: AIStyleAnalysisService,
  ) {}

  /**
   * Analyze group messages to extract collective chat patterns
   * Aggregates patterns from all group members
   * Weights recent messages more heavily
   */
  analyzeGroupMessages(messages: GroupMessage[]): GroupStyleAnalysis {
    if (messages.length === 0) {
      return this.getEmptyAnalysis();
    }

    // Weight recent messages more heavily
    const weightedMessages = this.applyRecencyWeighting(messages);

    // Use existing AI style analysis service for pattern extraction
    const baseAnalysis = this.aiStyleAnalysisService.analyzeMessages(
      weightedMessages.map((msg) => ({
        content: msg.content,
        timestamp: msg.timestamp,
      })),
    );

    // Track member contributions
    const memberContributions = this.calculateMemberContributions(messages);

    return {
      ...baseAnalysis,
      memberContributions,
    };
  }

  /**
   * Apply recency weighting to messages
   * Recent messages are duplicated to give them more weight in analysis
   */
  private applyRecencyWeighting(messages: GroupMessage[]): GroupMessage[] {
    // Sort messages by timestamp (oldest first)
    const sortedMessages = [...messages].sort(
      (a, b) => a.timestamp.getTime() - b.timestamp.getTime(),
    );

    const weightedMessages: GroupMessage[] = [];

    sortedMessages.forEach((message, index) => {
      // Calculate weight based on position (more recent = higher weight)
      // Last 20% of messages get 3x weight
      // Middle 30% get 2x weight
      // Oldest 50% get 1x weight
      const position = index / sortedMessages.length;
      let weight = 1;

      if (position >= 0.8) {
        weight = 3; // Most recent 20%
      } else if (position >= 0.5) {
        weight = 2; // Middle 30%
      }

      // Add message multiple times based on weight
      for (let i = 0; i < weight; i++) {
        weightedMessages.push(message);
      }
    });

    return weightedMessages;
  }

  /**
   * Calculate how much each member contributes to the group style
   * Returns a map of userId -> message count
   */
  private calculateMemberContributions(
    messages: GroupMessage[],
  ): Record<string, number> {
    const contributions: Record<string, number> = {};

    messages.forEach((message) => {
      const userId = message.fromUserId;
      contributions[userId] = (contributions[userId] || 0) + 1;
    });

    return contributions;
  }

  /**
   * Return empty analysis structure
   */
  private getEmptyAnalysis(): GroupStyleAnalysis {
    return {
      commonPhrases: [],
      emojiUsage: {},
      averageMessageLength: 0,
      toneIndicators: {
        casual: 0,
        formal: 0,
        enthusiastic: 0,
      },
      memberContributions: {},
    };
  }
}
