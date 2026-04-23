CREATE TABLE `google_tts_voices` (
	`name` text(255) PRIMARY KEY NOT NULL,
	`language_codes` text NOT NULL,
	`ssml_gender` text(64) NOT NULL,
	`natural_sample_rate_hertz` integer NOT NULL,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`updated_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL
);
