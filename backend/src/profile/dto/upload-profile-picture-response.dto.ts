import { ApiProperty } from '@nestjs/swagger';

export class UploadProfilePictureResponseDto {
  @ApiProperty({
    description: 'URL of the uploaded profile picture',
    example: 'https://res.cloudinary.com/demo/image/upload/profile.jpg',
  })
  profilePictureUrl: string;

  @ApiProperty({
    description: 'Success message',
    example: 'Profile picture uploaded successfully',
  })
  message: string;
}
