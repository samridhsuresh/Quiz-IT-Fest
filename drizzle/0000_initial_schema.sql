CREATE TABLE "achievements" (
	"id" serial PRIMARY KEY NOT NULL,
	"code" text NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"icon" text NOT NULL,
	"xp_reward" integer DEFAULT 100 NOT NULL,
	"category_slug" text DEFAULT 'all' NOT NULL,
	"condition_type" text NOT NULL,
	"condition_value" integer DEFAULT 1 NOT NULL,
	CONSTRAINT "achievements_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "attempt_questions" (
	"id" serial PRIMARY KEY NOT NULL,
	"attempt_id" integer NOT NULL,
	"question_id" integer NOT NULL,
	"order_index" integer NOT NULL,
	"category_slug" text NOT NULL,
	"difficulty" text NOT NULL,
	"points_value" integer NOT NULL,
	"shuffled_options_json" text NOT NULL,
	"is_flagged" boolean DEFAULT false NOT NULL,
	"is_answered" boolean DEFAULT false NOT NULL,
	"is_correct" boolean DEFAULT false NOT NULL,
	"points_earned" integer DEFAULT 0 NOT NULL,
	"selected_option_id" integer,
	"time_spent_sec" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "categories" (
	"id" serial PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"description" text NOT NULL,
	"icon" text NOT NULL,
	"accent_color" text NOT NULL,
	"question_count" integer DEFAULT 200 NOT NULL,
	CONSTRAINT "categories_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "leaderboards" (
	"id" serial PRIMARY KEY NOT NULL,
	"attempt_id" integer NOT NULL,
	"user_uid" text NOT NULL,
	"display_name" text NOT NULL,
	"student_class" text DEFAULT '' NOT NULL,
	"school_college" text DEFAULT '' NOT NULL,
	"avatar" text DEFAULT 'shield-cyan' NOT NULL,
	"mode" text NOT NULL,
	"category_slug" text DEFAULT 'all' NOT NULL,
	"score" integer NOT NULL,
	"max_score" integer NOT NULL,
	"accuracy_percent" double precision NOT NULL,
	"time_spent_sec" integer NOT NULL,
	"completed_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "leaderboards_attempt_id_unique" UNIQUE("attempt_id")
);
--> statement-breakpoint
CREATE TABLE "profiles" (
	"id" serial PRIMARY KEY NOT NULL,
	"uid" text NOT NULL,
	"email" text DEFAULT '' NOT NULL,
	"display_name" text DEFAULT 'Arena Challenger' NOT NULL,
	"student_class" text DEFAULT '' NOT NULL,
	"school_college" text DEFAULT '' NOT NULL,
	"avatar" text DEFAULT 'shield-cyan' NOT NULL,
	"xp" integer DEFAULT 0 NOT NULL,
	"level" integer DEFAULT 1 NOT NULL,
	"total_completed_challenges" integer DEFAULT 0 NOT NULL,
	"best_score" integer DEFAULT 0 NOT NULL,
	"average_accuracy" double precision DEFAULT 0 NOT NULL,
	"current_streak" integer DEFAULT 0 NOT NULL,
	"category_mastery_json" text DEFAULT '{}' NOT NULL,
	"role" text DEFAULT 'player' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "profiles_uid_unique" UNIQUE("uid")
);
--> statement-breakpoint
CREATE TABLE "question_images" (
	"id" serial PRIMARY KEY NOT NULL,
	"question_id" integer NOT NULL,
	"image_url" text NOT NULL,
	"alt_text" text NOT NULL,
	"diagram_svg_type" text DEFAULT 'none' NOT NULL,
	"caption" text DEFAULT '' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "question_options" (
	"id" serial PRIMARY KEY NOT NULL,
	"question_id" integer NOT NULL,
	"option_key" text NOT NULL,
	"option_text" text NOT NULL,
	"is_correct" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "question_reports" (
	"id" serial PRIMARY KEY NOT NULL,
	"question_id" integer NOT NULL,
	"user_uid" text NOT NULL,
	"reason" text NOT NULL,
	"details" text DEFAULT '' NOT NULL,
	"status" text DEFAULT 'open' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "questions" (
	"id" serial PRIMARY KEY NOT NULL,
	"code" text NOT NULL,
	"category_id" integer NOT NULL,
	"category_slug" text NOT NULL,
	"difficulty" text NOT NULL,
	"question_text" text NOT NULL,
	"explanation" text NOT NULL,
	"diagram_type" text DEFAULT 'none' NOT NULL,
	"diagram_data_json" text DEFAULT '{}' NOT NULL,
	"tags_json" text DEFAULT '[]' NOT NULL,
	"estimated_time_sec" integer DEFAULT 30 NOT NULL,
	"verification_status" text DEFAULT 'verified' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"times_asked" integer DEFAULT 0 NOT NULL,
	"times_correct" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "questions_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "quiz_attempts" (
	"id" serial PRIMARY KEY NOT NULL,
	"attempt_uuid" text NOT NULL,
	"user_uid" text NOT NULL,
	"display_name" text DEFAULT 'Arena Challenger' NOT NULL,
	"student_class" text DEFAULT '' NOT NULL,
	"school_college" text DEFAULT '' NOT NULL,
	"mode" text NOT NULL,
	"category_slug" text DEFAULT 'all' NOT NULL,
	"practice_difficulty" text DEFAULT 'all' NOT NULL,
	"status" text DEFAULT 'in_progress' NOT NULL,
	"current_score" integer DEFAULT 0 NOT NULL,
	"max_possible_score" integer DEFAULT 275 NOT NULL,
	"correct_count" integer DEFAULT 0 NOT NULL,
	"incorrect_count" integer DEFAULT 0 NOT NULL,
	"unanswered_count" integer DEFAULT 0 NOT NULL,
	"accuracy_percent" double precision DEFAULT 0 NOT NULL,
	"time_spent_sec" integer DEFAULT 0 NOT NULL,
	"time_limit_sec" integer DEFAULT 0 NOT NULL,
	"current_index" integer DEFAULT 0 NOT NULL,
	"total_questions" integer DEFAULT 100 NOT NULL,
	"repeat_notice" boolean DEFAULT false NOT NULL,
	"xp_earned" integer DEFAULT 0 NOT NULL,
	"started_at" timestamp DEFAULT now() NOT NULL,
	"completed_at" timestamp,
	CONSTRAINT "quiz_attempts_attempt_uuid_unique" UNIQUE("attempt_uuid")
);
--> statement-breakpoint
CREATE TABLE "submitted_answers" (
	"id" serial PRIMARY KEY NOT NULL,
	"attempt_id" integer NOT NULL,
	"attempt_question_id" integer NOT NULL,
	"question_id" integer NOT NULL,
	"user_uid" text NOT NULL,
	"selected_option_id" integer NOT NULL,
	"is_correct" boolean NOT NULL,
	"points_earned" integer NOT NULL,
	"time_spent_sec" integer DEFAULT 0 NOT NULL,
	"submitted_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_achievements" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_uid" text NOT NULL,
	"achievement_code" text NOT NULL,
	"attempt_id" integer,
	"unlocked_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_question_history" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_uid" text NOT NULL,
	"question_id" integer NOT NULL,
	"attempt_count" integer DEFAULT 1 NOT NULL,
	"last_correct" boolean DEFAULT false NOT NULL,
	"last_attempted_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "attempt_questions" ADD CONSTRAINT "attempt_questions_attempt_id_quiz_attempts_id_fk" FOREIGN KEY ("attempt_id") REFERENCES "public"."quiz_attempts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attempt_questions" ADD CONSTRAINT "attempt_questions_question_id_questions_id_fk" FOREIGN KEY ("question_id") REFERENCES "public"."questions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leaderboards" ADD CONSTRAINT "leaderboards_attempt_id_quiz_attempts_id_fk" FOREIGN KEY ("attempt_id") REFERENCES "public"."quiz_attempts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "question_images" ADD CONSTRAINT "question_images_question_id_questions_id_fk" FOREIGN KEY ("question_id") REFERENCES "public"."questions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "question_options" ADD CONSTRAINT "question_options_question_id_questions_id_fk" FOREIGN KEY ("question_id") REFERENCES "public"."questions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "question_reports" ADD CONSTRAINT "question_reports_question_id_questions_id_fk" FOREIGN KEY ("question_id") REFERENCES "public"."questions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "questions" ADD CONSTRAINT "questions_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "submitted_answers" ADD CONSTRAINT "submitted_answers_attempt_id_quiz_attempts_id_fk" FOREIGN KEY ("attempt_id") REFERENCES "public"."quiz_attempts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "submitted_answers" ADD CONSTRAINT "submitted_answers_attempt_question_id_attempt_questions_id_fk" FOREIGN KEY ("attempt_question_id") REFERENCES "public"."attempt_questions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "submitted_answers" ADD CONSTRAINT "submitted_answers_question_id_questions_id_fk" FOREIGN KEY ("question_id") REFERENCES "public"."questions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_question_history" ADD CONSTRAINT "user_question_history_question_id_questions_id_fk" FOREIGN KEY ("question_id") REFERENCES "public"."questions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "submitted_answers_attempt_aq_idx" ON "submitted_answers" USING btree ("attempt_id","attempt_question_id");--> statement-breakpoint
CREATE UNIQUE INDEX "user_achievements_uid_code_idx" ON "user_achievements" USING btree ("user_uid","achievement_code");--> statement-breakpoint
CREATE UNIQUE INDEX "user_question_history_uid_qid_idx" ON "user_question_history" USING btree ("user_uid","question_id");