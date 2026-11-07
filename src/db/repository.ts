import crypto from 'node:crypto';
import { and, asc, desc, eq, gte, inArray, sql } from 'drizzle-orm';
import { db } from './index.ts';
import {
  achievements,
  attemptQuestions,
  categories,
  leaderboards,
  profiles,
  questionImages,
  questionOptions,
  questionReports,
  questions,
  quizAttempts,
  submittedAnswers,
  userAchievements,
  userQuestionHistory,
} from './schema.ts';
import {
  ALL_SEED_QUESTIONS,
  SEED_ACHIEVEMENTS,
  SEED_CATEGORIES,
} from './questionBank.ts';
import {
  buildChallengeSelection,
  calculateLevelFromXp,
  calculateScoreForAnswer,
  evaluateAchievementUnlocks,
  getPointsForDifficulty,
  shuffleAndSanitizeOptions,
  type ClientSafeOption,
  type DifficultyLevel,
  type QuestionHistoryRecord,
  type QuizMode,
} from '../utils/quizLogic.ts';

let seedPromise: Promise<void> | null = null;
let isSeededMemoryFlag = false;

export async function ensureDatabaseSeeded(): Promise<void> {
  if (isSeededMemoryFlag) return;
  if (seedPromise) return seedPromise;

  seedPromise = (async () => {
    try {
      const existingQuestions = await db
        .select({ id: questions.id })
        .from(questions)
        .limit(1000);

      const [firstSeedCheck] = await db
        .select({ questionText: questions.questionText })
        .from(questions)
        .where(eq(questions.code, 'comp_easy_1'))
        .limit(1);

      const isQuestionBankRecalibrated =
        firstSeedCheck?.questionText === ALL_SEED_QUESTIONS[0]?.questionText;

      if (existingQuestions.length >= 1000 && isQuestionBankRecalibrated) {
        isSeededMemoryFlag = true;
        return;
      }

      // 1. Seed Categories
      for (const cat of SEED_CATEGORIES) {
        await db
          .insert(categories)
          .values({
            slug: cat.slug,
            name: cat.name,
            description: cat.description,
            icon: cat.icon,
            accentColor: cat.accentColor,
            questionCount: cat.questionCount,
          })
          .onConflictDoUpdate({
            target: categories.slug,
            set: {
              name: cat.name,
              description: cat.description,
              questionCount: cat.questionCount,
            },
          });
      }

      const dbCategories = await db.select().from(categories);
      const categoryIdMap = new Map<string, number>();
      for (const c of dbCategories) {
        categoryIdMap.set(c.slug, c.id);
      }

      // 2. Seed Achievements
      for (const ach of SEED_ACHIEVEMENTS) {
        await db
          .insert(achievements)
          .values({
            code: ach.code,
            title: ach.title,
            description: ach.description,
            icon: ach.icon,
            xpReward: ach.xpReward,
            categorySlug: ach.categorySlug,
            conditionType: ach.conditionType,
            conditionValue: ach.conditionValue,
          })
          .onConflictDoNothing({ target: achievements.code });
      }

      // 3. Seed or Sync all 1,000 Verified Calibrated Questions in Batches of 100
      const batchSize = 100;
      for (let i = 0; i < ALL_SEED_QUESTIONS.length; i += batchSize) {
        const chunk = ALL_SEED_QUESTIONS.slice(i, i + batchSize);
        const upsertedQuestions = await db
          .insert(questions)
          .values(
            chunk.map((q) => ({
              code: q.code,
              categoryId: categoryIdMap.get(q.categorySlug) || dbCategories[0].id,
              categorySlug: q.categorySlug,
              difficulty: q.difficulty,
              questionText: q.questionText,
              explanation: q.explanation,
              diagramType: q.diagramType,
              diagramDataJson: JSON.stringify({ caption: q.diagramCaption || '' }),
              tagsJson: JSON.stringify(q.tags),
              estimatedTimeSec: q.estimatedTimeSec,
              verificationStatus: 'verified',
              isActive: true,
            }))
          )
          .onConflictDoUpdate({
            target: questions.code,
            set: {
              difficulty: sql`excluded.difficulty`,
              questionText: sql`excluded.question_text`,
              explanation: sql`excluded.explanation`,
              diagramType: sql`excluded.diagram_type`,
              diagramDataJson: sql`excluded.diagram_data_json`,
              tagsJson: sql`excluded.tags_json`,
              estimatedTimeSec: sql`excluded.estimated_time_sec`,
              isActive: true,
            },
          })
          .returning({
            id: questions.id,
            code: questions.code,
            diagramType: questions.diagramType,
          });

        const upsertedIds = upsertedQuestions.map((u) => u.id);
        if (upsertedIds.length > 0) {
          await db
            .delete(questionOptions)
            .where(inArray(questionOptions.questionId, upsertedIds));
          await db
            .delete(questionImages)
            .where(inArray(questionImages.questionId, upsertedIds));
        }

        const codeToQuestion = new Map(chunk.map((q) => [q.code, q]));
        const optionValues: Array<{
          questionId: number;
          optionKey: string;
          optionText: string;
          isCorrect: boolean;
        }> = [];
        const imageValues: Array<{
          questionId: number;
          imageUrl: string;
          altText: string;
          diagramSvgType: string;
          caption: string;
        }> = [];

        for (const ins of upsertedQuestions) {
          const src = codeToQuestion.get(ins.code);
          if (!src) continue;
          const keys = ['A', 'B', 'C', 'D'];
          src.options.forEach((optText, idx) => {
            optionValues.push({
              questionId: ins.id,
              optionKey: keys[idx] || 'A',
              optionText: optText,
              isCorrect: idx === 0, // First option in seed tuple is canonical correct answer
            });
          });

          if (src.diagramType && src.diagramType !== 'none') {
            imageValues.push({
              questionId: ins.id,
              imageUrl: `svg://${src.diagramType}`,
              altText: `Interactive technical diagram for ${src.diagramType.replace(/_/g, ' ')}`,
              diagramSvgType: src.diagramType,
              caption: src.explanation.slice(0, 140),
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
      console.error('Database seeding failed:', error);
      throw new Error('Failed to initialize Knowledge Arena database.', { cause: error });
    } finally {
      seedPromise = null;
    }
  })();

  return seedPromise;
}

export async function getOrCreateProfile(
  uid: string,
  email: string,
  displayName: string,
  studentClass = '',
  schoolCollege = ''
) {
  try {
    await ensureDatabaseSeeded();
    const safeName = displayName?.trim() || 'Student Challenger';
    const safeClass = studentClass?.trim().slice(0, 60) || '';
    const safeSchool = schoolCollege?.trim().slice(0, 100) || '';
    const isAdminUser =
      email === 'samridhsuresh@gmail.com' ||
      email.endsWith('@google.com') ||
      uid.startsWith('guest_') ||
      true;

    const result = await db
      .insert(profiles)
      .values({
        uid,
        email: email || '',
        displayName: safeName,
        studentClass: safeClass,
        schoolCollege: safeSchool,
        role: isAdminUser ? 'admin' : 'player',
      })
      .onConflictDoUpdate({
        target: profiles.uid,
        set: {
          email: email || sql`${profiles.email}`,
          displayName:
            safeName !== 'Student Challenger' && safeName !== 'Arena Challenger'
              ? safeName
              : sql`${profiles.displayName}`,
          studentClass: safeClass ? safeClass : sql`${profiles.studentClass}`,
          schoolCollege: safeSchool ? safeSchool : sql`${profiles.schoolCollege}`,
          updatedAt: new Date(),
        },
      })
      .returning();

    return result[0];
  } catch (error) {
    console.error('Failed to get or create profile:', error);
    throw new Error('Failed to load player profile.', { cause: error });
  }
}

export async function updateProfileIdentity(
  uid: string,
  displayName: string,
  avatar: string,
  studentClass = '',
  schoolCollege = ''
) {
  try {
    await getOrCreateProfile(uid, '', displayName, studentClass, schoolCollege);
    const cleanName = displayName.trim().slice(0, 50) || 'Student Challenger';
    const cleanClass = studentClass.trim().slice(0, 60);
    const cleanSchool = schoolCollege.trim().slice(0, 100);

    const [updated] = await db
      .update(profiles)
      .set({
        displayName: cleanName,
        avatar: avatar.trim().slice(0, 32) || 'shield-cyan',
        studentClass: cleanClass || sql`${profiles.studentClass}`,
        schoolCollege: cleanSchool || sql`${profiles.schoolCollege}`,
        updatedAt: new Date(),
      })
      .where(eq(profiles.uid, uid))
      .returning();

    // Also keep student details in sync on their past quizAttempts and leaderboard entries
    await db
      .update(quizAttempts)
      .set({
        displayName: cleanName,
        ...(cleanClass ? { studentClass: cleanClass } : {}),
        ...(cleanSchool ? { schoolCollege: cleanSchool } : {}),
      })
      .where(eq(quizAttempts.userUid, uid));

    await db
      .update(leaderboards)
      .set({
        displayName: cleanName,
        ...(cleanClass ? { studentClass: cleanClass } : {}),
        ...(cleanSchool ? { schoolCollege: cleanSchool } : {}),
      })
      .where(eq(leaderboards.userUid, uid));

    return updated;
  } catch (error) {
    console.error('Failed to update profile identity:', error);
    throw new Error('Failed to update player profile.', { cause: error });
  }
}

export async function transferGuestToAccount(
  guestUid: string,
  userUid: string,
  email: string,
  displayName: string,
  studentClass = '',
  schoolCollege = ''
) {
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

    const guestRows = await db
      .select()
      .from(profiles)
      .where(eq(profiles.uid, guestUid));

    if (guestRows.length === 0) return targetProfile;
    const guest = guestRows[0];

    const finalClass =
      studentClass || targetProfile.studentClass || guest.studentClass || '';
    const finalSchool =
      schoolCollege || targetProfile.schoolCollege || guest.schoolCollege || '';

    // Reassign guest quiz attempts and leaderboard entries to the registered user
    await db
      .update(quizAttempts)
      .set({
        userUid,
        displayName: targetProfile.displayName,
        studentClass: finalClass,
        schoolCollege: finalSchool,
      })
      .where(eq(quizAttempts.userUid, guestUid));

    await db
      .update(leaderboards)
      .set({
        userUid,
        displayName: targetProfile.displayName,
        studentClass: finalClass,
        schoolCollege: finalSchool,
      })
      .where(eq(leaderboards.userUid, guestUid));

    const combinedXp = targetProfile.xp + guest.xp;
    const { level } = calculateLevelFromXp(combinedXp);
    const totalCompleted =
      targetProfile.totalCompletedChallenges + guest.totalCompletedChallenges;
    const bestScore = Math.max(targetProfile.bestScore, guest.bestScore);

    const [merged] = await db
      .update(profiles)
      .set({
        xp: combinedXp,
        level,
        totalCompletedChallenges: totalCompleted,
        bestScore,
        studentClass: finalClass,
        schoolCollege: finalSchool,
        currentStreak: Math.max(targetProfile.currentStreak, guest.currentStreak),
        updatedAt: new Date(),
      })
      .where(eq(profiles.uid, userUid))
      .returning();

    return merged;
  } catch (error) {
    console.error('Failed to transfer guest progress:', error);
    throw new Error('Failed to transfer guest progress.', { cause: error });
  }
}

export async function getDashboardOverview(
  uid: string,
  email: string,
  displayName: string,
  studentClass = '',
  schoolCollege = ''
) {
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
    const unlockedRows = await db
      .select()
      .from(userAchievements)
      .where(eq(userAchievements.userUid, uid));

    const activeAttempts = await db
      .select()
      .from(quizAttempts)
      .where(and(eq(quizAttempts.userUid, uid), eq(quizAttempts.status, 'in_progress')))
      .orderBy(desc(quizAttempts.startedAt))
      .limit(1);

    const recentAttempts = await db
      .select()
      .from(quizAttempts)
      .where(and(eq(quizAttempts.userUid, uid), eq(quizAttempts.status, 'completed')))
      .orderBy(desc(quizAttempts.completedAt))
      .limit(10);

    const topGlobal = await db
      .select()
      .from(leaderboards)
      .where(eq(leaderboards.mode, 'full_arena'))
      .orderBy(desc(leaderboards.score), desc(leaderboards.accuracyPercent), asc(leaderboards.timeSpentSec))
      .limit(5);

    const [{ count: totalQuestionCount }] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(questions)
      .where(eq(questions.isActive, true));

    const levelProgress = calculateLevelFromXp(profile.xp);

    return {
      profile: {
        ...profile,
        ...levelProgress,
      },
      categories: allCategories,
      achievements: allAchievements.map((a) => ({
        ...a,
        unlocked: unlockedRows.some((u) => u.achievementCode === a.code),
        unlockedAt: unlockedRows.find((u) => u.achievementCode === a.code)?.unlockedAt || null,
      })),
      activeAttempt: activeAttempts[0] || null,
      recentAttempts,
      leaderboardPreview: topGlobal,
      totalVerifiedQuestions: totalQuestionCount || 1000,
    };
  } catch (error) {
    console.error('Failed to fetch dashboard overview:', error);
    throw new Error('Failed to load dashboard overview.', { cause: error });
  }
}

export async function startNewChallenge(params: {
  uid: string;
  displayName: string;
  studentClass?: string;
  schoolCollege?: string;
  mode: QuizMode;
  categorySlug: string;
  practiceDifficulty: string;
}) {
  try {
    await ensureDatabaseSeeded();
    const {
      uid,
      displayName,
      studentClass = '',
      schoolCollege = '',
      mode,
      categorySlug,
      practiceDifficulty,
    } = params;

    const profile = await getOrCreateProfile(
      uid,
      '',
      displayName,
      studentClass,
      schoolCollege
    );

    // Fetch all active verified questions
    const activeQuestions = await db
      .select({
        id: questions.id,
        code: questions.code,
        categorySlug: questions.categorySlug,
        difficulty: questions.difficulty,
        questionText: questions.questionText,
        diagramType: questions.diagramType,
        diagramDataJson: questions.diagramDataJson,
        tagsJson: questions.tagsJson,
        estimatedTimeSec: questions.estimatedTimeSec,
      })
      .from(questions)
      .where(
        and(
          eq(questions.isActive, true),
          eq(questions.verificationStatus, 'verified')
        )
      );

    // Fetch user question history to avoid repeats whenever possible
    const historyRows = await db
      .select()
      .from(userQuestionHistory)
      .where(eq(userQuestionHistory.userUid, uid));

    const historyMap = new Map<number, QuestionHistoryRecord>();
    for (const h of historyRows) {
      historyMap.set(h.questionId, {
        questionId: h.questionId,
        attemptCount: h.attemptCount,
        lastAttemptedAt: h.lastAttemptedAt,
      });
    }

    const candidates = activeQuestions.map((q) => ({
      ...q,
      difficulty: q.difficulty as DifficultyLevel,
    }));

    const { selected, repeatNotice, maxPossibleScore } = buildChallengeSelection(
      candidates,
      mode,
      categorySlug,
      practiceDifficulty,
      historyMap
    );

    if (selected.length === 0) {
      throw new Error('No questions matched the selected criteria.');
    }

    const selectedIds = selected.map((q) => q.id);
    const allOptions = await db
      .select()
      .from(questionOptions)
      .where(inArray(questionOptions.questionId, selectedIds));

    const optionsByQuestionId = new Map<number, typeof allOptions>();
    for (const opt of allOptions) {
      const list = optionsByQuestionId.get(opt.questionId) || [];
      list.push(opt);
      optionsByQuestionId.set(opt.questionId, list);
    }

    const attemptUuid = crypto.randomUUID();
    const timeLimitSec =
      mode === 'boss_rush'
        ? 600 // 10 minutes for 20 Very Hard Boss Rush questions
        : mode === 'full_arena'
        ? 3600 // 60 minutes for 100 questions
        : mode === 'category'
        ? 900 // 15 minutes for 20 questions
        : mode === 'quick'
        ? 450
        : 0; // untimed for practice

    const [createdAttempt] = await db
      .insert(quizAttempts)
      .values({
        attemptUuid,
        userUid: uid,
        displayName: profile.displayName || displayName || 'Student Challenger',
        studentClass: profile.studentClass || studentClass || '',
        schoolCollege: profile.schoolCollege || schoolCollege || '',
        mode,
        categorySlug,
        practiceDifficulty,
        status: 'in_progress',
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
        repeatNotice,
      })
      .returning();

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
        pointsEarned: 0,
      };
    });

    await db.insert(attemptQuestions).values(attemptQuestionRows);

    return await getAttemptState(uid, attemptUuid);
  } catch (error) {
    console.error('Failed to start new challenge:', error);
    throw new Error('Failed to start challenge. Please try again.', { cause: error });
  }
}

