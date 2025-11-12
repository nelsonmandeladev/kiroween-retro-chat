import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class SendFriendRequestDto {
  @ApiProperty({
    description: 'User ID to send friend request to',
    example: 'clx1234567890abcdef',
  })
  @IsString()
  @IsNotEmpty()
  toUserId: string;
}
