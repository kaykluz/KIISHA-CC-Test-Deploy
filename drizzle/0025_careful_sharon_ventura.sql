ALTER TABLE `whatsappMessages` ADD `sessionId` int;--> statement-breakpoint
ALTER TABLE `whatsappMessages` ADD `timestamp` timestamp DEFAULT (now());