import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class AddMemberDto {
  @ApiProperty({
    description: 'User ID to add to the group',
    example: 'user-id-123',
  })
  @IsString()
  @IsNotEmpty()
  userId: string;
}
