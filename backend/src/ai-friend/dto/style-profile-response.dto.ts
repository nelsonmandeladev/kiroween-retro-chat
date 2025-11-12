import { ApiProperty } from '@nestjs/swagger';

export class StyleProfileResponseDto {
  @ApiProperty({
    description: 'User ID',
  })
  userId: string;

  @ApiProperty({
    description: 'Total number of messages analyzed',
  })
  messageCount: number;

  @ApiProperty({
    description: 'Common phrases used by the user',
    type: [String],
  })
  commonPhrases: string[];

  @ApiProperty({
    description: 'Emoji usage frequency',
    example: { '😊': 10, '👍': 5 },
  })
  emojiUsage: Record<string, number>;

  @ApiProperty({
    description: 'Average message length in characters',
  })
  averageMessageLength: number;

  @ApiProperty({
    description: 'Tone indicators with percentages',
  })
  toneIndicators: {
    casual: number;
    formal: number;
    enthusiastic: number;
  };

  @ApiProperty({
    description: 'Last time the profile was updated',
  })
  lastUpdated: Date;

  @ApiProperty({
    description: 'Whether user has enough data for AI responses',
  })
  hasMinimumData: boolean;
}
