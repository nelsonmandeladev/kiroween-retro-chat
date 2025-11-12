import {
  Controller,
  Post,
  Get,
  Body,
  Req,
  UseGuards,
  HttpCode,
  HttpStatus,
  NotFoundException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AuthGuard } from '../lib/auth';
import { AIFriendService } from './ai-friend.service';
import { StyleProfileService } from './style-profile.service';
import { SendAIMessageDto } from './dto/send-ai-message.dto';
import { AIMessageResponseDto } from './dto/ai-message-response.dto';
import { StyleProfileResponseDto } from './dto/style-profile-response.dto';
import type { Request } from 'express';

@ApiTags('AI Friend')
@Controller('api/ai-friend')
@UseGuards(AuthGuard)
@ApiBearerAuth()
export class AIFriendController {
  constructor(
    private readonly aiFriendService: AIFriendService,
    private readonly styleProfileService: StyleProfileService,
  ) {}

  @Post('message')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Send message to AI Friend and get response' })
  @ApiResponse({
    status: 200,
    description: 'Message sent and AI response received',
    type: AIMessageResponseDto,
  })
  async sendMessage(
    @Req() req: Request,
    @Body() sendAIMessageDto: SendAIMessageDto,
  ): Promise<AIMessageResponseDto> {
    const userId = req?.user?.id;
    const { content } = sendAIMessageDto;

    const result = await this.aiFriendService.sendMessageToAIFriend(
      userId!,
      content,
    );

    return result;
  }

  @Get('profile')
  @ApiOperation({ summary: "Get AI Friend's learned style profile" })
  @ApiResponse({
    status: 200,
    description: 'Style profile retrieved',
    type: StyleProfileResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Style profile not found',
  })
  async getProfile(@Req() req: Request): Promise<StyleProfileResponseDto> {
    const userId = req?.user?.id;

    const profile = await this.styleProfileService.getStyleProfile(userId!);

    if (!profile) {
      throw new NotFoundException(
        'Style profile not found. Start chatting to create one!',
      );
    }

    const hasMinimumData = await this.aiFriendService.hasMinimumData(userId!);

    return {
      ...profile,
      hasMinimumData,
    };
  }

  @Post('reset')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Reset AI Friend's learned style" })
  @ApiResponse({
    status: 200,
    description: 'Style profile reset successfully',
  })
  async resetProfile(@Req() req: Request): Promise<{ message: string }> {
    const userId = req?.user?.id;

    await this.styleProfileService.resetStyleProfile(userId!);

    return {
      message: 'AI Friend style profile has been reset successfully',
    };
  }
}
