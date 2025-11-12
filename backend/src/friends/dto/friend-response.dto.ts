import { ApiProperty } from '@nestjs/swagger';

export class FriendResponseDto {
  @ApiProperty({
    description: 'Friend user ID',
    example: 'clx1234567890abcdef',
  })
  id: string;

  @ApiProperty({
    description: 'Friend username',
    example: 'john_doe',
  })
  username: string;

  @ApiProperty({
    description: 'Friend display name',
    example: 'John Doe',
  })
  displayName: string;

  @ApiProperty({
    description: 'Friend status message',
    example: 'Feeling nostalgic!',
    required: false,
  })
  statusMessage: string | null;

  @ApiProperty({
    description: 'Friend profile picture URL',
    example: 'https://res.cloudinary.com/...',
    required: false,
  })
  profilePictureUrl: string | null;

  @ApiProperty({
    description: 'Friendship creation timestamp',
    example: '2024-01-15T10:30:00.000Z',
  })
  friendsSince: Date;
}
