import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateScoreForAnswer,
  calculateMaxPossibleScore,
  buildChallengeSelection,
  shuffleAndSanitizeOptions,
  evaluateAchievementUnlocks,
  calculateLevelFromXp,
  normalizeDifficultyKey,
  formatDifficultyLabel,
  CATEGORY_SLUGS,
  DIFFICULTY_ORDER,
  type CandidateQuestion,
  type QuestionHistoryRecord,
} from './quizLogic';
import { ALL_SEED_QUESTIONS } from '../db/questionBank';

test('normalizeDifficultyKey and formatDifficultyLabel map ExtraHard <-> Very Hard cleanly', () => {
  assert.equal(normalizeDifficultyKey('ExtraHard'), 'Very Hard');
  assert.equal(normalizeDifficultyKey('extra hard'), 'Very Hard');
  assert.equal(normalizeDifficultyKey('Easy'), 'Easy');
  assert.equal(formatDifficultyLabel('Very Hard'), 'ExtraHard');
  assert.equal(formatDifficultyLabel('Easy'), 'Easy');
});

test('Actual ALL_SEED_QUESTIONS bank contains 1,000 fact-checked questions (50 per difficulty across 5 categories) with 4 distinct options each', () => {
  assert.equal(ALL_SEED_QUESTIONS.length, 1000);
  const codes = new Set(ALL_SEED_QUESTIONS.map((q) => q.code));
  assert.equal(codes.size, 1000, 'Every question code must be unique');

  for (const cat of CATEGORY_SLUGS) {
    for (const diff of DIFFICULTY_ORDER) {
      const subset = ALL_SEED_QUESTIONS.filter(
        (q) => q.categorySlug === cat && q.difficulty === diff
      );
      assert.equal(
        subset.length,
        50,
        `Expected 50 questions for ${cat} / ${diff}, found ${subset.length}`
      );
      for (const q of subset) {
        assert.ok(q.questionText.length > 15, `Question text too short: ${q.code}`);
        assert.equal(q.options.length, 4, `Must have 4 options: ${q.code}`);
        const uniqueOpts = new Set(q.options);
        assert.equal(uniqueOpts.size, 4, `Options must be distinct in ${q.code}`);
        assert.ok(q.explanation.length > 20, `Explanation required in ${q.code}`);
      }
    }
  }
});

function createMockQuestionBank(): CandidateQuestion[] {
  const bank: CandidateQuestion[] = [];
  let id = 1;
  for (const cat of CATEGORY_SLUGS) {
    for (const diff of DIFFICULTY_ORDER) {
      for (let i = 1; i <= 50; i++) {
        bank.push({
          id: id++,
          code: `${cat}_${diff}_${i}`,
          categorySlug: cat,
          difficulty: diff,
        });
      }
    }
  }
  return bank;
}

test('Question bank distribution totals 1,000 questions across 5 categories and 4 difficulties', () => {
  const bank = createMockQuestionBank();
  assert.equal(bank.length, 1000);
});

test('Scoring assigns +1 Easy, +2 Normal, +3 Hard, +5 Very Hard, and 0 for wrong answers', () => {
  assert.equal(calculateScoreForAnswer('Easy', true), 1);
  assert.equal(calculateScoreForAnswer('Normal', true), 2);
  assert.equal(calculateScoreForAnswer('Hard', true), 3);
  assert.equal(calculateScoreForAnswer('Very Hard', true), 5);
  assert.equal(calculateScoreForAnswer('Easy', false), 0);
  assert.equal(calculateScoreForAnswer('Very Hard', false), 0);
});

test('Full Arena 100-question challenge has exact maximum score of 275 points and zero duplicates', () => {
  const bank = createMockQuestionBank();
  const emptyHistory = new Map<number, QuestionHistoryRecord>();
  const { selected, repeatNotice, maxPossibleScore } = buildChallengeSelection(
    bank,
    'full_arena',
    'all',
    'all',
    emptyHistory
  );

  assert.equal(selected.length, 100);
  assert.equal(maxPossibleScore, 275);
  assert.equal(repeatNotice, false);

  const uniqueIds = new Set(selected.map((q) => q.id));
  assert.equal(uniqueIds.size, 100, 'Every question in a 100-question challenge must be unique');

  // Verify 25 per difficulty and 20 per category
  for (const diff of DIFFICULTY_ORDER) {
    const count = selected.filter((q) => q.difficulty === diff).length;
    assert.equal(count, 25);
  }
  for (const cat of CATEGORY_SLUGS) {
    const count = selected.filter((q) => q.categorySlug === cat).length;
    assert.equal(count, 20);
  }
});

test('Category Challenge selects 20 questions with exact maximum score of 55 points', () => {
  const bank = createMockQuestionBank();
  const emptyHistory = new Map<number, QuestionHistoryRecord>();
  const { selected, maxPossibleScore } = buildChallengeSelection(
    bank,
    'category',
    'motorcycles',
    'all',
    emptyHistory
  );

  assert.equal(selected.length, 20);
  assert.equal(maxPossibleScore, 55);
  assert.ok(selected.every((q) => q.categorySlug === 'motorcycles'));
});