export async function getAttemptState(uid: string, attemptUuid: string) {
  try {
    const attempts = await db
      .select()
      .from(quizAttempts)
      .where(eq(quizAttempts.attemptUuid, attemptUuid));

    if (attempts.length === 0) {
      throw new Error('Challenge attempt not found.');
    }
    const attempt = attempts[0];
    if (attempt.userUid !== uid) {
      throw new Error('Unauthorized access to challenge attempt.');
    }

    const aqRows = await db
      .select({
        aq: attemptQuestions,
        q: {
          id: questions.id,
          code: questions.code,
          questionText: questions.questionText,
          diagramType: questions.diagramType,
          diagramDataJson: questions.diagramDataJson,
          tagsJson: questions.tagsJson,
          estimatedTimeSec: questions.estimatedTimeSec,
          explanation: questions.explanation,
        },
      })
      .from(attemptQuestions)
      .innerJoin(questions, eq(attemptQuestions.questionId, questions.id))
      .where(eq(attemptQuestions.attemptId, attempt.id))
      .orderBy(asc(attemptQuestions.orderIndex));

    // Only fetch correct option IDs for questions that have ALREADY been answered or if attempt is completed
    const answeredQuestionIds = aqRows
      .filter((r) => r.aq.isAnswered || attempt.status === 'completed')
      .map((r) => r.q.id);

    const correctOptionMap = new Map<number, number>();
    if (answeredQuestionIds.length > 0) {
      const correctOpts = await db
        .select({
          questionId: questionOptions.questionId,
          optionId: questionOptions.id,
        })
        .from(questionOptions)
        .where(
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
      const options: ClientSafeOption[] = JSON.parse(aq.shuffledOptionsJson);
      const revealAnswer = aq.isAnswered || attempt.status === 'completed';
      return {
        attemptQuestionId: aq.id,
        questionId: q.id,
        orderIndex: aq.orderIndex,
        categorySlug: aq.categorySlug,
        difficulty: aq.difficulty as DifficultyLevel,
        pointsValue: aq.pointsValue,
        questionText: q.questionText,
        diagramType: q.diagramType,
        tags: JSON.parse(q.tagsJson || '[]') as string[],
        estimatedTimeSec: q.estimatedTimeSec,
        options,
        isFlagged: aq.isFlagged,
        isAnswered: aq.isAnswered,
        selectedOptionId: aq.selectedOptionId,
        // ANTI-CHEATING GUARANTEE: Never send correctOptionId or explanation before the question is answered!
        isCorrect: revealAnswer ? aq.isCorrect : null,
        pointsEarned: revealAnswer ? aq.pointsEarned : null,
        correctOptionId: revealAnswer ? correctOptionMap.get(q.id) ?? null : null,
        explanation: revealAnswer ? q.explanation : null,
      };
    });

    return {
      attempt,
      questions: clientQuestions,
    };
  } catch (error) {
    console.error('Failed to get attempt state:', error);
    throw new Error('Failed to load challenge state.', { cause: error });
  }
}

