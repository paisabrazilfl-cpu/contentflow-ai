CREATE TABLE `brand_voice` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`businessName` varchar(256),
	`industry` varchar(128),
	`targetAudience` text,
	`toneKeywords` text,
	`avoidKeywords` text,
	`sampleContent` text,
	`websiteUrl` varchar(512),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `brand_voice_id` PRIMARY KEY(`id`),
	CONSTRAINT `brand_voice_userId_unique` UNIQUE(`userId`)
);
--> statement-breakpoint
CREATE TABLE `connected_accounts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`platform` enum('google_youtube','google_business','meta_facebook','meta_instagram','tiktok','reddit') NOT NULL,
	`platformUserId` varchar(256),
	`platformUsername` varchar(256),
	`accessToken` text NOT NULL,
	`refreshToken` text,
	`tokenExpiresAt` timestamp,
	`scopes` text,
	`metadata` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `connected_accounts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `content_queue` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`platform` enum('google_youtube','google_business','meta_facebook','meta_instagram','tiktok','reddit') NOT NULL,
	`contentType` enum('post','video','story','reel','community_post','blog') NOT NULL DEFAULT 'post',
	`title` varchar(512),
	`body` text,
	`mediaUrls` json,
	`metadata` json,
	`scheduledAt` timestamp NOT NULL,
	`status` enum('pending','processing','published','failed','cancelled') NOT NULL DEFAULT 'pending',
	`publishedAt` timestamp,
	`errorMessage` text,
	`retryCount` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `content_queue_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `generated_content` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`platform` varchar(64),
	`contentType` varchar(64),
	`prompt` text,
	`result` text,
	`metadata` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `generated_content_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `subscriptions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`stripeCustomerId` varchar(128),
	`stripeSubscriptionId` varchar(128),
	`stripePriceId` varchar(128),
	`plan` enum('starter','pro','agency','free') NOT NULL DEFAULT 'free',
	`status` enum('active','trialing','past_due','canceled','unpaid','incomplete','incomplete_expired','paused') NOT NULL DEFAULT 'active',
	`currentPeriodStart` timestamp,
	`currentPeriodEnd` timestamp,
	`cancelAtPeriodEnd` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `subscriptions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `usage_tracking` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`month` varchar(7) NOT NULL,
	`generationCount` int NOT NULL DEFAULT 0,
	`publishCount` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `usage_tracking_id` PRIMARY KEY(`id`)
);
