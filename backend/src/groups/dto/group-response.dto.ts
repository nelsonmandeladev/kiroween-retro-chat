import { ApiProperty } from '@nestjs/swagger';

class GroupMemberUserDto {
  @ApiProperty({ example: 'user-id-123' })
  id: string;

  @ApiProperty({ example: 'johndoe' })
  username: string;

  @ApiProperty({ example: 'John Doe' })
  displayName: string;

  @ApiProperty({ example: 'https://example.com/avatar.jpg', nullable: true })
  profilePictureUrl: string | null;
}

class GroupMemberDto {
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

  @ApiProperty({ type: GroupMemberUserDto })
  user: GroupMemberUserDto;
}

export class GroupResponseDto {
  @ApiProperty({ example: 'group-id-123' })
  id: string;

  @ApiProperty({ example: 'Study Group' })
  name: string;

  @ApiProperty({ example: 'A group for studying together', nullable: true })
  description: string | null;

  @ApiProperty({ example: 'user-id-123' })
  createdBy: string;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  updatedAt: Date;

  @ApiProperty({ example: true })
  aiEnabled: boolean;

  @ApiProperty({ type: [GroupMemberDto] })
  members: GroupMemberDto[];
}
