import { Module, forwardRef } from '@nestjs/common';
import { GroupsService } from './groups.service';
import { GroupsController } from './groups.controller';
import { GroupMessageService } from './group-message.service';
import { GroupAIInitService } from './group-ai-init.service';
import { GroupAIStyleAnalysisService } from './group-ai-style-analysis.service';
import { GroupAIProfileService } from './group-ai-profile.service';
import { GroupAIService } from './group-ai.service';
import { AIFriendModule } from '../ai-friend/ai-friend.module';
import { GatewayModule } from '../gateway/gateway.module';

@Module({
  imports: [AIFriendModule, forwardRef(() => GatewayModule)],
  controllers: [GroupsController],
  providers: [
    GroupsService,
    GroupMessageService,
    GroupAIInitService,
    GroupAIStyleAnalysisService,
    GroupAIProfileService,
    GroupAIService,
  ],
  exports: [
    GroupsService,
    GroupMessageService,
    GroupAIInitService,
    GroupAIStyleAnalysisService,
    GroupAIProfileService,
    GroupAIService,
  ],
})
export class GroupsModule {}
