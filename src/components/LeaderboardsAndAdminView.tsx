import React, { useEffect, useState, useCallback } from 'react';
import {
  Award,
  CheckCircle2,
  Clock,
  Plus,
  Search,
  ShieldCheck,
  Sparkles,
  Trophy,
} from 'lucide-react';
import type { DifficultyLevel } from '../utils/quizLogic.ts';

export interface LeaderboardEntry {
  id: number;
  attemptId: number;
  displayName: string;
  studentClass?: string;
  schoolCollege?: string;
  avatar: string;
  mode: string;
  categorySlug: string;
  score: number;
  maxScore: number;
  accuracyPercent: number;
  timeSpentSec: number;
  completedAt: string;
}

interface LeaderboardsViewProps {
  apiFetch: (url: string, options?: RequestInit) => Promise<any>;
}

export const LeaderboardsView: React.FC<LeaderboardsViewProps> = ({ apiFetch }) => {
  const [mode, setMode] = useState<string>('all');
  const [categorySlug, setCategorySlug] = useState<string>('all');
  const [timeframe, setTimeframe] = useState<string>('all_time');
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const loadRankings = useCallback(async () => {
    setLoading(true);
    try {
      const catParam = mode === 'category' || mode === 'all' ? categorySlug : 'all';
      const data = await apiFetch(
        `/api/leaderboards?mode=${encodeURIComponent(mode)}&categorySlug=${encodeURIComponent(catParam)}&timeframe=${encodeURIComponent(timeframe)}`
      );
      setEntries(data.entries || []);
    } catch {
      setEntries([]);
    } finally {
      setLoading(false);
    }
  }, [apiFetch, mode, categorySlug, timeframe]);

  useEffect(() => {
    loadRankings();
  }, [loadRankings]);

  const formatTime = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const rem = sec % 60;
    return `${mins}m ${String(rem).padStart(2, '0')}s`;
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-5 border-b border-[#3A3B3F]">
        <div>
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-[#F5F5F4]">
            Arena Leaderboards
          </h1>
          <p className="text-xs sm:text-sm text-[#ADAEAF] mt-1">
            Rankings compare equivalent challenge modes only. Tie-breakers: 1. Official Score · 2. Accuracy % · 3. Faster Completion Time.
          </p>
        </div>

        {/* Timeframe Selector */}
        <div className="flex items-center gap-1 p-1 bg-[#292A2D] rounded-lg border border-[#3A3B3F]">
          {[
            { id: 'all_time', label: 'All-Time' },
            { id: 'monthly', label: 'Monthly' },
            { id: 'weekly', label: 'Weekly' },
          ].map((tf) => (
            <button
              key={tf.id}
              type="button"
              onClick={() => setTimeframe(tf.id)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                timeframe === tf.id
                  ? 'bg-[#E34843] text-[#F5F5F4] shadow-xs'
                  : 'text-[#ADAEAF] hover:text-[#F5F5F4]'
              }`}
            >
              {tf.label}
            </button>
          ))}
        </div>
      </div>

      {/* Mode & Category Filters */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2">
          {[
            { id: 'all', label: 'All Completed Runs' },
            { id: 'category', label: 'Topic Quiz (20Q)' },
            { id: 'full_arena', label: 'Full Arena (100Q · 275 Pts)' },
            { id: 'boss_rush', label: 'Boss Rush (20Q · 100 Pts)' },
            { id: 'quick', label: 'Quick Challenge (10Q · 23 Pts)' },
          ].map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => setMode(m.id)}
              className={`px-3.5 py-2 text-xs font-semibold rounded-lg border transition-colors whitespace-nowrap shrink-0 ${
                mode === m.id
                  ? 'border-[#E34843] bg-[#E34843]/15 text-[#F5F5F4]'
                  : 'border-[#3A3B3F] bg-[#292A2D] text-[#ADAEAF] hover:border-[#E34843]/50 hover:text-[#F5F5F4]'
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>

        {(mode === 'category' || mode === 'all') && (
          <div className="flex flex-wrap items-center gap-1.5">
            {['all', 'computers', 'cars', 'motorcycles', 'traveling', 'programming'].map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setCategorySlug(cat)}
                className={`px-3 py-1.5 text-xs font-medium capitalize rounded-md border transition-colors whitespace-nowrap shrink-0 ${
                  categorySlug === cat
                    ? 'border-[#E34843] bg-[#E34843]/15 text-[#F5F5F4]'
                    : 'border-[#3A3B3F] bg-[#292A2D] text-[#ADAEAF] hover:text-[#F5F5F4]'
                }`}
              >
                {cat === 'all' ? 'All Themes' : cat}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Leaderboard Table */}
      <div className="rounded-xl border border-[#3A3B3F] bg-[#292A2D] overflow-hidden">
        {loading ? (
          <div className="p-8 space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="h-10 rounded-lg bg-[#161719] animate-pulse"
              />
            ))}
          </div>
        ) : entries.length === 0 ? (
          <div className="p-12 text-center text-sm text-[#ADAEAF]" data-testid="empty-leaderboard">
            No completed student runs recorded for this filter yet. Complete a quiz to claim Rank #1!
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse" data-testid="leaderboard-table">
              <thead>
                <tr className="border-b border-[#3A3B3F] text-[11px] font-mono uppercase text-[#ADAEAF]">
                  <th className="py-3.5 px-4">Rank</th>
                  <th className="py-3.5 px-4">Student Name</th>
                  <th className="py-3.5 px-4">Class</th>
                  <th className="py-3.5 px-4">School / College</th>
                  <th className="py-3.5 px-4">Theme / Mode</th>
                  <th className="py-3.5 px-4 text-right">Official Score</th>
                  <th className="py-3.5 px-4 text-right">Accuracy</th>
                  <th className="py-3.5 px-4 text-right">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#3A3B3F] text-sm">
                {entries.map((row, idx) => (
                  <tr
                    key={row.id}
                    className="hover:bg-[#161719]/50 transition-colors"
                  >
                    <td className="py-3 px-4 font-mono font-bold tabular-nums">
                      {idx === 0 ? (
                        <span className="text-amber-400">#1 🏆</span>
                      ) : idx === 1 ? (
                        <span className="text-[#F5F5F4]">#2 🥈</span>
                      ) : idx === 2 ? (
                        <span className="text-amber-600">#3 🥉</span>
                      ) : (
                        <span className="text-[#ADAEAF]">#{idx + 1}</span>
                      )}
                    </td>
                    <td className="py-3 px-4 font-semibold text-[#F5F5F4]">
                      {row.displayName}
                    </td>
                    <td className="py-3 px-4 font-mono text-xs text-[#E34843]">
                      {row.studentClass || '—'}
                    </td>
                    <td className="py-3 px-4 text-xs text-[#F5F5F4]">
                      {row.schoolCollege || '—'}
                    </td>
                    <td className="py-3 px-4 text-xs text-[#ADAEAF] capitalize">
                      {row.mode.replace('_', ' ')} · {row.categorySlug}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold tabular-nums text-[#E34843]">
                      {row.score} / {row.maxScore}
                    </td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums text-emerald-400">
                      {row.accuracyPercent.toFixed(1)}%
                    </td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums text-[#ADAEAF]">
                      {formatTime(row.timeSpentSec)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

interface AchievementsGalleryViewProps {
  achievements: Array<{
    code: string;
    title: string;
    description: string;
    xpReward: number;
    categorySlug: string;
    unlocked: boolean;
    unlockedAt: string | null;
  }>;
}

export const AchievementsGalleryView: React.FC<AchievementsGalleryViewProps> = ({
  achievements,
}) => {
  const unlockedCount = achievements.filter((a) => a.unlocked).length;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      <div className="flex items-center justify-between pb-5 border-b border-[#3A3B3F]">
        <div>
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-[#F5F5F4]">
            Arena Achievements
          </h1>
          <p className="text-xs sm:text-sm text-[#ADAEAF] mt-1">
            Server-verified mastery milestones. Unlocking badges grants bonus XP toward your Player Level.
          </p>
        </div>
        <div className="text-right font-mono tabular-nums">
          <div className="text-xl font-bold text-[#E34843]">
            {unlockedCount} / {achievements.length}
          </div>
          <div className="text-xs text-[#ADAEAF]">Unlocked</div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {achievements.map((ach) => (
          <div
            key={ach.code}
            className={`rounded-xl border p-5 transition-colors ${
              ach.unlocked
                ? 'border-[#E34843]/60 bg-[#292A2D]'
                : 'border-[#3A3B3F] bg-[#292A2D]/75 opacity-75'
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <Award
                  className={`w-5 h-5 shrink-0 ${
                    ach.unlocked ? 'text-[#E34843]' : 'text-[#ADAEAF]'
                  }`}
                />
                <h3 className="font-display font-bold text-base text-[#F5F5F4]">
                  {ach.title}
                </h3>
              </div>
              <span className="font-mono text-xs font-semibold text-[#E34843] shrink-0">
                +{ach.xpReward} XP
              </span>
            </div>

            <p className="mt-2 text-xs text-[#ADAEAF] leading-relaxed">
              {ach.description}
            </p>

            <div className="mt-4 pt-3 border-t border-[#3A3B3F] flex items-center justify-between text-[11px] font-mono">
              <span className="uppercase text-[#ADAEAF]">Category: {ach.categorySlug}</span>
              {ach.unlocked ? (
                <span className="text-emerald-400 flex items-center gap-1 font-bold">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>UNLOCKED</span>
                </span>
              ) : (
                <span className="text-[#ADAEAF] flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  <span>LOCKED</span>
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

interface AdminConsoleViewProps {
  apiFetch: (url: string, options?: RequestInit) => Promise<any>;
}

export const AdminConsoleView: React.FC<AdminConsoleViewProps> = ({ apiFetch }) => {
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [difficultyFilter, setDifficultyFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [questionsList, setQuestionsList] = useState<any[]>([]);
  const [reportsList, setReportsList] = useState<any[]>([]);
  const [totalCount, setTotalCount] = useState<number>(1000);
  const [loading, setLoading] = useState<boolean>(true);

  // Add Question Form State
  const [newCategory, setNewCategory] = useState<string>('computers');
  const [newDifficulty, setNewDifficulty] = useState<DifficultyLevel>('Normal');
  const [newQuestionText, setNewQuestionText] = useState<string>('');
  const [newCorrectOpt, setNewCorrectOpt] = useState<string>('');
  const [newWrong1, setNewWrong1] = useState<string>('');
  const [newWrong2, setNewWrong2] = useState<string>('');
  const [newWrong3, setNewWrong3] = useState<string>('');
  const [newExplanation, setNewExplanation] = useState<string>('');
  const [newDiagramType, setNewDiagramType] = useState<string>('none');
  const [formMessage, setFormMessage] = useState<string>('');

  // AI Generator State
  const [aiTopic, setAiTopic] = useState<string>('');
  const [aiGenerating, setAiGenerating] = useState<boolean>(false);
  const [aiStatusMsg, setAiStatusMsg] = useState<string>('');

  const loadAdminData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiFetch(
        `/api/admin/questions?categorySlug=${encodeURIComponent(categoryFilter)}&difficulty=${encodeURIComponent(difficultyFilter)}&verificationStatus=${encodeURIComponent(statusFilter)}&search=${encodeURIComponent(searchQuery)}&limit=50`
      );
      setQuestionsList(data.questions || []);
      setReportsList(data.reports || []);
      setTotalCount(data.totalDatabaseQuestions || 1000);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [apiFetch, categoryFilter, difficultyFilter, statusFilter, searchQuery]);

  useEffect(() => {
    loadAdminData();
  }, [loadAdminData]);

  const handleCreateQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormMessage('');
    try {
      await apiFetch('/api/admin/questions', {
        method: 'POST',
        body: JSON.stringify({
          categorySlug: newCategory,
          difficulty: newDifficulty,
          questionText: newQuestionText,
          options: [newCorrectOpt, newWrong1, newWrong2, newWrong3],
          explanation: newExplanation,
          diagramType: newDiagramType,
          tags: [newCategory, newDifficulty.toLowerCase()],
          verificationStatus: 'verified',
        }),
      });
      setNewQuestionText('');
      setNewCorrectOpt('');
      setNewWrong1('');
      setNewWrong2('');
      setNewWrong3('');
      setNewExplanation('');
      setFormMessage('Question validated and added to the live PostgreSQL bank!');
      loadAdminData();
    } catch (err: any) {
      setFormMessage(`Validation Error: ${err.message}`);
    }
  };

  const handleGenerateAiQuestions = async () => {
    setAiGenerating(true);
    setAiStatusMsg('');
    try {
      const res = await apiFetch('/api/admin/generate-ai-questions', {
        method: 'POST',
        body: JSON.stringify({
          categorySlug: newCategory,
          difficulty: newDifficulty,
          topic: aiTopic,
        }),
      });
      setAiStatusMsg(
        `Generated ${res.candidates?.length || 0} candidate questions in 'pending_review' status. Review and approve them below.`
      );
      setStatusFilter('pending_review');
      loadAdminData();
    } catch (err: any) {
      setAiStatusMsg(`AI Generation Notice: ${err.message}`);
    } finally {
      setAiGenerating(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4 pb-5 border-b border-[#3A3B3F]">
        <div>
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-[#F5F5F4] flex items-center gap-2.5">
            <ShieldCheck className="w-7 h-7 text-[#E34843]" />
            <span>Admin Question Bank & Verification Console</span>
          </h1>
          <p className="text-xs sm:text-sm text-[#ADAEAF] mt-1">
            Manage the <strong className="font-mono text-[#F5F5F4]">{totalCount.toLocaleString()}</strong> seeded questions across 5 categories × 4 difficulty levels, review player reports, or generate candidate questions for review.
          </p>
        </div>
      </div>

      {/* Add Question + AI Candidate Generator Split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <form
          onSubmit={handleCreateQuestion}
          className="lg:col-span-8 rounded-xl border border-[#3A3B3F] bg-[#292A2D] p-6 space-y-4"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-base font-display font-bold text-[#F5F5F4] flex items-center gap-2">
              <Plus className="w-4 h-4 text-[#E34843]" />
              <span>Add Verified Question</span>
            </h2>
            {formMessage && (
              <span className="text-xs font-mono text-emerald-400">{formMessage}</span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs text-[#ADAEAF] mb-1">Category</label>
              <select
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                className="w-full rounded-lg border border-[#3A3B3F] bg-[#161719] px-3 py-2 text-xs text-[#F5F5F4]"
              >
                <option value="computers">Computers</option>
                <option value="cars">Cars</option>
                <option value="motorcycles">Motorcycles</option>
                <option value="traveling">Traveling & Geography</option>
                <option value="programming">Programming Languages</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-[#ADAEAF] mb-1">Difficulty</label>
              <select
                value={newDifficulty}
                onChange={(e) => setNewDifficulty(e.target.value as DifficultyLevel)}
                className="w-full rounded-lg border border-[#3A3B3F] bg-[#161719] px-3 py-2 text-xs text-[#F5F5F4]"
              >
                <option value="Easy">Easy (+1 pt)</option>
                <option value="Normal">Normal (+2 pts)</option>
                <option value="Hard">Hard (+3 pts)</option>
                <option value="Very Hard">ExtraHard (+5 pts)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-[#ADAEAF] mb-1">Interactive Diagram</label>
              <select
                value={newDiagramType}
                onChange={(e) => setNewDiagramType(e.target.value)}
                className="w-full rounded-lg border border-[#3A3B3F] bg-[#161719] px-3 py-2 text-xs text-[#F5F5F4]"
              >
                <option value="none">None</option>
                <option value="cpu_pipeline">CPU Pipeline Schematic</option>
                <option value="cache_hierarchy">Cache Hierarchy</option>
                <option value="engine_four_stroke">Four-Stroke Engine</option>
                <option value="turbocharger_flow">Turbocharger Flow</option>
                <option value="moto_desmodromic">Desmodromic Valvetrain</option>
                <option value="geo_great_circle">Great Circle Navigation</option>
                <option value="prog_event_loop">Event Loop & Heap</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs text-[#ADAEAF] mb-1">Question Prompt</label>
            <input
              type="text"
              required
              value={newQuestionText}
              onChange={(e) => setNewQuestionText(e.target.value)}
              placeholder="Enter unambiguous, fact-checked technical question..."
              className="w-full rounded-lg border border-[#3A3B3F] bg-[#161719] px-3 py-2 text-xs text-[#F5F5F4] placeholder:text-[#ADAEAF]/60"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-emerald-400 font-medium mb-1">
                Correct Answer Option
              </label>
              <input
                type="text"
                required
                value={newCorrectOpt}
                onChange={(e) => setNewCorrectOpt(e.target.value)}
                placeholder="Exact verified answer"
                className="w-full rounded-lg border border-emerald-500/50 bg-[#161719] px-3 py-2 text-xs text-[#F5F5F4] placeholder:text-[#ADAEAF]/60"
              />
            </div>
            <div>
              <label className="block text-xs text-[#ADAEAF] mb-1">Distractor Option 2</label>
              <input
                type="text"
                required
                value={newWrong1}
                onChange={(e) => setNewWrong1(e.target.value)}
                placeholder="Plausible incorrect option"
                className="w-full rounded-lg border border-[#3A3B3F] bg-[#161719] px-3 py-2 text-xs text-[#F5F5F4] placeholder:text-[#ADAEAF]/60"
              />
            </div>
            <div>
              <label className="block text-xs text-[#ADAEAF] mb-1">Distractor Option 3</label>
              <input
                type="text"
                required
                value={newWrong2}
                onChange={(e) => setNewWrong2(e.target.value)}
                placeholder="Plausible incorrect option"
                className="w-full rounded-lg border border-[#3A3B3F] bg-[#161719] px-3 py-2 text-xs text-[#F5F5F4] placeholder:text-[#ADAEAF]/60"
              />
            </div>
            <div>
              <label className="block text-xs text-[#ADAEAF] mb-1">Distractor Option 4</label>
              <input
                type="text"
                required
                value={newWrong3}
                onChange={(e) => setNewWrong3(e.target.value)}
                placeholder="Plausible incorrect option"
                className="w-full rounded-lg border border-[#3A3B3F] bg-[#161719] px-3 py-2 text-xs text-[#F5F5F4] placeholder:text-[#ADAEAF]/60"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs text-[#ADAEAF] mb-1">Detailed Technical Explanation</label>
            <input
              type="text"
              required
              value={newExplanation}
              onChange={(e) => setNewExplanation(e.target.value)}
              placeholder="Explain why the correct answer is right..."
              className="w-full rounded-lg border border-[#3A3B3F] bg-[#161719] px-3 py-2 text-xs text-[#F5F5F4] placeholder:text-[#ADAEAF]/60"
            />
          </div>

          <button
            type="submit"
            className="px-4 py-2 text-xs font-semibold rounded-lg bg-[#E34843] text-[#F5F5F4] hover:bg-[#E34843]/90 transition-colors"
          >
            Publish Question to Bank
          </button>
        </form>

        {/* AI Candidate Generator Card */}
        <div className="lg:col-span-4 rounded-xl border border-[#3A3B3F] bg-[#292A2D] p-6 flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-base font-display font-bold text-[#F5F5F4]">
              <Sparkles className="w-4 h-4 text-[#E34843]" />
              <span>AI Question Candidate Generator</span>
            </div>
            <p className="text-xs text-[#ADAEAF] leading-relaxed">
              Generate candidate questions using Gemini 3.8 Flash. All AI-generated candidates are stored as <code className="font-mono text-amber-400">pending_review</code> and are never published to players until an administrator explicitly approves them.
            </p>
            <div>
              <label className="block text-xs text-[#ADAEAF] mb-1">Specific Sub-Topic (Optional)</label>
              <input
                type="text"
                value={aiTopic}
                onChange={(e) => setAiTopic(e.target.value)}
                placeholder="e.g., PCIe 6.0 PAM4, Ducati Desmodromic, Rust Borrow Checker"
                className="w-full rounded-lg border border-[#3A3B3F] bg-[#161719] px-3 py-2 text-xs text-[#F5F5F4] placeholder:text-[#ADAEAF]/60"
              />
            </div>
            {aiStatusMsg && (
              <div className="text-xs text-[#F5F5F4] bg-[#E34843]/15 border border-[#E34843]/40 rounded-lg p-2.5">
                {aiStatusMsg}
              </div>
            )}
          </div>

          <button
            type="button"
            disabled={aiGenerating}
            onClick={handleGenerateAiQuestions}
            className="w-full py-2.5 px-4 text-xs font-semibold rounded-lg bg-[#E34843] text-[#F5F5F4] hover:bg-[#E34843]/90 disabled:opacity-50 transition-colors"
          >
            {aiGenerating ? 'Generating Candidates...' : 'Generate 2 Candidate Questions'}
          </button>
        </div>
      </div>

      {/* Filter & Search Bar for the 1,000+ Question Bank */}
      <div className="rounded-xl border border-[#3A3B3F] bg-[#292A2D] p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <select
              aria-label="Filter by category"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="rounded-lg border border-[#3A3B3F] bg-[#161719] px-3 py-1.5 text-xs text-[#F5F5F4]"
            >
              <option value="all">All 5 Categories</option>
              <option value="computers">Computers (200+)</option>
              <option value="cars">Cars (200+)</option>
              <option value="motorcycles">Motorcycles (200+)</option>
              <option value="traveling">Traveling & Geography (200+)</option>
              <option value="programming">Programming (200+)</option>
            </select>

            <select
              aria-label="Filter by difficulty"
              value={difficultyFilter}
              onChange={(e) => setDifficultyFilter(e.target.value)}
              className="rounded-lg border border-[#3A3B3F] bg-[#161719] px-3 py-1.5 text-xs text-[#F5F5F4]"
            >
              <option value="all">All 4 Difficulties</option>
              <option value="Easy">Easy</option>
              <option value="Normal">Normal</option>
              <option value="Hard">Hard</option>
              <option value="Very Hard">ExtraHard</option>
            </select>

            <select
              aria-label="Filter by verification status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-lg border border-[#3A3B3F] bg-[#161719] px-3 py-1.5 text-xs text-[#F5F5F4]"
            >
              <option value="all">All Statuses</option>
              <option value="verified">Verified Only</option>
              <option value="pending_review">Pending AI Review</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-[#ADAEAF] absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search question text or code..."
              className="w-full rounded-lg border border-[#3A3B3F] bg-[#161719] pl-8 pr-3 py-1.5 text-xs text-[#F5F5F4] placeholder:text-[#ADAEAF]/60"
            />
          </div>
        </div>

        {loading ? (
          <div className="py-8 text-center text-xs text-[#ADAEAF]">Loading question bank...</div>
        ) : (
          <div className="divide-y divide-[#3A3B3F] max-h-[520px] overflow-y-auto pr-1">
            {questionsList.map((q) => (
              <div key={q.id} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-[11px] font-mono text-[#ADAEAF]">
                    <span>{q.code}</span>
                    <span>·</span>
                    <span className="capitalize text-[#E34843]">{q.categorySlug}</span>
                    <span>·</span>
                    <span>{q.difficulty === 'Very Hard' ? 'ExtraHard' : q.difficulty}</span>
                    <span>·</span>
                    <span
                      className={
                        q.verificationStatus === 'verified'
                          ? 'text-emerald-400'
                          : 'text-amber-400 font-bold'
                      }
                    >
                      {q.verificationStatus.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm font-medium text-[#F5F5F4]">
                    {q.questionText}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {q.verificationStatus !== 'verified' && (
                    <button
                      type="button"
                      onClick={async () => {
                        await apiFetch(`/api/admin/questions/${q.id}`, {
                          method: 'PATCH',
                          body: JSON.stringify({
                            verificationStatus: 'verified',
                            isActive: true,
                          }),
                        });
                        loadAdminData();
                      }}
                      className="px-2.5 py-1 text-xs font-semibold rounded bg-emerald-500 text-[#161719] hover:bg-emerald-400"
                    >
                      Approve
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={async () => {
                      await apiFetch(`/api/admin/questions/${q.id}`, {
                        method: 'PATCH',
                        body: JSON.stringify({
                          verificationStatus: q.verificationStatus,
                          isActive: !q.isActive,
                        }),
                      });
                      loadAdminData();
                    }}
                    className="px-2.5 py-1 text-xs font-medium rounded border border-[#3A3B3F] bg-[#161719] text-[#ADAEAF] hover:text-[#F5F5F4]"
                  >
                    {q.isActive ? 'Deactivate' : 'Activate'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Reported Questions Queue */}
      {reportsList.length > 0 && (
        <div className="rounded-xl border border-[#3A3B3F] bg-[#292A2D] p-6">
          <h3 className="text-sm font-display font-bold text-[#F5F5F4] mb-3">
            Reported Questions Queue ({reportsList.length})
          </h3>
          <div className="divide-y divide-[#3A3B3F] text-xs">
            {reportsList.map((r: any) => (
              <div key={r.report.id} className="py-2.5 flex items-center justify-between">
                <div>
                  <span className="font-mono text-amber-400">[{r.report.reason}]</span>{' '}
                  <span className="text-[#F5F5F4]">{r.questionText}</span>
                </div>
                <span className="font-mono text-[#ADAEAF]">{r.report.status}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
