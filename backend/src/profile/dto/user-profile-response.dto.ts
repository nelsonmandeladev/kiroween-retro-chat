import { ApiProperty } from '@nestjs/swagger';

export class UserProfileResponseDto {
  @ApiProperty({
    description: 'Unique identifier of the user',
    example: 'clx1234567890abcdef',
  })
  id: string;

  @ApiProperty({
    description: 'Full name of the user',
    example: 'John Doe',
  })
  name: string;

  @ApiProperty({
    description: 'Email address of the user',
    example: 'john.doe@example.com',
  })
  email: string;

  @ApiProperty({
    description: 'Unique username',
    example: 'johndoe',
  })
  username: string;

  @ApiProperty({
    description: 'Display name of the user',
    example: 'John Doe',
  })
  displayName: string;

  @ApiProperty({
    description: 'Status message of the user',
    example: 'Living my best life! 🎉',
    nullable: true,
  })
  statusMessage: string | null;

  @ApiProperty({
    description: 'URL of the profile picture',
    example: 'https://res.cloudinary.com/demo/image/upload/profile.jpg',
    nullable: true,
  })
  profilePictureUrl: string | null;
}
