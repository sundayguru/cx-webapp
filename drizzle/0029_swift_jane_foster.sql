ALTER TABLE `users` ADD `is_deactivated` integer DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `is_banned` integer DEFAULT false NOT NULL;