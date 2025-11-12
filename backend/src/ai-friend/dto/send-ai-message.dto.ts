import { IsString, IsNotEmpty, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SendAIMessageDto {
  @ApiProperty({
    description: 'Message content to send to AI Friend',
    example: 'Hey! How are you doing today?',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(1000)
  content: string;
}
