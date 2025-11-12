import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  MinLength,
  MaxLength,
  Matches,
} from 'class-validator';

export class SetupProfileDto {
  @ApiProperty({
    description: 'Unique username for the user',
    example: 'johndoe',
    minLength: 3,
    maxLength: 50,
    required: true,
  })
  @IsString()
  @MinLength(3)
  @MaxLength(50)
  @Matches(/^[a-zA-Z0-9_]+$/, {
    message: 'Username can only contain letters, numbers, and underscores',
  })
  username: string;

  @ApiProperty({
    description: 'Display name of the user',
    example: 'John Doe',
    minLength: 2,
    maxLength: 100,
    required: true,
  })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  displayName: string;

  @ApiProperty({
    description: 'Status message of the user',
    example: 'Living my best life! 🎉',
    maxLength: 200,
    required: false,
    nullable: true,
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  statusMessage?: string;
}
