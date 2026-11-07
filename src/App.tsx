import HERO_BG_IMG from './assets/images/arena_world_backdrop_1793995359233.jpg';
import React, { useEffect, useState, useCallback, useRef } from 'react';
import { onAuthStateChanged, signInWithPopup, signOut, type User } from 'firebase/auth';
import {
  Bike,
  Car,
  Code2,
  Cpu,
  Globe,
  User as UserIcon,
} from 'lucide-react';
import { auth, googleAuthProvider } from './lib/firebase.ts';
import {
  QuizArenaView,
  type ClientQuizQuestion,
  type QuizAttemptRecord,
} from './components/QuizArenaView.tsx';
import {
  ResultsDashboardView,
  type ResultsPayload,
} from './components/ResultsDashboardView.tsx';
import {
  AchievementsGalleryView,
  AdminConsoleView,
  LeaderboardsView,
} from './components/LeaderboardsAndAdminView.tsx';
import {
  InteractiveTopicStage,
  type MoodDifficultyOption,
  type StudentLoginData,
  type TopicNodeConfig,
} from './components/InteractiveTopicStage.tsx';
import { soundFX } from './utils/soundEffects.ts';
import type { QuizMode } from './utils/quizLogic.ts';

type ActiveTab = 'arena' | 'leaderboards' | 'achievements' | 'profile' | 'admin';
type ArenaScreenState = 'dashboard' | 'playing' | 'results';
function createStudentUid(): string {
  const randomBytes = crypto.getRandomValues(new Uint8Array(16));
  const randomId = Array.from(randomBytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
  return `student_${randomId}`;
}

function getOrCreateGuestUid(): string {
  if (typeof window === 'undefined') return 'guest_arena_default';
  let existing = localStorage.getItem('ka_guest_uid');
  if (!existing) {
    existing = createStudentUid();
    localStorage.setItem('ka_guest_uid', existing);
  }
  return existing;
}

function getInitialStudentInfo(): StudentLoginData | null {
  if (typeof window === 'undefined') return null;
  const name = localStorage.getItem('ka_student_name') || '';
  const studentClass = localStorage.getItem('ka_student_class') || '';
  const schoolCollege = localStorage.getItem('ka_school_college') || '';
  if (name && studentClass && schoolCollege) {
    return { name, studentClass, schoolCollege };
  }
  return null;
}

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('arena');
  const [screenState, setScreenState] = useState<ArenaScreenState>('dashboard');
  const [darkMode] = useState<boolean>(true);

  // Auth & Student Actor State
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const idTokenRef = useRef<string | null>(null);
  const [guestUid, setGuestUid] = useState<string>(() => getOrCreateGuestUid());
  const [studentInfo, setStudentInfo] = useState<StudentLoginData | null>(() =>
    getInitialStudentInfo()
  );
  const [guestName, setGuestName] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return (
        localStorage.getItem('ka_student_name') ||
        localStorage.getItem('ka_guest_name') ||
        'Student Challenger'
      );
    }
    return 'Student Challenger';
  });

  // Overview Data
  const [overview, setOverview] = useState<any | null>(null);
  const [loadingOverview, setLoadingOverview] = useState<boolean>(true);
  const [errorBanner, setErrorBanner] = useState<string | null>(null);

  // Challenge Configuration State (Default: 20-question specific topic quiz)
  const [selectedMode, setSelectedMode] = useState<QuizMode>('category');
  const [selectedCategory, setSelectedCategory] = useState<string>('computers');
  const [selectedPracticeDiff, setSelectedPracticeDiff] = useState<string>('Easy');
  const [startingQuiz, setStartingQuiz] = useState<boolean>(false);
  const [divingState, setDivingState] = useState<{
    topic: TopicNodeConfig;
    difficulty: MoodDifficultyOption;
  } | null>(null);

  // Active Attempt & Results State
  const [activeAttempt, setActiveAttempt] = useState<QuizAttemptRecord | null>(null);
  const [activeQuestions, setActiveQuestions] = useState<ClientQuizQuestion[]>([]);
  const [completedResults, setCompletedResults] = useState<ResultsPayload | null>(null);

  // Profile Editor State
  const [editDisplayName, setEditDisplayName] = useState<string>('');
  const [editStudentClass, setEditStudentClass] = useState<string>('');
  const [editSchoolCollege, setEditSchoolCollege] = useState<string>('');
  const [profileSavedMsg, setProfileSavedMsg] = useState<string>('');

  // Sync dark mode class on <html>
  useEffect(() => {
    const root = document.documentElement;
    if (darkMode) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [darkMode]);

  // Mirror game state to document.body.dataset.state and scroll to top on view change
  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.body.dataset.state =
        screenState === 'playing'
          ? 'playing'
          : screenState === 'results'
          ? 'gameover'
          : 'title';
    }
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
    }
  }, [screenState, activeTab]);

  const apiFetch = useCallback(
    async (url: string, options: RequestInit = {}) => {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'X-Guest-Uid': guestUid,
        'X-Student-Identity-Encoding': 'uri',
        'X-Guest-Name': encodeURIComponent(studentInfo?.name || guestName),
        'X-Student-Class': encodeURIComponent(studentInfo?.studentClass || ''),
        'X-School-College': encodeURIComponent(studentInfo?.schoolCollege || ''),
        ...(options.headers as Record<string, string>),
      };

      if (idTokenRef.current) {
        headers['Authorization'] = `Bearer ${idTokenRef.current}`;
      }

      const res = await fetch(url, {
        ...options,
        headers,
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || `Request failed (${res.status})`);
      }
      return data;
    },
    [guestUid, guestName, studentInfo]
  );

  const loadDashboardOverview = useCallback(async () => {
    setLoadingOverview(true);
    setErrorBanner(null);
    try {
      const data = await apiFetch('/api/overview');
      setOverview(data);
      if (data.profile) {
        setEditDisplayName(data.profile.displayName || studentInfo?.name || '');
        setEditStudentClass(data.profile.studentClass || studentInfo?.studentClass || '');
        setEditSchoolCollege(data.profile.schoolCollege || studentInfo?.schoolCollege || '');
        if (
          !studentInfo &&
          data.profile.displayName &&
          data.profile.studentClass &&
          data.profile.schoolCollege
        ) {
          const synced = {
            name: data.profile.displayName,
            studentClass: data.profile.studentClass,
            schoolCollege: data.profile.schoolCollege,
          };
          setStudentInfo(synced);
        }
      }
    } catch (err: any) {
      setErrorBanner(err.message || 'Failed to load Arena telemetry.');
    } finally {
      setLoadingOverview(false);
    }
  }, [apiFetch, studentInfo]);

  // Listen to Firebase Auth state
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (usr) => {
      setFirebaseUser(usr);
      if (usr) {
        try {
          idTokenRef.current = await usr.getIdToken();
        } catch {
          idTokenRef.current = null;
        }
      } else {
        idTokenRef.current = null;
      }
      loadDashboardOverview();
    });
    return () => unsub();
  }, [loadDashboardOverview]);

  const handleStudentLogin = useCallback(
    async (data: StudentLoginData) => {
      const res = await fetch('/api/student/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Guest-Uid': guestUid,
          'X-Student-Identity-Encoding': 'uri',
          'X-Guest-Name': encodeURIComponent(data.name),
          'X-Student-Class': encodeURIComponent(data.studentClass),
          'X-School-College': encodeURIComponent(data.schoolCollege),
          ...(idTokenRef.current ? { Authorization: `Bearer ${idTokenRef.current}` } : {}),
        },
        body: JSON.stringify({
          displayName: data.name,
          studentClass: data.studentClass,
          schoolCollege: data.schoolCollege,
          avatar: 'shield-cyan',
        }),
      });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(payload.error || 'Failed to save student login.');
      }

      if (typeof window !== 'undefined') {
        localStorage.setItem('ka_student_name', data.name);
        localStorage.setItem('ka_guest_name', data.name);
        localStorage.setItem('ka_student_class', data.studentClass);
        localStorage.setItem('ka_school_college', data.schoolCollege);
      }

      setGuestName(data.name);
      setStudentInfo(data);
      setEditDisplayName(data.name);
      setEditStudentClass(data.studentClass);
      setEditSchoolCollege(data.schoolCollege);
      await loadDashboardOverview();
    },
    [guestUid, loadDashboardOverview]
  );

  const handleSwitchStudent = useCallback(() => {
    const freshUid = createStudentUid();
    if (typeof window !== 'undefined') {
      localStorage.setItem('ka_guest_uid', freshUid);
      localStorage.removeItem('ka_student_name');
      localStorage.removeItem('ka_guest_name');
      localStorage.removeItem('ka_student_class');
      localStorage.removeItem('ka_school_college');
    }
    setGuestUid(freshUid);
    setStudentInfo(null);
    setGuestName('Student Challenger');
    setActiveTab('arena');
    setScreenState('dashboard');
  }, []);

  const handleStartChallenge = useCallback(
    async (
      overrideMode?: QuizMode,
      overrideCategory?: string,
      overrideDifficulty?: string
    ) => {
      setStartingQuiz(true);
      setErrorBanner(null);
      try {
        const modeToRun = overrideMode || selectedMode;
        const catToRun =
          overrideCategory ||
          (modeToRun === 'full_arena' || modeToRun === 'boss_rush'
            ? 'all'
            : selectedCategory);
        const diffToRun = overrideDifficulty || selectedPracticeDiff;

        const state = await apiFetch('/api/challenges/start', {
          method: 'POST',
          body: JSON.stringify({
            mode: modeToRun,
            categorySlug: catToRun,
            practiceDifficulty: diffToRun,
          }),
        });

        setActiveAttempt(state.attempt);
        setActiveQuestions(state.questions);
        setCompletedResults(null);
        setActiveTab('arena');
        setScreenState('playing');
      } catch (err: any) {
        setErrorBanner(err.message || 'Could not start challenge.');
      } finally {
        setStartingQuiz(false);
      }
    },
    [apiFetch, selectedMode, selectedCategory, selectedPracticeDiff]
  );

  const handleLaunchThemeAndDifficulty = useCallback(
    async (topic: TopicNodeConfig, difficultyOpt: MoodDifficultyOption) => {
      if (startingQuiz || divingState) return;
      soundFX.playSelect();
      setSelectedMode('category');
      setSelectedCategory(topic.slug);
      setSelectedPracticeDiff(difficultyOpt.difficulty);
      setDivingState({ topic, difficulty: difficultyOpt });
      setStartingQuiz(true);
      setErrorBanner(null);

      try {
        const [state] = await Promise.all([
          apiFetch('/api/challenges/start', {
            method: 'POST',
            body: JSON.stringify({
              mode: 'category',
              categorySlug: topic.slug,
              practiceDifficulty: difficultyOpt.difficulty,
            }),
          }),
          new Promise((resolve) => setTimeout(resolve, 620)),
        ]);

        setActiveAttempt(state.attempt);
        setActiveQuestions(state.questions);
        setCompletedResults(null);
        setActiveTab('arena');
        setScreenState('playing');
      } catch (err: any) {
        setErrorBanner(err.message || 'Could not start topic challenge.');
      } finally {
        setDivingState(null);
        setStartingQuiz(false);
      }
    },
    [apiFetch, startingQuiz, divingState]
  );

  // Support ?autostart=1 for instant verification jump (launches 20-question topic quiz)
  const autostartTriggered = useRef(false);
  useEffect(() => {
    if (
      !autostartTriggered.current &&
      !loadingOverview &&
      typeof window !== 'undefined' &&
      new URLSearchParams(window.location.search).get('autostart') === '1'
    ) {
      autostartTriggered.current = true;
      handleStartChallenge('category', 'computers', 'Easy');
    }
  }, [loadingOverview, handleStartChallenge]);

  const handleSubmitAnswer = async (
    attemptQuestionId: number,
    selectedOptionId: number,
    questionTimeSec: number,
    totalElapsedSec: number
  ) => {
    if (!activeAttempt) return;
    const res = await apiFetch(
      `/api/challenges/${encodeURIComponent(activeAttempt.attemptUuid)}/answer`,
      {
        method: 'POST',
        body: JSON.stringify({
          attemptQuestionId,
          selectedOptionId,
          questionTimeSec,
          totalElapsedSec,
        }),
      }
    );

    if (res.isCorrect) {
      soundFX.playCorrect();
    } else {
      soundFX.playIncorrect();
    }

    setActiveAttempt((prev) =>
      prev
        ? {
            ...prev,
            currentScore: res.currentScore,
            correctCount: res.correctCount,
            incorrectCount: res.incorrectCount,
            unansweredCount: res.unansweredCount,
            accuracyPercent: res.accuracyPercent,
          }
        : null
    );

    setActiveQuestions((prev) =>
      prev.map((q) =>
        q.attemptQuestionId === attemptQuestionId
          ? {
              ...q,
              isAnswered: true,
              selectedOptionId: res.selectedOptionId,
              correctOptionId: res.correctOptionId,
              isCorrect: res.isCorrect,
              pointsEarned: res.pointsEarned,
              explanation: res.explanation,
            }
          : q
      )
    );
  };

  const handleToggleFlag = async (attemptQuestionId: number, isFlagged: boolean) => {
    if (!activeAttempt) return;
    await apiFetch(
      `/api/challenges/${encodeURIComponent(activeAttempt.attemptUuid)}/flag`,
      {
        method: 'POST',
        body: JSON.stringify({ attemptQuestionId, isFlagged }),
      }
    );
    setActiveQuestions((prev) =>
      prev.map((q) =>
        q.attemptQuestionId === attemptQuestionId ? { ...q, isFlagged } : q
      )
    );
  };

  const handleSaveProgress = async (currentIndex: number, timeSpentSec: number) => {
    if (!activeAttempt) return;
    await apiFetch(
      `/api/challenges/${encodeURIComponent(activeAttempt.attemptUuid)}/progress`,
      {
        method: 'POST',
        body: JSON.stringify({ currentIndex, timeSpentSec }),
      }
    ).catch(() => {});
  };

  const handleFinishChallenge = async (totalElapsedSec: number) => {
    if (!activeAttempt) return;
    try {
      const results = await apiFetch(
        `/api/challenges/${encodeURIComponent(activeAttempt.attemptUuid)}/complete`,
        {
          method: 'POST',
          body: JSON.stringify({ timeSpentSec: totalElapsedSec }),
        }
      );
      setCompletedResults(results);
      setScreenState('results');
      loadDashboardOverview();
    } catch (err: any) {
      setErrorBanner(err.message || 'Failed to finalize challenge.');
    }
  };

  const handleReportQuestion = async (
    questionId: number,
    reason: string,
    details: string
  ) => {
    await apiFetch('/api/questions/report', {
      method: 'POST',
      body: JSON.stringify({ questionId, reason, details }),
    });
  };

  const handleGoogleSignIn = async () => {
    setErrorBanner(null);
    try {
      const cred = await signInWithPopup(auth, googleAuthProvider);
      idTokenRef.current = await cred.user.getIdToken();
      await apiFetch('/api/auth/transfer-guest', {
        method: 'POST',
        body: JSON.stringify({ guestUid }),
      });
      await loadDashboardOverview();
    } catch (err: any) {
      setErrorBanner(err.message || 'Google Sign-In could not be completed.');
    }
  };

  const profile = overview?.profile || {
    displayName: studentInfo?.name || guestName,
    studentClass: studentInfo?.studentClass || '',
    schoolCollege: studentInfo?.schoolCollege || '',
    xp: 0,
    level: 1,
    currentLevelXp: 0,
    nextLevelXp: 250,
    progressPercent: 0,
    totalCompletedChallenges: 0,
    bestScore: 0,
    averageAccuracy: 0,
    currentStreak: 0,
    categoryMasteryJson: '{}',
  };

  const isPureStartScreen = activeTab === 'arena' && screenState === 'dashboard';

  return (
    <div className="min-h-screen flex flex-col bg-[#161719] text-[#F5F5F4] transition-colors relative">
      {/* Subtle Full-Website Architectural Backdrop Image */}
      <img
        src={HERO_BG_IMG}
        alt=""
        aria-hidden="true"
        referrerPolicy="no-referrer"
        onError={(e) => {
          e.currentTarget.style.display = 'none';
        }}
        className="fixed inset-0 w-full h-full object-cover opacity-15 pointer-events-none"
      />
      <div className="fixed inset-0 bg-gradient-to-b from-[#161719]/92 via-[#161719]/88 to-[#161719]/96 pointer-events-none" />

      {/* Top Bar is hidden on the pure starting page so only QUIZ ARENA - BCA and the 5 floating options appear */}
      {!isPureStartScreen && (
        <header className="relative z-30 flex items-center justify-between gap-8 px-6 py-4 border-b border-[#3A3B3F] bg-[#292A2D]/95 sticky top-0">
          {/* Zone 1: Single text element wordmark */}
          <a
            href="#arena"
            onClick={(e) => {
              e.preventDefault();
              setActiveTab('arena');
              setScreenState('dashboard');
            }}
            className="text-lg font-display font-extrabold tracking-tight text-[#F5F5F4] whitespace-nowrap shrink-0"
          >
            QUIZ ARENA - BCA
          </a>

          {/* Zone 2: 5 clean single-line text navigation links */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-[#ADAEAF]">
            <a
              href="#arena"
              onClick={(e) => {
                e.preventDefault();
                setActiveTab('arena');
                setScreenState('dashboard');
              }}
              className={`hover:text-[#F5F5F4] transition-colors whitespace-nowrap shrink-0 ${
                activeTab === 'arena'
                  ? 'text-[#F5F5F4] underline underline-offset-8 decoration-[#E34843] decoration-2'
                  : ''
              }`}
            >
              Themes
            </a>
            <a
              href="#leaderboards"
              onClick={(e) => {
                e.preventDefault();
                setActiveTab('leaderboards');
              }}
              className={`hover:text-[#F5F5F4] transition-colors whitespace-nowrap shrink-0 ${
                activeTab === 'leaderboards'
                  ? 'text-[#F5F5F4] underline underline-offset-8 decoration-[#E34843] decoration-2'
                  : ''
              }`}
            >
              Leaderboards
            </a>
            <a
              href="#achievements"
              onClick={(e) => {
                e.preventDefault();
                setActiveTab('achievements');
              }}
              className={`hover:text-[#F5F5F4] transition-colors whitespace-nowrap shrink-0 ${
                activeTab === 'achievements'
                  ? 'text-[#F5F5F4] underline underline-offset-8 decoration-[#E34843] decoration-2'
                  : ''
              }`}
            >
              Achievements
            </a>
            <a
              href="#profile"
              onClick={(e) => {
                e.preventDefault();
                setActiveTab('profile');
              }}
              className={`hover:text-[#F5F5F4] transition-colors whitespace-nowrap shrink-0 ${
                activeTab === 'profile'
                  ? 'text-[#F5F5F4] underline underline-offset-8 decoration-[#E34843] decoration-2'
                  : ''
              }`}
            >
              Student Profile
            </a>
            {overview?.isAdmin && (
              <a
                href="#admin"
                onClick={(e) => {
                  e.preventDefault();
                  setActiveTab('admin');
                }}
                className={`hover:text-[#F5F5F4] transition-colors whitespace-nowrap shrink-0 ${
                  activeTab === 'admin'
                    ? 'text-[#F5F5F4] underline underline-offset-8 decoration-[#E34843] decoration-2'
                    : ''
                }`}
              >
                Question Bank
              </a>
            )}
          </nav>

          {/* Zone 3: 1 primary action */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              disabled={startingQuiz}
              onClick={() => {
                setActiveTab('arena');
                setScreenState('dashboard');
              }}
              className="px-4 py-2 text-xs font-bold text-[#F5F5F4] bg-[#E34843] rounded-lg hover:bg-[#E34843]/90 transition-colors whitespace-nowrap shrink-0"
            >
              Change Theme
            </button>
          </div>
        </header>
      )}

      {/* Global Error Alert */}
      {errorBanner && (
        <div className="max-w-6xl mx-auto w-full px-4 sm:px-6 pt-4">
          <div className="rounded-lg border border-rose-500/40 bg-rose-500/10 px-4 py-3 text-xs text-rose-300 flex items-center justify-between">
            <span>{errorBanner}</span>
            <button
              type="button"
              onClick={() => setErrorBanner(null)}
              className="font-mono underline ml-4"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Main Content Viewport */}
      <main className="relative z-10 flex-1">
        {activeTab === 'leaderboards' ? (
          <LeaderboardsView apiFetch={apiFetch} />
        ) : activeTab === 'achievements' ? (
          <AchievementsGalleryView achievements={overview?.achievements || []} />
        ) : activeTab === 'admin' && overview?.isAdmin ? (
          <AdminConsoleView apiFetch={apiFetch} />
        ) : activeTab === 'profile' ? (
          <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6">
            <div className="rounded-xl border border-[#3A3B3F] bg-[#292A2D] p-6 sm:p-8 space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-4 pb-5 border-b border-[#3A3B3F]">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-xl bg-[#E34843]/15 border border-[#E34843]/40 flex items-center justify-center text-[#E34843]">
                    <UserIcon className="w-6 h-6" />
                  </div>
                  <div>
                    <h1 className="text-xl sm:text-2xl font-display font-bold text-[#F5F5F4]">
                      {profile.displayName}
                    </h1>
                    <div className="text-xs text-[#ADAEAF] font-mono">
                      {profile.studentClass
                        ? `${profile.studentClass} · ${profile.schoolCollege}`
                        : firebaseUser
                        ? `Authenticated Account · ${firebaseUser.email}`
                        : `Student Session · Local + Cloud Synced`}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleSwitchStudent}
                    className="px-3.5 py-2 text-xs font-semibold rounded-lg border border-[#3A3B3F] bg-[#161719] text-[#F5F5F4] hover:border-[#E34843] transition-colors"
                  >
                    Switch Student Login
                  </button>
                  {!firebaseUser && (
                    <button
                      type="button"
                      onClick={handleGoogleSignIn}
                      className="px-4 py-2 text-xs font-semibold rounded-lg bg-[#E34843] text-[#F5F5F4] hover:bg-[#E34843]/90 transition-colors"
                    >
                      Sign In with Google
                    </button>
                  )}
                </div>
              </div>

              {/* Edit Student Details (Name, Class, School/College) */}
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  setProfileSavedMsg('');
                  const cleanName = editDisplayName.trim() || 'Student Challenger';
                  const cleanClass = editStudentClass.trim();
                  const cleanSchool = editSchoolCollege.trim();
                  setGuestName(cleanName);
                  if (typeof window !== 'undefined') {
                    localStorage.setItem('ka_student_name', cleanName);
                    localStorage.setItem('ka_guest_name', cleanName);
                    localStorage.setItem('ka_student_class', cleanClass);
                    localStorage.setItem('ka_school_college', cleanSchool);
                  }
                  if (cleanName && cleanClass && cleanSchool) {
                    setStudentInfo({
                      name: cleanName,
                      studentClass: cleanClass,
                      schoolCollege: cleanSchool,
                    });
                  }
                  await apiFetch('/api/profile', {
                    method: 'PUT',
                    body: JSON.stringify({
                      displayName: cleanName,
                      studentClass: cleanClass,
                      schoolCollege: cleanSchool,
                      avatar: profile.avatar || 'shield-cyan',
                    }),
                  });
                  setProfileSavedMsg('Student details saved & synced to Leaderboard!');
                  loadDashboardOverview();
                }}
                className="space-y-4"
              >
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-[#ADAEAF] mb-1">
                      Student Name
                    </label>
                    <input
                      type="text"
                      value={editDisplayName}
                      onChange={(e) => setEditDisplayName(e.target.value)}
                      className="w-full rounded-lg border border-[#3A3B3F] bg-[#161719] px-3.5 py-2 text-sm text-[#F5F5F4]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[#ADAEAF] mb-1">
                      Class / Semester
                    </label>
                    <input
                      type="text"
                      value={editStudentClass}
                      onChange={(e) => setEditStudentClass(e.target.value)}
                      placeholder="e.g. BCA 1st Year"
                      className="w-full rounded-lg border border-[#3A3B3F] bg-[#161719] px-3.5 py-2 text-sm text-[#F5F5F4] placeholder:text-[#ADAEAF]/60"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[#ADAEAF] mb-1">
                      School / College
                    </label>
                    <input
                      type="text"
                      value={editSchoolCollege}
                      onChange={(e) => setEditSchoolCollege(e.target.value)}
                      placeholder="e.g. Sacred Heart College"
                      className="w-full rounded-lg border border-[#3A3B3F] bg-[#161719] px-3.5 py-2 text-sm text-[#F5F5F4] placeholder:text-[#ADAEAF]/60"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    type="submit"
                    className="px-4 py-2 text-xs font-semibold rounded-lg bg-[#E34843] text-[#F5F5F4] hover:bg-[#E34843]/90 transition-colors"
                  >
                    Save Student Details
                  </button>
                  {profileSavedMsg && (
                    <span className="text-xs font-mono text-emerald-400">{profileSavedMsg}</span>
                  )}
                </div>
              </form>

              {/* Recent Challenge History */}
              <div className="pt-4 border-t border-[#3A3B3F]">
                <h2 className="text-base font-display font-bold text-[#F5F5F4] mb-3">
                  Recent Challenge History
                </h2>
                {overview?.recentAttempts?.length ? (
                  <div className="divide-y divide-[#3A3B3F] text-xs">
                    {overview.recentAttempts.map((att: any) => (
                      <div
                        key={att.attemptUuid}
                        className="py-3 flex items-center justify-between"
                      >
                        <div>
                          <span className="font-semibold uppercase text-[#F5F5F4]">
                            {att.mode.replace('_', ' ')}
                          </span>
                          <span className="text-[#ADAEAF]"> · {att.categorySlug}</span>
                        </div>
                        <div className="font-mono tabular-nums flex items-center gap-4">
                          <span className="text-[#E34843] font-bold">
                            {att.currentScore}/{att.maxPossibleScore} PTS
                          </span>
                          <span className="text-emerald-400">{att.accuracyPercent}% ACC</span>
                          <span className="text-[#ADAEAF]">{att.timeSpentSec}s</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-[#ADAEAF]">
                    No completed challenges yet. Start your first challenge from the Arena dashboard!
                  </p>
                )}
              </div>
            </div>
          </div>
        ) : screenState === 'playing' && activeAttempt ? (
          <div key={activeAttempt.attemptUuid} className="ka-dive-enter">
            <QuizArenaView
              attempt={activeAttempt}
              questions={activeQuestions}
              onSubmitAnswer={handleSubmitAnswer}
              onToggleFlag={handleToggleFlag}
              onSaveProgress={handleSaveProgress}
              onFinishChallenge={handleFinishChallenge}
              onReportQuestion={handleReportQuestion}
              onExitToDashboard={() => {
                setScreenState('dashboard');
                loadDashboardOverview();
              }}
            />
          </div>
        ) : screenState === 'results' && completedResults ? (
          <ResultsDashboardView
            results={completedResults}
            onRetryFreshChallenge={() =>
              handleStartChallenge(
                completedResults.attempt.mode as QuizMode,
                completedResults.attempt.categorySlug,
                completedResults.attempt.practiceDifficulty
              )
            }
            onReturnHome={() => {
              setScreenState('dashboard');
              loadDashboardOverview();
            }}
            onViewLeaderboards={() => setActiveTab('leaderboards')}
          />
        ) : (
          /* Starting Page: Student Login Page -> QUIZ ARENA - BCA & 5 Floating Theme Options -> Mood Difficulty Selector */
          <InteractiveTopicStage
            heroBgImg={HERO_BG_IMG}
            startingQuiz={startingQuiz}
            divingState={divingState}
            studentInfo={studentInfo}
            onStudentLogin={handleStudentLogin}
            onSwitchStudent={handleSwitchStudent}
            onOpenLeaderboards={() => setActiveTab('leaderboards')}
            onLaunchThemeAndDifficulty={handleLaunchThemeAndDifficulty}
          />
        )}
      </main>
    </div>
  );
}
