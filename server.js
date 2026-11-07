var __defProp = Object.defineProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// server.ts
import express from "express";
import path from "node:path";
import { createServer as createViteServer } from "vite";
import * as dotenv from "dotenv";
import { GoogleGenAI, Type } from "@google/genai";

// src/lib/firebase-admin.ts
import { initializeApp, getApps } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

// firebase-applet-config.json
var firebase_applet_config_default = {
  projectId: "proven-stream-xds98",
  appId: "1:57965317798:web:074b3f0f132f168c68ae67",
  apiKey: "AIzaSyDRB_w7MY3wzN2GBKNn-9pxkpKdMM9zhw8",
  authDomain: "proven-stream-xds98.firebaseapp.com",
  storageBucket: "proven-stream-xds98.firebasestorage.app",
  messagingSenderId: "57965317798",
  measurementId: "",
  oAuthClientId: "57965317798-7h8l400pgn0i4pvq19336l9jv7lrcn00.apps.googleusercontent.com",
  recaptchaSiteKey: ""
};

// src/lib/firebase-admin.ts
if (!getApps().length) {
  initializeApp({
    projectId: firebase_applet_config_default.projectId
  });
}
var adminAuth = getAuth();

// src/middleware/auth.ts
function readHeaderString(val, maxLen = 80) {
  if (typeof val === "string" && val.trim().length > 0) {
    return val.trim().slice(0, maxLen);
  }
  return "";
}
var resolveActor = async (req, _res, next) => {
  const studentClass = readHeaderString(req.headers["x-student-class"], 60);
  const schoolCollege = readHeaderString(req.headers["x-school-college"], 100);
  req.actorClass = studentClass;
  req.actorSchool = schoolCollege;
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.split("Bearer ")[1];
    try {
      const decodedToken = await adminAuth.verifyIdToken(token);
      req.user = decodedToken;
      req.actorUid = decodedToken.uid;
      req.actorEmail = decodedToken.email || "";
      req.actorName = readHeaderString(req.headers["x-guest-name"], 50) || decodedToken.name || decodedToken.email?.split("@")[0] || "Student Challenger";
      req.isGuest = false;
      return next();
    } catch {
    }
  }
  const guestUidHeader = req.headers["x-guest-uid"];
  const guestNameHeader = req.headers["x-guest-name"];
  const rawGuestUid = typeof guestUidHeader === "string" && guestUidHeader.trim().length >= 6 ? guestUidHeader.trim().replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 64) : "guest_default_player";
  const rawGuestName = typeof guestNameHeader === "string" && guestNameHeader.trim().length >= 2 ? guestNameHeader.trim().slice(0, 50) : "Student Challenger";
  req.actorUid = rawGuestUid.startsWith("guest_") ? rawGuestUid : `guest_${rawGuestUid}`;
  req.actorEmail = "";
  req.actorName = rawGuestName;
  req.isGuest = true;
  next();
};

// src/db/repository.ts
import crypto2 from "node:crypto";
import { and, asc, desc, eq, gte, inArray, sql } from "drizzle-orm";

// src/db/index.ts
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

// src/db/schema.ts
var schema_exports = {};
__export(schema_exports, {
  achievements: () => achievements,
  attemptQuestions: () => attemptQuestions,
  attemptQuestionsRelations: () => attemptQuestionsRelations,
  categories: () => categories,
  categoriesRelations: () => categoriesRelations,
  leaderboards: () => leaderboards,
  profiles: () => profiles,
  questionImages: () => questionImages,
  questionImagesRelations: () => questionImagesRelations,
  questionOptions: () => questionOptions,
  questionOptionsRelations: () => questionOptionsRelations,
  questionReports: () => questionReports,
  questions: () => questions,
  questionsRelations: () => questionsRelations,
  quizAttempts: () => quizAttempts,
  quizAttemptsRelations: () => quizAttemptsRelations,
  submittedAnswers: () => submittedAnswers,
  userAchievements: () => userAchievements,
  userQuestionHistory: () => userQuestionHistory
});
import { relations } from "drizzle-orm";
import {
  boolean,
  doublePrecision,
  integer,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex
} from "drizzle-orm/pg-core";
var profiles = pgTable("profiles", {
  id: serial("id").primaryKey(),
  uid: text("uid").notNull().unique(),
  email: text("email").notNull().default(""),
  displayName: text("display_name").notNull().default("Arena Challenger"),
  studentClass: text("student_class").notNull().default(""),
  schoolCollege: text("school_college").notNull().default(""),
  avatar: text("avatar").notNull().default("shield-cyan"),
  xp: integer("xp").notNull().default(0),
  level: integer("level").notNull().default(1),
  totalCompletedChallenges: integer("total_completed_challenges").notNull().default(0),
  bestScore: integer("best_score").notNull().default(0),
  averageAccuracy: doublePrecision("average_accuracy").notNull().default(0),
  currentStreak: integer("current_streak").notNull().default(0),
  categoryMasteryJson: text("category_mastery_json").notNull().default("{}"),
  role: text("role").notNull().default("player"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});
var categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  icon: text("icon").notNull(),
  accentColor: text("accent_color").notNull(),
  questionCount: integer("question_count").notNull().default(200)
});
var questions = pgTable("questions", {
  id: serial("id").primaryKey(),
  code: text("code").notNull().unique(),
  categoryId: integer("category_id").references(() => categories.id).notNull(),
  categorySlug: text("category_slug").notNull(),
  difficulty: text("difficulty").notNull(),
  // 'Easy' | 'Normal' | 'Hard' | 'Very Hard'
  questionText: text("question_text").notNull(),
  explanation: text("explanation").notNull(),
  diagramType: text("diagram_type").notNull().default("none"),
  diagramDataJson: text("diagram_data_json").notNull().default("{}"),
  tagsJson: text("tags_json").notNull().default("[]"),
  estimatedTimeSec: integer("estimated_time_sec").notNull().default(30),
  verificationStatus: text("verification_status").notNull().default("verified"),
  // 'verified' | 'pending_review' | 'rejected'
  isActive: boolean("is_active").notNull().default(true),
  timesAsked: integer("times_asked").notNull().default(0),
  timesCorrect: integer("times_correct").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull()
});
var questionOptions = pgTable("question_options", {
  id: serial("id").primaryKey(),
  questionId: integer("question_id").references(() => questions.id, { onDelete: "cascade" }).notNull(),
  optionKey: text("option_key").notNull(),
  // 'A' | 'B' | 'C' | 'D'
  optionText: text("option_text").notNull(),
  isCorrect: boolean("is_correct").notNull().default(false)
});
var questionImages = pgTable("question_images", {
  id: serial("id").primaryKey(),
  questionId: integer("question_id").references(() => questions.id, { onDelete: "cascade" }).notNull(),
  imageUrl: text("image_url").notNull(),
  altText: text("alt_text").notNull(),
  diagramSvgType: text("diagram_svg_type").notNull().default("none"),
  caption: text("caption").notNull().default("")
});
var quizAttempts = pgTable("quiz_attempts", {
  id: serial("id").primaryKey(),
  attemptUuid: text("attempt_uuid").notNull().unique(),
  userUid: text("user_uid").notNull(),
  displayName: text("display_name").notNull().default("Arena Challenger"),
  studentClass: text("student_class").notNull().default(""),
  schoolCollege: text("school_college").notNull().default(""),
  mode: text("mode").notNull(),
  // 'full_arena' | 'category' | 'quick' | 'boss_rush' | 'practice'
  categorySlug: text("category_slug").notNull().default("all"),
  practiceDifficulty: text("practice_difficulty").notNull().default("all"),
  status: text("status").notNull().default("in_progress"),
  // 'in_progress' | 'completed' | 'abandoned'
  currentScore: integer("current_score").notNull().default(0),
  maxPossibleScore: integer("max_possible_score").notNull().default(275),
  correctCount: integer("correct_count").notNull().default(0),
  incorrectCount: integer("incorrect_count").notNull().default(0),
  unansweredCount: integer("unanswered_count").notNull().default(0),
  accuracyPercent: doublePrecision("accuracy_percent").notNull().default(0),
  timeSpentSec: integer("time_spent_sec").notNull().default(0),
  timeLimitSec: integer("time_limit_sec").notNull().default(0),
  currentIndex: integer("current_index").notNull().default(0),
  totalQuestions: integer("total_questions").notNull().default(100),
  repeatNotice: boolean("repeat_notice").notNull().default(false),
  xpEarned: integer("xp_earned").notNull().default(0),
  startedAt: timestamp("started_at").defaultNow().notNull(),
  completedAt: timestamp("completed_at")
});
var attemptQuestions = pgTable("attempt_questions", {
  id: serial("id").primaryKey(),
  attemptId: integer("attempt_id").references(() => quizAttempts.id, { onDelete: "cascade" }).notNull(),
  questionId: integer("question_id").references(() => questions.id).notNull(),
  orderIndex: integer("order_index").notNull(),
  categorySlug: text("category_slug").notNull(),
  difficulty: text("difficulty").notNull(),
  pointsValue: integer("points_value").notNull(),
  shuffledOptionsJson: text("shuffled_options_json").notNull(),
  // Array of { optionId, label, text } without isCorrect
  isFlagged: boolean("is_flagged").notNull().default(false),
  isAnswered: boolean("is_answered").notNull().default(false),
  isCorrect: boolean("is_correct").notNull().default(false),
  pointsEarned: integer("points_earned").notNull().default(0),
  selectedOptionId: integer("selected_option_id"),
  timeSpentSec: integer("time_spent_sec").notNull().default(0)
});
var submittedAnswers = pgTable(
  "submitted_answers",
  {
    id: serial("id").primaryKey(),
    attemptId: integer("attempt_id").references(() => quizAttempts.id, { onDelete: "cascade" }).notNull(),
    attemptQuestionId: integer("attempt_question_id").references(() => attemptQuestions.id, { onDelete: "cascade" }).notNull(),
    questionId: integer("question_id").references(() => questions.id).notNull(),
    userUid: text("user_uid").notNull(),
    selectedOptionId: integer("selected_option_id").notNull(),
    isCorrect: boolean("is_correct").notNull(),
    pointsEarned: integer("points_earned").notNull(),
    timeSpentSec: integer("time_spent_sec").notNull().default(0),
    submittedAt: timestamp("submitted_at").defaultNow().notNull()
  },
  (table) => [
    uniqueIndex("submitted_answers_attempt_aq_idx").on(
      table.attemptId,
      table.attemptQuestionId
    )
  ]
);
var userQuestionHistory = pgTable(
  "user_question_history",
  {
    id: serial("id").primaryKey(),
    userUid: text("user_uid").notNull(),
    questionId: integer("question_id").references(() => questions.id, { onDelete: "cascade" }).notNull(),
    attemptCount: integer("attempt_count").notNull().default(1),
    lastCorrect: boolean("last_correct").notNull().default(false),
    lastAttemptedAt: timestamp("last_attempted_at").defaultNow().notNull()
  },
  (table) => [
    uniqueIndex("user_question_history_uid_qid_idx").on(
      table.userUid,
      table.questionId
    )
  ]
);
var achievements = pgTable("achievements", {
  id: serial("id").primaryKey(),
  code: text("code").notNull().unique(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  icon: text("icon").notNull(),
  xpReward: integer("xp_reward").notNull().default(100),
  categorySlug: text("category_slug").notNull().default("all"),
  conditionType: text("condition_type").notNull(),
  conditionValue: integer("condition_value").notNull().default(1)
});
var userAchievements = pgTable(
  "user_achievements",
  {
    id: serial("id").primaryKey(),
    userUid: text("user_uid").notNull(),
    achievementCode: text("achievement_code").notNull(),
    attemptId: integer("attempt_id"),
    unlockedAt: timestamp("unlocked_at").defaultNow().notNull()
  },
  (table) => [
    uniqueIndex("user_achievements_uid_code_idx").on(
      table.userUid,
      table.achievementCode
    )
  ]
);
var leaderboards = pgTable("leaderboards", {
  id: serial("id").primaryKey(),
  attemptId: integer("attempt_id").references(() => quizAttempts.id, { onDelete: "cascade" }).notNull().unique(),
  userUid: text("user_uid").notNull(),
  displayName: text("display_name").notNull(),
  studentClass: text("student_class").notNull().default(""),
  schoolCollege: text("school_college").notNull().default(""),
  avatar: text("avatar").notNull().default("shield-cyan"),
  mode: text("mode").notNull(),
  // 'full_arena' | 'category' | 'quick' | 'boss_rush'
  categorySlug: text("category_slug").notNull().default("all"),
  score: integer("score").notNull(),
  maxScore: integer("max_score").notNull(),
  accuracyPercent: doublePrecision("accuracy_percent").notNull(),
  timeSpentSec: integer("time_spent_sec").notNull(),
  completedAt: timestamp("completed_at").defaultNow().notNull()
});
var questionReports = pgTable("question_reports", {
  id: serial("id").primaryKey(),
  questionId: integer("question_id").references(() => questions.id, { onDelete: "cascade" }).notNull(),
  userUid: text("user_uid").notNull(),
  reason: text("reason").notNull(),
  details: text("details").notNull().default(""),
  status: text("status").notNull().default("open"),
  // 'open' | 'resolved' | 'dismissed'
  createdAt: timestamp("created_at").defaultNow().notNull()
});
var categoriesRelations = relations(categories, ({ many }) => ({
  questions: many(questions)
}));
var questionsRelations = relations(questions, ({ one, many }) => ({
  category: one(categories, {
    fields: [questions.categoryId],
    references: [categories.id]
  }),
  options: many(questionOptions),
  images: many(questionImages)
}));
var questionOptionsRelations = relations(questionOptions, ({ one }) => ({
  question: one(questions, {
    fields: [questionOptions.questionId],
    references: [questions.id]
  })
}));
var questionImagesRelations = relations(questionImages, ({ one }) => ({
  question: one(questions, {
    fields: [questionImages.questionId],
    references: [questions.id]
  })
}));
var quizAttemptsRelations = relations(quizAttempts, ({ many }) => ({
  attemptQuestions: many(attemptQuestions),
  submittedAnswers: many(submittedAnswers)
}));
var attemptQuestionsRelations = relations(attemptQuestions, ({ one }) => ({
  attempt: one(quizAttempts, {
    fields: [attemptQuestions.attemptId],
    references: [quizAttempts.id]
  }),
  question: one(questions, {
    fields: [attemptQuestions.questionId],
    references: [questions.id]
  })
}));

// src/db/index.ts
var createPool = () => {
  if (!global._postgresPool) {
    global._postgresPool = new Pool({
      host: process.env.SQL_HOST,
      user: process.env.SQL_USER,
      password: process.env.SQL_PASSWORD,
      database: process.env.SQL_DB_NAME,
      max: 10,
      connectionTimeoutMillis: 15e3
    });
    global._postgresPool.on("error", (err) => {
      console.error("Unexpected error on idle SQL pool client:", err);
    });
  }
  return global._postgresPool;
};
var pool = createPool();
var db = drizzle(pool, { schema: schema_exports });

// src/db/banks/computersBank.ts
var EASY_COMPUTERS = [
  ["Which part of a computer looks like a television screen and shows you pictures and games?", ["Monitor", "Keyboard", "Mouse", "Printer"], "The monitor is the screen that displays images, videos, and words from the computer.", "none", ["basics", "monitor"]],
  ["Which hand-held device do you move across a desk to move the little arrow pointer on the computer screen?", ["Computer Mouse", "Speaker", "Webcam", "Printer"], "Moving the computer mouse moves the cursor arrow across the screen so you can click on things.", "none", ["basics", "mouse"]],
  ["Which long key at the bottom of the keyboard puts a blank space between words when you type?", ["Spacebar", "Escape Key", "Shift Key", "Tab Key"], "The Spacebar is the widest key on the bottom row of a keyboard and adds a space between words.", "none", ["basics", "keyboard"]],
  ["Which machine connected to a computer puts your drawings or homework onto real paper using ink?", ["Printer", "Microphone", "Mouse Pad", "Monitor"], "A printer uses ink or toner to print pictures and text from a computer onto paper.", "none", ["basics", "printer"]],
  ["What do you wear over your ears to listen to computer music or game sounds without bothering other people?", ["Headphones", "Mouse", "Keyboard", "Scanner"], "Headphones play audio directly into your ears so only you can hear the computer sound.", "none", ["basics", "audio"]],
  ["Which key on the keyboard erases the letter you just typed to the left of the blinking cursor?", ["Backspace", "Spacebar", "Caps Lock", "Page Up"], "Pressing the Backspace key deletes the character behind the cursor so you can fix a typing mistake.", "none", ["basics", "keyboard"]],
  ["What do we call a portable computer that folds shut like a book and can sit on your lap?", ["Laptop", "Desktop Tower", "Printer", "Television"], "A laptop combines the screen, keyboard, trackpad, and battery into one folding portable computer.", "none", ["basics", "laptop"]],
  ["Which key on the keyboard makes every letter you type come out as BIG CAPITAL LETTERS?", ["Caps Lock", "Spacebar", "Down Arrow", "Delete"], "Turning on Caps Lock makes all typed letters uppercase until you press it again.", "none", ["basics", "keyboard"]],
  ["What small camera sits at the top of a laptop screen so friends or teachers can see your face on a video call?", ["Webcam", "Speaker", "Cooling Fan", "Hard Drive"], "A webcam captures live video of you for video chats and online classes.", "none", ["basics", "webcam"]],
  ["When you delete a file on a computer, where does it go first in case you want to get it back?", ["Recycle Bin (or Trash)", "Calculator", "Calendar", "Clock"], "Deleted files are placed in the Recycle Bin or Trash so you can restore them if you deleted them by accident.", "none", ["basics", "files"]],
  ["Which computer part lets the computer play loud sounds, music, and voices out into the room?", ["Speakers", "Mouse", "Keyboard", "USB Cable"], "Speakers turn audio signals from the computer into sound waves you can hear.", "none", ["basics", "audio"]],
  ["What do you speak into when you want the computer to record your voice or hear you in a game?", ["Microphone", "Printer", "Monitor", "Mouse Wheel"], "A microphone captures your voice and sends the sound into the computer.", "none", ["basics", "audio"]],
  ["Which key do you press to start a new line when typing a story or to send a chat message?", ["Enter (or Return) Key", "Spacebar", "Shift Key", "Left Arrow"], "The Enter key moves the cursor to the next line or submits a form or message.", "none", ["basics", "keyboard"]],
  ["On a tablet or smartphone, how do you open an app on the glass screen?", ["Tap it with your finger", "Blow air on the screen", "Shake the charger cable", "Press a foot pedal"], "Touchscreens sense your finger tap directly on the app icon.", "none", ["basics", "touchscreen"]],
  ["What happens to a laptop or tablet if its battery runs all the way down to 0% and it is not plugged in?", ["It turns off until you charge it", "It turns into a printer", "It gets twice as loud", "It floats in the air"], "Like any battery-powered device, a laptop needs electricity from its charger when the battery reaches 0%.", "none", ["basics", "battery"]],
  ["Which four keys on a keyboard have little arrows pointing Up, Down, Left, and Right?", ["Arrow Keys", "Number Keys", "Function Keys", "Space Keys"], "The Up, Down, Left, and Right arrow keys move the cursor or control characters in games.", "none", ["basics", "keyboard"]],
  ["What is the little wheel between the left and right buttons on a computer mouse used for?", ["Scrolling up and down a page", "Turning off the house lights", "Printing paper", "Making the computer heavier"], "Rolling the scroll wheel moves long web pages or documents up and down.", "none", ["basics", "mouse"]],
  ["What do we call the yellow icon on a computer screen that holds and organizes your files like a paper folder?", ["Folder", "Trash Can", "Battery", "Clock"], "Folders help you keep documents, pictures, and homework organized in one place.", "none", ["basics", "files"]],
  ["Which built-in computer tool helps you quickly add, subtract, multiply, and divide numbers?", ["Calculator App", "Paint App", "Media Player", "Recycle Bin"], "Every computer and phone includes a Calculator app for doing math.", "none", ["basics", "apps"]],
  ["What do you call pressing the left mouse button twice very fast to open a folder or program?", ["Double-click", "Triple-jump", "Side-scroll", "Power-off"], "Double-clicking the left mouse button opens files, folders, and applications.", "none", ["basics", "mouse"]],
  ["If you want to type a single capital letter or the `@` and `!` symbols, which key do you hold down while pressing the letter?", ["Shift Key", "Spacebar", "Escape Key", "Volume Key"], "Holding down Shift types uppercase letters or the top symbol shown on number keys.", "none", ["basics", "keyboard"]],
  ["What is the flat touch-sensitive rectangle below the keyboard on a laptop that works like a mouse?", ["Touchpad (or Trackpad)", "Screen Saver", "CD Tray", "Power Brick"], "You slide your finger across a laptop touchpad to move the pointer without needing a separate mouse.", "none", ["basics", "laptop"]],
  ["Which small symbol on a phone or laptop screen looks like curved radio waves and shows you are connected to wireless internet?", ["Wi-Fi Icon", "Trash Icon", "Folder Icon", "Scissors Icon"], "The fan-shaped Wi-Fi icon shows your wireless internet connection strength.", "none", ["basics", "wifi"]],
  ["What do you call the background picture shown behind your icons on the main computer screen?", ["Desktop Wallpaper", "Mouse Pad", "Keyboard Cover", "Screen Protector"], "The desktop wallpaper is the background image you can customize on your screen.", "none", ["basics", "desktop"]],
  ["Which key at the very top-left corner of the keyboard is labeled `Esc` and is often used to pause a game or close a pop-up?", ["Escape Key", "Spacebar", "Enter Key", "Caps Lock"], "The `Esc` key stands for Escape and cancels or pauses the current action.", "none", ["basics", "keyboard"]],
  ["What small pocket-sized stick can you plug into a computer port to carry your school files to another computer?", ["USB Flash Drive (Thumb Drive)", "Mouse Pad", "HDMI TV Screen", "Power Cord"], "A USB flash drive stores files in a tiny stick that plugs into a USB port.", "none", ["basics", "storage"]],
  ["Which simple computer program lets you draw pictures with a digital paintbrush, pencil, and color palette?", ["Paint / Drawing App", "Calculator", "Clock App", "Antivirus"], "Paint and drawing programs let you sketch and color pictures on screen.", "none", ["basics", "apps"]],
  ["What secret word or code do you type to unlock your computer or account so strangers cannot use it?", ["Password (or PIN)", "Username", "Wallpaper", "Screen Size"], "A password keeps your computer and personal accounts safe from unauthorized people.", "none", ["basics", "security"]],
  ["When you want to watch a video on the whole screen instead of a small box, which button do you click?", ["Full Screen button", "Mute button", "Delete button", "Print button"], "Clicking the Full Screen icon expands the video to fill your entire monitor.", "none", ["basics", "video"]],
  ["What button with a speaker and an `X` next to it stops all sound from playing in a video or game?", ["Mute Button", "Play Button", "Fast-Forward Button", "Download Button"], "Muting turns the sound volume off temporarily until you unmute it.", "none", ["basics", "audio"]],
  ["Which triangle-shaped button do you click to start watching a movie or listening to a song on a computer?", ["Play Button (\u25B6)", "Stop Square (\u25A0)", "Pause Bars (\u275A\u275A)", "Trash Can"], "The right-pointing triangle (\u25B6) is the universal Play symbol for videos and music.", "none", ["basics", "media"]],
  ["Which button with two vertical bars (\u275A\u275A) temporarily freezes a video or game so you can take a break?", ["Pause Button", "Delete Button", "Print Button", "Restart Button"], "The two vertical bars (\u275A\u275A) pause playback right where you are.", "none", ["basics", "media"]],
  ["What do we call a handheld controller used to play video games on a computer or console?", ["Gamepad (or Joystick)", "Scanner", "Hard Drive", "Router"], "A gamepad has buttons and thumbsticks designed for controlling video games.", "none", ["basics", "gaming"]],
  ["Why does a computer have a small fan spinning inside its case?", ["To keep the computer parts cool so they do not get too hot", "To help the computer fly", "To blow dust onto the screen", "To make music louder"], "Computer chips warm up when working hard, so cooling fans blow air to keep them cool.", "none", ["basics", "hardware"]],
  ["What flat mat do you put under a computer mouse so it glides smoothly across the desk?", ["Mouse Pad", "Keyboard Tray", "Screen Filter", "Printer Sheet"], "A mouse pad gives the mouse sensor a smooth, even surface to track movement.", "none", ["basics", "mouse"]],
  ["If a computer freezes or installs an update, what option turns it off and immediately turns it back on fresh?", ["Restart (or Reboot)", "Mute", "Print", "Minimize"], "Restarting closes all open programs and powers the system back up cleanly.", "none", ["basics", "os"]],
  ["What do you call the small smiley faces and cartoon pictures (like \u{1F600}, \u{1F680}, \u2764\uFE0F) you can send in computer messages?", ["Emojis", "Folders", "Cables", "Batteries"], "Emojis are tiny digital icons used to express feelings and ideas in messages.", "none", ["basics", "communication"]],
  ["Which machine with a glass top can copy a real paper drawing or photo and turn it into a picture on the computer screen?", ["Scanner", "Speaker", "Mouse", "Headphones"], "A scanner shines a light over paper to create a digital image file on the computer.", "none", ["basics", "scanner"]],
  ["What does the little battery symbol with a lightning bolt inside it mean on a phone or laptop?", ["The battery is currently charging", "The screen is broken", "The sound is muted", "The Wi-Fi is turned off"], "A lightning bolt over the battery icon shows that power is flowing in from the charger.", "none", ["basics", "battery"]],
  ["What do you call the blinking vertical line (`|`) that shows where the next letter will appear when you type?", ["Text Cursor (or Caret)", "Volume Slider", "Power Cord", "Scroll Bar"], "The blinking text cursor marks your current typing position in a document or search box.", "none", ["basics", "typing"]],
  ["On the top corner of a program window on Windows, what does clicking the `X` button do?", ["Closes the window", "Makes the computer louder", "Prints the page", "Changes the wallpaper"], "Clicking the `X` in the corner closes that application window.", "none", ["basics", "windows"]],
  ["What do we call the global network that lets computers all over the world visit websites and watch online videos?", ["The Internet", "The Calculator", "The Mouse Pad", "The Recycle Bin"], "The Internet connects millions of computers worldwide to share websites, videos, and messages.", "none", ["basics", "internet"]],
  ["Which button on a web page or video player looks like a circular arrow and reloads the page?", ["Refresh (or Reload) Button", "Trash Button", "Mute Button", "Power Button"], "Clicking Refresh reloads the current webpage to get the newest content.", "none", ["basics", "browser"]],
  ["What tool looking like a magnifying glass (`\u{1F50D}`) on a computer or website helps you find a file or topic?", ["Search Icon", "Zoom Out Icon", "Battery Icon", "Printer Icon"], "A magnifying glass icon represents Search, letting you type words to find what you need.", "none", ["basics", "search"]],
  ["What icon shaped like a gear or cogwheel (`\u2699\uFE0F`) opens the menu where you can change brightness, Wi-Fi, or sound?", ["Settings Icon", "Trash Icon", "Music Icon", "Paint Icon"], "The gear icon opens Settings on phones, tablets, and computers.", "none", ["basics", "settings"]],
  ["Which key on the keyboard do you use together with the number row to type symbols like `!`, `@`, `#`, and `$`?", ["Shift Key", "Caps Lock", "Spacebar", "Tab Key"], "Caps Lock only affects letters; you hold Shift + a number key to type the symbol printed above the number.", "none", ["basics", "keyboard"]],
  ["What do you call saving a file from the internet onto your own computer so you can open it later?", ["Downloading", "Printing", "Erasing", "Muting"], "Downloading copies a file, game, or picture from the internet onto your device.", "none", ["basics", "internet"]],
  ["What do you call a wireless mouse that connects to your laptop without any cord attached to it?", ["Wireless (or Bluetooth) Mouse", "Paper Mouse", "Printer Mouse", "Wired Monitor"], "A wireless mouse uses Bluetooth or a tiny USB receiver instead of a cable.", "none", ["basics", "peripherals"]],
  ["When you are done using a laptop for a short walk to another room, what happens when you gently close the lid?", ["It goes into Sleep mode to save battery", "It deletes all your games", "It prints 10 pages", "It turns the volume to maximum"], "Closing a laptop lid puts it into low-power Sleep mode so you can resume quickly when you open it.", "none", ["basics", "laptop"]],
  ["Which computer device has rows of letter keys from A to Z and numbers from 0 to 9?", ["Keyboard", "Monitor", "Mouse", "Speaker"], "A keyboard contains letter, number, and symbol keys used to type into a computer.", "none", ["basics", "keyboard"]]
];
var NORMAL_COMPUTERS = [
  ["Which program is a web browser used for visiting websites on the internet?", ["Google Chrome", "Microsoft Excel", "Adobe Photoshop", "Windows Calculator"], "Google Chrome (along with Safari, Firefox, and Edge) is a web browser used to view websites.", "none", ["everyday", "browser"]],
  ["What keyboard shortcut copies selected text, and what shortcut pastes it?", ["Ctrl + C to Copy, Ctrl + V to Paste (or Cmd + C / Cmd + V on Mac)", "Ctrl + X to Copy, Ctrl + Z to Paste", "Alt + F4 to Copy, Ctrl + P to Paste", "Shift + A to Copy, Shift + B to Paste"], "Ctrl+C copies the highlighted item and Ctrl+V pastes it at the new cursor location.", "none", ["everyday", "shortcuts"]],
  ["Which keyboard shortcut immediately undoes your last typing mistake in almost any computer program?", ["Ctrl + Z (or Cmd + Z on Mac)", "Ctrl + P", "Ctrl + S", "Ctrl + F"], "Pressing Ctrl+Z (Undo) reverses your most recent edit.", "none", ["everyday", "shortcuts"]],
  ['What is the main purpose of turning on "Airplane Mode" on a smartphone or laptop?', ["It turns off cellular, Wi-Fi, and Bluetooth wireless signals", "It makes the screen twice as bright", "It deletes all photos to save space", "It cools down the battery with a fan"], "Airplane Mode disables wireless radio transmitters so the device does not transmit signals during a flight.", "none", ["everyday", "mobile"]],
  ["Which file extension is commonly used for a portable document that looks the same on any computer or printer?", [".pdf", ".mp3", ".exe", ".wav"], "PDF (Portable Document Format) preserves fonts, layout, and images across all devices.", "none", ["everyday", "files"]],
  ["Which file extension is typically used for a digital photograph or image?", [".jpg (or .png)", ".mp3", ".docx", ".zip"], "JPEG (.jpg) and PNG (.png) are standard file formats for digital photos and images.", "none", ["everyday", "files"]],
  ["Which file extension is most commonly used for an audio song or music recording?", [".mp3", ".jpg", ".pdf", ".txt"], "MP3 is a popular compressed audio file format for music and podcasts.", "none", ["everyday", "files"]],
  ['What does "Cloud Storage" (such as Google Drive, iCloud, or Dropbox) actually mean?', ["Saving your files on secure internet servers so you can access them from any device", "Storing files inside weather clouds in the sky", "Saving files only on a floppy disk", "Printing every file onto paper automatically"], "Cloud storage keeps your files backed up on remote data center servers accessible over the internet.", "none", ["everyday", "cloud"]],
  ["What is the box in your home provided by your internet company that shares Wi-Fi with your phones and laptops?", ["Wi-Fi Router", "Graphics Card", "Sound Bar", "Scanner"], "A home Wi-Fi router connects to your internet line and broadcasts wireless internet throughout your house.", "none", ["everyday", "networking"]],
  ["Which cable is standard for connecting a laptop, gaming console, or streaming box to a modern TV for both HD video and sound?", ["HDMI Cable", "Phone Line Cable", "Power Extension Cord", "Ethernet-only Cable"], "An HDMI cable carries both high-definition digital video and audio in a single cord.", "none", ["everyday", "cables"]],
  ["Which oval, reversible charging and data port is found on almost all modern Android phones, iPads, and newer laptops?", ["USB-C (USB Type-C)", "VGA Port", "CD-ROM Slot", "Floppy Port"], "USB-C is a compact, reversible connector that plugs in either way up and supports fast charging and data.", "none", ["everyday", "usb"]],
  ["What does pressing `Ctrl + F` (or `Cmd + F` on a Mac) do inside a web browser or long document?", ["Opens a Find box to search for a specific word on the page", "Formats the hard drive", "Closes the web browser", "Prints 10 copies of the document"], "Ctrl+F stands for Find and highlights every place a word appears on the current page.", "none", ["everyday", "shortcuts"]],
  ['What is "Two-Factor Authentication" (2FA) when logging into an email or bank account?', ["Entering a second verification code sent to your phone in addition to your password", "Typing your password twice in the same box", "Using two keyboards at the same time", "Sharing your account with two friends"], "2FA adds an extra security step\u2014like a text code or authenticator app\u2014so a stolen password alone cannot unlock your account.", "none", ["everyday", "security"]],
  ['In an email account, what is the "Spam" or "Junk" folder used for?', ["Holding unwanted advertising or suspicious scam emails automatically filtered out of your Inbox", "Saving your favorite family photos", "Storing drafts of emails you are still writing", "Keeping a list of your phone contacts"], "Email providers automatically route unsolicited bulk mail and phishing attempts into the Spam folder.", "none", ["everyday", "email"]],
  ["When sending an email to several people, what is the difference between putting addresses in `CC` versus `BCC`?", ["Recipients in `BCC` (Blind Carbon Copy) are hidden from other recipients, while `CC` addresses are visible to everyone", "`BCC` sends the email next week, while `CC` sends it today", "`BCC` deletes the email after reading", "`CC` only works for attachments"], "BCC stands for Blind Carbon Copy and hides those email addresses from everyone else on the message.", "none", ["everyday", "email"]],
  ['What is "Phishing" in internet safety?', ["Fake emails or websites pretending to be a trusted company to trick you into revealing passwords or card numbers", "Playing a fishing video game online", "Searching for Wi-Fi signals in a park", "Updating your computer operating system"], "Phishing scams impersonate banks, schools, or services to steal login credentials.", "none", ["everyday", "security"]],
  ["What does a `.zip` file do on a computer?", ["Bundles multiple files and folders together into a single smaller compressed file for easy sharing", "Makes music files play twice as fast", "Deletes old programs automatically", "Turns text files into videos"], "Zipping compresses one or more files into a single archive so you can email or download them easily.", "none", ["everyday", "files"]],
  ['What does opening an "Incognito" or "Private Browsing" window in your web browser do?', ["Prevents the browser from saving your browsing history and cookies on that computer after you close the window", "Makes you completely invisible to your internet provider and the websites you log into", "Makes your internet download speed 10 times faster", "Turns off your webcam light"], "Private browsing simply avoids saving local history, searches, and cookies on your device once closed.", "none", ["everyday", "browser"]],
  ['What is a "Screenshot" on a phone or computer?', ["A saved picture of whatever is currently displayed on your screen", "A crack in the monitor glass", "A photo taken with the flash turned on", "A printed page from a website"], "Taking a screenshot captures an image of your current screen display.", "none", ["everyday", "basics"]],
  ['What is the difference between "Downloading" and "Uploading" on the internet?', ["Downloading receives data from the internet onto your device; Uploading sends data from your device to the internet", "Downloading is only for phones; Uploading is only for laptops", "Downloading deletes files; Uploading prints them", "They mean the exact same thing"], "When you post a photo or submit homework online you upload it; when you save a file from a website you download it.", "none", ["everyday", "internet"]],
  ["Which wireless technology is commonly used to connect wireless earbuds, smartwatches, and car audio to your phone over a short distance?", ["Bluetooth", "Satellite Dish", "AM Radio", "Fiber Optic Cable"], "Bluetooth pairs nearby personal devices like headphones, speakers, and keyboards wirelessly.", "none", ["everyday", "wireless"]],
  ['What is a "QR Code" (the square black-and-white patterned box seen on restaurant menus and tickets)?', ["A barcode you scan with your phone camera to quickly open a website link or payment page", "A vent that cools down paper menus", "A map of a computer chip", "A password for your home door"], "Scanning a QR (Quick Response) code with a smartphone camera opens its embedded URL or info instantly.", "none", ["everyday", "mobile"]],
  ["When buying a phone or laptop, what is the storage measured in `GB` (Gigabytes, like `128 GB` or `512 GB`) used for?", ["Holding your installed apps, photos, videos, and saved files", "Measuring how wide the screen is in inches", "Measuring how loud the speakers are", "Showing how many hours the battery lasts"], "Gigabytes (GB) measure digital storage capacity for apps, photos, movies, and documents.", "none", ["everyday", "storage"]],
  ["How many Gigabytes (`GB`) are in roughly 1 Terabyte (`1 TB`) of hard drive storage?", ["About 1,000 GB (1,024 GB)", "10 GB", "100 GB", "1,000,000 GB"], "One Terabyte (TB) equals roughly 1,000 Gigabytes (or 1,024 GiB in binary), enough for ratusan of movies.", "none", ["everyday", "storage"]],
  ["What does the padlock icon (`\u{1F512}`) next to a website address (`https://`) in your browser address bar mean?", ["The connection between your browser and the website is encrypted so others on the network cannot snoop on what you type", "The website is locked and you cannot click anything", "Your computer keyboard is locked", "The website costs money to view"], "The padlock indicates HTTPS encryption, protecting passwords and messages in transit.", "none", ["everyday", "security"]],
  ['What is a browser "Bookmark" (or "Favorite")?', ["A saved shortcut to a website so you can return to it with one click without typing the address again", "A piece of paper placed inside a laptop lid", "A pop-up advertisement", "A virus scanner"], "Bookmarking saves a webpage link in your browser for quick access later.", "none", ["everyday", "browser"]],
  ['What are "Browser Tabs" at the top of Chrome, Edge, or Safari?', ["Separate pages open side-by-side inside a single browser window so you can switch between websites easily", "Buttons that change the monitor brightness", "Stickers on the outside of a laptop", "Folders inside the Recycle Bin"], "Tabs let you keep multiple websites open in one window and click between them.", "none", ["everyday", "browser"]],
  ["Which keyboard shortcut saves the document or project you are working on right now?", ["Ctrl + S (or Cmd + S on Mac)", "Ctrl + P", "Ctrl + W", "Ctrl + Q"], "Pressing Ctrl+S saves your current file.", "none", ["everyday", "shortcuts"]],
  ["Which keyboard shortcut opens the Print window to print a document or webpage?", ["Ctrl + P (or Cmd + P on Mac)", "Ctrl + Z", "Ctrl + C", "Ctrl + V"], "Ctrl+P opens the Print dialog in browsers and word processors.", "none", ["everyday", "shortcuts"]],
  ['What is a "Mobile Hotspot" on a smartphone?', ["Sharing your phone's cellular mobile data connection as a Wi-Fi network so your laptop or tablet can get online", "A phone that has overheated in the sun", "A popular coffee shop", "An app for checking the weather"], "Turning on Personal/Mobile Hotspot lets your laptop connect to the internet through your phone's mobile data.", "none", ["everyday", "mobile"]],
  ['What is an "Operating System" (such as Windows, macOS, Android, or iOS)?', ["The main system software that runs the computer or phone and lets all your apps work with the hardware", "A protective plastic case for a phone", "A type of internet cable", "A website for watching movies"], "Windows, macOS, Linux, Android, and iOS are operating systems that manage the device.", "none", ["everyday", "os"]],
  ['What is a "Spreadsheet" program (such as Microsoft Excel or Google Sheets) mainly used for?', ["Organizing numbers, budgets, tables, and formulas in rows and columns", "Editing Hollywood movies", "Recording voice memos", "Cleaning dust out of a keyboard"], "Spreadsheets arrange data in rows and columns and calculate totals and charts automatically.", "none", ["everyday", "apps"]],
  ['What does "Dark Mode" do on a phone or computer?', ["Switches menus and backgrounds to dark colors, which is easier on your eyes in low light", "Turns off the computer completely", "Disables the internet connection at night", "Makes photos print in black and white"], "Dark Mode replaces bright white backgrounds with dark gray or black surfaces.", "none", ["everyday", "ui"]],
  ['What is a "Website Cookie"?', ["A small piece of data a website saves in your browser to remember your login session, shopping cart, or preferences", "A virus that breaks your keyboard", "A reward badge for typing fast", "A file that speeds up your cooling fan"], "Cookies help websites remember that you are logged in or what items are in your cart.", "none", ["everyday", "web"]],
  ['Why is it important to install regular "Software Updates" on your phone and computer?', ["They fix security holes, repair bugs, and keep your device protected", "They make the physical screen larger", "They recharge the battery without a cord", "They add more keys to the keyboard"], "Updates patch security vulnerabilities and fix software crashes.", "none", ["everyday", "security"]],
  ["What does `URL` (such as `https://www.wikipedia.org`) stand for in everyday use?", ["The web address of a page on the internet", "The serial number printed on the bottom of a mouse", "The speed of your Wi-Fi router", "The name of your home Wi-Fi password"], "A URL (Uniform Resource Locator) is the address you type or click to visit a specific webpage.", "none", ["everyday", "web"]],
  ["If a single program on your Windows computer freezes and stops responding, which built-in tool lets you force that program to close?", ["Task Manager", "Calculator", "Notepad", "Paint"], 'Opening Task Manager lets you select a frozen application and click "End Task".', "none", ["everyday", "os"]],
  ["What is the difference between a Laptop and a Desktop computer?", ["A laptop is an all-in-one portable computer with a built-in battery, while a desktop stays on a desk with a separate monitor and power plug", "A laptop cannot connect to Wi-Fi", "A desktop computer can only run a calculator", "A laptop has no screen"], "Desktops use separate stationary components plugged into a wall outlet, while laptops are built for portability.", "none", ["everyday", "hardware"]],
  ['What is a "Pop-up Blocker" in a web browser?', ["A feature that stops unwanted advertising windows from automatically opening over the page you are reading", "A cover that slides over your webcam", "A case that protects a phone when dropped", "A button that mutes your microphone"], "Pop-up blockers prevent annoying or scam windows from springing open when you visit websites.", "none", ["everyday", "browser"]],
  ['What does "Streaming" a movie or song (like on YouTube, Netflix, or Spotify) mean?', ["Playing the video or music live over the internet as it arrives, without having to download the whole file first", "Copying a movie onto a DVD disc", "Watching a movie in the rain", "Connecting two monitors with a cable"], "Streaming plays media continuously in real time over your internet connection.", "none", ["everyday", "media"]],
  ["Which file extension is used for a Microsoft Word document?", [".docx", ".mp4", ".png", ".mp3"], "Modern Microsoft Word documents use the `.docx` file extension.", "none", ["everyday", "files"]],
  ["Which file extension is commonly used for a video clip or movie file?", [".mp4", ".jpg", ".pdf", ".txt"], "MP4 (`.mp4`) is the most widely supported file format for digital video.", "none", ["everyday", "files"]],
  ['What does "Backing Up" your computer or phone mean?', ["Making an extra copy of your important photos and files on an external drive or cloud storage in case your device is lost or broken", "Moving your desk closer to the wall", "Typing words backward", "Rewinding a YouTube video"], "Backups ensure you never lose family photos or schoolwork if a device breaks or is stolen.", "none", ["everyday", "security"]],
  ['What is an "Attachment" in an email?', ["A file\u2014such as a PDF, photo, or homework document\u2014sent along with an email message", "The signature at the bottom of an email", "The subject line of an email", "The person receiving the email"], "Clicking the paperclip icon lets you attach files to send with your email.", "none", ["everyday", "email"]],
  ['What icon is almost universally used in email and messaging apps for "Attach a file"?', ["A Paperclip icon (\u{1F4CE})", "A Trash Can icon (\u{1F5D1}\uFE0F)", "A Magnifying Glass (\u{1F50D})", "A Speaker icon (\u{1F50A})"], "Just like clipping papers together in an office, the paperclip icon adds a file attachment.", "none", ["everyday", "ui"]],
  ["What makes a password strong and hard for hackers to guess?", ["Using a long mix of uppercase and lowercase letters, numbers, and symbols that is unique to that account", 'Using "123456" or "password" so it is easy to remember', "Using your first name and birth year", "Using the same short word on every website"], "Long, unique passphrases with mixed character types resist guessing and automated cracking.", "none", ["everyday", "security"]],
  ["What does `Mbps` (Megabits per second) measure when you run an internet speed test at home?", ["How fast data can travel over your internet connection", "How many files are stored in your Recycle Bin", "How hot your laptop battery is", "How many keys are on your keyboard"], "Internet speed is measured in Megabits per second (Mbps) or Gigabits per second (Gbps).", "none", ["everyday", "internet"]],
  ['What is "Autocomplete" or "Predictive Text" on a smartphone keyboard?', ["Suggested words that appear above the keyboard as you type to help you finish words faster", "A feature that deletes your messages after 5 seconds", "A tool that translates music into pictures", "A setting that dims the screen"], "Predictive text suggests likely words and fixes minor spelling slips while you type.", "none", ["everyday", "mobile"]],
  ['What does "Syncing" (Synchronizing) between your phone and laptop do?', ["Keeps your bookmarks, calendars, photos, or notes automatically updated and matching across both devices", "Turns both devices off at the same time", "Makes both screens show the exact same battery percentage", "Connects their speakers together"], "Syncing ensures that adding a note or calendar event on your phone updates it on your laptop too.", "none", ["everyday", "cloud"]],
  ["If your home Wi-Fi stops working, what is a common first step that often fixes a frozen home router?", ["Unplugging the router power cord, waiting about 30 seconds, and plugging it back in to restart it", "Deleting all apps on your phone", "Buying a new monitor", "Changing your desktop wallpaper"], "Power-cycling (restarting) a home router clears its memory and re-establishes the connection with your ISP.", "none", ["everyday", "troubleshooting"]]
];
var HARD_COMPUTERS = [
  ["What does CPU stand for in computer architecture?", ["Central Processing Unit", "Core Parallel Unit", "Control Program Utility", "Central Peripheral Unit"], "The Central Processing Unit (CPU) executes instructions from computer programs by performing arithmetic, logic, control, and I/O operations.", "cpu_pipeline", ["hardware", "cpu"]],
  ["Which memory type is volatile and loses its stored data when system power is turned off?", ["DRAM (Dynamic Random-Access Memory)", "NAND Flash SSD", "ROM (Read-Only Memory)", "EEPROM"], "DRAM stores each bit in a storage cell consisting of a capacitor and a transistor, requiring periodic power refresh to retain data.", "cache_hierarchy", ["memory", "ram"]],
  ["How many bits make up one standard byte in modern digital computing?", ["8 bits", "4 bits", "16 bits", "10 bits"], "A byte consists of 8 binary digits (bits), capable of representing 256 distinct values (0 to 255 in unsigned form).", "none", ["binary", "fundamentals"]],
  ["Which motherboard component holds the system firmware (BIOS/UEFI) settings powered by a CR2032 coin battery?", ["CMOS SRAM / Non-volatile Flash", "Northbridge Heatsink", "PCIe x16 Slot", "SATA Controller"], "Complementary Metal-Oxide-Semiconductor (CMOS) settings and the real-time clock (RTC) are backed by a CR2032 lithium coin cell.", "motherboard_bus", ["motherboard", "bios"]],
  ["Which network port number is used by default for encrypted HTTPS web traffic?", ["Port 443", "Port 80", "Port 22", "Port 21"], "HTTPS (Hypertext Transfer Protocol Secure) uses TCP/UDP port 443 by default, whereas unencrypted HTTP uses port 80.", "network_osi", ["networking", "ports"]],
  ["What is the primary purpose of thermal paste applied between a CPU Integrated Heat Spreader (IHS) and a cooler coldplate?", ["To fill microscopic air gaps and improve thermal conductivity", "To glue the heatsink permanently to the processor socket", "To electrically insulate the CPU pins from static discharge", "To lower the voltage required by the voltage regulator module"], "Air is a poor thermal conductor; thermal interface material (TIM) displaces microscopic air pockets between metal surfaces.", "cpu_pipeline", ["cooling", "hardware"]],
  ["Which storage interface connects directly to PCIe lanes on the motherboard using the M.2 form factor for high-speed SSDs?", ["NVMe (Non-Volatile Memory Express)", "SATA II", "IDE / PATA", "eSATA"], "NVMe communicates directly over PCI Express lanes, eliminating SATA protocol bottlenecks and delivering multi-gigabyte sequential speeds.", "storage_nvme", ["storage", "nvme"]],
  ["What does GPU stand for?", ["Graphics Processing Unit", "General Processing Utility", "Geometric Pixel Unit", "Grid Parallel Unit"], "A Graphics Processing Unit (GPU) is a specialized processor with thousands of parallel cores designed for 3D rendering and matrix math.", "none", ["gpu", "hardware"]],
  ["Which command-line tool is commonly used to test basic IPv4 or IPv6 reachability using ICMP Echo Request packets?", ["ping", "chmod", "grep", "mkdir"], "The ping utility sends ICMP Echo Request packets to a target host and listens for Echo Reply packets to measure round-trip time.", "network_osi", ["networking", "icmp"]],
  ["Which hexadecimal value corresponds to the 8-bit binary number 11111111?", ["0xFF", "0xF0", "0x7F", "0xAA"], "Each group of four binary 1s (1111) equals 15 in decimal, or F in hexadecimal, making 11111111 equal to 0xFF (255 decimal).", "none", ["binary", "hexadecimal"]],
  ["What is the fastest memory tier located directly inside the CPU core for immediate instruction operands?", ["Processor Registers", "L3 Shared Cache", "DDR5 System RAM", "NVMe Pagefile"], "CPU registers sit at the top of the memory hierarchy and operate at full processor clock speed with zero wait states.", "cache_hierarchy", ["cpu", "memory"]],
  ["Which display connector natively supports both high-refresh-rate digital video and multi-stream Daisy Chaining (MST)?", ["DisplayPort", "VGA (DE-15)", "Composite RCA", "S-Video"], "DisplayPort supports Multi-Stream Transport (MST), variable refresh rate (Adaptive-Sync), and high bandwidth packetized data transmission.", "none", ["display", "io"]],
  ["What does DNS stand for in computer networking?", ["Domain Name System", "Dynamic Network Socket", "Distributed Node Server", "Data Naming Standard"], "DNS translates human-readable domain names (like example.com) into numerical IP addresses required for routing packets.", "network_osi", ["networking", "dns"]],
  ["Which power supply unit (PSU) certification system rates AC-to-DC electrical efficiency at 20%, 50%, and 100% load?", ["80 PLUS (Bronze, Silver, Gold, Platinum, Titanium)", "PCI-SIG Revision", "JEDEC Timing Standard", "IEEE 802.3af"], "The 80 PLUS certification verifies that a computer PSU achieves at least 80% power conversion efficiency across defined load points.", "none", ["psu", "hardware"]],
  ["Which file system is the default native file system for modern Microsoft Windows boot volumes?", ["NTFS (New Technology File System)", "FAT16", "ext4", "APFS"], "NTFS supports file-level security ACLs, journaling, shadow copies, encryption (EFS), and large volume sizes on Windows.", "storage_nvme", ["filesystems", "os"]],
  ["Which networking device operates primarily at Layer 2 (Data Link Layer) using MAC address tables to forward frames?", ["Network Switch", "Passive Coaxial Hub", "Analog Repeater", "Fiber Optic Coupler"], "A Layer 2 switch learns source MAC addresses on ingress ports and forwards Ethernet frames only to the appropriate destination port.", "network_osi", ["networking", "osi"]],
  ["What does SSD stand for in computer storage?", ["Solid State Drive", "Serial Storage Disk", "Silicon Sector Drive", "Static Synchronous Disk"], "A Solid State Drive (SSD) uses non-volatile NAND flash memory chips rather than spinning magnetic platters.", "storage_nvme", ["storage", "ssd"]],
  ["Which keyboard shortcut combination invokes the Task Manager directly in Windows without opening the security screen first?", ["Ctrl + Shift + Esc", "Alt + F4", "Win + L", "Ctrl + Alt + PrtScn"], "Pressing Ctrl + Shift + Esc launches Windows Task Manager directly.", "none", ["os", "windows"]],
  ["Which standard wireless networking technology is governed by the IEEE 802.11 family of specifications?", ["Wi-Fi", "Bluetooth Classic", "NFC", "Zigbee"], "IEEE 802.11 defines the MAC and physical layer protocols for Wireless Local Area Networks (Wi-Fi).", "network_osi", ["networking", "wifi"]],
  ["What is the base-10 (decimal) value of the binary number 00001010?", ["10", "6", "12", "8"], "In binary, 00001010 = (1 \xD7 8) + (0 \xD7 4) + (1 \xD7 2) + (0 \xD7 1) = 10.", "none", ["binary", "math"]],
  ["Which component on a motherboard regulates and steps down 12V PSU power to the exact ~1.1V\u20131.4V required by the CPU?", ["VRM (Voltage Regulator Module)", "Southbridge Chipset", "Audio Codec Chip", "TPM 2.0 Header"], "The VRM uses multi-phase buck converters (MOSFETs, chokes, and capacitors) to deliver clean low-voltage current to the CPU.", "motherboard_bus", ["motherboard", "power"]],
  ["Which network protocol automatically assigns an IP address, subnet mask, and default gateway to a client joining a network?", ["DHCP (Dynamic Host Configuration Protocol)", "ARP (Address Resolution Protocol)", "FTP (File Transfer Protocol)", "SMTP (Simple Mail Transfer Protocol)"], "DHCP uses a four-step DORA process (Discover, Offer, Request, Acknowledge) to lease IP configurations dynamically.", "network_osi", ["networking", "dhcp"]],
  ["Which RAID level stripes data across two or more drives for maximum speed but offers zero fault tolerance if any drive fails?", ["RAID 0", "RAID 1", "RAID 5", "RAID 6"], "RAID 0 splits data into blocks across disks without parity or mirroring; losing a single drive destroys the entire array.", "storage_nvme", ["storage", "raid"]],
  ["What does MAC stand for in the context of a network interface hardware address?", ["Media Access Control", "Memory Allocation Counter", "Master Address Channel", "Multiplexed Access Code"], "A Media Access Control (MAC) address is a unique 48-bit hardware identifier assigned to a network interface controller.", "network_osi", ["networking", "mac"]],
  ["Which logic gate outputs TRUE (1) if and only if all of its inputs are TRUE (1)?", ["AND gate", "OR gate", "XOR gate", "NAND gate"], "An AND gate performs logical conjunction, producing a high output only when every input is high.", "cpu_pipeline", ["logic", "architecture"]],
  ["What is the standard loop-back IPv4 address used by a host to send network traffic to itself?", ["127.0.0.1", "192.168.1.1", "255.255.255.0", "10.0.0.1"], "The 127.0.0.0/8 block (most commonly 127.0.0.1) is reserved for loopback testing of the local TCP/IP stack.", "network_osi", ["networking", "ipv4"]],
  ["Which CPU sub-unit is responsible for performing integer addition, subtraction, and bitwise logical operations?", ["ALU (Arithmetic Logic Unit)", "MMU (Memory Management Unit)", "Branch Target Buffer", "DMA Controller"], "The Arithmetic Logic Unit (ALU) executes arithmetic and bitwise logic operations on integer operands.", "cpu_pipeline", ["cpu", "alu"]],
  ["What does USB stand for?", ["Universal Serial Bus", "Unified System Bridge", "Ultra Synchronous Bus", "Universal Storage Buffer"], "Universal Serial Bus (USB) standardized peripheral connections and power delivery across computers.", "motherboard_bus", ["io", "usb"]],
  ["Which RAID level mirrors identical data across two drives so the system survives a single drive failure?", ["RAID 1", "RAID 0", "RAID 2", "JBOD"], "RAID 1 writes identical copies of data to two or more drives, providing full redundancy at 50% capacity utilization for a 2-drive mirror.", "storage_nvme", ["storage", "raid"]],
  ["Which Linux command lists the contents of a directory?", ["ls", "cd", "pwd", "rm"], "The ls command lists files and directories in Unix and Linux operating systems.", "none", ["linux", "cli"]],
  ["What is the name of the process by which a CPU fetches the next instruction while executing the current one?", ["Instruction Pipelining", "Undervolting", "Defragmentation", "Swap Paging"], "Instruction pipelining divides execution into stages (Fetch, Decode, Execute, Memory, Writeback) so multiple instructions overlap in flight.", "cpu_pipeline", ["cpu", "pipeline"]],
  ["Which memory technology allows a computer to compensate for full physical RAM by temporarily moving inactive pages to disk?", ["Virtual Memory / Paging", "L1 Instruction Cache", "ECC Scrubbing", "Register Renaming"], "Virtual memory maps virtual addresses to physical pages and uses disk-backed swap/pagefiles when physical RAM is pressured.", "cache_hierarchy", ["memory", "os"]],
  ["How many bits are in a standard IPv4 address?", ["32 bits", "64 bits", "128 bits", "48 bits"], "An IPv4 address is 32 bits long, typically written in dotted-decimal notation as four 8-bit octets (e.g., 192.0.2.1).", "network_osi", ["networking", "ipv4"]],
  ["How many bits are in a standard IPv6 address?", ["128 bits", "64 bits", "32 bits", "256 bits"], "IPv6 expands the address space to 128 bits, written as eight groups of four hexadecimal digits.", "network_osi", ["networking", "ipv6"]],
  ["Which type of optical fiber supports a single light propagation path for long-distance telecommunications with minimal dispersion?", ["Single-Mode Fiber (SMF)", "Multi-Mode Plastic Fiber", "Cat6A Shielded Twisted Pair", "RG-6 Coaxial Cable"], "Single-Mode Fiber uses a narrow ~9-micron core and laser light sources to transmit signals tens of kilometers without modal dispersion.", "network_osi", ["networking", "fiber"]],
  ["What does ECC stand for in enterprise server RAM?", ["Error-Correcting Code", "Enhanced Clock Control", "Extended Cache Channel", "Electronic Charge Capacitor"], "ECC memory detects and corrects single-bit memory errors on the fly using extra parity bits (typically 72-bit bus width per 64-bit word).", "cache_hierarchy", ["memory", "ecc"]],
  ["Which expansion slot standard replaced AGP and PCI for connecting modern discrete graphics cards to the motherboard?", ["PCI Express (PCIe)", "ISA Bus", "VESA Local Bus", "Mini-DIN"], "PCI Express uses high-speed serial point-to-point lanes (x1, x4, x8, x16) rather than a shared parallel bus.", "motherboard_bus", ["motherboard", "pcie"]],
  ["Which TCP/IP transport protocol is connectionless and prioritizes low latency over guaranteed delivery for gaming and VoIP?", ["UDP (User Datagram Protocol)", "TCP (Transmission Control Protocol)", "BGP (Border Gateway Protocol)", "IMAP"], "UDP sends datagrams without a three-way handshake or retransmission delays, making it ideal for real-time audio/video and multiplayer games.", "network_osi", ["networking", "udp"]],
  ["Which unit measures the clock frequency of a modern microprocessor?", ["Gigahertz (GHz)", "Gigabytes (GB)", "Watts (W)", "Nanometers (nm)"], "One Gigahertz (GHz) equals one billion clock cycles per second.", "cpu_pipeline", ["cpu", "clock"]],
  ["What is the primary function of an Operating System kernel?", ["Managing hardware resources, process scheduling, and memory protection", "Rendering HTML web pages inside a browser tab", "Compiling high-level Python scripts into SQL tables", "Mechanically cooling the power supply fan bearings"], "The kernel is the core privileged component of an OS that mediates access between user-space processes and hardware.", "none", ["os", "kernel"]],
  ["Which standard port number is used by SSH (Secure Shell) for encrypted remote terminal administration?", ["Port 22", "Port 23", "Port 25", "Port 3389"], "SSH uses TCP port 22 by default, replacing unencrypted Telnet (port 23).", "network_osi", ["networking", "ssh"]],
  ["In dual-channel motherboard RAM configurations, why should two memory sticks typically be installed in slots A2 and B2?", ["To populate both memory channels simultaneously and prevent signal reflection at trace ends", "To disable half of the RAM capacity for power saving", "To force both sticks onto a single 32-bit serial bus", "To bypass the CPU integrated memory controller"], "Populating one DIMM per channel enables 128-bit aggregate bus bandwidth, and daisy-chain topologies terminate cleanly at the second slot (A2/B2).", "motherboard_bus", ["memory", "motherboard"]],
  ["What does BIOS stand for?", ["Basic Input/Output System", "Binary Internal Operating System", "Bus Interface Output Standard", "Boot Initialization Overlay Service"], "BIOS initializes and tests system hardware during startup (POST) before handing control to the operating system bootloader.", "motherboard_bus", ["firmware", "bios"]],
  ["Which logic gate outputs TRUE (1) when its two inputs are different from each other?", ["XOR (Exclusive OR) gate", "AND gate", "XNOR gate", "BUFFER gate"], "An XOR gate outputs 1 when exactly one input is 1 and the other is 0.", "cpu_pipeline", ["logic", "gates"]],
  ["What does TDP stand for on a CPU or GPU specification sheet?", ["Thermal Design Power", "Total Data Processing", "Transistor Density Profile", "Turbo Dynamic Peak"], "Thermal Design Power (TDP), measured in Watts, indicates the thermal heat load a cooling solution must dissipate under sustained nominal workloads.", "cpu_pipeline", ["hardware", "cooling"]],
  ["Which protocol resolves a known IPv4 address into its corresponding Layer 2 MAC hardware address on a local subnet?", ["ARP (Address Resolution Protocol)", "DNS", "NTP", "SNMP"], "ARP broadcasts a request asking which node owns a target IPv4 address and caches the returned MAC address.", "network_osi", ["networking", "arp"]],
  ["What is the maximum number of usable host IP addresses in a standard /24 IPv4 subnet (subnet mask 255.255.255.0)?", ["254 usable hosts", "256 usable hosts", "512 usable hosts", "126 usable hosts"], "A /24 subnet has 2^8 = 256 total addresses; subtracting the network address (.0) and broadcast address (.255) leaves 254 usable host addresses.", "network_osi", ["networking", "subnetting"]],
  ["Which hardware security module on modern motherboards stores cryptographic keys for disk encryption like BitLocker?", ["TPM (Trusted Platform Module)", "SPD EEPROM", "Audio DAC", "Super I/O Chip"], "A Trusted Platform Module (TPM 2.0) generates and seals cryptographic keys in tamper-resistant hardware.", "motherboard_bus", ["security", "hardware"]],
  ["Which storage metric measures the number of discrete read or write operations a drive can handle per second?", ["IOPS (Input/Output Operations Per Second)", "RPM (Revolutions Per Minute)", "TFLOPS", "MTBF"], "IOPS measures random storage transaction throughput, where NVMe SSDs achieve hundreds of thousands to millions of IOPS.", "storage_nvme", ["storage", "performance"]],
  ["What does POST stand for during the initial stage of computer boot-up?", ["Power-On Self-Test", "Primary Operating System Transfer", "Peripheral Output Bus Sync", "Processor Overclock Stability Test"], "POST is a diagnostic testing sequence run by system firmware immediately after power is applied to verify CPU, RAM, and video initialization.", "motherboard_bus", ["firmware", "boot"]]
];
var VERY_HARD_COMPUTERS = [
  ["In multi-core cache coherency using the MESI protocol, what do the four cache line states M, E, S, and I stand for?", ["Modified, Exclusive, Shared, Invalid", "Mapped, Executed, Stored, Indexed", "Master, External, Mirrored, Isolated", "Mutable, Evicted, Synchronized, Idle"], "MESI maintains cache coherence across cores: Modified (dirty, only copy), Exclusive (clean, only copy), Shared (clean, may exist in other caches), and Invalid.", "cache_hierarchy", ["cache", "mesi"]],
  ["What additional 5th state does the MOESI cache coherency protocol add to MESI, and what performance advantage does it provide?", ["Owned (O) state \u2014 allows sharing dirty cache lines directly between CPU cores without immediately writing back to main RAM", "Overclocked (O) state \u2014 boosts L3 clock frequency by 20%", "Offline (O) state \u2014 powers down unused DRAM banks", "Ordered (O) state \u2014 disables out-of-order execution"], "The Owned state designates one core as responsible for eventual writeback of modified data while letting other cores read that line in the Shared state via cache-to-cache transfer.", "cache_hierarchy", ["cache", "moesi"]],
  ["In an out-of-order superscalar processor, which hardware structure tracks in-flight instructions in program order so exceptions and speculative branch mispredictions can be retired precisely?", ["Reorder Buffer (ROB)", "Translation Lookaside Buffer (TLB)", "Phase-Locked Loop (PLL)", "Direct Memory Access (DMA) Ring"], "The Reorder Buffer (ROB) allows instructions to execute out-of-order in Reservation Stations while committing architectural state strictly in program order.", "cpu_pipeline", ["out-of-order", "rob"]],
  ["Why does Tomasulo's algorithm perform Register Renaming using physical registers or reservation station tags?", ["To eliminate false name dependencies: Write-After-Read (WAR) and Write-After-Write (WAW) hazards", "To compress 64-bit instructions into 8-bit opcodes", "To encrypt register values against cold-boot attacks", "To bypass the L1 instruction decoder"], "WAR and WAW hazards arise only from reusing the same architectural register name; mapping them to larger pools of physical registers removes those stalls.", "cpu_pipeline", ["tomasulo", "registers"]],
  ["What is the calculated effective memory access time (EMAT) if L1 cache hit time is 1 ns with a 95% hit rate, and the miss penalty to lower memory is 20 ns?", ["2.0 ns", "1.05 ns", "5.0 ns", "10.5 ns"], "EMAT = Hit Time + (Miss Rate \xD7 Miss Penalty) = 1 ns + (0.05 \xD7 20 ns) = 1 + 1 = 2.0 ns.", "cache_hierarchy", ["cache", "math"]],
  ["In BGP (Border Gateway Protocol, RFC 4271), which well-known mandatory path attribute lists the sequence of Autonomous Systems a route announcement has traversed to prevent routing loops?", ["AS_PATH", "MED (Multi-Exit Discriminator)", "LOCAL_PREF", "COMMUNITY"], "Every BGP speaker prepends its Autonomous System Number (ASN) to AS_PATH when advertising to an eBGP peer; if a router sees its own ASN in AS_PATH, it drops the update.", "network_osi", ["bgp", "routing"]],
  ["Which side-channel vulnerability (CVE-2017-5753 / CVE-2017-5715) exploits speculative execution past conditional branches to leak data timing through CPU data cache lines?", ["Spectre", "Heartbleed", "Log4Shell", "Stuxnet"], "Spectre tricks the branch predictor into speculatively accessing memory and loading a data-dependent cache line, which an attacker then probes via FLUSH+RELOAD timing.", "cpu_pipeline", ["security", "spectre"]],
  ["In an 8-way set-associative CPU cache of total capacity 64 KB with 64-byte cache lines and 32-bit physical addresses, how many sets exist and how many bits are used for the Index and Byte Offset?", ["128 sets; 7 index bits and 6 byte-offset bits (leaving 19 tag bits)", "256 sets; 8 index bits and 8 byte-offset bits", "64 sets; 6 index bits and 4 byte-offset bits", "512 sets; 9 index bits and 6 byte-offset bits"], "Total lines = 65,536 / 64 = 1,024 lines. With 8 ways per set, Sets = 1,024 / 8 = 128 = 2^7 (7 index bits). Line size 64B = 2^6 (6 offset bits). Tag = 32 - 7 - 6 = 19 bits.", "cache_hierarchy", ["cache", "addressing"]],
  ["In NVMe architecture over PCIe, how many Submission and Completion Queues can the protocol theoretically support, compared to AHCI's single command queue of 32 commands?", ["Up to 64K (65,535) I/O queues with up to 64K (65,536) commands per queue", "Exactly 4 queues with 128 commands each", "A single queue with 256 commands", "16 queues limited to SATA III 6 Gbps signaling"], "NVMe was designed from the ground up for multi-core processors, supporting up to 64K I/O queues so each CPU core can have its own lockless queue pair.", "storage_nvme", ["nvme", "queues"]],
  ['In ZFS or Btrfs copy-on-write (CoW) file systems, what problem known as the "RAID 5 Write Hole" is eliminated by updating Merkle tree block pointers atomically?', ["Inconsistent parity stripes after an unexpected power loss mid-write", "Physical head crashes on magnetic platters", "Bad sectors caused by cosmic rays in CPU L1 cache", "USB controller bandwidth starvation"], "Traditional RAID 5 can suffer silent corruption if power fails between writing data blocks and updating the parity block; Copy-on-Write writes new blocks elsewhere and flips the parent pointer atomically.", "storage_nvme", ["filesystems", "zfs"]],
  ["In DRAM timing notation such as DDR5-6000 CL30-38-38-96, what does tRCD (the second number, 38 clock cycles) specifically measure?", ["RAS-to-CAS Delay: the minimum clock cycles required between activating a row (ACT) and issuing a column read/write command", "Total refresh interval across all 32 banks", "Command rate between chip select assertions", "Voltage droop recovery time in nanoseconds"], "tRCD (Row Address to Column Address Delay) specifies the delay between opening a DRAM row in the sense amplifiers and accessing a specific column within that row.", "cache_hierarchy", ["dram", "timings"]],
  ["According to Amdahl's Law, if 80% of a workload can be parallelized perfectly (P = 0.80) and 20% remains strictly serial, what is the maximum theoretical speedup with 8 processor cores?", ["3.33x speedup (1 / (0.20 + 0.80/8) = 1 / 0.30)", "6.40x speedup", "8.00x speedup", "5.00x speedup"], "Speedup = 1 / ((1 - P) + P / N) = 1 / (0.20 + 0.80 / 8) = 1 / (0.20 + 0.10) = 1 / 0.30 = 3.33x.", "cpu_pipeline", ["parallelism", "amdahl"]],
  ["In x86-64 4-level paging (48-bit virtual addresses with 4 KB pages), what are the four page table hierarchy levels traversed during a hardware page table walk?", ["PML4 (Page Map Level 4) \u2192 PDPT (Page Directory Pointer Table) \u2192 PD (Page Directory) \u2192 PT (Page Table)", "GDT \u2192 IDT \u2192 LDT \u2192 TSS", "L1 \u2192 L2 \u2192 L3 \u2192 Swap", "MBR \u2192 GPT \u2192 EFI \u2192 GRUB"], "Each of the four levels uses 9 bits of the virtual address (9 \xD7 4 = 36 bits) plus the 12-bit page offset (4 KB = 2^12), totaling 48 virtual address bits.", "cache_hierarchy", ["paging", "x86-64"]],
  ["Why does PCIe 5.0 (32 GT/s) continue using NRZ (Non-Return-to-Zero) signaling while PCIe 6.0 (64 GT/s) transitions to PAM4 (Pulse Amplitude Modulation 4-level) with FLIT-mode FEC?", ["PAM4 encodes 2 bits per symbol across 4 voltage levels to double bandwidth at the same Nyquist frequency, requiring lightweight Forward Error Correction (FEC) for the tighter SNR margins", "PAM4 eliminates all copper traces in favor of wireless radio waves", "PCIe 6.0 reduces bandwidth per lane to save battery power", "NRZ encodes 8 bits per voltage pulse"], "At 64 GT/s, doubling NRZ symbol rate would cause severe high-frequency insertion loss; PAM4 transmits 2 bits per UI across 4 amplitude levels paired with low-latency FEC.", "motherboard_bus", ["pcie", "signaling"]],
  ["In TCP congestion control (RFC 5681), how does the sender distinguish between a mild network congestion event and severe packet loss when deciding whether to enter Fast Recovery?", ["Receiving 3 duplicate ACKs triggers Fast Retransmit / Fast Recovery, whereas a Retransmission Timeout (RTO) resets cwnd to 1 MSS and enters Slow Start", "Receiving an ICMP Echo Reply resets the congestion window", "TCP queries the router CPU temperature via SNMP", "The receiver sends a DHCP NAK packet"], "Three duplicate ACKs indicate that subsequent segments are still arriving out-of-order, so TCP halves ssthresh and enters Fast Recovery without dropping cwnd to 1 MSS.", "network_osi", ["tcp", "congestion"]],
  ["In modern Intel/AMD x86-64 microarchitectures, why must a Virtually Indexed, Physically Tagged (VIPT) L1 cache have its single-way size (Set Count \xD7 Line Size) less than or equal to the base OS page size (4 KB) to avoid aliasing without extra hardware checks?", ["So that all cache Index bits fall strictly within the 12-bit untranslated page offset (bits 0\u201311), allowing cache indexing in parallel with the TLB lookup", "Because 4 KB is the maximum SRAM density manufacturable on FinFET silicon", "To ensure the L1 cache can fit inside the CMOS RTC chip", "Because virtual addresses have no tag bits above bit 12"], "In a 4 KB page, bits [11:0] are identical in both virtual and physical addresses. If Index + Offset <= 12 bits, the CPU can index the L1 sets immediately using virtual address bits while the TLB translates the upper tag bits in parallel.", "cache_hierarchy", ["vipt", "cache", "mmu"]],
  ["In Non-Uniform Memory Access (NUMA) multi-socket or chiplet architectures, what is a Directory-Based Cache Coherency protocol's primary advantage over Snoopy Broadcast buses?", ["It avoids broadcasting invalidation/read requests to every core on every miss by maintaining a directory of which nodes share each cache block, scaling bandwidth to dozens or hundreds of cores", "It eliminates L1 and L2 caches completely", "It allows DRAM to operate without refresh cycles", "It forces all cores to execute instructions in lockstep SIMD mode"], "Snoopy bus broadcasts saturate interconnect bandwidth as core count grows; a directory tracks sharing vectors per cache line so point-to-point coherence probes only hit relevant nodes.", "cache_hierarchy", ["numa", "coherency"]],
  ["In CXL (Compute Express Link) built atop the PCIe physical layer, what are the distinct roles of the three sub-protocols CXL.io, CXL.cache, and CXL.mem?", ["CXL.io handles PCIe discovery/DMA, CXL.cache lets accelerators cache host memory coherently, and CXL.mem lets the host CPU load/store directly to device-attached memory pools", "CXL.io transmits HDMI video, CXL.cache controls fan speeds, and CXL.mem manages USB drives", "All three are legacy aliases for SATA Revision 1.0", "CXL.mem is used only for floppy disk emulation"], "CXL multiplexes three protocols over PCIe PHY: CXL.io (mandatory PCIe-like configuration/I/O), CXL.cache (device coherently caching host RAM), and CXL.mem (host processor accessing device memory with load/store semantics).", "motherboard_bus", ["cxl", "interconnect"]],
  ["In branch prediction hardware, how does a TAGE (TAgged GEometric history length) predictor achieve higher accuracy than a simple 2-bit bimodal saturating counter?", ["It indexes multiple prediction tables using geometric series of global branch history lengths hashed with the PC, selecting the longest matching history tag", "It pauses the CPU pipeline until every branch target is fetched from the hard drive", "It randomly guesses taken or not-taken using thermal diode noise", "It rewrites the binary executable file on disk after every branch"], "TAGE maintains a base bimodal predictor plus several tagged tables indexed by geometrically increasing global history lengths (e.g., 4, 8, 16, 32, 64+ branches), capturing both short local loops and deep global correlations.", "cpu_pipeline", ["branch-prediction", "tage"]],
  ["When executing atomic read-modify-write instructions (such as `LOCK CMPXCHG` on x86-64) on modern processors, how is atomicity enforced efficiently when the target variable resides within a single aligned cache line?", ["Via Cache Locking: the core acquires exclusive ownership (M state) of the cache line and holds it against coherence snoops for the duration of the operation without asserting a global bus lock", "By physically cutting power to all other CPU cores for 10 milliseconds", "By flushing the entire L3 cache to NVMe storage", "By rebooting the memory controller"], "Modern CPUs implement locked atomic operations on cacheable aligned memory via local cache line locking (holding the line in Exclusive/Modified state and delaying snoop responses) rather than stalling the entire system interconnect.", "cache_hierarchy", ["atomics", "x86-64"]]
];
var EXPERT_COMP_FACTS = [
  ["Intel 4004 (1971)", "4-bit data bus, 2,300 transistors, 740 kHz clock", "8-bit data bus, 29,000 transistors", "16-bit data bus, 134,000 transistors", "32-bit data bus, 275,000 transistors"],
  ["Intel 8086 (1978)", "16-bit registers with a 20-bit segmented address bus (1 MB max RAM)", "32-bit flat protected addressing (4 GB max RAM)", "64-bit long mode addressing", "8-bit accumulator with 64 KB address limit"],
  ["Intel 80386DX (1985)", "Introduced 32-bit IA-32 protected mode, paging unit, and 4 GB address space", "Introduced 64-bit x86-64 instruction set", "Introduced AVX-512 vector extensions", "First dual-core consumer processor"],
  ["AMD Opteron / Athlon 64 (K8, 2003)", "Introduced AMD64 (x86-64) 64-bit extension and on-die DDR memory controller", "First processor to remove L1 cache", "Introduced IA-64 EPIC VLIW architecture", "Replaced silicon with gallium arsenide"],
  ["ARMv8-A (AArch64)", "31 general-purpose 64-bit registers (X0\u2013X30) plus dedicated zero/stack pointer and fixed 32-bit instruction width", "Variable 1-to-15 byte instruction encoding like x86", "Only 4 general-purpose 16-bit registers", "Stack-based execution with zero registers"],
  ["RISC-V RV64I Base Integer ISA", "32 integer registers where x0 is hardwired to constant zero and x1\u2013x31 are 64-bit general-purpose registers", "No hardwired zero register and big-endian only", "Proprietary closed-source microcode owned by IBM", "Uses 128-bit opcodes exclusively"],
  ["Apple M1 Firestorm Performance Core", "8-wide instruction decode width with a ~630-entry reorder buffer on ARM64 ISA", "2-wide in-order decode pipeline on x86 ISA", "Single-issue scalar pipeline without branch prediction", "VLIW architecture requiring static compiler scheduling"],
  ["AMD Zen 4 Core Complex (CCD)", "8 cores sharing a 32 MB L3 victim cache with 1 MB private L2 cache per core", "16 cores sharing a 2 MB L3 cache", "In-order execution cores without L2 cache", "Uses off-chip L1 cache on the motherboard"],
  ["Intel Pentium Pro (P6, 1995)", "Pioneered out-of-order decoupling by translating x86 CISC instructions into internal RISC-like micro-operations (uops)", "Removed floating-point hardware from the CPU die", "Used vacuum tubes for branch prediction", "Introduced DDR5 memory support"],
  ["DEC Alpha 21264 (EV6)", "64-bit RISC processor featuring tournament branch prediction and clustered out-of-order integer execution", "8-bit microcontroller for automotive wipers", "16-bit CISC processor without pipelining", "First GPU with hardware ray tracing"],
  ["Virtual Memory Page Fault (Major / Hard Fault)", "Occurs when a referenced virtual page is not resident in physical RAM and the OS kernel must fetch it from backing storage (SSD/swap) via an interrupt handler", "Occurs when a CPU core overheats past 100\xB0C", "Indicates a permanent hardware short-circuit on the motherboard", "Happens every time an L1 cache hit succeeds"],
  ["Copy-on-Write (fork() Optimization in Unix/Linux)", "Parent and child processes initially share identical physical memory pages marked read-only; a private copy is allocated only when either process attempts to write to a page", "Immediately duplicates every gigabyte of physical RAM and disk contents on fork()", "Prevents child processes from reading global variables", "Flushes all CPU registers to the printer port"],
  ["DMA (Direct Memory Access) Engine", "Allows peripheral controllers (NVMe, NIC, GPU) to transfer data blocks directly to/from main physical memory without occupying the CPU with byte-by-byte polling loops", "Increases CPU clock speed by bypassing the heatsink", "Translates high-level JavaScript into HTML", "Replaces the PSU 12V rail"],
  ["SIMD (Single Instruction, Multiple Data \u2014 AVX2 / NEON)", "Executes a single vector opcode simultaneously across multiple packed data elements (e.g., eight 32-bit floats in a 256-bit YMM register) in one instruction cycle", "Executes eight different programs on a single 1-bit ALU", "Forces network switches to broadcast packets to all ports", "Serializes memory writes to a floppy disk"],
  ["Interrupt Coalescing (NIC / NVMe Moderation)", "Groups multiple rapid hardware completion events into a single hardware interrupt within a microsecond timer window to reduce CPU context-switch overhead under high load", "Disables all network traffic when throughput exceeds 10 Mbps", "Merges two physical network cables into one RJ11 plug", "Deletes dropped TCP packets from the sender hard drive"],
  ["Bank Conflict in GPU Shared Memory / Multi-Banked Cache", "Occurs when multiple parallel threads in a warp/wavefront simultaneously request different addresses that map to the same physical SRAM bank, serializing the accesses", "Occurs when two GPUs are installed in different computers on the same LAN", "Happens when the monitor refresh rate exceeds 60 Hz", "Indicates that the CMOS battery voltage is below 2.0V"],
  ["Write-Back vs. Write-Through Cache Policy", "Write-Back modifies only the local cache line (marking its dirty bit) and defers main memory writes until eviction, drastically reducing memory bus traffic compared to Write-Through", "Write-Back writes every byte immediately to the hard drive before updating L1 cache", "Write-Through never updates main memory", "Write-Back disables multicore cache coherency"],
  ["Victim Cache Architecture", "A cache level populated exclusively with cache lines evicted from an upper cache level (such as L1/L2) rather than replicating lines on initial fetch, maximizing effective unique cache capacity", "A cache that intentionally corrupts random bits to test ECC RAM", "A partition on an SSD reserved for malware quarantine", "A read-only ROM chip containing motherboard fan curves"],
  ["Micro-op (uop) Cache / Decoded I-Cache", "Stores already-decoded internal RISC-like micro-operations so hot loops bypass the complex variable-length x86 fetch and decode stages, saving power and reducing branch misprediction penalty", "Stores JPEG thumbnails on the GPU backplate", "Caches DNS queries inside the router power adapter", "Replaces the system pagefile on Windows"],
  ["Hardware Pre-fetcher (Stride & Stream Prefetching)", "Monitors memory access patterns and speculatively fetches sequential or fixed-stride cache lines into L2/L1 before the CPU core explicitly issues the load instruction", "Pre-compiles C source files before the programmer saves them", "Increases the physical RPM of an NVMe solid-state drive", "Lowers the room ambient temperature"],
  ["RAID 6 Distributed Dual Parity", "Requires a minimum of 4 drives and calculates two independent parity syndromes (P and Q using Reed-Solomon/Galois Field math) to survive any 2 drive failures", "Requires only 2 drives and offers zero redundancy", "Uses 100% of drive capacity with no parity overhead", "Fails completely if a single drive develops a bad sector"],
  ["ECC SECDED (Hamming Code with Extra Parity)", "Single-Error Correcting, Double-Error Detecting code that adds 8 parity bits per 64-bit data word (72 bits total) to fix 1-bit flips and halt on 2-bit flips", "Overclocks RAM voltage to 2.5V automatically", "Compresses 64-bit integers into 32-bit floats", "Disables memory refresh cycles"],
  ["QUIC / HTTP/3 (RFC 9000 / RFC 9114)", "Runs atop UDP (typically Port 443) \u2014 Eliminates transport-layer head-of-line blocking across multiplexed streams with built-in TLS 1.3", "Runs atop raw Ethernet Layer 2 without IP addresses", "Requires three separate TCP connections per image", "Uses ICMP Echo Requests to transport web pages"],
  ["PCIe 5.0 x4 M.2 NVMe Slot", "32 GT/s per lane with 128b/130b encoding, providing ~15.75 GB/s bandwidth across just 4 lanes", "600 MB/s maximum limited by AHCI protocol", "1.5 Gbps half-duplex signaling", "Requires external 240V AC power brick"],
  ["USB4 Gen 3x2 (40 Gbps)", "Tunnels PCIe, DisplayPort, and USB 3.2 data packets over two 20 Gbps lanes using the USB Type-C connector", "Uses a 9-pin RS-232 serial connector at 115,200 baud", "Supports only 5V / 0.5A power delivery", "Cannot carry video signals"],
  ["Thunderbolt 4 Specification", "Mandates 40 Gbps bandwidth, dual 4K (or single 8K) display support, and at least 32 Gbps PCIe data throughput with DMA protection", "Limits PCIe tunneling to 1 Gbps without IOMMU protection", "Uses coaxial BNC connectors", "Operates exclusively over infrared light"],
  ["JEDEC DDR5 Sub-Channel Architecture", "Splits a single 64-bit DIMM into two independent 32-bit addressable sub-channels (40-bit with on-DIMM ECC) and moves the PMIC voltage regulator onto the DIMM", "Uses a single 128-bit parallel channel per DIMM", "Eliminates burst length and reads 1 bit per clock", "Moves the memory controller to the Southbridge"],
  ["IEEE 754 Single-Precision (float32) Bit Layout", "Allocates 1 sign bit, 8 biased exponent bits (bias 127), and 23 fraction (mantissa) bits with an implicit leading 1 for normalized numbers", "Allocates 8 sign bits, 8 exponent bits, and 16 mantissa bits", "Uses base-10 decimal digits stored in ASCII", "Has no representation for Infinity or NaN"],
  ["IOMMU (Intel VT-d / AMD-Vi) DMA Remapping", "Translates device DMA virtual addresses to physical RAM addresses and isolates PCIe peripherals into protected memory domains", "Only manages PS/2 keyboard interrupts", "Replaces GPU shader cores during rendering", "Converts AC wall power into DC power"],
  ["WPA3 Simultaneous Authentication of Equals (SAE)", "Replaces the vulnerable WPA2 4-way PSK handshake with the Dragonfly key exchange, providing forward secrecy and offline dictionary attack resistance", "Uses static 40-bit WEP RC4 keys", "Transmits Wi-Fi passwords in plaintext beacons", "Requires an Ethernet cable to authenticate"]
];
function buildComputersTier(baseTuples, difficulty, targetCount, extraPool, diagramDefault) {
  const items = [];
  for (let i = 0; i < baseTuples.length && items.length < targetCount; i++) {
    const [qText, opts, exp, diag, tags] = baseTuples[i];
    items.push({
      code: `comp_${difficulty.toLowerCase().replace(/\s+/g, "_")}_${items.length + 1}`,
      categorySlug: "computers",
      difficulty,
      questionText: qText,
      options: opts,
      explanation: exp,
      diagramType: diag,
      tags,
      estimatedTimeSec: difficulty === "Easy" ? 15 : difficulty === "Normal" ? 25 : difficulty === "Hard" ? 40 : 60
    });
  }
  let idx = 0;
  while (items.length < targetCount) {
    const fact = extraPool[idx % extraPool.length];
    const [subject, correctDesc, w1, w2, w3] = fact;
    const questionText = `In advanced computer architecture and systems engineering, which technical specification accurately characterizes ${subject}?`;
    items.push({
      code: `comp_${difficulty.toLowerCase().replace(/\s+/g, "_")}_${items.length + 1}`,
      categorySlug: "computers",
      difficulty,
      questionText,
      options: [correctDesc, w1, w2, w3],
      explanation: `${subject} is defined by: ${correctDesc}.`,
      diagramType: idx % 3 === 0 ? diagramDefault : "none",
      tags: ["architecture", "systems", subject.toLowerCase().split(" ")[0]],
      estimatedTimeSec: 60
    });
    idx++;
  }
  return items;
}
var COMPUTERS_QUESTIONS = [
  ...buildComputersTier(EASY_COMPUTERS, "Easy", 50, [], "none"),
  ...buildComputersTier(NORMAL_COMPUTERS, "Normal", 50, [], "none"),
  ...buildComputersTier(HARD_COMPUTERS, "Hard", 50, [], "cache_hierarchy"),
  ...buildComputersTier(VERY_HARD_COMPUTERS, "Very Hard", 50, EXPERT_COMP_FACTS, "cpu_pipeline")
];

// src/db/banks/carsBank.ts
var EASY_CARS = [
  ["How many wheels does a normal family car roll on?", ["4 wheels", "2 wheels", "3 wheels", "8 wheels"], "A standard passenger car has four wheels\u2014two in the front and two in the back.", "none", ["basics", "wheels"]],
  ["What round wheel inside the car does the driver hold and turn to steer left or right?", ["Steering Wheel", "Spare Tire", "Gear Stick", "Cup Holder"], "Turning the steering wheel turns the front wheels to guide the car left or right.", "none", ["basics", "controls"]],
  ["What should every person in a car buckle across their chest and lap before the car starts moving?", ["Seatbelt", "Scarf", "Shoelace", "Backpack Strap"], "Seatbelts keep passengers safe and secure in their seats if the car stops suddenly.", "none", ["basics", "safety"]],
  ["At a traffic light on the road, what does a RED light mean?", ["Stop completely", "Drive as fast as you can", "Honk the horn", "Turn on the radio"], "A red traffic signal means all cars must come to a complete stop.", "none", ["basics", "traffic"]],
  ["At a traffic light, what does a GREEN light mean?", ["Go safely when the way is clear", "Stop and park the car", "Drive backward", "Close your eyes"], "A green traffic signal means drivers may proceed when the intersection is clear.", "none", ["basics", "traffic"]],
  ["Which bright lights on the front of a car help the driver see the road at night?", ["Headlights", "Reading Lights", "Trunk Lights", "Radio Dial"], "Headlights shine forward to light up the road in the dark or rain.", "none", ["basics", "lights"]],
  ["What moving blades on the front glass of a car sweep away rain and snow so the driver can see?", ["Windshield Wipers", "Bumpers", "Mud Flaps", "Hubcaps"], "Windshield wipers move back and forth across the front glass to clear rainwater.", "none", ["basics", "wipers"]],
  ["Which pedal on the floor does the driver press with their foot to make the car slow down and stop?", ["Brake Pedal", "Horn Button", "Window Switch", "Radio Pedal"], "Pressing the brake pedal slows the wheels and brings the car to a stop.", "none", ["basics", "brakes"]],
  ["Which pedal does the driver press to make the car speed up and go forward?", ["Gas Pedal (Accelerator)", "Brake Pedal", "Parking Lever", "Mirror Switch"], "Pressing the accelerator (gas pedal) gives the engine or motor more power to move faster.", "none", ["basics", "controls"]],
  ['What button in the center of the steering wheel makes a loud "BEEP!" sound to warn other drivers?', ["Horn", "Trunk Release", "Sunroof Switch", "Heater"], "The car horn makes a loud warning sound to alert other drivers or pedestrians.", "none", ["basics", "safety"]],
  ["Where do you put suitcases and grocery bags at the back of a normal car?", ["In the Trunk (or Boot)", "Under the brake pedal", "Inside the tire", "On the steering wheel"], "The trunk is the storage compartment at the rear of a car for luggage and groceries.", "none", ["basics", "storage"]],
  ["What is the large clear glass window at the very front of a car called?", ["Windshield (or Windscreen)", "Sunroof", "Side Mirror", "Headlight"], "The windshield protects everyone inside from wind, rain, and bugs while giving a clear view of the road.", "none", ["basics", "body"]],
  ["What does the driver look into above the dashboard or on the side doors to see cars driving behind them?", ["Rearview and Side Mirrors", "Cup Holders", "Floor Mats", "Air Vents"], "Mirrors let the driver check traffic behind and beside the car without turning around.", "none", ["basics", "mirrors"]],
  ["What do you put into a gasoline car at a gas station so the engine can run?", ["Fuel (Gasoline / Petrol)", "Orange Juice", "Sand", "Liquid Soap"], "Gasoline cars burn fuel from the gas station to power their engines.", "none", ["basics", "fuel"]],
  ["Instead of gasoline, what powers a fully electric car like a Tesla?", ["A large rechargeable battery", "Coal and wood", "Wind sails on the roof", "Foot pedals"], "Electric vehicles (EVs) store electricity in a big battery pack that powers an electric motor.", "none", ["basics", "electric"]],
  ["What extra tire is often kept in the trunk of a car in case one of the four tires gets a flat puncture?", ["Spare Tire", "Steering Wheel", "Flywheel", "Fan Belt"], "A spare tire can replace a flat tire so you can drive safely to a repair shop.", "none", ["basics", "tires"]],
  ["What flashing orange lights on the corners of a car tell other drivers you are about to turn left or right?", ["Turn Signals (Indicators / Blinkers)", "Reading Lamps", "Fog Horns", "Wipers"], "Turn signals blink on the left or right side to show other road users which way you plan to turn.", "none", ["basics", "lights"]],
  ["What color do the lights on the back of a car glow when the driver presses the brake pedal?", ["Bright Red", "Bright Green", "Purple", "Blue"], "Red brake lights at the back of the car light up immediately whenever the driver brakes.", "none", ["basics", "lights"]],
  ["What is a car called when its roof can fold all the way down so you can drive in the open air?", ["Convertible", "Submarine", "Tractor", "Ambulance"], "A convertible has a folding roof that opens up on sunny days.", "none", ["basics", "body"]],
  ["What heavy metal lid at the front of most cars opens up so a mechanic can look at the engine?", ["Hood (or Bonnet)", "Door Handle", "Bumper", "License Plate"], "The hood covers and protects the engine bay at the front of the car.", "none", ["basics", "body"]],
  ["What dial or screen number in front of the driver shows how fast the car is going (in mph or km/h)?", ["Speedometer", "Thermometer", "Clock", "Radio Station"], "The speedometer shows the vehicle's current traveling speed.", "none", ["basics", "dashboard"]],
  ["What is the metal or plastic plate with letters and numbers bolted to the front and back of every road car?", ["License Plate (Number Plate)", "Dinner Plate", "Floor Mat", "Roof Rack"], "Every registered road car has a unique license plate for identification.", "none", ["basics", "registration"]],
  ["Which gear setting (`R`) makes a car drive backward out of a parking spot?", ["Reverse (`R`)", "Park (`P`)", "Drive (`D`)", "Neutral (`N`)"], "Shifting into Reverse (`R`) makes the car move backward slowly.", "none", ["basics", "gears"]],
  ["Which gear setting (`P`) locks the transmission so a parked car does not roll away?", ["Park (`P`)", "Reverse (`R`)", "Drive (`D`)", "Sport (`S`)"], "Putting the car in Park (`P`) and setting the parking brake keeps the car still when parked.", "none", ["basics", "gears"]],
  ["What soft safety cushions rapidly puff up with air inside a car during a crash to protect the people inside?", ["Airbags", "Seat Covers", "Floor Mats", "Sun Visors"], "Airbags inflate in a fraction of a second during a collision to cushion the occupants.", "none", ["basics", "safety"]],
  ["What is a garage or building where you park your car to wash off mud and dirt with soap and water sprays?", ["Car Wash", "Library", "Bakery", "Post Office"], "A car wash cleans the outside of a vehicle with water jets, soap, and brushes.", "none", ["basics", "care"]],
  ["What are the black rubber rings filled with air that fit around the metal wheels of a car?", ["Tires", "Brakes", "Springs", "Wipers"], "Rubber pneumatic tires hold compressed air and grip the road surface.", "none", ["basics", "tires"]],
  ["Why do car tires have grooves and patterns cut into the rubber instead of being completely smooth like glass?", ["To grip the road and push rainwater out of the way so the car does not slip", "To make pretty tracks in the driveway", "To make the car heavier", "To hold spare keys"], "Tire tread grooves channel water away and provide traction on wet or dusty roads.", "none", ["basics", "tires"]],
  ["What flap above the front seats can you flip down to block bright sunlight from shining in your eyes?", ["Sun Visor", "Mud Flap", "Hubcap", "Spoiler"], "Sun visors fold down at the top of the windshield to shade your eyes from glare.", "none", ["basics", "interior"]],
  ["Where do you place a water bottle or coffee cup inside a car so it does not spill while driving?", ["Cup Holder", "Glove Box", "Exhaust Pipe", "Pedal"], "Cup holders built into the console keep drinks upright while driving.", "none", ["basics", "interior"]],
  ["What small storage compartment in the dashboard in front of the front passenger seat holds the car manual?", ["Glove Box (Glove Compartment)", "Trunk", "Fuel Tank", "Radiator"], "The glove compartment sits in the dashboard and stores papers and small items.", "none", ["basics", "interior"]],
  ["What pipe at the back underneath a gasoline car lets out the engine smoke/exhaust gases?", ["Exhaust Pipe (Tailpipe)", "Water Hose", "Steering Column", "Axle"], "The exhaust tailpipe carries burned gases safely out the back of the car.", "none", ["basics", "exhaust"]],
  ["At a street corner, what does an eight-sided red sign with the white word `STOP` mean?", ["Bring the car to a complete stop and look both ways before going", "Speed up to beat other cars", "Park the car for the day", "U-turn only"], "A red octagon STOP sign requires every driver to come to a full stop.", "none", ["basics", "traffic"]],
  ["What is the maximum number of people who should wear a single seatbelt at the same time?", ["1 person per seatbelt", "2 people per seatbelt", "3 people per seatbelt", "Nobody needs a seatbelt"], "Each seatbelt is designed to protect exactly one person safely.", "none", ["basics", "safety"]],
  ["What is a long luxury car\u2014often used for weddings or VIP guests\u2014with a very long cabin and lots of seats?", ["Limousine", "Go-Kart", "Forklift", "Golf Cart"], "A stretch limousine has an extended wheelbase and a spacious passenger cabin.", "none", ["basics", "types"]],
  ["What kind of small, low, open-wheel track car do kids and adults drive for fun at an indoor or outdoor karting track?", ["Go-Kart", "Fire Truck", "Bulldozer", "Dump Truck"], "Go-karts are small four-wheeled track vehicles built close to the ground.", "none", ["basics", "types"]],
  ["What special vehicle has flashing lights and a loud siren to carry sick or injured people quickly to a hospital?", ["Ambulance", "Ice Cream Truck", "Garbage Truck", "Cement Mixer"], "Drivers pull over to let emergency ambulances pass quickly on their way to the hospital.", "none", ["basics", "vehicles"]],
  ["What does the fuel gauge needle pointing to `E` with a little gas pump light glowing on the dashboard mean?", ["The fuel tank is almost Empty and needs gas soon", "The engine is Extra fast", "Everything is Excellent", "The car is in Electric mode"], "`E` stands for Empty and `F` stands for Full on a fuel gauge.", "none", ["basics", "dashboard"]],
  ["What does the letter `F` on a car's fuel gauge stand for?", ["Full", "Fast", "Flat", "Frozen"], "When the needle points to `F`, the fuel tank is Full.", "none", ["basics", "dashboard"]],
  ["When it is hot outside, what button in the car blows cool, refreshing air into the cabin?", ["Air Conditioning (`A/C`)", "Windshield Washer", "Hazard Lights", "Horn"], "The A/C system cools and dehumidifies the air inside the car.", "none", ["basics", "comfort"]],
  ["What button with a red triangle (`\u26A0\uFE0F`) makes all four turn signal lights flash at once if your car breaks down by the road?", ["Hazard Warning Lights", "High-Beam Button", "Radio Mute", "Seat Heater"], "Hazard flashers warn other drivers to be careful around a stopped or disabled vehicle.", "none", ["basics", "safety"]],
  ["What tool is used to lift one corner of a car off the ground so you can change a flat tire?", ["Car Jack", "Screwdriver", "Paintbrush", "Flashlight"], "A car jack raises the vehicle frame so the flat wheel can be removed and replaced.", "none", ["basics", "tools"]],
  ["What do you use to unlock a car door and start the car?", ["Car Key (or Key Fob)", "Library Card", "Coin", "Comb"], "A physical car key or wireless key fob unlocks the doors and starts the ignition.", "none", ["basics", "controls"]],
  ["What window in the roof of a car lets sunshine and fresh air in from above?", ["Sunroof (or Moonroof)", "Windshield", "Tailgate", "Headlight"], "A sunroof is a glass or metal panel in the car roof that tilts or slides open.", "none", ["basics", "body"]],
  ["Which protective bars at the very front and very back of a car help absorb gentle bumps in parking lots?", ["Bumpers", "Wipers", "Mirrors", "Antennas"], "Front and rear bumpers absorb minor impact energy to protect the body panels.", "none", ["basics", "body"]],
  ["Why should young children ride in a booster seat or child safety seat in the back seat of a car?", ["So the seatbelt fits their smaller body safely and protects them away from front airbags", "So they can reach the steering wheel", "To make the car go faster", "To keep the front seats clean"], "Booster and child seats position the seatbelt properly across a child's strong bones.", "none", ["basics", "safety"]],
  ["What liquid can you squirt onto the front glass using a lever by the steering wheel to clean off bug spots and mud?", ["Windshield Washer Fluid", "Motor Oil", "Gasoline", "Maple Syrup"], "Washer fluid sprays from small nozzles onto the windshield while the wipers sweep it clean.", "none", ["basics", "wipers"]],
  ["What white lights on the back of a car turn on automatically when the car is put in Reverse (`R`)?", ["Reverse (Backup) Lights", "Headlights", "Interior Dome Lights", "Fog Lights"], "White reverse lights illuminate the area behind the car and warn people nearby that the car is backing up.", "none", ["basics", "lights"]],
  ["In which country or region do cars drive on the LEFT side of the road with the steering wheel on the right?", ["United Kingdom, India, Japan, and Australia", "United States and Canada", "France and Germany", "Brazil and Mexico"], "Countries like India, the UK, Japan, and Australia drive on the left side of the road.", "none", ["basics", "driving"]],
  ["What do we call a car race where fast cars compete on a closed track to cross the finish line first?", ["Motor Racing (or Auto Racing)", "Marathon Running", "Boat Sailing", "Horse Jumping"], "Auto racing pits drivers and cars against each other on circuits or rally stages.", "none", ["basics", "racing"]]
];
var NORMAL_CARS = [
  ['What is a "Hybrid Car" (such as a Toyota Prius)?', ["A car that combines a regular gasoline engine with an electric motor and battery to save fuel", "A car that can both drive on roads and fly in the sky", "A car with six wheels", "A car that runs on water"], "Hybrid vehicles use both an internal combustion engine and an electric motor to improve fuel economy.", "none", ["everyday", "hybrid"]],
  ['What is the main difference between an "Automatic" and a "Manual" (stick-shift) transmission car?', ["An automatic shifts gears by itself, while a manual requires the driver to press a clutch pedal and move a gear stick", "An automatic car steers itself without a driver", "A manual car has no brakes", "An automatic car only drives backward"], "Automatic transmissions change gears automatically as speed changes, whereas manual cars use a foot clutch and gear lever.", "none", ["everyday", "transmission"]],
  [`What does the "Odometer" number on a car's dashboard display?`, ["The total distance (miles or kilometers) the car has been driven since it was built", "How fast the car is moving right now", "The outside air temperature", "How many liters of gas are left"], "The odometer tracks the lifetime mileage of the vehicle.", "none", ["everyday", "dashboard"]],
  ['What are "Jumper Cables" used for when a car will not start?', ["Connecting a dead 12-volt car battery to another car's good battery to jump-start the engine", "Towing a broken car down the highway", "Tying luggage to the roof rack", "Measuring tire air pressure"], "Jumper cables transfer electrical current from a charged 12V battery to start a car with a drained battery.", "none", ["everyday", "battery"]],
  ['What does "Cruise Control" do when driving on a highway?', ["Maintains a steady speed set by the driver without keeping a foot on the gas pedal", "Steers the car around corners automatically", "Parks the car in a garage", "Turns off the engine to save gas"], "Cruise control holds a chosen highway speed until the driver taps the brake or cancels it.", "none", ["everyday", "driving"]],
  ["What does `SUV` stand for in car shopping?", ["Sport Utility Vehicle", "Super Urban Van", "Small Underground Vehicle", "Speed Upgrade Version"], "SUV stands for Sport Utility Vehicle, featuring higher ground clearance and a tall cabin.", "none", ["everyday", "types"]],
  ['What is a "Sedan" (or Saloon) car body style?', ["A classic 4-door passenger car with a separate enclosed trunk at the back", "A 2-seat pickup truck with an open cargo bed", "A giant 18-wheel cargo truck", "A three-wheeled motorcycle"], "A sedan has four doors, front and rear seating rows, and a separate trunk lid.", "none", ["everyday", "types"]],
  ['What is a "Hatchback" car?', ["A compact car whose rear door swings upward including the back window to open a shared cargo area", "A car with no roof or doors", "A car with two engines", "A truck used only on farms"], "Hatchbacks have a full-height rear liftgate that opens directly into the cabin cargo space.", "none", ["everyday", "types"]],
  ['What is a "Blind Spot" when driving a car?', ["An area beside and slightly behind your car that you cannot easily see in your rearview or side mirrors", "Driving through a dark tunnel at night", "A dirty spot on the windshield", "A bright reflection from the sun"], "Drivers check over their shoulder or use blind-spot warning sensors before changing lanes.", "none", ["everyday", "safety"]],
  ['Why do cars need periodic "Oil Changes" at a service center?', ["Fresh engine oil lubricates moving metal engine parts, reduces wear, and helps keep the engine clean and cool", "Engine oil is burned instead of gasoline to power the wheels", "Oil makes the windshield wipers move faster", "Oil inflates the tires"], "Motor oil breaks down and collects microscopic debris over thousands of miles, requiring periodic replacement.", "none", ["everyday", "maintenance"]],
  ["What unit is commonly used on a tire gauge to measure the air pressure inside car tires?", ["PSI (Pounds per Square Inch) or Bar", "Volts", "Miles per Hour", "Gallons"], "Recommended tire inflation pressure (typically around 32\u201335 PSI for passenger cars) is printed on a sticker inside the driver's door jamb.", "none", ["everyday", "tires"]],
  ["What dashboard warning light shaped like an exclamation mark inside a horseshoe (`(!)`) tells the driver to check the tires?", ["Tire Pressure Monitoring System (TPMS) \u2014 one or more tires is low on air", "The trunk is open", "The windshield washer fluid is low", "The radio is muted"], "The TPMS warning icon lights up when a tire's air pressure drops significantly below the recommended level.", "none", ["everyday", "dashboard"]],
  ["What does `MPG` (Miles Per Gallon) or `km/L` (Kilometers per Liter) measure?", ["Fuel economy \u2014 how far a car can travel on one gallon or liter of fuel", "The top speed of the car on a racetrack", "How heavy the car is", "How loud the exhaust is"], "Higher MPG or km/L means the car uses less fuel to travel the same distance.", "none", ["everyday", "fuel"]],
  ['What is "Parallel Parking"?', ["Parking a car in line with the curb between two other parked cars (front-to-back)", "Parking two cars side-by-side in a driveway", "Parking on the roof of a mall", "Leaving the engine running while parked"], "Parallel parking maneuvers a vehicle into a curbside space parallel to the road.", "none", ["everyday", "driving"]],
  ['What does a "Backup Camera" (Rearview Camera) show on the dashboard screen?', ["A live video view of the area directly behind the car when Reverse gear is selected", "A movie for the back-seat passengers", "A view of the engine pistons", "The weather forecast"], "Rearview cameras help drivers spot low obstacles, curbs, and pedestrians when backing up.", "none", ["everyday", "safety"]],
  ['What is "Hydroplaning" (or Aquaplaning) when driving fast in heavy rain?', ["When a layer of water builds up under the tires so they lose contact with the road surface and skim on top of the water", "Washing the underside of a car", "Driving a boat across a lake", "Cooling the radiator with rainwater"], "Slowing down in heavy rain and keeping good tire tread depth prevents hydroplaning.", "none", ["everyday", "safety"]],
  ["Why should you never leave pets or children inside a parked car with the windows closed on a warm day?", ["Sunlight trapped through the glass causes the cabin temperature to rise to dangerous heatstroke levels within minutes", "They might change the radio station", "It drains the car battery", "It wears out the seat cushions"], "Greenhouse heating inside a parked car can raise interior temperatures by 20\xB0F+ in just 10 minutes.", "none", ["everyday", "safety"]],
  [`What is the purpose of a car's "Parking Brake" (Handbrake or Emergency Brake)?`, ["Holding the car stationary when parked\u2014especially on hills\u2014so it cannot roll", "Making the car accelerate faster on highways", "Turning on the headlights", "Locking the steering wheel while driving"], "The parking brake mechanically or electronically locks the rear wheels when parked.", "none", ["everyday", "brakes"]],
  ["What are the thin heating lines printed across the inside of a car's rear window used for?", ["Rear Window Defroster \u2014 warming the glass to melt frost, ice, and fog", "AM/FM Radio speakers", "Solar panels to charge the battery", "Brake light wires"], "Pressing the rear defroster button sends a gentle electric current through the grid lines to clear condensation and frost.", "none", ["everyday", "comfort"]],
  ['When driving at night with oncoming traffic approaching you, why must you switch from "High Beams" (brights) to "Low Beams"?', ["So your bright headlights do not blind oncoming drivers", "To save gasoline", "To make the car go faster", "Because high beams turn off the tail lights"], "Dipping your headlights to low beams prevents dazzling drivers coming the other way.", "none", ["everyday", "lights"]],
  ['What is "Car Insurance"?', ["A policy that helps pay for repair costs and medical bills if your car is in an accident or stolen", "A warranty that gives you free gasoline forever", "A license to drive above the speed limit", "A parking pass for airports"], "Liability and collision insurance protect drivers financially against road accidents.", "none", ["everyday", "ownership"]],
  ['What is a "Pickup Truck"?', ["A vehicle with an enclosed cab in front and an open cargo bed in the back for hauling loads", "A small two-seat convertible", "A double-decker city bus", "A racing car with no fenders"], "Pickup trucks feature an open rear bed with a drop-down tailgate.", "none", ["everyday", "types"]],
  ["What does `RPM` on the dashboard tachometer dial stand for?", ["Revolutions Per Minute \u2014 how fast the engine is spinning", "Road Miles Passed", "Rear Pressure Monitor", "Radio Power Mode"], "The tachometer shows engine crankshaft speed in thousands of Revolutions Per Minute (RPM).", "none", ["everyday", "dashboard"]],
  ['What is "Power Steering" in a modern car?', ["A hydraulic or electric assist system that makes turning the steering wheel light and easy, especially at parking speeds", "A steering wheel with radio buttons on it", "A self-driving robot pilot", "A heated steering wheel"], "Power steering multiplies the driver's hand effort so turning the wheels when parking takes minimal force.", "none", ["everyday", "controls"]],
  ['What does a yellow "Check Engine" light glowing on the dashboard indicate?', ["The car's computer has detected an issue with the engine or emissions system that should be checked with a diagnostic scanner", "The car is completely out of windshield washer fluid", "A passenger door is unlocked", "The radio volume is too high"], "An OBD-II diagnostic scan tool can read the trouble code stored when the Check Engine light turns on.", "none", ["everyday", "maintenance"]],
  ['What is "Regenerative Braking" in an electric or hybrid car?', ["Using the electric motor in reverse when slowing down to capture kinetic energy and put electricity back into the battery", "Replacing the brake pads automatically while driving", "Cooling the brakes with ice", "Braking with a parachute"], "Regenerative braking slows the vehicle while recharging the battery instead of wasting all energy as brake heat.", "none", ["everyday", "electric"]],
  [`What is the "VIN" (Vehicle Identification Number) visible through the bottom corner of a car's windshield?`, ["A unique 17-character serial code that identifies that exact car's make, model, year, and factory history", "The radio station preset number", "The tire size code", "The driver's phone number"], "Every road vehicle has a unique 17-character VIN used for registration, recalls, and history reports.", "none", ["everyday", "ownership"]],
  ['What is "Tinting" on car windows?', ["A thin darkened film applied to window glass to reduce sun glare, heat, and UV rays", "Painting the windows solid black so you cannot see out", "Replacing glass with cardboard", "Spraying water on the windshield"], "Window tint film blocks UV radiation and keeps the cabin cooler in sunny weather.", "none", ["everyday", "body"]],
  ['Which company makes the famous "Mustang" sports car and "F-150" pickup truck?', ["Ford", "Honda", "BMW", "Volvo"], "Ford Motor Company has produced the Mustang pony car since 1964 and the F-Series trucks since 1948.", "none", ["everyday", "brands"]],
  ["Which Japanese carmaker is famous for reliable models like the Corolla, Camry, and RAV4?", ["Toyota", "Ferrari", "Jeep", "Land Rover"], "Toyota is the world's largest automaker by volume, known for the Corolla, Camry, Prius, and RAV4.", "none", ["everyday", "brands"]],
  ['Which Italian sports car brand uses a "Prancing Horse" on a yellow shield as its famous badge and is known for bright red supercars?', ["Ferrari", "Volkswagen", "Subaru", "Hyundai"], "Ferrari, founded by Enzo Ferrari in Maranello, Italy, features the iconic Cavallino Rampante (Prancing Horse) emblem.", "none", ["everyday", "brands"]],
  ["Which German car brand has a logo made of four interlocking silver rings (`OOOO`)?", ["Audi", "Mercedes-Benz", "Porsche", "Opel"], "Audi's four rings represent the 1932 merger of four automakers: Audi, DKW, Horch, and Wanderer.", "none", ["everyday", "brands"]],
  ["Which German automaker uses a three-pointed star inside a circle as its famous hood emblem?", ["Mercedes-Benz", "Audi", "Renault", "Fiat"], "The Mercedes-Benz three-pointed star symbolizes engines for land, sea, and air.", "none", ["everyday", "brands"]],
  ['What is a "Roof Rack" on top of an SUV or station wagon used for?', ["Carrying bulky gear like bicycles, kayaks, skis, or a cargo box on the roof", "Improving radio reception", "Collecting rainwater", "Making the car quieter"], "Roof crossbars let travelers mount bike racks, ski carriers, or aerodynamic cargo boxes.", "none", ["everyday", "travel"]],
  ['What is "Car Detailing"?', ["A thorough deep cleaning, polishing, and waxing of a car's interior and exterior", "Drawing stripes on a car with markers", "Removing the doors from a car", "Driving a car very slowly"], "Detailing restores a car's paint shine and deep-cleans the upholstery and trim.", "none", ["everyday", "care"]],
  ['Why do drivers in snowy climates switch to "Winter Tires" (Snow Tires) during freezing months?', ["Winter tires use a special rubber compound that stays soft in freezing cold and deep tread sipes that grip snow and ice", "Winter tires have built-in heaters plugged into the battery", "Winter tires are made of solid plastic", "Winter tires are twice as wide as racing tires"], "Summer rubber hardens like plastic below 7\xB0C (45\xB0F), whereas winter tire compounds stay flexible and grip snow.", "none", ["everyday", "tires"]],
  [`What is an "Electronic Toll Tag" (like FASTag or E-ZPass) stuck to the inside of a car's windshield?`, ["A small RFID transponder that automatically pays highway tolls without stopping to hand over cash", "A thermometer that measures cabin temperature", "A dashcam that records movies", "A sticker that unlocks your house door"], "Electronic toll tags let vehicles pass through highway toll plazas automatically using a linked prepaid account.", "none", ["everyday", "driving"]],
  ['What is a "Dashcam" (Dashboard Camera)?', ["A small camera mounted inside the windshield that continuously records video of the road ahead while you drive", "A camera inside the fuel tank", "A screen for watching cartoons", "A sensor that measures tire pressure"], "Dashcams provide video evidence in case of a road accident or insurance claim.", "none", ["everyday", "accessories"]],
  ['What is the "Muffler" (or Silencer) underneath the back of a car?', ["An acoustic chamber in the exhaust system that quiets down the loud noise of engine combustion", "A filter that cleans cabin air", "A cushion inside the headrest", "A cover over the battery"], "Without a muffler, the rapid pressure pulses exiting the engine cylinders would be deafeningly loud.", "none", ["everyday", "exhaust"]],
  ['What does "Rotating Your Tires" during routine car service mean?', ["Moving the tires from front-to-back (or side-to-side) so all four tires wear down evenly and last longer", "Spinning the wheels in the air with your hands", "Flipping the tires inside out", "Painting the tires black"], "Because front tires handle steering and most braking weight, periodic tire rotation equalizes tread wear.", "none", ["everyday", "maintenance"]],
  ['What is "Wheel Alignment" at a tire shop?', ["Adjusting the angles of the wheels so the car drives straight without pulling to one side or wearing out tire edges prematurely", "Putting all four wheels in the trunk", "Washing the wheels with soap", "Inflating all tires to 100 PSI"], "Hitting potholes can knock suspension angles out of alignment, causing the steering wheel to pull or tires to wear unevenly.", "none", ["everyday", "maintenance"]],
  ['What is "Tailgating" on the road, and why is it dangerous?', ["Following the car in front of you too closely, leaving too little time and distance to stop if they brake suddenly", "Having a picnic in a park", "Driving with the trunk open", "Using turn signals too early"], "Keeping a safe 2-to-3-second following distance gives you time to react and brake safely.", "none", ["everyday", "safety"]],
  ['What is "Keyless Entry / Push-Button Start" in modern cars?', ["A system that senses your key fob in your pocket or bag so you can unlock the door and start the car by pressing a button", "A car that has no locks at all so anyone can drive it", "Starting the car by clapping your hands", "Unlocking the car with a coin"], "Proximity antennas verify your encrypted key fob inside the cabin when you press the Start/Stop button while holding the brake.", "none", ["everyday", "technology"]],
  [`What is "Apple CarPlay" or "Android Auto" on a car's dashboard screen?`, ["A system that mirrors your smartphone's maps, music, and hands-free calls safely onto the car's built-in display", "A robot that changes flat tires", "A video game console in the trunk", "A solar charger on the roof"], "CarPlay and Android Auto let drivers use Google Maps, Spotify, and voice calls safely through the car screen.", "none", ["everyday", "technology"]],
  ['What is the purpose of the "Headrest" (Head Restraint) at the top of a car seat?', ["Protecting your neck from whiplash injury by stopping your head from snapping backward if another car hits you from behind", "Holding a hat while driving", "Making the seat look taller", "Blocking the view out the back window"], "Properly adjusted head restraints significantly reduce neck whiplash in rear-end collisions.", "none", ["everyday", "safety"]],
  ['What does it mean if a car is "Front-Wheel Drive" (FWD)?', ["The engine sends power to the two front wheels, which both pull and steer the car", "The car only has two wheels in the front and none in the back", "The rear wheels steer the car", "The car can only drive uphill"], "Most everyday compact and midsize sedans use Front-Wheel Drive for packaging efficiency and good traction.", "none", ["everyday", "drivetrain"]],
  ["What happens if you put Diesel fuel into a regular Gasoline (Petrol) car or vice versa?", ["The engine can misfire or fail to run and the fuel system must be drained because gasoline and diesel ignite differently", "The car gets twice as much horsepower", "Nothing happens\u2014all fuels are identical", "The car turns into a hybrid"], "Gasoline and diesel engines use different fuel injection and ignition systems, so misfueling requires draining the tank.", "none", ["everyday", "fuel"]],
  ['What is a "Minivan" (or MPV / People Carrier)?', ["A spacious family vehicle with three rows of seats and sliding rear side doors for easy passenger entry", "A tiny one-seat city car", "A two-door racing coupe", "An armored bank truck"], "Minivans prioritize interior passenger space and sliding doors for families.", "none", ["everyday", "types"]],
  ['What is the "Coolant Temperature Gauge" on a car dashboard watching for?', ["Making sure the engine stays at a safe operating temperature and does not overheat", "Checking how cold the drinks in the cup holder are", "Measuring the temperature of the road asphalt", "Checking the weather in another city"], 'If the temperature needle climbs into the red "H" (Hot) zone, you should safely pull over and let the engine cool.', "none", ["everyday", "dashboard"]],
  ["Why do modern cars beep if you start driving without fastening your seatbelt?", ["A seatbelt reminder sensor detects weight in the seat and alerts you to buckle up for your safety", "The radio is broken", "The car wants you to drive faster", "The turn signal is stuck"], "Seatbelt reminder chimes significantly increase seatbelt use and save lives.", "none", ["everyday", "safety"]]
];
var HARD_CARS = [
  ["What are the four sequential strokes of a standard Nikolaus Otto four-stroke internal combustion engine?", ["Intake, Compression, Power (Combustion), Exhaust", "Ignition, Expansion, Cooling, Scavenging", "Suction, Boost, Injection, Release", "Charge, Spin, Fire, Vent"], "A four-stroke engine completes one thermodynamic cycle over two crankshaft revolutions (720\xB0): Intake, Compression, Power, and Exhaust.", "engine_four_stroke", ["engine", "four-stroke"]],
  ["Which drivetrain component allows the left and right driven wheels of a car to rotate at different speeds while cornering?", ["Differential", "Flywheel", "Harmonic Balancer", "Torque Tube"], "During a turn, the outside wheel travels a longer arc than the inside wheel; the differential splits torque while permitting speed differentiation.", "differential_torque", ["drivetrain", "differential"]],
  ["What drives the turbine wheel of an automotive exhaust gas turbocharger?", ["High-temperature, high-velocity exhaust gases exiting the engine cylinders", "A rubber serpentine belt connected to the crankshaft pulley", "An electric starter motor wired to the alternator", "Hydraulic pressure from the power steering pump"], "A turbocharger uses waste enthalpy and kinetic energy from exhaust gas to spin a turbine coupled by a shaft to an intake air compressor.", "turbocharger_flow", ["forced-induction", "turbo"]],
  ["What is the primary safety benefit of an Anti-lock Braking System (ABS) during an emergency panic stop?", ["Preventing wheel lockup so the tires retain lateral traction and the driver can steer around obstacles", "Doubling the hydraulic pressure applied to the rear drum shoes", "Disconnecting the steering column to keep the car straight", "Locking all four wheels simultaneously to create a rubber skid wedge"], "Locked sliding tires lose directional control; ABS modulates brake pressure rapidly via solenoid valves to keep tires near peak slip ratio so steering remains effective.", "none", ["brakes", "safety"]],
  ["Which engine component converts the linear up-and-down reciprocating motion of the pistons into rotational motion?", ["Crankshaft (via connecting rods)", "Camshaft", "Intake Manifold", "Throttle Body"], "Connecting rods link the reciprocating pistons to offset journals (crankpins) on the crankshaft, converting linear force into rotational torque.", "engine_four_stroke", ["engine", "crankshaft"]],
  ["In a gasoline spark-ignition engine, what ignites the compressed air-fuel mixture near Top Dead Center (TDC)?", ["An electric arc across the spark plug gap", "Pure compression heat alone without a spark plug", "A glow plug that stays lit continuously", "Laser beams inside the exhaust port"], "Spark-ignition (Otto cycle) engines use a high-voltage ignition coil and spark plug to initiate a controlled flame front.", "engine_four_stroke", ["ignition", "engine"]],
  ["How does a Diesel engine ignite its fuel charge during normal operation?", ["Heat generated by compressing intake air to a high compression ratio (15:1 to 22:1), followed by direct high-pressure fuel injection", "A distributor cap firing four spark plugs per cylinder", "Catalytic reaction inside the fuel tank", "Pre-mixing gasoline and oil in a carburetor"], "Diesel (compression-ignition) engines compress air until its temperature exceeds the auto-ignition point of atomized diesel fuel injected near TDC.", "engine_four_stroke", ["diesel", "engine"]],
  ["What is the role of the radiator and water pump in a liquid-cooled automotive engine?", ["Circulating coolant through engine water jackets and rejecting excess heat to ambient airflow across radiator fins", "Lubricating the crankshaft main bearings with water", "Pressurizing the air conditioning cabin vents with steam", "Filtering carbon soot out of the exhaust tailpipe"], "A closed-loop coolant mixture (water and ethylene/propylene glycol) absorbs combustion heat from the block/head and dissipates it through the radiator.", "none", ["cooling", "engine"]],
  ['On a tire sidewall marking such as "245/40 R18", what do the numbers 245, 40, and 18 represent?', ["245 mm section width, sidewall height equal to 40% of width (aspect ratio), Radial construction, 18-inch rim diameter", "245 mph max speed, 40 PSI max pressure, 18 mm tread depth", "245 kg load limit, 40 mm width, 18-ply nylon bias", "24.5-inch outer diameter, 4.0-inch width, 18 lug nuts"], "ISO metric tire codes specify nominal width in millimeters (245), aspect ratio as a percentage of width (40%), construction (R = Radial), and wheel diameter in inches (18).", "none", ["tires", "wheels"]],
  ["Which emissions control device uses precious metals (platinum, palladium, rhodium) to convert CO, unburned HC, and NOx into CO2, H2O, and N2?", ["Three-Way Catalytic Converter", "Blow-off Valve", "Mass Airflow Sensor", "Viscous Fan Clutch"], "A three-way catalytic converter simultaneously reduces nitrogen oxides (NOx) to nitrogen and oxidizes carbon monoxide (CO) and hydrocarbons (HC).", "none", ["emissions", "exhaust"]],
  ["What does DOHC stand for in engine valvetrain design?", ["Dual Overhead Camshaft", "Direct Oil Hydraulic Cylinder", "Dynamic Octane High Compression", "Differential Output Hub Carrier"], "DOHC places two camshafts per cylinder bank in the cylinder head\u2014one dedicated to intake valves and one to exhaust valves.", "engine_four_stroke", ["valvetrain", "dohc"]],
  ["What is the primary purpose of an intercooler (charge air cooler) in a turbocharged or supercharged car?", ["Cooling the compressed intake air charge to increase air density and reduce knock propensity before it enters the cylinders", "Cooling the transmission gear oil during towing", "Heating the windshield washer fluid in winter", "Silencing the exhaust muffler noise"], "Compressing air raises its temperature (ideal gas law); an intercooler removes that heat, increasing oxygen mass per unit volume and preventing detonation.", "turbocharger_flow", ["turbo", "intercooler"]],
  ["In a manual transmission vehicle, what happens when the driver depresses the clutch pedal?", ["The pressure plate releases the clutch friction disc from the engine flywheel, interrupting torque flow to the gearbox input shaft", "The rear differential locks both axles together", "The alternator stops charging the 12V battery", "The engine camshafts reverse rotation direction"], "Disengaging the clutch decouples engine inertia from the transmission input shaft so synchronizers can match gear speeds smoothly.", "transmission_gears", ["transmission", "clutch"]],
  ["Which electrical device charges the 12V battery and powers the vehicle's electrical systems while the engine is running?", ["Alternator", "Starter Solenoid", "Ignition Condenser", "Knock Sensor"], "Driven by the accessory belt, the alternator generates three-phase AC power and rectifies it via a diode bridge into regulated ~13.8V\u201314.4V DC.", "none", ["electrical", "alternator"]],
  ["What does AWD (All-Wheel Drive) do differently from a traditional part-time 4WD transfer case without a center differential?", ["AWD can power all four wheels continuously on dry paved roads by using a center differential or active clutch pack to allow front-to-rear speed differences", "AWD only drives the front left and rear right wheels", "AWD requires the driver to exit the car and manually lock front hubs", "AWD disconnects the rear brakes above 30 mph"], "Part-time 4WD locks front and rear driveshafts together (causing driveline windup on dry pavement), whereas AWD accommodates front/rear axle speed differences continuously.", "differential_torque", ["drivetrain", "awd"]],
  ["What is the stoichiometric air-to-fuel mass ratio for standard unleaded gasoline (where lambda \u03BB = 1.0)?", ["14.7 : 1 (14.7 parts air to 1 part fuel by mass)", "9.0 : 1", "22.5 : 1", "5.0 : 1"], "Complete chemical oxidation of standard gasoline requires approximately 14.7 grams of air for every 1 gram of fuel (\u03BB = 1.0).", "engine_four_stroke", ["combustion", "stoichiometric"]],
  ["How does a Torsen (Torque-Sensing) Limited-Slip Differential (LSD) bias torque to the wheel with higher grip?", ["Using worm gears and worm wheels whose high internal friction under load resists relative speed difference and multiplies torque to the slower-spinning (high-traction) wheel", "By applying the rear parking brake cable on the spinning wheel", "By shutting off fuel injectors on half of the engine", "Using an open bevel gear set with zero friction"], "Torsen differentials use helical/worm gearing where mesh friction is proportional to transmitted torque, mechanically biasing torque by its Torque Bias Ratio (TBR).", "differential_torque", ["differential", "torsen"]],
  ["Why is an equal-length Double Wishbone (or unequal-length SLA) suspension preferred over a MacPherson strut in dedicated sports cars?", ["Upper and lower A-arms allow engineers to tune negative camber gain under compression independently of steering axis inclination", "Double wishbones use zero bushings and never require wheel alignment", "MacPherson struts require two shock absorbers per wheel", "Double wishbones increase unsprung mass by 300%"], "An unequal-length double wishbone (Short-Long Arm) geometry induces negative camber as the suspension compresses in body roll, keeping the outer tire contact patch flat.", "suspension_wishbone", ["suspension", "geometry"]],
  ["What is the key operational difference between a Dual-Clutch Transmission (DCT / PDK) and a conventional planetary automatic transmission?", ["A DCT uses two concentric wet or dry clutches\u2014one for odd gears (1, 3, 5, 7) and one for even gears (2, 4, 6, R)\u2014pre-selecting the next ratio for near-instantaneous power-on shifts", "A DCT uses a rubber V-belt on variable pulleys", "A DCT requires a manual foot clutch pedal for 1st gear", "A DCT has only two forward gears"], "By pre-engaging the next gear on the inactive input shaft and swapping clutch engagement simultaneously, a DCT eliminates torque interruption without a torque converter.", "transmission_gears", ["transmission", "dct"]],
  ["In a turbocharged engine, what are the distinct functions of a Wastegate vs. a Blow-Off Valve (BOV / Diverter Valve)?", ["The wastegate bypasses exhaust gas around the turbine to regulate maximum boost pressure; the BOV vents pressurized intake air when the throttle closes to prevent compressor surge", "Both valves inject nitrous oxide into the intake manifold", "The wastegate vents engine oil; the BOV regulates fuel pressure", "The wastegate sits in the intake pipe; the BOV sits inside the muffler"], "The wastegate sits on the hot exhaust side to control turbine speed and boost target; the BOV/diverter sits on the cold intake side to prevent pressure waves from stalling the spinning compressor when the throttle plate snaps shut.", "turbocharger_flow", ["turbo", "wastegate"]],
  ["How does a belt-driven Supercharger differ from an exhaust-driven Turbocharger?", ["A supercharger is mechanically driven directly by the engine crankshaft via a belt, providing instant boost with zero lag at the cost of parasitic crank power loss", "A supercharger is spun by exhaust gas in the tailpipe", "A supercharger only works when the car is coasting downhill", "A turbocharger is driven by the alternator belt"], "Superchargers (Roots, Twin-Screw, or Centrifugal) are coupled mechanically to the crankshaft, delivering immediate low-RPM boost.", "turbocharger_flow", ["forced-induction", "supercharger"]],
  ['In engine cylinder layout terminology, what makes a "Boxer" (Flat) engine like those in Porsche 911 and Subaru Models distinct from a 180\xB0 V-engine?', [`Each opposing piston has its own crankpin offset by 180\xB0, so opposing pairs move outward together and inward together ("punching" like boxers' gloves)`, "All pistons sit vertically in a single straight line", "Two pistons share a single combustion chamber", "The engine block rotates around the crankshaft"], "In a true Boxer engine, opposing pistons reach Top Dead Center simultaneously, balancing primary forces naturally with a very low center of gravity.", "engine_four_stroke", ["engine", "boxer"]],
  ["What is the function of the Engine Control Unit (ECU) reading the Oxygen (O2 / Lambda) sensor in the exhaust stream?", ["Measuring unburned oxygen in the exhaust gas to trim fuel injector pulse width and keep the air-fuel mixture near stoichiometric (\u03BB = 1.0)", "Measuring the temperature of the rear tires", "Controlling the power window motors", "Adjusting the seat height"], "Closed-loop fuel injection relies on upstream wideband O2 sensors to continuously fine-tune injector fueling.", "engine_four_stroke", ["ecu", "sensors"]],
  ['What does "Understeer" mean when a car is driven fast through a corner?', ["The front tires lose grip before the rear tires, causing the car to push wide toward the outside of the turn despite steering input", "The rear tires slide out first, spinning the tail of the car toward the outside", "The brakes lock up in a straight line", "The steering wheel turns twice as fast"], 'In understeer ("push"), the front axle exceeds its slip angle limit first so the car follows a wider radius than the driver steered.', "suspension_wishbone", ["handling", "dynamics"]],
  ['What does "Oversteer" mean when cornering in a car?', ["The rear tires lose lateral traction before the front tires, causing the tail of the car to step out toward the outside of the corner", "The front tires plow straight off the corner", "The transmission shifts into overdrive early", "The power steering pump overheats"], 'In oversteer ("loose"), the rear slip angle exceeds the front slip angle, rotating the nose inward toward the apex.', "suspension_wishbone", ["handling", "dynamics"]],
  ["In a four-stroke engine, at what speed does the Camshaft rotate relative to the Crankshaft?", ["Exactly half (1/2) the speed of the crankshaft", "Twice (2x) the speed of the crankshaft", "The exact same (1:1) speed as the crankshaft", "Four times (4x) the speed of the crankshaft"], "Because each cylinder fires once every two crankshaft revolutions (720\xB0), the timing belt/chain drives the camshaft at a 1:2 ratio (360\xB0 per cycle).", "engine_four_stroke", ["valvetrain", "timing"]],
  ['What happens if an "Interference Engine" snaps its rubber timing belt while running?', ["The pistons collide with open intake or exhaust valves because their swept paths overlap, bending valves", "The engine simply idles smoothly until refueled", "The air conditioning blows warm air", "The rear differential locks up"], "In an interference design, valve lift extends into the volume swept by the piston at TDC, requiring precise camshaft-crankshaft synchronization.", "engine_four_stroke", ["engine", "timing"]],
  ['What is the purpose of a "Synchromesh" (Synchronizer Ring / Baulk Ring) inside a manual gearbox?', ["Using a brass friction cone to match the rotational speed of the gear and dog clutch collar before engagement, preventing gear grinding", "Multiplying engine horsepower by 50%", "Pumping power steering fluid", "Cooling the rear brakes"], "Synchronizer cones equalize shaft and gear speeds as you move the shift lever so the dog teeth mesh smoothly without double-clutching.", "transmission_gears", ["transmission", "manual"]],
  ['In suspension tuning, what is the difference between the "Spring" and the "Shock Absorber" (Damper)?', ["The spring supports the vehicle weight and stores energy when compressed; the shock absorber dissipates that kinetic energy as heat in hydraulic oil to stop bouncing oscillations", "The shock absorber supports 100% of the car's weight at rest", "The spring is filled with hydraulic fluid", "They are two names for the exact same part"], "Without dampers, a car on coil springs would continue bouncing up and down after every bump.", "suspension_wishbone", ["suspension", "damping"]],
  [`What is "Negative Camber" on a car's wheel alignment?`, ["The top of the tire tilts inward toward the center of the car when viewed from the front, improving outer tire contact patch grip during hard cornering", "The top of the tire tilts outward away from the car", "The front of the tires point inward toward each other (toe-in)", "The tire is under-inflated"], "Negative camber counteracts tire roll and body roll in corners so the loaded outside tire sits flat on the tarmac.", "suspension_wishbone", ["alignment", "camber"]]
];
var VERY_HARD_CARS = [
  ["Why does a naturally aspirated Flat-Plane Crankshaft V8 (180\xB0 crankpin offsets) rev more eagerly and scavenge exhaust differently than a Cross-Plane V8 (90\xB0 crankpin offsets)?", ["A flat-plane V8 fires alternating left-right cylinder banks evenly (like two inline-4s), eliminating heavy counterweights for lower rotational inertia and avoiding same-bank consecutive exhaust pulses, at the cost of higher secondary vibration", "A flat-plane V8 uses only 4 pistons for 8 cylinders", "A cross-plane V8 cannot exceed 3,000 RPM", "Flat-plane crankshafts require two separate transmissions"], "Cross-plane V8s have 90\xB0 pins requiring heavy counterweights to balance primary rocking couples and have uneven bank firing, whereas flat-plane V8s have 180\xB0 pins, low polar moment of inertia, and clean 180\xB0 exhaust scavenging per bank.", "engine_four_stroke", ["v8", "crankshaft"]],
  ["In suspension kinematics, what defines the Roll Center height, and what happens if the geometric Roll Center is raised too close to the vehicle's Center of Gravity (CG)?", ['The Roll Center is the instantaneous point in the transverse plane through which lateral tire forces are transferred directly into the sprung chassis via suspension links; raising it reduces the roll moment arm (less body roll) but increases "jacking forces" that lift the chassis while cornering', "Raising the Roll Center increases body roll by 500%", "The Roll Center is fixed at the roof antenna", "Lowering the Roll Center eliminates all lateral load transfer"], 'Lateral force acting through a high Roll Center creates a vertical reaction component ("jacking force") that pushes the sprung mass upward and reduces suspension compliance over mid-corner bumps.', "suspension_wishbone", ["suspension", "kinematics"]],
  ["In a Twin-Scroll Turbocharger paired with an inline-4 engine (firing order 1-3-4-2), why are cylinders 1 & 4 paired into one exhaust scroll and cylinders 2 & 3 paired into the other scroll?", ["Because cylinders 1 & 4 are separated by 360\xB0 crank angle (as are 2 & 3), preventing the high-pressure exhaust blowdown pulse of one cylinder from back-flowing into a cylinder currently in valve overlap", "Because cylinders 1 & 4 burn diesel while 2 & 3 burn gasoline", "To shut down half of the turbocharger during highway cruising", "Because cylinders 1 & 4 have twice the bore diameter of 2 & 3"], "In a 1-3-4-2 inline-4, pairing 1+4 and 2+3 ensures exhaust pulses within each scroll occur every 360\xB0 rather than 180\xB0, eliminating exhaust pulse interference during valve overlap scavenging.", "turbocharger_flow", ["turbo", "twin-scroll"]],
  ["What is the exact formula for swept engine displacement $V_d$ of a multi-cylinder reciprocating engine with bore $B$, stroke $S$, and cylinder count $N$?", ["V_d = (\u03C0 / 4) \xD7 B\xB2 \xD7 S \xD7 N", "V_d = \u03C0 \xD7 B \xD7 S \xD7 N", "V_d = (1 / 2) \xD7 B\xB3 \xD7 N", "V_d = B \xD7 S\xB2 / N"], "Each cylinder is a right circular cylinder with cross-sectional area \u03C0 \xD7 (B/2)\xB2 = (\u03C0/4)B\xB2 multiplied by stroke S and total cylinders N.", "engine_four_stroke", ["engine", "math"]],
  ["In brake system engineering, why do fixed multi-piston calipers use staggered (differential) piston diameters from the leading edge to the trailing edge of the brake pad?", ["To counteract frictional self-energization (pad taper wear), where rotor drag pulls the leading edge of the pad harder against the disc than the trailing edge", "Because smaller pistons travel faster than the speed of sound", "To lock the front wheels before the rear wheels", "To pump brake fluid back into the master cylinder reservoir"], "As the spinning rotor drags across the pad face, friction creates a moment that digs the leading edge into the rotor; using a smaller piston at the leading edge and a larger piston at the trailing edge equalizes contact pressure across the pad.", "none", ["brakes", "hydraulics"]],
  ["In high-speed cornering tire dynamics, why does total lateral axle grip decrease when lateral load transfer increases (such as from stiffening an anti-roll bar on that axle)?", ["Because pneumatic tire lateral force vs. vertical load is non-linear and concave-down (load sensitivity): the outside tire gains less lateral force from \u0394Fz than the unloaded inside tire loses", "Because anti-roll bars physically lift both tires off the asphalt", "Because rubber coefficient of friction increases linearly to infinity with vertical load", "Because stiffening the front anti-roll bar locks the steering rack"], "Due to tire load sensitivity (d\u03BC/dFz < 0), transferring \u0394Fz from the inside wheel to the outside wheel reduces the combined lateral capability of that axle pair, shifting steady-state balance toward understeer (if front stiffened) or oversteer (if rear stiffened).", "suspension_wishbone", ["tire-dynamics", "handling"]],
  ["In internal combustion engine thermodynamics, why does a Miller Cycle (or Atkinson Cycle via Variable Valve Timing) engine achieve higher thermal efficiency than a conventional Otto Cycle engine?", ["By holding the intake valve open into the early compression stroke (or closing it early), making the effective expansion ratio larger than the effective compression ratio so more work is extracted before exhaust blowdown", "By eliminating the exhaust stroke and venting gases through the oil pan", "By running a 4:1 expansion ratio with a 20:1 compression ratio", "By burning coolant water alongside gasoline"], "Over-expansion (Expansion Ratio > Compression Ratio) lowers knock tendency during compression while expanding combustion gases to a lower pressure and temperature before opening the exhaust valve, recovering work that would otherwise be lost as exhaust heat.", "engine_four_stroke", ["thermodynamics", "atkinson"]],
  ["In a Formula 1 or LMP hybrid powertrain (MGU-K + MGU-H), how does the MGU-H (Motor Generator Unit - Heat) eliminate turbo lag while recovering exhaust energy without a traditional wastegate?", ["Mounted coaxially on the turbocharger shaft, the MGU-H harvests excess turbine shaft power as electrical energy at high exhaust flow (replacing wastegate dumping) and acts as an electric motor to spin the compressor to target RPM during off-throttle braking/cornering", "The MGU-H boils radiator coolant to drive a steam piston on the front axle", "The MGU-H uses Peltier thermocouples glued to the exhaust tailpipe", "The MGU-H locks the rear differential during straight-line DRS zones"], "By coupling a high-speed (~125,000 RPM) electric motor-generator directly to the turbo shaft, the MGU-H controls boost speed electronically while sending harvested electrical power directly to the MGU-K or energy store.", "turbocharger_flow", ["hybrid", "motorsport"]]
];
var CAR_POWERTRAIN_FACTS = [
  ["Wankel Rotary Engine (Mazda 13B-MSP Renesis)", "Uses a triangular epitrochoidal rotor orbiting an eccentric shaft, completing three combustion phases per rotor revolution without reciprocating pistons or valves", "Uses 12 reciprocating pistons arranged in a W configuration", "Operates on a two-stroke diesel cycle with glow plugs", "Uses external steam boilers mounted in the trunk"],
  ["Porsche VarioCam Plus / Honda VTEC Valvetrain", "Switches hydraulically between a mild low-RPM cam lobe profile (for smooth idle and low-end torque) and a high-lift, long-duration cam lobe profile (for high-RPM volumetric efficiency)", "Disconnects the crankshaft from the pistons during braking", "Reverses engine rotation for reverse gear", "Replaces metal valve springs with wooden dowels"],
  ["Dry-Sump Lubrication System", "Uses multi-stage scavenging pumps to evacuate oil from a shallow pan into a tall external reservoir with deaeration baffles, preventing oil starvation under extreme lateral cornering G-forces and allowing the engine to sit lower in the chassis", "Operates the engine with zero liquid oil using powdered graphite", "Mixes engine oil directly into the fuel tank like a chainsaw", "Cools the engine using open-air fins without oil pumps"],
  ["Variable Geometry Turbocharger (VGT / VNT)", "Uses pivoting guide vanes around the turbine inlet to maintain high exhaust gas velocity at low engine RPM (fast spool) and open wide at high RPM to prevent excessive backpressure", "Changes the physical diameter of the engine pistons while driving", "Uses a variable-length rubber intake hose", "Disconnects the turbine shaft above 2,500 RPM"],
  ["E85 Flex-Fuel Ethanol Blend (85% Ethanol, 15% Gasoline)", "Has a lower stoichiometric air-fuel ratio (~9.8:1) requiring ~30\u201335% more fuel volume, but offers a high research octane rating (~105\u2013108 RON) and high latent heat of vaporization that cools the intake charge in boosted engines", "Requires 50% less fuel volume than pure gasoline", "Has an octane rating of 65 RON and causes instant knock", "Can only be burned in two-stroke marine outboards"],
  ["Planetary Gearset (Epicyclic Gearing in Automatic Transmissions & e-CVTs)", "Consists of a central Sun Gear, orbiting Planet Gears on a Carrier, and an outer Ring (Annulus) Gear, enabling multiple forward/reverse ratios or power-split blending without sliding dog clutches", "Uses a single chain and derailleur like a road bicycle", "Requires manual double-clutching between every shift", "Can only transmit torque in reverse"],
  ["Torque Converter Stator & Lock-Up Clutch", "The one-way stator redirects fluid returning from the turbine to multiply torque at launch (up to ~2.0\u20132.5x), while the mechanical lock-up clutch bridges impeller and turbine at cruise to eliminate hydraulic slip heat loss", "Multiplies engine RPM by 10x while dividing torque by 10x", "Uses dry friction pads only with zero transmission fluid", "Prevents the vehicle from idling while stationary"],
  ["Haldex / Multi-Plate Electronically Controlled Center Coupling", "Varies hydraulic clamping pressure on a wet multi-plate clutch pack in milliseconds based on throttle position, steering angle, and wheel slip sensors to distribute torque proactively between front and rear axles", "Permanently welds the front and rear axles at a fixed 50:50 ratio with no slip", "Uses wind turbines mounted under the chassis", "Only engages when the vehicle is in reverse"],
  ["Ackermann Steering Geometry", "Angles the steering arms inward so the inside front wheel steers to a sharper angle than the outside front wheel during a turn, aligning both front wheel axes with the common turn center to prevent tire scrubbing", "Turns both front wheels to the exact same parallel angle regardless of turn radius", "Steers the rear wheels in the opposite direction at 150 mph", "Locks the inside front brake during every turn"],
  ["Anti-Dive and Anti-Squat Suspension Geometry", "Angles the side-view suspension control arm pivots (instant center) so longitudinal braking or drive forces generate a vertical reaction moment through the links that resists nose-dive or rear-end squat without requiring overly stiff springs", "Eliminates shock absorbers completely", "Inflates airbags under the bumpers during braking", "Disconnects the sway bars under acceleration"]
];
var CAR_CHASSIS_AND_AERO_FACTS = [
  ["Venturi Underbody Ground Effect Tunnels", "Accelerates airflow through a constricted throat beneath the car floor (Bernoulli principle), creating a low-pressure suction zone that generates high downforce with significantly lower induced drag than large top-surface wings", "Pushes air downward from the roof using heavy cast-iron weights", "Creates positive lift to help the car float over potholes", "Blocks all airflow from passing beneath the vehicle"],
  ["Carbon-Ceramic Matrix (CCM / C/SiC) Brake Rotors", "Withstand extreme operating temperatures (>900\xB0C) without thermal fade, resist corrosion, and reduce unsprung rotating mass by ~50% compared to cast-iron rotors of equivalent size", "Weigh twice as much as cast-iron rotors and melt at 200\xB0C", "Require no brake pads or hydraulic fluid", "Can only be used on rear drum brakes"],
  ["Unsprung vs. Sprung Mass Dynamics", "Reducing unsprung mass (wheels, tires, brakes, hubs) lowers the inertia of the wheel assembly after hitting a road irregularity, allowing the damper and spring to keep the tire contact patch pressed against the pavement more consistently", "Increasing wheel weight by 50 kg per corner improves ride comfort over sharp bumps", "Unsprung mass includes the engine block, seats, and passengers", "Sprung mass has zero effect on center of gravity height"],
  ["Brake Proportioning / Electronic Brakeforce Distribution (EBD)", "Reduces hydraulic brake pressure to the rear axle as longitudinal deceleration shifts vertical weight onto the front tires, preventing premature rear wheel lockup and spin-out instability", "Applies 100% of braking force to the rear wheels only", "Disables the front brakes during wet weather", "Increases rear brake pressure as the rear tires lift off the ground"],
  ["Caster Angle in Front Suspension Alignment", "Positive caster tilts the steering axis backward at the top in side view, creating a mechanical trail that generates self-centering steering torque at speed and increases negative camber on the outside wheel when steered into a corner", "Caster measures the inward tilt of the top of the tire from the front view", "Caster measures the toe-in distance between the front and rear of the tires", "Negative caster of 45 degrees is standard on highway cruisers"],
  ["Scrub Radius (Kingpin Offset at the Ground)", "The lateral distance at ground level between the steering axis intersection point and the center of the tire contact patch; a small negative or near-zero scrub radius stabilizes braking when left and right wheels are on split-mu (ice/asphalt) surfaces", "The total diameter of the steering wheel inside the cabin", "The height of the rear spoiler above the trunk lid", "The thickness of the windshield glass"],
  ["Monocoque / Carbon Fiber Tub Chassis Torsional Rigidity", "Measured in Nm per degree of twist between the front and rear suspension pickup planes; high torsional stiffness ensures suspension springs and anti-roll bars\u2014not chassis flex\u2014dictate wheel load transfer", "Allows the car frame to twist 30 degrees in every corner so springs are unnecessary", "Measures the aerodynamic drag coefficient Cd", "Indicates the fuel tank capacity in liters"],
  ["Gasoline Direct Injection (GDI) vs. Port Fuel Injection (PFI)", "GDI injects fuel at high pressure (150\u2013350+ bar) directly into the combustion chamber, cooling the cylinder charge to allow higher compression ratios and leaner stratified operation, though pure GDI leaves intake valve backs unwashed by fuel", "GDI sprays fuel into the air filter box at 1 bar pressure", "PFI injects fuel directly into the exhaust catalytic converter", "GDI engines cannot use turbochargers"],
  ["Compression Ratio vs. Octane Rating (RON / MON / AKI)", "Higher static or dynamic compression ratios raise peak cylinder temperatures and pressures; high-octane fuel resists premature auto-ignition (detonation/knock) ahead of the spark-initiated flame front", "High-octane fuel burns with twice the heat energy per liter of regular gasoline", "Low-octane fuel is required for 14:1 compression racing engines", "Octane rating measures the viscosity of engine oil"],
  ["Active Roll Stabilization (48V Electromechanical Anti-Roll Bars)", "Uses an inline electric rotary actuator with planetary gears at the center of the anti-roll bar to decouple left and right wheels on straight bumpy roads for comfort, then applies active counter-torque in corners to keep the body flat", "Drains the fuel tank to lower vehicle weight during turns", "Locks the steering wheel straight ahead on highways", "Replaces rubber tires with solid steel rims"]
];
function buildCarsTier(baseTuples, difficulty, targetCount, extraPool, diagramDefault) {
  const items = [];
  for (let i = 0; i < baseTuples.length && items.length < targetCount; i++) {
    const [qText, opts, exp, diag, tags] = baseTuples[i];
    items.push({
      code: `cars_${difficulty.toLowerCase().replace(/\s+/g, "_")}_${items.length + 1}`,
      categorySlug: "cars",
      difficulty,
      questionText: qText,
      options: opts,
      explanation: exp,
      diagramType: diag,
      tags,
      estimatedTimeSec: difficulty === "Easy" ? 15 : difficulty === "Normal" ? 25 : difficulty === "Hard" ? 40 : 60
    });
  }
  let idx = 0;
  while (items.length < targetCount) {
    const fact = extraPool[idx % extraPool.length];
    const variantRound = Math.floor(idx / extraPool.length);
    const [subject, correctDesc, w1, w2, w3] = fact;
    const questionText = variantRound === 0 ? `In automotive engineering, how does ${subject} function and what is its primary mechanical advantage?` : variantRound === 1 ? `When designing a performance or production automobile, which engineering statement accurately describes ${subject}?` : `During a vehicle dynamics and powertrain analysis, what is the defining mechanism of ${subject}?`;
    items.push({
      code: `cars_${difficulty.toLowerCase().replace(/\s+/g, "_")}_${items.length + 1}`,
      categorySlug: "cars",
      difficulty,
      questionText,
      options: [correctDesc, w1, w2, w3],
      explanation: `${subject}: ${correctDesc}.`,
      diagramType: idx % 3 === 0 ? diagramDefault : "none",
      tags: ["automotive", "engineering", subject.toLowerCase().split(" ")[0]],
      estimatedTimeSec: difficulty === "Hard" ? 40 : 60
    });
    idx++;
  }
  return items;
}
var CARS_QUESTIONS = [
  ...buildCarsTier(EASY_CARS, "Easy", 50, [], "none"),
  ...buildCarsTier(NORMAL_CARS, "Normal", 50, [], "none"),
  ...buildCarsTier(HARD_CARS, "Hard", 50, [...CAR_POWERTRAIN_FACTS, ...CAR_CHASSIS_AND_AERO_FACTS], "differential_torque"),
  ...buildCarsTier(VERY_HARD_CARS, "Very Hard", 50, [...CAR_CHASSIS_AND_AERO_FACTS, ...CAR_POWERTRAIN_FACTS], "suspension_wishbone")
];

// src/db/banks/motorcyclesBank.ts
var EASY_MOTO = [
  ["How many wheels does a standard motorcycle have?", ["2 wheels", "4 wheels", "6 wheels", "8 wheels"], "A standard motorcycle rides on two inline wheels\u2014one in the front and one in the back.", "none", ["basics", "wheels"]],
  ["What hard protective gear MUST a motorcycle rider wear on their head to stay safe?", ["A Motorcycle Helmet", "A Baseball Cap", "A Paper Crown", "A Wool Beanie"], "A certified motorcycle helmet protects the rider's head and brain in case of a fall or accident.", "none", ["basics", "safety"]],
  ["Instead of a round steering wheel like a car, what does a motorcycle rider hold onto with both hands to steer?", ["Handlebars", "A Steering Wheel", "A Ship Rudder", "Foot Pedals"], "Motorcycles are steered using left and right handlebars at the top of the front fork.", "none", ["basics", "controls"]],
  ["What metal leg folds down from the bottom of a motorcycle to keep it standing upright when parked?", ["Kickstand (or Side Stand)", "Bumper", "Windshield Wiper", "Spare Tire"], "Flipping down the kickstand leans and supports the parked motorcycle so it does not tip over.", "none", ["basics", "parking"]],
  ["What is the clear flip-down shield on the front of a full-face motorcycle helmet that protects your eyes from wind and bugs?", ["Helmet Visor (Face Shield)", "Sunroof", "Rearview Mirror", "Mudguard"], "The helmet visor shields the rider's eyes and face from wind, rain, dust, and insects.", "none", ["basics", "gear"]],
  ["Where does a motorcycle rider place their feet while riding down the road?", ["On the Footpegs (or Footboards)", "On the front tire", "Inside the fuel tank", "On the handlebars"], "Footpegs stick out on the left and right sides of the motorcycle to support the rider's feet.", "none", ["basics", "ergonomics"]],
  ["How does a rider make a motorcycle speed up using their right hand?", ["By twisting the right handlebar grip (Throttle)", "By clapping both hands", "By pushing the headlight", "By honking the horn"], "Twisting the right-hand throttle grip backward opens the throttle to make the motorcycle accelerate.", "none", ["basics", "controls"]],
  ["What kind of motorcycle is built with knobby tires and tall suspension for riding on muddy trails and dirt hills?", ["Dirt Bike (Off-Road / Motocross Bike)", "Submarine", "Golf Cart", "Snowplow"], "Dirt bikes are lightweight motorcycles with deep-tread knobby tires built for off-road trails and jumps.", "none", ["basics", "types"]],
  ["What do we call the small extra one-wheeled passenger pod that can be attached beside a motorcycle, giving it 3 wheels in total?", ["Sidecar", "Trunk", "Trailer Hitch", "Roof Box"], "A sidecar attaches to the side of a motorcycle and has its own third wheel and seat for a passenger.", "none", ["basics", "types"]],
  ["Does a regular motorcycle have doors and a roof around the rider like a car?", ["No, the rider sits out in the open air", "Yes, it has four doors and a trunk", "Yes, it has sliding glass windows", "Yes, it has a bedroom inside"], "Motorcycles are open-air vehicles without doors or an enclosed cabin.", "none", ["basics", "design"]],
  ["What metal loop Chain on the back wheel of many motorcycles looks just like a bigger, stronger version of a bicycle part?", ["Drive Chain", "Shoelace", "Seatbelt", "Rubber Band"], "Many motorcycles use a steel roller chain and toothed sprockets to spin the rear wheel, just like a bicycle.", "none", ["basics", "drivetrain"]],
  ["Which wheel of a motorcycle turns left and right when you move the handlebars?", ["The Front Wheel", "The Rear Wheel", "Both wheels equally", "Neither wheel"], "The handlebars are connected through the front forks to the front wheel.", "none", ["basics", "steering"]],
  ["Which wheel of a motorcycle is pushed forward by the engine and chain?", ["The Rear (Back) Wheel", "The Front Wheel", "A hidden middle wheel", "The handlebars"], "In almost all motorcycles, the engine powers the rear wheel.", "none", ["basics", "drivetrain"]],
  ["Why do motorcycle riders wear thick jackets, gloves, and boots even on warm days?", ["To protect their skin and hands if they ever slide or fall on the road", "To make the motorcycle heavier", "Because motorcycles have air conditioners inside", "To hide their watch"], "Protective riding gear (jackets, gloves, pants, and boots) shields the rider from scrapes, wind, and weather.", "none", ["basics", "safety"]],
  ["Where is the fuel tank usually located on a classic motorcycle?", ["Right in front of the rider's seat, between the handlebars and the saddle", "Inside the front tire", "Hanging from the mirrors", "Inside the helmet"], "On most motorcycles, the metal fuel tank sits on top of the frame right in front of the rider.", "none", ["basics", "anatomy"]],
  ["What small step-through two-wheeler has a flat floorboard for your feet and smaller wheels, popular for easy city rides?", ["Scooter (like a Vespa or Activa)", "Monster Truck", "Tractor", "Train"], "Scooters have a step-through frame, automatic twist-and-go transmission, and a floorboard for the rider's feet.", "none", ["basics", "types"]],
  ["When a motorcycle turns around a corner at speed, what does the rider and bike naturally do?", ["Lean into the turn", "Jump straight up in the air", "Fold in half", "Spin in a circle"], "Two-wheeled vehicles lean inward toward the inside of a turn to balance cornering forces.", "none", ["basics", "riding"]],
  ["Where does a second person (a passenger) sit when riding along on a two-seat motorcycle?", ["On the passenger seat right behind the rider, holding onto grab handles", "On the front fender over the wheel", "Standing on the handlebars", "Inside the exhaust pipe"], "A motorcycle passenger sits on the rear pillion seat behind the main rider and uses the passenger footpegs.", "none", ["basics", "passenger"]],
  ["Must a motorcycle passenger ALSO wear a safety helmet?", ["Yes, both the rider and the passenger must wear helmets", "No, only the person steering needs a helmet", "No, passengers wear sunglasses instead", "Only when riding backward"], "Every person riding on a motorcycle\u2014driver or passenger\u2014needs a properly fastened helmet.", "none", ["basics", "safety"]],
  ["What bright light on the front of a motorcycle stays on to help the rider see and help car drivers spot the motorcycle?", ["Headlight", "Tailpipe", "Kickstand", "Spoke"], "Most modern motorcycles keep their front headlight on at all times so other drivers can see them clearly.", "none", ["basics", "lights"]],
  ["What light at the very back of a motorcycle glows brighter red whenever the rider slows down with the brakes?", ["Brake Light (Tail Light)", "Turn Key", "Speedometer", "Chain Guard"], "The red rear brake light warns drivers behind the motorcycle that it is slowing down.", "none", ["basics", "lights"]],
  [`What button on the left handlebar of a motorcycle makes a "BEEP" sound to warn a car that didn't see you?`, ["Horn Button", "Kickstand", "Fuel Cap", "Mirror"], "Just like a car, a motorcycle has a horn button on the left handlebar to alert nearby traffic.", "none", ["basics", "controls"]],
  ["What curved cover sits right above the front and back tires of a motorcycle to stop mud and puddle water from splashing up?", ["Fender (or Mudguard)", "Speaker", "Glove Box", "Wiper"], "Front and rear fenders block water, mud, and small pebbles thrown up by the spinning tires.", "none", ["basics", "body"]],
  ["What happens if you let go of a parked motorcycle WITHOUT putting the kickstand down first?", ["It will tip over and fall onto its side", "It will float upright by itself", "It will drive away slowly", "It will fold into a suitcase"], "Because a two-wheeled motorcycle cannot balance itself at rest, you must always lower the kickstand before stepping off.", "none", ["basics", "parking"]],
  ["What two mirrors mounted on the left and right handlebars let the rider see traffic behind them?", ["Side Mirrors (Rearview Mirrors)", "Telescopes", "Headlights", "Visors"], "Left and right handlebar mirrors give the rider a view of the lanes behind them.", "none", ["basics", "mirrors"]],
  ["What hot metal pipe runs along the bottom or side of a gasoline motorcycle and lets out engine sound and exhaust?", ["Exhaust Pipe (Muffler)", "Handlebar", "Kickstand", "Front Fork"], "The exhaust pipe and muffler get very hot while the engine is running, so riders are careful not to touch them.", "none", ["basics", "exhaust"]],
  ["What do we call a three-wheeled motorcycle (with one wheel in front and two in the back, or vice versa)?", ["Trike (Three-Wheeler)", "Unicycle", "Quadcopter", "Skateboard"], "A three-wheeled motorcycle is called a trike.", "none", ["basics", "types"]],
  ["What four-wheeled off-road vehicle with motorcycle handlebars and big low-pressure tires is ridden on farms, sand dunes, and trails?", ["ATV (Quad Bike / Four-Wheeler)", "Road Bicycle", "Scooter", "Subway Car"], "An ATV (All-Terrain Vehicle) or Quad Bike has four wheels and uses handlebars and a thumb throttle.", "none", ["basics", "types"]],
  ["Why is riding a motorcycle in heavy rain or ice trickier than driving a 4-wheeled car?", ["A motorcycle only has two tires touching the road and can slip more easily on wet or icy surfaces", "Motorcycles dissolve in rainwater", "Rain makes the motorcycle twice as heavy", "The handlebars stop turning when wet"], "With only two small tire contact patches, riders slow down and brake gently on wet or slippery roads.", "none", ["basics", "safety"]],
  ["What strap under your chin MUST be buckled for a motorcycle helmet to stay on your head in an accident?", ["Chin Strap", "Shoelace", "Belt Buckle", "Watch Band"], "An unbuckled helmet can fly off in a fall, so fastening the chin strap snug is essential.", "none", ["basics", "safety"]],
  ["What do police officers riding motorcycles use to signal a speeding driver to pull over?", ["Flashing Blue/Red Police Lights and a Siren", "Throwing a paper airplane", "Waving a broom", "Turning off their headlight"], "Police motorcycles are equipped with emergency lights and sirens for traffic patrol.", "none", ["basics", "vehicles"]],
  ["What is the soft padded part on top of a motorcycle where the rider sits?", ["Seat (or Saddle)", "Fender", "Radiator", "Sprocket"], "The motorcycle seat (or saddle) is cushioned with foam so the rider can sit comfortably.", "none", ["basics", "anatomy"]],
  ["Which famous sport features riders on dirt bikes racing over outdoor tracks with big dirt hills and jumps?", ["Motocross", "Swimming", "Ice Hockey", "Archery"], "Motocross races take place on closed off-road dirt circuits with jumps and berms.", "none", ["basics", "racing"]],
  ["How do you unlock and turn on a motorcycle's electrical power before starting the engine?", ["Turn the Ignition Key (or wireless key fob)", "Spin the front wheel three times", "Tap the rear mirror", "Press the rear tire"], "Turning the ignition key turns on the dashboard and allows the starter button to work.", "none", ["basics", "controls"]],
  ["On modern motorcycles, how do you start the engine after turning on the key?", ["Press the Electric Starter Button with your thumb", "Push the bike down a hill every time", "Spin the rear wheel by hand", "Blow into the exhaust pipe"], "Modern motorcycles have an electric starter button on the right handlebar.", "none", ["basics", "controls"]],
  ["On older motorcycles or dirt bikes, what lever on the side of the engine did riders stomp downward with their boot to start the engine?", ["Kickstarter", "Gear Shifter", "Side Stand", "Passenger Peg"], "Before electric starters became universal, riders pushed down a kickstarter lever with their foot to crank the engine.", "none", ["basics", "history"]],
  ["What clear plastic screen at the front of a touring motorcycle blocks heavy wind from hitting the rider's chest on the highway?", ["Windscreen (or Windshield)", "Mud Flap", "Chain Guard", "License Plate"], "A windscreen deflects oncoming highway wind over and around the rider.", "none", ["basics", "comfort"]],
  ["What locking storage box can be mounted on the tail rack behind the motorcycle seat to hold a helmet or school bag?", ["Top Box (or Tail Trunk)", "Glove Box", "Fuel Tank", "Oil Pan"], "A lockable top box on the rear rack keeps a helmet or groceries dry and secure.", "none", ["basics", "luggage"]],
  ["What bags hang on the left and right sides of the back wheel on a travel motorcycle, just like bags on a horse?", ["Saddlebags (or Panniers)", "Backpacks on the front wheel", "Cup holders", "Toolboxes under the engine"], "Saddlebags (panniers) mount on both sides of the rear wheel to carry clothes and travel gear.", "none", ["basics", "luggage"]],
  ["What shows the rider how fast the motorcycle is traveling in mph or km/h?", ["Speedometer on the handlebar dashboard", "The front brake lever", "The chain links", "The kickstand"], "The speedometer display sits right between the handlebars in the rider's line of sight.", "none", ["basics", "dashboard"]],
  ["What blinking amber lights on the front and back of a motorcycle tell cars that the rider is turning left or right?", ["Turn Signals (Indicators)", "Headlight High Beam", "License Plate Light", "Oil Light"], "Motorcycle turn signals flash left or right to communicate lane changes and turns.", "none", ["basics", "lights"]],
  ["Why is it helpful for motorcycle riders to wear bright or reflective clothing at night?", ["So car and truck drivers can see the rider from far away in their headlights", "To keep the motorcycle battery charged", "To make the motorcycle go faster", "To block the wind"], "High-visibility reflective strips reflect car headlights, making a motorcyclist much easier to spot in the dark.", "none", ["basics", "safety"]],
  ["What part of a motorcycle holds the air inside the rubber wheels, just like on a bicycle or car?", ["Tires (Tubeless or Inner Tube)", "Metal Spokes", "Brake Discs", "Shock Springs"], "Motorcycle tires hold compressed air and provide all the grip for braking, turning, and accelerating.", "none", ["basics", "tires"]],
  ["What metal springs and tubes on the front and back of a motorcycle soak up bumps and potholes in the road?", ["Suspension (Front Forks and Rear Shock)", "Exhaust Pipes", "Mirrors", "Turn Signals"], "The front forks and rear shock absorber cushion bumps so the ride is smooth and controlled.", "none", ["basics", "suspension"]],
  ["Can a motorcycle squeeze into a smaller parking space than a full-size car?", ["Yes, several motorcycles can fit in the space of one car", "No, a motorcycle is wider than a bus", "No, motorcycles cannot be parked", "Only if you take the wheels off"], "Because motorcycles are narrow and compact, they take up much less parking space than cars.", "none", ["basics", "everyday"]],
  ["What do delivery riders on scooters and motorcycles often carry on their back or rear rack to keep pizza and food warm?", ["An Insulated Food Delivery Box / Bag", "A cardboard shoebox", "A bucket of water", "A metal cage"], "Insulated thermal delivery bags keep hot food warm while riders deliver orders.", "none", ["basics", "everyday"]],
  ["What should a rider always check on their tires before going for a long motorcycle ride?", ["That the tires are properly inflated with air and not flat or worn out", "That the tires are painted blue", "That the tires are square", "That the tires are covered in soap"], "Checking tire air pressure and tread before riding is one of the most important safety habits.", "none", ["basics", "maintenance"]],
  ["Which famous American motorcycle brand is known for big, loud, chrome V-twin cruiser bikes?", ["Harley-Davidson", "Ferrari", "Boeing", "Nintendo"], "Founded in Milwaukee in 1903, Harley-Davidson is famous worldwide for its heavyweight cruiser motorcycles.", "none", ["basics", "brands"]],
  ['Which classic motorcycle brand, originally British and now based in Chennai, India, is famous for the "Bullet" and "Classic 350"?', ["Royal Enfield", "Lamborghini", "Rolex", "Nikon"], "Royal Enfield is the oldest motorcycle brand in continuous production, famous for the Bullet and Classic 350.", "none", ["basics", "brands"]],
  ["What red switch on the right handlebar lets the rider shut off the engine immediately in an emergency without taking their hands off the grips?", ["Engine Kill Switch (Stop Switch)", "Horn Button", "Turn Signal Switch", "Mirror Adjuster"], "The red thumb kill switch cuts engine ignition immediately if needed.", "none", ["basics", "controls"]]
];
var NORMAL_MOTO = [
  ['When someone says a motorcycle has a "150cc" or "650cc" engine, what does `cc` stand for?', ["Cubic Centimeters \u2014 the size (volume) of the engine cylinders", "Cruise Control speed", "Coolant Capacity in liters", "Carbon Coating thickness"], "`cc` stands for cubic centimeters and measures the swept volume of the engine cylinders; larger `cc` engines generally produce more power.", "none", ["everyday", "engine"]],
  ['What is a "Cruiser" motorcycle (like a Harley-Davidson or Royal Enfield Meteor)?', ["A comfortable road bike with a low seat height, laid-back riding posture, and strong low-speed torque", "A tall dirt bike with no lights for jumping hills", "A tiny folding electric scooter", "A three-wheeled cargo van"], "Cruisers feature low seats, relaxed handlebars, and easy highway comfort.", "none", ["everyday", "types"]],
  ['What is a "Sportbike" (or Supersport motorcycle)?', ["A sleek, aerodynamic motorcycle with full plastic fairings, a leaned-forward riding posture, and high-revving performance", "A heavy motorcycle with a sofa seat and trailer hitch", "A farm bike with wooden wheels", "A scooter with a shopping basket"], "Sportbikes are built for sharp handling, strong braking, and aerodynamic speed.", "none", ["everyday", "types"]],
  ['What is an "Adventure Bike" (ADV / Dual-Sport motorcycle)?', ["A tall, versatile motorcycle designed to ride comfortably on both paved highways and unpaved gravel/dirt roads", "A motorcycle that only works indoors", "A bike with no suspension", "A miniature pocket bike for children"], "Adventure motorcycles combine long-distance highway comfort with long-travel suspension for rough roads.", "none", ["everyday", "types"]],
  ['What is a "Pillion" on a motorcycle?', ["The rear seat or the passenger riding behind the main motorcyclist", "The front headlight bulb", "The rubber grip on the handlebar", "The exhaust muffler tip"], 'Riding "pillion" means riding as a passenger on the back seat behind the rider.', "none", ["everyday", "terms"]],
  ['Why do many scooters use a "CVT" (Automatic Twist-and-Go transmission) instead of a foot gear shifter?', ["So the rider can simply twist the throttle and brake with hand levers without operating a manual clutch or shifting gears", "To make the scooter weigh 500 kilograms", "Because scooters do not have brakes", "So the scooter can only go in reverse"], "Automatic CVT scooters are popular in city traffic because there is no clutch lever or gear shifting required.", "none", ["everyday", "scooters"]],
  ["On an automatic scooter (like a Honda Activa or Vespa), where are BOTH the front and rear brake controls located?", ["On the left and right handlebar levers (just like a bicycle)", "On two floor pedals", "Inside the seat cushion", "On the rearview mirrors"], "Because an automatic scooter has no manual clutch lever, the right hand lever operates the front brake and the left hand lever operates the rear brake.", "none", ["everyday", "scooters"]],
  ['What is a "Center Stand" (Main Stand) on a motorcycle or scooter, compared to a side kickstand?', ["A two-legged stand under the frame that lifts the rear wheel slightly off the ground and holds the bike straight upright for parking or chain cleaning", "A stand mounted on top of the helmet", "A pole that holds up the windshield", "A footrest for the passenger"], "Lifting a bike onto its center stand keeps it completely vertical and frees the rear wheel for easy maintenance.", "none", ["everyday", "maintenance"]],
  ["Why are painted white road stripes, crosswalks, and metal manhole covers extra hazardous for motorcyclists when wet?", ["Wet paint and smooth metal have much less grip than asphalt, so motorcycle tires can slip easily if braking or leaning hard on them", "They make the tires too hot", "They drain the motorcycle battery", "They block the speedometer"], "Motorcyclists avoid braking or leaning sharply over wet road paint, steel plates, and manhole covers.", "none", ["everyday", "safety"]],
  ['What is "Lane Splitting" or "Filtering" in traffic?', ["Riding a motorcycle slowly between lanes of stopped or slow-moving cars (legal in some regions, illegal in others)", "Splitting a motorcycle frame into two pieces", "Riding with one wheel on the sidewalk", "Changing a tire in the middle of the road"], "Filtering moves a narrow motorcycle between stationary traffic queues where local traffic laws allow it.", "none", ["everyday", "traffic"]],
  ['Which four Japanese brands are famously known as the "Big Four" motorcycle manufacturers?', ["Honda, Yamaha, Kawasaki, and Suzuki", "Toyota, Nissan, Mazda, and Subaru", "Sony, Panasonic, Canon, and Nikon", "BMW, Ducati, Triumph, and KTM"], "Honda, Yamaha, Kawasaki, and Suzuki are the four major Japanese motorcycle makers.", "none", ["everyday", "brands"]],
  ["Which famous Italian scooter brand has been making stylish metal-bodied scooters like the Primavera and GTS since 1946?", ["Vespa", "Ducati", "Scania", "Airbus"], 'Vespa (which means "wasp" in Italian) was launched by Piaggio in 1946 and became an icon of urban mobility.', "none", ["everyday", "brands"]],
  ["Which British motorcycle brand is famous for the Bonneville, Street Triple, and Tiger adventure bikes?", ["Triumph", "Jaguar", "Bentley", "Vauxhall"], "Triumph Motorcycles is the largest British motorcycle manufacturer, iconic for its Bonneville twins and three-cylinder bikes.", "none", ["everyday", "brands"]],
  ["Which German automaker also builds famous touring and adventure motorcycles like the GS series?", ["BMW (BMW Motorrad)", "Volkswagen", "Porsche", "Mercedes-Benz"], "BMW Motorrad has been building motorcycles since 1923, famous for its flat-twin GS adventure bikes and S1000RR superbike.", "none", ["everyday", "brands"]],
  ['Which Austrian motorcycle manufacturer is famous for its bright orange dirt bikes and "Duke" street bikes?', ["KTM", "Volvo", "Saab", "Skoda"], "KTM is renowned for its signature orange off-road, motocross, and street motorcycles.", "none", ["everyday", "brands"]],
  ["What are the plastic aerodynamic body panels covering the engine and front of a sportbike called?", ["Fairings", "Bumpers", "Shutters", "Curtains"], "Motorcycle fairings smooth airflow around the bike and rider to reduce wind drag.", "none", ["everyday", "anatomy"]],
  ['What is a "Naked Bike" (or Standard / Streetfighter motorcycle)?', ["A road motorcycle without plastic side fairings, leaving the engine and frame visibly exposed with an upright handlebar", "A motorcycle without any wheels", "A motorcycle with no brakes", "A bicycle with no chain"], "Naked bikes strip away bulky plastic fairings for a clean look and comfortable upright city ergonomics.", "none", ["everyday", "types"]],
  ['What is a "Touring Motorcycle" (such as a Honda Gold Wing)?', ["A large, comfortable motorcycle built for long highway trips with big windscreens, plush seats, and built-in luggage trunks", "A lightweight bike with no seat for jumping logs", "A child's battery toy bike", "A single-speed beach bike"], "Touring motorcycles are engineered to cover hundreds of highway miles in comfort.", "none", ["everyday", "types"]],
  ['What is the purpose of "ABS" (Anti-lock Braking System) on a modern motorcycle?', ["It prevents the front or rear wheel from locking up and skidding during hard emergency braking, helping keep the bike upright", "It makes the motorcycle accelerate twice as fast", "It automatically washes the windshield", "It locks the handlebars when parked"], "A front-wheel skid on a two-wheeler can cause an instant fall; motorcycle ABS pulses brake pressure to prevent wheel lockup.", "none", ["everyday", "safety"]],
  ["Why do motorcycle chains need periodic cleaning and chain lube spray?", ["Because the chain is exposed to road dust and rain; cleaning and lubricating prevents rust, wear, and stiff links", "To make the chain change color", "Because chain spray is burned as engine fuel", "To make the rear tire slippery"], "Keeping an O-ring chain clean and lubricated every few hundred miles extends the life of both the chain and sprockets.", "none", ["everyday", "maintenance"]],
  ['What is a "Full-Face Helmet" vs. an "Open-Face (Half) Helmet"?', ["A full-face helmet has a solid protective chin bar and visor covering the entire head, face, and jaw, whereas an open-face helmet leaves the chin exposed", "A full-face helmet covers your shoulders and knees", "An open-face helmet is worn backward", "They offer the exact same jaw protection"], "Safety studies show that the chin and jaw area experience a large share of crash impacts, making full-face helmets the safest choice.", "none", ["everyday", "gear"]],
  ["Why do many motorcycle helmets have a secondary dark drop-down inner sun visor or tinted shield?", ["To block harsh sun glare during daytime riding without having to carry separate sunglasses", "To let the rider sleep while riding", "To project movies inside the helmet", "To keep rain out of the exhaust pipe"], "An internal drop-down sun visor flips down with a slider lever when riding toward bright sunlight.", "none", ["everyday", "gear"]],
  ['What is a "Pinlock" insert used for inside a motorcycle helmet visor?', ["Stopping the visor glass from fogging up from your breath on cold or rainy days", "Locking the helmet to the motorcycle wheel", "Playing music inside the helmet", "Making the helmet heavier"], "A Pinlock lens creates a sealed double-pane air pocket inside the visor that prevents condensation and fogging.", "none", ["everyday", "gear"]],
  ['What is a "Bluetooth Helmet Intercom" (like Sena or Cardo) used for by motorcyclists?', ["Letting riders talk to their passenger or riding group, hear GPS turn directions, and take hands-free phone calls inside their helmet", "Controlling traffic lights on the street", "Inflating the tires wirelessly", "Warming up the engine oil"], "Helmet Bluetooth communicators use flat speakers inside the helmet ear pockets and a small boom mic.", "none", ["everyday", "accessories"]],
  ['Why do many riders install "Crash Bars" (Engine Guards) or "Frame Sliders" on the sides of their motorcycle?', ["So if the bike tips over in a parking lot or low-speed slide, those replaceable guards touch the ground first and protect the expensive engine and fuel tank", "To carry surfboards on the side", "To make the motorcycle wider than a car", "To hold extra gasoline"], "Engine guards and frame sliders absorb tip-over impacts and save costly body panels and crankcases.", "none", ["everyday", "accessories"]],
  ['What is a "Disc Lock" used for when parking a motorcycle on the street?', ["A heavy hardened-steel lock that clamps through a hole in the brake disc rotor so a thief cannot roll the wheel away", "A button that locks the radio station", "A cap for the fuel tank", "A clamp that holds the throttle open"], "A disc lock prevents the wheel from rotating and often includes a motion alarm.", "none", ["everyday", "security"]],
  ['What happens when you lock the "Steering Lock" with the key after parking a motorcycle?', ["It locks the handlebars turned to the side so the bike cannot be steered straight or pushed away easily", "It locks the rear suspension solid", "It drains the fuel tank", "It turns on the high beams"], "Turning the handlebars full-left and turning the key to the Lock position engages a steel pin in the steering head.", "none", ["everyday", "security"]],
  ['Why do motorcycles have a "Neutral (`N`)" green indicator light on the dashboard?', ["To show the rider that the gearbox is in Neutral (not in gear), so the bike will not lurch forward when the clutch lever is released", "To show that the fuel tank is full of nitrogen", "To indicate night mode", "To warn that the tires are cold"], "Checking for the green `N` light confirms the transmission is disengaged before releasing the clutch at a stop.", "none", ["everyday", "dashboard"]],
  ["Why do many modern motorcycles automatically refuse to start or cut the engine if you put the bike into 1st gear while the side kickstand is still down?", ["As a safety feature so you never accidentally ride off with the metal kickstand sticking down, which could catch on the pavement in a left turn", "To save battery power while parked", "Because the kickstand disconnects the spark plug wire", "To keep the rear tire clean"], "The side-stand safety cutout switch prevents riders from riding away with the side stand deployed.", "none", ["everyday", "safety"]],
  ['What is an "Electric Motorcycle" or "Electric Scooter" (like an Ather, Ola, or Zero)?', ["A two-wheeler powered by a rechargeable lithium-ion battery and silent electric motor with zero tailpipe emissions", "A gasoline bike with extra headlights", "A motorcycle that must stay plugged into a wall cord while riding", "A pedal bicycle"], "Electric two-wheelers offer instant quiet acceleration and charge at home or fast-charging stations.", "none", ["everyday", "electric"]],
  ["Why do motorcycles generally get better fuel mileage (more km/L or MPG) than full-size cars?", ["Because a motorcycle weighs a fraction of what a car weighs, requiring much less energy to accelerate and cruise", "Because motorcycles use special magic gasoline", "Because motorcycle fuel tanks are bigger than car tanks", "Because motorcycles only drive downhill"], "Weighing ~120\u2013220 kg instead of ~1,500+ kg for a car allows commuter motorcycles to achieve 40\u201365+ km/L.", "none", ["everyday", "fuel"]],
  ['What is a "Caf\xE9 Racer" style motorcycle?', ["A lightweight, minimalist classic-styled motorcycle with low handlebars and a humped solo seat inspired by 1960s British riders", "A delivery van that sells coffee", "A four-wheeled golf cart", "A giant touring trike"], "Caf\xE9 racers blend vintage stripped-down styling with sporty low clip-on handlebars.", "none", ["everyday", "types"]],
  ['What is a "Chopper" motorcycle?', ["A custom cruiser motorcycle featuring long extended front forks, high handlebars, and a low stretched frame", "A motorcycle with helicopter blades", "A lawnmower engine on a skateboard", "A snow bike with skis"], "Choppers are famous for their raked-out long front forks and custom styling.", "none", ["everyday", "types"]],
  ["Why do motorcycle riders wear gloves with knuckle armor and reinforced palms?", ["Because in any fall, human instinct is to put your hands out first\u2014gloves protect palms and fingers from asphalt abrasion and cold wind", "To keep the handlebar grips from getting fingerprints", "To make it easier to use a smartphone", "Because handlebars are covered in glue"], "Riding gloves protect hands from flying road pebbles, cold wind chill, and pavement scrapes.", "none", ["everyday", "safety"]],
  ['What is "CE Armor" inside a motorcycle riding jacket and pants?', ["Flexible impact-absorbing pads placed at the shoulders, elbows, back, knees, and hips that stiffen on impact to cushion bones", "Heavy medieval steel plates", "Inflatable water balloons", "Cardboard stiffeners for fashion"], "CE-rated viscoelastic armor stays soft and comfortable while riding but absorbs shock energy in an impact.", "none", ["everyday", "safety"]],
  ["What is the top speed / premier class of world championship road-racing motorcycles called?", ["MotoGP", "Formula 1", "NASCAR", "Tour de France"], "MotoGP is the premier class of FIM Grand Prix motorcycle road racing, featuring 1,000cc prototype superbikes.", "none", ["everyday", "racing"]],
  ['What is the purpose of "Heated Grips" on a motorcycle?', ["Warming the rider's hands through the handlebar grips when riding in cold weather", "Melting ice on the front tire", "Keeping the gasoline warm", "Drying wet gloves in the trunk"], "Electric heating elements inside the handlebar grips keep fingers warm and nimble on chilly rides.", "none", ["everyday", "comfort"]],
  ['Why do some motorcycles have a "Liquid-Cooled" engine with a radiator while others are "Air-Cooled" with metal fins on the cylinder?', ["Air-cooled engines use airflow over metal fins for simplicity, while liquid-cooled engines circulate coolant through a radiator for tighter temperature control and higher power", "Air-cooled engines run on compressed air instead of fuel", "Liquid-cooled engines ride underwater", "Air-cooled engines have no pistons"], "Metal cooling fins on classic bikes radiate heat directly to the wind, while modern high-output bikes use a liquid radiator.", "none", ["everyday", "engine"]],
  ['What is a "Tank Bag" on a motorcycle?', ["A small luggage bag that straps or clips onto the top of the fuel tank right in front of the rider for quick access to essentials", "A plastic bag inside the gas tank", "A cover for the rear wheel", "A tool for draining oil"], "Tank bags sit conveniently on the fuel tank and often have a clear top pocket or phone mount.", "none", ["everyday", "luggage"]],
  ["Why should a motorcyclist position themselves in the lane where they can see the car driver's face in the car's side mirror?", ["Because if you can see the driver's eyes in their mirror, the driver is able to see you and you are not hidden in their blind spot", "To read the car's dashboard clock", "To block the sun", "To draft behind the car's bumper"], "Staying out of car blind spots and maintaining a clear sightline to the driver's mirrors is a core defensive riding habit.", "none", ["everyday", "safety"]],
  ["What happens if you grab a big handful of the front brake abruptly while the motorcycle handlebars are turned sharply at slow parking-lot speed?", ["The front end can dive and tuck inward, causing the bike to tip over at low speed", "The bike will jump backward", "The rear tire will pop", "The horn will sound"], "At walking speeds with the bars turned, riders use gentle rear brake and smooth clutch control rather than grabbing the front brake.", "none", ["everyday", "riding"]],
  ['What is a "Tachometer" on a motorcycle instrument cluster?', ["The dial or bar graph that shows engine speed in thousands of RPM (Revolutions Per Minute) and marks the redline limit", "The fuel gauge", "The compass", "The tire pressure display"], "The tachometer shows engine RPM and helps the rider shift before the redline.", "none", ["everyday", "dashboard"]],
  ['What does the "Redline" on a motorcycle tachometer mean?', ["The maximum safe engine RPM speed beyond which the engine should not be revved", "The minimum speed for highway riding", "That the battery is low", "That the rear brake is applied"], "Modern motorcycles have a rev limiter near the redline to protect the engine from over-revving.", "none", ["everyday", "engine"]],
  ['What is a "Moped"?', ["A light low-powered two-wheeler (historically with bicycle pedals plus a small motor) designed for low-speed local commuting", "A heavy 1,800cc highway cruiser", "A 6-wheel delivery truck", "A racing dirt bike"], 'The word "moped" originated from combining "motor" and "pedal" for lightweight urban commuters.', "none", ["everyday", "types"]],
  ["Why do motorcycle tires have a rounded profile (curved from side to side) while car tires have a flat, square tread face?", ["So that as the motorcycle leans over into a corner, a smooth, wide patch of rubber stays in contact with the road", "To make the motorcycle bounce higher", "Because rounded tires never need air", "To fit inside bicycle racks"], "A curved tire cross-section allows a motorcycle to lean smoothly up to 40\u201350\xB0 while maintaining a consistent contact patch.", "none", ["everyday", "tires"]],
  ['What is a "Sissy Bar" (Passenger Backrest) on a cruiser motorcycle?', ["An upright backrest bar behind the rear passenger seat that gives the passenger support and a place to strap a bag", "A handlebar for steering from the back seat", "A stand that holds the front wheel", "An exhaust pipe that points straight up"], "Cruiser passengers lean back against the padded backrest (sissy bar) for comfort and security.", "none", ["everyday", "accessories"]],
  ["Why should you let a cold motorcycle engine warm up for a minute and ride gently at first before revving it hard?", ["So the engine oil can warm up and circulate fully to protect all moving parts", "Because the tires are square when cold", "So the headlight can warm up", "Because the brakes do not work when cold"], "Letting engine oil reach operating temperature ensures proper lubrication before high-RPM riding.", "none", ["everyday", "maintenance"]],
  ['What is "Engine Braking" on a motorcycle?', ["When you roll off the throttle while in gear, the natural compression resistance of the engine helps slow the motorcycle down smoothly", "Throwing an anchor out from the engine", "Dragging your boots on the pavement", "Turning off the ignition key on a hill"], "Rolling off the throttle uses engine vacuum and compression to decelerate the bike smoothly.", "none", ["everyday", "riding"]],
  ['What is a "Quick-Release Buckle" or "Double D-Ring" on a motorcycle helmet?', ["The secure fastening mechanism on the helmet chin strap", "The lock on the motorcycle saddlebag", "The cap on the tire air valve", "The adjustment on the rearview mirror"], "Double D-rings and micrometric quick-release ratchets are the two standard ways helmet chin straps fasten securely.", "none", ["everyday", "gear"]],
  ['Before turning or changing lanes on a motorcycle, what is a "Lifesaver Glance" (Shoulder Check)?', ["Briefly turning your head to look over your shoulder into your blind spot before moving over, in addition to checking your mirrors", "Looking down at the front tire", "Closing your eyes and honking", "Standing up on the seat"], "A quick head check over your shoulder catches any car hidden in your mirror's blind spot.", "none", ["everyday", "safety"]]
];
var HARD_MOTO = [
  ["On a standard manual-transmission motorcycle, which handlebar or foot control operates the front brake?", ["Right handlebar lever", "Left handlebar lever", "Left foot lever", "Right foot pedal"], "By universal convention on modern motorcycles, the right handlebar lever actuates the front brake master cylinder, while the right foot pedal operates the rear brake.", "moto_radial_brake", ["controls", "brakes"]],
  ["Which control operates the clutch on a standard manual-transmission motorcycle?", ["Left handlebar lever", "Right handlebar lever", "Right foot pedal", "Left foot shifter"], "Squeezing the left handlebar lever disengages the multi-plate clutch so the rider can shift gears using the left foot lever.", "moto_chain_drive", ["controls", "clutch"]],
  ['What is the standard shift pattern ("1-down, 5-up") of a 6-speed sequential motorcycle gearbox?', ["1st gear at the bottom, Neutral half-click above 1st, followed upward by 2nd, 3rd, 4th, 5th, and 6th", "Neutral at the very bottom, followed by 6th down to 1st", "Reverse at the bottom, followed by 1st through 5th", "H-pattern gate identical to a manual car"], "Motorcycle sequential transmissions place 1st gear all the way down, Neutral between 1st and 2nd, and higher gears sequentially upward.", "moto_chain_drive", ["transmission", "shifting"]],
  ["Which final drive system is most commonly used on sportbikes because of its low weight, high mechanical efficiency, and easy gearing changes via sprockets?", ["Roller Chain and Sprockets (O-ring / X-ring chain)", "Heavy Cast-Iron Shaft Drive", "Hydraulic Fluid Hose Drive", "Friction Roller Against the Tire Tread"], "Chain drive delivers ~95\u201398% mechanical efficiency, minimal unsprung weight compared to shaft drive, and quick final-drive ratio tuning by swapping front/rear sprockets.", "moto_chain_drive", ["drivetrain", "chain"]],
  ["What is the primary steering technique required to initiate a lean and turn a motorcycle above ~15\u201320 mph?", ["Countersteering \u2014 pressing forward on the handlebar grip on the side toward which you want to turn (press right, lean right, go right)", "Turning the front wheel sharply in the direction of the turn without leaning", "Dragging the rear brake until the rear tire slides sideways", "Standing on the passenger footpegs"], "Pressing the right bar momentarily steers the front contact patch slightly left, causing the bike's center of mass to lean to the right and establish the right-hand cornering arc.", "moto_swingarm_anti_squat", ["riding", "dynamics"]],
  ['Why do most motorcycles use a "wet multi-plate clutch" bathed in engine oil rather than a single dry disc like a car?', ["Multiple stacked smaller-diameter friction and steel plates transmit high torque in a compact package while oil cools the plates during low-speed feathering", "Because a wet clutch never needs friction material", "To allow engine oil to leak onto the rear tire for lubrication", "Because dry clutches cannot spin faster than 1,000 RPM"], "A compact stack of alternating friction and steel plates multiplies surface area within a narrow crankcase cover, and oil carries heat away during clutch slip.", "moto_chain_drive", ["clutch", "engine"]],
  ['What is the purpose of a motorcycle "slipper clutch" (back-torque limiter) during aggressive downshifts?', ["Allowing controlled clutch slip when rear-wheel back-torque exceeds engine speed, preventing rear wheel hop or lockup under heavy braking", "Automatically shifting into 6th gear at idle", "Locking the rear wheel for stunt slides", "Disabling the front brake when the clutch is pulled"], "Helical ramps inside the clutch hub push the pressure plate slightly open under reverse torque from the rear wheel, smoothing aggressive downshifts.", "moto_chain_drive", ["clutch", "slipper"]],
  ["What happens to a motorcycle's acceleration and top speed if you replace the rear sprocket with one that has MORE teeth (e.g., going from 43T to 46T)?", ["Increases rear-wheel torque multiplication for stronger acceleration, while raising engine RPM at a given road speed (lowering theoretical top speed)", "Increases top speed by 30 mph and lowers engine RPM", "Has zero effect on final drive ratio", "Reverses the rotation of the rear wheel"], "A larger driven (rear) sprocket or smaller driving (countershaft) sprocket increases the numerical final-drive ratio, trading top speed for brisker acceleration.", "moto_chain_drive", ["sprockets", "gearing"]],
  ["What is the main advantage of a Shaft Final Drive (used on large touring and adventure motorcycles like the BMW R1300GS) over an exposed chain?", ["Virtually maintenance-free enclosed operation shielded from road grit, requiring only periodic hypoid gear oil changes rather than frequent cleaning and chain lubrication", "Weighs 80% less than a racing 520 chain", "Allows changing gear ratios in 2 minutes at the racetrack", "Zero parasitic power loss across 90-degree bevel gears"], "An enclosed driveshaft and bevel gear final drive runs in an oil bath for tens of thousands of miles without chain slack adjustments or messy lube spray.", "moto_chain_drive", ["drivetrain", "shaft"]],
  ["Which component connects the rear wheel axle to the motorcycle's main frame pivot and houses the rear suspension motion?", ["Swingarm", "Triple Clamp (Yoke)", "Clip-on Handlebar", "Stator Cover"], "The swingarm pivots at the frame behind the gearbox output shaft, allowing the rear wheel to move vertically controlled by the shock absorber.", "moto_swingarm_anti_squat", ["chassis", "swingarm"]],
  ['Which Italian motorcycle manufacturer is famous for its signature "Desmodromic" valvetrain system?', ["Ducati", "Moto Guzzi", "MV Agusta", "Aprilia"], "Engineered by Fabio Taglioni at Ducati in the 1950s, the Desmodromic system uses two cam lobes and two rocker arms per valve\u2014one to open the valve and a second to mechanically pull it closed without relying on coil valve springs.", "moto_desmodromic", ["ducati", "desmodromic"]],
  ["In a motorcycle carburetor (or throttle body intake), what physical principle causes fuel to be drawn up from the float bowl into the airstream passing through the narrowed throat?", ["The Venturi Effect (Bernoulli's Principle): air accelerates through the constricted throat, causing a localized static pressure drop that draws fuel through the jets", "High-pressure 200-bar mechanical fuel pumps inside the float bowl", "Magnetic attraction between gasoline and aluminum", "Gravity pushing fuel upward from below the carburetor"], "As intake air speeds up through the carburetor venturi restriction, static pressure drops below atmospheric pressure in the float bowl, drawing atomized fuel through the pilot/main jets.", "moto_carburetor_venturi", ["carburetor", "venturi"]],
  ["What is the structural advantage of Radial-Mount Front Brake Calipers over traditional axial-mount calipers on sportbikes?", ["Mounting bolts run parallel to the fork leg and radial to the brake disc, eliminating torsional flex under heavy braking and allowing spacer shims for different rotor diameters", "Radial calipers use cable actuation instead of hydraulic fluid", "Radial calipers mount to the rear fender", "Radial calipers require only a single brake pad"], "Securing the caliper at both ends with radial bolts anchored into the fork foot drastically increases stiffness and brake lever feel.", "moto_radial_brake", ["brakes", "radial"]],
  ['In front suspension geometry, what are "Rake" (Caster Angle) and "Trail", and how does increasing Trail affect motorcycle handling?', ["Rake is the steering head angle from vertical; Trail is the ground distance from the steering axis intersection ahead of the front tire contact patch; more Trail increases high-speed straight-line stability", "Zero trail makes a motorcycle impossible to wobble at 180 mph", "Trail is the length of the rear swingarm", "Rake measures the height of the windscreen"], "Because the front tire contact patch trails behind the steering axis ground intersection, lateral forces create a self-aligning moment; larger trail boosts straight-line stability while smaller trail quickens turn-in.", "moto_swingarm_anti_squat", ["geometry", "trail"]],
  [`Why does Yamaha's R1 "Crossplane Crankshaft" inline-4 (90\xB0 crankpin layout with 270\xB0-180\xB0-90\xB0-180\xB0 firing intervals) feel and sound like a V4 compared to a conventional 180\xB0 flat-plane inline-4?`, ["Because the pistons never all reach Top Dead Center or Bottom Dead Center simultaneously, cancelling out inertial torque fluctuations as the pistons accelerate and decelerate", "Because two of the four cylinders are deactivated at all times", "Because it runs on a two-stroke cycle", "Because the crankshaft spins backward at half engine speed"], "In a conventional 180\xB0 inline-4, all four pistons stop at TDC/BDC at the same instant, creating massive secondary inertial torque spikes; a 90\xB0 crossplane layout staggers piston velocity so rider throttle input translates directly into linear combustion torque.", "moto_desmodromic", ["engine", "crossplane"]]
];
var VERY_HARD_MOTO = [
  ['In motorcycle rear suspension kinematics, what causes "Chain Pull / Anti-Squat" under hard acceleration, and how does the angle between the swingarm, countershaft sprocket, and rear contact patch govern it?', ["Chain tension creates a force vector along the top chain run that pulls the swingarm downward (extending the rear suspension) when the instant center of the swingarm and chain line lies above the anti-squat neutral line", "Chain tension always compresses the rear shock to the bump stop", "Anti-squat is controlled solely by the front brake master cylinder", "Shaft-drive motorcycles have adjustable chain slack"], "During drive, tension in the upper chain run creates a moment about the swingarm pivot; engineers position the countershaft sprocket relative to the swingarm pivot so chain pull counteracts rearward weight transfer squat (~95\u2013110% anti-squat in mid-stroke).", "moto_swingarm_anti_squat", ["kinematics", "anti-squat"]],
  ['In a two-stroke racing motorcycle engine (e.g., 250cc GP or motocross), how does a tuned Expansion Chamber exhaust pipe achieve a "supercharging" effect without any mechanical valves?', ["A diverging cone creates a negative-pressure acoustic wave that scavenges fresh air-fuel mixture into the cylinder, followed by a converging baffle cone that reflects a positive-pressure compression wave back to stuff escaping fresh charge back into the cylinder port just before the piston closes the exhaust port", "It uses an exhaust-driven turbine compressor wheel like a car turbo", "It blocks 90% of exhaust flow to build static backpressure at idle", "It injects liquid oxygen into the muffler"], "Acoustic wave tuning in a two-stroke expansion chamber uses timed sonic rarefaction and reflection waves to boost volumetric efficiency within the engine's powerband.", "moto_carburetor_venturi", ["two-stroke", "exhaust"]],
  ['What causes a "Highside" crash on a motorcycle exiting a corner, as opposed to a "Lowside" slide?', ["The rear tire loses traction and steps out sideways (large slip angle), then suddenly regains grip violently\u2014compressing and catapulting the suspension upward around the rolling axis to eject the rider over the high side of the bike", "The front tire washes out gently at the apex and the bike slides away on its low side", "Applying the rear brake in a straight line on dry pavement", "Running out of fuel on the main straight"], "When a spinning, sliding rear tire abruptly snaps back into traction (often when the rider chops the throttle mid-slide), the rapid conversion of sideways momentum into rolling flip momentum launches the bike and rider skyward.", "moto_swingarm_anti_squat", ["dynamics", "highside"]],
  ["In a 6-Axis Inertial Measurement Unit (IMU) governing Cornering ABS and Lean-Sensitive Traction Control on modern superbikes, why does the effective rolling radius of a motorcycle tire change at deep lean angles (e.g., 55\xB0), and how must the ECU compensate?", ["At 55\xB0 lean, the tire contact patch shifts from the center crown to the smaller-circumference shoulder edge, causing the wheel to spin ~8\u201312% faster for the same true ground speed; the IMU fuses 3-axis gyro rates and 3-axis accelerometers to distinguish lean-induced wheel speed increase from actual traction loss spin", "The tire expands in diameter by 20% when leaned over", "The IMU measures GPS satellite altitude to lock the rear brake", "Cornering ABS increases front brake pressure to 100% at maximum lean"], "Without lean-angle compensation from a 6-axis IMU, a conventional wheel-speed TC system would misinterpret the faster rotation of the smaller-radius rear tire shoulder at 55\xB0 lean as wheelspin and falsely cut engine power mid-corner.", "moto_radial_brake", ["imu", "electronics", "dynamics"]],
  ["Why do MotoGP prototypes use Pneumatic Valve Return Systems (pressurized nitrogen chambers instead of steel coil valve springs) alongside Seamless Shift Gearboxes?", ['Steel coil springs suffer harmonic "valve bounce/float" above ~16,000 RPM, whereas pneumatic nitrogen bladders have near-zero reciprocating spring mass and no resonant frequency, allowing 18,000+ RPM ceiling; the seamless gearbox engages the next gear via spring-loaded dog ratchets before disengaging the previous gear for zero torque interruption even at 50\xB0 lean', "Pneumatic valves use compressed air to push the bike forward like a jet", "Seamless gearboxes use a rubber CVT belt from a scooter", "Coil springs melt at 60\xB0C engine oil temperature"], "At 18,000+ RPM with aggressive cam profiles, coil springs surge; nitrogen gas springs eliminate spring resonance, while seamless transmissions prevent transient chassis pitch upsets during mid-corner shifts.", "moto_desmodromic", ["motogp", "valvetrain"]]
];
var MOTO_TECH_FACTS = [
  ["Honda VFR800 / RC213V 90\xB0 V4 Engine Layout", "Achieves perfect primary balance without a balance shaft while maintaining a narrow frontal cross-section and compact crankshaft length that centralizes mass and reduces gyroscopic resistance to side-to-side flicking", "Requires a 4-foot-wide engine crankcase that scrapes in every corner", "Fires all four cylinders simultaneously on every revolution", "Uses a single carburetor shared with the rear brake"],
  ["BMW Telelever Front Suspension", "Separates telescopic wheel guidance from suspension damping and braking forces by using a lower A-arm (wishbone) pivoted to the engine block with a central coil-over shock, virtually eliminating front-end brake dive while preserving bump compliance", "Increases front brake dive by 200% to shorten wheelbase", "Uses leaf springs mounted above the front fender", "Eliminates the front wheel axle completely"],
  ["BMW Boxer Flat-Twin (180\xB0 Horizontally Opposed Twin)", "Pistons move outward and inward simultaneously (both reaching TDC together and BDC together), achieving primary balance with a low center of gravity and exposing cylinder heads directly to cooling airflow", "Both pistons move left together and right together like a parallel twin", "Stacks both cylinders vertically one above the other", "Cannot use shaft final drive"],
  ["270\xB0 Crankshaft Parallel Twin (vs. 180\xB0 or 360\xB0 Twin)", "Offsets the two crankpins by 90\xB0 (firing at 270\xB0 and 450\xB0 intervals), mimicking the firing cadence and inertial torque character of a 90\xB0 V-Twin within a compact, cost-effective parallel-twin cylinder block", "Fires both cylinders at the exact same millisecond", "Requires three separate crankshafts", "Eliminates the need for a counterbalance shaft"],
  ["Motorcycle Steering Damper (Hydraulic / Electronic Rotary or Linear)", 'Applies velocity-sensitive hydraulic damping across the steering head to suppress violent high-frequency handlebars oscillation ("tank slapper" / weave/wobble mode) when the front wheel skims or lands slightly off-axis under hard acceleration', "Locks the handlebars permanently straight on highways", "Replaces the front fork springs", "Increases steering effort at 2 mph parking speeds in electronic mode"],
  ["Upside-Down (USD / Inverted) Telescopic Forks", "Places the larger-diameter rigid outer aluminum stanchion tubes at the upper and lower triple clamps (where bending moments under braking are highest) and the lighter chrome slider tubes at the wheel axle to lower unsprung mass", "Mounts the brake calipers at the top near the handlebars", "Holds fork oil outside the tubes", "Is 50% more flexible under braking than conventional right-side-up forks"],
  ["Constant-Velocity (CV) Motorcycle Carburetor (Vacuum Slide)", "Uses a diaphragm-controlled vacuum slide that lifts automatically in proportion to engine airflow demand rather than snapping wide open with the rider's wrist, preventing lean bogging when the butterfly throttle plate is opened abruptly at low RPM", "Injects fuel at 300 bar directly into the spark plug", "Has no float bowl or main jet", "Only functions when the motorcycle is upside down"],
  ["Sintered Metal vs. Organic Motorcycle Brake Pads", "Sintered pads fuse metallic particles under high heat and pressure, offering superior initial bite, consistent wet-weather friction, and high fade resistance for heavy or fast street/track riding at the expense of slightly faster rotor wear", "Organic pads are made of solid titanium and never wear out", "Sintered pads dissolve in rainwater", "Organic pads operate best at 900\xB0C glowing red rotor temperatures"],
  ["Quickshifter (Up) and Autoblipper (Down) System", "A strain-gauge sensor on the shift linkage detects foot pressure: on upshifts it momentarily cuts ignition/fuel (~40\u201370 ms) to unload the transmission dogs; on downshifts (ride-by-wire) it automatically blips the throttle to match gear shaft speeds without clutch input", "Uses a hydraulic torque converter to replace all gears", "Shifts gears randomly every 5 seconds", "Requires holding the front brake to shift up"],
  ["Counter-Rotating Crankshaft (MotoGP & Ducati Panigale V4 / MV Agusta)", "Spins the engine crankshaft backward (opposite to wheel rotation) so its gyroscopic precession and rotational inertia counteract the forward gyroscopic inertia of the wheels, making the bike quicker to flick into corners and reducing wheelie tendency under acceleration", "Makes the motorcycle drive backward in all six gears", "Increases wheelie tendency by 300%", "Eliminates the need for a rear tire"],
  ["O-Ring, X-Ring, and Z-Ring Sealed Drive Chains", "Trap factory high-viscosity grease between the pin and bushing using elastomeric seals; X-ring profiles twist rather than squash under side-plate compression, cutting parasitic friction in half compared to flat O-rings while extending chain life", "Run completely dry with no internal pin lubrication", "Are made of solid rubber with no steel links", "Never require tension slack inspection"],
  ["Motorcycle Chain Slack Adjustment Geometry", "Chain slack must be measured so the chain is never pulled completely tight at the point where the countershaft sprocket center, swingarm pivot center, and rear axle center are collinear (the tightest point in suspension travel), preventing output shaft bearing destruction", "Chains should be tightened until there is 0 mm of vertical movement at rest", "Slack increases to 10 inches when the suspension compresses halfway", "Chain tension has no effect on transmission bearings"],
  ["Radial vs. Bias-Ply Motorcycle Tire Construction", "Radial tires orient carcass cord plies at ~90\xB0 to the direction of travel reinforced by a 0\xB0 steel or aramid spiral belt, running cooler at high speed with a wider, more stable footprint at high lean angles than bias-ply tires", "Bias-ply tires are mandatory in MotoGP for 220 mph straights", "Radial tires use solid foam instead of pressurized air", "Bias-ply tires have zero sidewall stiffness"],
  ["Dual-Compound / Multi-Compound Sportbike Tires", "Molds a harder, higher-silica rubber compound along the center crown to resist flat-spotting during upright highway miles, flanked by softer, high-hysteresis grip compounds on the shoulders for maximum cornering traction", "Uses soft rubber on the left side and hard plastic on the right side for street riding", "Inflates the left and right sides of the tire to different pressures", "Eliminates tread grooves on wet-weather rain tires"],
  ["EXUP / Exhaust Control Valve in Motorcycle Headers", "A servo-actuated butterfly valve near the exhaust collector partially restricts header cross-section at low-to-mid RPM to prevent reverse pressure waves from diluting cylinder scavenging during high valve-overlap, then opens fully at high RPM for peak horsepower", "Closes completely at 14,000 RPM to choke the engine", "Injects raw gasoline into the muffler to make flames", "Replaces the catalytic converter with a cooling fan"],
  ["Rake and Trail Modification via Fork Tube Height in Triple Clamps", "Raising the fork tubes upward through the triple clamps (lowering the front ride height by 5\u201310 mm) steepens effective rake angle and reduces trail, sharpening turn-in responsiveness at the expense of some straight-line stability", "Lowering the front end increases rake to 45 degrees like a chopper", "Sliding the forks up lengthens the wheelbase by 6 inches", "Fork height has zero effect on steering geometry"],
  ["Progressive Linkage Rear Suspension (Uni-Trak / Pro-Link / Monocross)", "Uses a bellcrank and dogbone linkage between the swingarm and shock absorber so the leverage ratio decreases as the wheel travels upward, creating a rising-rate stiffness that is supple over small ripples yet resists bottoming on large hits", "Makes the suspension softer the harder it bottoms out", "Eliminates the coil spring from the rear shock", "Locks the rear swingarm rigid above 40 mph"],
  ["High-Speed vs. Low-Speed Compression Damping on a Motorcycle Shock", "Refers to the vertical shaft velocity of the shock piston (not road speed): Low-Speed Compression controls chassis pitch during rider weight transfer, braking, and cornering; High-Speed Compression controls oil flow through shim stacks over sharp square-edge bumps", "High-speed damping only activates above 120 mph highway speed", "Low-speed damping only works in parking lots below 10 mph", "Both knobs adjust the tire air pressure"],
  ["Preload Adjustment on Motorcycle Forks and Shock", `Changes the initial compressed length of the coil spring to set static and rider "Sag" (ride height and suspension travel position in the stroke), without changing the spring's intrinsic rate (N/mm)`, "Doubles the spring stiffness in N/mm when turned clockwise", "Changes the viscosity of the fork damping oil", "Increases the total stroke length of the shock shaft"],
  ["Trail Braking into a Motorcycle Corner", "Keeping light, progressively decreasing front brake pressure past the turn-in point toward the apex compresses the front forks (reducing rake and trail for sharper steering geometry) and loads the front tire contact patch before transitioning smoothly to throttle", "Grabbing 100% front brake abruptly at maximum lean angle at the apex", "Locking the rear wheel with the foot brake through the entire corner", "Pulling in the clutch lever and coasting in neutral through every turn"]
];
function buildMotoTier(baseTuples, difficulty, targetCount, extraPool, diagramDefault) {
  const items = [];
  for (let i = 0; i < baseTuples.length && items.length < targetCount; i++) {
    const [qText, opts, exp, diag, tags] = baseTuples[i];
    items.push({
      code: `moto_${difficulty.toLowerCase().replace(/\s+/g, "_")}_${items.length + 1}`,
      categorySlug: "motorcycles",
      difficulty,
      questionText: qText,
      options: opts,
      explanation: exp,
      diagramType: diag,
      tags,
      estimatedTimeSec: difficulty === "Easy" ? 15 : difficulty === "Normal" ? 25 : difficulty === "Hard" ? 40 : 60
    });
  }
  let idx = 0;
  while (items.length < targetCount) {
    const fact = extraPool[idx % extraPool.length];
    const variantRound = Math.floor(idx / extraPool.length);
    const [subject, correctDesc, w1, w2, w3] = fact;
    const questionText = variantRound === 0 ? `In motorcycle engineering and dynamics, what is the primary mechanism and effect of ${subject}?` : variantRound === 1 ? `When evaluating motorcycle chassis or powertrain performance, which statement accurately describes ${subject}?` : `During a technical inspection or track setup, how does ${subject} influence motorcycle behavior?`;
    items.push({
      code: `moto_${difficulty.toLowerCase().replace(/\s+/g, "_")}_${items.length + 1}`,
      categorySlug: "motorcycles",
      difficulty,
      questionText,
      options: [correctDesc, w1, w2, w3],
      explanation: `${subject}: ${correctDesc}.`,
      diagramType: idx % 3 === 0 ? diagramDefault : "none",
      tags: ["motorcycles", "dynamics", subject.toLowerCase().split(" ")[0]],
      estimatedTimeSec: difficulty === "Hard" ? 40 : 60
    });
    idx++;
  }
  return items;
}
var MOTORCYCLES_QUESTIONS = [
  ...buildMotoTier(EASY_MOTO, "Easy", 50, [], "none"),
  ...buildMotoTier(NORMAL_MOTO, "Normal", 50, [], "none"),
  ...buildMotoTier(HARD_MOTO, "Hard", 50, MOTO_TECH_FACTS, "moto_swingarm_anti_squat"),
  ...buildMotoTier(VERY_HARD_MOTO, "Very Hard", 50, MOTO_TECH_FACTS, "moto_desmodromic")
];

// src/db/banks/travelingBank.ts
var EASY_GEO = [
  ["What is the name of the planet we all live on?", ["Earth", "Mars", "Jupiter", "Saturn"], "We live on Planet Earth, the third planet from the Sun.", "none", ["basics", "earth"]],
  ["In which direction does the Sun rise every morning?", ["East", "West", "North", "South"], "Because Earth rotates from west to east, the Sun always appears to rise in the East and set in the West.", "none", ["basics", "directions"]],
  ["In which direction does the Sun set every evening?", ["West", "East", "North", "South"], "The Sun sets in the West at the end of the day.", "none", ["basics", "directions"]],
  ["How many continents are there on Earth?", ["7 continents", "3 continents", "12 continents", "20 continents"], "The 7 continents are Asia, Africa, North America, South America, Antarctica, Europe, and Australia (Oceania).", "none", ["basics", "continents"]],
  ["Which famous white marble monument in Agra, India, was built by Emperor Shah Jahan?", ["The Taj Mahal", "The Eiffel Tower", "Big Ben", "The Colosseum"], "The Taj Mahal in Agra, India, is one of the most famous landmarks in the world.", "none", ["basics", "landmarks"]],
  ["In which city and country does the famous iron Eiffel Tower stand?", ["Paris, France", "London, England", "Rome, Italy", "Berlin, Germany"], "The Eiffel Tower is the iconic landmark of Paris, the capital of France.", "none", ["basics", "landmarks"]],
  ["Which ancient country built the giant stone Pyramids and the Great Sphinx in the desert?", ["Egypt", "Brazil", "Canada", "Norway"], "The Great Pyramids of Giza and the Sphinx were built in ancient Egypt.", "none", ["basics", "landmarks"]],
  ["Which country is famous for wild Kangaroos and Koalas?", ["Australia", "Iceland", "Spain", "Egypt"], "Kangaroos and koalas are marsupials native to Australia.", "none", ["basics", "animals"]],
  ["Which freezing, ice-covered continent at the South Pole is home to wild Emperor Penguins?", ["Antarctica", "Africa", "Europe", "South America"], "Antarctica surrounds the South Pole and is home to penguins and seals.", "none", ["basics", "continents"]],
  ["What is the tallest mountain in the world above sea level?", ["Mount Everest", "Mount Fuji", "Table Mountain", "Mount Rushmore"], "Mount Everest in the Himalayas is the highest mountain on Earth at 8,848.86 meters.", "none", ["basics", "mountains"]],
  ["What is the capital city of India?", ["New Delhi", "Mumbai", "Chennai", "Kolkata"], "New Delhi is the national capital of India.", "none", ["basics", "capitals"]],
  ["Who is the current Chief Minister of Kerala?", ["V. D. Satheesan", "Oommen Chandy", "K. Karunakaran", "C. Achutha Menon"], "V. D. Satheesan is the current Chief Minister of Kerala, serving in the Kerala Legislative Assembly.", "none", ["india", "kerala", "governance"]],
  ["What official little booklet with your photo inside do you need to travel by airplane to another country?", ["A Passport", "A Library Card", "A Recipe Book", "A Comic Book"], "A government-issued passport verifies your identity and nationality when traveling internationally.", "none", ["basics", "travel"]],
  ["Where do airplanes take off and land when carrying passengers on a trip?", ["An Airport", "A Train Station", "A Bus Stop", "A Harbor Pier"], "Airplanes taxi, take off, and land on runways at an airport.", "none", ["basics", "aviation"]],
  ["What tool with a magnetic needle always points toward North to help travelers find their way?", ["A Compass", "A Ruler", "A Thermometer", "A Stopwatch"], "A magnetic compass needle aligns with Earth's magnetic field to point North.", "none", ["basics", "navigation"]],
  ["What do we call a round ball-shaped model of the Earth that you can spin on a stand in a classroom?", ["A Globe", "A Cube", "A Pyramid", "A Cylinder"], "A globe is a spherical scale model of Planet Earth.", "none", ["basics", "maps"]],
  ["On a world map or globe, what do the big blue areas represent?", ["Oceans, Seas, and Lakes (Water)", "Hot Deserts", "Snowy Mountains", "Thick Forests"], "Maps color oceans, seas, and lakes blue to represent water.", "none", ["basics", "maps"]],
  ["What do we call a piece of land that is completely surrounded by water on all sides?", ["An Island", "A Mountain", "A Canyon", "A Cave"], "An island\u2014like Sri Lanka, Madagascar, or Hawaii\u2014is land completely surrounded by water.", "none", ["basics", "landforms"]],
  ["What is a very dry, sandy or rocky place where almost no rain falls and cactuses or camels live?", ["A Desert", "A Rainforest", "A Swamp", "A Glacier"], "Deserts receive very little rainfall all year round.", "none", ["basics", "landforms"]],
  ["Which huge hot desert covers much of Northern Africa?", ["The Sahara Desert", "The Amazon", "The Alps", "The Great Barrier Reef"], "The Sahara is the largest hot desert in the world, stretching across North Africa.", "none", ["basics", "deserts"]],
  ["In which country is the famous Great Wall, built across mountain ridges over thousands of miles?", ["China", "Brazil", "Australia", "Italy"], "The Great Wall of China stretches thousands of kilometers across northern China.", "none", ["basics", "landmarks"]],
  ["In which American city does the green Statue of Liberty hold her torch in the harbor?", ["New York City", "Chicago", "Seattle", "Miami"], "The Statue of Liberty stands on Liberty Island in New York Harbor.", "none", ["basics", "landmarks"]],
  ["Which ocean is the largest ocean on Earth?", ["The Pacific Ocean", "The Arctic Ocean", "The Indian Ocean", "The Southern Ocean"], "The Pacific Ocean is the largest and deepest of Earth's ocean divisions.", "none", ["basics", "oceans"]],
  ["Which ocean lies directly to the south of India and takes its name from India?", ["The Indian Ocean", "The Atlantic Ocean", "The Arctic Ocean", "The Pacific Ocean"], "The Indian Ocean borders India to the south, Africa to the west, and Australia to the east.", "none", ["basics", "oceans"]],
  ["What do we call a mountain with a crater at the top that can erupt with hot red lava and ash?", ["A Volcano", "A Waterfall", "A Sand Dune", "An Iceberg"], "Volcanoes vent molten rock (magma/lava) from deep inside the Earth.", "none", ["basics", "landforms"]],
  ["What is a giant chunk of freshwater ice floating in the cold ocean called?", ["An Iceberg", "A Coral Reef", "A Sandbar", "A Pebble"], "Icebergs calve off glaciers and ice shelves and float in polar seas.", "none", ["basics", "oceans"]],
  ["Where do passenger trains travel from city to city?", ["On steel railway tracks (rails)", "In the clouds", "On dirt trails", "Across the open ocean"], "Trains roll on flanged steel wheels along railway tracks.", "none", ["basics", "transport"]],
  ["What do you call a large boat that carries thousands of vacationers across the sea with swimming pools and restaurants onboard?", ["A Cruise Ship", "A Canoe", "A Jet Ski", "A Submarine"], "Cruise ships are floating hotels that take passengers on ocean voyages.", "none", ["basics", "transport"]],
  ["What do you pack your clothes, toothbrush, and shoes into when going on a trip?", ["A Suitcase (or Travel Backpack)", "A Toaster", "A Pillowcase", "A Flower Pot"], "Travelers pack clothing and personal items into suitcases or backpacks.", "none", ["basics", "travel"]],
  ["Which continent is the largest by both land area and number of people, and includes India, China, and Japan?", ["Asia", "Europe", "Australia", "Antarctica"], "Asia is Earth's largest and most populous continent.", "none", ["basics", "continents"]],
  ["Which country is shaped like a long boot kicking a football on the map of Europe and is famous for pizza and pasta?", ["Italy", "Switzerland", "Norway", "Ireland"], "The Italian Peninsula in southern Europe looks just like a high-heeled boot on a map.", "none", ["basics", "countries"]],
  ["What is the capital city of Japan?", ["Tokyo", "Kyoto", "Osaka", "Sapporo"], "Tokyo is the capital and largest city of Japan.", "none", ["basics", "capitals"]],
  ["What is the capital city of the United Kingdom (England)?", ["London", "Manchester", "Liverpool", "Oxford"], "London, on the River Thames, is the capital of the United Kingdom.", "none", ["basics", "capitals"]],
  ["What is the capital city of the United States of America?", ["Washington, D.C.", "Los Angeles", "Las Vegas", "Boston"], "Washington, D.C. is the federal capital of the United States.", "none", ["basics", "capitals"]],
  ["What is the imaginary line around the middle of the Earth\u2014halfway between the North Pole and South Pole\u2014where the weather is warm all year?", ["The Equator", "The North Wall", "The Finish Line", "The Moon Belt"], "The Equator divides the Earth into the Northern and Southern Hemispheres.", "none", ["basics", "geography"]],
  ["What is the very top point of the Earth on a globe called?", ["The North Pole", "The West Pole", "The East Corner", "The Equator"], "The geographic North Pole is the northernmost point on Earth.", "none", ["basics", "geography"]],
  ["What is the very bottom point of the Earth on a globe called?", ["The South Pole", "The North Pole", "The Middle Line", "The Peak"], "The geographic South Pole sits on the continent of Antarctica.", "none", ["basics", "geography"]],
  ["What do we call a place where a river drops steeply over a high rocky cliff into a pool below?", ["A Waterfall", "A Pond", "A Puddle", "A Canal"], "Waterfalls\u2014like Niagara Falls, Victoria Falls, or Jog Falls\u2014plunge over steep cliffs.", "none", ["basics", "landforms"]],
  ["Which dense, warm jungle forest in South America is the largest tropical rainforest in the world?", ["The Amazon Rainforest", "The Black Forest", "Sherwood Forest", "The Taiga"], "The Amazon Rainforest spans Brazil and neighboring South American countries.", "none", ["basics", "nature"]],
  ["What is a tall tower built on the coast with a bright spinning light at the top to warn ships away from dangerous rocks at night?", ["A Lighthouse", "A Windmill", "A Water Tower", "A Silo"], "Lighthouses guide sailors and warn ships of rocky coastlines and shallow reefs.", "none", ["basics", "maritime"]],
  ["When you rent a room to sleep in while visiting another city on vacation, what is that building called?", ["A Hotel (or Resort)", "A Factory", "A Post Office", "A Bank"], "Hotels provide guest rooms and beds for travelers away from home.", "none", ["basics", "travel"]],
  ["Who sits in the cockpit at the front of an airplane and flies the plane safely?", ["The Pilot (and Co-Pilot)", "The Train Conductor", "The Lifeguard", "The Chef"], "Airline pilots control and navigate the aircraft from the flight deck.", "none", ["basics", "aviation"]],
  ["What printed or digital ticket shows your seat number (like `14A`) and gate number to get on an airplane?", ["Boarding Pass", "Grocery Receipt", "Report Card", "Menu"], "Passengers scan their boarding pass at the airport gate to board the flight.", "none", ["basics", "aviation"]],
  ["Which seat on an airplane is right next to the oval glass so you can look out at the clouds and cities below?", ["Window Seat", "Aisle Seat", "Middle Seat", "Pilot Seat"], "The window seat sits right beside the cabin window.", "none", ["basics", "aviation"]],
  ["What is a bridge built for?", ["To let cars, trains, or people cross over a river, valley, or road safely", "To block boats from floating", "To catch rainwater", "To stop the wind"], "Bridges span rivers, canyons, and straits to connect roads and railways.", "none", ["basics", "transport"]],
  ["What is a tunnel?", ["An underground passage dug through a mountain, hill, or under water for cars or trains", "A tall tower in the sky", "A floating boat dock", "A rooftop helipad"], "Tunnels allow roads and trains to pass straight through mountains or beneath rivers.", "none", ["basics", "transport"]],
  [`Which Indian state is famous as "God's Own Country" with palm-lined backwaters, houseboats, and misty tea hills?`, ["Kerala", "Rajasthan", "Punjab", "Haryana"], "Kerala on India's southwestern Malabar Coast is famous for its backwaters, beaches, and Western Ghats hill stations.", "none", ["basics", "india"]],
  ["What currency (money) is used in India?", ["Indian Rupee (\u20B9)", "Japanese Yen (\xA5)", "British Pound (\xA3)", "Euro (\u20AC)"], "The official currency of India is the Indian Rupee (\u20B9 / INR).", "none", ["basics", "currencies"]],
  ["What are the four main compass directions (Cardinal Directions)?", ["North, South, East, and West", "Up, Down, Left, and Right", "Top, Bottom, Front, and Back", "Summer, Winter, Spring, and Fall"], "North, East, South, and West (N, E, S, W) are the four cardinal compass directions.", "none", ["basics", "directions"]],
  ["What does `GPS` on a phone or car screen help you do when traveling?", ["Shows your exact location on a map and gives turn-by-turn directions so you do not get lost", "Makes the car use less gasoline", "Changes the weather outside", "Packs your suitcase"], "GPS uses signals from satellites in space to pinpoint where you are on a map.", "none", ["basics", "navigation"]]
];
var NORMAL_GEO = [
  ["What is the capital city of Australia?", ["Canberra", "Sydney", "Melbourne", "Perth"], "Canberra was purpose-built as the federal capital of Australia between Sydney and Melbourne.", "none", ["everyday", "capitals"]],
  ["What is the capital city of Canada?", ["Ottawa", "Toronto", "Vancouver", "Montreal"], "Ottawa, in the province of Ontario, is the national capital of Canada.", "none", ["everyday", "capitals"]],
  ["What is the capital city of Italy?", ["Rome", "Milan", "Venice", "Florence"], "Rome is the capital city of Italy and home to the Colosseum.", "none", ["everyday", "capitals"]],
  ["What is the capital city of Germany?", ["Berlin", "Munich", "Frankfurt", "Hamburg"], "Berlin is the capital and largest city of Germany.", "none", ["everyday", "capitals"]],
  ["What is the capital city of Egypt?", ["Cairo", "Alexandria", "Luxor", "Giza"], "Cairo, set along the Nile River, is the capital of Egypt.", "none", ["everyday", "capitals"]],
  ["What is the capital city of Russia?", ["Moscow", "Saint Petersburg", "Sochi", "Kazan"], "Moscow is the capital and most populous city of Russia.", "none", ["everyday", "capitals"]],
  ["What is the capital city of China?", ["Beijing", "Shanghai", "Hong Kong", "Shenzhen"], "Beijing is the capital of the People's Republic of China.", "none", ["everyday", "capitals"]],
  ["What is the capital city of Spain?", ["Madrid", "Barcelona", "Seville", "Valencia"], "Madrid, located in the center of the country, is the capital of Spain.", "none", ["everyday", "capitals"]],
  ["What is the capital city of Brazil?", ["Bras\xEDlia", "Rio de Janeiro", "S\xE3o Paulo", "Salvador"], "Bras\xEDlia is the federal capital of Brazil, inaugurated in 1960.", "none", ["everyday", "capitals"]],
  ["What is the capital city of South Korea?", ["Seoul", "Busan", "Incheon", "Jeju"], "Seoul is the capital and largest metropolis of South Korea.", "none", ["everyday", "capitals"]],
  ["What is the shared official currency used by most European Union countries such as France, Germany, Italy, and Spain?", ["The Euro (\u20AC)", "The Pound Sterling (\xA3)", "The Swiss Franc", "The Dollar ($)"], "The Euro (\u20AC / EUR) is the official currency of the Eurozone countries in Europe.", "none", ["everyday", "currencies"]],
  ["What is the official currency of Japan?", ["Japanese Yen (\xA5)", "Chinese Yuan", "Korean Won", "Thai Baht"], "The Yen (\xA5 / JPY) is the official currency of Japan.", "none", ["everyday", "currencies"]],
  ["What is the official currency of the United Kingdom?", ["Pound Sterling (\xA3)", "Euro (\u20AC)", "US Dollar ($)", "Krone"], "The British Pound Sterling (\xA3 / GBP) is the currency of the United Kingdom.", "none", ["everyday", "currencies"]],
  ['What is "Jet Lag" when flying across many time zones?', ["Temporary tiredness and sleep disruption because your body's internal clock is still set to your home time zone", "When the airplane engines run low on fuel", "Waiting in line at the baggage carousel", "Turbulence caused by clouds"], "Crossing multiple time zones rapidly puts your circadian rhythm out of sync with local daylight.", "none", ["everyday", "travel"]],
  ['What is the difference between a "Domestic Flight" and an "International Flight"?', ["A domestic flight stays within the same country, while an international flight travels from one country to another", "A domestic flight only carries mail", "An international flight has no seats", "A domestic flight flies over oceans only"], "Domestic flights operate between cities inside one country; international flights cross national borders.", "none", ["everyday", "aviation"]],
  ['What is a "Travel Visa"?', ["Official permission from a foreign country (stamped in your passport or issued electronically) allowing you to enter and stay for a set time", "A credit card that only works on airplanes", "A map of the airport terminals", "A luggage tag"], "Many countries require visitors to obtain a tourist, student, or business visa before or upon arrival.", "none", ["everyday", "travel"]],
  ['At an international airport, what is the difference between "Immigration (Passport Control)" and "Customs"?', ["Immigration checks the traveler's passport and visa; Customs inspects the luggage and goods being brought into the country", "They are two names for the ticket counter", "Customs flies the airplane", "Immigration washes the suitcases"], "First you clear Immigration (identity & entry), then you collect your bags and pass through Customs (goods declaration).", "none", ["everyday", "airports"]],
  ['What is "Carry-On Luggage" (Cabin Baggage) vs. "Checked Baggage" on a flight?', ["Carry-on bags stay with you in the overhead bin inside the passenger cabin, while checked bags travel in the airplane's cargo hold", "Carry-on bags are tied to the wings", "Checked bags are held on your lap", "There is no difference"], "Carry-on bags must fit in the cabin overhead locker or under the seat, whereas larger suitcases are checked at the counter.", "none", ["everyday", "aviation"]],
  ['What is a "Layover" (or Connecting Flight) on an airline itinerary?', ["A scheduled stop at an intermediate airport where you wait or change planes before continuing to your final destination", "Sleeping at home before your trip", "Canceling your ticket", "Sitting in the first row of the plane"], "Non-stop flights fly directly to the destination, while connecting flights include a layover at a hub airport.", "none", ["everyday", "aviation"]],
  ["Which river flows northward through Egypt and empties into the Mediterranean Sea?", ["The Nile River", "The Amazon River", "The Mississippi River", "The Thames"], "The Nile River is the lifeblood of Egypt and flows north into the Mediterranean Sea.", "none", ["everyday", "rivers"]],
  ["Which river carries the largest volume of water of any river on Earth and flows through South America?", ["The Amazon River", "The Seine", "The Rhine", "The Murray River"], "The Amazon River discharges more water into the Atlantic Ocean than the next seven largest rivers combined.", "none", ["everyday", "rivers"]],
  ["Which sea lies between Southern Europe, Northern Africa, and Western Asia?", ["The Mediterranean Sea", "The Caribbean Sea", "The Bering Sea", "The Tasman Sea"], "The Mediterranean Sea is bordered by countries like Spain, France, Italy, Greece, Turkey, and Egypt.", "none", ["everyday", "seas"]],
  ["Which famous canal in Egypt connects the Mediterranean Sea to the Red Sea so ships do not have to sail all the way around Africa?", ["The Suez Canal", "The Panama Canal", "The Erie Canal", "The Grand Canal"], "Opened in 1869, the Suez Canal provides a direct maritime shortcut between Europe and Asia.", "none", ["everyday", "canals"]],
  ["Which famous canal in Central America connects the Atlantic Ocean (Caribbean Sea) to the Pacific Ocean?", ["The Panama Canal", "The Suez Canal", "The Kiel Canal", "The English Channel"], "The Panama Canal cuts across the Isthmus of Panama, saving ships from sailing around South America's Cape Horn.", "none", ["everyday", "canals"]],
  [`What is a "Peninsula" in geography (such as India's southern Deccan peninsula, Italy, or Florida)?`, ["A piece of land that is surrounded by water on three sides while connected to the mainland on the fourth side", "A mountain peak covered in snow", "A lake in the middle of a desert", "An underwater cave"], "Unlike an island (surrounded on all sides), a peninsula juts out into the water while remaining attached to the mainland.", "none", ["everyday", "landforms"]],
  ["Which mountain range separates the Indian subcontinent from Tibet and contains the world's highest peaks?", ["The Himalayas", "The Rocky Mountains", "The Andes", "The Alps"], "The Himalayas stretch across northern India, Nepal, Bhutan, China, and Pakistan.", "none", ["everyday", "mountains"]],
  ["Which major mountain range runs down the entire western side of South America?", ["The Andes", "The Alps", "The Urals", "The Appalachians"], "The Andes form the longest continental mountain range in the world along western South America.", "none", ["everyday", "mountains"]],
  ["Which famous mountain range in Europe spans countries like Switzerland, Austria, France, and Italy?", ["The Alps", "The Himalayas", "The Pyrenees", "The Rockies"], "The European Alps are famous for peaks like the Matterhorn and Mont Blanc.", "none", ["everyday", "mountains"]],
  ["Why is it summer in Australia and Argentina during December and January when it is winter in Europe, North America, and India?", ["Because the Southern Hemisphere is tilted toward the Sun in December while the Northern Hemisphere is tilted away", "Because Australia is closer to the Moon", "Because Australian calendars run backward", "Because ocean water boils in December"], "TheNorthern and Southern Hemispheres experience opposite seasons due to Earth's 23.5\xB0 axial tilt.", "none", ["everyday", "seasons"]],
  ["Which country has the largest land area in the world, stretching across Eastern Europe and all of Northern Asia?", ["Russia", "Monaco", "Singapore", "Switzerland"], "Covering more than 17 million square kilometers across 11 time zones, Russia is the world's largest country by area.", "none", ["everyday", "countries"]],
  ["Which tiny city-state enclosed within Rome, Italy, is the smallest independent country in the world?", ["Vatican City", "Brazil", "Canada", "Argentina"], "Vatican City covers just ~0.49 square kilometers inside Rome.", "none", ["everyday", "countries"]],
  ['In which Peruvian mountain range sits the famous ancient Incan citadel of "Machu Picchu"?', ["The Andes Mountains", "The Swiss Alps", "The Scottish Highlands", "The Himalayas"], "Machu Picchu sits high in the Andes Mountains of Peru.", "none", ["everyday", "landmarks"]],
  ["In which European city can you visit the ancient Roman Colosseum and the Trevi Fountain?", ["Rome, Italy", "Athens, Greece", "Vienna, Austria", "Lisbon, Portugal"], "The Colosseum and Trevi Fountain are iconic historic landmarks in Rome.", "none", ["everyday", "landmarks"]],
  ["Which famous coral reef system off the coast of Queensland, Australia, is the largest living structure on Earth?", ["The Great Barrier Reef", "The Grand Canyon", "Victoria Falls", "The Dead Sea"], "The Great Barrier Reef stretches over 2,300 kilometers in the Coral Sea off Australia.", "none", ["everyday", "nature"]],
  ["Which deep steep-sided canyon in Arizona, USA, was carved over millions of years by the Colorado River?", ["The Grand Canyon", "Death Valley", "Yellowstone", "Niagara Gorge"], "The Grand Canyon in Arizona is famed for its layered red rock bands.", "none", ["everyday", "landmarks"]],
  ['What makes the water of the "Dead Sea" (bordered by Jordan and Israel) famous to swimmers?', ["It is so extremely salty and dense that people float effortlessly on top of the water", "It is frozen solid all year round", "It has giant 50-foot surfing waves", "It is made of fresh mountain spring water"], "With ~34% salinity (nearly 10 times saltier than ocean water), the Dead Sea makes swimmers buoyant.", "none", ["everyday", "nature"]],
  ["What natural glowing colored light display appears in the night sky near the Arctic Circle in places like Norway, Iceland, and Alaska?", ["The Northern Lights (Aurora Borealis)", "A Rainbow", "A Solar Eclipse", "Halley's Comet"], "The Aurora Borealis (Northern Lights) shimmers across high-latitude night skies.", "none", ["everyday", "nature"]],
  ['Which country is known as the "Land of the Rising Sun" and consists of major islands like Honshu and Hokkaido?', ["Japan", "South Africa", "Chile", "Egypt"], `Japan's name (Nihon/Nippon) translates to "origin of the sun" or "Land of the Rising Sun".`, "none", ["everyday", "countries"]],
  ['Which city in the United Arab Emirates (UAE) is home to the "Burj Khalifa", the tallest skyscraper in the world?', ["Dubai", "Riyadh", "Cairo", "Istanbul"], "Standing 828 meters tall, the Burj Khalifa is the centerpiece of downtown Dubai.", "none", ["everyday", "landmarks"]],
  ["Which major Turkish city is famous for straddling two continents\u2014Europe and Asia\u2014across the Bosphorus strait?", ["Istanbul", "Madrid", "Dublin", "Warsaw"], "Istanbul lies partly in European Thrace and partly in Asian Anatolia.", "none", ["everyday", "cities"]],
  ['What is "Duty-Free Shopping" at an international airport?', ["Shops inside the international departure lounge that sell goods exempt from local national import taxes/duties to travelers leaving the country", "Shops where everything is 100% free and costs $0", "A lost-and-found counter for missing bags", "A counter that exchanges broken suitcases"], "Duty-free stores waive certain local excise taxes for international departing passengers.", "none", ["everyday", "airports"]],
  ['What is an "Archipelago" (such as Indonesia, the Philippines, Japan, or the Maldives)?', ["A chain or cluster of many islands grouped together in the sea", "A single tall mountain peak", "A dry desert valley", "An underground river"], "Indonesia and the Philippines are large island archipelagos containing thousands of islands.", "none", ["everyday", "landforms"]],
  ['Which Indian city is known as the "Silicon Valley of India" and is the capital of Karnataka?', ["Bengaluru (Bangalore)", "Jaipur", "Patna", "Bhopal"], "Bengaluru is the capital of Karnataka and India's premier information technology hub.", "none", ["everyday", "india"]],
  ['Which Indian city is known as the "Pink City" and is the capital of Rajasthan?', ["Jaipur", "Kochi", "Shimla", "Guwahati"], "Jaipur, the capital of Rajasthan, is famous for its terracotta-pink historic buildings and forts.", "none", ["everyday", "india"]],
  ['Which port city in Kerala is famous as the "Queen of the Arabian Sea" with Chinese fishing nets at Fort Kochi?', ["Kochi (Cochin)", "Agra", "Darjeeling", "Varanasi"], "Kochi is a historic spice-trading port city on the southwest coast of Kerala.", "none", ["everyday", "india"]],
  ["What is the capital city of Kerala?", ["Thiruvananthapuram (Trivandrum)", "Kozhikode", "Thrissur", "Kollam"], "Thiruvananthapuram is the capital city of Kerala.", "none", ["everyday", "india"]],
  ['What is "Turbulence" during an airplane flight?', ["Bumpy air movement caused by wind currents, clouds, or jet streams\u2014which is normal and why passengers keep seatbelts fastened while seated", "The airplane running out of fuel", "The wheels touching the ground", "The pilot turning off the headlights"], "Modern airliners are engineered to handle turbulence safely, and keeping your seatbelt fastened while seated prevents bumps.", "none", ["everyday", "aviation"]],
  ["Why do airline flight attendants ask you to put seat backs upright and stow tray tables during takeoff and landing?", ["To keep the row path completely clear in case passengers ever need to exit the aircraft quickly", "To make the airplane lighter", "To improve Wi-Fi reception", "So the pilot can see the back window"], "Keeping aisles and seat rows unobstructed ensures rapid evacuation safety during takeoff and landing.", "none", ["everyday", "aviation"]],
  ['What is a "Round-Trip Ticket" vs. a "One-Way Ticket"?', ["A round-trip ticket includes both your outbound trip to the destination and your return trip back home", "A round-trip ticket flies in a circle without landing", "A one-way ticket lets you fly unlimited times for a year", "They are identical"], "A round-trip (return) booking covers both going there and coming back.", "none", ["everyday", "travel"]],
  ["What does `UTC` (or `GMT`) refer to when comparing world clocks across different countries?", ["The standard global reference time (at 0\xB0 longitude) from which all world time zones are offset (such as IST = UTC+5:30)", "The speed of a commercial jet", "The height of a mountain", "The currency exchange rate"], "Time zones worldwide are expressed as offsets ahead of or behind UTC (Coordinated Universal Time), such as India Standard Time at UTC+5:30.", "none", ["everyday", "timezones"]]
];
var HARD_GEO = [
  ["Which imaginary line of latitude at 0\xB0 divides the Earth into the Northern and Southern Hemispheres?", ["The Equator", "The Prime Meridian", "The Tropic of Capricorn", "The International Date Line"], "The Equator sits at 0\xB0 latitude, equidistant from the North and South Poles.", "geo_coord_projection", ["geography", "coordinates"]],
  ["Which imaginary line of longitude at 0\xB0 passes through the Royal Observatory in Greenwich, London?", ["The Prime Meridian", "The Tropic of Cancer", "The Arctic Circle", "The 49th Parallel"], "By international convention established in 1884, 0\xB0 longitude is the Prime Meridian passing through Greenwich.", "geo_coord_projection", ["geography", "longitude"]],
  ['On an aviation airport runway, what does the large painted number "27" at the threshold signify?', ["A magnetic compass heading of approximately 270\xB0 (Due West)", "A runway length of 2,700 meters", "The 27th runway built at that airport", "A maximum aircraft weight limit of 270 tons"], "Runway designators are rounded to the nearest 10 degrees of magnetic azimuth divided by 10; Runway 27 points 270\xB0 (West), and its opposite end is Runway 09 (090\xB0 East).", "geo_airport_runway", ["aviation", "navigation"]],
  ["Why do long-haul intercontinental airliners between North America, Europe, and Asia fly curved paths toward high latitudes on a flat Mercator map?", ["Because the shortest distance between two points on a sphere is a Great Circle arc (orthodrome), which appears curved when projected onto a flat cylindrical Mercator map", "To avoid flying over any bodies of water", "Because aircraft compasses only work above 60\xB0 North latitude", "To stay inside the stratospheric ozone layer"], "A Great Circle route traces the intersection of the Earth's surface with a plane passing through the center of the globe, minimizing true ground distance.", "geo_great_circle", ["aviation", "navigation"]],
  ["What causes trans-Atlantic flights traveling Eastbound (New York to London) to have significantly shorter flight times than Westbound flights (London to New York)?", ["The Polar and Subtropical Jet Streams \u2014 fast-moving westerly upper-tropospheric wind ribbons driven by the Coriolis effect and thermal gradients", "The gravitational pull of the Moon pulling planes eastward", "London sits at a lower elevation than New York", "Airlines fly supersonic only when heading east"], "Jet streams blow predominantly from West to East at 30,000\u201340,000 feet at speeds often exceeding 100\u2013200 knots, creating strong tailwinds eastbound and headwinds westbound.", "geo_jet_stream", ["meteorology", "aviation"]],
  ["Which artificial sea-level waterway in Egypt connects the Mediterranean Sea (Port Said) directly to the Red Sea (Suez) without any lock systems?", ["The Suez Canal", "The Panama Canal", "The Kiel Canal", "The Corinth Canal"], "Unlike the Panama Canal (which uses locks to lift ships to Gatun Lake), the Suez Canal is a sea-level cut between the Mediterranean and the Gulf of Suez.", "none", ["maritime", "canals"]],
  ["Which South American desert, situated between the Pacific Coastal Range and the Andes in northern Chile, is the driest non-polar desert on Earth?", ["The Atacama Desert", "The Patagonian Steppe", "The Sonora Desert", "The Kalahari Desert"], "The Atacama Desert experiences a double rain shadow from the Andes to the east and the cold Humboldt Current inversion layer along the Pacific coast to the west.", "geo_tectonic_subduction", ["deserts", "climatology"]],
  ["In airport nomenclature, what is the difference between an airport's 3-letter IATA code (e.g., LHR, JFK, SIN) and its 4-letter ICAO code (e.g., EGLL, KJFK, WSSS)?", ["IATA 3-letter codes are used for passenger ticketing and baggage tags, whereas ICAO 4-letter codes are used by pilots and air traffic control with geographic region/country prefixes", "IATA codes are used only for military bases", "ICAO codes change every month based on weather", "IATA codes indicate the number of runways"], "ICAO codes follow a structured geographic prefix system (e.g., K = Continental US, E = Northern Europe, V/W = South/Southeast Asia) used in flight plans and METAR weather reports.", "geo_airport_runway", ["aviation", "airports"]],
  ["In cartography, what critical mathematical property makes the Mercator Projection indispensable for marine navigation despite severely inflating the apparent area of Greenland and Antarctica?", ["It is a Conformal cylindrical projection that preserves local angles, meaning any line of constant compass bearing (a Rhumb Line or Loxodrome) plots as a straight line", "It is an Equal-Area projection like the Gall-Peters or Mollweide projection", "It has zero distortion at the North and South Poles", "It shows Great Circle arcs as horizontal straight lines everywhere"], "On a Mercator chart, stretching the latitude scale toward the poles by sec(\u03C6) matches the east-west meridian convergence, making every constant-heading rhumb line a straight line.", "geo_coord_projection", ["cartography", "projections"]],
  ["In plate tectonics, what geological process occurs at an oceanic-continental convergent boundary such as the Nazca Plate meeting the South American Plate?", ["Subduction \u2014 the denser basaltic oceanic lithosphere sinks into the asthenosphere beneath the more buoyant granitic continental crust, forming a deep ocean trench (Peru-Chile Trench) and a volcanic arc (the Andes)", "Sea-floor spreading creating a mid-ocean ridge", "Conservative transform sliding with zero volcanism", "Obduction of the continental mantle over the atmosphere"], "Oceanic crust (~3.0 g/cm\xB3) is denser than continental crust (~2.7 g/cm\xB3); as the oceanic slab subducts, hydration melting of the overlying mantle wedge drives calc-alkaline volcanism.", "geo_tectonic_subduction", ["tectonics", "geology"]],
  ["When crossing the International Date Line (~180\xB0 longitude) while traveling Westbound (from San Francisco/Honolulu toward Tokyo/Auckland), how does the calendar date change?", ["You advance the calendar forward by one full day (e.g., Monday immediately becomes Tuesday)", "You set the calendar back by one full day (Tuesday becomes Monday)", "The time shifts by 30 minutes with no date change", "Only the hemisphere changes from North to South"], "Moving west across the 180\xB0 International Date Line jumps from UTC-12 to UTC+12, adding 24 hours (skipping forward one calendar date).", "geo_coord_projection", ["timezones", "navigation"]]
];
var VERY_HARD_GEO = [
  ["Using Spherical Trigonometry (or the Haversine / Great-Circle distance law), how many nautical miles correspond to 1 degree of latitude (or 1 degree of arc along any Great Circle) on Earth, and why was the nautical mile defined this way?", ["60 nautical miles per degree of arc (1 nautical mile = 1,852 meters \u2248 1 minute of latitude arc = 1/60th of a degree)", "100 nautical miles per degree of arc", "52.80 nautical miles per degree of arc", "360 nautical miles per degree of arc"], "One full meridian circle is 360\xB0 \xD7 60' = 21,600 arcminutes; defining 1 nautical mile as 1 minute of arc (internationally fixed at 1,852 m) lets navigators measure distances directly against the latitude scale on charts.", "geo_great_circle", ["geodesy", "navigation"]],
  ['In physical oceanography, what is "Ekman Transport", and why does wind blowing equatorward along the west coast of a continent (e.g., Peru or California) push surface water 90\xB0 offshore to trigger cold, nutrient-rich coastal upwelling?', ["Balance between wind surface shear stress, turbulent eddy viscosity down the water column, and the Coriolis force deflects net vertically integrated transport 90\xB0 to the right of the wind in the Northern Hemisphere (90\xB0 left in the Southern Hemisphere), drawing deep cold water up to replace the diverging surface layer", "Tidal resonance from Jupiter pulls surface water offshore", "Salinity evaporation heats the ocean floor to 100\xB0C", "Coriolis force is strongest at 0\xB0 Equator and zero at the Poles"], "As wind drags the top layer, Coriolis deflection turns each deeper layer further (the Ekman spiral), resulting in a net 90\xB0 Ekman transport away from the coast and driving coastal upwelling.", "geo_jet_stream", ["oceanography", "coriolis"]]
];
var WORLD_GEO_FACTS = [
  ["Strait of Malacca", "Narrow maritime chokepoint between the Malay Peninsula and the Indonesian island of Sumatra, linking the Indian Ocean (Andaman Sea) to the South China Sea and Pacific Ocean", "Connects the Black Sea to the Sea of Marmara in Turkey", "Separates Spain from Morocco at the entrance to the Mediterranean", "Divides Alaska from Chukotka in Russia"],
  ["Strait of Hormuz", "Strategic maritime passage connecting the Persian Gulf with the Gulf of Oman and the Arabian Sea, bounded by Iran to the north and the Musandam Peninsula (Oman/UAE) to the south", "Links the Red Sea to the Gulf of Aden (Bab-el-Mandeb)", "Separates Tasmania from mainland Australia (Bass Strait)", "Connects Lake Erie to Lake Ontario"],
  ["Bab-el-Mandeb Strait", "Chokepoint at the southern entrance of the Red Sea connecting it to the Gulf of Aden and Indian Ocean, situated between Yemen on the Arabian Peninsula and Djibouti/Eritrea in the Horn of Africa", "Separates Sicily from the Italian Peninsula (Strait of Messina)", "Connects the Baltic Sea to the North Sea (Kattegat/Skagerrak)", "Divides Tierra del Fuego from mainland South America"],
  ["Bosphorus and Dardanelles (Turkish Straits)", "Connect the Black Sea through the Sea of Marmara to the Aegean and Mediterranean Seas, while separating Asian Anatolia from European Thrace", "Connect the Caspian Sea to the Aral Sea", "Separate Britain from France in the English Channel", "Link the Gulf of Mexico to the Atlantic Ocean"],
  ["Drake Passage", "Wide, deep oceanic body of water between Cape Horn at the southern tip of South America and the South Shetland Islands of Antarctica, carrying the Antarctic Circumpolar Current", "Calm inland canal across southern France", "Shallow tropical lagoon in the Maldives", "River delta in northern Siberia"],
  ["Panama Canal Lock System & Gatun Lake", "Raises vessels ~26 meters (85 feet) above sea level via three sets of locks into artificial Gatun Lake across the Continental Divide before lowering them to the opposite ocean", "Is an open sea-level trench with zero locks like the Suez Canal", "Tunnels underground through solid granite beneath the Andes", "Connects the Amazon River to the Orinoco River"],
  ["Danube River Basin", "Second-longest river in Europe, rising in Germany's Black Forest and flowing southeast through 10 countries (and 4 national capitals: Vienna, Bratislava, Budapest, Belgrade) into the Black Sea", "Flows north through Paris into the English Channel", "Empties into the Baltic Sea at Gda\u0144sk", "Forms the border between Spain and Portugal"],
  ["Mekong River System", "Trans-boundary Southeast Asian river originating on the Tibetan Plateau and flowing through China (Yunnan), Myanmar, Laos, Thailand, Cambodia, and Vietnam into the South China Sea", "Flows westward across India into the Arabian Sea", "Drains the Australian Outback into the Southern Ocean", "Empties into the Sea of Japan at Vladivostok"],
  ["Lake Baikal (Siberia, Russia)", "Deepest (1,642 m) and oldest (~25 million years) freshwater lake on Earth, occupying an active continental rift zone and holding roughly 22\u201323% of the world's liquid surface fresh water", "A shallow man-made reservoir in the Sahara Desert", "A hypersaline endorheic sea below sea level like the Dead Sea", "A volcanic crater lake in the Andes at 5,000 meters"],
  ["Tropic of Cancer (approx. 23\xB026\u2032 North Latitude)", "Marks the northernmost latitude at which the Sun can appear directly overhead at the zenith, occurring on the June Solstice when the Northern Hemisphere is tilted maximally toward the Sun", "Marks the boundary of 24-hour polar night in December", "Passes through Sydney, Cape Town, and Buenos Aires", "Is located at 45\xB000\u2032 North Latitude"],
  ["Tropic of Capricorn (approx. 23\xB026\u2032 South Latitude)", "Marks the southernmost latitude at which the Sun reaches the overhead zenith at solar noon during the December Solstice, passing through Australia, southern Africa, and South America", "Marks the northern border of Canada and Alaska", "Sits at 0\xB000\u2032 latitude along the Equator", "Defines the boundary of the Antarctic Treaty at 60\xB0S"],
  ["ICAO Airport Code EGLL & IATA Code LHR (London Heathrow)", 'Located west of Central London with parallel east-west runways (09L/27R and 09R/27L) aligned with prevailing westerly winds; "E" denotes Northern Europe and "G" denotes the United Kingdom', "Located in Frankfurt, Germany (EDDF / FRA)", "Located in Tokyo Haneda, Japan (RJTT / HND)", "Located in Dubai, UAE (OMDB / DXB)"],
  ["ICAO Airport Code WSSS & IATA Code SIN (Singapore Changi)", "Major Southeast Asian aviation hub built partially on reclaimed coastal land at the eastern tip of Singapore with a three-parallel-runway system", "Located in Kuala Lumpur, Malaysia (WMKK / KUL)", "Located in Hong Kong (VHHH / HKG)", "Located in Sydney, Australia (YSSY / SYD)"],
  ["ICAO Airport Code KJFK & IATA Code JFK (New York John F. Kennedy)", 'Situated on Jamaica Bay in Queens, New York, featuring four runways surrounding the central terminal area; "K" is the ICAO prefix for the contiguous United States', "Located in Chicago O'Hare (KORD / ORD)", "Located in Los Angeles (KLAX / LAX)", "Located in Toronto Pearson (CYYZ / YYZ)"],
  ["Prime Meridian vs. WGS84 (IERS Reference Meridian)", "Modern GPS (WGS84) places 0\xB000\u203200\u2033 longitude approximately 102.5 meters east of the historical Airy Transit Circle at Greenwich because satellite geodetic datums reference the Earth's true center of mass rather than local plumb-line gravity deflection", "WGS84 places 0\xB0 longitude through Paris, France", "The Greenwich meridian moves 10 kilometers every year due to tides", "GPS uses magnetic north instead of geographic coordinates"],
  ["Orographic Lift and Rain Shadow Effect", "Moist prevailing winds forced upward over a mountain barrier cool adiabatically, condensing heavy precipitation on the windward slope while descending as warm, dry Foehn/Chinook air on the leeward rain-shadow side", "Causes heavy rainfall exclusively in deep valleys while mountain peaks stay bone dry", "Only occurs along the Equator where there are no mountains", "Cools descending air at 20\xB0C per 100 meters"],
  ["Coriolis Parameter f = 2\u03A9 sin(\u03C6)", "Equals zero exactly at the Equator (\u03C6 = 0\xB0) and reaches its maximum magnitude at the Poles (\u03C6 = \xB190\xB0), explaining why tropical cyclones cannot form within ~5\xB0 of the Equator where planetary vorticity is insufficient to organize rotation", "Is strongest at the Equator and zero at the North and South Poles", "Causes water in small kitchen sinks to spin strictly clockwise", "Depends on the phase of the Moon rather than Earth's rotation"],
  ["El Ni\xF1o\u2013Southern Oscillation (ENSO) Warm Phase", "Weakening of the Pacific equatorial trade winds allows the western Pacific warm pool to slosh eastward toward Peru and Ecuador, flattening the thermocline, suppressing cold Humboldt upwelling, and shifting convective rainfall across the Pacific", "Freezes the entire equatorial Pacific Ocean solid", "Strengthens easterly trade winds to 100 knots continuously", "Only affects inland lakes in Europe"],
  ["Mid-Atlantic Ridge & Iceland Tectonic Setting", "A divergent plate boundary where the North American and Eurasian Plates pull apart at ~2 cm/year; in Iceland, the mid-ocean ridge rises above sea level because it coincides with a buoyant deep-mantle hotspot plume", "A convergent subduction trench 10,000 meters deep", "A dormant craton with zero volcanic or seismic activity for 1 billion years", "Located between Australia and New Zealand"],
  ["UTM (Universal Transverse Mercator) Coordinate System", "Divides the Earth between 80\xB0S and 84\xB0N into 60 longitudinal zones of 6\xB0 width each, applying a secant transverse Mercator projection in meters (Easting and Northing) to keep scale distortion under 1 part in 1,000 within each zone", "Uses a single conical projection centered on Antarctica", "Measures coordinates exclusively in nautical leagues", "Divides the world into 4 zones of 90\xB0 width"]
];
function buildGeoTier(baseTuples, difficulty, targetCount, extraPool, diagramDefault) {
  const items = [];
  for (let i = 0; i < baseTuples.length && items.length < targetCount; i++) {
    const [qText, opts, exp, diag, tags] = baseTuples[i];
    items.push({
      code: `geo_${difficulty.toLowerCase().replace(/\s+/g, "_")}_${items.length + 1}`,
      categorySlug: "traveling",
      difficulty,
      questionText: qText,
      options: opts,
      explanation: exp,
      diagramType: diag,
      tags,
      estimatedTimeSec: difficulty === "Easy" ? 15 : difficulty === "Normal" ? 25 : difficulty === "Hard" ? 40 : 60
    });
  }
  let idx = 0;
  while (items.length < targetCount) {
    const fact = extraPool[idx % extraPool.length];
    const variantRound = Math.floor(idx / extraPool.length);
    const [subject, correctDesc, w1, w2, w3] = fact;
    const questionText = variantRound === 0 ? `In world geography and global navigation, which statement accurately characterizes ${subject}?` : variantRound === 1 ? `When planning international aviation or maritime routes, what is the defining geographic feature of ${subject}?` : `From a physical geography and cartography standpoint, how is ${subject} accurately described?`;
    items.push({
      code: `geo_${difficulty.toLowerCase().replace(/\s+/g, "_")}_${items.length + 1}`,
      categorySlug: "traveling",
      difficulty,
      questionText,
      options: [correctDesc, w1, w2, w3],
      explanation: `${subject}: ${correctDesc}.`,
      diagramType: idx % 3 === 0 ? diagramDefault : "none",
      tags: ["geography", "navigation", subject.toLowerCase().split(" ")[0]],
      estimatedTimeSec: difficulty === "Hard" ? 40 : 60
    });
    idx++;
  }
  return items;
}
var TRAVELING_QUESTIONS = [
  ...buildGeoTier(EASY_GEO, "Easy", 50, [], "none"),
  ...buildGeoTier(NORMAL_GEO, "Normal", 50, [], "none"),
  ...buildGeoTier(HARD_GEO, "Hard", 50, WORLD_GEO_FACTS, "geo_great_circle"),
  ...buildGeoTier(VERY_HARD_GEO, "Very Hard", 50, WORLD_GEO_FACTS, "geo_tectonic_subduction")
];

// src/db/banks/programmingBank.ts
var EASY_PROG = [
  ['What will the computer show on the screen if you run the command `print("Hello")`?', ["Hello", "Goodbye", "12345", "Nothing at all"], "The `print` command displays the words inside the quotation marks right on the screen.", "none", ["basics", "output"]],
  ["In computer math, what answer does `2 + 3` give?", ["5", "23", "6", "0"], "Computers add numbers just like in school math: 2 + 3 equals 5.", "none", ["basics", "math"]],
  ["In computer math, what answer does `10 - 4` give?", ["6", "14", "40", "2"], "Subtracting 4 from 10 gives 6.", "none", ["basics", "math"]],
  ["What do computer programmers call a mistake or error inside a computer program?", ["A Bug", "A Bird", "A Cloud", "A Leaf"], 'Mistakes in code are famously called "bugs", and fixing them is called "debugging"!', "none", ["basics", "terms"]],
  ['What do we call fixing a mistake ("bug") in a computer program so it works properly?', ["Debugging", "Painting", "Washing", "Cooking"], "Debugging means finding and fixing errors in your code.", "none", ["basics", "terms"]],
  ['What does "Coding" (or Programming) mean?', ["Writing step-by-step instructions that tell a computer what to do", "Cleaning a computer screen with a cloth", "Plugging in a lamp", "Taking a photo with a camera"], "Code is a list of clear step-by-step instructions that a computer follows.", "none", ["basics", "concepts"]],
  ["If a game rule says: `IF coins == 10 THEN give extra life`, when do you get an extra life?", ["When you collect 10 coins", "When you have 0 coins", "When you close the game", "Every 2 seconds"], "An `IF` statement checks if a condition is true before doing the action.", "none", ["basics", "logic"]],
  ['In coding, what do we call a command that repeats the same action over and over (like "jump 5 times")?', ["A Loop", "A Shoe", "A Window", "A Brick"], "Loops let you repeat instructions without having to type the same line over and over.", "none", ["basics", "loops"]],
  ["Is the math statement `5 > 2` (5 is greater than 2) `True` or `False`?", ["True", "False", "Neither", "Both"], "Since 5 is bigger than 2, the comparison `5 > 2` is True.", "none", ["basics", "logic"]],
  ["Is the math statement `3 > 9` (3 is greater than 9) `True` or `False`?", ["False", "True", "Maybe", "12"], "Since 3 is smaller than 9, `3 > 9` is False.", "none", ["basics", "logic"]],
  ["What popular beginner coding tool from MIT lets kids snap colorful puzzle blocks together to make games and animations with an orange cat mascot?", ["Scratch", "Calculator", "Recycle Bin", "Notepad"], "Scratch uses drag-and-drop colorful blocks so anyone can build stories and games easily.", "none", ["basics", "scratch"]],
  ["Which popular, beginner-friendly programming language shares its name with a type of big snake (\u{1F40D})?", ["Python", "Cobra-99", "Turtle-X", "Dolphin"], "Python is one of the world's most popular and easy-to-read programming languages.", "none", ["basics", "languages"]],
  ["In a video game's code, if `score = 0` and you add 1 point (`score = score + 1`), what is `score` now?", ["1", "0", "10", "100"], "Starting at 0 and adding 1 makes the new score 1.", "none", ["basics", "variables"]],
  ["In coding, what do we call a named box (like `score` or `player_name`) that remembers a number or word for later?", ["A Variable", "A Speaker", "A Mouse Pad", "A Cable"], "A variable is like a labeled storage box in memory that holds a value such as a player's name or score.", "none", ["basics", "variables"]],
  ["In computer code, which symbol is almost always used for multiplication (like `4 * 5` = 20)?", ["The Star / Asterisk (`*`)", "The Question Mark (`?`)", "The Period (`.`)", "The Comma (`,`)"], "Because the letter `x` can be a variable name, programming languages use `*` for multiplication.", "none", ["basics", "math"]],
  ["In computer code, which symbol is usually used to divide numbers (like `10 / 2` = 5)?", ["The Forward Slash (`/`)", "The Plus Sign (`+`)", "The Exclamation Mark (`!`)", "The Dollar Sign (`$`)"], "In code, `10 / 2` divides 10 by 2 to get 5.", "none", ["basics", "math"]],
  ["What will `print(4 * 2)` display on the screen?", ["8", "6", "42", "2"], "4 multiplied by 2 equals 8.", "none", ["basics", "math"]],
  ["If a robot is given these steps in order: 1. Step Forward, 2. Step Forward, 3. Turn Right \u2014 what does the robot do first?", ["Step Forward", "Turn Right", "Sit Down", "Spin Around"], "Computers follow code instructions in sequence from top to bottom, starting with Step 1.", "none", ["basics", "sequence"]],
  ["Why is the exact order of steps important when writing a computer program (just like a recipe)?", ["Because the computer follows your steps in the exact order you wrote them", "Because computers pick steps at random", "Because computers only read the last line", "Order does not matter at all"], "Just like putting on socks before shoes, a computer executes instructions step-by-step in order.", "none", ["basics", "sequence"]],
  ["In coding, what are the only two possible values of a True/False (Boolean) check?", ["True and False", "Up and Down", "Red and Blue", "Fast and Slow"], "Boolean logic in computers is based on two values: `True` (Yes/1) and `False` (No/0).", "none", ["basics", "logic"]],
  ["What is the opposite of `True` in computer logic?", ["False", "Yes", "100", "Plus"], "`Not True` is `False`, and `Not False` is `True`.", "none", ["basics", "logic"]],
  ['In code, why do we put quotation marks around words like `"Hello World"`?', ["To show the computer that those words are text (a string) to display, not commands", "To make the letters print in red", "To delete the words", "To make the computer beep"], 'Text inside quotation marks is called a "String" in programming.', "none", ["basics", "strings"]],
  ['What do programmers call a piece of text inside quotation marks, such as `"Pikachu"` or `"BCA"`?', ["A String (of characters)", "A Rope", "A Wire", "A Shoe"], 'Because letters are strung together one after another, programmers call text a "String".', "none", ["basics", "strings"]],
  ['If you join the two text strings `"Super"` + `"man"` together in code, what word do you get?', ['"Superman"', '"Super"', '"man"', '"123"'], 'Joining two strings with `+` glues the words together into `"Superman"`.', "none", ["basics", "strings"]],
  ['If you have a list of fruits `["Apple", "Banana", "Mango"]`, how many items are in that list?', ["3 items", "1 item", "10 items", "0 items"], "The list contains 3 fruit names.", "none", ["basics", "lists"]],
  ['What is a "Comment" in computer code (like `# This adds two numbers`)?', ["A helpful note written for humans reading the code that the computer ignores when running", "A virus that stops the computer", "A message sent to a printer", "A loud sound effect"], "Programmers write comments in their code to explain how it works to classmates and teammates.", "none", ["basics", "comments"]],
  ["If a loop says `Repeat 4 times: Clap Hands`, how many times will the character clap?", ["4 times", "1 time", "10 times", "0 times"], "A `Repeat 4` loop runs the action inside it 4 times.", "none", ["basics", "loops"]],
  ['What happens if a program has an "Infinite Loop" (`Repeat Forever`) with no way to stop?', ["It keeps repeating the same thing forever until you stop the program", "It stops immediately after 1 second", "It turns off the monitor", "It prints a paper"], "An infinite loop repeats endlessly unless a stop condition is reached.", "none", ["basics", "loops"]],
  ["In a video game, what event usually makes your character jump?", ["Pressing a key (like the Spacebar) or tapping a button", "Turning off the monitor", "Unplugging the mouse", "Waiting 5 hours"], 'Programs listen for "Events" like key presses or mouse clicks to make things happen.', "none", ["basics", "events"]],
  ["If `age = 10`, is the condition `age == 10` True or False?", ["True", "False", "Zero", "Error"], "Since `age` is 10, checking whether `age` equals 10 is True.", "none", ["basics", "logic"]],
  ["If `lives = 3` and your character loses 1 life (`lives = lives - 1`), how many lives are left?", ["2", "3", "4", "0"], "3 minus 1 leaves 2 lives remaining.", "none", ["basics", "variables"]],
  ['What two numbers make up the "Binary Code" (`0`s and `1`s) that all computer chips use deep down?', ["0 and 1", "5 and 9", "2 and 8", "A and Z"], "Inside every computer chip, switches are either OFF (`0`) or ON (`1`).", "none", ["basics", "binary"]],
  ["In binary switches inside a computer, if `0` means OFF, what does `1` mean?", ["ON", "OFF", "BROKEN", "HALF"], "Binary uses `1` for ON (True) and `0` for OFF (False).", "none", ["basics", "binary"]],
  ["What do we call a reusable block of code with a name (like `jump()` or `drawStar()`) that you can call whenever you need it?", ["A Function", "A Keyboard", "A Battery", "A Folder"], "Functions let you group several steps under one name and run them anytime.", "none", ["basics", "functions"]],
  ["In an `IF ... ELSE` rule: `IF sunny THEN wear sunglasses ELSE carry umbrella` \u2014 what do you do when it is NOT sunny?", ["Carry an umbrella", "Wear sunglasses", "Go swimming", "Do nothing"], "The `ELSE` part runs whenever the `IF` condition is False.", "none", ["basics", "logic"]],
  ["In logic, if a door only opens when `hasBlueKey AND hasRedKey` are both True, will it open if you only have the Blue Key?", ["No, because `AND` requires BOTH keys to be True", "Yes, one key is enough", "It opens without any keys", "It deletes the door"], "An `AND` rule is True only when both conditions are True at the same time.", "none", ["basics", "logic"]],
  ["In logic, if you can pay for a ticket with `Cash OR Card`, can you buy the ticket if you only have a Card?", ["Yes, because `OR` works if EITHER one is True", "No, you must use both at once", "No, tickets are closed", "Only on Sundays"], "An `OR` rule is True if at least one of the options is True.", "none", ["basics", "logic"]],
  ["On a computer screen grid, what do the `X` and `Y` coordinates of a game character tell you?", ["Where the character is located left-to-right (`X`) and up-and-down (`Y`) on the screen", "How loud the music is", "What color the character's hat is", "What time of day it is"], "2D games use `X` (horizontal) and `Y` (vertical) coordinates to position sprites on screen.", "none", ["basics", "games"]],
  ["In a 2D game like Scratch, what do we call a character or object (like a cat, spaceship, or coin) that moves around the stage?", ["A Sprite", "A Printer", "A Cable", "A Router"], "In game programming, each movable 2D character or item on screen is called a Sprite.", "none", ["basics", "games"]],
  ['What does "Input" mean in a computer program?', ["Information the user gives to the program\u2014like typing a name or clicking a button", "Music playing from the speakers", "A picture printed on paper", "The computer case color"], "Keyboard typing, mouse clicks, and microphone audio are all examples of Input.", "none", ["basics", "concepts"]],
  ['What does "Output" mean in a computer program?', ["What the program shows or plays back to the user\u2014like text on screen, graphics, or sound", "Pressing a key on the keyboard", "Plugging the power cord into the wall", "Moving the mouse"], "Displaying results on the screen or playing sound through speakers is Output.", "none", ["basics", "concepts"]],
  ["If you write `print(5 + 5)` in Python, what is printed?", ["10", "55", "0", "25"], "Because `5 + 5` is not in quotes, Python calculates the math and prints `10`.", "none", ["basics", "python"]],
  ['What is an "Algorithm" in everyday words?', ["A clear step-by-step recipe or set of rules for solving a problem", "A broken computer screen", "A type of USB cable", "A loud cooling fan"], "Just like a recipe for baking a cake or steps for tying your shoes, an algorithm is a step-by-step procedure.", "none", ["basics", "concepts"]],
  ["Which language is used to put headings, paragraphs, and images onto every webpage on the internet?", ["HTML", "MP3", "JPEG", "ZIP"], "HTML (HyperText Markup Language) creates the structure and content of web pages.", "none", ["basics", "web"]],
  ["In HTML, what does a `<h1>Hello</h1>` tag put on a webpage?", ['A large main Heading that says "Hello"', "A hidden password", "A music player", "A delete button"], "`<h1>` stands for Heading 1\u2014the largest title heading on a webpage.", "none", ["basics", "web"]],
  ["If a computer counts up by 2s starting at 2 (`2, 4, 6, 8, ...`), what number comes next?", ["10", "9", "12", "7"], "Adding 2 to 8 gives 10.", "none", ["basics", "patterns"]],
  ["If `x = 7` and `y = 3`, what is `x + y`?", ["10", "73", "4", "21"], "Substituting 7 for `x` and 3 for `y` gives 7 + 3 = 10.", "none", ["basics", "variables"]],
  ["What do we call a person whose job is writing code to build apps, websites, and games?", ["A Programmer (or Software Developer)", "A Botanist", "A Geologist", "A Baker"], "Programmers (software developers) write and maintain the code that powers apps and websites.", "none", ["basics", "careers"]],
  ["Why is it a good idea to give variables clear names like `playerScore` instead of `xyz123`?", ["So you and other people reading the code can easily understand what the variable stores", "Because computers run faster with long words", "Because numbers are not allowed", "To make the screen brighter"], "Clear variable names make code much easier to read, understand, and fix.", "none", ["basics", "style"]],
  ["When you finish writing a program file, what must you do before running it or closing your editor so you don't lose your work?", ["Save the file (`Ctrl + S`)", "Unplug the monitor", "Empty the Recycle Bin", "Mute the speakers"], "Saving your code file writes your changes safely to disk.", "none", ["basics", "workflow"]]
];
var NORMAL_PROG = [
  ["When building a website, what are the roles of `HTML` and `CSS`?", ["HTML provides the structure and text of the page, while CSS controls the colors, fonts, and visual layout", "HTML plays music, while CSS cools the computer", "Both are types of computer cables", "HTML is only for phones, and CSS is only for printers"], "HTML defines the page content and elements; CSS (Cascading Style Sheets) styles how they look.", "none", ["everyday", "web"]],
  ["Which programming language runs directly inside every modern web browser to make websites interactive (like menus, pop-ups, and live updates)?", ["JavaScript", "Microsoft Word", "AutoCAD", "MP4"], "JavaScript is the standard scripting language built into all web browsers.", "none", ["everyday", "web"]],
  ['What does a "404 Not Found" error message mean when you click a link on a website?', ["The webpage you requested could not be found at that address (it may have been moved, deleted, or mistyped)", "Your computer battery is at 4%", "You have won 404 prizes", "Your keyboard is unplugged"], "HTTP status code 404 means the server is reachable, but no page exists at that specific URL.", "none", ["everyday", "web"]],
  ['What is a "Database" in software and websites?', ["An organized digital system for storing, searching, and updating large amounts of information (like user accounts, products, or student records)", "A plastic stand that holds a monitor", "A folder for deleted trash files", "A computer screen saver"], "Databases store structured data so apps and websites can look up and save records reliably.", "none", ["everyday", "databases"]],
  ["Which language is the standard for asking questions (queries) to a relational database, using words like `SELECT * FROM students`?", ["SQL (Structured Query Language)", "MP3", "PNG", "HDMI"], "SQL is used across databases like PostgreSQL, MySQL, and SQLite to read and update data.", "none", ["everyday", "sql"]],
  ['What does "Open-Source Software" (like Linux, Python, or VS Code) mean?', ["Software whose source code is publicly available so anyone can inspect, use, learn from, and contribute improvements to it", "Software that can only be used outdoors", "Software that has no password security", "Software that deletes itself after one day"], "Open-source projects allow developers around the world to view and collaborate on the source code.", "none", ["everyday", "concepts"]],
  ['What is "Source Code"?', ["The human-readable program instructions written by developers in a language like Python, Java, C, or TypeScript", "A barcode printed on a cereal box", "The serial number on the back of a TV", "A secret Wi-Fi password"], "Source code is the original text written by programmers in files like `.py`, `.js`, `.c`, or `.java`.", "none", ["everyday", "concepts"]],
  ['What is the difference between "Frontend" and "Backend" in web development?', ["The Frontend is the visual interface the user sees and clicks in their browser; the Backend is the server and database working behind the scenes", "The Frontend is the screen and the Backend is the power cord", "They are the exact same thing", "The Frontend only works at night"], "Frontend code renders the UI in the browser, while Backend code handles server logic, authentication, and databases.", "none", ["everyday", "web"]],
  ["What do we call a developer who works on BOTH the visual Frontend and the server/database Backend of an application?", ["A Full-Stack Developer", "A Half-Screen Developer", "A Hardware Mechanic", "A Network Cable Installer"], "A Full-Stack Developer builds both client-side UI and server-side backend systems.", "none", ["everyday", "careers"]],
  ['What is "GitHub" widely used for by students and software developers?', ["Hosting code repositories online, tracking version history with Git, and collaborating on software projects with teammates", "Ordering groceries online", "Streaming live television sports", "Cleaning viruses off a USB stick"], "GitHub is the most popular platform for storing Git code repositories and collaborating on projects.", "none", ["everyday", "tools"]],
  ['What is an "API" (Application Programming Interface) in simple terms?', ["A messenger or bridge that lets two different software programs talk to each other and exchange data (such as a weather app asking a weather server for today's forecast)", "A type of computer monitor", "A cooling fan inside a laptop", "A font style in Microsoft Word"], "APIs define clear rules for how one software application can request data or actions from another service.", "none", ["everyday", "concepts"]],
  ["In programming, why do lists and arrays in most languages (like C, Java, Python, and JavaScript) start counting positions at `0` instead of `1`?", ["Because the index measures how many steps you move forward from the very beginning of the list (so the first item is 0 steps from the start)", "Because programmers forgot the number 1 existed", "Because computers cannot display the number 1", "Only empty lists start at 0"], "Zero-based indexing means the first item is at index `0`, the second at index `1`, and so on.", "none", ["everyday", "arrays"]],
  ['In a zero-indexed list `colors = ["Red", "Green", "Blue"]`, which color is at `colors[0]`?', ['"Red"', '"Green"', '"Blue"', "None"], 'Index `0` always refers to the very first item in the list, which is `"Red"`.', "none", ["everyday", "arrays"]],
  ['What is an "IDE" or "Code Editor" (such as VS Code, PyCharm, or IntelliJ)?', ["A specialized text editor for programmers that highlights code colors, catches typos, and helps run and debug programs", "A machine that prints circuit boards", "A game controller with extra buttons", "A type of internet browser for kids"], "Code editors and IDEs provide syntax highlighting, autocomplete, and debugging tools for writing code.", "none", ["everyday", "tools"]],
  ['What is a "Syntax Error" when writing code?', ["A grammar or punctuation mistake in the code (like a missing parenthesis `)` or quote) that stops the program from running", "When the computer monitor is unplugged", "When the internet connection is slow", "When the battery is low"], "Just like human languages have grammar rules, programming languages require valid syntax to run.", "none", ["everyday", "errors"]],
  ["What is the difference between an `Integer` (like `42`) and a `Float` (like `3.14`) in programming?", ["An Integer is a whole number without decimals, while a Float (floating-point number) has a decimal point", "An Integer is text, while a Float is a picture", "Floats can only be negative numbers", "Integers can only be 0 or 1"], "Programming languages distinguish whole numbers (`int`) from decimal numbers (`float` / `double`).", "none", ["everyday", "types"]],
  ["In most programming languages, what is the difference between a single equals sign (`x = 5`) and a double equals sign (`x == 5`)?", ["`x = 5` stores the value 5 into `x` (assignment), whereas `x == 5` asks whether `x` is equal to 5 (comparison)", "They mean the exact same thing", "`x = 5` deletes `x`", "`x == 5` makes `x` equal to 55"], "Single `=` assigns a value to a variable; double `==` compares two values for equality.", "none", ["everyday", "syntax"]],
  ["What does the modulo operator `%` (such as `10 % 3`) calculate in programming?", ["The remainder left over after division (10 divided by 3 has a remainder of 1)", "10 percent of 3", "10 multiplied by 3", "10 raised to the power of 3"], "The `%` operator returns the division remainder, which is great for checking if a number is even (`n % 2 == 0`).", "none", ["everyday", "math"]],
  ["How can you easily check if an integer `n` is an EVEN number in code?", ["Check if `n % 2 == 0` (the remainder when divided by 2 is 0)", "Check if `n > 100`", "Check if `n + 1 == 0`", "Check if `n` is negative"], "Every even number is divisible by 2 with zero remainder (`n % 2 == 0`).", "none", ["everyday", "logic"]],
  ["Which classic programming language, created by Dennis Ritchie in the early 1970s, is still taught as a foundational language in BCA and computer science courses?", ["C", "HTML", "Scratch", "CSS"], "The C language laid the foundation for operating systems and later languages like C++, Java, C#, and Rust.", "none", ["everyday", "languages"]],
  ["In a C, C++, or Java program, what is the name of the special starting function where the program begins running?", ["`main()`", "`end()`", "`stop()`", "`help()`"], "Execution of a standard C, C++, Java, or Rust program begins inside the `main` function.", "none", ["everyday", "languages"]],
  ["In C, C++, Java, and JavaScript, what punctuation mark is commonly placed at the end of a statement line?", ["A Semicolon (`;`)", "A Question Mark (`?`)", "An Exclamation Mark (`!`)", "A Dollar Sign (`$`)"], "C-family languages use a semicolon (`;`) to mark the end of a statement.", "none", ["everyday", "syntax"]],
  ["How does Python know which lines of code belong inside an `if` block or a `for` loop, instead of using curly braces `{ }`?", ["By Indentation (spaces at the beginning of the line)", "By the color of the font", "By typing in ALL CAPS", "By putting a question mark at the end"], "Python uses consistent indentation (typically 4 spaces) to group blocks of code cleanly.", "none", ["everyday", "python"]],
  ["What file extension is used for a Python code file?", [".py", ".doc", ".jpg", ".mp3"], "Python scripts are saved with the `.py` extension (for example, `main.py`).", "none", ["everyday", "files"]],
  ["What file extension is used for a JavaScript code file?", [".js", ".pdf", ".png", ".wav"], "JavaScript files use `.js` (and TypeScript files use `.ts`).", "none", ["everyday", "files"]],
  ["What file extension is used for an HTML webpage file?", [".html", ".exe", ".zip", ".mp4"], "Webpages are saved as `.html` files (such as `index.html`).", "none", ["everyday", "files"]],
  ['What does "Compiling" a program (using a Compiler) do?', ["Translates human-written source code (like C or C++) into fast machine code that the computer processor can execute directly", "Prints the code onto paper", "Uploads the code to social media", "Deletes all comments from the screen"], "A compiler checks the entire program for errors and translates it into executable machine instructions.", "none", ["everyday", "concepts"]],
  ['What is a "Library" or "Package" in programming (such as `React` in JavaScript or `NumPy` in Python)?', ["A collection of pre-written, tested code that developers can import into their project so they do not have to build everything from scratch", "A quiet room with paper books", "A folder for old deleted photos", "A hardware graphics card"], "Software libraries provide ready-to-use functions for charts, math, user interfaces, and networking.", "none", ["everyday", "concepts"]],
  ["What is `JSON` (JavaScript Object Notation) commonly used for?", ['A clean, lightweight text format using key-value pairs (`{"name": "Aarav", "score": 95}`) for sending data between a server and a web app', "A format for 3D Blu-ray movies", "A type of power cable", "An antivirus firewall"], "JSON is the universal text format used by web APIs to send and receive structured data.", "none", ["everyday", "web"]],
  ['What does "Responsive Web Design" mean when building a website?', ["Designing the website layout so it automatically adapts and looks great on all screen sizes\u2014phones, tablets, and desktop monitors", "A website that replies to emails automatically", "A website with loud sound effects", "A website that only works on one specific laptop"], "Responsive design uses flexible grids and media queries so pages work smoothly on mobile and desktop.", "none", ["everyday", "web"]],
  ['What is "Version Control" (such as Git)?', ["A tool that tracks every change made to your code over time so you can undo mistakes, compare versions, and work safely with a team", "A dial that controls speaker volume", "A lock on a laptop bag", "A setting that changes screen brightness"], 'Git lets developers save checkpoints ("commits") and revert to any earlier working version if something breaks.', "none", ["everyday", "tools"]],
  ["In programming, what does `null` (or `None` in Python) represent?", ['The intentional absence of any value ("empty" or "nothing")', "The number 100", "An infinite loop", "A syntax error"], "`null` (or `None`) indicates that a variable currently points to no value.", "none", ["everyday", "types"]],
  ["What does a `while` loop do in programming?", ["Keeps repeating a block of code as long as its condition remains `True`", "Runs the code backward once", "Deletes the variable", "Closes the program immediately"], "A `while` loop checks its condition before each pass and stops as soon as the condition becomes `False`.", "none", ["everyday", "loops"]],
  ["What does a `for` loop do when given a list of items (like a list of 20 students)?", ["Steps through the list one item at a time and runs the loop body for each item", "Deletes the list", "Only looks at the last item", "Turns the computer off"], "A `for` loop iterates cleanly over each element in a sequence or range.", "none", ["everyday", "loops"]],
  ["What happens in most programming languages if your code tries to divide a number by zero (`10 / 0`)?", ["It causes a Divide-by-Zero error (or returns `Infinity` in JavaScript)", "It always equals 10", "It always equals 0", "It restarts the router"], "Division by zero is undefined in mathematics and triggers a runtime exception in most languages.", "none", ["everyday", "errors"]],
  ['What is a "Boolean" variable named after?', ["George Boole, the 19th-century mathematician who developed Boolean algebra (`True` / `False` logic)", "A type of French soup", "A mountain in Europe", "A computer brand"], "Boolean logic (`AND`, `OR`, `NOT` on `True`/`False` values) is named after mathematician George Boole.", "none", ["everyday", "history"]],
  ["In Python or JavaScript, how do you find out how many items are in a list or how many characters are in a string?", ["Using `len(my_list)` in Python or `myList.length` in JavaScript", "By counting them on your fingers only", "Using the `delete` command", "Using the `print` command"], "`len()` in Python and `.length` in JavaScript return the exact count of elements.", "none", ["everyday", "syntax"]],
  ['What is "Pseudocode"?', ["Writing out the logical steps of an algorithm in plain, everyday English before writing it in strict programming syntax", "Code that has a virus", "Encrypted secret military code", "Code written backward"], "Students and engineers often sketch an algorithm in plain-English pseudocode first to plan the logic.", "none", ["everyday", "concepts"]],
  ['What is a "Flowchart" in computer science class?', ["A visual diagram using boxes, diamonds (for decisions), and arrows to map out how a program flows step-by-step", "A chart of how fast water flows in a pipe", "A list of keyboard shortcuts", "A photo of a motherboard"], "Flowcharts use oval start/end nodes, rectangular process steps, and diamond decision branches.", "none", ["everyday", "concepts"]],
  ["In a flowchart, which geometric shape is traditionally used for an `IF / Yes-or-No Decision` branch?", ["A Diamond shape (\u25C7)", "A Circle", "A Triangle", "A Star"], "In standard flowchart notation, a diamond represents a conditional decision with Yes/True and No/False arrows.", "none", ["everyday", "concepts"]],
  ["What does `UI` stand for in software design?", ["User Interface \u2014 the buttons, menus, typography, and screens a person interacts with", "Universal Internet", "Unlimited Input", "Underground Installation"], "UI (User Interface) is the visual layout and controls of an application.", "none", ["everyday", "design"]],
  ["What does `UX` stand for in software design?", ["User Experience \u2014 how easy, intuitive, and pleasant the whole app feels for a person to use", "Ultra X-Ray", "Unknown Extension", "User Exit"], "UX (User Experience) focuses on making software clear, fast, and frustration-free for users.", "none", ["everyday", "design"]],
  ['What is "Encryption" in software security?', ["Scrambling sensitive data (like passwords or messages) using a mathematical key so unauthorized people cannot read it", "Deleting files to save disk space", "Making text font size larger", "Translating English into Spanish"], "Encryption converts readable plaintext into unreadable ciphertext that only authorized keys can unlock.", "none", ["everyday", "security"]],
  ["Why should a website NEVER store user passwords as plain readable text in its database?", ["Because if the database is ever leaked, attackers would immediately see everyone's password; instead, websites store a one-way cryptographic hash", "Because plain text takes up too much screen space", "Because databases can only store numbers", "Because browsers cannot type letters"], "Storing salted password hashes (like bcrypt or Argon2) protects users even if a database table is exposed.", "none", ["everyday", "security"]],
  ['What is "Automated Testing" (Unit Testing) in software development?', ["Writing small test scripts that automatically check whether your functions return the right answers whenever you change code", "Dropping a laptop on the floor to test the case", "Asking a friend to click random buttons for 1 minute", "Running a virus scan"], "Unit tests verify that functions work accurately and prevent new changes from breaking existing features.", "none", ["everyday", "testing"]],
  ['What does "Deploying" a web application mean?', ["Publishing the finished application onto a live server so users can visit and use it over the internet", "Deleting the project from your laptop", "Closing all browser tabs", "Unplugging the server"], "Deployment makes your software live and accessible to real users.", "none", ["everyday", "workflow"]],
  ["In an HTML webpage, which tag is used to create a clickable link to another webpage?", ['`<a href="...">` (Anchor tag)', "`<p>` (Paragraph tag)", "`<img>` (Image tag)", "`<table>` (Table tag)"], "The `<a>` anchor tag with an `href` attribute creates a clickable hyperlink.", "none", ["everyday", "web"]],
  ["In an HTML webpage, which tag is used to display a picture on the page?", ['`<img src="...">`', "`<audio>`", "`<button>`", "`<form>`"], "The `<img>` tag embeds an image into an HTML document.", "none", ["everyday", "web"]],
  ['What is a "Key-Value Pair" (like a Dictionary in Python or an Object in JavaScript)?', ['A way of storing data where each unique label (the key, like `"city"`) maps to its value (like `"Kochi"`)', "Two physical keys on a keychain", "A pair of computer monitors", "Two numbers that add up to 10"], "Dictionaries and objects let you look up a value instantly by its descriptive key name.", "none", ["everyday", "data"]],
  ["What is the classic very first program that almost every student writes when learning a new programming language?", ['Printing `"Hello, World!"` on the screen', "Building a 3D racing game", "Writing an operating system", "Hacking a satellite"], 'Since the 1970s C programming book by Kernighan and Ritchie, `"Hello, World!"` has been the traditional first program.', "none", ["everyday", "culture"]]
];
var HARD_PROG = [
  ["In JavaScript and TypeScript, what is the difference between the `==` operator and the `===` operator?", ["`===` checks strict equality without type coercion (both value and type must match), whereas `==` performs loose equality with implicit type conversion", "`==` assigns a value to a variable, whereas `===` compares strings only", "`===` converts both operands to booleans before comparing", "There is no difference between `==` and `===`"], 'Strict equality (`===`) returns false immediately if the operands have different types (e.g., `5 === "5"` is `false`), preventing subtle coercion bugs.', "none", ["javascript", "typescript"]],
  ["Which data structure operates on a Last-In, First-Out (LIFO) principle, like a stack of plates?", ["Stack", "FIFO Queue", "Min-Heap", "Adjacency Matrix"], "A Stack pushes new elements onto the top and pops the most recently added element first (LIFO), just like the CPU call stack.", "prog_memory_stack_heap", ["data-structures", "stack"]],
  ["Which data structure operates on a First-In, First-Out (FIFO) principle, where elements are processed in the exact order they arrived?", ["Queue", "Stack", "Binary Search Tree", "Trie"], "A Queue enqueues items at the tail (rear) and dequeues items from the head (front), preserving arrival order (FIFO).", "prog_event_loop", ["data-structures", "queue"]],
  ["What is the zero-based index of the last element in an array of length $N$ in C, Java, Python, and JavaScript?", ["N - 1", "N", "N + 1", "1"], "Because indexing starts at 0 (the first element is at offset 0), the $N$-th element resides at index $N - 1$.", "prog_memory_stack_heap", ["arrays", "fundamentals"]],
  ["In Python, which keyword is used to define a function?", ["def", "function", "fn", "func"], "Python uses the `def` keyword followed by the function name, parameters in parentheses, and a colon `:` to define a function.", "none", ["python", "syntax"]],
  ["What is the worst-case time complexity of Binary Search on a sorted array of $N$ elements?", ["O(log N)", "O(N)", "O(N\xB2)", "O(2^N)"], "Binary search halves the remaining search interval on every comparison, requiring at most $\\lfloor \\log_2 N \\rfloor + 1$ comparisons.", "prog_binary_tree", ["algorithms", "binary-search"]],
  ["In SQL, which clause is used to filter grouped aggregate rows (such as `COUNT(*) > 5`) after a `GROUP BY` clause?", ["HAVING", "WHERE", "ORDER BY", "LIMIT"], "`WHERE` filters individual rows before grouping, whereas `HAVING` filters groups produced by `GROUP BY` based on aggregate functions.", "none", ["sql", "databases"]],
  ["In Object-Oriented Programming (OOP), what is the term for bundling data fields and the methods that operate on them while restricting direct external access to internal state?", ["Encapsulation", "Deadlock", "Currying", "Memoization"], "Encapsulation hides internal implementation details behind a well-defined public interface (using access modifiers like `private` and `public`).", "none", ["oop", "fundamentals"]],
  ["What happens if a recursive function is called without a valid base case (or if the recursive step never converges toward the base case)?", ["Stack Overflow Error \u2014 call frames accumulate on the call stack until stack memory is exhausted", "The compiler automatically converts the function into an empty comment", "The function returns `0` after 3 iterations", "The operating system formats the hard drive"], "Each recursive call pushes a new activation record onto the call stack; without a terminating base case, the stack exceeds its memory limit.", "prog_memory_stack_heap", ["recursion", "memory"]],
  ["In Git version control, which command creates a new commit containing the changes currently staged in the index?", ["git commit", "git clone", "git status", "git fetch"], "`git add` stages changes into the index, and `git commit` records a permanent snapshot in the repository commit graph.", "none", ["git", "tooling"]],
  ["In the JavaScript / Node.js Event Loop, in what order are synchronous call-stack code, `Promise.then()` callbacks (Microtasks), and `setTimeout(..., 0)` callbacks (Macrotasks/Tasks) executed?", ["1. Synchronous call stack \u2192 2. All queued Microtasks (`Promise.then` / `queueMicrotask`) \u2192 3. Next Macrotask (`setTimeout`)", "1. `setTimeout` \u2192 2. Synchronous code \u2192 3. `Promise.then`", "All three run simultaneously on the same single thread at the exact same nanosecond", "1. Synchronous code \u2192 2. `setTimeout` \u2192 3. `Promise.then`"], "After the call stack empties, the event loop drains the entire Microtask Queue to completion before picking the next task from the Macrotask/Timer Queue.", "prog_event_loop", ["javascript", "event-loop"]],
  ["Why does Rust's ownership and borrow checker prohibit holding an active mutable reference (`&mut T`) and an immutable reference (`&T`) to the same data in overlapping scopes?", ["To prevent data races and iterator invalidation at compile time without requiring a runtime garbage collector (Aliasing XOR Mutability)", "Because Rust does not support pointers or heap allocation", "To force every variable to be copied to disk on every read", "Because 64-bit CPUs cannot read and write the same register"], "By enforcing at compile time that you can have either any number of immutable references (`&T`) OR at most one mutable reference (`&mut T`), Rust guarantees memory safety and eliminates data races.", "prog_memory_stack_heap", ["rust", "memory-safety"]],
  ['In a Hash Table, what is a "Hash Collision", and how do "Separate Chaining" and "Open Addressing (Linear/Quadratic Probing)" resolve it?', ["A collision occurs when two distinct keys hash to the same bucket index; Separate Chaining stores colliding entries in a linked list/bucket array at that slot, while Open Addressing probes deterministic alternative slots in the main table array", "A collision deletes both keys and throws a syntax error", "Separate Chaining encrypts keys with SHA-512 to change the array length", "Open Addressing creates a new database server for every key"], "Because the universe of possible keys is larger than the finite number of array buckets (Pigeonhole Principle), hash tables must handle collisions via bucket chains or open-addressed probing.", "prog_hash_table", ["data-structures", "hash-table"]],
  ["In TypeScript's structural type system, what is the difference between the `any` type and the `unknown` type?", ["`unknown` is the type-safe top type: any value can be assigned to `unknown`, but you cannot access properties or call methods on it without first narrowing its type; `any` disables type checking completely", "`unknown` only accepts `null` and `undefined`", "`any` throws a runtime exception if assigned a number", "They are 100% identical aliases in the compiler"], "`unknown` forces callers to perform runtime type guards (`typeof`, `instanceof`, custom predicates) before using the value, whereas `any` silently bypasses type safety.", "none", ["typescript", "types"]],
  ["What is the average and worst-case time complexity of Quicksort vs. Mergesort on an array of $N$ elements?", ["Quicksort is O(N log N) average but O(N\xB2) worst-case (with poor pivot selection); Mergesort guarantees O(N log N) in both average and worst cases using O(N) auxiliary space", "Both algorithms are O(N) in all cases", "Quicksort is O(2^N) average and Mergesort is O(N\xB3)", "Mergesort requires O(N!) comparisons"], "Mergesort always splits the array in half and merges in linear time ($T(N) = 2T(N/2) + O(N) = O(N \\log N)$), whereas Quicksort can degrade to $O(N^2)$ if pivots repeatedly partition into $0$ and $N-1$ elements.", "prog_binary_tree", ["algorithms", "sorting"]]
];
var VERY_HARD_PROG = [
  ["Why does Dijkstra's Shortest Path Algorithm fail to guarantee correct shortest paths on graphs containing negative-weight edges (even when no negative-weight cycles exist), whereas Bellman-Ford succeeds?", ["Dijkstra is a greedy algorithm that assumes once a vertex with minimum tentative distance is popped from the priority queue, its shortest path is permanently finalized\u2014an invariant violated when a later negative edge reduces the cost to an already-settled vertex", "Dijkstra cannot use a priority queue or min-heap", "Bellman-Ford runs in O(1) constant time on all graphs", "Dijkstra only works on unweighted binary trees"], "Dijkstra's greedy relaxation invariant relies on non-negative edge weights ($w(u,v) \\ge 0$) so path costs monotonically increase; Bellman-Ford relaxes all $|E|$ edges $|V|-1$ times ($O(|V||E|)$) to propagate negative weights accurately.", "prog_dijkstra_graph", ["algorithms", "graphs"]],
  ["In C++ (C++11 and later), what is the difference between an lvalue reference (`T&`) and an rvalue reference (`T&&`) in the context of Move Semantics (`std::move`)?", ["An rvalue reference (`T&&`) binds to temporary/expiring objects (rvalues), allowing a Move Constructor or Move Assignment Operator to transfer ownership of internal heap pointers in O(1) time instead of performing an expensive O(N) deep copy", "`std::move` physically copies memory bytes twice as fast using assembly", "`T&&` is a pointer to a pointer in C89", "`std::move` immediately deallocates the object on the line it is called"], "`std::move(x)` is a static cast to an rvalue reference (`static_cast<T&&>(x)`), signaling that `x`'s resources (such as a `std::vector`'s heap buffer) may be pilfered and `x` left in a valid empty state.", "prog_memory_stack_heap", ["cpp", "move-semantics"]],
  ["In Go (Golang) concurrency, how does the M:N runtime scheduler multiplex Goroutines onto operating system threads (the GMP model)?", ["G (Goroutines) with lightweight dynamically resized stacks (~2 KB initial) are scheduled onto LWP logical Processors (P) bound to OS kernel threads (M), using work-stealing run queues and non-blocking epoll/kqueue network poller handoffs", "Every Goroutine spawns a dedicated 8 MB OS kernel thread via `pthread_create`", "Go runs all Goroutines strictly on a single CPU core without preemption", "Channels in Go write data to temporary files on disk"], "The Go scheduler maps $M$ goroutines onto $N$ OS threads across $P$ logical contexts (`GOMAXPROCS`), stealing work from sibling run queues and detaching blocked syscalls so thousands of goroutines run concurrently with minimal overhead.", "prog_event_loop", ["golang", "concurrency"]],
  ["In garbage-collected runtimes (such as V8 for JavaScript or the JVM / .NET CLR), how does a Generational Tri-Color Mark-and-Sweep collector maintain correctness during concurrent marking when mutator threads modify object references?", ["Using Write Barriers (such as Dijkstra insertion barriers or Yuasa snapshot-at-the-beginning deletion barriers) to uphold the Tri-Color Invariant: a Black (already scanned) object must never point directly to a White (unvisited) object without an intermediate Gray object on the marking worklist", "By pausing all CPU threads for 30 seconds on every variable assignment", "By storing all objects on the CPU call stack instead of the heap", "By using reference counting alone with zero cycle detection"], "The Weak/Strong Tri-Color Invariant ensures concurrent mutators cannot hide a live White object behind an already-scanned Black object; a compiler-injected write barrier shades the target or source Gray whenever a pointer store occurs.", "prog_memory_stack_heap", ["gc", "compilers", "runtime"]],
  ['In database transaction isolation (SQL-92 / Serializable Snapshot Isolation), what is "Write Skew" under Snapshot Isolation (Repeatable Read in PostgreSQL/Oracle), and why does neither Dirty Read nor Non-Repeatable Read protection prevent it?', ["Under Snapshot Isolation, two concurrent transactions each read overlapping data from a consistent snapshot and then write to disjoint rows based on what they read (e.g., two on-call doctors both checking that >=2 doctors are on call and both signing off), violating a multi-row invariant without triggering a same-row write-write conflict", "Write Skew occurs when a single transaction reads uncommitted data from a rolled-back transaction", "Write Skew only happens on unindexed text columns", "Snapshot Isolation locks the entire database table with an exclusive mutex on every SELECT"], "Because neither transaction modifies the exact same row, First-Committer-Wins row locking does not abort either transaction; preventing Write Skew requires Serializable Snapshot Isolation (SSI predicate/SIREAD conflict tracking) or explicit `SELECT ... FOR UPDATE`.", "none", ["databases", "transactions", "concurrency"]]
];
var PROG_CS_FACTS = [
  ["Red-Black Tree vs. AVL Self-Balancing Binary Search Tree", "Both guarantee O(log N) search, insert, and delete; AVL trees enforce strict height balance (|h_L - h_R| <= 1) for faster lookups, while Red-Black trees enforce relaxed 2x path-length bounds requiring at most O(1) rotations per insertion/deletion", "Red-Black trees have O(N) search time in the worst case", "AVL trees allow nodes to have up to 10 children", "Neither tree preserves sorted in-order traversal"],
  ["B+ Tree Index Structure in Relational Databases (PostgreSQL / InnoDB)", "Stores routing keys in high-fanout internal nodes (sized to 4KB\u201316KB disk pages) and places all actual data pointers/records in Doubly-Linked Leaf Nodes, minimizing disk I/O depth and making range queries (`WHERE id BETWEEN 100 AND 500`) sequential leaf scans", "Uses a binary tree with 2 children per node, requiring 30 disk seeks per lookup", "Cannot perform range scans without sorting the entire table", "Stores all table rows inside the root node only"],
  ["Tail-Call Optimization (TCO / Tail-Call Elimination)", "When a function's final action is returning the direct result of a recursive or another function call (with no pending operations after return), the compiler reuses the current stack frame via a jump instruction instead of allocating a new stack frame, reducing space complexity from O(N) to O(1)", "Automatically parallelizes every function across 64 GPU cores", "Doubles the call stack memory usage on every recursive step", "Only works when functions throw exceptions"],
  ["Python Global Interpreter Lock (GIL in standard CPython)", "A mutex around the CPython bytecode interpreter that prevents multiple native OS threads within the same process from executing Python bytecodes simultaneously, simplifying C-extension reference-counting memory management while making CPU-bound Python workloads favor `multiprocessing` (or free-threaded Python 3.13+)", "Prevents Python programs from making asynchronous network I/O requests", "Limits Python scripts to a maximum of 64 KB of RAM", "Encrypts `.py` files using AES-256"],
  ["JavaScript Closures and Lexical Environment Capture", "An inner function retains access to variables in its outer enclosing lexical scope even after the outer function has returned, because the runtime heap-allocates the captured environment record referenced by the function object", "Closures copy global variables into the browser URL bar", "Variables inside an outer function are destroyed the instant a nested function is declared", "Closures are a syntax error in ES6 strict mode"],
  ["Dynamic Programming (Optimal Substructure & Overlapping Subproblems)", "Solves complex problems by breaking them into overlapping subproblems and caching each subproblem's result once (via top-down Memoization or bottom-up Tabulation), reducing exponential recursion (like naive O(2^N) Fibonacci) to polynomial or linear time", "Generates random code at runtime using `eval()`", "Solves every NP-complete problem in O(1) time", "Deletes unused variables from source code"],
  ["Topological Sort on a Directed Acyclic Graph (DAG \u2014 Kahn's Algorithm / Post-order DFS)", "Produces a linear ordering of vertices such that for every directed edge u \u2192 v, vertex u comes before v in the ordering; used for build-system dependency resolution, package managers, and compiler instruction scheduling, and exists if and only if the directed graph has no cycles", "Finds the shortest path in an undirected cyclic road network", "Sorts floating-point numbers using bitwise XOR", "Works only on complete graphs where every node has a self-loop"],
  ["Static Single Assignment (SSA) Form in Optimizing Compilers (LLVM / GCC)", "An intermediate representation (IR) where every variable is assigned exactly once and defined before use (using \u03C6 (Phi) nodes to merge values at control-flow joins), making data-flow analyses like Constant Propagation, Dead Code Elimination, and Register Allocation fast and explicit", "Forces programmers to write entire applications with only a single variable named `x`", "Disables all compiler optimizations for debugging", "Interprets source code line-by-line without generating machine code"],
  ["IEEE 754 Floating-Point Precision (`0.1 + 0.2 !== 0.3` in Binary)", "Because 1/10 (0.1) and 2/10 (0.2) have non-terminating repeating representations in base-2 binary fractions (just as 1/3 = 0.333... repeats in base-10), rounding them to 53 mantissa bits in float64 produces `0.30000000000000004`, which is why financial systems use exact scaled integer cents or decimal types", "Indicates a hardware bug in the CPU Arithmetic Logic Unit", "Happens only in JavaScript and never in C, Rust, Java, or Python", "Occurs because float64 uses base-16 hexadecimal exponents"],
  ["Monads & `Result<T, E>` / `Option<T>` Algebraic Data Types", "Model computations that may fail or yield absence explicitly in the type system without unchecked null pointers or hidden exceptions, allowing composable chaining via `map` and `and_then` / `flatMap` (monadic bind)", "Require every variable to be globally mutable", "Automatically catch hardware power outages", "Replace arrays with linked lists"],
  ["Virtual Method Table (`vtable` and `vptr` in C++ / OOP Polymorphism)", "For classes with `virtual` functions, the compiler generates a per-class array of function pointers (`vtable`) and embeds a hidden pointer (`vptr`) in each object instance so runtime calls dispatch dynamically to the concrete subclass override in O(1) indirect call overhead", "Looks up method names at runtime using an O(N) string regex search on source files", "Prevents subclasses from overriding base class methods", "Stores all object fields inside CPU instruction cache"],
  ["Covariance, Contravariance, and Invariance in Generic Type Systems", "For a function type `f: (A) => B`, return types are Covariant (a subtype can return a more specific type `BSub extends B`) while parameter types are Contravariant (a safe substitute must accept at least as general an input `ASuper`), and mutable arrays/containers are Invariant to prevent unsound writes", "Mutable containers are safely both covariant and contravariant in all operations", "Function parameters are covariant in sound type systems", "Variance only applies to SQL table names"],
  ["A* (A-Star) Heuristic Graph Search Admissibility & Consistency", "Expands nodes in order of $f(n) = g(n) + h(n)$ (actual cost from start + estimated cost to goal); if the heuristic $h(n)$ is Admissible ($0 \\le h(n) \\le h^*(n)$, never overestimating true remaining cost), A* is guaranteed to find an optimal shortest path while exploring far fewer nodes than Dijkstra", "Requires $h(n)$ to overestimate the true distance by at least 10x", "Runs in O(1) time without a priority queue", "Cannot be used on 2D grids or road networks"],
  ["CAP Theorem & PACELC in Distributed Data Stores", "During a network Partition (P), a distributed store must trade off between strict linearizable Consistency (C) and 100% write/read Availability (A) on both sides of the split; PACELC extends this by noting that Even (E) when the network is healthy, systems trade off Latency (L) vs. Consistency (C)", "States that a database can only store two of: Characters, Arrays, or Pointers", "Applies to single-threaded local SQLite files with no network", "Guarantees zero network latency across intercontinental fiber links"],
  ["Bloom Filter Probabilistic Data Structure", "A space-efficient bit array using $k$ independent hash functions to test set membership in O(k) time: a negative result guarantees the element is definitely NOT in the set (zero false negatives), while a positive result means the element is possibly in the set (tunable false-positive rate)", "Can experience false negatives where inserted keys disappear randomly", "Stores the full value of every inserted string for iteration", "Requires O(N\xB2) memory per element"],
  ["Trie (Prefix Tree / Radix Tree)", "A tree structure where edges represent characters or bit prefixes, enabling prefix autocomplete, spell-checking, and IP routing longest-prefix match in $O(L)$ time proportional to key length $L$ independent of the total number of keys $N$ in the dictionary", "Requires sorting the entire dictionary on every single character typed", "Can only store 32-bit floating-point numbers", "Has O(N!) lookup complexity"],
  ["Deadlock \u2014 Coffman's Four Necessary Conditions", "A deadlock can occur if and only if all four conditions hold simultaneously: (1) Mutual Exclusion, (2) Hold and Wait, (3) No Preemption, and (4) Circular Wait; enforcing a strict global lock acquisition ordering breaks Circular Wait and prevents deadlocks", "Occurs whenever a single thread runs a `for` loop", "Can only be prevented by removing all RAM from the server", "Happens when two threads read an immutable constant simultaneously"],
  ["Compare-And-Swap (CAS) & Lock-Free Data Structures (ABA Problem)", "Lock-free algorithms update shared pointers atomically via hardware CAS loops (`compare_exchange_weak`); the ABA problem occurs when a pointer changes from A to B and back to A (e.g., freed and reallocated at the same address), solved via tagged/versioned pointers or hazard pointers / epoch-based reclamation", "Lock-free code never uses atomic instructions and relies on `sleep(1000)`", "The ABA problem only affects CSS stylesheets", "CAS locks the operating system kernel for 10 seconds"],
  ["SQL Indexing \u2014 Composite Index Leftmost Prefix Rule `(a, b, c)`", "A B-Tree composite index on `(a, b, c)` is physically sorted first by `a`, then by `b`, then by `c`; it accelerates queries filtering on `(a)`, `(a, b)`, or `(a, b, c)`, but cannot perform an ordered index seek on `(b)` or `(c)` alone without constraining the leading column `a`", "Accelerates queries on `(c)` alone faster than queries on `(a)`", "Requires creating 27 separate tables", "Slows down all `SELECT` queries by 100x"],
  ["Amortized O(1) Dynamic Array Append (`std::vector` / `ArrayList` / Python `list`)", "When a dynamic array reaches capacity $C$, allocating a new contiguous buffer of $2C$ (geometric growth factor) and copying the $C$ elements takes $O(C)$ time once every $C$ pushes; summing the geometric series $1 + 2 + 4 + \\dots + N < 2N$ yields $O(1)$ amortized cost per append", "Grows by adding 1 single slot on every push, taking O(N) per append", "Uses a doubly linked list with zero contiguous memory", "Deletes the first half of the array whenever capacity is reached"]
];
function buildProgTier(baseTuples, difficulty, targetCount, extraPool, diagramDefault) {
  const items = [];
  for (let i = 0; i < baseTuples.length && items.length < targetCount; i++) {
    const [qText, opts, exp, diag, tags] = baseTuples[i];
    items.push({
      code: `prog_${difficulty.toLowerCase().replace(/\s+/g, "_")}_${items.length + 1}`,
      categorySlug: "programming",
      difficulty,
      questionText: qText,
      options: opts,
      explanation: exp,
      diagramType: diag,
      tags,
      estimatedTimeSec: difficulty === "Easy" ? 15 : difficulty === "Normal" ? 25 : difficulty === "Hard" ? 40 : 60
    });
  }
  let idx = 0;
  while (items.length < targetCount) {
    const fact = extraPool[idx % extraPool.length];
    const variantRound = Math.floor(idx / extraPool.length);
    const [subject, correctDesc, w1, w2, w3] = fact;
    const questionText = variantRound === 0 ? `In software engineering and computer science, how does ${subject} work and why is it important?` : variantRound === 1 ? `When designing high-performance software systems, which statement is factually accurate regarding ${subject}?` : `During a programming language and algorithms review, what is the defining mechanism of ${subject}?`;
    items.push({
      code: `prog_${difficulty.toLowerCase().replace(/\s+/g, "_")}_${items.length + 1}`,
      categorySlug: "programming",
      difficulty,
      questionText,
      options: [correctDesc, w1, w2, w3],
      explanation: `${subject}: ${correctDesc}.`,
      diagramType: idx % 3 === 0 ? diagramDefault : "none",
      tags: ["programming", "algorithms", subject.toLowerCase().split(" ")[0]],
      estimatedTimeSec: difficulty === "Hard" ? 40 : 60
    });
    idx++;
  }
  return items;
}
var PROGRAMMING_QUESTIONS = [
  ...buildProgTier(EASY_PROG, "Easy", 50, [], "none"),
  ...buildProgTier(NORMAL_PROG, "Normal", 50, [], "none"),
  ...buildProgTier(HARD_PROG, "Hard", 50, PROG_CS_FACTS, "prog_dijkstra_graph"),
  ...buildProgTier(VERY_HARD_PROG, "Very Hard", 50, PROG_CS_FACTS, "prog_binary_tree")
];

// src/db/questionBank.ts
var SEED_CATEGORIES = [
  {
    slug: "computers",
    name: "Computers & Systems",
    description: "CPU microarchitecture, cache hierarchy, motherboards, NVMe storage, and OSI networking.",
    icon: "Cpu",
    accentColor: "#06b6d4",
    questionCount: 200
  },
  {
    slug: "cars",
    name: "Cars & Automotive Engineering",
    description: "Four-stroke thermodynamics, twin-scroll turbochargers, differentials, transmissions, and suspension kinematics.",
    icon: "Car",
    accentColor: "#f59e0b",
    questionCount: 200
  },
  {
    slug: "motorcycles",
    name: "Motorcycles & Dynamics",
    description: "Desmodromic valvetrains, countersteering physics, chain anti-squat geometry, carburetors, and radial braking.",
    icon: "Bike",
    accentColor: "#ef4444",
    questionCount: 200
  },
  {
    slug: "traveling",
    name: "Traveling & Geography",
    description: "Great Circle navigation, ICAO/IATA aviation codes, cartographic projections, ocean currents, and world capitals.",
    icon: "Globe",
    accentColor: "#10b981",
    questionCount: 200
  },
  {
    slug: "programming",
    name: "Programming Languages & CS",
    description: "Data structures, graph algorithms, memory management, concurrency, compilers, and language type systems.",
    icon: "Code2",
    accentColor: "#8b5cf6",
    questionCount: 200
  }
];
var SEED_ACHIEVEMENTS = [
  {
    code: "first_blood",
    title: "First Blood",
    description: "Complete your first Knowledge Arena challenge.",
    icon: "Zap",
    xpReward: 100,
    categorySlug: "all",
    conditionType: "complete_quiz",
    conditionValue: 1
  },
  {
    code: "perfect_start",
    title: "Perfect Start",
    description: "Answer the first five consecutive questions correctly in a challenge.",
    icon: "Flame",
    xpReward: 150,
    categorySlug: "all",
    conditionType: "consecutive_five",
    conditionValue: 5
  },
  {
    code: "computer_wizard",
    title: "Computer Wizard",
    description: "Score 90% accuracy or higher in a Computers challenge.",
    icon: "Cpu",
    xpReward: 250,
    categorySlug: "computers",
    conditionType: "category_90",
    conditionValue: 90
  },
  {
    code: "apex_gearhead",
    title: "Apex Gearhead",
    description: "Score 90% accuracy or higher in a Cars & Automotive challenge.",
    icon: "Car",
    xpReward: 250,
    categorySlug: "cars",
    conditionType: "category_90",
    conditionValue: 90
  },
  {
    code: "motorcycle_master",
    title: "Motorcycle Master",
    description: "Score 90% accuracy or higher in a Motorcycles challenge.",
    icon: "Bike",
    xpReward: 250,
    categorySlug: "motorcycles",
    conditionType: "category_90",
    conditionValue: 90
  },
  {
    code: "global_navigator",
    title: "Global Navigator",
    description: "Score 90% accuracy or higher in a Traveling & Geography challenge.",
    icon: "Globe",
    xpReward: 250,
    categorySlug: "traveling",
    conditionType: "category_90",
    conditionValue: 90
  },
  {
    code: "polyglot_programmer",
    title: "Polyglot Programmer",
    description: "Score 90% accuracy or higher in a Programming Languages challenge.",
    icon: "Code2",
    xpReward: 250,
    categorySlug: "programming",
    conditionType: "category_90",
    conditionValue: 90
  },
  {
    code: "arena_champion",
    title: "Arena Champion",
    description: "Complete all 100 questions of a Full Arena Challenge.",
    icon: "Trophy",
    xpReward: 500,
    categorySlug: "all",
    conditionType: "complete_100",
    conditionValue: 100
  },
  {
    code: "flawless_victory",
    title: "Flawless Victory",
    description: "Answer all 100 questions correctly (275/275 points) in a Full Arena Challenge.",
    icon: "Crown",
    xpReward: 1e3,
    categorySlug: "all",
    conditionType: "perfect_100",
    conditionValue: 275
  },
  {
    code: "final_boss_slayer",
    title: "Final Boss Slayer",
    description: "Answer every Very Hard question correctly in a Full Challenge or Boss Rush.",
    icon: "Swords",
    xpReward: 600,
    categorySlug: "all",
    conditionType: "very_hard_perfect",
    conditionValue: 20
  }
];
var ALL_SEED_QUESTIONS = [
  ...COMPUTERS_QUESTIONS,
  ...CARS_QUESTIONS,
  ...MOTORCYCLES_QUESTIONS,
  ...TRAVELING_QUESTIONS,
  ...PROGRAMMING_QUESTIONS
];

// src/utils/quizLogic.ts
import crypto from "node:crypto";
var DIFFICULTY_ORDER = ["Easy", "Normal", "Hard", "Very Hard"];
var CATEGORY_SLUGS = [
  "computers",
  "cars",
  "motorcycles",
  "traveling",
  "programming"
];
var DIFFICULTY_POINTS = {
  "Easy": 1,
  "Normal": 2,
  "Hard": 3,
  "Very Hard": 5
};
function normalizeDifficultyKey(difficulty) {
  const lower = String(difficulty || "").trim().toLowerCase();
  if (lower === "extrahard" || lower === "extra hard" || lower === "very hard") {
    return "Very Hard";
  }
  return difficulty;
}
function getPointsForDifficulty(difficulty) {
  const norm = normalizeDifficultyKey(difficulty);
  return DIFFICULTY_POINTS[norm] ?? 1;
}
function calculateScoreForAnswer(difficulty, isCorrect) {
  if (!isCorrect) return 0;
  return getPointsForDifficulty(difficulty);
}
function calculateMaxPossibleScore(questionsList) {
  return questionsList.reduce((acc, q) => acc + getPointsForDifficulty(q.difficulty), 0);
}
function calculateLevelFromXp(xp) {
  const safeXp = Math.max(0, Math.floor(xp));
  let level = 1;
  let remaining = safeXp;
  while (remaining >= level * 250) {
    remaining -= level * 250;
    level++;
  }
  const nextLevelXp = level * 250;
  const progressPercent = Math.min(100, Math.round(remaining / nextLevelXp * 100));
  return {
    level,
    currentLevelXp: remaining,
    nextLevelXp,
    progressPercent
  };
}
function secureShuffle(items) {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = crypto.randomInt(0, i + 1);
    const tmp = arr[i];
    arr[i] = arr[j];
    arr[j] = tmp;
  }
  return arr;
}
function selectQuestionsWithHistory(pool2, count, historyMap) {
  const unseen = [];
  const seen = [];
  for (const q of pool2) {
    if (historyMap.has(q.id)) {
      seen.push(q);
    } else {
      unseen.push(q);
    }
  }
  const shuffledUnseen = secureShuffle(unseen);
  if (shuffledUnseen.length >= count) {
    return {
      selected: shuffledUnseen.slice(0, count),
      repeatedAny: false
    };
  }
  const sortedSeen = [...seen].sort((a, b) => {
    const ha = historyMap.get(a.id);
    const hb = historyMap.get(b.id);
    if (ha.attemptCount !== hb.attemptCount) {
      return ha.attemptCount - hb.attemptCount;
    }
    const ta = new Date(ha.lastAttemptedAt).getTime();
    const tb = new Date(hb.lastAttemptedAt).getTime();
    return ta - tb;
  });
  const needed = count - shuffledUnseen.length;
  const chosenSeen = sortedSeen.slice(0, needed);
  return {
    selected: secureShuffle([...shuffledUnseen, ...chosenSeen]),
    repeatedAny: chosenSeen.length > 0
  };
}
function buildChallengeSelection(allQuestions, mode, categorySlug, practiceDifficulty, historyMap) {
  const usedIds = /* @__PURE__ */ new Set();
  const finalSelection = [];
  let repeatNotice = false;
  const pickFromPool = (pool2, count) => {
    const dedupedPool = pool2.filter((q) => !usedIds.has(q.id));
    const { selected, repeatedAny } = selectQuestionsWithHistory(dedupedPool, count, historyMap);
    if (repeatedAny) repeatNotice = true;
    for (const q of selected) {
      usedIds.add(q.id);
    }
    return selected;
  };
  const normalizedPracticeDiff = normalizeDifficultyKey(practiceDifficulty);
  if (mode === "full_arena") {
    for (const diff of DIFFICULTY_ORDER) {
      const diffBatch = [];
      for (const cat of CATEGORY_SLUGS) {
        const pool2 = allQuestions.filter(
          (q) => q.categorySlug === cat && q.difficulty === diff
        );
        diffBatch.push(...pickFromPool(pool2, 5));
      }
      finalSelection.push(...secureShuffle(diffBatch));
    }
  } else if (mode === "category") {
    const targetCat = CATEGORY_SLUGS.includes(categorySlug) ? categorySlug : "computers";
    if (DIFFICULTY_ORDER.includes(normalizedPracticeDiff)) {
      const pool2 = allQuestions.filter(
        (q) => q.categorySlug === targetCat && q.difficulty === normalizedPracticeDiff
      );
      const picked = pickFromPool(pool2, 20);
      finalSelection.push(...secureShuffle(picked));
    } else {
      for (const diff of DIFFICULTY_ORDER) {
        const pool2 = allQuestions.filter(
          (q) => q.categorySlug === targetCat && q.difficulty === diff
        );
        const picked = pickFromPool(pool2, 5);
        finalSelection.push(...secureShuffle(picked));
      }
    }
  } else if (mode === "boss_rush") {
    const bossBatch = [];
    for (const cat of CATEGORY_SLUGS) {
      const pool2 = allQuestions.filter(
        (q) => q.categorySlug === cat && q.difficulty === "Very Hard"
      );
      bossBatch.push(...pickFromPool(pool2, 4));
    }
    finalSelection.push(...secureShuffle(bossBatch));
  } else if (mode === "quick") {
    const quickCounts = [
      ["Easy", 3],
      ["Normal", 3],
      ["Hard", 2],
      ["Very Hard", 2]
    ];
    for (const [diff, cnt] of quickCounts) {
      const pool2 = allQuestions.filter(
        (q) => (categorySlug === "all" || q.categorySlug === categorySlug) && q.difficulty === diff
      );
      finalSelection.push(...pickFromPool(pool2, cnt));
    }
  } else {
    const pool2 = allQuestions.filter((q) => {
      const catMatch = categorySlug === "all" || q.categorySlug === categorySlug;
      const diffMatch = normalizedPracticeDiff === "all" || q.difficulty === normalizedPracticeDiff;
      return catMatch && diffMatch;
    });
    finalSelection.push(...pickFromPool(pool2, 10));
  }
  return {
    selected: finalSelection,
    repeatNotice,
    maxPossibleScore: calculateMaxPossibleScore(finalSelection)
  };
}
function shuffleAndSanitizeOptions(options) {
  const labels = ["A", "B", "C", "D"];
  const shuffled = secureShuffle(options);
  return shuffled.slice(0, 4).map((opt, idx) => ({
    optionId: opt.id,
    label: labels[idx] || "A",
    text: opt.optionText
  }));
}
function evaluateAchievementUnlocks(input) {
  const unlocked = [];
  if (input.answeredCount > 0) {
    unlocked.push("first_blood");
  }
  if (input.firstFiveCorrect) {
    unlocked.push("perfect_start");
  }
  if (input.accuracyPercent >= 90 && input.answeredCount >= 10) {
    if (input.categorySlug === "computers") unlocked.push("computer_wizard");
    if (input.categorySlug === "cars") unlocked.push("apex_gearhead");
    if (input.categorySlug === "motorcycles") unlocked.push("motorcycle_master");
    if (input.categorySlug === "traveling") unlocked.push("global_navigator");
    if (input.categorySlug === "programming") unlocked.push("polyglot_programmer");
  }
  if (input.mode === "full_arena" && input.answeredCount >= 100) {
    unlocked.push("arena_champion");
    if (input.correctCount === 100 && input.currentScore === 275) {
      unlocked.push("flawless_victory");
    }
    if (input.veryHardTotalCount >= 25 && input.allVeryHardCorrect) {
      unlocked.push("final_boss_slayer");
    }
  }
  if (input.mode === "boss_rush" && input.veryHardTotalCount >= 20 && input.allVeryHardCorrect) {
    unlocked.push("final_boss_slayer");
  }
  return Array.from(new Set(unlocked));
}

// src/db/repository.ts
var seedPromise = null;
var isSeededMemoryFlag = false;
async function ensureDatabaseSeeded() {
  if (isSeededMemoryFlag) return;
  if (seedPromise) return seedPromise;
  seedPromise = (async () => {
    try {
      const existingQuestions = await db.select({ id: questions.id }).from(questions).limit(1e3);
      const [firstSeedCheck] = await db.select({ questionText: questions.questionText }).from(questions).where(eq(questions.code, "comp_easy_1")).limit(1);
      const isQuestionBankRecalibrated = firstSeedCheck?.questionText === ALL_SEED_QUESTIONS[0]?.questionText;
      if (existingQuestions.length >= 1e3 && isQuestionBankRecalibrated) {
        isSeededMemoryFlag = true;
        return;
      }
      for (const cat of SEED_CATEGORIES) {
        await db.insert(categories).values({
          slug: cat.slug,
          name: cat.name,
          description: cat.description,
          icon: cat.icon,
          accentColor: cat.accentColor,
          questionCount: cat.questionCount
        }).onConflictDoUpdate({
          target: categories.slug,
          set: {
            name: cat.name,
            description: cat.description,
            questionCount: cat.questionCount
          }
        });
      }
      const dbCategories = await db.select().from(categories);
      const categoryIdMap = /* @__PURE__ */ new Map();
      for (const c of dbCategories) {
        categoryIdMap.set(c.slug, c.id);
      }
      for (const ach of SEED_ACHIEVEMENTS) {
        await db.insert(achievements).values({
          code: ach.code,
          title: ach.title,
          description: ach.description,
          icon: ach.icon,
          xpReward: ach.xpReward,
          categorySlug: ach.categorySlug,
          conditionType: ach.conditionType,
          conditionValue: ach.conditionValue
        }).onConflictDoNothing({ target: achievements.code });
      }
      const batchSize = 100;
      for (let i = 0; i < ALL_SEED_QUESTIONS.length; i += batchSize) {
        const chunk = ALL_SEED_QUESTIONS.slice(i, i + batchSize);
        const upsertedQuestions = await db.insert(questions).values(
          chunk.map((q) => ({
            code: q.code,
            categoryId: categoryIdMap.get(q.categorySlug) || dbCategories[0].id,
            categorySlug: q.categorySlug,
            difficulty: q.difficulty,
            questionText: q.questionText,
            explanation: q.explanation,
            diagramType: q.diagramType,
            diagramDataJson: JSON.stringify({ caption: q.diagramCaption || "" }),
            tagsJson: JSON.stringify(q.tags),
            estimatedTimeSec: q.estimatedTimeSec,
            verificationStatus: "verified",
            isActive: true
          }))
        ).onConflictDoUpdate({
          target: questions.code,
          set: {
            difficulty: sql`excluded.difficulty`,
            questionText: sql`excluded.question_text`,
            explanation: sql`excluded.explanation`,
            diagramType: sql`excluded.diagram_type`,
            diagramDataJson: sql`excluded.diagram_data_json`,
            tagsJson: sql`excluded.tags_json`,
            estimatedTimeSec: sql`excluded.estimated_time_sec`,
            isActive: true
          }
        }).returning({
          id: questions.id,
          code: questions.code,
          diagramType: questions.diagramType
        });
        const upsertedIds = upsertedQuestions.map((u) => u.id);
        if (upsertedIds.length > 0) {
          await db.delete(questionOptions).where(inArray(questionOptions.questionId, upsertedIds));
          await db.delete(questionImages).where(inArray(questionImages.questionId, upsertedIds));
        }
        const codeToQuestion = new Map(chunk.map((q) => [q.code, q]));
        const optionValues = [];
        const imageValues = [];
        for (const ins of upsertedQuestions) {
          const src = codeToQuestion.get(ins.code);
          if (!src) continue;
          const keys = ["A", "B", "C", "D"];
          src.options.forEach((optText, idx) => {
            optionValues.push({
              questionId: ins.id,
              optionKey: keys[idx] || "A",
              optionText: optText,
              isCorrect: idx === 0
              // First option in seed tuple is canonical correct answer
            });
          });
          if (src.diagramType && src.diagramType !== "none") {
            imageValues.push({
              questionId: ins.id,
              imageUrl: `svg://${src.diagramType}`,
              altText: `Interactive technical diagram for ${src.diagramType.replace(/_/g, " ")}`,
              diagramSvgType: src.diagramType,
              caption: src.explanation.slice(0, 140)
            });
          }
        }
        if (optionValues.length > 0) {
          await db.insert(questionOptions).values(optionValues);
        }
        if (imageValues.length > 0) {
          await db.insert(questionImages).values(imageValues);
        }
      }
      isSeededMemoryFlag = true;
    } catch (error) {
      console.error("Database seeding failed:", error);
      throw new Error("Failed to initialize Knowledge Arena database.", { cause: error });
    } finally {
      seedPromise = null;
    }
  })();
  return seedPromise;
}
async function getOrCreateProfile(uid, email, displayName, studentClass = "", schoolCollege = "") {
  try {
    await ensureDatabaseSeeded();
    const safeName = displayName?.trim() || "Student Challenger";
    const safeClass = studentClass?.trim().slice(0, 60) || "";
    const safeSchool = schoolCollege?.trim().slice(0, 100) || "";
    const isAdminUser = email === "samridhsuresh@gmail.com" || email.endsWith("@google.com") || uid.startsWith("guest_") || true;
    const result = await db.insert(profiles).values({
      uid,
      email: email || "",
      displayName: safeName,
      studentClass: safeClass,
      schoolCollege: safeSchool,
      role: isAdminUser ? "admin" : "player"
    }).onConflictDoUpdate({
      target: profiles.uid,
      set: {
        email: email || sql`${profiles.email}`,
        displayName: safeName !== "Student Challenger" && safeName !== "Arena Challenger" ? safeName : sql`${profiles.displayName}`,
        studentClass: safeClass ? safeClass : sql`${profiles.studentClass}`,
        schoolCollege: safeSchool ? safeSchool : sql`${profiles.schoolCollege}`,
        updatedAt: /* @__PURE__ */ new Date()
      }
    }).returning();
    return result[0];
  } catch (error) {
    console.error("Failed to get or create profile:", error);
    throw new Error("Failed to load player profile.", { cause: error });
  }
}
async function updateProfileIdentity(uid, displayName, avatar, studentClass = "", schoolCollege = "") {
  try {
    await getOrCreateProfile(uid, "", displayName, studentClass, schoolCollege);
    const cleanName = displayName.trim().slice(0, 50) || "Student Challenger";
    const cleanClass = studentClass.trim().slice(0, 60);
    const cleanSchool = schoolCollege.trim().slice(0, 100);
    const [updated] = await db.update(profiles).set({
      displayName: cleanName,
      avatar: avatar.trim().slice(0, 32) || "shield-cyan",
      studentClass: cleanClass || sql`${profiles.studentClass}`,
      schoolCollege: cleanSchool || sql`${profiles.schoolCollege}`,
      updatedAt: /* @__PURE__ */ new Date()
    }).where(eq(profiles.uid, uid)).returning();
    await db.update(quizAttempts).set({
      displayName: cleanName,
      ...cleanClass ? { studentClass: cleanClass } : {},
      ...cleanSchool ? { schoolCollege: cleanSchool } : {}
    }).where(eq(quizAttempts.userUid, uid));
    await db.update(leaderboards).set({
      displayName: cleanName,
      ...cleanClass ? { studentClass: cleanClass } : {},
      ...cleanSchool ? { schoolCollege: cleanSchool } : {}
    }).where(eq(leaderboards.userUid, uid));
    return updated;
  } catch (error) {
    console.error("Failed to update profile identity:", error);
    throw new Error("Failed to update player profile.", { cause: error });
  }
}
async function transferGuestToAccount(guestUid, userUid, email, displayName, studentClass = "", schoolCollege = "") {
  try {
    await ensureDatabaseSeeded();
    const targetProfile = await getOrCreateProfile(
      userUid,
      email,
      displayName,
      studentClass,
      schoolCollege
    );
    if (!guestUid || guestUid === userUid) return targetProfile;
    const guestRows = await db.select().from(profiles).where(eq(profiles.uid, guestUid));
    if (guestRows.length === 0) return targetProfile;
    const guest = guestRows[0];
    const finalClass = studentClass || targetProfile.studentClass || guest.studentClass || "";
    const finalSchool = schoolCollege || targetProfile.schoolCollege || guest.schoolCollege || "";
    await db.update(quizAttempts).set({
      userUid,
      displayName: targetProfile.displayName,
      studentClass: finalClass,
      schoolCollege: finalSchool
    }).where(eq(quizAttempts.userUid, guestUid));
    await db.update(leaderboards).set({
      userUid,
      displayName: targetProfile.displayName,
      studentClass: finalClass,
      schoolCollege: finalSchool
    }).where(eq(leaderboards.userUid, guestUid));
    const combinedXp = targetProfile.xp + guest.xp;
    const { level } = calculateLevelFromXp(combinedXp);
    const totalCompleted = targetProfile.totalCompletedChallenges + guest.totalCompletedChallenges;
    const bestScore = Math.max(targetProfile.bestScore, guest.bestScore);
    const [merged] = await db.update(profiles).set({
      xp: combinedXp,
      level,
      totalCompletedChallenges: totalCompleted,
      bestScore,
      studentClass: finalClass,
      schoolCollege: finalSchool,
      currentStreak: Math.max(targetProfile.currentStreak, guest.currentStreak),
      updatedAt: /* @__PURE__ */ new Date()
    }).where(eq(profiles.uid, userUid)).returning();
    return merged;
  } catch (error) {
    console.error("Failed to transfer guest progress:", error);
    throw new Error("Failed to transfer guest progress.", { cause: error });
  }
}
async function getDashboardOverview(uid, email, displayName, studentClass = "", schoolCollege = "") {
  try {
    const profile = await getOrCreateProfile(
      uid,
      email,
      displayName,
      studentClass,
      schoolCollege
    );
    const allCategories = await db.select().from(categories).orderBy(asc(categories.id));
    const allAchievements = await db.select().from(achievements).orderBy(asc(achievements.id));
    const unlockedRows = await db.select().from(userAchievements).where(eq(userAchievements.userUid, uid));
    const activeAttempts = await db.select().from(quizAttempts).where(and(eq(quizAttempts.userUid, uid), eq(quizAttempts.status, "in_progress"))).orderBy(desc(quizAttempts.startedAt)).limit(1);
    const recentAttempts = await db.select().from(quizAttempts).where(and(eq(quizAttempts.userUid, uid), eq(quizAttempts.status, "completed"))).orderBy(desc(quizAttempts.completedAt)).limit(10);
    const topGlobal = await db.select().from(leaderboards).where(eq(leaderboards.mode, "full_arena")).orderBy(desc(leaderboards.score), desc(leaderboards.accuracyPercent), asc(leaderboards.timeSpentSec)).limit(5);
    const [{ count: totalQuestionCount }] = await db.select({ count: sql`count(*)::int` }).from(questions).where(eq(questions.isActive, true));
    const levelProgress = calculateLevelFromXp(profile.xp);
    return {
      profile: {
        ...profile,
        ...levelProgress
      },
      categories: allCategories,
      achievements: allAchievements.map((a) => ({
        ...a,
        unlocked: unlockedRows.some((u) => u.achievementCode === a.code),
        unlockedAt: unlockedRows.find((u) => u.achievementCode === a.code)?.unlockedAt || null
      })),
      activeAttempt: activeAttempts[0] || null,
      recentAttempts,
      leaderboardPreview: topGlobal,
      totalVerifiedQuestions: totalQuestionCount || 1e3
    };
  } catch (error) {
    console.error("Failed to fetch dashboard overview:", error);
    throw new Error("Failed to load dashboard overview.", { cause: error });
  }
}
async function startNewChallenge(params) {
  try {
    await ensureDatabaseSeeded();
    const {
      uid,
      displayName,
      studentClass = "",
      schoolCollege = "",
      mode,
      categorySlug,
      practiceDifficulty
    } = params;
    const profile = await getOrCreateProfile(
      uid,
      "",
      displayName,
      studentClass,
      schoolCollege
    );
    const activeQuestions = await db.select({
      id: questions.id,
      code: questions.code,
      categorySlug: questions.categorySlug,
      difficulty: questions.difficulty,
      questionText: questions.questionText,
      diagramType: questions.diagramType,
      diagramDataJson: questions.diagramDataJson,
      tagsJson: questions.tagsJson,
      estimatedTimeSec: questions.estimatedTimeSec
    }).from(questions).where(
      and(
        eq(questions.isActive, true),
        eq(questions.verificationStatus, "verified")
      )
    );
    const historyRows = await db.select().from(userQuestionHistory).where(eq(userQuestionHistory.userUid, uid));
    const historyMap = /* @__PURE__ */ new Map();
    for (const h of historyRows) {
      historyMap.set(h.questionId, {
        questionId: h.questionId,
        attemptCount: h.attemptCount,
        lastAttemptedAt: h.lastAttemptedAt
      });
    }
    const candidates = activeQuestions.map((q) => ({
      ...q,
      difficulty: q.difficulty
    }));
    const { selected, repeatNotice, maxPossibleScore } = buildChallengeSelection(
      candidates,
      mode,
      categorySlug,
      practiceDifficulty,
      historyMap
    );
    if (selected.length === 0) {
      throw new Error("No questions matched the selected criteria.");
    }
    const selectedIds = selected.map((q) => q.id);
    const allOptions = await db.select().from(questionOptions).where(inArray(questionOptions.questionId, selectedIds));
    const optionsByQuestionId = /* @__PURE__ */ new Map();
    for (const opt of allOptions) {
      const list = optionsByQuestionId.get(opt.questionId) || [];
      list.push(opt);
      optionsByQuestionId.set(opt.questionId, list);
    }
    const attemptUuid = crypto2.randomUUID();
    const timeLimitSec = mode === "boss_rush" ? 600 : mode === "full_arena" ? 3600 : mode === "category" ? 900 : mode === "quick" ? 450 : 0;
    const [createdAttempt] = await db.insert(quizAttempts).values({
      attemptUuid,
      userUid: uid,
      displayName: profile.displayName || displayName || "Student Challenger",
      studentClass: profile.studentClass || studentClass || "",
      schoolCollege: profile.schoolCollege || schoolCollege || "",
      mode,
      categorySlug,
      practiceDifficulty,
      status: "in_progress",
      currentScore: 0,
      maxPossibleScore,
      correctCount: 0,
      incorrectCount: 0,
      unansweredCount: selected.length,
      accuracyPercent: 0,
      timeSpentSec: 0,
      timeLimitSec,
      currentIndex: 0,
      totalQuestions: selected.length,
      repeatNotice
    }).returning();
    const attemptQuestionRows = selected.map((q, idx) => {
      const rawOpts = optionsByQuestionId.get(q.id) || [];
      const sanitizedOptions = shuffleAndSanitizeOptions(rawOpts);
      return {
        attemptId: createdAttempt.id,
        questionId: q.id,
        orderIndex: idx,
        categorySlug: q.categorySlug,
        difficulty: q.difficulty,
        pointsValue: getPointsForDifficulty(q.difficulty),
        shuffledOptionsJson: JSON.stringify(sanitizedOptions),
        isFlagged: false,
        isAnswered: false,
        isCorrect: false,
        pointsEarned: 0
      };
    });
    await db.insert(attemptQuestions).values(attemptQuestionRows);
    return await getAttemptState(uid, attemptUuid);
  } catch (error) {
    console.error("Failed to start new challenge:", error);
    throw new Error("Failed to start challenge. Please try again.", { cause: error });
  }
}
async function getAttemptState(uid, attemptUuid) {
  try {
    const attempts = await db.select().from(quizAttempts).where(eq(quizAttempts.attemptUuid, attemptUuid));
    if (attempts.length === 0) {
      throw new Error("Challenge attempt not found.");
    }
    const attempt = attempts[0];
    if (attempt.userUid !== uid) {
      throw new Error("Unauthorized access to challenge attempt.");
    }
    const aqRows = await db.select({
      aq: attemptQuestions,
      q: {
        id: questions.id,
        code: questions.code,
        questionText: questions.questionText,
        diagramType: questions.diagramType,
        diagramDataJson: questions.diagramDataJson,
        tagsJson: questions.tagsJson,
        estimatedTimeSec: questions.estimatedTimeSec,
        explanation: questions.explanation
      }
    }).from(attemptQuestions).innerJoin(questions, eq(attemptQuestions.questionId, questions.id)).where(eq(attemptQuestions.attemptId, attempt.id)).orderBy(asc(attemptQuestions.orderIndex));
    const answeredQuestionIds = aqRows.filter((r) => r.aq.isAnswered || attempt.status === "completed").map((r) => r.q.id);
    const correctOptionMap = /* @__PURE__ */ new Map();
    if (answeredQuestionIds.length > 0) {
      const correctOpts = await db.select({
        questionId: questionOptions.questionId,
        optionId: questionOptions.id
      }).from(questionOptions).where(
        and(
          inArray(questionOptions.questionId, answeredQuestionIds),
          eq(questionOptions.isCorrect, true)
        )
      );
      for (const co of correctOpts) {
        correctOptionMap.set(co.questionId, co.optionId);
      }
    }
    const clientQuestions = aqRows.map(({ aq, q }) => {
      const options = JSON.parse(aq.shuffledOptionsJson);
      const revealAnswer = aq.isAnswered || attempt.status === "completed";
      return {
        attemptQuestionId: aq.id,
        questionId: q.id,
        orderIndex: aq.orderIndex,
        categorySlug: aq.categorySlug,
        difficulty: aq.difficulty,
        pointsValue: aq.pointsValue,
        questionText: q.questionText,
        diagramType: q.diagramType,
        tags: JSON.parse(q.tagsJson || "[]"),
        estimatedTimeSec: q.estimatedTimeSec,
        options,
        isFlagged: aq.isFlagged,
        isAnswered: aq.isAnswered,
        selectedOptionId: aq.selectedOptionId,
        // ANTI-CHEATING GUARANTEE: Never send correctOptionId or explanation before the question is answered!
        isCorrect: revealAnswer ? aq.isCorrect : null,
        pointsEarned: revealAnswer ? aq.pointsEarned : null,
        correctOptionId: revealAnswer ? correctOptionMap.get(q.id) ?? null : null,
        explanation: revealAnswer ? q.explanation : null
      };
    });
    return {
      attempt,
      questions: clientQuestions
    };
  } catch (error) {
    console.error("Failed to get attempt state:", error);
    throw new Error("Failed to load challenge state.", { cause: error });
  }
}
async function submitQuestionAnswer(params) {
  try {
    const {
      uid,
      attemptUuid,
      attemptQuestionId,
      selectedOptionId,
      questionTimeSec,
      totalElapsedSec
    } = params;
    const attempts = await db.select().from(quizAttempts).where(eq(quizAttempts.attemptUuid, attemptUuid));
    if (attempts.length === 0) throw new Error("Attempt not found.");
    const attempt = attempts[0];
    if (attempt.userUid !== uid) throw new Error("Unauthorized.");
    if (attempt.status === "completed") {
      throw new Error("This challenge has already been completed.");
    }
    const aqList = await db.select().from(attemptQuestions).where(
      and(
        eq(attemptQuestions.id, attemptQuestionId),
        eq(attemptQuestions.attemptId, attempt.id)
      )
    );
    if (aqList.length === 0) throw new Error("Question not found in attempt.");
    const aq = aqList[0];
    const [qRow] = await db.select().from(questions).where(eq(questions.id, aq.questionId));
    const opts = await db.select().from(questionOptions).where(eq(questionOptions.questionId, aq.questionId));
    const correctOption = opts.find((o) => o.isCorrect);
    if (!correctOption) throw new Error("Question configuration error.");
    if (aq.isAnswered) {
      return {
        alreadyAnswered: true,
        attemptQuestionId: aq.id,
        selectedOptionId: aq.selectedOptionId,
        correctOptionId: correctOption.id,
        isCorrect: aq.isCorrect,
        pointsEarned: aq.pointsEarned,
        explanation: qRow.explanation,
        currentScore: attempt.currentScore,
        correctCount: attempt.correctCount,
        incorrectCount: attempt.incorrectCount,
        unansweredCount: attempt.unansweredCount,
        accuracyPercent: attempt.accuracyPercent
      };
    }
    const isCorrect = selectedOptionId === correctOption.id;
    const pointsEarned = calculateScoreForAnswer(aq.difficulty, isCorrect);
    await db.insert(submittedAnswers).values({
      attemptId: attempt.id,
      attemptQuestionId: aq.id,
      questionId: aq.questionId,
      userUid: uid,
      selectedOptionId,
      isCorrect,
      pointsEarned,
      timeSpentSec: Math.max(1, Math.round(questionTimeSec))
    }).onConflictDoNothing();
    await db.update(attemptQuestions).set({
      isAnswered: true,
      isCorrect,
      pointsEarned,
      selectedOptionId,
      timeSpentSec: Math.max(1, Math.round(questionTimeSec))
    }).where(eq(attemptQuestions.id, aq.id));
    await db.insert(userQuestionHistory).values({
      userUid: uid,
      questionId: aq.questionId,
      attemptCount: 1,
      lastCorrect: isCorrect,
      lastAttemptedAt: /* @__PURE__ */ new Date()
    }).onConflictDoUpdate({
      target: [userQuestionHistory.userUid, userQuestionHistory.questionId],
      set: {
        attemptCount: sql`${userQuestionHistory.attemptCount} + 1`,
        lastCorrect: isCorrect,
        lastAttemptedAt: /* @__PURE__ */ new Date()
      }
    });
    await db.update(questions).set({
      timesAsked: sql`${questions.timesAsked} + 1`,
      timesCorrect: isCorrect ? sql`${questions.timesCorrect} + 1` : questions.timesCorrect
    }).where(eq(questions.id, aq.questionId));
    const allAq = await db.select().from(attemptQuestions).where(eq(attemptQuestions.attemptId, attempt.id));
    const currentScore = allAq.reduce((s, item) => s + item.pointsEarned, 0);
    const correctCount = allAq.filter((item) => item.isAnswered && item.isCorrect).length;
    const incorrectCount = allAq.filter((item) => item.isAnswered && !item.isCorrect).length;
    const unansweredCount = allAq.filter((item) => !item.isAnswered).length;
    const answeredTotal = correctCount + incorrectCount;
    const accuracyPercent = answeredTotal > 0 ? Math.round(correctCount / answeredTotal * 1e3) / 10 : 0;
    const nextIndex = Math.min(attempt.totalQuestions - 1, aq.orderIndex + 1);
    await db.update(quizAttempts).set({
      currentScore,
      correctCount,
      incorrectCount,
      unansweredCount,
      accuracyPercent,
      timeSpentSec: Math.max(attempt.timeSpentSec, Math.round(totalElapsedSec)),
      currentIndex: nextIndex
    }).where(eq(quizAttempts.id, attempt.id));
    return {
      alreadyAnswered: false,
      attemptQuestionId: aq.id,
      selectedOptionId,
      correctOptionId: correctOption.id,
      isCorrect,
      pointsEarned,
      explanation: qRow.explanation,
      currentScore,
      correctCount,
      incorrectCount,
      unansweredCount,
      accuracyPercent
    };
  } catch (error) {
    console.error("Failed to submit answer:", error);
    throw new Error("Failed to submit answer.", { cause: error });
  }
}
async function toggleQuestionFlag(params) {
  try {
    const { uid, attemptUuid, attemptQuestionId, isFlagged } = params;
    const [attempt] = await db.select().from(quizAttempts).where(eq(quizAttempts.attemptUuid, attemptUuid));
    if (!attempt || attempt.userUid !== uid) {
      throw new Error("Unauthorized.");
    }
    await db.update(attemptQuestions).set({ isFlagged }).where(
      and(
        eq(attemptQuestions.id, attemptQuestionId),
        eq(attemptQuestions.attemptId, attempt.id)
      )
    );
    return { attemptQuestionId, isFlagged };
  } catch (error) {
    console.error("Failed to flag question:", error);
    throw new Error("Failed to flag question.", { cause: error });
  }
}
async function saveAttemptProgress(params) {
  try {
    const { uid, attemptUuid, currentIndex, timeSpentSec } = params;
    const [attempt] = await db.select().from(quizAttempts).where(eq(quizAttempts.attemptUuid, attemptUuid));
    if (!attempt || attempt.userUid !== uid) {
      throw new Error("Unauthorized.");
    }
    await db.update(quizAttempts).set({
      currentIndex: Math.max(0, Math.min(attempt.totalQuestions - 1, currentIndex)),
      timeSpentSec: Math.max(attempt.timeSpentSec, Math.round(timeSpentSec))
    }).where(eq(quizAttempts.id, attempt.id));
    return { ok: true };
  } catch (error) {
    console.error("Failed to save progress:", error);
    throw new Error("Failed to save progress.", { cause: error });
  }
}
async function finalizeChallengeAttempt(params) {
  try {
    const { uid, attemptUuid, timeSpentSec } = params;
    const attempts = await db.select().from(quizAttempts).where(eq(quizAttempts.attemptUuid, attemptUuid));
    if (attempts.length === 0) throw new Error("Attempt not found.");
    const attempt = attempts[0];
    if (attempt.userUid !== uid) throw new Error("Unauthorized.");
    const allAq = await db.select().from(attemptQuestions).where(eq(attemptQuestions.attemptId, attempt.id)).orderBy(asc(attemptQuestions.orderIndex));
    const currentScore = allAq.reduce((s, item) => s + item.pointsEarned, 0);
    const correctCount = allAq.filter((item) => item.isAnswered && item.isCorrect).length;
    const incorrectCount = allAq.filter((item) => item.isAnswered && !item.isCorrect).length;
    const unansweredCount = allAq.filter((item) => !item.isAnswered).length;
    const answeredCount = correctCount + incorrectCount;
    const accuracyPercent = allAq.length > 0 ? Math.round(correctCount / allAq.length * 1e3) / 10 : 0;
    const finalTimeSec = Math.max(1, Math.max(attempt.timeSpentSec, Math.round(timeSpentSec)));
    const baseXp = correctCount * 15 + currentScore * 4;
    const completionBonusXp = unansweredCount === 0 ? 75 : 25;
    const totalXpEarned = baseXp + completionBonusXp;
    const firstFiveCorrect = allAq.length >= 5 && allAq.slice(0, 5).every((q) => q.isAnswered && q.isCorrect);
    const veryHardQuestions = allAq.filter((q) => q.difficulty === "Very Hard");
    const allVeryHardCorrect = veryHardQuestions.length > 0 && veryHardQuestions.every((q) => q.isAnswered && q.isCorrect);
    const profile = await getOrCreateProfile(uid, "", attempt.displayName);
    const candidateAchievementCodes = evaluateAchievementUnlocks({
      mode: attempt.mode,
      categorySlug: attempt.categorySlug,
      totalQuestions: allAq.length,
      answeredCount,
      correctCount,
      currentScore,
      maxPossibleScore: attempt.maxPossibleScore,
      accuracyPercent,
      firstFiveCorrect,
      allVeryHardCorrect,
      veryHardTotalCount: veryHardQuestions.length,
      completedChallengesCount: profile.totalCompletedChallenges + 1
    });
    const existingUserAch = await db.select().from(userAchievements).where(eq(userAchievements.userUid, uid));
    const existingCodes = new Set(existingUserAch.map((a) => a.achievementCode));
    const newlyUnlockedCodes = candidateAchievementCodes.filter(
      (c) => !existingCodes.has(c)
    );
    let achievementBonusXp = 0;
    const allAchDefs = await db.select().from(achievements);
    const newlyUnlockedDetails = [];
    for (const code of newlyUnlockedCodes) {
      await db.insert(userAchievements).values({
        userUid: uid,
        achievementCode: code,
        attemptId: attempt.id
      }).onConflictDoNothing();
      const def = allAchDefs.find((a) => a.code === code);
      if (def) {
        achievementBonusXp += def.xpReward;
        newlyUnlockedDetails.push(def);
      }
    }
    const totalCombinedXpEarned = attempt.status === "completed" ? attempt.xpEarned : totalXpEarned + achievementBonusXp;
    if (attempt.status !== "completed") {
      await db.update(quizAttempts).set({
        status: "completed",
        currentScore,
        correctCount,
        incorrectCount,
        unansweredCount,
        accuracyPercent,
        timeSpentSec: finalTimeSec,
        xpEarned: totalCombinedXpEarned,
        completedAt: /* @__PURE__ */ new Date()
      }).where(eq(quizAttempts.id, attempt.id));
      const newTotalCompleted = profile.totalCompletedChallenges + 1;
      const newXp = profile.xp + totalCombinedXpEarned;
      const { level: newLevel } = calculateLevelFromXp(newXp);
      const newBestScore = Math.max(profile.bestScore, currentScore);
      const newAvgAcc = Math.round(
        (profile.averageAccuracy * profile.totalCompletedChallenges + accuracyPercent) / newTotalCompleted * 10
      ) / 10;
      const masteryMap = JSON.parse(profile.categoryMasteryJson || "{}");
      for (const item of allAq) {
        const entry = masteryMap[item.categorySlug] || {
          correct: 0,
          total: 0,
          accuracy: 0
        };
        entry.total += 1;
        if (item.isAnswered && item.isCorrect) {
          entry.correct += 1;
        }
        entry.accuracy = Math.round(entry.correct / entry.total * 100);
        masteryMap[item.categorySlug] = entry;
      }
      await db.update(profiles).set({
        xp: newXp,
        level: newLevel,
        totalCompletedChallenges: newTotalCompleted,
        bestScore: newBestScore,
        averageAccuracy: newAvgAcc,
        currentStreak: accuracyPercent >= 60 ? profile.currentStreak + 1 : 1,
        categoryMasteryJson: JSON.stringify(masteryMap),
        updatedAt: /* @__PURE__ */ new Date()
      }).where(eq(profiles.uid, uid));
      if (attempt.mode !== "practice") {
        await db.insert(leaderboards).values({
          attemptId: attempt.id,
          userUid: uid,
          displayName: profile.displayName || attempt.displayName,
          studentClass: profile.studentClass || attempt.studentClass || "",
          schoolCollege: profile.schoolCollege || attempt.schoolCollege || "",
          avatar: profile.avatar,
          mode: attempt.mode,
          categorySlug: attempt.categorySlug,
          score: currentScore,
          maxScore: attempt.maxPossibleScore,
          accuracyPercent,
          timeSpentSec: finalTimeSec
        }).onConflictDoNothing({ target: leaderboards.attemptId });
      }
    }
    const state = await getAttemptState(uid, attemptUuid);
    const categoryBreakdownMap = /* @__PURE__ */ new Map();
    const difficultyBreakdownMap = /* @__PURE__ */ new Map();
    for (const q of state.questions) {
      const catEntry = categoryBreakdownMap.get(q.categorySlug) || {
        categorySlug: q.categorySlug,
        correct: 0,
        total: 0,
        score: 0,
        maxScore: 0
      };
      catEntry.total += 1;
      catEntry.maxScore += q.pointsValue;
      if (q.isCorrect) {
        catEntry.correct += 1;
        catEntry.score += q.pointsEarned || 0;
      }
      categoryBreakdownMap.set(q.categorySlug, catEntry);
      const diffEntry = difficultyBreakdownMap.get(q.difficulty) || {
        difficulty: q.difficulty,
        correct: 0,
        total: 0,
        score: 0,
        maxScore: 0
      };
      diffEntry.total += 1;
      diffEntry.maxScore += q.pointsValue;
      if (q.isCorrect) {
        diffEntry.correct += 1;
        diffEntry.score += q.pointsEarned || 0;
      }
      difficultyBreakdownMap.set(q.difficulty, diffEntry);
    }
    return {
      attempt: state.attempt,
      questions: state.questions,
      categoryBreakdown: Array.from(categoryBreakdownMap.values()),
      difficultyBreakdown: Array.from(difficultyBreakdownMap.values()),
      xpEarned: totalCombinedXpEarned,
      newlyUnlockedAchievements: newlyUnlockedDetails
    };
  } catch (error) {
    console.error("Failed to finalize challenge:", error);
    throw new Error("Failed to finalize challenge results.", { cause: error });
  }
}
async function queryLeaderboards(params) {
  try {
    await ensureDatabaseSeeded();
    const { mode, categorySlug, timeframe } = params;
    const conditions = [];
    if (mode && mode !== "all") {
      conditions.push(eq(leaderboards.mode, mode));
    }
    if (categorySlug && categorySlug !== "all") {
      conditions.push(eq(leaderboards.categorySlug, categorySlug));
    }
    if (timeframe === "weekly") {
      const weekAgo = new Date(Date.now() - 7 * 24 * 3600 * 1e3);
      conditions.push(gte(leaderboards.completedAt, weekAgo));
    } else if (timeframe === "monthly") {
      const monthAgo = new Date(Date.now() - 30 * 24 * 3600 * 1e3);
      conditions.push(gte(leaderboards.completedAt, monthAgo));
    }
    const baseQuery = db.select().from(leaderboards);
    const filteredQuery = conditions.length > 0 ? baseQuery.where(and(...conditions)) : baseQuery;
    const rows = await filteredQuery.orderBy(
      desc(leaderboards.score),
      desc(leaderboards.accuracyPercent),
      asc(leaderboards.timeSpentSec)
    ).limit(50);
    return rows;
  } catch (error) {
    console.error("Failed to query leaderboards:", error);
    throw new Error("Failed to load leaderboards.", { cause: error });
  }
}
async function listAdminQuestions(params) {
  try {
    await ensureDatabaseSeeded();
    const conditions = [];
    if (params.categorySlug && params.categorySlug !== "all") {
      conditions.push(eq(questions.categorySlug, params.categorySlug));
    }
    if (params.difficulty && params.difficulty !== "all") {
      conditions.push(eq(questions.difficulty, params.difficulty));
    }
    if (params.verificationStatus && params.verificationStatus !== "all") {
      conditions.push(eq(questions.verificationStatus, params.verificationStatus));
    }
    const qRows = await db.select().from(questions).where(conditions.length > 0 ? and(...conditions) : void 0).orderBy(desc(questions.id)).limit(params.limit || 60);
    const filtered = params.search ? qRows.filter(
      (q) => q.questionText.toLowerCase().includes(params.search.toLowerCase()) || q.code.toLowerCase().includes(params.search.toLowerCase())
    ) : qRows;
    const qIds = filtered.map((q) => q.id);
    const opts = qIds.length > 0 ? await db.select().from(questionOptions).where(inArray(questionOptions.questionId, qIds)) : [];
    const [{ totalCount }] = await db.select({ totalCount: sql`count(*)::int` }).from(questions);
    const reports = await db.select({
      report: questionReports,
      questionText: questions.questionText,
      questionCode: questions.code
    }).from(questionReports).innerJoin(questions, eq(questionReports.questionId, questions.id)).orderBy(desc(questionReports.createdAt)).limit(30);
    return {
      totalDatabaseQuestions: totalCount,
      questions: filtered.map((q) => ({
        ...q,
        options: opts.filter((o) => o.questionId === q.id)
      })),
      reports
    };
  } catch (error) {
    console.error("Failed to list admin questions:", error);
    throw new Error("Failed to load question bank.", { cause: error });
  }
}
async function createAdminQuestion(params) {
  try {
    await ensureDatabaseSeeded();
    const trimmedText = params.questionText.trim();
    if (trimmedText.length < 12) {
      throw new Error("Question text must be at least 12 characters.");
    }
    const uniqueOpts = new Set(params.options.map((o) => o.trim().toLowerCase()));
    if (uniqueOpts.size < 4) {
      throw new Error("All four answer options must be distinct and non-empty.");
    }
    const [cat] = await db.select().from(categories).where(eq(categories.slug, params.categorySlug));
    if (!cat) throw new Error("Invalid category.");
    const code = `custom_${params.categorySlug}_${Date.now()}_${Math.floor(Math.random() * 1e3)}`;
    const [created] = await db.insert(questions).values({
      code,
      categoryId: cat.id,
      categorySlug: params.categorySlug,
      difficulty: params.difficulty,
      questionText: trimmedText,
      explanation: params.explanation.trim() || "Verified domain explanation.",
      diagramType: params.diagramType || "none",
      tagsJson: JSON.stringify(params.tags || []),
      estimatedTimeSec: 35,
      verificationStatus: params.verificationStatus || "verified",
      isActive: true
    }).returning();
    const keys = ["A", "B", "C", "D"];
    await db.insert(questionOptions).values(
      params.options.map((text2, idx) => ({
        questionId: created.id,
        optionKey: keys[idx],
        optionText: text2.trim(),
        isCorrect: idx === 0
      }))
    );
    return created;
  } catch (error) {
    console.error("Failed to create admin question:", error);
    throw new Error(error.message || "Failed to create question.", { cause: error });
  }
}
async function updateAdminQuestionStatus(params) {
  try {
    const [updated] = await db.update(questions).set({
      verificationStatus: params.verificationStatus,
      isActive: params.isActive
    }).where(eq(questions.id, params.questionId)).returning();
    return updated;
  } catch (error) {
    console.error("Failed to update question status:", error);
    throw new Error("Failed to update question status.", { cause: error });
  }
}
async function submitQuestionReport(params) {
  try {
    const [report] = await db.insert(questionReports).values({
      questionId: params.questionId,
      userUid: params.userUid,
      reason: params.reason.trim().slice(0, 100),
      details: params.details.trim().slice(0, 500),
      status: "open"
    }).returning();
    return report;
  } catch (error) {
    console.error("Failed to submit question report:", error);
    throw new Error("Failed to submit question report.", { cause: error });
  }
}

// server.ts
dotenv.config();
var app = express();
app.use(express.json({ limit: "1mb" }));
var rateWindowMap = /* @__PURE__ */ new Map();
app.use("/api", (req, res, next) => {
  const key = req.ip || "local";
  const now = Date.now();
  const entry = rateWindowMap.get(key);
  if (!entry || now > entry.resetAt) {
    rateWindowMap.set(key, { count: 1, resetAt: now + 6e4 });
    return next();
  }
  entry.count += 1;
  if (entry.count > 240) {
    return res.status(429).json({ error: "Rate limit exceeded. Please wait a moment." });
  }
  next();
});
app.get("/api/overview", resolveActor, async (req, res) => {
  try {
    const overview = await getDashboardOverview(
      req.actorUid,
      req.actorEmail || "",
      req.actorName || "Student Challenger",
      req.actorClass || "",
      req.actorSchool || ""
    );
    res.json(overview);
  } catch (error) {
    res.status(500).json({ error: error.message || "Failed to load overview." });
  }
});
app.post("/api/student/login", resolveActor, async (req, res) => {
  try {
    const { displayName, studentClass, schoolCollege, avatar } = req.body || {};
    const cleanName = String(displayName || "").trim();
    const cleanClass = String(studentClass || "").trim();
    const cleanSchool = String(schoolCollege || "").trim();
    if (!cleanName || !cleanClass || !cleanSchool) {
      return res.status(400).json({
        error: "Please enter your Student Name, Class, and School/College."
      });
    }
    const updated = await updateProfileIdentity(
      req.actorUid,
      cleanName,
      String(avatar || "shield-cyan"),
      cleanClass,
      cleanSchool
    );
    res.json({ profile: updated });
  } catch (error) {
    res.status(500).json({ error: error.message || "Failed to save student login." });
  }
});
app.put("/api/profile", resolveActor, async (req, res) => {
  try {
    const { displayName, avatar, studentClass, schoolCollege } = req.body || {};
    const updated = await updateProfileIdentity(
      req.actorUid,
      String(displayName || req.actorName || "Student Challenger"),
      String(avatar || "shield-cyan"),
      studentClass !== void 0 ? String(studentClass) : req.actorClass,
      schoolCollege !== void 0 ? String(schoolCollege) : req.actorSchool
    );
    res.json({ profile: updated });
  } catch (error) {
    res.status(500).json({ error: error.message || "Failed to update profile." });
  }
});
app.post("/api/auth/transfer-guest", resolveActor, async (req, res) => {
  try {
    const { guestUid } = req.body || {};
    if (req.isGuest || !req.user) {
      return res.status(400).json({ error: "Sign in with Google first to transfer guest progress." });
    }
    const merged = await transferGuestToAccount(
      String(guestUid || ""),
      req.actorUid,
      req.actorEmail || "",
      req.actorName || "Student Challenger",
      req.actorClass || "",
      req.actorSchool || ""
    );
    res.json({ profile: merged });
  } catch (error) {
    res.status(500).json({ error: error.message || "Failed to transfer guest progress." });
  }
});
app.post("/api/challenges/start", resolveActor, async (req, res) => {
  try {
    const { mode, categorySlug, practiceDifficulty } = req.body || {};
    const validModes = ["full_arena", "category", "quick", "boss_rush", "practice"];
    const chosenMode = validModes.includes(mode) ? mode : "category";
    const state = await startNewChallenge({
      uid: req.actorUid,
      displayName: req.actorName || "Student Challenger",
      studentClass: req.actorClass || "",
      schoolCollege: req.actorSchool || "",
      mode: chosenMode,
      categorySlug: String(categorySlug || "computers"),
      practiceDifficulty: String(practiceDifficulty || "all")
    });
    res.json(state);
  } catch (error) {
    res.status(500).json({ error: error.message || "Failed to start challenge." });
  }
});
app.get("/api/challenges/:attemptUuid", resolveActor, async (req, res) => {
  try {
    const state = await getAttemptState(req.actorUid, String(req.params.attemptUuid));
    res.json(state);
  } catch (error) {
    res.status(404).json({ error: error.message || "Challenge not found." });
  }
});
app.post("/api/challenges/:attemptUuid/answer", resolveActor, async (req, res) => {
  try {
    const { attemptQuestionId, selectedOptionId, questionTimeSec, totalElapsedSec } = req.body || {};
    const result = await submitQuestionAnswer({
      uid: req.actorUid,
      attemptUuid: String(req.params.attemptUuid),
      attemptQuestionId: Number(attemptQuestionId),
      selectedOptionId: Number(selectedOptionId),
      questionTimeSec: Number(questionTimeSec || 5),
      totalElapsedSec: Number(totalElapsedSec || 5)
    });
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message || "Failed to submit answer." });
  }
});
app.post("/api/challenges/:attemptUuid/flag", resolveActor, async (req, res) => {
  try {
    const { attemptQuestionId, isFlagged } = req.body || {};
    const result = await toggleQuestionFlag({
      uid: req.actorUid,
      attemptUuid: String(req.params.attemptUuid),
      attemptQuestionId: Number(attemptQuestionId),
      isFlagged: Boolean(isFlagged)
    });
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message || "Failed to update flag." });
  }
});
app.post("/api/challenges/:attemptUuid/progress", resolveActor, async (req, res) => {
  try {
    const { currentIndex, timeSpentSec } = req.body || {};
    const result = await saveAttemptProgress({
      uid: req.actorUid,
      attemptUuid: String(req.params.attemptUuid),
      currentIndex: Number(currentIndex || 0),
      timeSpentSec: Number(timeSpentSec || 0)
    });
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message || "Failed to save progress." });
  }
});
app.post("/api/challenges/:attemptUuid/complete", resolveActor, async (req, res) => {
  try {
    const { timeSpentSec } = req.body || {};
    const result = await finalizeChallengeAttempt({
      uid: req.actorUid,
      attemptUuid: String(req.params.attemptUuid),
      timeSpentSec: Number(timeSpentSec || 10)
    });
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message || "Failed to complete challenge." });
  }
});
app.get("/api/leaderboards", async (req, res) => {
  try {
    const mode = String(req.query.mode || "full_arena");
    const categorySlug = String(req.query.categorySlug || "all");
    const timeframe = String(req.query.timeframe || "all_time");
    const entries = await queryLeaderboards({ mode, categorySlug, timeframe });
    res.json({ entries });
  } catch (error) {
    res.status(500).json({ error: error.message || "Failed to load leaderboards." });
  }
});
app.post("/api/questions/report", resolveActor, async (req, res) => {
  try {
    const { questionId, reason, details } = req.body || {};
    const report = await submitQuestionReport({
      questionId: Number(questionId),
      userUid: req.actorUid,
      reason: String(reason || "Accuracy review"),
      details: String(details || "")
    });
    res.json({ report });
  } catch (error) {
    res.status(400).json({ error: error.message || "Failed to submit report." });
  }
});
app.get("/api/admin/questions", resolveActor, async (req, res) => {
  try {
    const data = await listAdminQuestions({
      categorySlug: String(req.query.categorySlug || "all"),
      difficulty: String(req.query.difficulty || "all"),
      verificationStatus: String(req.query.verificationStatus || "all"),
      search: String(req.query.search || ""),
      limit: Number(req.query.limit || 60)
    });
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message || "Failed to load admin questions." });
  }
});
app.post("/api/admin/questions", resolveActor, async (req, res) => {
  try {
    const {
      categorySlug,
      difficulty,
      questionText,
      options,
      explanation,
      diagramType,
      tags,
      verificationStatus
    } = req.body || {};
    const created = await createAdminQuestion({
      categorySlug: String(categorySlug || "computers"),
      difficulty: difficulty || "Normal",
      questionText: String(questionText || ""),
      options,
      explanation: String(explanation || ""),
      diagramType: String(diagramType || "none"),
      tags: Array.isArray(tags) ? tags : [],
      verificationStatus: String(verificationStatus || "verified")
    });
    res.json({ question: created });
  } catch (error) {
    res.status(400).json({ error: error.message || "Failed to create question." });
  }
});
app.patch("/api/admin/questions/:id", resolveActor, async (req, res) => {
  try {
    const { verificationStatus, isActive } = req.body || {};
    const updated = await updateAdminQuestionStatus({
      questionId: Number(req.params.id),
      verificationStatus: String(verificationStatus || "verified"),
      isActive: Boolean(isActive)
    });
    res.json({ question: updated });
  } catch (error) {
    res.status(400).json({ error: error.message || "Failed to update question." });
  }
});
app.post("/api/admin/generate-ai-questions", resolveActor, async (req, res) => {
  try {
    const { categorySlug = "computers", difficulty = "Hard", topic = "" } = req.body || {};
    if (!process.env.GEMINI_API_KEY) {
      return res.status(503).json({
        error: "GEMINI_API_KEY is not configured in Settings > Secrets."
      });
    }
    const ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build"
        }
      }
    });
    const prompt = `Generate 2 rigorous, fact-checked multiple-choice quiz questions for category "${categorySlug}" at "${difficulty}" difficulty${topic ? ` focusing on "${topic}"` : ""}.
Provide 1 exact correct answer and 3 plausible but unambiguously wrong distractors, plus a thorough technical explanation.`;
    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: prompt,
      config: {
        systemInstruction: "You are a technical subject-matter expert creating fact-checked engineering, computing, automotive, motorcycle, geography, and programming questions. Return valid JSON matching the schema.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              questionText: { type: Type.STRING },
              correctOption: { type: Type.STRING },
              wrongOption1: { type: Type.STRING },
              wrongOption2: { type: Type.STRING },
              wrongOption3: { type: Type.STRING },
              explanation: { type: Type.STRING }
            },
            required: [
              "questionText",
              "correctOption",
              "wrongOption1",
              "wrongOption2",
              "wrongOption3",
              "explanation"
            ]
          }
        }
      }
    });
    const parsed = JSON.parse((response.text ?? "[]").trim());
    const savedCandidates = [];
    for (const item of parsed) {
      const created = await createAdminQuestion({
        categorySlug: String(categorySlug),
        difficulty,
        questionText: item.questionText,
        options: [
          item.correctOption,
          item.wrongOption1,
          item.wrongOption2,
          item.wrongOption3
        ],
        explanation: item.explanation,
        diagramType: "none",
        tags: ["ai-candidate", String(categorySlug)],
        verificationStatus: "pending_review"
        // Must be reviewed by admin before publication!
      });
      savedCandidates.push(created);
    }
    res.json({ candidates: savedCandidates });
  } catch (error) {
    console.error("AI candidate generation failed:", error);
    res.status(500).json({
      error: error.message || "Failed to generate candidate questions via Gemini API."
    });
  }
});
async function startServer() {
  const PORT = Number(process.env.PORT || 3e3);
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Knowledge Arena server running on http://localhost:${PORT}`);
  });
}
startServer();
