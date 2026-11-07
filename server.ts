import express from 'express';
import path from 'node:path';
import { createServer as createViteServer } from 'vite';
import * as dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';
import { resolveActor, type AuthRequest } from './src/middleware/auth.ts';
import {
  createAdminQuestion,
  finalizeChallengeAttempt,
  getAttemptState,
  getDashboardOverview,
  listAdminQuestions,
  queryLeaderboards,
  saveAttemptProgress,
  startNewChallenge,
  submitQuestionAnswer,
  submitQuestionReport,
  toggleQuestionFlag,
  transferGuestToAccount,
  updateAdminQuestionStatus,
  updateProfileIdentity,
} from './src/db/repository.ts';
import type { DifficultyLevel, QuizMode } from './src/utils/quizLogic.ts';

dotenv.config();

const app = express();
app.use(express.json({ limit: '1mb' }));

// Simple server-side rate limiting against automated scraping/cheating
const rateWindowMap = new Map<string, { count: number; resetAt: number }>();
app.use('/api', (req, res, next) => {
  const key = req.ip || 'local';
  const now = Date.now();
  const entry = rateWindowMap.get(key);
  if (!entry || now > entry.resetAt) {
    rateWindowMap.set(key, { count: 1, resetAt: now + 60_000 });
    return next();
  }
  entry.count += 1;
  if (entry.count > 240) {
    return res.status(429).json({ error: 'Rate limit exceeded. Please wait a moment.' });
  }
  next();
});

app.get('/api/overview', resolveActor, async (req: AuthRequest, res) => {
  try {
    const overview = await getDashboardOverview(
      req.actorUid!,
      req.actorEmail || '',
      req.actorName || 'Student Challenger',
      req.actorClass || '',
      req.actorSchool || ''
    );
    res.json(overview);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to load overview.' });
  }
});

app.post('/api/student/login', resolveActor, async (req: AuthRequest, res) => {
  try {
    const { displayName, studentClass, schoolCollege, avatar } = req.body || {};
    const cleanName = String(displayName || '').trim();
    const cleanClass = String(studentClass || '').trim();
    const cleanSchool = String(schoolCollege || '').trim();
    if (!cleanName || !cleanClass || !cleanSchool) {
      return res.status(400).json({
        error: 'Please enter your Student Name, Class, and School/College.',
      });
    }
    const updated = await updateProfileIdentity(
      req.actorUid!,
      cleanName,
      String(avatar || 'shield-cyan'),
      cleanClass,
      cleanSchool
    );
    res.json({ profile: updated });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to save student login.' });
  }
});

app.put('/api/profile', resolveActor, async (req: AuthRequest, res) => {
  try {
    const { displayName, avatar, studentClass, schoolCollege } = req.body || {};
    const updated = await updateProfileIdentity(
      req.actorUid!,
      String(displayName || req.actorName || 'Student Challenger'),
      String(avatar || 'shield-cyan'),
      studentClass !== undefined ? String(studentClass) : req.actorClass,
      schoolCollege !== undefined ? String(schoolCollege) : req.actorSchool
    );
    res.json({ profile: updated });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to update profile.' });
  }
});

app.post('/api/auth/transfer-guest', resolveActor, async (req: AuthRequest, res) => {
  try {
    const { guestUid } = req.body || {};
    if (req.isGuest || !req.user) {
      return res.status(400).json({ error: 'Sign in with Google first to transfer guest progress.' });
    }
    const merged = await transferGuestToAccount(
      String(guestUid || ''),
      req.actorUid!,
      req.actorEmail || '',
      req.actorName || 'Student Challenger',
      req.actorClass || '',
      req.actorSchool || ''
    );
    res.json({ profile: merged });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to transfer guest progress.' });
  }
});

