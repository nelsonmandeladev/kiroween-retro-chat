import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SendMessageDto {
  @ApiProperty({
    description: 'The ID of the user receiving the message',
    example: 'user123',
  })
  @IsString()
  @IsNotEmpty()
  toUserId: string;

  @ApiProperty({
    description: 'The message content',
    example: 'Hey! How are you?',
  })
  @IsString()
  @IsNotEmpty()
  content: string;
}
