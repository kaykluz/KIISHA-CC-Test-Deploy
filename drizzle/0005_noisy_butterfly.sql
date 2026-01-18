ALTER TABLE `whatsappMessages` MODIFY COLUMN `processingStatus` enum('pending','processing','completed','failed','sent') DEFAULT 'pending';--> statement-breakpoint
ALTER TABLE `whatsappMessages` ADD `configId` int;--> statement-breakpoint
ALTER TABLE `whatsappMessages` ADD `recipientPhone` varchar(20);--> statement-breakpoint
ALTER TABLE `whatsappMessages` ADD `direction` enum('inbound','outbound') DEFAULT 'inbound';--> statement-breakpoint
ALTER TABLE `whatsappMessages` ADD `category` enum('field_report','issue','document','general') DEFAULT 'general';