app.post('/api/challenges/start', resolveActor, async (req: AuthRequest, res) => {
  try {
    const { mode, categorySlug, practiceDifficulty } = req.body || {};
    const validModes: QuizMode[] = ['full_arena', 'category', 'quick', 'boss_rush', 'practice'];
    const chosenMode: QuizMode = validModes.includes(mode) ? mode : 'category';
    const state = await startNewChallenge({
      uid: req.actorUid!,
      displayName: req.actorName || 'Student Challenger',
      studentClass: req.actorClass || '',
      schoolCollege: req.actorSchool || '',
      mode: chosenMode,
      categorySlug: String(categorySlug || 'computers'),
      practiceDifficulty: String(practiceDifficulty || 'all'),
    });
    res.json(state);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to start challenge.' });
  }
});

app.get('/api/challenges/:attemptUuid', resolveActor, async (req: AuthRequest, res) => {
  try {
    const state = await getAttemptState(req.actorUid!, String(req.params.attemptUuid));
    res.json(state);
  } catch (error: any) {
    res.status(404).json({ error: error.message || 'Challenge not found.' });
  }
});

app.post('/api/challenges/:attemptUuid/answer', resolveActor, async (req: AuthRequest, res) => {
  try {
    const { attemptQuestionId, selectedOptionId, questionTimeSec, totalElapsedSec } = req.body || {};
    const result = await submitQuestionAnswer({
      uid: req.actorUid!,
      attemptUuid: String(req.params.attemptUuid),
      attemptQuestionId: Number(attemptQuestionId),
      selectedOptionId: Number(selectedOptionId),
      questionTimeSec: Number(questionTimeSec || 5),
      totalElapsedSec: Number(totalElapsedSec || 5),
    });
    res.json(result);
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Failed to submit answer.' });
  }
});

app.post('/api/challenges/:attemptUuid/flag', resolveActor, async (req: AuthRequest, res) => {
  try {
    const { attemptQuestionId, isFlagged } = req.body || {};
    const result = await toggleQuestionFlag({
      uid: req.actorUid!,
      attemptUuid: String(req.params.attemptUuid),
      attemptQuestionId: Number(attemptQuestionId),
      isFlagged: Boolean(isFlagged),
    });
    res.json(result);
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Failed to update flag.' });
  }
});

app.post('/api/challenges/:attemptUuid/progress', resolveActor, async (req: AuthRequest, res) => {
  try {
    const { currentIndex, timeSpentSec } = req.body || {};
    const result = await saveAttemptProgress({
      uid: req.actorUid!,
      attemptUuid: String(req.params.attemptUuid),
      currentIndex: Number(currentIndex || 0),
      timeSpentSec: Number(timeSpentSec || 0),
    });
    res.json(result);
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Failed to save progress.' });
  }
});

app.post('/api/challenges/:attemptUuid/complete', resolveActor, async (req: AuthRequest, res) => {
  try {
    const { timeSpentSec } = req.body || {};
    const result = await finalizeChallengeAttempt({
      uid: req.actorUid!,
      attemptUuid: String(req.params.attemptUuid),
      timeSpentSec: Number(timeSpentSec || 10),
    });
    res.json(result);
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Failed to complete challenge.' });
  }
});

app.get('/api/leaderboards', async (req, res) => {
  try {
    const mode = String(req.query.mode || 'full_arena');
    const categorySlug = String(req.query.categorySlug || 'all');
    const timeframe = String(req.query.timeframe || 'all_time');
    const entries = await queryLeaderboards({ mode, categorySlug, timeframe });
    res.json({ entries });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to load leaderboards.' });
  }
});

app.post('/api/questions/report', resolveActor, async (req: AuthRequest, res) => {
  try {
    const { questionId, reason, details } = req.body || {};
    const report = await submitQuestionReport({
      questionId: Number(questionId),
      userUid: req.actorUid!,
      reason: String(reason || 'Accuracy review'),
      details: String(details || ''),
    });
    res.json({ report });
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Failed to submit report.' });
  }
});