test('Category Challenge with specific chosen difficulty selects 20 questions of that mood difficulty', () => {
  const bank = createMockQuestionBank();
  const emptyHistory = new Map<number, QuestionHistoryRecord>();

  const easyRun = buildChallengeSelection(bank, 'category', 'computers', 'Easy', emptyHistory);
  assert.equal(easyRun.selected.length, 20);
  assert.equal(easyRun.maxPossibleScore, 20);
  assert.ok(
    easyRun.selected.every((q) => q.categorySlug === 'computers' && q.difficulty === 'Easy')
  );

  const maroonRun = buildChallengeSelection(
    bank,
    'category',
    'programming',
    'Very Hard',
    emptyHistory
  );
  assert.equal(maroonRun.selected.length, 20);
  assert.equal(maroonRun.maxPossibleScore, 100);
  assert.ok(
    maroonRun.selected.every(
      (q) => q.categorySlug === 'programming' && q.difficulty === 'Very Hard'
    )
  );
});

test('Boss Rush selects 20 Very Hard questions with exact maximum score of 100 points', () => {
  const bank = createMockQuestionBank();
  const emptyHistory = new Map<number, QuestionHistoryRecord>();
  const { selected, maxPossibleScore } = buildChallengeSelection(
    bank,
    'boss_rush',
    'all',
    'all',
    emptyHistory
  );

  assert.equal(selected.length, 20);
  assert.equal(maxPossibleScore, 100);
  assert.ok(selected.every((q) => q.difficulty === 'Very Hard'));
});

test('Randomization avoids previously completed questions when unseen questions exist', () => {
  const bank = createMockQuestionBank();
  const historyMap = new Map<number, QuestionHistoryRecord>();
  // Mark first 45 Easy Computers questions as seen
  const easyComputers = bank.filter(
    (q) => q.categorySlug === 'computers' && q.difficulty === 'Easy'
  );
  for (let i = 0; i < 45; i++) {
    historyMap.set(easyComputers[i].id, {
      questionId: easyComputers[i].id,
      attemptCount: 2,
      lastAttemptedAt: Date.now() - 10000,
    });
  }

  const { selected, repeatNotice } = buildChallengeSelection(
    bank,
    'category',
    'computers',
    'all',
    historyMap
  );

  const selectedEasyIds = selected
    .filter((q) => q.difficulty === 'Easy')
    .map((q) => q.id);
  const unseenEasyIds = new Set(easyComputers.slice(45).map((q) => q.id));

  assert.equal(repeatNotice, false);
  for (const id of selectedEasyIds) {
    assert.ok(unseenEasyIds.has(id), 'Should only pick the 5 remaining unseen questions');
  }
});

test('Option shuffling strips isCorrect and assigns A/B/C/D labels', () => {
  const rawOptions = [
    { id: 101, optionText: 'Option 1', isCorrect: true },
    { id: 102, optionText: 'Option 2', isCorrect: false },
    { id: 103, optionText: 'Option 3', isCorrect: false },
    { id: 104, optionText: 'Option 4', isCorrect: false },
  ];

  const sanitized = shuffleAndSanitizeOptions(rawOptions);
  assert.equal(sanitized.length, 4);
  assert.deepEqual(
    sanitized.map((o) => o.label),
    ['A', 'B', 'C', 'D']
  );
  for (const opt of sanitized) {
    assert.equal('isCorrect' in opt, false, 'isCorrect must never be exposed to client');
  }
});

test('Server-side achievement evaluation unlocks expected badges', () => {
  const unlocked = evaluateAchievementUnlocks({
    mode: 'full_arena',
    categorySlug: 'all',
    totalQuestions: 100,
    answeredCount: 100,
    correctCount: 100,
    currentScore: 275,
    maxPossibleScore: 275,
    accuracyPercent: 100,
    firstFiveCorrect: true,
    allVeryHardCorrect: true,
    veryHardTotalCount: 25,
    completedChallengesCount: 1,
  });

  assert.ok(unlocked.includes('first_blood'));
  assert.ok(unlocked.includes('perfect_start'));
  assert.ok(unlocked.includes('arena_champion'));
  assert.ok(unlocked.includes('flawless_victory'));
  assert.ok(unlocked.includes('final_boss_slayer'));
});

test('XP to Player Level calculation scales smoothly', () => {
  const lvl1 = calculateLevelFromXp(100);
  assert.equal(lvl1.level, 1);
  assert.equal(lvl1.currentLevelXp, 100);
  assert.equal(lvl1.nextLevelXp, 250);

  const lvl2 = calculateLevelFromXp(250);
  assert.equal(lvl2.level, 2);
});
