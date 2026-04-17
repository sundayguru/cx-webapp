CREATE TABLE `enrollments` (
	`id` text(36) PRIMARY KEY NOT NULL,
	`course_id` text NOT NULL,
	`user_id` text NOT NULL,
	`enrolled_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	FOREIGN KEY (`course_id`) REFERENCES `courses`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
