import QUIZ_CHAMBER_BG from '../assets/images/quiz_chamber_backdrop_1793995358881.jpg';
import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Bike,
  Car,
  CheckCircle2,
  Clock,
  Code2,
  Cpu,
  Flag,
  Flame,
  Globe,
  Grid,
  HelpCircle,
  Send,
  ShieldAlert,
  Sparkles,
  Trophy,
  XCircle,
} from 'lucide-react';
import { InteractiveDiagram } from './InteractiveDiagram.tsx';
import { soundFX } from '../utils/soundEffects.ts';
import type { ClientSafeOption, DifficultyLevel } from '../utils/quizLogic.ts';


export interface ClientQuizQuestion {
  attemptQuestionId: number;
  questionId: number;
  orderIndex: number;
  categorySlug: string;
  difficulty: DifficultyLevel;
  pointsValue: number;
  questionText: string;
  diagramType: string;
  tags: string[];
  estimatedTimeSec: number;
  options: ClientSafeOption[];
  isFlagged: boolean;
  isAnswered: boolean;
  selectedOptionId: number | null;
  isCorrect: boolean | null;
  pointsEarned: number | null;
  correctOptionId: number | null;
  explanation: string | null;
}

export interface QuizAttemptRecord {
  id: number;
  attemptUuid: string;
  mode: string;
  categorySlug: string;
  practiceDifficulty: string;
  status: string;
  currentScore: number;
  maxPossibleScore: number;
  correctCount: number;
  incorrectCount: number;
  unansweredCount: number;
  accuracyPercent: number;
  timeSpentSec: number;
  timeLimitSec: number;
  currentIndex: number;
  totalQuestions: number;
  repeatNotice: boolean;
}

interface QuizArenaViewProps {
  attempt: QuizAttemptRecord;
  questions: ClientQuizQuestion[];
  onSubmitAnswer: (
    attemptQuestionId: number,
    selectedOptionId: number,
    questionTimeSec: number,
    totalElapsedSec: number
  ) => Promise<void>;
  onToggleFlag: (attemptQuestionId: number, isFlagged: boolean) => Promise<void>;
  onSaveProgress: (currentIndex: number, totalElapsedSec: number) => Promise<void>;
  onFinishChallenge: (totalElapsedSec: number) => Promise<void>;
  onReportQuestion: (questionId: number, reason: string, details: string) => Promise<void>;
  onExitToDashboard: () => void;
}

export interface DifficultyMoodConfig {
  moodName: string;
  colorLabel: string;
  symbol: string;
  label: string;
  hex: string;
  textClass: string;
  boxTintClass: string;
  ambientVeilStyle: React.CSSProperties;
  progressBarClass: string;
  primaryBtnClass: string;
  selectedOptionClass: string;
  badgeOptionClass: string;
}