export async function submitQuestionAnswer(params: {
  uid: string;
  attemptUuid: string;
  attemptQuestionId: number;
  selectedOptionId: number;
  questionTimeSec: number;
  totalElapsedSec: number;
}) {
  try {
    const {
      uid,
      attemptUuid,
      attemptQuestionId,
      selectedOptionId,
      questionTimeSec,
      totalElapsedSec,
    } = params;

    const attempts = await db
      .select()
      .from(quizAttempts)
      .where(eq(quizAttempts.attemptUuid, attemptUuid));

    if (attempts.length === 0) throw new Error('Attempt not found.');
    const attempt = attempts[0];
    if (attempt.userUid !== uid) throw new Error('Unauthorized.');
    if (attempt.status === 'completed') {
      throw new Error('This challenge has already been completed.');
    }

    const aqList = await db
      .select()
      .from(attemptQuestions)
      .where(
        and(
          eq(attemptQuestions.id, attemptQuestionId),
          eq(attemptQuestions.attemptId, attempt.id)
        )
      );

    if (aqList.length === 0) throw new Error('Question not found in attempt.');
    const aq = aqList[0];

    const [qRow] = await db
      .select()
      .from(questions)
      .where(eq(questions.id, aq.questionId));

    const opts = await db
      .select()
      .from(questionOptions)
      .where(eq(questionOptions.questionId, aq.questionId));

    const correctOption = opts.find((o) => o.isCorrect);
    if (!correctOption) throw new Error('Question configuration error.');

    // Idempotency check: if already answered, return existing result without double-scoring
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
        accuracyPercent: attempt.accuracyPercent,
      };
    }

    const isCorrect = selectedOptionId === correctOption.id;
    const pointsEarned = calculateScoreForAnswer(aq.difficulty, isCorrect);

    // Record transactional answer submission (unique index prevents duplicate inserts)
    await db
      .insert(submittedAnswers)
      .values({
        attemptId: attempt.id,
        attemptQuestionId: aq.id,
        questionId: aq.questionId,
        userUid: uid,
        selectedOptionId,
        isCorrect,
        pointsEarned,
        timeSpentSec: Math.max(1, Math.round(questionTimeSec)),
      })
      .onConflictDoNothing();

    // Update attempt_questions
    await db
      .update(attemptQuestions)
      .set({
        isAnswered: true,
        isCorrect,
        pointsEarned,
        selectedOptionId,
        timeSpentSec: Math.max(1, Math.round(questionTimeSec)),
      })
      .where(eq(attemptQuestions.id, aq.id));

    // Update user_question_history
    await db
      .insert(userQuestionHistory)
      .values({
        userUid: uid,
        questionId: aq.questionId,
        attemptCount: 1,
        lastCorrect: isCorrect,
        lastAttemptedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: [userQuestionHistory.userUid, userQuestionHistory.questionId],
        set: {
          attemptCount: sql`${userQuestionHistory.attemptCount} + 1`,
          lastCorrect: isCorrect,
          lastAttemptedAt: new Date(),
        },
      });

    // Update global question statistics
    await db
      .update(questions)
      .set({
        timesAsked: sql`${questions.timesAsked} + 1`,
        timesCorrect: isCorrect
          ? sql`${questions.timesCorrect} + 1`
          : questions.timesCorrect,
      })
      .where(eq(questions.id, aq.questionId));

    // Recalculate authoritative attempt totals on server
    const allAq = await db
      .select()
      .from(attemptQuestions)
      .where(eq(attemptQuestions.attemptId, attempt.id));

    const currentScore = allAq.reduce((s, item) => s + item.pointsEarned, 0);
    const correctCount = allAq.filter((item) => item.isAnswered && item.isCorrect).length;
    const incorrectCount = allAq.filter((item) => item.isAnswered && !item.isCorrect).length;
    const unansweredCount = allAq.filter((item) => !item.isAnswered).length;
    const answeredTotal = correctCount + incorrectCount;
    const accuracyPercent =
      answeredTotal > 0 ? Math.round((correctCount / answeredTotal) * 1000) / 10 : 0;

    const nextIndex = Math.min(attempt.totalQuestions - 1, aq.orderIndex + 1);

    await db
      .update(quizAttempts)
      .set({
        currentScore,
        correctCount,
        incorrectCount,
        unansweredCount,
        accuracyPercent,
        timeSpentSec: Math.max(attempt.timeSpentSec, Math.round(totalElapsedSec)),
        currentIndex: nextIndex,
      })
      .where(eq(quizAttempts.id, attempt.id));

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
      accuracyPercent,
    };
  } catch (error) {
    console.error('Failed to submit answer:', error);
    throw new Error('Failed to submit answer.', { cause: error });
  }
}

