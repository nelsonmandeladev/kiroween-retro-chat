import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  MaxLength,
  IsArray,
  ArrayMinSize,
} from 'class-validator';

export class CreateGroupDto {
  @ApiProperty({
    description: 'Name of the group',
    example: 'Study Group',
    maxLength: 50,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  name: string;

  @ApiProperty({
    description: 'Description of the group',
    example: 'A group for studying together',
    maxLength: 200,
    required: false,
  })
  @IsString()
  @MaxLength(200)
  description?: string;

  @ApiProperty({
    description:
      'Array of user IDs to add as initial members (excluding creator)',
    example: ['user-id-1', 'user-id-2'],
    type: [String],
  })
  @IsArray()
  @ArrayMinSize(2, {
    message: 'Groups must have at least 3 members including the creator',
  })
  @IsString({ each: true })
  memberIds: string[];
}
