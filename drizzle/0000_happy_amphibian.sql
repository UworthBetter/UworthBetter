CREATE TABLE `chapters` (
	`id` text PRIMARY KEY NOT NULL,
	`season_id` text NOT NULL,
	`chapter_no` integer NOT NULL,
	`status` text DEFAULT 'locked' NOT NULL,
	`chapter_type` text,
	`completion_rate` real,
	`title` text NOT NULL,
	`plan_json` text,
	`body_md` text,
	`letter_md` text,
	`summary` text,
	`cover_url` text,
	`cover_blur_url` text,
	`interview_json` text,
	`active_job_id` text,
	`generated_at` integer,
	FOREIGN KEY (`season_id`) REFERENCES `seasons`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `chapters_season_no` ON `chapters` (`season_id`,`chapter_no`);--> statement-breakpoint
CREATE TABLE `daily_logs` (
	`id` text PRIMARY KEY NOT NULL,
	`season_id` text NOT NULL,
	`chapter_no` integer NOT NULL,
	`date` text NOT NULL,
	`note` text NOT NULL,
	`mood` integer NOT NULL,
	`photo_url` text,
	`photo_caption` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`season_id`) REFERENCES `seasons`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `logs_season_ch` ON `daily_logs` (`season_id`,`chapter_no`);--> statement-breakpoint
CREATE TABLE `future_selves` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`profile_json` text NOT NULL,
	`sheet_future_url` text,
	`sheet_present_url` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `jobs` (
	`id` text PRIMARY KEY NOT NULL,
	`type` text NOT NULL,
	`ref_id` text NOT NULL,
	`status` text DEFAULT 'queued' NOT NULL,
	`events_json` text NOT NULL,
	`error` text,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `panels` (
	`id` text PRIMARY KEY NOT NULL,
	`chapter_id` text NOT NULL,
	`idx` integer NOT NULL,
	`image_url` text,
	`scene_desc` text NOT NULL,
	`narration` text,
	`dialogues_json` text NOT NULL,
	FOREIGN KEY (`chapter_id`) REFERENCES `chapters`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `panels_chapter_idx` ON `panels` (`chapter_id`,`idx`);--> statement-breakpoint
CREATE TABLE `quests` (
	`id` text PRIMARY KEY NOT NULL,
	`season_id` text NOT NULL,
	`chapter_no` integer NOT NULL,
	`idx` integer NOT NULL,
	`text` text NOT NULL,
	`difficulty` integer NOT NULL,
	`is_key` integer DEFAULT false NOT NULL,
	`story_hook` text DEFAULT '' NOT NULL,
	`done` integer DEFAULT false NOT NULL,
	`done_at` integer,
	FOREIGN KEY (`season_id`) REFERENCES `seasons`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `quests_season_ch` ON `quests` (`season_id`,`chapter_no`);--> statement-breakpoint
CREATE TABLE `seasons` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`future_self_id` text,
	`title` text DEFAULT '' NOT NULL,
	`style` text NOT NULL,
	`time_budget` text NOT NULL,
	`onboarding_input_json` text NOT NULL,
	`story_bible_json` text,
	`roadmap_json` text,
	`first_letter_md` text,
	`letter_to_future` text,
	`start_date` text NOT NULL,
	`current_chapter` integer DEFAULT 1 NOT NULL,
	`status` text DEFAULT 'onboarding' NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`future_self_id`) REFERENCES `future_selves`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`nickname` text,
	`active_season_id` text,
	`created_at` integer NOT NULL
);