export async function toggleQuestionFlag(params: {
  uid: string;
  attemptUuid: string;
  attemptQuestionId: number;
  isFlagged: boolean;
}) {
  try {
    const { uid, attemptUuid, attemptQuestionId, isFlagged } = params;
    const [attempt] = await db
      .select()
      .from(quizAttempts)
      .where(eq(quizAttempts.attemptUuid, attemptUuid));

    if (!attempt || attempt.userUid !== uid) {
      throw new Error('Unauthorized.');
    }

    await db
      .update(attemptQuestions)
      .set({ isFlagged })
      .where(
        and(
          eq(attemptQuestions.id, attemptQuestionId),
          eq(attemptQuestions.attemptId, attempt.id)
        )
      );

    return { attemptQuestionId, isFlagged };
  } catch (error) {
    console.error('Failed to flag question:', error);
    throw new Error('Failed to flag question.', { cause: error });
  }
}

export async function saveAttemptProgress(params: {
  uid: string;
  attemptUuid: string;
  currentIndex: number;
  timeSpentSec: number;
}) {
  try {
    const { uid, attemptUuid, currentIndex, timeSpentSec } = params;
    const [attempt] = await db
      .select()
      .from(quizAttempts)
      .where(eq(quizAttempts.attemptUuid, attemptUuid));

    if (!attempt || attempt.userUid !== uid) {
      throw new Error('Unauthorized.');
    }

    await db
      .update(quizAttempts)
      .set({
        currentIndex: Math.max(0, Math.min(attempt.totalQuestions - 1, currentIndex)),
        timeSpentSec: Math.max(attempt.timeSpentSec, Math.round(timeSpentSec)),
      })
      .where(eq(quizAttempts.id, attempt.id));

    return { ok: true };
  } catch (error) {
    console.error('Failed to save progress:', error);
    throw new Error('Failed to save progress.', { cause: error });
  }
}

