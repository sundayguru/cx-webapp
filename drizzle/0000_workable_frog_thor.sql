CREATE TABLE `users` (
	`id` text(36) PRIMARY KEY NOT NULL,
	`firstName` text(255) NOT NULL,
	`lastName` text(255) NOT NULL,
	`email` text(255) NOT NULL,
	`email_verified` integer DEFAULT false NOT NULL,
	`image` text(511),
	`passwordHash` text(511),
	`is_deactivated` integer DEFAULT false NOT NULL,
	`is_banned` integer DEFAULT false NOT NULL,
	`is_admin` integer DEFAULT false NOT NULL,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`updated_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);--> statement-breakpoint
CREATE TABLE `profile` (
	`id` text(36) PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`bio` text(255) NOT NULL,
	`avatar_url` text,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`updated_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `accounts` (
	`user_id` text NOT NULL,
	`type` text NOT NULL,
	`provider` text NOT NULL,
	`provider_account_id` text NOT NULL,
	`refresh_token` text(511),
	`access_token` text(511),
	`expires_at` integer,
	`token_type` text(255),
	`scope` text(511),
	`id_token` text(2048),
	`session_state` text(255),
	`created_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`updated_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `sessions` (
	`session_token` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`expires` text NOT NULL,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`updated_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `verification_tokens` (
	`identifier` text NOT NULL,
	`token` text PRIMARY KEY NOT NULL,
	`expires` text NOT NULL,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `password_reset_tokens` (
	`user_id` text NOT NULL,
	`token` text PRIMARY KEY NOT NULL,
	`expires` text NOT NULL,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `courses` (
	`id` text(36) PRIMARY KEY NOT NULL,
	`title` text(255) NOT NULL,
	`code` text(50) NOT NULL,
	`description` text NOT NULL,
	`school_id` text,
	`author_id` text,
	`thumbnail_key` text(511),
	`level` text(50) DEFAULT 'Beginner' NOT NULL,
	`category` text(100) DEFAULT 'General' NOT NULL,
	`status` text(20) DEFAULT 'pending' NOT NULL,
	`created_by` text NOT NULL,
	`content_key` text(511),
	`content_type` text(100),
	`content_size` integer,
	`raw_text` text,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`updated_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	FOREIGN KEY (`school_id`) REFERENCES `schools`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`author_id`) REFERENCES `authors`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `courses_code_unique` ON `courses` (`code`);--> statement-breakpoint
CREATE TABLE `schools` (
	`id` text(36) PRIMARY KEY NOT NULL,
	`name` text(255) NOT NULL,
	`slug` text(255) NOT NULL,
	`created_by` text,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`updated_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX `schools_name_unique` ON `schools` (`name`);--> statement-breakpoint
CREATE UNIQUE INDEX `schools_slug_unique` ON `schools` (`slug`);--> statement-breakpoint
CREATE TABLE `authors` (
	`id` text(36) PRIMARY KEY NOT NULL,
	`name` text(255) NOT NULL,
	`slug` text(255) NOT NULL,
	`created_by` text,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`updated_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX `authors_name_unique` ON `authors` (`name`);--> statement-breakpoint
CREATE UNIQUE INDEX `authors_slug_unique` ON `authors` (`slug`);--> statement-breakpoint
CREATE TABLE `modules` (
	`id` text(36) PRIMARY KEY NOT NULL,
	`course_id` text NOT NULL,
	`title` text(255) NOT NULL,
	`description` text,
	`raw_text` text,
	`order` integer DEFAULT 0 NOT NULL,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`updated_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	FOREIGN KEY (`course_id`) REFERENCES `courses`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `units` (
	`id` text(36) PRIMARY KEY NOT NULL,
	`module_id` text NOT NULL,
	`title` text(255) NOT NULL,
	`content` text,
	`summary` text,
	`raw_text` text,
	`audio_script` text,
	`order` integer DEFAULT 0 NOT NULL,
	`audio_url` text,
	`video_url` text,
	`is_complete` integer DEFAULT 0 NOT NULL,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`updated_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	FOREIGN KEY (`module_id`) REFERENCES `modules`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `quiz_sessions` (
	`id` text(36) PRIMARY KEY NOT NULL,
	`course_id` text,
	`unit_id` text NOT NULL,
	`user_id` text NOT NULL,
	`mode` text(20) NOT NULL,
	`timer_enabled` integer DEFAULT 0 NOT NULL,
	`total_questions` integer NOT NULL,
	`correct_answers` integer DEFAULT 0 NOT NULL,
	`time_spent_seconds` integer DEFAULT 0 NOT NULL,
	`answers` text,
	`started_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`completed_at` text,
	FOREIGN KEY (`course_id`) REFERENCES `courses`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`unit_id`) REFERENCES `units`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `quizzes` (
	`id` text(36) PRIMARY KEY NOT NULL,
	`unit_id` text NOT NULL,
	`question` text NOT NULL,
	`question_type` text(20) NOT NULL,
	`answer` text NOT NULL,
	`options` text,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	FOREIGN KEY (`unit_id`) REFERENCES `units`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `chat_messages` (
	`id` text(36) PRIMARY KEY NOT NULL,
	`unit_id` text NOT NULL,
	`user_id` text,
	`role` text(20) NOT NULL,
	`content` text NOT NULL,
	`provider` text(20),
	`model` text(50),
	`created_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	FOREIGN KEY (`unit_id`) REFERENCES `units`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `enrollments` (
	`id` text(36) PRIMARY KEY NOT NULL,
	`course_id` text NOT NULL,
	`user_id` text NOT NULL,
	`enrolled_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	FOREIGN KEY (`course_id`) REFERENCES `courses`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `notifications` (
	`id` text(36) PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`title` text(255) NOT NULL,
	`message` text NOT NULL,
	`action_url` text,
	`is_read` integer DEFAULT false NOT NULL,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `community_posts` (
	`id` text(36) PRIMARY KEY NOT NULL,
	`course_id` text NOT NULL,
	`user_id` text NOT NULL,
	`parent_id` text,
	`content` text NOT NULL,
	`is_deleted` integer DEFAULT false NOT NULL,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`updated_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	FOREIGN KEY (`course_id`) REFERENCES `courses`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `community_reactions` (
	`id` text(36) PRIMARY KEY NOT NULL,
	`post_id` text NOT NULL,
	`user_id` text NOT NULL,
	`emoji` text(32) NOT NULL,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	FOREIGN KEY (`post_id`) REFERENCES `community_posts`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `bookmarks` (
	`id` text(36) PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`unit_id` text NOT NULL,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`unit_id`) REFERENCES `units`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `bookmarks_user_unit_unique_idx` ON `bookmarks` (`user_id`,`unit_id`);