export function getDifficultyMood(diff: DifficultyLevel, pts: number): DifficultyMoodConfig {
  switch (diff) {
    case 'Easy':
      return {
        moodName: 'Stage I · Precision Start',
        colorLabel: 'TIER I',
        symbol: '●',
        label: `Easy · +${pts} PT`,
        hex: '#E34843',
        textClass: 'text-[#E34843]',
        boxTintClass:
          'border-[#3A3B3F] bg-[#292A2D] shadow-[0_0_45px_-14px_rgba(227,72,67,0.28)]',
        ambientVeilStyle: {
          background:
            'radial-gradient(circle at 50% 18%, rgba(227, 72, 67, 0.14), rgba(22, 23, 25, 0.94) 75%)',
        },
        progressBarClass: 'bg-[#E34843]',
        primaryBtnClass: 'bg-[#E34843] text-[#F5F5F4] hover:opacity-90',
        selectedOptionClass:
          'border-[#E34843] bg-[#E34843]/15 text-[#F5F5F4] ring-1 ring-[#E34843]',
        badgeOptionClass: 'bg-[#E34843] text-[#F5F5F4]',
      };
    case 'Normal':
      return {
        moodName: 'Stage II · Circuit Pace',
        colorLabel: 'TIER II',
        symbol: '◆',
        label: `Normal · +${pts} PTS`,
        hex: '#E34843',
        textClass: 'text-[#E34843]',
        boxTintClass:
          'border-[#3A3B3F] bg-[#292A2D] shadow-[0_0_45px_-14px_rgba(227,72,67,0.32)]',
        ambientVeilStyle: {
          background:
            'radial-gradient(circle at 50% 18%, rgba(227, 72, 67, 0.16), rgba(22, 23, 25, 0.94) 75%)',
        },
        progressBarClass: 'bg-[#E34843]',
        primaryBtnClass: 'bg-[#E34843] text-[#F5F5F4] hover:opacity-90',
        selectedOptionClass:
          'border-[#E34843] bg-[#E34843]/15 text-[#F5F5F4] ring-1 ring-[#E34843]',
        badgeOptionClass: 'bg-[#E34843] text-[#F5F5F4]',
      };
    case 'Hard':
      return {
        moodName: 'Stage III · Redline Sector',
        colorLabel: 'TIER III',
        symbol: '▲',
        label: `Hard · +${pts} PTS`,
        hex: '#E34843',
        textClass: 'text-[#E34843]',
        boxTintClass:
          'border-[#E34843]/60 bg-[#292A2D] shadow-[0_0_50px_-14px_rgba(227,72,67,0.36)]',
        ambientVeilStyle: {
          background:
            'radial-gradient(circle at 50% 18%, rgba(227, 72, 67, 0.18), rgba(22, 23, 25, 0.94) 75%)',
        },
        progressBarClass: 'bg-[#E34843]',
        primaryBtnClass: 'bg-[#E34843] text-[#F5F5F4] hover:opacity-90',
        selectedOptionClass:
          'border-[#E34843] bg-[#E34843]/15 text-[#F5F5F4] ring-1 ring-[#E34843]',
        badgeOptionClass: 'bg-[#E34843] text-[#F5F5F4]',
      };
    case 'Very Hard':
      return {
        moodName: 'Stage IV · Apex Championship',
        colorLabel: 'TIER IV',
        symbol: '★',
        label: `ExtraHard · +${pts} PTS`,
        hex: '#E34843',
        textClass: 'text-[#E34843]',
        boxTintClass:
          'border-[#E34843]/80 bg-[#292A2D] shadow-[0_0_55px_-12px_rgba(227,72,67,0.42)]',
        ambientVeilStyle: {
          background:
            'radial-gradient(circle at 50% 18%, rgba(227, 72, 67, 0.22), rgba(22, 23, 25, 0.95) 75%)',
        },
        progressBarClass: 'bg-[#E34843]',
        primaryBtnClass: 'bg-[#E34843] text-[#F5F5F4] hover:opacity-90',
        selectedOptionClass:
          'border-[#E34843] bg-[#E34843]/20 text-[#F5F5F4] ring-1 ring-[#E34843]',
        badgeOptionClass: 'bg-[#E34843] text-[#F5F5F4]',
      };
  }
}