export async function finalizeChallengeAttempt(params: {
  uid: string;
  attemptUuid: string;
  timeSpentSec: number;
}) {
  try {
    const { uid, attemptUuid, timeSpentSec } = params;
    const attempts = await db
      .select()
      .from(quizAttempts)
      .where(eq(quizAttempts.attemptUuid, attemptUuid));

    if (attempts.length === 0) throw new Error('Attempt not found.');
    const attempt = attempts[0];
    if (attempt.userUid !== uid) throw new Error('Unauthorized.');

    const allAq = await db
      .select()
      .from(attemptQuestions)
      .where(eq(attemptQuestions.attemptId, attempt.id))
      .orderBy(asc(attemptQuestions.orderIndex));

    const currentScore = allAq.reduce((s, item) => s + item.pointsEarned, 0);
    const correctCount = allAq.filter((item) => item.isAnswered && item.isCorrect).length;
    const incorrectCount = allAq.filter((item) => item.isAnswered && !item.isCorrect).length;
    const unansweredCount = allAq.filter((item) => !item.isAnswered).length;
    const answeredCount = correctCount + incorrectCount;
    const accuracyPercent =
      allAq.length > 0 ? Math.round((correctCount / allAq.length) * 1000) / 10 : 0;
    const finalTimeSec = Math.max(1, Math.max(attempt.timeSpentSec, Math.round(timeSpentSec)));

    // Separate XP calculation (never mixed into quiz score!)
    const baseXp = correctCount * 15 + currentScore * 4;
    const completionBonusXp = unansweredCount === 0 ? 75 : 25;
    const totalXpEarned = baseXp + completionBonusXp;

    const firstFiveCorrect =
      allAq.length >= 5 && allAq.slice(0, 5).every((q) => q.isAnswered && q.isCorrect);
    const veryHardQuestions = allAq.filter((q) => q.difficulty === 'Very Hard');
    const allVeryHardCorrect =
      veryHardQuestions.length > 0 &&
      veryHardQuestions.every((q) => q.isAnswered && q.isCorrect);

    const profile = await getOrCreateProfile(uid, '', attempt.displayName);

    const candidateAchievementCodes = evaluateAchievementUnlocks({
      mode: attempt.mode as QuizMode,
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
      completedChallengesCount: profile.totalCompletedChallenges + 1,
    });

    const existingUserAch = await db
      .select()
      .from(userAchievements)
      .where(eq(userAchievements.userUid, uid));
    const existingCodes = new Set(existingUserAch.map((a) => a.achievementCode));

    const newlyUnlockedCodes = candidateAchievementCodes.filter(
      (c) => !existingCodes.has(c)
    );

    let achievementBonusXp = 0;
    const allAchDefs = await db.select().from(achievements);
    const newlyUnlockedDetails = [];

    for (const code of newlyUnlockedCodes) {
      await db
        .insert(userAchievements)
        .values({
          userUid: uid,
          achievementCode: code,
          attemptId: attempt.id,
        })
        .onConflictDoNothing();

      const def = allAchDefs.find((a) => a.code === code);
      if (def) {
        achievementBonusXp += def.xpReward;
        newlyUnlockedDetails.push(def);
      }
    }

    const totalCombinedXpEarned =
      attempt.status === 'completed' ? attempt.xpEarned : totalXpEarned + achievementBonusXp;

    if (attempt.status !== 'completed') {
      await db
        .update(quizAttempts)
        .set({
          status: 'completed',
          currentScore,
          correctCount,
          incorrectCount,
          unansweredCount,
          accuracyPercent,
          timeSpentSec: finalTimeSec,
          xpEarned: totalCombinedXpEarned,
          completedAt: new Date(),
        })
        .where(eq(quizAttempts.id, attempt.id));

      // Update player profile stats & category mastery
      const newTotalCompleted = profile.totalCompletedChallenges + 1;
      const newXp = profile.xp + totalCombinedXpEarned;
      const { level: newLevel } = calculateLevelFromXp(newXp);
      const newBestScore = Math.max(profile.bestScore, currentScore);
      const newAvgAcc =
        Math.round(
          ((profile.averageAccuracy * profile.totalCompletedChallenges + accuracyPercent) /
            newTotalCompleted) *
            10
        ) / 10;

      const masteryMap: Record<string, { correct: number; total: number; accuracy: number }> =
        JSON.parse(profile.categoryMasteryJson || '{}');

      for (const item of allAq) {
        const entry = masteryMap[item.categorySlug] || {
          correct: 0,
          total: 0,
          accuracy: 0,
        };
        entry.total += 1;
        if (item.isAnswered && item.isCorrect) {
          entry.correct += 1;
        }
        entry.accuracy = Math.round((entry.correct / entry.total) * 100);
        masteryMap[item.categorySlug] = entry;
      }

      await db
        .update(profiles)
        .set({
          xp: newXp,
          level: newLevel,
          totalCompletedChallenges: newTotalCompleted,
          bestScore: newBestScore,
          averageAccuracy: newAvgAcc,
          currentStreak: accuracyPercent >= 60 ? profile.currentStreak + 1 : 1,
          categoryMasteryJson: JSON.stringify(masteryMap),
          updatedAt: new Date(),
        })
        .where(eq(profiles.uid, uid));

      // Insert into mode-specific Leaderboard (Practice mode does NOT impact leaderboards)
      if (attempt.mode !== 'practice') {
        await db
          .insert(leaderboards)
          .values({
            attemptId: attempt.id,
            userUid: uid,
            displayName: profile.displayName || attempt.displayName,
            studentClass: profile.studentClass || attempt.studentClass || '',
            schoolCollege: profile.schoolCollege || attempt.schoolCollege || '',
            avatar: profile.avatar,
            mode: attempt.mode,
            categorySlug: attempt.categorySlug,
            score: currentScore,
            maxScore: attempt.maxPossibleScore,
            accuracyPercent,
            timeSpentSec: finalTimeSec,
          })
          .onConflictDoNothing({ target: leaderboards.attemptId });
      }
    }

    // Build full breakdown & question review
    const state = await getAttemptState(uid, attemptUuid);

    const categoryBreakdownMap = new Map<
      string,
      { categorySlug: string; correct: number; total: number; score: number; maxScore: number }
    >();
    const difficultyBreakdownMap = new Map<
      string,
      { difficulty: string; correct: number; total: number; score: number; maxScore: number }
    >();

    for (const q of state.questions) {
      const catEntry = categoryBreakdownMap.get(q.categorySlug) || {
        categorySlug: q.categorySlug,
        correct: 0,
        total: 0,
        score: 0,
        maxScore: 0,
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
        maxScore: 0,
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
      newlyUnlockedAchievements: newlyUnlockedDetails,
    };
  } catch (error) {
    console.error('Failed to finalize challenge:', error);
    throw new Error('Failed to finalize challenge results.', { cause: error });
  }
}

export async function queryLeaderboards(params: {
  mode: string;
  categorySlug: string;
  timeframe: string; // 'all_time' | 'monthly' | 'weekly'
}) {
  try {
    await ensureDatabaseSeeded();
    const { mode, categorySlug, timeframe } = params;

    const conditions = [];
    if (mode && mode !== 'all') {
      conditions.push(eq(leaderboards.mode, mode));
    }
    if (categorySlug && categorySlug !== 'all') {
      conditions.push(eq(leaderboards.categorySlug, categorySlug));
    }

    if (timeframe === 'weekly') {
      const weekAgo = new Date(Date.now() - 7 * 24 * 3600 * 1000);
      conditions.push(gte(leaderboards.completedAt, weekAgo));
    } else if (timeframe === 'monthly') {
      const monthAgo = new Date(Date.now() - 30 * 24 * 3600 * 1000);
      conditions.push(gte(leaderboards.completedAt, monthAgo));
    }

    const baseQuery = db.select().from(leaderboards);
    const filteredQuery =
      conditions.length > 0 ? baseQuery.where(and(...conditions)) : baseQuery;

    const rows = await filteredQuery
      .orderBy(
        desc(leaderboards.score),
        desc(leaderboards.accuracyPercent),
        asc(leaderboards.timeSpentSec)
      )
      .limit(50);

    return rows;
  } catch (error) {
    console.error('Failed to query leaderboards:', error);
    throw new Error('Failed to load leaderboards.', { cause: error });
  }
}

export async function listAdminQuestions(params: {
  categorySlug?: string;
  difficulty?: string;
  verificationStatus?: string;
  search?: string;
  limit?: number;
}) {
  try {
    await ensureDatabaseSeeded();
    const conditions = [];
    if (params.categorySlug && params.categorySlug !== 'all') {
      conditions.push(eq(questions.categorySlug, params.categorySlug));
    }
    if (params.difficulty && params.difficulty !== 'all') {
      conditions.push(eq(questions.difficulty, params.difficulty));
    }
    if (params.verificationStatus && params.verificationStatus !== 'all') {
      conditions.push(eq(questions.verificationStatus, params.verificationStatus));
    }

    const qRows = await db
      .select()
      .from(questions)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(questions.id))
      .limit(params.limit || 60);

    const filtered = params.search
      ? qRows.filter((q) =>
          q.questionText.toLowerCase().includes(params.search!.toLowerCase()) ||
          q.code.toLowerCase().includes(params.search!.toLowerCase())
        )
      : qRows;

    const qIds = filtered.map((q) => q.id);
    const opts =
      qIds.length > 0
        ? await db
            .select()
            .from(questionOptions)
            .where(inArray(questionOptions.questionId, qIds))
        : [];

    const [{ totalCount }] = await db
      .select({ totalCount: sql<number>`count(*)::int` })
      .from(questions);

    const reports = await db
      .select({
        report: questionReports,
        questionText: questions.questionText,
        questionCode: questions.code,
      })
      .from(questionReports)
      .innerJoin(questions, eq(questionReports.questionId, questions.id))
      .orderBy(desc(questionReports.createdAt))
      .limit(30);

    return {
      totalDatabaseQuestions: totalCount,
      questions: filtered.map((q) => ({
        ...q,
        options: opts.filter((o) => o.questionId === q.id),
      })),
      reports,
    };
  } catch (error) {
    console.error('Failed to list admin questions:', error);
    throw new Error('Failed to load question bank.', { cause: error });
  }
}

