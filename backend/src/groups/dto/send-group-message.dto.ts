import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SendGroupMessageDto {
  @ApiProperty({
    description: 'Message content',
    example: 'Hello everyone!',
  })
  @IsString()
  @IsNotEmpty()
  content: string;
}