app.get('/api/admin/questions', resolveActor, async (req: AuthRequest, res) => {
  try {
    const data = await listAdminQuestions({
      categorySlug: String(req.query.categorySlug || 'all'),
      difficulty: String(req.query.difficulty || 'all'),
      verificationStatus: String(req.query.verificationStatus || 'all'),
      search: String(req.query.search || ''),
      limit: Number(req.query.limit || 60),
    });
    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to load admin questions.' });
  }
});

app.post('/api/admin/questions', resolveActor, async (req: AuthRequest, res) => {
  try {
    const {
      categorySlug,
      difficulty,
      questionText,
      options,
      explanation,
      diagramType,
      tags,
      verificationStatus,
    } = req.body || {};
    const created = await createAdminQuestion({
      categorySlug: String(categorySlug || 'computers'),
      difficulty: (difficulty as DifficultyLevel) || 'Normal',
      questionText: String(questionText || ''),
      options: options as [string, string, string, string],
      explanation: String(explanation || ''),
      diagramType: String(diagramType || 'none'),
      tags: Array.isArray(tags) ? tags : [],
      verificationStatus: String(verificationStatus || 'verified'),
    });
    res.json({ question: created });
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Failed to create question.' });
  }
});

app.patch('/api/admin/questions/:id', resolveActor, async (req: AuthRequest, res) => {
  try {
    const { verificationStatus, isActive } = req.body || {};
    const updated = await updateAdminQuestionStatus({
      questionId: Number(req.params.id),
      verificationStatus: String(verificationStatus || 'verified'),
      isActive: Boolean(isActive),
    });
    res.json({ question: updated });
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Failed to update question.' });
  }
});

app.post('/api/admin/generate-ai-questions', resolveActor, async (req: AuthRequest, res) => {
  try {
    const { categorySlug = 'computers', difficulty = 'Hard', topic = '' } = req.body || {};
    if (!process.env.GEMINI_API_KEY) {
      return res.status(503).json({
        error: 'GEMINI_API_KEY is not configured in Settings > Secrets.',
      });
    }

    const ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });

    const prompt = `Generate 2 rigorous, fact-checked multiple-choice quiz questions for category "${categorySlug}" at "${difficulty}" difficulty${topic ? ` focusing on "${topic}"` : ''}.
Provide 1 exact correct answer and 3 plausible but unambiguously wrong distractors, plus a thorough technical explanation.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        systemInstruction:
          'You are a technical subject-matter expert creating fact-checked engineering, computing, automotive, motorcycle, geography, and programming questions. Return valid JSON matching the schema.',
        responseMimeType: 'application/json',
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
              explanation: { type: Type.STRING },
            },
            required: [
              'questionText',
              'correctOption',
              'wrongOption1',
              'wrongOption2',
              'wrongOption3',
              'explanation',
            ],
          },
        },
      },
    });

    const parsed = JSON.parse((response.text ?? '[]').trim());
    const savedCandidates = [];
    for (const item of parsed) {
      const created = await createAdminQuestion({
        categorySlug: String(categorySlug),
        difficulty: difficulty as DifficultyLevel,
        questionText: item.questionText,
        options: [
          item.correctOption,
          item.wrongOption1,
          item.wrongOption2,
          item.wrongOption3,
        ],
        explanation: item.explanation,
        diagramType: 'none',
        tags: ['ai-candidate', String(categorySlug)],
        verificationStatus: 'pending_review', // Must be reviewed by admin before publication!
      });
      savedCandidates.push(created);
    }

    res.json({ candidates: savedCandidates });
  } catch (error: any) {
    console.error('AI candidate generation failed:', error);
    res.status(500).json({
      error: error.message || 'Failed to generate candidate questions via Gemini API.',
    });
  }
});

async function startServer() {
  const PORT = 3000;
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Knowledge Arena server running on http://localhost:${PORT}`);
  });
}

startServer();
