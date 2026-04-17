CREATE TABLE `quiz_sessions` (
	`id` text(36) PRIMARY KEY NOT NULL,
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
	FOREIGN KEY (`unit_id`) REFERENCES `units`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