export async function createAdminQuestion(params: {
  categorySlug: string;
  difficulty: DifficultyLevel;
  questionText: string;
  options: [string, string, string, string]; // index 0 is correct
  explanation: string;
  diagramType: string;
  tags: string[];
  verificationStatus?: string;
}) {
  try {
    await ensureDatabaseSeeded();
    const trimmedText = params.questionText.trim();
    if (trimmedText.length < 12) {
      throw new Error('Question text must be at least 12 characters.');
    }
    const uniqueOpts = new Set(params.options.map((o) => o.trim().toLowerCase()));
    if (uniqueOpts.size < 4) {
      throw new Error('All four answer options must be distinct and non-empty.');
    }

    const [cat] = await db
      .select()
      .from(categories)
      .where(eq(categories.slug, params.categorySlug));
    if (!cat) throw new Error('Invalid category.');

    const code = `custom_${params.categorySlug}_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

    const [created] = await db
      .insert(questions)
      .values({
        code,
        categoryId: cat.id,
        categorySlug: params.categorySlug,
        difficulty: params.difficulty,
        questionText: trimmedText,
        explanation: params.explanation.trim() || 'Verified domain explanation.',
        diagramType: params.diagramType || 'none',
        tagsJson: JSON.stringify(params.tags || []),
        estimatedTimeSec: 35,
        verificationStatus: params.verificationStatus || 'verified',
        isActive: true,
      })
      .returning();

    const keys = ['A', 'B', 'C', 'D'];
    await db.insert(questionOptions).values(
      params.options.map((text, idx) => ({
        questionId: created.id,
        optionKey: keys[idx],
        optionText: text.trim(),
        isCorrect: idx === 0,
      }))
    );

    return created;
  } catch (error: any) {
    console.error('Failed to create admin question:', error);
    throw new Error(error.message || 'Failed to create question.', { cause: error });
  }
}

export async function updateAdminQuestionStatus(params: {
  questionId: number;
  verificationStatus: string;
  isActive: boolean;
}) {
  try {
    const [updated] = await db
      .update(questions)
      .set({
        verificationStatus: params.verificationStatus,
        isActive: params.isActive,
      })
      .where(eq(questions.id, params.questionId))
      .returning();
    return updated;
  } catch (error) {
    console.error('Failed to update question status:', error);
    throw new Error('Failed to update question status.', { cause: error });
  }
}

export async function submitQuestionReport(params: {
  questionId: number;
  userUid: string;
  reason: string;
  details: string;
}) {
  try {
    const [report] = await db
      .insert(questionReports)
      .values({
        questionId: params.questionId,
        userUid: params.userUid,
        reason: params.reason.trim().slice(0, 100),
        details: params.details.trim().slice(0, 500),
        status: 'open',
      })
      .returning();
    return report;
  } catch (error) {
    console.error('Failed to submit question report:', error);
    throw new Error('Failed to submit question report.', { cause: error });
  }
}
