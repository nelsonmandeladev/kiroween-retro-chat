import {
  pgTable,
  text,
  timestamp,
  boolean,
  integer,
  real,
  jsonb,
  uuid,
  index,
} from 'drizzle-orm/pg-core';

// ============================================
// Better-auth Required Schemas
// ============================================

export const user = pgTable('user', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: boolean('email_verified').default(false).notNull(),
  image: text('image'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at')
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

export const session = pgTable('session', {
  id: text('id').primaryKey(),
  expiresAt: timestamp('expires_at').notNull(),
  token: text('token').notNull().unique(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at')
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
});

export const account = pgTable('account', {
  id: text('id').primaryKey(),
  accountId: text('account_id').notNull(),
  providerId: text('provider_id').notNull(),
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  accessToken: text('access_token'),
  refreshToken: text('refresh_token'),
  idToken: text('id_token'),
  accessTokenExpiresAt: timestamp('access_token_expires_at'),
  refreshTokenExpiresAt: timestamp('refresh_token_expires_at'),
  scope: text('scope'),
  password: text('password'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at')
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

export const verification = pgTable('verification', {
  id: text('id').primaryKey(),
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at')
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

// ============================================
// RetroChat-Specific User Profile
// ============================================

export const userProfile = pgTable('user_profile', {
  userId: text('user_id')
    .primaryKey()
    .references(() => user.id, { onDelete: 'cascade' }),
  username: text('username').unique().notNull(),
  displayName: text('display_name').notNull(),
  statusMessage: text('status_message'),
  profilePictureUrl: text('profile_picture_url'),
});

// ============================================
// RetroChat-Specific Schemas
// ============================================

export const messages = pgTable(
  'messages',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    fromUserId: text('from_user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    toUserId: text('to_user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    content: text('content').notNull(),
    timestamp: timestamp('timestamp').defaultNow().notNull(),
    isRead: boolean('is_read').default(false).notNull(),
    isAIGenerated: boolean('is_ai_generated').default(false).notNull(),
  },
  (table) => [
    index('idx_messages_users').on(table.fromUserId, table.toUserId),
    index('idx_messages_timestamp').on(table.timestamp),
  ],
);

export const friendships = pgTable(
  'friendships',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId1: text('user_id_1')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    userId2: text('user_id_2')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [index('idx_friendships_users').on(table.userId1, table.userId2)],
);

export const friendRequests = pgTable('friend_requests', {
  id: uuid('id').primaryKey().defaultRandom(),
  fromUserId: text('from_user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  toUserId: text('to_user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  status: text('status', { enum: ['pending', 'accepted', 'rejected'] })
    .default('pending')
    .notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const styleProfiles = pgTable('style_profiles', {
  userId: text('user_id')
    .primaryKey()
    .references(() => user.id, { onDelete: 'cascade' }),
  messageCount: integer('message_count').default(0).notNull(),
  commonPhrases: jsonb('common_phrases').$type<string[]>(),
  emojiUsage: jsonb('emoji_usage').$type<Record<string, number>>(),
  averageMessageLength: real('average_message_length'),
  toneIndicators: jsonb('tone_indicators').$type<{
    casual: number;
    formal: number;
    enthusiastic: number;
  }>(),
  stylePrompt: text('style_prompt'),
  lastUpdated: timestamp('last_updated').defaultNow().notNull(),
});

// ============================================
// Group Chat Schemas
// ============================================

export const groups = pgTable('groups', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  description: text('description'),
  createdBy: text('created_by')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at')
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
  aiEnabled: boolean('ai_enabled').default(true).notNull(),
});

export const groupMembers = pgTable(
  'group_members',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    groupId: uuid('group_id')
      .notNull()
      .references(() => groups.id, { onDelete: 'cascade' }),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    isAdmin: boolean('is_admin').default(false).notNull(),
    joinedAt: timestamp('joined_at').defaultNow().notNull(),
    notificationsMuted: boolean('notifications_muted').default(false).notNull(),
  },
  (table) => [
    index('idx_group_members_group_user').on(table.groupId, table.userId),
    index('idx_group_members_user').on(table.userId),
  ],
);

export const groupMessages = pgTable(
  'group_messages',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    groupId: uuid('group_id')
      .notNull()
      .references(() => groups.id, { onDelete: 'cascade' }),
    fromUserId: text('from_user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    content: text('content').notNull(),
    timestamp: timestamp('timestamp').defaultNow().notNull(),
    isAIGenerated: boolean('is_ai_generated').default(false).notNull(),
    mentionedUserIds: jsonb('mentioned_user_ids')
      .$type<string[]>()
      .default([])
      .notNull(),
  },
  (table) => [
    index('idx_group_messages_group').on(table.groupId),
    index('idx_group_messages_timestamp').on(table.timestamp),
  ],
);

export const groupMessageReads = pgTable(
  'group_message_reads',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    groupMessageId: uuid('group_message_id')
      .notNull()
      .references(() => groupMessages.id, { onDelete: 'cascade' }),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    readAt: timestamp('read_at').defaultNow().notNull(),
  },
  (table) => [
    index('idx_group_message_reads_message_user').on(
      table.groupMessageId,
      table.userId,
    ),
  ],
);

export const groupStyleProfiles = pgTable('group_style_profiles', {
  groupId: uuid('group_id')
    .primaryKey()
    .references(() => groups.id, { onDelete: 'cascade' }),
  messageCount: integer('message_count').default(0).notNull(),
  memberContributions: jsonb('member_contributions')
    .$type<Record<string, number>>()
    .default({})
    .notNull(),
  commonPhrases: jsonb('common_phrases')
    .$type<string[]>()
    .default([])
    .notNull(),
  emojiUsage: jsonb('emoji_usage')
    .$type<Record<string, number>>()
    .default({})
    .notNull(),
  averageMessageLength: integer('average_message_length').default(0).notNull(),
  toneIndicators: jsonb('tone_indicators')
    .$type<{
      casual: number;
      formal: number;
      enthusiastic: number;
    }>()
    .default({ casual: 0, formal: 0, enthusiastic: 0 })
    .notNull(),
  stylePrompt: text('style_prompt'),
  lastUpdated: timestamp('last_updated').defaultNow().notNull(),
});