export const QuizArenaView: React.FC<QuizArenaViewProps> = ({
  attempt,
  questions,
  onSubmitAnswer,
  onToggleFlag,
  onSaveProgress,
  onFinishChallenge,
  onReportQuestion,
  onExitToDashboard,
}) => {
  const [currentIndex, setCurrentIndex] = useState<number>(() => {
    const firstUnanswered = questions.findIndex((q) => !q.isAnswered);
    return firstUnanswered >= 0 ? firstUnanswered : attempt.currentIndex || 0;
  });
  const [selectedOptionId, setSelectedOptionId] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [finishing, setFinishing] = useState(false);
  const [elapsedSec, setElapsedSec] = useState<number>(attempt.timeSpentSec || 0);
  const [questionTimerSec, setQuestionTimerSec] = useState<number>(0);
  const [showNavigator, setShowNavigator] = useState<boolean>(false);
  const [reportModalOpen, setReportModalOpen] = useState<boolean>(false);
  const [reportReason, setReportReason] = useState<string>('Ambiguous phrasing');
  const [reportDetails, setReportDetails] = useState<string>('');
  const [reportSent, setReportSent] = useState<boolean>(false);

  // Vibration & Visual Feedback Animation State when answering
  const [feedbackVibration, setFeedbackVibration] = useState<'idle' | 'correct' | 'wrong'>('idle');
  const prevAnsweredRef = useRef<Record<number, boolean>>({});

  const currentQ = questions[currentIndex] || questions[0];

  // Detect fresh submission of the current question to trigger vibration + animation
  useEffect(() => {
    if (!currentQ) return;
    const wasAnswered = prevAnsweredRef.current[currentQ.attemptQuestionId];
    if (currentQ.isAnswered && wasAnswered === false) {
      setFeedbackVibration(currentQ.isCorrect ? 'correct' : 'wrong');
      const timer = window.setTimeout(() => {
        setFeedbackVibration('idle');
      }, 750);
      prevAnsweredRef.current[currentQ.attemptQuestionId] = true;
      return () => window.clearTimeout(timer);
    }
    prevAnsweredRef.current[currentQ.attemptQuestionId] = Boolean(currentQ.isAnswered);
  }, [currentQ]);

  // Sync selectedOptionId when changing questions
  useEffect(() => {
    if (currentQ?.isAnswered) {
      setSelectedOptionId(currentQ.selectedOptionId);
    } else {
      setSelectedOptionId(null);
    }
    setFeedbackVibration('idle');
    setQuestionTimerSec(0);
    setReportSent(false);
  }, [currentIndex, currentQ?.attemptQuestionId, currentQ?.isAnswered, currentQ?.selectedOptionId]);

  // Live 1Hz timer
  useEffect(() => {
    const interval = window.setInterval(() => {
      setElapsedSec((prev) => {
        const next = prev + 1;
        if (attempt.timeLimitSec > 0 && next >= attempt.timeLimitSec && !finishing) {
          onFinishChallenge(next);
        }
        return next;
      });
      setQuestionTimerSec((prev) => prev + 1);
    }, 1000);
    return () => window.clearInterval(interval);
  }, [attempt.timeLimitSec, finishing, onFinishChallenge]);

  const handleSelectOption = useCallback(
    (optionId: number) => {
      if (!currentQ || currentQ.isAnswered || submitting) return;
      soundFX.playSelect();
      setSelectedOptionId(optionId);
    },
    [currentQ, submitting]
  );

  const handleConfirmAnswer = useCallback(async () => {
    if (!currentQ || currentQ.isAnswered || selectedOptionId === null || submitting) return;
    setSubmitting(true);
    prevAnsweredRef.current[currentQ.attemptQuestionId] = false;
    try {
      await onSubmitAnswer(
        currentQ.attemptQuestionId,
        selectedOptionId,
        Math.max(1, questionTimerSec),
        elapsedSec
      );
    } finally {
      setSubmitting(false);
    }
  }, [currentQ, selectedOptionId, submitting, onSubmitAnswer, questionTimerSec, elapsedSec]);

  const handleNavigate = useCallback(
    (newIndex: number) => {
      const clamped = Math.max(0, Math.min(questions.length - 1, newIndex));
      setCurrentIndex(clamped);
      onSaveProgress(clamped, elapsedSec);
    },
    [questions.length, onSaveProgress, elapsedSec]
  );

  // Keyboard navigation support (1-4 / A-D to select, Enter to submit/next, ArrowLeft/Right, F to flag)
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (
        reportModalOpen ||
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }
      if (!currentQ) return;

      const key = e.key.toUpperCase();
      if (['1', 'A'].includes(key) && currentQ.options[0]) {
        handleSelectOption(currentQ.options[0].optionId);
      } else if (['2', 'B'].includes(key) && currentQ.options[1]) {
        handleSelectOption(currentQ.options[1].optionId);
      } else if (['3', 'C'].includes(key) && currentQ.options[2]) {
        handleSelectOption(currentQ.options[2].optionId);
      } else if (['4', 'D'].includes(key) && currentQ.options[3]) {
        handleSelectOption(currentQ.options[3].optionId);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (!currentQ.isAnswered && selectedOptionId !== null) {
          handleConfirmAnswer();
        } else if (currentQ.isAnswered && currentIndex < questions.length - 1) {
          handleNavigate(currentIndex + 1);
        }
      } else if (e.key === 'ArrowRight' && currentIndex < questions.length - 1) {
        handleNavigate(currentIndex + 1);
      } else if (e.key === 'ArrowLeft' && currentIndex > 0) {
        handleNavigate(currentIndex - 1);
      } else if (key === 'F') {
        onToggleFlag(currentQ.attemptQuestionId, !currentQ.isFlagged);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [
    currentQ,
    currentIndex,
    questions.length,
    selectedOptionId,
    reportModalOpen,
    handleSelectOption,
    handleConfirmAnswer,
    handleNavigate,
    onToggleFlag,
  ]);

  const getCategoryIcon = (slug: string) => {
    switch (slug) {
      case 'computers':
        return <Cpu className="w-4 h-4 text-[#E34843]" />;
      case 'cars':
        return <Car className="w-4 h-4 text-[#E34843]" />;
      case 'motorcycles':
        return <Bike className="w-4 h-4 text-[#E34843]" />;
      case 'traveling':
        return <Globe className="w-4 h-4 text-[#E34843]" />;
      case 'programming':
        return <Code2 className="w-4 h-4 text-[#E34843]" />;
      default:
        return <Cpu className="w-4 h-4 text-[#E34843]" />;
    }
  };

  const formatTime = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const rem = sec % 60;
    return `${String(mins).padStart(2, '0')}:${String(rem).padStart(2, '0')}`;
  };

  const answeredCount = questions.filter((q) => q.isAnswered).length;
  const flaggedCount = questions.filter((q) => q.isFlagged).length;
  const progressPct = Math.round((answeredCount / Math.max(1, questions.length)) * 100);
  const mood = getDifficultyMood(currentQ.difficulty, currentQ.pointsValue);

  const vibrationClass =
    feedbackVibration === 'correct'
      ? 'ka-vibrate-mild'
      : feedbackVibration === 'wrong'
      ? 'ka-vibrate-wrong'
      : '';

  return (
    <div className="relative min-h-[calc(100vh-110px)] py-6 px-4 sm:px-6 overflow-hidden bg-[#161719] text-[#F5F5F4] transition-colors duration-500">
      {/* Bespoke Quiz Chamber Background Image + Racing Red Veil */}
      <img
        src={QUIZ_CHAMBER_BG}
        alt=""
        aria-hidden="true"
        referrerPolicy="no-referrer"
        onError={(e) => {
          e.currentTarget.style.display = 'none';
        }}
        className="fixed inset-0 w-full h-full object-cover opacity-20 pointer-events-none"
      />
      <div
        className="fixed inset-0 pointer-events-none transition-all duration-500"
        style={mood.ambientVeilStyle}
      />

      <div className="relative z-10 max-w-6xl mx-auto">
        {/* Repeat notice if unseen pool was exhausted */}
        {attempt.repeatNotice && (
          <div className="mb-4 flex items-center gap-2.5 rounded-lg border border-amber-500/40 bg-amber-500/15 px-4 py-2.5 text-xs text-amber-300">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>
              You have completed most unseen questions in this tier; least-recently attempted questions have been included to maintain balanced difficulty distribution.
            </span>
          </div>
        )}

        {/* Top Arena Telemetry Strip */}
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 mb-5 border-b border-[#3A3B3F]">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => {
                onSaveProgress(currentIndex, elapsedSec);
                onExitToDashboard();
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-[#3A3B3F] bg-[#292A2D] text-[#F5F5F4] hover:border-[#E34843] transition-colors whitespace-nowrap shrink-0"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Save & Exit</span>
            </button>
            <div className="text-xs text-[#ADAEAF] flex items-center gap-2">
              <span className="font-semibold text-[#F5F5F4] uppercase tracking-wider">
                {attempt.mode.replace('_', ' ')}
              </span>
              <span aria-hidden="true">·</span>
              <span className="font-mono tabular-nums text-[#F5F5F4] font-bold">
                Question {currentIndex + 1} of {questions.length}
              </span>
              <span aria-hidden="true" className="hidden sm:inline">·</span>
              <span className={`hidden sm:inline font-mono font-bold ${mood.textClass}`}>
                {mood.colorLabel}: {mood.moodName}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-5 text-xs font-mono tabular-nums">
            <div className="flex items-center gap-1.5">
              <Trophy className="w-4 h-4 text-[#E34843]" />
              <span className="text-[#ADAEAF]">SCORE:</span>
              <span className="font-bold text-sm text-[#F5F5F4]" data-testid="live-score">
                {attempt.currentScore} / {attempt.maxPossibleScore}
              </span>
            </div>

            <div className="hidden sm:flex items-center gap-2 text-[#ADAEAF]">
              <span className="text-emerald-400">✓ {attempt.correctCount}</span>
              <span>·</span>
              <span className="text-rose-400">✕ {attempt.incorrectCount}</span>
              <span>·</span>
              <span>{attempt.accuracyPercent}% ACC</span>
            </div>

            <div className="flex items-center gap-1.5 text-[#F5F5F4]">
              <Clock className="w-4 h-4 text-[#E34843]" />
              <span>
                {attempt.timeLimitSec > 0
                  ? `${formatTime(Math.max(0, attempt.timeLimitSec - elapsedSec))} LEFT`
                  : formatTime(elapsedSec)}
              </span>
            </div>

            <button
              type="button"
              onClick={() => setShowNavigator(!showNavigator)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-sans font-medium rounded-lg bg-[#292A2D] border border-[#3A3B3F] text-[#F5F5F4] hover:border-[#E34843] transition-colors whitespace-nowrap shrink-0"
            >
              <Grid className="w-3.5 h-3.5 text-[#E34843]" />
              <span>Navigator ({answeredCount}/{questions.length})</span>
            </button>
          </div>
        </div>

        {/* Racing Red Progress Bar */}
        <div className="w-full h-2 bg-[#292A2D] rounded-full overflow-hidden mb-6 border border-[#3A3B3F]">
          <div
            className={`h-full ${mood.progressBarClass} transition-transform duration-300 origin-left`}
            style={{ transform: `scaleX(${Math.max(0.03, progressPct / 100)})` }}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Main Question Box on #292A2D Surface + Vibration Feedback */}
          <div className={showNavigator ? 'lg:col-span-8' : 'lg:col-span-12'}>
            <div
              data-testid="question-box"
              data-mood={currentQ.difficulty}
              className={`relative rounded-2xl border-2 p-6 sm:p-8 transition-colors duration-500 ${mood.boxTintClass} ${vibrationClass}`}
            >
              {/* Tactile Architectural Corner Crosshairs */}
              <span
                aria-hidden="true"
                className="absolute top-2.5 left-3 font-mono text-[10px] text-[#ADAEAF] opacity-40 select-none"
              >
                +
              </span>
              <span
                aria-hidden="true"
                className="absolute top-2.5 right-3 font-mono text-[10px] text-[#ADAEAF] opacity-40 select-none"
              >
                +
              </span>
              <span
                aria-hidden="true"
                className="absolute bottom-2.5 left-3 font-mono text-[10px] text-[#ADAEAF] opacity-40 select-none"
              >
                +
              </span>
              <span
                aria-hidden="true"
                className="absolute bottom-2.5 right-3 font-mono text-[10px] text-[#ADAEAF] opacity-40 select-none"
              >
                +
              </span>

              {/* Unboxed Metadata & Kicker */}
              <div className="flex flex-wrap items-center justify-between gap-2 mb-4 text-xs">
                <div className="flex flex-wrap items-center gap-2 text-[#ADAEAF]">
                  {getCategoryIcon(currentQ.categorySlug)}
                  <span className="font-semibold capitalize text-[#F5F5F4]">
                    {currentQ.categorySlug}
                  </span>
                  <span aria-hidden="true">·</span>
                  <span
                    data-testid="difficulty-mood-indicator"
                    className={`font-mono font-bold ${mood.textClass}`}
                  >
                    {mood.symbol} {mood.label} ({mood.colorLabel})
                  </span>
                  <span aria-hidden="true">·</span>
                  <span className="font-mono text-[#ADAEAF]">
                    ARCHIVE #{currentQ.questionId} · Est. {currentQ.estimatedTimeSec}s
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => onToggleFlag(currentQ.attemptQuestionId, !currentQ.isFlagged)}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border transition-colors whitespace-nowrap shrink-0 ${
                      currentQ.isFlagged
                        ? 'border-[#E34843] bg-[#E34843]/20 text-[#F5F5F4]'
                        : 'border-[#3A3B3F] text-[#ADAEAF] hover:text-[#F5F5F4] hover:border-[#E34843]'
                    }`}
                  >
                    <Flag className="w-3.5 h-3.5" />
                    <span>{currentQ.isFlagged ? 'Flagged' : 'Flag Question'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setReportModalOpen(true)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium border border-[#3A3B3F] text-[#ADAEAF] hover:text-[#F5F5F4] hover:border-[#E34843] transition-colors whitespace-nowrap shrink-0"
                    aria-label="Report question issue"
                  >
                    <ShieldAlert className="w-3.5 h-3.5" />
                    <span>Report</span>
                  </button>
                </div>
              </div>

              {/* Question Text */}
              <h2
                className="text-xl sm:text-2xl font-display font-bold text-[#F5F5F4] leading-snug mb-5"
                style={{ textWrap: 'balance' }}
              >
                {currentQ.questionText}
              </h2>

              {/* Interactive SVG Engineering / Geography / CS Diagram when applicable */}
              <InteractiveDiagram
                diagramType={currentQ.diagramType}
                categorySlug={currentQ.categorySlug}
              />

              {/* Four Selectable Answer Cards */}
              <div
                className="grid grid-cols-1 gap-3.5 mt-6"
                role="radiogroup"
                aria-label="Answer Options"
              >
                {currentQ.options.map((opt) => {
                  const isSelected = selectedOptionId === opt.optionId;
                  const isAnswered = currentQ.isAnswered;
                  const isThisCorrect = isAnswered && currentQ.correctOptionId === opt.optionId;
                  const isThisWrongSelected =
                    isAnswered && isSelected && currentQ.correctOptionId !== opt.optionId;

                  let cardStyle =
                    'border-[#3A3B3F] bg-[#161719]/90 hover:border-[#E34843]/80 text-[#F5F5F4]';
                  let statusGlyph = null;

                  if (!isAnswered && isSelected) {
                    cardStyle = mood.selectedOptionClass;
                  } else if (isThisCorrect) {
                    cardStyle =
                      'border-emerald-500 bg-emerald-500/15 text-[#F5F5F4] ring-1 ring-emerald-500';
                    statusGlyph = (
                      <span className="inline-flex items-center gap-1 text-xs font-mono font-bold text-emerald-400 shrink-0">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>CORRECT</span>
                      </span>
                    );
                  } else if (isThisWrongSelected) {
                    cardStyle =
                      'border-rose-500 bg-rose-500/20 text-[#F5F5F4] ring-1 ring-rose-500';
                    statusGlyph = (
                      <span className="inline-flex items-center gap-1 text-xs font-mono font-bold text-rose-400 shrink-0">
                        <XCircle className="w-4 h-4" />
                        <span>YOUR ANSWER</span>
                      </span>
                    );
                  } else if (isAnswered) {
                    cardStyle =
                      'border-[#3A3B3F]/60 bg-[#161719]/50 opacity-65 text-[#ADAEAF]';
                  }

                  return (
                    <button
                      key={opt.optionId}
                      type="button"
                      disabled={isAnswered || submitting}
                      onClick={() => handleSelectOption(opt.optionId)}
                      className={`w-full text-left rounded-xl border p-4 transition-all duration-150 flex items-start justify-between gap-4 min-h-[56px] ${cardStyle}`}
                    >
                      <div className="flex items-start gap-3.5">
                        <span
                          className={`inline-flex items-center justify-center w-7 h-7 rounded-lg font-mono text-xs font-bold shrink-0 mt-0.5 ${
                            isThisCorrect
                              ? 'bg-emerald-500 text-[#161719]'
                              : isThisWrongSelected
                              ? 'bg-rose-500 text-[#F5F5F4]'
                              : isSelected
                              ? mood.badgeOptionClass
                              : 'bg-[#292A2D] text-[#ADAEAF] border border-[#3A3B3F]'
                          }`}
                        >
                          {opt.label}
                        </span>
                        <span className="text-sm sm:text-base font-medium leading-relaxed">
                          {opt.text}
                        </span>
                      </div>
                      {statusGlyph}
                    </button>
                  );
                })}
              </div>

              {/* Post-Submission Animated Feedback & Verified Explanation Box */}
              {currentQ.isAnswered && (
                <div
                  data-testid="answer-feedback-banner"
                  className={`ka-feedback-banner mt-6 rounded-xl border p-4 ${
                    currentQ.isCorrect
                      ? 'border-emerald-500/60 bg-emerald-500/15'
                      : 'border-rose-500/60 bg-rose-950/50'
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                    <div className="flex items-center gap-2 font-display font-bold text-sm">
                      {currentQ.isCorrect ? (
                        <Sparkles className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <Flame className="w-4 h-4 text-rose-400" />
                      )}
                      <span
                        className={
                          currentQ.isCorrect
                            ? 'text-emerald-300'
                            : 'text-rose-300'
                        }
                      >
                        {currentQ.isCorrect
                          ? `Verified Correct! +${currentQ.pointsEarned} Points Earned (Mild Resonance Pulse)`
                          : 'Incorrect Response — 0 Points Awarded (Impact Vibration Triggered)'}
                      </span>
                    </div>
                    <span className="text-xs font-mono text-[#ADAEAF]">
                      Locked & Server-Verified
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-[#F5F5F4] leading-relaxed">
                    {currentQ.explanation}
                  </p>
                </div>
              )}

              {/* Action Bar: Prev / Submit / Next / Complete */}
              <div className="mt-7 pt-5 border-t border-[#3A3B3F] flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={currentIndex === 0}
                    onClick={() => handleNavigate(currentIndex - 1)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium rounded-lg border border-[#3A3B3F] bg-[#161719] text-[#F5F5F4] hover:border-[#E34843] disabled:opacity-40 transition-colors whitespace-nowrap shrink-0"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Previous</span>
                  </button>

                  <button
                    type="button"
                    disabled={currentIndex >= questions.length - 1}
                    onClick={() => handleNavigate(currentIndex + 1)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium rounded-lg border border-[#3A3B3F] bg-[#161719] text-[#F5F5F4] hover:border-[#E34843] disabled:opacity-40 transition-colors whitespace-nowrap shrink-0"
                  >
                    <span>Next</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="flex items-center gap-3">
                  {!currentQ.isAnswered ? (
                    <button
                      type="button"
                      disabled={selectedOptionId === null || submitting}
                      onClick={handleConfirmAnswer}
                      className={`inline-flex items-center gap-2 px-5 py-2.5 text-xs sm:text-sm font-bold rounded-lg disabled:opacity-40 transition-colors whitespace-nowrap shrink-0 ${mood.primaryBtnClass}`}
                    >
                      <Send className="w-4 h-4" />
                      <span>{submitting ? 'Validating...' : 'Submit Answer'}</span>
                    </button>
                  ) : currentIndex < questions.length - 1 ? (
                    <button
                      type="button"
                      onClick={() => handleNavigate(currentIndex + 1)}
                      className={`inline-flex items-center gap-2 px-5 py-2.5 text-xs sm:text-sm font-bold rounded-lg transition-colors whitespace-nowrap shrink-0 ${mood.primaryBtnClass}`}
                    >
                      <span>Next Question</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  ) : null}

                  <button
                    type="button"
                    disabled={finishing}
                    onClick={async () => {
                      setFinishing(true);
                      await onFinishChallenge(elapsedSec);
                    }}
                    className={`inline-flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 ${
                      answeredCount === questions.length
                        ? 'bg-emerald-500 text-[#161719] hover:bg-emerald-400'
                        : 'border border-[#3A3B3F] bg-[#161719] text-[#F5F5F4] hover:border-[#E34843]'
                    }`}
                  >
                    <Trophy className="w-4 h-4" />
                    <span>
                      {finishing
                        ? 'Calculating Results...'
                        : answeredCount === questions.length
                        ? 'Complete Challenge'
                        : `Finish & Score (${answeredCount}/${questions.length})`}
                    </span>
                  </button>
                </div>
              </div>

              {/* Single-line clean keyboard & tier legend */}
              <div className="mt-4 text-[11px] text-[#ADAEAF] font-mono text-center">
                Tiers: Easy (+1) · Normal (+2) · Hard (+3) · ExtraHard (+5) — Keys 1–4 Select · Enter Submit
              </div>
            </div>
          </div>

          {/* Question Navigator Panel */}
          {showNavigator && (
            <div className="lg:col-span-4 rounded-xl border border-[#3A3B3F] bg-[#292A2D] p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-display font-bold text-[#F5F5F4]">
                  Question Navigator
                </h3>
                <span className="text-xs font-mono text-[#ADAEAF]">
                  {flaggedCount} Flagged
                </span>
              </div>

              <div className="flex items-center gap-3 text-[11px] text-[#ADAEAF] mb-4">
                <span>■ Current</span>
                <span>·</span>
                <span className="text-emerald-400">✓ Correct</span>
                <span>·</span>
                <span className="text-rose-400">✕ Wrong</span>
                <span>·</span>
                <span className="text-[#E34843]">⚑ Flagged</span>
              </div>

              <div className="grid grid-cols-5 sm:grid-cols-10 lg:grid-cols-5 gap-2 max-h-[380px] overflow-y-auto pr-1">
                {questions.map((q, idx) => {
                  const isCurr = idx === currentIndex;
                  let cellStyle =
                    'border-[#3A3B3F] bg-[#161719] text-[#ADAEAF]';
                  if (q.isAnswered && q.isCorrect) {
                    cellStyle =
                      'border-emerald-500/50 bg-emerald-500/15 text-emerald-300';
                  } else if (q.isAnswered && !q.isCorrect) {
                    cellStyle =
                      'border-rose-500/50 bg-rose-500/15 text-rose-300';
                  }
                  if (isCurr) {
                    cellStyle += ' ring-2 ring-[#E34843] font-bold text-[#F5F5F4]';
                  }
                  return (
                    <button
                      key={q.attemptQuestionId}
                      type="button"
                      onClick={() => handleNavigate(idx)}
                      className={`relative h-9 rounded-lg border font-mono text-xs tabular-nums flex items-center justify-center transition-colors ${cellStyle}`}
                      aria-label={`Jump to question ${idx + 1}`}
                    >
                      {idx + 1}
                      {q.isFlagged && (
                        <span
                          className="absolute -top-1 -right-1 text-[10px] text-[#E34843]"
                          aria-hidden="true"
                        >
                          ⚑
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Report Question Modal */}
        {reportModalOpen && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="report-modal-title"
          >
            <div className="w-full max-w-md rounded-xl border border-[#3A3B3F] bg-[#292A2D] p-6">
              <div className="flex items-center justify-between mb-4">
                <h3
                  id="report-modal-title"
                  className="text-base font-display font-bold text-[#F5F5F4] flex items-center gap-2"
                >
                  <HelpCircle className="w-4 h-4 text-[#E34843]" />
                  <span>Report Question for Verification</span>
                </h3>
                <button
                  type="button"
                  onClick={() => setReportModalOpen(false)}
                  className="text-xs text-[#ADAEAF] hover:text-[#F5F5F4]"
                >
                  Close
                </button>
              </div>

              {reportSent ? (
                <div className="py-4 text-sm text-emerald-400">
                  Thank you! Your report has been logged for administrator review.
                </div>
              ) : (
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    await onReportQuestion(currentQ.questionId, reportReason, reportDetails);
                    setReportSent(true);
                  }}
                  className="space-y-4"
                >
                  <div>
                    <label className="block text-xs font-medium text-[#ADAEAF] mb-1">
                      Reason
                    </label>
                    <select
                      value={reportReason}
                      onChange={(e) => setReportReason(e.target.value)}
                      className="w-full rounded-lg border border-[#3A3B3F] bg-[#161719] px-3 py-2 text-sm text-[#F5F5F4]"
                    >
                      <option value="Ambiguous phrasing">Ambiguous phrasing</option>
                      <option value="Factual accuracy check">Factual accuracy check</option>
                      <option value="Typo or formatting">Typo or formatting</option>
                      <option value="Diagram alignment">Diagram alignment</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[#ADAEAF] mb-1">
                      Additional Details
                    </label>
                    <textarea
                      rows={3}
                      value={reportDetails}
                      onChange={(e) => setReportDetails(e.target.value)}
                      placeholder="Describe the issue..."
                      className="w-full rounded-lg border border-[#3A3B3F] bg-[#161719] px-3 py-2 text-sm text-[#F5F5F4] placeholder:text-[#ADAEAF]/70"
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setReportModalOpen(false)}
                      className="px-4 py-2 text-xs font-medium rounded-lg border border-[#3A3B3F] text-[#ADAEAF] hover:text-[#F5F5F4]"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 text-xs font-semibold rounded-lg bg-[#E34843] text-[#F5F5F4] hover:opacity-90"
                    >
                      Submit Report
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
