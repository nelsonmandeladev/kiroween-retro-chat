import { Injectable } from '@nestjs/common';
import OpenAI from 'openai';
import { GroupAIProfileService } from './group-ai-profile.service';
import { GroupMessageService } from './group-message.service';
import { GroupAIInitService } from './group-ai-init.service';

const MINIMUM_MESSAGES_REQUIRED = 20;

@Injectable()
export class GroupAIService {
  private openai: OpenAI;

  constructor(
    private readonly groupAIProfileService: GroupAIProfileService,
    private readonly groupMessageService: GroupMessageService,
    private readonly groupAIInitService: GroupAIInitService,
  ) {
    // Initialize OpenAI client
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  /**
   * Generate AI response for group chat using OpenAI API
   */
  async generateGroupAIResponse(
    groupId: string,
    userMessage: string,
  ): Promise<string> {
    // Check if group has minimum messages
    const hasMinimumData = await this.hasMinimumData(groupId);

    if (!hasMinimumData) {
      return "I'm still learning your group's chat style! Keep chatting, and after 20 messages, I'll be able to chat just like you all! 😊";
    }

    // Get group's style profile
    const styleProfile =
      await this.groupAIProfileService.getGroupStyleProfile(groupId);

    if (!styleProfile || !styleProfile.stylePrompt) {
      return "I'm still analyzing your group's chat style. Send a few more messages!";
    }

    try {
      // Use stylePrompt to instruct LLM to mimic group's style
      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: styleProfile.stylePrompt,
          },
          {
            role: 'user',
            content: userMessage,
          },
        ],
        temperature: 0.9, // Higher temperature for more varied responses
        max_tokens: 150,
      });

      const response =
        completion.choices[0]?.message?.content ||
        "Sorry, I couldn't generate a response right now. Try again!";

      return response.trim();
    } catch (error) {
      console.error('Error generating Group AI response:', error);
      return "Oops! Something went wrong. Let's try that again!";
    }
  }

  /**
   * Generate AI response with streaming (for real-time chat experience)
   * Returns an async generator that yields chunks of the response
   */
  async *generateGroupAIResponseStream(
    groupId: string,
    userMessage: string,
  ): AsyncGenerator<string, void, unknown> {
    // Check if group has minimum messages
    const hasMinimumData = await this.hasMinimumData(groupId);

    if (!hasMinimumData) {
      yield "I'm still learning your group's chat style! Keep chatting, and after 20 messages, I'll be able to chat just like you all! 😊";
      return;
    }

    // Get group's style profile
    const styleProfile =
      await this.groupAIProfileService.getGroupStyleProfile(groupId);

    if (!styleProfile || !styleProfile.stylePrompt) {
      yield "I'm still analyzing your group's chat style. Send a few more messages!";
      return;
    }

    try {
      // Use stylePrompt to instruct LLM to mimic group's style
      const stream = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: styleProfile.stylePrompt,
          },
          {
            role: 'user',
            content: userMessage,
          },
        ],
        temperature: 0.9,
        max_tokens: 150,
        stream: true, // Enable streaming
      });

      // Stream the response chunks
      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content;
        if (content) {
          yield content;
        }
      }
    } catch (error) {
      console.error('Error generating Group AI response stream:', error);
      yield "Oops! Something went wrong. Let's try that again!";
    }
  }

  /**
   * Send AI-generated message to group and store it
   */
  async sendGroupAIMessage(
    groupId: string,
    content: string,
  ): Promise<{
    id: string;
    groupId: string;
    fromUserId: string;
    content: string;
    timestamp: Date;
    isAIGenerated: boolean;
    mentionedUserIds: string[];
  }> {
    const aiUserId = this.groupAIInitService.getGroupAIUserId(groupId);

    // Store AI-generated message with isAIGenerated flag
    const aiMessage = await this.groupMessageService.sendGroupMessage(
      groupId,
      aiUserId,
      content,
      true, // isAIGenerated = true
    );

    return aiMessage;
  }

  /**
   * Check if group has minimum 20 messages
   */
  async hasMinimumData(groupId: string): Promise<boolean> {
    const profile =
      await this.groupAIProfileService.getGroupStyleProfile(groupId);

    if (!profile) {
      return false;
    }

    return profile.messageCount >= MINIMUM_MESSAGES_REQUIRED;
  }
}
