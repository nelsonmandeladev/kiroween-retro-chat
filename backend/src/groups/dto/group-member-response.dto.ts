import { ApiProperty } from '@nestjs/swagger';

class MemberUserDto {
  @ApiProperty({ example: 'user-id-123' })
  id: string;

  @ApiProperty({ example: 'johndoe' })
  username: string;

  @ApiProperty({ example: 'John Doe' })
  displayName: string;

  @ApiProperty({ example: 'https://example.com/avatar.jpg', nullable: true })
  profilePictureUrl: string | null;
}

export class GroupMemberResponseDto {
  @ApiProperty({ example: 'member-id-123' })
  id: string;

  @ApiProperty({ example: 'user-id-123' })
  userId: string;

  @ApiProperty({ example: true })
  isAdmin: boolean;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  joinedAt: Date;

  @ApiProperty({ example: false })
  notificationsMuted: boolean;

  @ApiProperty({ type: MemberUserDto })
  user: MemberUserDto;
}
