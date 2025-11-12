export class GroupMessageResponseDto {
  id: string;
  groupId: string;
  fromUserId: string;
  content: string;
  timestamp: Date;
  isAIGenerated: boolean;
  mentionedUserIds: string[];
}
