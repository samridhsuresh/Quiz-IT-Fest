import crypto from 'node:crypto';

export type DifficultyLevel = 'Easy' | 'Normal' | 'Hard' | 'Very Hard';
export type QuizMode = 'full_arena' | 'category' | 'quick' | 'boss_rush' | 'practice';
export type CategorySlug = 'computers' | 'cars' | 'motorcycles' | 'traveling' | 'programming';

export const DIFFICULTY_ORDER: DifficultyLevel[] = ['Easy', 'Normal', 'Hard', 'Very Hard'];
export const CATEGORY_SLUGS: CategorySlug[] = [
  'computers',
  'cars',
  'motorcycles',
  'traveling',
  'programming',
];

export const DIFFICULTY_POINTS: Record<DifficultyLevel, number> = {
  'Easy': 1,
  'Normal': 2,
  'Hard': 3,
  'Very Hard': 5,
};

export function normalizeDifficultyKey(difficulty: string): DifficultyLevel | string {
  const lower = String(difficulty || '').trim().toLowerCase();
  if (lower === 'extrahard' || lower === 'extra hard' || lower === 'very hard') {
    return 'Very Hard';
  }
  return difficulty;
}

export function formatDifficultyLabel(difficulty: string): string {
  if (difficulty === 'Very Hard' || difficulty === 'ExtraHard' || difficulty === 'Extra Hard') {
    return 'ExtraHard';
  }
  return difficulty;
}

export function getPointsForDifficulty(difficulty: string): number {
  const norm = normalizeDifficultyKey(difficulty);
  return DIFFICULTY_POINTS[norm as DifficultyLevel] ?? 1;
}

export function calculateScoreForAnswer(difficulty: string, isCorrect: boolean): number {
  if (!isCorrect) return 0;
  return getPointsForDifficulty(difficulty);
}

export function calculateMaxPossibleScore(questionsList: Array<{ difficulty: string }>): number {
  return questionsList.reduce((acc, q) => acc + getPointsForDifficulty(q.difficulty), 0);
}

export function calculateLevelFromXp(xp: number): {
  level: number;
  currentLevelXp: number;
  nextLevelXp: number;
  progressPercent: number;
} {
  const safeXp = Math.max(0, Math.floor(xp));
  // Every level requires 250 * level XP
  let level = 1;
  let remaining = safeXp;
  while (remaining >= level * 250) {
    remaining -= level * 250;
    level++;
  }
  const nextLevelXp = level * 250;
  const progressPercent = Math.min(100, Math.round((remaining / nextLevelXp) * 100));
  return {
    level,
    currentLevelXp: remaining,
    nextLevelXp,
    progressPercent,
  };
}

/**
 * Cryptographically strong Fisher-Yates shuffle
 */
export function secureShuffle<T>(items: readonly T[]): T[] {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = crypto.randomInt(0, i + 1);
    const tmp = arr[i];
    arr[i] = arr[j];
    arr[j] = tmp;
  }
  return arr;
}

export interface CandidateQuestion {
  id: number;
  code: string;
  categorySlug: string;
  difficulty: DifficultyLevel;
}

export interface QuestionHistoryRecord {
  questionId: number;
  attemptCount: number;
  lastAttemptedAt: Date | string | number;
}

/**
 * Selects `count` unique questions from `pool`, prioritizing unseen questions first,
 * and falling back to least-recently-attempted questions if unseen questions are insufficient.
 */
export function selectQuestionsWithHistory<T extends CandidateQuestion>(
  pool: readonly T[],
  count: number,
  historyMap: ReadonlyMap<number, QuestionHistoryRecord>
): { selected: T[]; repeatedAny: boolean } {
  const unseen: T[] = [];
  const seen: T[] = [];

  for (const q of pool) {
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
      repeatedAny: false,
    };
  }

  // Need some seen questions: sort by attemptCount ASC, then oldest lastAttemptedAt ASC
  const sortedSeen = [...seen].sort((a, b) => {
    const ha = historyMap.get(a.id)!;
    const hb = historyMap.get(b.id)!;
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
    repeatedAny: chosenSeen.length > 0,
  };
}

/**
 * Builds a complete, balanced, non-duplicate question set according to the quiz mode.
 * - full_arena: 5 categories × 4 difficulties × 5 questions = 100 questions (275 max points)
 * - category: 1 category × 4 difficulties × 5 questions = 20 questions (55 max points)
 * - quick: 10 questions across mixed categories & difficulties
 * - boss_rush: 20 Very Hard questions (4 per category) = 100 max points
 * - practice: 10 questions of selected category & difficulty
 */
