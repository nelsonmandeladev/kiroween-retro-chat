import { ApiProperty } from '@nestjs/swagger';

export class UnreadGroupCountResponseDto {
  @ApiProperty({
    description: 'Total number of unread group messages',
    example: 5,
  })
  unreadCount: number;
}
