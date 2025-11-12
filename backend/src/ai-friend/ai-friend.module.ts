import { Module } from '@nestjs/common';
import { AIFriendController } from './ai-friend.controller';
import { AIFriendService } from './ai-friend.service';
import { AIStyleAnalysisService } from './ai-style-analysis.service';
import { StyleProfileService } from './style-profile.service';
import { AIFriendInitService } from './ai-friend-init.service';
import { ChatModule } from '../chat/chat.module';

@Module({
  imports: [ChatModule],
  controllers: [AIFriendController],
  providers: [
    AIFriendService,
    AIStyleAnalysisService,
    StyleProfileService,
    AIFriendInitService,
  ],
  exports: [AIFriendService, StyleProfileService, AIStyleAnalysisService],
})
export class AIFriendModule {}
