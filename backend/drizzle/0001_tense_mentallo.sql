CREATE TABLE "group_members" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"group_id" uuid NOT NULL,
	"user_id" text NOT NULL,
	"is_admin" boolean DEFAULT false NOT NULL,
	"joined_at" timestamp DEFAULT now() NOT NULL,
	"notifications_muted" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "group_message_reads" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"group_message_id" uuid NOT NULL,
	"user_id" text NOT NULL,
	"read_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "group_messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"group_id" uuid NOT NULL,
	"from_user_id" text NOT NULL,
	"content" text NOT NULL,
	"timestamp" timestamp DEFAULT now() NOT NULL,
	"is_ai_generated" boolean DEFAULT false NOT NULL,
	"mentioned_user_ids" jsonb DEFAULT '[]'::jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE "group_style_profiles" (
	"group_id" uuid PRIMARY KEY NOT NULL,
	"message_count" integer DEFAULT 0 NOT NULL,
	"member_contributions" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"common_phrases" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"emoji_usage" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"average_message_length" integer DEFAULT 0 NOT NULL,
	"tone_indicators" jsonb DEFAULT '{"casual":0,"formal":0,"enthusiastic":0}'::jsonb NOT NULL,
	"style_prompt" text,
	"last_updated" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "groups" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"created_by" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"ai_enabled" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
ALTER TABLE "group_members" ADD CONSTRAINT "group_members_group_id_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."groups"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "group_members" ADD CONSTRAINT "group_members_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "group_message_reads" ADD CONSTRAINT "group_message_reads_group_message_id_group_messages_id_fk" FOREIGN KEY ("group_message_id") REFERENCES "public"."group_messages"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "group_message_reads" ADD CONSTRAINT "group_message_reads_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "group_messages" ADD CONSTRAINT "group_messages_group_id_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."groups"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "group_messages" ADD CONSTRAINT "group_messages_from_user_id_user_id_fk" FOREIGN KEY ("from_user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "group_style_profiles" ADD CONSTRAINT "group_style_profiles_group_id_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."groups"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "groups" ADD CONSTRAINT "groups_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_group_members_group_user" ON "group_members" USING btree ("group_id","user_id");--> statement-breakpoint
CREATE INDEX "idx_group_members_user" ON "group_members" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_group_message_reads_message_user" ON "group_message_reads" USING btree ("group_message_id","user_id");--> statement-breakpoint
CREATE INDEX "idx_group_messages_group" ON "group_messages" USING btree ("group_id");--> statement-breakpoint
CREATE INDEX "idx_group_messages_timestamp" ON "group_messages" USING btree ("timestamp");