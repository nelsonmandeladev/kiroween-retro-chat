import { Module } from '@nestjs/common';
import { AuthModule } from '@thallesp/nestjs-better-auth';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { auth } from './lib/auth';
import { ProfileModule } from './profile/profile.module';
import { FriendsModule } from './friends/friends.module';
import { GatewayModule } from './gateway/gateway.module';
import { ChatModule } from './chat/chat.module';
import { AIFriendModule } from './ai-friend/ai-friend.module';
import { GroupsModule } from './groups/groups.module';

@Module({
  imports: [
    AuthModule.forRoot({ auth }),
    ProfileModule,
    FriendsModule,
    GatewayModule,
    ChatModule,
    AIFriendModule,
    GroupsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
