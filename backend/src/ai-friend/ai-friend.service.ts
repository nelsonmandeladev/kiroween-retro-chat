import { Injectable } from '@nestjs/common';
import OpenAI from 'openai';
import { StyleProfileService } from './style-profile.service';
import { ChatService } from '../chat/chat.service';

const AI_FRIEND_USER_ID = 'kirhost';
const MINIMUM_MESSAGES_REQUIRED = 10;

@Injectable()
export class AIFriendService {
  private openai: OpenAI;

  constructor(
    private readonly styleProfileService: StyleProfileService,
    private readonly chatService: ChatService,
  ) {
    // Initialize OpenAI client
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  /**
   * Generate AI response using OpenAI API
   */
  async generateAIResponse(
    userId: string,
    userMessage: string,
  ): Promise<string> {
    // Check if user has minimum messages
    const hasMinimumData = await this.hasMinimumData(userId);

    if (!hasMinimumData) {
      return "I'm still learning your chat style! Keep chatting with your friends, and after 10 messages, I'll be able to chat just like you! 😊";
    }

    // Get user's style profile
    const styleProfile = await this.styleProfileService.getStyleProfile(userId);

    if (!styleProfile || !styleProfile.stylePrompt) {
      return "I'm still analyzing your chat style. Send me a few more messages!";
    }

    try {
      // Use stylePrompt to instruct LLM to mimic user's chat style
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
      console.error('Error generating AI response:', error);
      return "Oops! Something went wrong. Let's try that again!";
    }
  }

  /**
   * Generate AI response with streaming (for real-time chat experience)
   * Returns an async generator that yields chunks of the response
   */
  async *generateAIResponseStream(
    userId: string,
    userMessage: string,
  ): AsyncGenerator<string, void, unknown> {
    // Check if user has minimum messages
    const hasMinimumData = await this.hasMinimumData(userId);

    if (!hasMinimumData) {
      yield "I'm still learning your chat style! Keep chatting with your friends, and after 10 messages, I'll be able to chat just like you! 😊";
      return;
    }

    // Get user's style profile
    const styleProfile = await this.styleProfileService.getStyleProfile(userId);

    if (!styleProfile || !styleProfile.stylePrompt) {
      yield "I'm still analyzing your chat style. Send me a few more messages!";
      return;
    }

    try {
      // Use stylePrompt to instruct LLM to mimic user's chat style
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
      console.error('Error generating AI response stream:', error);
      yield "Oops! Something went wrong. Let's try that again!";
    }
  }

  /**
   * Send message to AI Friend and get response
   */
  async sendMessageToAIFriend(
    userId: string,
    content: string,
  ): Promise<{ userMessage: any; aiResponse: any }> {
    // Store user's message to AI Friend
    const userMessage = await this.chatService.sendMessage(
      userId,
      AI_FRIEND_USER_ID,
      content,
      false,
    );

    // Check if we should update the style profile
    const shouldUpdate =
      await this.styleProfileService.shouldUpdateProfile(userId);
    if (shouldUpdate) {
      await this.styleProfileService.updateStyleProfile(userId);
    }

    // Generate AI response
    const aiResponseContent = await this.generateAIResponse(userId, content);

    // Store AI-generated message with isAIGenerated flag
    const aiResponse = await this.chatService.sendMessage(
      AI_FRIEND_USER_ID,
      userId,
      aiResponseContent,
      true, // isAIGenerated = true
    );

    return {
      userMessage,
      aiResponse,
    };
  }

  /**
   * Check if user has minimum 10 messages
   */
  async hasMinimumData(userId: string): Promise<boolean> {
    const profile = await this.styleProfileService.getStyleProfile(userId);

    if (!profile) {
      return false;
    }

    return profile.messageCount >= MINIMUM_MESSAGES_REQUIRED;
  }

  /**
   * Get AI Friend user ID constant
   */
  getAIFriendUserId(): string {
    return AI_FRIEND_USER_ID;
  }
}
