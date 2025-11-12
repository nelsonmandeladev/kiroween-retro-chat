import { ApiProperty } from '@nestjs/swagger';

export class FriendRequestResponseDto {
  @ApiProperty({
    description: 'Friend request ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  id: string;

  @ApiProperty({
    description: 'User ID who sent the request',
    example: 'clx1234567890abcdef',
  })
  fromUserId: string;

  @ApiProperty({
    description: 'User ID who received the request',
    example: 'clx0987654321fedcba',
  })
  toUserId: string;

  @ApiProperty({
    description: 'Request status',
    enum: ['pending', 'accepted', 'rejected'],
    example: 'pending',
  })
  status: string;

  @ApiProperty({
    description: 'Request creation timestamp',
    example: '2024-01-15T10:30:00.000Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Sender user profile information',
    required: false,
  })
  fromUser?: {
    id: string;
    username: string;
    displayName: string;
    profilePictureUrl: string | null;
  };

  @ApiProperty({
    description: 'Recipient user profile information',
    required: false,
  })
  toUser?: {
    id: string;
    username: string;
    displayName: string;
    profilePictureUrl: string | null;
  };
}