export function buildChallengeSelection<T extends CandidateQuestion>(
  allQuestions: readonly T[],
  mode: QuizMode,
  categorySlug: string,
  practiceDifficulty: string,
  historyMap: ReadonlyMap<number, QuestionHistoryRecord>
): { selected: T[]; repeatNotice: boolean; maxPossibleScore: number } {
  const usedIds = new Set<number>();
  const finalSelection: T[] = [];
  let repeatNotice = false;

  const pickFromPool = (pool: T[], count: number): T[] => {
    const dedupedPool = pool.filter((q) => !usedIds.has(q.id));
    const { selected, repeatedAny } = selectQuestionsWithHistory(dedupedPool, count, historyMap);
    if (repeatedAny) repeatNotice = true;
    for (const q of selected) {
      usedIds.add(q.id);
    }
    return selected;
  };

  const normalizedPracticeDiff = normalizeDifficultyKey(practiceDifficulty);

  if (mode === 'full_arena') {
    for (const diff of DIFFICULTY_ORDER) {
      const diffBatch: T[] = [];
      for (const cat of CATEGORY_SLUGS) {
        const pool = allQuestions.filter(
          (q) => q.categorySlug === cat && q.difficulty === diff
        );
        diffBatch.push(...pickFromPool(pool, 5));
      }
      // Shuffle within each difficulty tier
      finalSelection.push(...secureShuffle(diffBatch));
    }
  } else if (mode === 'category') {
    const targetCat = CATEGORY_SLUGS.includes(categorySlug as CategorySlug)
      ? categorySlug
      : 'computers';
    if (DIFFICULTY_ORDER.includes(normalizedPracticeDiff as DifficultyLevel)) {
      const pool = allQuestions.filter(
        (q) =>
          q.categorySlug === targetCat &&
          q.difficulty === (normalizedPracticeDiff as DifficultyLevel)
      );
      const picked = pickFromPool(pool, 20);
      finalSelection.push(...secureShuffle(picked));
    } else {
      for (const diff of DIFFICULTY_ORDER) {
        const pool = allQuestions.filter(
          (q) => q.categorySlug === targetCat && q.difficulty === diff
        );
        const picked = pickFromPool(pool, 5);
        finalSelection.push(...secureShuffle(picked));
      }
    }
  } else if (mode === 'boss_rush') {
    const bossBatch: T[] = [];
    for (const cat of CATEGORY_SLUGS) {
      const pool = allQuestions.filter(
        (q) => q.categorySlug === cat && q.difficulty === 'Very Hard'
      );
      bossBatch.push(...pickFromPool(pool, 4));
    }
    finalSelection.push(...secureShuffle(bossBatch));
  } else if (mode === 'quick') {
    // 10 randomized questions: 3 Easy, 3 Normal, 2 Hard, 2 Very Hard across all categories (23 pts)
    const quickCounts: Array<[DifficultyLevel, number]> = [
      ['Easy', 3],
      ['Normal', 3],
      ['Hard', 2],
      ['Very Hard', 2],
    ];
    for (const [diff, cnt] of quickCounts) {
      const pool = allQuestions.filter(
        (q) =>
          (categorySlug === 'all' || q.categorySlug === categorySlug) &&
          q.difficulty === diff
      );
      finalSelection.push(...pickFromPool(pool, cnt));
    }
  } else {
    // practice mode
    const pool = allQuestions.filter((q) => {
      const catMatch = categorySlug === 'all' || q.categorySlug === categorySlug;
      const diffMatch =
        normalizedPracticeDiff === 'all' || q.difficulty === normalizedPracticeDiff;
      return catMatch && diffMatch;
    });
    finalSelection.push(...pickFromPool(pool, 10));
  }

  return {
    selected: finalSelection,
    repeatNotice,
    maxPossibleScore: calculateMaxPossibleScore(finalSelection),
  };
}

export interface RawOptionInput {
  id: number;
  optionText: string;
  isCorrect: boolean;
}

export interface ClientSafeOption {
  optionId: number;
  label: 'A' | 'B' | 'C' | 'D';
  text: string;
}

/**
 * Independently shuffles the 4 options for a question and strips `isCorrect` so the client
 * never receives the answer key before submission.
 */
export function shuffleAndSanitizeOptions(
  options: readonly RawOptionInput[]
): ClientSafeOption[] {
  const labels: Array<'A' | 'B' | 'C' | 'D'> = ['A', 'B', 'C', 'D'];
  const shuffled = secureShuffle(options);
  return shuffled.slice(0, 4).map((opt, idx) => ({
    optionId: opt.id,
    label: labels[idx] || 'A',
    text: opt.optionText,
  }));
}

export interface AttemptEvaluationInput {
  mode: QuizMode;
  categorySlug: string;
  totalQuestions: number;
  answeredCount: number;
  correctCount: number;
  currentScore: number;
  maxPossibleScore: number;
  accuracyPercent: number;
  firstFiveCorrect: boolean;
  allVeryHardCorrect: boolean;
  veryHardTotalCount: number;
  completedChallengesCount: number;
}

/**
 * Evaluates server-side achievement unlock criteria.
 */
export function evaluateAchievementUnlocks(input: AttemptEvaluationInput): string[] {
  const unlocked: string[] = [];

  if (input.answeredCount > 0) {
    unlocked.push('first_blood');
  }

  if (input.firstFiveCorrect) {
    unlocked.push('perfect_start');
  }

  if (input.accuracyPercent >= 90 && input.answeredCount >= 10) {
    if (input.categorySlug === 'computers') unlocked.push('computer_wizard');
    if (input.categorySlug === 'cars') unlocked.push('apex_gearhead');
    if (input.categorySlug === 'motorcycles') unlocked.push('motorcycle_master');
    if (input.categorySlug === 'traveling') unlocked.push('global_navigator');
    if (input.categorySlug === 'programming') unlocked.push('polyglot_programmer');
  }

  if (input.mode === 'full_arena' && input.answeredCount >= 100) {
    unlocked.push('arena_champion');
    if (input.correctCount === 100 && input.currentScore === 275) {
      unlocked.push('flawless_victory');
    }
    if (input.veryHardTotalCount >= 25 && input.allVeryHardCorrect) {
      unlocked.push('final_boss_slayer');
    }
  }

  if (input.mode === 'boss_rush' && input.veryHardTotalCount >= 20 && input.allVeryHardCorrect) {
    unlocked.push('final_boss_slayer');
  }

  return Array.from(new Set(unlocked));
}
