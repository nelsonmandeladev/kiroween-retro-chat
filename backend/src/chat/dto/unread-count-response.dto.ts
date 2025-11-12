import { ApiProperty } from '@nestjs/swagger';

export class UnreadCountResponseDto {
  @ApiProperty({
    description: 'The number of unread messages',
    example: 5,
  })
  count: number;
}
