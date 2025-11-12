import { Module, forwardRef } from '@nestjs/common';
import { EventsGateway } from './events.gateway';
import { RedisService } from './redis.service';
import { ChatModule } from '../chat/chat.module';
import { AIFriendModule } from '../ai-friend/ai-friend.module';
import { GroupsModule } from '../groups/groups.module';

@Module({
  imports: [ChatModule, forwardRef(() => AIFriendModule), GroupsModule],
  providers: [EventsGateway, RedisService],
  exports: [EventsGateway, RedisService],
})
export class GatewayModule {}
