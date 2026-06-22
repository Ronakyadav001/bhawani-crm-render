-- CreateTable
CREATE TABLE `users` (
    `id` VARCHAR(191) NOT NULL,
    `full_name` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `phone` VARCHAR(191) NULL,
    `password_hash` VARCHAR(191) NOT NULL,
    `role` ENUM('SUPER_ADMIN', 'SALES_ADMIN', 'YOGA_TRAINER', 'DIETICIAN', 'SUPPORT_ADMIN', 'CLIENT') NOT NULL,
    `status` ENUM('ACTIVE', 'INACTIVE', 'SUSPENDED') NOT NULL DEFAULT 'ACTIVE',
    `force_password_change` BOOLEAN NOT NULL DEFAULT true,
    `profile_image` VARCHAR(191) NULL,
    `created_by` VARCHAR(191) NULL,
    `last_login_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `users_email_key`(`email`),
    UNIQUE INDEX `users_phone_key`(`phone`),
    INDEX `users_role_status_idx`(`role`, `status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `refresh_tokens` (
    `id` VARCHAR(191) NOT NULL,
    `user_id` VARCHAR(191) NOT NULL,
    `token_hash` VARCHAR(191) NOT NULL,
    `expires_at` DATETIME(3) NOT NULL,
    `revoked_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `refresh_tokens_token_hash_key`(`token_hash`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `password_reset_tokens` (
    `id` VARCHAR(191) NOT NULL,
    `user_id` VARCHAR(191) NOT NULL,
    `token_hash` VARCHAR(191) NOT NULL,
    `expires_at` DATETIME(3) NOT NULL,
    `used_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `password_reset_tokens_token_hash_key`(`token_hash`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `clients` (
    `id` VARCHAR(191) NOT NULL,
    `user_id` VARCHAR(191) NOT NULL,
    `client_code` VARCHAR(191) NOT NULL,
    `gender` VARCHAR(191) NULL,
    `age` INTEGER NULL,
    `date_of_birth` DATETIME(3) NULL,
    `city` VARCHAR(191) NULL,
    `state` VARCHAR(191) NULL,
    `country` VARCHAR(191) NULL,
    `marital_status` VARCHAR(191) NULL,
    `health_goal` VARCHAR(191) NULL,
    `fertility_status` VARCHAR(191) NULL,
    `medical_conditions` JSON NULL,
    `notes` VARCHAR(191) NULL,
    `assigned_sales_id` VARCHAR(191) NULL,
    `assigned_trainer_id` VARCHAR(191) NULL,
    `assigned_dietician_id` VARCHAR(191) NULL,
    `assigned_support_id` VARCHAR(191) NULL,
    `onboarding_status` ENUM('PENDING', 'SCHEDULED', 'COMPLETED', 'MISSED') NOT NULL DEFAULT 'PENDING',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `clients_user_id_key`(`user_id`),
    UNIQUE INDEX `clients_client_code_key`(`client_code`),
    INDEX `clients_assigned_sales_id_idx`(`assigned_sales_id`),
    INDEX `clients_assigned_trainer_id_idx`(`assigned_trainer_id`),
    INDEX `clients_assigned_dietician_id_idx`(`assigned_dietician_id`),
    INDEX `clients_assigned_support_id_idx`(`assigned_support_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `subscription_plans` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `duration_days` INTEGER NOT NULL,
    `price` DECIMAL(10, 2) NOT NULL,
    `description` VARCHAR(191) NULL,
    `yoga_sessions_included` INTEGER NOT NULL DEFAULT 0,
    `dietician_support_included` BOOLEAN NOT NULL DEFAULT false,
    `live_classes_included` BOOLEAN NOT NULL DEFAULT false,
    `recording_access` BOOLEAN NOT NULL DEFAULT false,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `subscriptions` (
    `id` VARCHAR(191) NOT NULL,
    `client_id` VARCHAR(191) NOT NULL,
    `plan_id` VARCHAR(191) NOT NULL,
    `start_date` DATETIME(3) NOT NULL,
    `end_date` DATETIME(3) NOT NULL,
    `status` ENUM('ACTIVE', 'EXPIRED', 'CANCELLED', 'PENDING') NOT NULL DEFAULT 'PENDING',
    `payment_status` ENUM('PENDING', 'PAID', 'FAILED', 'REFUNDED') NOT NULL DEFAULT 'PENDING',
    `source` ENUM('WEBSITE', 'SUPER_ADMIN_MANUAL', 'APP') NOT NULL DEFAULT 'SUPER_ADMIN_MANUAL',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `subscriptions_client_id_status_idx`(`client_id`, `status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `payments` (
    `id` VARCHAR(191) NOT NULL,
    `client_id` VARCHAR(191) NOT NULL,
    `subscription_id` VARCHAR(191) NULL,
    `amount` DECIMAL(10, 2) NOT NULL,
    `currency` VARCHAR(191) NOT NULL DEFAULT 'INR',
    `payment_gateway` VARCHAR(191) NOT NULL DEFAULT 'razorpay',
    `transaction_id` VARCHAR(191) NULL,
    `payment_status` ENUM('PENDING', 'PAID', 'FAILED', 'REFUNDED') NOT NULL DEFAULT 'PENDING',
    `paid_at` DATETIME(3) NULL,
    `receipt_url` VARCHAR(191) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `payments_transaction_id_key`(`transaction_id`),
    INDEX `payments_client_id_payment_status_idx`(`client_id`, `payment_status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `leads` (
    `id` VARCHAR(191) NOT NULL,
    `full_name` VARCHAR(191) NOT NULL,
    `phone` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NULL,
    `source` ENUM('WEBSITE', 'WHATSAPP', 'INSTAGRAM', 'MANUAL', 'REFERRAL', 'APP') NOT NULL DEFAULT 'MANUAL',
    `health_goal` VARCHAR(191) NULL,
    `lead_status` ENUM('NEW', 'CONTACTED', 'FOLLOW_UP', 'CONVERTED', 'LOST') NOT NULL DEFAULT 'NEW',
    `assigned_sales_id` VARCHAR(191) NULL,
    `notes` VARCHAR(191) NULL,
    `next_follow_up_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `leads_lead_status_assigned_sales_id_idx`(`lead_status`, `assigned_sales_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `onboarding_calls` (
    `id` VARCHAR(191) NOT NULL,
    `client_id` VARCHAR(191) NOT NULL,
    `sales_admin_id` VARCHAR(191) NULL,
    `scheduled_at` DATETIME(3) NOT NULL,
    `call_type` VARCHAR(191) NOT NULL,
    `call_link` VARCHAR(191) NULL,
    `status` ENUM('SCHEDULED', 'COMPLETED', 'MISSED', 'RESCHEDULED', 'CANCELLED') NOT NULL DEFAULT 'SCHEDULED',
    `notes` VARCHAR(191) NULL,
    `completed_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `onboarding_calls_sales_admin_id_status_idx`(`sales_admin_id`, `status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `diet_plans` (
    `id` VARCHAR(191) NOT NULL,
    `client_id` VARCHAR(191) NOT NULL,
    `dietician_id` VARCHAR(191) NULL,
    `title` VARCHAR(191) NOT NULL,
    `goal` VARCHAR(191) NULL,
    `plan_start_date` DATETIME(3) NOT NULL,
    `plan_end_date` DATETIME(3) NOT NULL,
    `status` ENUM('DRAFT', 'PUBLISHED', 'ARCHIVED') NOT NULL DEFAULT 'DRAFT',
    `notes` VARCHAR(191) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `diet_plans_client_id_dietician_id_status_idx`(`client_id`, `dietician_id`, `status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `diet_meals` (
    `id` VARCHAR(191) NOT NULL,
    `diet_plan_id` VARCHAR(191) NOT NULL,
    `meal_type` ENUM('MORNING', 'BREAKFAST', 'MID_MORNING', 'LUNCH', 'EVENING', 'DINNER', 'BEDTIME') NOT NULL,
    `meal_time` VARCHAR(191) NULL,
    `food_items` VARCHAR(191) NOT NULL,
    `calories` INTEGER NULL,
    `protein` INTEGER NULL,
    `carbs` INTEGER NULL,
    `fats` INTEGER NULL,
    `instructions` VARCHAR(191) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `diet_progress_logs` (
    `id` VARCHAR(191) NOT NULL,
    `client_id` VARCHAR(191) NOT NULL,
    `dietician_id` VARCHAR(191) NULL,
    `weight` DECIMAL(6, 2) NULL,
    `measurements` JSON NULL,
    `energy_level` INTEGER NULL,
    `sleep_quality` INTEGER NULL,
    `compliance_score` INTEGER NULL,
    `notes` VARCHAR(191) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `diet_progress_logs_client_id_dietician_id_idx`(`client_id`, `dietician_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `yoga_sessions` (
    `id` VARCHAR(191) NOT NULL,
    `trainer_id` VARCHAR(191) NULL,
    `title` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `session_type` VARCHAR(191) NOT NULL,
    `category` VARCHAR(191) NULL,
    `scheduled_start` DATETIME(3) NOT NULL,
    `scheduled_end` DATETIME(3) NOT NULL,
    `live_link` VARCHAR(191) NULL,
    `status` ENUM('SCHEDULED', 'LIVE', 'COMPLETED', 'CANCELLED') NOT NULL DEFAULT 'SCHEDULED',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `yoga_sessions_trainer_id_status_idx`(`trainer_id`, `status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `session_assignments` (
    `id` VARCHAR(191) NOT NULL,
    `session_id` VARCHAR(191) NOT NULL,
    `client_id` VARCHAR(191) NOT NULL,
    `assigned_by` VARCHAR(191) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `session_assignments_session_id_client_id_key`(`session_id`, `client_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `session_attendance` (
    `id` VARCHAR(191) NOT NULL,
    `session_id` VARCHAR(191) NOT NULL,
    `client_id` VARCHAR(191) NOT NULL,
    `joined_at` DATETIME(3) NULL,
    `left_at` DATETIME(3) NULL,
    `duration_minutes` INTEGER NULL,
    `attendance_status` ENUM('JOINED', 'MISSED', 'PARTIAL') NOT NULL DEFAULT 'JOINED',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `session_attendance_session_id_client_id_key`(`session_id`, `client_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `session_recordings` (
    `id` VARCHAR(191) NOT NULL,
    `session_id` VARCHAR(191) NOT NULL,
    `trainer_id` VARCHAR(191) NULL,
    `title` VARCHAR(191) NOT NULL,
    `recording_url` VARCHAR(191) NOT NULL,
    `thumbnail_url` VARCHAR(191) NULL,
    `category` VARCHAR(191) NULL,
    `is_premium_only` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `support_tickets` (
    `id` VARCHAR(191) NOT NULL,
    `client_id` VARCHAR(191) NOT NULL,
    `assigned_support_id` VARCHAR(191) NULL,
    `subject` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NOT NULL,
    `priority` ENUM('LOW', 'MEDIUM', 'HIGH', 'URGENT') NOT NULL DEFAULT 'MEDIUM',
    `status` ENUM('OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED') NOT NULL DEFAULT 'OPEN',
    `source` ENUM('APP_CHAT', 'MANUAL', 'WHATSAPP', 'AI_ESCALATION') NOT NULL DEFAULT 'MANUAL',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    `resolved_at` DATETIME(3) NULL,

    INDEX `support_tickets_assigned_support_id_status_idx`(`assigned_support_id`, `status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `chat_messages` (
    `id` VARCHAR(191) NOT NULL,
    `client_id` VARCHAR(191) NOT NULL,
    `sender_id` VARCHAR(191) NULL,
    `sender_role` ENUM('SUPER_ADMIN', 'SALES_ADMIN', 'YOGA_TRAINER', 'DIETICIAN', 'SUPPORT_ADMIN', 'CLIENT') NOT NULL,
    `message` VARCHAR(191) NOT NULL,
    `message_type` ENUM('TEXT', 'IMAGE', 'FILE', 'SYSTEM') NOT NULL DEFAULT 'TEXT',
    `related_ticket_id` VARCHAR(191) NULL,
    `ai_generated` BOOLEAN NOT NULL DEFAULT false,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `chat_messages_client_id_related_ticket_id_idx`(`client_id`, `related_ticket_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `notifications` (
    `id` VARCHAR(191) NOT NULL,
    `user_id` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `message` VARCHAR(191) NOT NULL,
    `type` VARCHAR(191) NOT NULL,
    `channel` ENUM('PUSH', 'WHATSAPP', 'EMAIL', 'IN_APP') NOT NULL DEFAULT 'IN_APP',
    `status` ENUM('PENDING', 'SENT', 'FAILED', 'READ') NOT NULL DEFAULT 'PENDING',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `notifications_user_id_status_idx`(`user_id`, `status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `feedback` (
    `id` VARCHAR(191) NOT NULL,
    `client_id` VARCHAR(191) NOT NULL,
    `related_type` ENUM('ONBOARDING', 'DIET', 'YOGA_SESSION', 'SUPPORT', 'APP') NOT NULL,
    `related_id` VARCHAR(191) NULL,
    `rating` INTEGER NOT NULL,
    `comment` VARCHAR(191) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `feedback_client_id_related_type_idx`(`client_id`, `related_type`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `activity_logs` (
    `id` VARCHAR(191) NOT NULL,
    `user_id` VARCHAR(191) NULL,
    `role` ENUM('SUPER_ADMIN', 'SALES_ADMIN', 'YOGA_TRAINER', 'DIETICIAN', 'SUPPORT_ADMIN', 'CLIENT') NULL,
    `action` VARCHAR(191) NOT NULL,
    `module` VARCHAR(191) NOT NULL,
    `target_id` VARCHAR(191) NULL,
    `ip_address` VARCHAR(191) NULL,
    `metadata` JSON NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `activity_logs_module_created_at_idx`(`module`, `created_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `files` (
    `id` VARCHAR(191) NOT NULL,
    `uploaded_by` VARCHAR(191) NULL,
    `related_type` VARCHAR(191) NULL,
    `related_id` VARCHAR(191) NULL,
    `file_name` VARCHAR(191) NOT NULL,
    `file_url` VARCHAR(191) NOT NULL,
    `mime_type` VARCHAR(191) NOT NULL,
    `file_size` INTEGER NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `users` ADD CONSTRAINT `users_created_by_fkey` FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `refresh_tokens` ADD CONSTRAINT `refresh_tokens_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `password_reset_tokens` ADD CONSTRAINT `password_reset_tokens_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `clients` ADD CONSTRAINT `clients_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `clients` ADD CONSTRAINT `clients_assigned_sales_id_fkey` FOREIGN KEY (`assigned_sales_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `clients` ADD CONSTRAINT `clients_assigned_trainer_id_fkey` FOREIGN KEY (`assigned_trainer_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `clients` ADD CONSTRAINT `clients_assigned_dietician_id_fkey` FOREIGN KEY (`assigned_dietician_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `clients` ADD CONSTRAINT `clients_assigned_support_id_fkey` FOREIGN KEY (`assigned_support_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `subscriptions` ADD CONSTRAINT `subscriptions_client_id_fkey` FOREIGN KEY (`client_id`) REFERENCES `clients`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `subscriptions` ADD CONSTRAINT `subscriptions_plan_id_fkey` FOREIGN KEY (`plan_id`) REFERENCES `subscription_plans`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `payments` ADD CONSTRAINT `payments_client_id_fkey` FOREIGN KEY (`client_id`) REFERENCES `clients`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `payments` ADD CONSTRAINT `payments_subscription_id_fkey` FOREIGN KEY (`subscription_id`) REFERENCES `subscriptions`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `leads` ADD CONSTRAINT `leads_assigned_sales_id_fkey` FOREIGN KEY (`assigned_sales_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `onboarding_calls` ADD CONSTRAINT `onboarding_calls_client_id_fkey` FOREIGN KEY (`client_id`) REFERENCES `clients`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `onboarding_calls` ADD CONSTRAINT `onboarding_calls_sales_admin_id_fkey` FOREIGN KEY (`sales_admin_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `diet_plans` ADD CONSTRAINT `diet_plans_client_id_fkey` FOREIGN KEY (`client_id`) REFERENCES `clients`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `diet_plans` ADD CONSTRAINT `diet_plans_dietician_id_fkey` FOREIGN KEY (`dietician_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `diet_meals` ADD CONSTRAINT `diet_meals_diet_plan_id_fkey` FOREIGN KEY (`diet_plan_id`) REFERENCES `diet_plans`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `diet_progress_logs` ADD CONSTRAINT `diet_progress_logs_client_id_fkey` FOREIGN KEY (`client_id`) REFERENCES `clients`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `diet_progress_logs` ADD CONSTRAINT `diet_progress_logs_dietician_id_fkey` FOREIGN KEY (`dietician_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `yoga_sessions` ADD CONSTRAINT `yoga_sessions_trainer_id_fkey` FOREIGN KEY (`trainer_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `session_assignments` ADD CONSTRAINT `session_assignments_session_id_fkey` FOREIGN KEY (`session_id`) REFERENCES `yoga_sessions`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `session_assignments` ADD CONSTRAINT `session_assignments_client_id_fkey` FOREIGN KEY (`client_id`) REFERENCES `clients`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `session_assignments` ADD CONSTRAINT `session_assignments_assigned_by_fkey` FOREIGN KEY (`assigned_by`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `session_attendance` ADD CONSTRAINT `session_attendance_session_id_fkey` FOREIGN KEY (`session_id`) REFERENCES `yoga_sessions`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `session_attendance` ADD CONSTRAINT `session_attendance_client_id_fkey` FOREIGN KEY (`client_id`) REFERENCES `clients`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `session_recordings` ADD CONSTRAINT `session_recordings_session_id_fkey` FOREIGN KEY (`session_id`) REFERENCES `yoga_sessions`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `session_recordings` ADD CONSTRAINT `session_recordings_trainer_id_fkey` FOREIGN KEY (`trainer_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `support_tickets` ADD CONSTRAINT `support_tickets_client_id_fkey` FOREIGN KEY (`client_id`) REFERENCES `clients`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `support_tickets` ADD CONSTRAINT `support_tickets_assigned_support_id_fkey` FOREIGN KEY (`assigned_support_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `chat_messages` ADD CONSTRAINT `chat_messages_client_id_fkey` FOREIGN KEY (`client_id`) REFERENCES `clients`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `chat_messages` ADD CONSTRAINT `chat_messages_sender_id_fkey` FOREIGN KEY (`sender_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `chat_messages` ADD CONSTRAINT `chat_messages_related_ticket_id_fkey` FOREIGN KEY (`related_ticket_id`) REFERENCES `support_tickets`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `notifications` ADD CONSTRAINT `notifications_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `feedback` ADD CONSTRAINT `feedback_client_id_fkey` FOREIGN KEY (`client_id`) REFERENCES `clients`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `activity_logs` ADD CONSTRAINT `activity_logs_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `files` ADD CONSTRAINT `files_uploaded_by_fkey` FOREIGN KEY (`uploaded_by`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
