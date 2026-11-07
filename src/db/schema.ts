import { relations } from 'drizzle-orm';
import {
  boolean,
  doublePrecision,
  integer,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
} from 'drizzle-orm/pg-core';

export const profiles = pgTable('profiles', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(),
  email: text('email').notNull().default(''),
  displayName: text('display_name').notNull().default('Arena Challenger'),
  studentClass: text('student_class').notNull().default(''),
  schoolCollege: text('school_college').notNull().default(''),
  avatar: text('avatar').notNull().default('shield-cyan'),
  xp: integer('xp').notNull().default(0),
  level: integer('level').notNull().default(1),
  totalCompletedChallenges: integer('total_completed_challenges').notNull().default(0),
  bestScore: integer('best_score').notNull().default(0),
  averageAccuracy: doublePrecision('average_accuracy').notNull().default(0),
  currentStreak: integer('current_streak').notNull().default(0),
  categoryMasteryJson: text('category_mastery_json').notNull().default('{}'),
  role: text('role').notNull().default('player'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const categories = pgTable('categories', {
  id: serial('id').primaryKey(),
  slug: text('slug').notNull().unique(),
  name: text('name').notNull(),
  description: text('description').notNull(),
  icon: text('icon').notNull(),
  accentColor: text('accent_color').notNull(),
  questionCount: integer('question_count').notNull().default(200),
});

export const questions = pgTable('questions', {
  id: serial('id').primaryKey(),
  code: text('code').notNull().unique(),
  categoryId: integer('category_id')
    .references(() => categories.id)
    .notNull(),
  categorySlug: text('category_slug').notNull(),
  difficulty: text('difficulty').notNull(), // 'Easy' | 'Normal' | 'Hard' | 'Very Hard'
  questionText: text('question_text').notNull(),
  explanation: text('explanation').notNull(),
  diagramType: text('diagram_type').notNull().default('none'),
  diagramDataJson: text('diagram_data_json').notNull().default('{}'),
  tagsJson: text('tags_json').notNull().default('[]'),
  estimatedTimeSec: integer('estimated_time_sec').notNull().default(30),
  verificationStatus: text('verification_status').notNull().default('verified'), // 'verified' | 'pending_review' | 'rejected'
  isActive: boolean('is_active').notNull().default(true),
  timesAsked: integer('times_asked').notNull().default(0),
  timesCorrect: integer('times_correct').notNull().default(0),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const questionOptions = pgTable('question_options', {
  id: serial('id').primaryKey(),
  questionId: integer('question_id')
    .references(() => questions.id, { onDelete: 'cascade' })
    .notNull(),
  optionKey: text('option_key').notNull(), // 'A' | 'B' | 'C' | 'D'
  optionText: text('option_text').notNull(),
  isCorrect: boolean('is_correct').notNull().default(false),
});

export const questionImages = pgTable('question_images', {
  id: serial('id').primaryKey(),
  questionId: integer('question_id')
    .references(() => questions.id, { onDelete: 'cascade' })
    .notNull(),
  imageUrl: text('image_url').notNull(),
  altText: text('alt_text').notNull(),
  diagramSvgType: text('diagram_svg_type').notNull().default('none'),
  caption: text('caption').notNull().default(''),
});

export const quizAttempts = pgTable('quiz_attempts', {
  id: serial('id').primaryKey(),
  attemptUuid: text('attempt_uuid').notNull().unique(),
  userUid: text('user_uid').notNull(),
  displayName: text('display_name').notNull().default('Arena Challenger'),
  studentClass: text('student_class').notNull().default(''),
  schoolCollege: text('school_college').notNull().default(''),
  mode: text('mode').notNull(), // 'full_arena' | 'category' | 'quick' | 'boss_rush' | 'practice'
  categorySlug: text('category_slug').notNull().default('all'),
  practiceDifficulty: text('practice_difficulty').notNull().default('all'),
  status: text('status').notNull().default('in_progress'), // 'in_progress' | 'completed' | 'abandoned'
  currentScore: integer('current_score').notNull().default(0),
  maxPossibleScore: integer('max_possible_score').notNull().default(275),
  correctCount: integer('correct_count').notNull().default(0),
  incorrectCount: integer('incorrect_count').notNull().default(0),
  unansweredCount: integer('unanswered_count').notNull().default(0),
  accuracyPercent: doublePrecision('accuracy_percent').notNull().default(0),
  timeSpentSec: integer('time_spent_sec').notNull().default(0),
  timeLimitSec: integer('time_limit_sec').notNull().default(0),
  currentIndex: integer('current_index').notNull().default(0),
  totalQuestions: integer('total_questions').notNull().default(100),
  repeatNotice: boolean('repeat_notice').notNull().default(false),
  xpEarned: integer('xp_earned').notNull().default(0),
  startedAt: timestamp('started_at').defaultNow().notNull(),
  completedAt: timestamp('completed_at'),
});

export const attemptQuestions = pgTable('attempt_questions', {
  id: serial('id').primaryKey(),
  attemptId: integer('attempt_id')
    .references(() => quizAttempts.id, { onDelete: 'cascade' })
    .notNull(),
  questionId: integer('question_id')
    .references(() => questions.id)
    .notNull(),
  orderIndex: integer('order_index').notNull(),
  categorySlug: text('category_slug').notNull(),
  difficulty: text('difficulty').notNull(),
  pointsValue: integer('points_value').notNull(),
  shuffledOptionsJson: text('shuffled_options_json').notNull(), // Array of { optionId, label, text } without isCorrect
  isFlagged: boolean('is_flagged').notNull().default(false),
  isAnswered: boolean('is_answered').notNull().default(false),
  isCorrect: boolean('is_correct').notNull().default(false),
  pointsEarned: integer('points_earned').notNull().default(0),
  selectedOptionId: integer('selected_option_id'),
  timeSpentSec: integer('time_spent_sec').notNull().default(0),
});

export const submittedAnswers = pgTable(
  'submitted_answers',
  {
    id: serial('id').primaryKey(),
    attemptId: integer('attempt_id')
      .references(() => quizAttempts.id, { onDelete: 'cascade' })
      .notNull(),
    attemptQuestionId: integer('attempt_question_id')
      .references(() => attemptQuestions.id, { onDelete: 'cascade' })
      .notNull(),
    questionId: integer('question_id')
      .references(() => questions.id)
      .notNull(),
    userUid: text('user_uid').notNull(),
    selectedOptionId: integer('selected_option_id').notNull(),
    isCorrect: boolean('is_correct').notNull(),
    pointsEarned: integer('points_earned').notNull(),
    timeSpentSec: integer('time_spent_sec').notNull().default(0),
    submittedAt: timestamp('submitted_at').defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex('submitted_answers_attempt_aq_idx').on(
      table.attemptId,
      table.attemptQuestionId
    ),
  ]
);

export const userQuestionHistory = pgTable(
  'user_question_history',
  {
    id: serial('id').primaryKey(),
    userUid: text('user_uid').notNull(),
    questionId: integer('question_id')
      .references(() => questions.id, { onDelete: 'cascade' })
      .notNull(),
    attemptCount: integer('attempt_count').notNull().default(1),
    lastCorrect: boolean('last_correct').notNull().default(false),
    lastAttemptedAt: timestamp('last_attempted_at').defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex('user_question_history_uid_qid_idx').on(
      table.userUid,
      table.questionId
    ),
  ]
);

export const achievements = pgTable('achievements', {
  id: serial('id').primaryKey(),
  code: text('code').notNull().unique(),
  title: text('title').notNull(),
  description: text('description').notNull(),
  icon: text('icon').notNull(),
  xpReward: integer('xp_reward').notNull().default(100),
  categorySlug: text('category_slug').notNull().default('all'),
  conditionType: text('condition_type').notNull(),
  conditionValue: integer('condition_value').notNull().default(1),
});

export const userAchievements = pgTable(
  'user_achievements',
  {
    id: serial('id').primaryKey(),
    userUid: text('user_uid').notNull(),
    achievementCode: text('achievement_code').notNull(),
    attemptId: integer('attempt_id'),
    unlockedAt: timestamp('unlocked_at').defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex('user_achievements_uid_code_idx').on(
      table.userUid,
      table.achievementCode
    ),
  ]
);

export const leaderboards = pgTable('leaderboards', {
  id: serial('id').primaryKey(),
  attemptId: integer('attempt_id')
    .references(() => quizAttempts.id, { onDelete: 'cascade' })
    .notNull()
    .unique(),
  userUid: text('user_uid').notNull(),
  displayName: text('display_name').notNull(),
  studentClass: text('student_class').notNull().default(''),
  schoolCollege: text('school_college').notNull().default(''),
  avatar: text('avatar').notNull().default('shield-cyan'),
  mode: text('mode').notNull(), // 'full_arena' | 'category' | 'quick' | 'boss_rush'
  categorySlug: text('category_slug').notNull().default('all'),
  score: integer('score').notNull(),
  maxScore: integer('max_score').notNull(),
  accuracyPercent: doublePrecision('accuracy_percent').notNull(),
  timeSpentSec: integer('time_spent_sec').notNull(),
  completedAt: timestamp('completed_at').defaultNow().notNull(),
});

export const questionReports = pgTable('question_reports', {
  id: serial('id').primaryKey(),
  questionId: integer('question_id')
    .references(() => questions.id, { onDelete: 'cascade' })
    .notNull(),
  userUid: text('user_uid').notNull(),
  reason: text('reason').notNull(),
  details: text('details').notNull().default(''),
  status: text('status').notNull().default('open'), // 'open' | 'resolved' | 'dismissed'
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Relations
export const categoriesRelations = relations(categories, ({ many }) => ({
  questions: many(questions),
}));

export const questionsRelations = relations(questions, ({ one, many }) => ({
  category: one(categories, {
    fields: [questions.categoryId],
    references: [categories.id],
  }),
  options: many(questionOptions),
  images: many(questionImages),
}));

export const questionOptionsRelations = relations(questionOptions, ({ one }) => ({
  question: one(questions, {
    fields: [questionOptions.questionId],
    references: [questions.id],
  }),
}));

export const questionImagesRelations = relations(questionImages, ({ one }) => ({
  question: one(questions, {
    fields: [questionImages.questionId],
    references: [questions.id],
  }),
}));

export const quizAttemptsRelations = relations(quizAttempts, ({ many }) => ({
  attemptQuestions: many(attemptQuestions),
  submittedAnswers: many(submittedAnswers),
}));

export const attemptQuestionsRelations = relations(attemptQuestions, ({ one }) => ({
  attempt: one(quizAttempts, {
    fields: [attemptQuestions.attemptId],
    references: [quizAttempts.id],
  }),
  question: one(questions, {
    fields: [attemptQuestions.questionId],
    references: [questions.id],
  }),
}));
