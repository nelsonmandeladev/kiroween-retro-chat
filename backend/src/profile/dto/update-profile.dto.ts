import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, MinLength, MaxLength } from 'class-validator';

export class UpdateProfileDto {
  @ApiProperty({
    description: 'Display name of the user',
    example: 'John Doe',
    minLength: 1,
    maxLength: 100,
    required: false,
  })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  displayName?: string;

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
