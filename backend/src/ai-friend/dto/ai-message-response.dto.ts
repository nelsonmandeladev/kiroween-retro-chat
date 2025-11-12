import { ApiProperty } from '@nestjs/swagger';

export class AIMessageResponseDto {
  @ApiProperty({
    description: 'User message sent to AI Friend',
  })
  userMessage: {
    id: string;
    fromUserId: string;
    toUserId: string;
    content: string;
    timestamp: Date;
    isRead: boolean;
    isAIGenerated: boolean;
  };

  @ApiProperty({
    description: 'AI Friend response message',
  })
  aiResponse: {
    id: string;
    fromUserId: string;
    toUserId: string;
    content: string;
    timestamp: Date;
    isRead: boolean;
    isAIGenerated: boolean;
  };
}
