import {
  Controller,
  Get,
  Patch,
  Post,
  Param,
  Body,
  Query,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  Req,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { ProfileService } from './profile.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { SetupProfileDto } from './dto/setup-profile.dto';
import { UserProfileResponseDto } from './dto/user-profile-response.dto';
import { UploadProfilePictureResponseDto } from './dto/upload-profile-picture-response.dto';
import { CloudinaryService } from './cloudinary.service';
import type { Request } from 'express';

@ApiTags('Profile')
@Controller('api')
export class ProfileController {
  constructor(
    private readonly profileService: ProfileService,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  @Get('profile/:userId')
  @ApiOperation({
    summary: 'Get user profile',
    description: 'Retrieve a user profile by user ID',
  })
  @ApiParam({
    name: 'userId',
    description: 'Unique identifier of the user',
    example: 'clx1234567890abcdef',
  })
  @ApiResponse({
    status: 200,
    description: 'User profile retrieved successfully',
    type: UserProfileResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'User not found or user profile not found',
  })
  async getUserProfile(
    @Param('userId') userId: string,
  ): Promise<UserProfileResponseDto> {
    return this.profileService.getUserProfile(userId);
  }

  @Post('profile/setup')
  @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
  @ApiOperation({
    summary: 'Setup user profile',
    description:
      'Complete initial profile setup with username, displayName, and statusMessage. This endpoint allows setting the username which cannot be changed later.',
  })
  @ApiBody({ type: SetupProfileDto })
  @ApiResponse({
    status: 201,
    description: 'Profile setup completed successfully',
    type: UserProfileResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - validation failed or user not authenticated',
  })
  @ApiResponse({
    status: 404,
    description: 'User not found',
  })
  @ApiResponse({
    status: 409,
    description: 'Username is already taken',
  })
  async setupProfile(
    @Req() req: Request,
    @Body() setupDto: SetupProfileDto,
  ): Promise<UserProfileResponseDto> {
    // Get user ID from Better-auth session
    const userId = req.user?.id;
    if (!userId) {
      throw new BadRequestException('User not authenticated');
    }

    return this.profileService.setupProfile(userId, setupDto);
  }

  @Patch('profile')
  @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
  @ApiOperation({
    summary: 'Update current user profile',
    description:
      'Update the authenticated user profile (displayName, statusMessage)',
  })
  @ApiBody({ type: UpdateProfileDto })
  @ApiResponse({
    status: 200,
    description: 'Profile updated successfully',
    type: UserProfileResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - validation failed or user not authenticated',
  })
  @ApiResponse({
    status: 404,
    description: 'User not found',
  })
  async updateProfile(
    @Req() req: Request,
    @Body() updateDto: UpdateProfileDto,
  ): Promise<UserProfileResponseDto> {
    // Get user ID from Better-auth session
    const userId = req.user?.id;
    if (!userId) {
      throw new BadRequestException('User not authenticated');
    }

    return this.profileService.updateProfile(userId, updateDto);
  }

  @Post('profile/picture')
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({
    summary: 'Upload profile picture',
    description:
      'Upload a profile picture for the authenticated user. Accepts JPEG, PNG, GIF, and WebP formats. Maximum file size: 5MB.',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'Profile picture file (JPEG, PNG, GIF, WebP)',
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Profile picture uploaded successfully',
    type: UploadProfilePictureResponseDto,
  })
  @ApiResponse({
    status: 400,
    description:
      'Bad request - invalid file type, file too large, or user not authenticated',
  })
  async uploadProfilePicture(
    @Req() req: Request,
    @UploadedFile() file: Express.Multer.File,
  ): Promise<UploadProfilePictureResponseDto> {
    // Get user ID from Better-auth session
    const userId = req.user?.id;
    if (!userId) {
      throw new BadRequestException('User not authenticated');
    }

    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    const profilePictureUrl = await this.cloudinaryService.uploadProfilePicture(
      userId,
      file,
    );

    return {
      profilePictureUrl,
      message: 'Profile picture uploaded successfully',
    };
  }

  @Get('users/search')
  @ApiOperation({
    summary: 'Search users',
    description:
      'Search for users by username or email. Returns up to 20 results.',
  })
  @ApiQuery({
    name: 'q',
    description: 'Search query (username or email)',
    example: 'john',
    required: true,
  })
  @ApiResponse({
    status: 200,
    description: 'Search results',
    type: [UserProfileResponseDto],
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - search query is required',
  })
  async searchUsers(
    @Query('q') query: string,
  ): Promise<UserProfileResponseDto[]> {
    if (!query) {
      throw new BadRequestException('Search query is required');
    }

    return this.profileService.searchUsers(query);
  }
}
