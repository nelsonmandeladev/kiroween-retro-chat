import { Injectable } from '@nestjs/common';

interface Message {
  content: string;
  timestamp: Date;
}

interface StyleAnalysis {
  commonPhrases: string[];
  emojiUsage: Record<string, number>;
  averageMessageLength: number;
  toneIndicators: {
    casual: number;
    formal: number;
    enthusiastic: number;
  };
}

@Injectable()
export class AIStyleAnalysisService {
  /**
   * Analyze messages to extract chat patterns
   */
  analyzeMessages(messages: Message[]): StyleAnalysis {
    if (messages.length === 0) {
      return this.getEmptyAnalysis();
    }

    const commonPhrases = this.extractCommonPhrases(messages);
    const emojiUsage = this.detectEmojiUsage(messages);
    const averageMessageLength = this.calculateAverageMessageLength(messages);
    const toneIndicators = this.analyzeTone(messages);

    return {
      commonPhrases,
      emojiUsage,
      averageMessageLength,
      toneIndicators,
    };
  }

  /**
   * Extract common phrases using frequency analysis
   */
  private extractCommonPhrases(messages: Message[]): string[] {
    const phraseFrequency = new Map<string, number>();

    messages.forEach((message) => {
      const content = message.content.toLowerCase();

      // Extract 2-4 word phrases
      const words = content.split(/\s+/);

      for (let length = 2; length <= 4; length++) {
        for (let i = 0; i <= words.length - length; i++) {
          const phrase = words.slice(i, i + length).join(' ');

          // Filter out phrases that are too short or contain only common words
          if (phrase.length > 5 && !this.isCommonPhrase(phrase)) {
            phraseFrequency.set(phrase, (phraseFrequency.get(phrase) || 0) + 1);
          }
        }
      }
    });

    // Get top 10 most common phrases (appearing at least twice)
    return Array.from(phraseFrequency.entries())
      .filter(([, count]) => count >= 2)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([phrase]) => phrase);
  }

  /**
   * Check if a phrase is too common to be meaningful
   */
  private isCommonPhrase(phrase: string): boolean {
    const commonWords = [
      'i am',
      'you are',
      'it is',
      'that is',
      'this is',
      'i have',
      'you have',
      'we are',
      'they are',
      'going to',
      'want to',
      'have to',
      'need to',
    ];
    return commonWords.includes(phrase);
  }

  /**
   * Detect emoji usage patterns
   */
  private detectEmojiUsage(messages: Message[]): Record<string, number> {
    const emojiRegex =
      /[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu;
    const emojiCount = new Map<string, number>();

    messages.forEach((message) => {
      const emojis = message.content.match(emojiRegex) || [];
      emojis.forEach((emoji) => {
        emojiCount.set(emoji, (emojiCount.get(emoji) || 0) + 1);
      });
    });

    // Convert to plain object and get top 20 emojis
    const sortedEmojis = Array.from(emojiCount.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20);

    return Object.fromEntries(sortedEmojis);
  }

  /**
   * Calculate average message length
   */
  private calculateAverageMessageLength(messages: Message[]): number {
    if (messages.length === 0) return 0;

    const totalLength = messages.reduce(
      (sum, message) => sum + message.content.length,
      0,
    );

    return Math.round(totalLength / messages.length);
  }

  /**
   * Analyze tone indicators using basic sentiment analysis
   */
  private analyzeTone(messages: Message[]): {
    casual: number;
    formal: number;
    enthusiastic: number;
  } {
    let casualScore = 0;
    let formalScore = 0;
    let enthusiasticScore = 0;

    const casualIndicators = [
      'lol',
      'lmao',
      'haha',
      'yeah',
      'yep',
      'nah',
      'gonna',
      'wanna',
      'kinda',
      'sorta',
      'dunno',
      'idk',
      'tbh',
      'omg',
      'btw',
    ];

    const formalIndicators = [
      'however',
      'therefore',
      'furthermore',
      'nevertheless',
      'regarding',
      'sincerely',
      'respectfully',
      'accordingly',
      'consequently',
    ];

    const enthusiasticIndicators = [
      '!',
      '!!',
      '!!!',
      'awesome',
      'amazing',
      'great',
      'love',
      'excited',
      'yay',
      'woohoo',
      'fantastic',
      'wonderful',
      'brilliant',
    ];

    messages.forEach((message) => {
      const content = message.content.toLowerCase();

      // Count casual indicators
      casualIndicators.forEach((indicator) => {
        if (content.includes(indicator)) casualScore++;
      });

      // Count formal indicators
      formalIndicators.forEach((indicator) => {
        if (content.includes(indicator)) formalScore++;
      });

      // Count enthusiastic indicators
      enthusiasticIndicators.forEach((indicator) => {
        if (content.includes(indicator)) enthusiasticScore++;
      });

      // Check for multiple exclamation marks
      const exclamationCount = (content.match(/!+/g) || []).length;
      if (exclamationCount > 0) enthusiasticScore += exclamationCount;
    });

    // Normalize scores to percentages
    const total = casualScore + formalScore + enthusiasticScore || 1;

    return {
      casual: Math.round((casualScore / total) * 100),
      formal: Math.round((formalScore / total) * 100),
      enthusiastic: Math.round((enthusiasticScore / total) * 100),
    };
  }

  /**
   * Return empty analysis structure
   */
  private getEmptyAnalysis(): StyleAnalysis {
    return {
      commonPhrases: [],
      emojiUsage: {},
      averageMessageLength: 0,
      toneIndicators: {
        casual: 0,
        formal: 0,
        enthusiastic: 0,
      },
    };
  }
}
