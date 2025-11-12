import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, MaxLength, IsBoolean } from 'class-validator';

export class UpdateGroupDto {
  @ApiProperty({
    description: 'Name of the group',
    example: 'Updated Study Group',
    maxLength: 50,
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  name?: string;

  @ApiProperty({
    description: 'Description of the group',
    example: 'An updated description',
    maxLength: 200,
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  description?: string;

  @ApiProperty({
    description: 'Enable or disable the Group AI member',
    example: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  aiEnabled?: boolean;
}
