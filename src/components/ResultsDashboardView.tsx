import React, { useState, useEffect } from 'react';
import {
  Award,
  CheckCircle2,
  Clock,
  Copy,
  Home,
  RotateCcw,
  Share2,
  Sparkles,
  Target,
  Trophy,
  XCircle,
} from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import confetti from 'canvas-confetti';
import type { ClientQuizQuestion, QuizAttemptRecord } from './QuizArenaView.tsx';
import { soundFX } from '../utils/soundEffects.ts';

export interface ResultsPayload {
  attempt: QuizAttemptRecord;
  questions: ClientQuizQuestion[];
  categoryBreakdown: Array<{
    categorySlug: string;
    correct: number;
    total: number;
    score: number;
    maxScore: number;
  }>;
  difficultyBreakdown: Array<{
    difficulty: string;
    correct: number;
    total: number;
    score: number;
    maxScore: number;
  }>;
  xpEarned: number;
  newlyUnlockedAchievements: Array<{
    code: string;
    title: string;
    description: string;
    xpReward: number;
  }>;
}

interface ResultsDashboardViewProps {
  results: ResultsPayload;
  onRetryFreshChallenge: () => void;
  onReturnHome: () => void;
  onViewLeaderboards: () => void;
}

export const ResultsDashboardView: React.FC<ResultsDashboardViewProps> = ({
  results,
  onRetryFreshChallenge,
  onReturnHome,
  onViewLeaderboards,
}) => {
  const [reviewFilter, setReviewFilter] = useState<'all' | 'correct' | 'incorrect'>('all');
  const [copiedShare, setCopiedShare] = useState(false);

  const {
    attempt,
    questions,
    categoryBreakdown,
    difficultyBreakdown,
    xpEarned,
    newlyUnlockedAchievements,
  } = results;

  const pointsPct =
    attempt.maxPossibleScore > 0
      ? Math.round((attempt.currentScore / attempt.maxPossibleScore) * 1000) / 10
      : 0;

  useEffect(() => {
    soundFX.playVictory();
    if (pointsPct >= 50) {
      try {
        confetti({
          particleCount: 65,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch {
        // Ignore in headless canvas environments if unsupported
      }
    }
  }, [pointsPct]);

  const formatDuration = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const rem = sec % 60;
    return `${mins}m ${rem}s`;
  };

  const filteredQuestions = questions.filter((q) => {
    if (reviewFilter === 'correct') return q.isCorrect === true;
    if (reviewFilter === 'incorrect') return q.isCorrect !== true;
    return true;
  });

  const handleCopyShareCard = () => {
    const summaryText = `🏆 KNOWLEDGE ARENA — ${attempt.mode.replace('_', ' ').toUpperCase()}\nScore: ${attempt.currentScore}/${attempt.maxPossibleScore} PTS (${pointsPct}%)\nAccuracy: ${attempt.accuracyPercent}% (${attempt.correctCount}/${attempt.totalQuestions})\nTime: ${formatDuration(attempt.timeSpentSec)} | +${xpEarned} XP`;
    navigator.clipboard?.writeText(summaryText).catch(() => {});
    setCopiedShare(true);
    setTimeout(() => setCopiedShare(false), 2500);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-8 text-[#F5F5F4]">
      {/* Hero Score Reveal Banner */}
      <div className="rounded-xl border border-[#3A3B3F] bg-[#292A2D] p-6 sm:p-8">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 text-xs text-[#E34843] font-mono mb-2">
              <span>CHALLENGE COMPLETE</span>
              <span aria-hidden="true">·</span>
              <span className="uppercase">{attempt.mode.replace('_', ' ')}</span>
              <span aria-hidden="true">·</span>
              <span>SERVER VERIFIED</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-display font-extrabold text-[#F5F5F4] tracking-tight">
              {attempt.currentScore} / {attempt.maxPossibleScore} Points
            </h1>
            <p className="mt-1.5 text-sm text-[#ADAEAF]">
              You earned <strong className="text-[#F5F5F4] font-mono">{pointsPct}%</strong> of maximum available points with{' '}
              <strong className="text-emerald-400 font-mono">+{xpEarned} XP</strong> awarded to your profile.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={onRetryFreshChallenge}
              className="inline-flex items-center gap-2 px-5 py-2.5 text-xs sm:text-sm font-semibold rounded-lg bg-[#E34843] text-[#F5F5F4] hover:opacity-90 transition-colors whitespace-nowrap shrink-0"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Retry with New Questions</span>
            </button>

            <button
              type="button"
              onClick={handleCopyShareCard}
              className="inline-flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-medium rounded-lg border border-[#3A3B3F] bg-[#161719] text-[#F5F5F4] hover:border-[#E34843] transition-colors whitespace-nowrap shrink-0"
            >
              {copiedShare ? <Copy className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4" />}
              <span>{copiedShare ? 'Copied Result Card!' : 'Share Result Card'}</span>
            </button>

            <button
              type="button"
              onClick={onViewLeaderboards}
              className="inline-flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-medium rounded-lg border border-[#3A3B3F] bg-[#161719] text-[#F5F5F4] hover:border-[#E34843] transition-colors whitespace-nowrap shrink-0"
            >
              <Trophy className="w-4 h-4 text-[#E34843]" />
              <span>Leaderboards</span>
            </button>

            <button
              type="button"
              onClick={onReturnHome}
              className="inline-flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-medium rounded-lg border border-[#3A3B3F] bg-[#161719] text-[#F5F5F4] hover:border-[#E34843] transition-colors whitespace-nowrap shrink-0"
            >
              <Home className="w-4 h-4" />
              <span>Dashboard</span>
            </button>
          </div>
        </div>

        {/* 4-Column Telemetry Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-8 pt-6 border-t border-[#3A3B3F]">
          <div>
            <div className="text-xs text-[#ADAEAF] flex items-center gap-1.5">
              <Target className="w-3.5 h-3.5 text-[#E34843]" />
              <span>Answer Accuracy</span>
            </div>
            <div className="mt-1 text-2xl font-display font-bold font-mono tabular-nums text-[#F5F5F4]">
              {attempt.accuracyPercent}%
            </div>
            <div className="text-xs text-[#ADAEAF] font-mono tabular-nums">
              {attempt.correctCount} Correct · {attempt.incorrectCount} Wrong · {attempt.unansweredCount} Skipped
            </div>
          </div>

          <div>
            <div className="text-xs text-[#ADAEAF] flex items-center gap-1.5">
              <Trophy className="w-3.5 h-3.5 text-[#E34843]" />
              <span>Points Ratio</span>
            </div>
            <div className="mt-1 text-2xl font-display font-bold font-mono tabular-nums text-[#F5F5F4]">
              {pointsPct}%
            </div>
            <div className="text-xs text-[#ADAEAF] font-mono tabular-nums">
              {attempt.currentScore} of {attempt.maxPossibleScore} Max Base
            </div>
          </div>

          <div>
            <div className="text-xs text-[#ADAEAF] flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-[#E34843]" />
              <span>Completion Time</span>
            </div>
            <div className="mt-1 text-2xl font-display font-bold font-mono tabular-nums text-[#F5F5F4]">
              {formatDuration(attempt.timeSpentSec)}
            </div>
            <div className="text-xs text-[#ADAEAF] font-mono tabular-nums">
              Avg {Math.round(attempt.timeSpentSec / Math.max(1, attempt.totalQuestions))}s / question
            </div>
          </div>

          <div>
            <div className="text-xs text-[#ADAEAF] flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              <span>Arena Experience</span>
            </div>
            <div className="mt-1 text-2xl font-display font-bold font-mono tabular-nums text-emerald-400">
              +{xpEarned} XP
            </div>
            <div className="text-xs text-[#ADAEAF]">
              Separate from official quiz score
            </div>
          </div>
        </div>
      </div>

      {/* Newly Unlocked Achievements */}
      {newlyUnlockedAchievements.length > 0 && (
        <div className="rounded-xl border border-[#E34843]/50 bg-[#292A2D] p-6">
          <div className="flex items-center gap-2 text-sm font-display font-bold text-[#E34843] mb-3">
            <Award className="w-5 h-5" />
            <span>Newly Unlocked Achievements ({newlyUnlockedAchievements.length})</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {newlyUnlockedAchievements.map((ach) => (
              <div
                key={ach.code}
                className="rounded-lg border border-[#3A3B3F] bg-[#161719] p-4"
              >
                <div className="flex items-center justify-between">
                  <span className="font-display font-bold text-[#F5F5F4] text-sm">
                    {ach.title}
                  </span>
                  <span className="font-mono text-xs text-[#E34843]">
                    +{ach.xpReward} XP
                  </span>
                </div>
                <p className="mt-1 text-xs text-[#ADAEAF]">
                  {ach.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Analytics Charts: Category Breakdown & Difficulty Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-xl border border-[#3A3B3F] bg-[#292A2D] p-6">
          <h2 className="text-base font-display font-bold text-[#F5F5F4] mb-1">
            Category Performance Breakdown
          </h2>
          <p className="text-xs text-[#ADAEAF] mb-4">
            Points earned vs. maximum possible points per category
          </p>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryBreakdown}>
                <CartesianGrid strokeDasharray="3 3" stroke="#3A3B3F" opacity={0.45} />
                <XAxis dataKey="categorySlug" stroke="#ADAEAF" fontSize={12} />
                <YAxis stroke="#ADAEAF" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#161719',
                    borderColor: '#3A3B3F',
                    color: '#F5F5F4',
                    fontSize: '12px',
                  }}
                />
                <Bar dataKey="score" name="Points Earned" fill="#E34843" radius={[4, 4, 0, 0]} />
                <Bar dataKey="maxScore" name="Max Possible" fill="#3A3B3F" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-xl border border-[#3A3B3F] bg-[#292A2D] p-6">
          <h2 className="text-base font-display font-bold text-[#F5F5F4] mb-1">
            Difficulty Tier Performance
          </h2>
          <p className="text-xs text-[#ADAEAF] mb-4">
            Easy (+1), Normal (+2), Hard (+3), ExtraHard (+5) scoring distribution
          </p>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={difficultyBreakdown.map((d) => ({
                  ...d,
                  difficulty: d.difficulty === 'Very Hard' ? 'ExtraHard' : d.difficulty,
                }))}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#3A3B3F" opacity={0.45} />
                <XAxis dataKey="difficulty" stroke="#ADAEAF" fontSize={12} />
                <YAxis stroke="#ADAEAF" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#161719',
                    borderColor: '#3A3B3F',
                    color: '#F5F5F4',
                    fontSize: '12px',
                  }}
                />
                <Bar dataKey="score" name="Points Earned" fill="#E34843" radius={[4, 4, 0, 0]} />
                <Bar dataKey="maxScore" name="Max Possible" fill="#3A3B3F" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Detailed Question & Explanation Review */}
      <div className="rounded-xl border border-[#3A3B3F] bg-[#292A2D] p-6">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-lg font-display font-bold text-[#F5F5F4]">
              Question & Explanation Review
            </h2>
            <p className="text-xs text-[#ADAEAF]">
              Complete post-challenge answer key and technical explanations
            </p>
          </div>

          <div className="flex items-center gap-1 p-1 bg-[#161719] rounded-lg border border-[#3A3B3F]">
            {(['all', 'correct', 'incorrect'] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setReviewFilter(tab)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md capitalize transition-colors whitespace-nowrap shrink-0 ${
                  reviewFilter === tab
                    ? 'bg-[#E34843] text-[#F5F5F4] shadow-xs'
                    : 'text-[#ADAEAF] hover:text-[#F5F5F4]'
                }`}
              >
                {tab} (
                {tab === 'all'
                  ? questions.length
                  : tab === 'correct'
                  ? attempt.correctCount
                  : attempt.incorrectCount + attempt.unansweredCount}
                )
              </button>
            ))}
          </div>
        </div>

        <div className="divide-y divide-[#3A3B3F]">
          {filteredQuestions.map((q) => {
            const chosenOpt = q.options.find((o) => o.optionId === q.selectedOptionId);
            const rightOpt = q.options.find((o) => o.optionId === q.correctOptionId);
            return (
              <div key={q.attemptQuestionId} className="py-5 first:pt-0 last:pb-0">
                <div className="flex items-center justify-between text-xs text-[#ADAEAF] mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-[#F5F5F4]">
                      #{q.orderIndex + 1}
                    </span>
                    <span>·</span>
                    <span className="capitalize">{q.categorySlug}</span>
                    <span>·</span>
                    <span className="font-mono">
                      {q.difficulty === 'Very Hard' ? 'ExtraHard' : q.difficulty} (+{q.pointsValue} pts)
                    </span>
                  </div>
                  <span
                    className={`font-mono font-bold flex items-center gap-1 ${
                      q.isCorrect
                        ? 'text-emerald-400'
                        : 'text-rose-400'
                    }`}
                  >
                    {q.isCorrect ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>+{q.pointsEarned} PTS</span>
                      </>
                    ) : (
                      <>
                        <XCircle className="w-3.5 h-3.5" />
                        <span>0 PTS</span>
                      </>
                    )}
                  </span>
                </div>

                <h3 className="text-sm sm:text-base font-semibold text-[#F5F5F4] mb-2">
                  {q.questionText}
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs mb-2.5">
                  <div className="text-[#ADAEAF]">
                    <span className="font-medium">Your Answer: </span>
                    <span
                      className={
                        q.isCorrect
                          ? 'text-emerald-400 font-semibold'
                          : 'text-rose-400 font-semibold'
                      }
                    >
                      {chosenOpt ? `${chosenOpt.label}. ${chosenOpt.text}` : 'Unanswered'}
                    </span>
                  </div>
                  <div className="text-[#ADAEAF]">
                    <span className="font-medium">Verified Answer: </span>
                    <span className="text-emerald-400 font-semibold">
                      {rightOpt ? `${rightOpt.label}. ${rightOpt.text}` : 'Verified'}
                    </span>
                  </div>
                </div>

                {q.explanation && (
                  <p className="text-xs text-[#ADAEAF] bg-[#161719] border border-[#3A3B3F] rounded-lg p-3 leading-relaxed">
                    {q.explanation}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
