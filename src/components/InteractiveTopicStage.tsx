import React, { useState, useRef } from 'react';
import {
  Bike,
  Car,
  CheckCircle2,
  Code2,
  Cpu,
  Globe,
  GraduationCap,
  LogIn,
  Play,
  School,
  Trophy,
  UserCheck,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { soundFX } from '../utils/soundEffects.ts';
import type { DifficultyLevel } from '../utils/quizLogic.ts';

const IMG_COMPUTERS = '/src/assets/images/card_computing_systems_1793986663781.jpg';
const IMG_CARS = '/src/assets/images/cat_performance_car_1794028679181.jpg';
const IMG_BIKES = '/src/assets/images/cat_sports_motorcycle_1794028679268.jpg';
const IMG_TRAVELING = '/src/assets/images/cat_aircraft_travel_1794028681554.jpg';
const IMG_PROGRAMMING = '/src/assets/images/cat_programming_workspace_1794028681499.jpg';

export interface TopicNodeConfig {
  slug: 'computers' | 'cars' | 'motorcycles' | 'traveling' | 'programming';
  shortName: string;
  name: string;
  plateCode: string;
  tagline: string;
  description: string;
  imageUrl: string;
  soundLabel: string;
  accentHex: string;
  borderClass: string;
  bgGlowClass: string;
  textClass: string;
  badgeBgClass: string;
}

export const TOPIC_NODES: TopicNodeConfig[] = [
  {
    slug: 'computers',
    shortName: 'COMPUTERS',
    name: 'COMPUTERS',
    plateCode: 'ARENA // 01',
    tagline: 'Hardware · Motherboards · Systems · Architecture',
    description:
      'Explore computer hardware, motherboards, processors, memory systems, and digital architecture.',
    imageUrl: IMG_COMPUTERS,
    soundLabel: 'Electronic Boot-Up',
    accentHex: '#E34843',
    borderClass: 'border-[#3A3B3F] hover:border-[#E34843]/70',
    bgGlowClass: 'from-[#292A2D] via-[#292A2D] to-[#161719]',
    textClass: 'text-[#E34843]',
    badgeBgClass: 'bg-[#E34843] text-[#F5F5F4]',
  },
  {
    slug: 'cars',
    shortName: 'CARS',
    name: 'CARS',
    plateCode: 'ARENA // 02',
    tagline: 'Performance Engineering · Engines · Dynamics',
    description:
      'Test your knowledge of performance automobiles, engines, drivetrains, and road engineering.',
    imageUrl: IMG_CARS,
    soundLabel: 'Engine Ignition',
    accentHex: '#E34843',
    borderClass: 'border-[#3A3B3F] hover:border-[#E34843]/70',
    bgGlowClass: 'from-[#292A2D] via-[#292A2D] to-[#161719]',
    textClass: 'text-[#E34843]',
    badgeBgClass: 'bg-[#E34843] text-[#F5F5F4]',
  },
  {
    slug: 'motorcycles',
    shortName: 'BIKES',
    name: 'BIKES',
    plateCode: 'ARENA // 03',
    tagline: 'Superbikes · Throttle Dynamics · Track Physics',
    description:
      'Master sports motorcycles, cornering physics, valvetrain engineering, and two-wheel dynamics.',
    imageUrl: IMG_BIKES,
    soundLabel: 'Engine Revving',
    accentHex: '#E34843',
    borderClass: 'border-[#3A3B3F] hover:border-[#E34843]/70',
    bgGlowClass: 'from-[#292A2D] via-[#292A2D] to-[#161719]',
    textClass: 'text-[#E34843]',
    badgeBgClass: 'bg-[#E34843] text-[#F5F5F4]',
  },
  {
    slug: 'traveling',
    shortName: 'TRAVELING',
    name: 'TRAVELING',
    plateCode: 'ARENA // 04',
    tagline: 'Aviation · Global Destinations · World Geography',
    description:
      'Journey across global flight routes, world capitals, iconic landmarks, and physical geography.',
    imageUrl: IMG_TRAVELING,
    soundLabel: 'Airplane Flyby',
    accentHex: '#E34843',
    borderClass: 'border-[#3A3B3F] hover:border-[#E34843]/70',
    bgGlowClass: 'from-[#292A2D] via-[#292A2D] to-[#161719]',
    textClass: 'text-[#E34843]',
    badgeBgClass: 'bg-[#E34843] text-[#F5F5F4]',
  },
  {
    slug: 'programming',
    shortName: 'PROGRAMMING LANGUAGES',
    name: 'PROGRAMMING LANGUAGES',
    plateCode: 'ARENA // 05',
    tagline: 'Syntax · Algorithms · Compilers · Systems',
    description:
      'Dive into modern programming languages, algorithms, data structures, and software architecture.',
    imageUrl: IMG_PROGRAMMING,
    soundLabel: 'Mechanical Keystrokes',
    accentHex: '#E34843',
    borderClass: 'border-[#3A3B3F] hover:border-[#E34843]/70',
    bgGlowClass: 'from-[#292A2D] via-[#292A2D] to-[#161719]',
    textClass: 'text-[#E34843]',
    badgeBgClass: 'bg-[#E34843] text-[#F5F5F4]',
  },
];

export interface MoodDifficultyOption {
  difficulty: DifficultyLevel;
  displayLabel: 'EASY' | 'NORMAL' | 'HARD' | 'VERY HARD';
  moodTitle: string;
  audienceDescription: string;
  colorName: string;
  pointsPerQ: number;
  totalMaxPts: number;
  symbol: string;
  accentHex: string;
  cardClass: string;
  badgeClass: string;
  textClass: string;
}

export const MOOD_DIFFICULTY_OPTIONS: MoodDifficultyOption[] = [
  {
    difficulty: 'Easy',
    displayLabel: 'EASY',
    moodTitle: 'EASY',
    audienceDescription: 'A perfect place to begin your journey.',
    colorName: 'TIER I',
    pointsPerQ: 1,
    totalMaxPts: 20,
    symbol: '●',
    accentHex: '#E34843',
    cardClass:
      'border-[#3A3B3F] bg-[#292A2D] hover:border-[#E34843]/70',
    badgeClass: 'bg-[#E34843] text-[#F5F5F4]',
    textClass: 'text-[#E34843]',
  },
  {
    difficulty: 'Normal',
    displayLabel: 'NORMAL',
    moodTitle: 'NORMAL',
    audienceDescription: 'Put your everyday knowledge to the test.',
    colorName: 'TIER II',
    pointsPerQ: 2,
    totalMaxPts: 40,
    symbol: '◆',
    accentHex: '#E34843',
    cardClass:
      'border-[#3A3B3F] bg-[#292A2D] hover:border-[#E34843]/70',
    badgeClass: 'bg-[#E34843] text-[#F5F5F4]',
    textClass: 'text-[#E34843]',
  },
  {
    difficulty: 'Hard',
    displayLabel: 'HARD',
    moodTitle: 'HARD',
    audienceDescription: 'Only the well-prepared will survive.',
    colorName: 'TIER III',
    pointsPerQ: 3,
    totalMaxPts: 60,
    symbol: '▲',
    accentHex: '#E34843',
    cardClass:
      'border-[#3A3B3F] bg-[#292A2D] hover:border-[#E34843]/70',
    badgeClass: 'bg-[#E34843] text-[#F5F5F4]',
    textClass: 'text-[#E34843]',
  },
  {
    difficulty: 'Very Hard',
    displayLabel: 'VERY HARD',
    moodTitle: 'VERY HARD',
    audienceDescription: 'The ultimate challenge. Only for the fearless.',
    colorName: 'TIER IV',
    pointsPerQ: 5,
    totalMaxPts: 100,
    symbol: '★',
    accentHex: '#E34843',
    cardClass:
      'border-[#3A3B3F] bg-[#292A2D] hover:border-[#E34843]/70',
    badgeClass: 'bg-[#E34843] text-[#F5F5F4]',
    textClass: 'text-[#E34843]',
  },
];

export interface StudentLoginData {
  name: string;
  studentClass: string;
  schoolCollege: string;
}

interface InteractiveTopicStageProps {
  heroBgImg: string;
  startingQuiz: boolean;
  divingState: { topic: TopicNodeConfig; difficulty: MoodDifficultyOption } | null;
  studentInfo: StudentLoginData | null;
  onStudentLogin: (data: StudentLoginData) => Promise<void>;
  onSwitchStudent: () => void;
  onOpenLeaderboards: () => void;
  onLaunchThemeAndDifficulty: (
    topic: TopicNodeConfig,
    difficultyOption: MoodDifficultyOption
  ) => void;
}

const PRESET_CLASSES = [
  'BCA 1st Year',
  'BCA 2nd Year',
  'BCA 3rd Year',
  'BSc CS',
  'MCA',
  'Class 12',
];

export const InteractiveTopicStage: React.FC<InteractiveTopicStageProps> = ({
  heroBgImg,
  startingQuiz,
  divingState,
  studentInfo,
  onStudentLogin,
  onSwitchStudent,
  onOpenLeaderboards,
  onLaunchThemeAndDifficulty,
}) => {
  const [selectedTheme, setSelectedTheme] = useState<TopicNodeConfig | null>(null);
  const [selectedDifficulty, setSelectedDifficulty] = useState<MoodDifficultyOption | null>(null);
  const [hoveredSlug, setHoveredSlug] = useState<TopicNodeConfig['slug'] | null>(null);
  const [soundMuted, setSoundMuted] = useState<boolean>(() => soundFX.isMuted());
  const stageRef = useRef<HTMLDivElement | null>(null);

  // Student Login Form State (Unchanged)
  const [loginName, setLoginName] = useState<string>(studentInfo?.name || '');
  const [loginClass, setLoginClass] = useState<string>(studentInfo?.studentClass || '');
  const [loginSchool, setLoginSchool] = useState<string>(studentInfo?.schoolCollege || '');
  const [loginSubmitting, setLoginSubmitting] = useState<boolean>(false);
  const [loginError, setLoginError] = useState<string>('');

  const renderTopicIcon = (slug: string, className = 'w-5 h-5') => {
    switch (slug) {
      case 'computers':
        return <Cpu className={className} />;
      case 'cars':
        return <Car className={className} />;
      case 'motorcycles':
        return <Bike className={className} />;
      case 'traveling':
        return <Globe className={className} />;
      case 'programming':
        return <Code2 className={className} />;
      default:
        return <Cpu className={className} />;
    }
  };

  const renderCategoryVisualOverlay = (
    slug: TopicNodeConfig['slug'],
    isActive: boolean
  ) => {
    switch (slug) {
      case 'computers':
        // Subtle glowing circuits and digital particles
        return (
          <svg
            viewBox="0 0 320 160"
            className={`absolute inset-0 w-full h-full pointer-events-none transition-opacity duration-300 ${
              isActive ? 'opacity-95' : 'opacity-55 group-hover:opacity-85'
            }`}
            aria-hidden="true"
          >
            <g stroke="#E34843" strokeWidth="1.2" fill="none" className="ka-circuit-pulse">
              <path d="M 18 130 H 72 L 92 110 H 150" strokeOpacity="0.65" />
              <path d="M 210 34 H 265 L 285 54 H 308" strokeOpacity="0.6" />
              <path d="M 40 42 H 88 L 106 60 H 148" strokeOpacity="0.45" />
              <circle cx="72" cy="130" r="3" fill="#E34843" />
              <circle cx="150" cy="110" r="3.5" fill="#E34843" />
              <circle cx="265" cy="34" r="3" fill="#E34843" />
              <circle cx="106" cy="60" r="2.5" fill="#E34843" />
            </g>
          </svg>
        );
      case 'cars':
        // Headlights turning on and subtle vehicle motion lines
        return (
          <svg
            viewBox="0 0 320 160"
            className={`absolute inset-0 w-full h-full pointer-events-none transition-opacity duration-300 ${
              isActive ? 'opacity-100' : 'opacity-50 group-hover:opacity-90'
            }`}
            aria-hidden="true"
          >
            <defs>
              <radialGradient id="carHeadlightGlow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#F5F5F4" stopOpacity="0.85" />
                <stop offset="50%" stopColor="#E34843" stopOpacity="0.38" />
                <stop offset="100%" stopColor="#161719" stopOpacity="0" />
              </radialGradient>
            </defs>
            <g className="ka-headlight-glow">
              <ellipse cx="122" cy="96" rx="44" ry="22" fill="url(#carHeadlightGlow)" />
              <path
                d="M 118 96 L 12 122 L 12 82 Z"
                fill="url(#carHeadlightGlow)"
                opacity="0.65"
              />
            </g>
            <line
              x1="200"
              y1="138"
              x2="295"
              y2="138"
              stroke="#E34843"
              strokeWidth="1.2"
              strokeDasharray="10 8"
              strokeOpacity="0.55"
            />
          </svg>
        );
      case 'motorcycles':
        // Headlight activation and subtle exhaust effects
        return (
          <svg
            viewBox="0 0 320 160"
            className={`absolute inset-0 w-full h-full pointer-events-none transition-opacity duration-300 ${
              isActive ? 'opacity-100' : 'opacity-55 group-hover:opacity-90'
            }`}
            aria-hidden="true"
          >
            <defs>
              <radialGradient id="bikeHeadlightGlow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#F5F5F4" stopOpacity="0.9" />
                <stop offset="55%" stopColor="#E34843" stopOpacity="0.38" />
                <stop offset="100%" stopColor="#161719" stopOpacity="0" />
              </radialGradient>
            </defs>
            <g className="ka-headlight-glow">
              <circle cx="222" cy="66" r="34" fill="url(#bikeHeadlightGlow)" />
              <path
                d="M 224 66 L 315 48 L 315 92 Z"
                fill="url(#bikeHeadlightGlow)"
                opacity="0.65"
              />
            </g>
            {/* Subtle exhaust shimmer */}
            <g className="ka-cloud-drift" stroke="#ADAEAF" strokeOpacity="0.45" fill="none">
              <path d="M 88 86 Q 62 78 42 66" strokeWidth="2" strokeLinecap="round" />
              <path d="M 94 96 Q 66 90 48 80" strokeWidth="1.5" strokeLinecap="round" />
            </g>
          </svg>
        );
      case 'traveling':
        // Moving clouds and subtle travel flight arc
        return (
          <svg
            viewBox="0 0 320 160"
            className={`absolute inset-0 w-full h-full pointer-events-none transition-opacity duration-300 ${
              isActive ? 'opacity-95' : 'opacity-55 group-hover:opacity-85'
            }`}
            aria-hidden="true"
          >
            <path
              d="M 24 118 Q 155 42 292 64"
              fill="none"
              stroke="#E34843"
              strokeWidth="1.4"
              strokeDasharray="4 6"
              strokeOpacity="0.65"
            />
            <g className="ka-cloud-drift" fill="#F5F5F4" fillOpacity="0.22">
              <ellipse cx="95" cy="126" rx="42" ry="10" />
              <ellipse cx="225" cy="118" rx="52" ry="12" />
            </g>
          </svg>
        );
      case 'programming':
        // Animated code snippets and terminal activity
        return (
          <div
            className={`absolute bottom-2.5 right-3 pointer-events-none rounded-lg border border-[#3A3B3F] bg-[#161719]/90 px-2.5 py-1.5 font-mono text-[10px] text-[#F5F5F4] transition-opacity duration-300 ${
              isActive ? 'opacity-95' : 'opacity-70 group-hover:opacity-95'
            }`}
            aria-hidden="true"
          >
            <div className="flex items-center gap-1.5 text-[#E34843]">
              <span>$ arena.compile()</span>
              <span className="inline-block w-1.5 h-3 bg-[#E34843] ka-terminal-blink" />
            </div>
            <div className="text-[9px] text-[#ADAEAF]">status: ready [20Q]</div>
          </div>
        );
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = loginName.trim();
    const cleanClass = loginClass.trim();
    const cleanSchool = loginSchool.trim();
    if (!cleanName || !cleanClass || !cleanSchool) {
      setLoginError('Please enter your Name, Class, and School/College to enter the Arena.');
      return;
    }
    setLoginError('');
    setLoginSubmitting(true);
    try {
      soundFX.playSelect();
      await onStudentLogin({
        name: cleanName,
        studentClass: cleanClass,
        schoolCollege: cleanSchool,
      });
    } catch (err: any) {
      setLoginError(err.message || 'Could not save student login. Please try again.');
    } finally {
      setLoginSubmitting(false);
    }
  };

  const handleSelectCategory = (node: TopicNodeConfig) => {
    setSelectedTheme(node);
    soundFX.playCategorySound(node.slug);
  };

  const handleSelectDifficulty = (opt: MoodDifficultyOption) => {
    setSelectedDifficulty(opt);
    soundFX.playSelect();
  };

  const handleStartChallengeClick = () => {
    if (!selectedTheme || !selectedDifficulty || startingQuiz || divingState) return;
    soundFX.playStartChallenge();
    onLaunchThemeAndDifficulty(selectedTheme, selectedDifficulty);
  };

  const isStartReady = Boolean(selectedTheme && selectedDifficulty) && !startingQuiz && !divingState;

  return (
    <section
      ref={stageRef}
      className="relative min-h-screen w-full flex flex-col justify-between overflow-x-hidden bg-[#161719] text-[#F5F5F4] px-4 py-5 sm:px-8 sm:py-6 lg:px-12"
    >
      {/* Bespoke Grand Polymath Hall Background Image + Racing Red Dark Vignette Scrim */}
      <img
        src={heroBgImg}
        alt="QUIZ ARENA Background"
        referrerPolicy="no-referrer"
        onError={(e) => {
          e.currentTarget.style.display = 'none';
        }}
        className="absolute inset-0 w-full h-full object-cover opacity-25 pointer-events-none"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-[#161719]/90 via-[#161719]/80 to-[#161719]/95 pointer-events-none" />

      {/* Subtle Ambient Orbital Rings SVG in Racing Red & Muted Palette */}
      <svg
        viewBox="0 0 1200 720"
        className="hidden lg:block absolute inset-0 w-full h-full pointer-events-none opacity-40"
        aria-hidden="true"
      >
        <defs>
          <radialGradient id="corePulse" cx="50%" cy="50%" r="48%">
            <stop offset="0%" stopColor="#E34843" stopOpacity="0.18" />
            <stop offset="65%" stopColor="#E34843" stopOpacity="0.04" />
            <stop offset="100%" stopColor="#161719" stopOpacity="0" />
          </radialGradient>
        </defs>
        <circle cx="600" cy="360" r="360" fill="url(#corePulse)" />
        <ellipse
          cx="600"
          cy="360"
          rx="480"
          ry="240"
          fill="none"
          stroke="#E34843"
          strokeWidth="1"
          strokeDasharray="6 8"
          opacity="0.35"
        />
        <ellipse
          cx="600"
          cy="360"
          rx="310"
          ry="155"
          fill="none"
          stroke="#ADAEAF"
          strokeWidth="1"
          strokeDasharray="3 6"
          opacity="0.3"
        />
      </svg>

      {!studentInfo ? (
        /* Student Login View in Racing Red Theme */
        <>
          <div className="relative z-20 text-center pt-2">
            <h1 className="text-4xl sm:text-6xl font-display font-extrabold tracking-tight text-[#F5F5F4] drop-shadow-[0_4px_24px_rgba(0,0,0,0.85)]">
              QUIZ ARENA - BCA
            </h1>
          </div>

          <div className="relative z-20 max-w-6xl w-full mx-auto my-auto py-8">
            <div
              data-testid="student-login-card"
              className="max-w-xl mx-auto rounded-2xl border-2 border-[#E34843]/60 bg-[#292A2D] p-7 sm:p-9 shadow-[0_0_55px_-14px_rgba(227,72,67,0.3)] ka-dive-enter"
            >
              <div className="flex items-center gap-3.5 mb-6">
                <div className="w-12 h-12 rounded-xl bg-[#E34843] text-[#F5F5F4] flex items-center justify-center shrink-0 shadow-lg">
                  <GraduationCap className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-[11px] font-mono uppercase tracking-widest text-[#E34843]">
                    STUDENT REGISTRATION & LOGIN
                  </div>
                  <h2 className="text-xl sm:text-2xl font-display font-extrabold text-[#F5F5F4]">
                    Enter Student Details
                  </h2>
                </div>
              </div>

              {loginError && (
                <div className="mb-5 rounded-xl border border-rose-500/50 bg-rose-500/15 px-4 py-3 text-xs text-rose-200">
                  {loginError}
                </div>
              )}

              <form onSubmit={handleLoginSubmit} className="space-y-5">
                <div>
                  <label
                    htmlFor="student-name-input"
                    className="block text-xs font-mono uppercase tracking-wider text-[#ADAEAF] mb-1.5"
                  >
                    Student Full Name *
                  </label>
                  <input
                    id="student-name-input"
                    name="studentName"
                    type="text"
                    required
                    value={loginName}
                    onChange={(e) => setLoginName(e.target.value)}
                    placeholder="e.g. Rahul Nair"
                    className="w-full rounded-xl border border-[#3A3B3F] bg-[#161719] px-4 py-3 text-sm text-[#F5F5F4] placeholder:text-[#ADAEAF]/70 focus:border-[#E34843] focus:outline-none transition-colors"
                  />
                </div>

                <div>
                  <label
                    htmlFor="student-class-input"
                    className="block text-xs font-mono uppercase tracking-wider text-[#ADAEAF] mb-1.5"
                  >
                    Class / Semester *
                  </label>
                  <input
                    id="student-class-input"
                    name="studentClass"
                    type="text"
                    required
                    value={loginClass}
                    onChange={(e) => setLoginClass(e.target.value)}
                    placeholder="e.g. BCA 1st Year, BCA Sem 3, Class 12"
                    className="w-full rounded-xl border border-[#3A3B3F] bg-[#161719] px-4 py-3 text-sm text-[#F5F5F4] placeholder:text-[#ADAEAF]/70 focus:border-[#E34843] focus:outline-none transition-colors"
                  />
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {PRESET_CLASSES.map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setLoginClass(preset)}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-mono border transition-colors cursor-pointer ${
                          loginClass === preset
                            ? 'border-[#E34843] bg-[#E34843]/20 text-[#F5F5F4] font-bold'
                            : 'border-[#3A3B3F] bg-[#161719] text-[#ADAEAF] hover:border-[#E34843]/60 hover:text-[#F5F5F4]'
                        }`}
                      >
                        {preset}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="student-school-input"
                    className="block text-xs font-mono uppercase tracking-wider text-[#ADAEAF] mb-1.5"
                  >
                    School / College Name *
                  </label>
                  <div className="relative">
                    <School className="w-4 h-4 text-[#ADAEAF] absolute left-3.5 top-3.5 pointer-events-none" />
                    <input
                      id="student-school-input"
                      name="schoolCollege"
                      type="text"
                      required
                      value={loginSchool}
                      onChange={(e) => setLoginSchool(e.target.value)}
                      placeholder="e.g. Sacred Heart College, Kochi"
                      className="w-full rounded-xl border border-[#3A3B3F] bg-[#161719] pl-10 pr-4 py-3 text-sm text-[#F5F5F4] placeholder:text-[#ADAEAF]/70 focus:border-[#E34843] focus:outline-none transition-colors"
                    />
                  </div>
                </div>

                <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={onOpenLeaderboards}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-[#3A3B3F] bg-[#161719] text-xs font-semibold text-[#ADAEAF] hover:border-[#E34843] hover:text-[#F5F5F4] transition-colors cursor-pointer"
                  >
                    <Trophy className="w-4 h-4 text-[#E34843]" />
                    <span>View Leaderboard</span>
                  </button>

                  <button
                    type="submit"
                    disabled={loginSubmitting}
                    data-testid="student-login-submit"
                    className="w-full sm:flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[#E34843] text-[#F5F5F4] font-display font-extrabold text-sm hover:opacity-95 disabled:opacity-50 transition-all cursor-pointer shadow-lg"
                  >
                    <LogIn className="w-4 h-4" />
                    <span>
                      {loginSubmitting ? 'Saving Student Profile...' : 'Enter Quiz Arena →'}
                    </span>
                  </button>
                </div>
              </form>
            </div>
          </div>

          <div className="relative z-20 h-4" aria-hidden="true" />
        </>
      ) : (
        /* Interactive Starting Page Displayed Immediately After Successful Login */
        <div className="relative z-20 max-w-7xl w-full mx-auto flex-1 flex flex-col justify-between gap-5 py-1">
          {/* 1. WELCOME SECTION */}
          <header className="text-center space-y-1.5 max-w-3xl mx-auto ka-fade-up">
            <div className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-widest text-[#E34843]">
              <span>QUIZ ARENA - BCA</span>
              <span aria-hidden="true">·</span>
              <span>INTERACTIVE CHALLENGE DECK</span>
            </div>
            <h1
              data-testid="welcome-heading"
              className="text-3xl sm:text-4xl lg:text-5xl font-display font-extrabold tracking-tight text-[#F5F5F4] drop-shadow-[0_4px_24px_rgba(0,0,0,0.85)]"
            >
              WELCOME TO QUIZ ARENA
            </h1>
            <p
              data-testid="welcome-subtitle"
              className="text-xs sm:text-sm text-[#ADAEAF] leading-relaxed max-w-2xl mx-auto"
            >
              Choose your arena, select your difficulty, and put your knowledge to the ultimate test. Every category is a new challenge. Are you ready?
            </p>
          </header>

          {/* 2. INTERACTIVE CATEGORY SELECTION (5 Cards) */}
          <div className="space-y-2.5">
            <div className="flex flex-wrap items-center justify-between gap-2 px-1">
              <div className="text-[11px] font-mono uppercase tracking-wider text-[#ADAEAF]">
                STEP 1 · SELECT YOUR ARENA CATEGORY
              </div>
              <div className="text-[11px] font-mono text-[#E34843]">
                {selectedTheme
                  ? `Selected Arena: ${selectedTheme.name}`
                  : 'Click a category card to arm its arena'}
              </div>
            </div>

            <div
              role="radiogroup"
              aria-label="Quiz Categories"
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5"
            >
              {TOPIC_NODES.map((node, index) => {
                const isSelected = selectedTheme?.slug === node.slug;
                const isHovered = hoveredSlug === node.slug;

                return (
                  <button
                    key={node.slug}
                    type="button"
                    role="radio"
                    aria-checked={isSelected}
                    data-testid={`category-card-${node.slug}`}
                    data-start={index === 0 ? 'true' : undefined}
                    style={{ animationDelay: `${index * 60}ms` }}
                    onMouseEnter={() => setHoveredSlug(node.slug)}
                    onMouseLeave={() => setHoveredSlug((prev) => (prev === node.slug ? null : prev))}
                    onFocus={() => setHoveredSlug(node.slug)}
                    onClick={() => handleSelectCategory(node)}
                    className={`ka-fade-up group relative flex flex-col justify-between text-left rounded-2xl border-2 overflow-hidden transition-all duration-200 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#E34843] ${
                      isSelected
                        ? 'border-[#E34843] bg-[#292A2D] ring-2 ring-[#E34843]/40 scale-[1.02] shadow-[0_0_35px_-8px_rgba(227,72,67,0.45)] z-20'
                        : 'border-[#3A3B3F] bg-[#292A2D]/95 hover:border-[#E34843]/70 hover:scale-[1.015] opacity-95 hover:opacity-100 z-10'
                    }`}
                  >
                    {/* Realistic Category Visual Banner + Category-Specific Subtle Animation Overlay */}
                    <div className="relative h-28 sm:h-32 w-full overflow-hidden bg-[#161719]">
                      <img
                        src={node.imageUrl}
                        alt={node.name}
                        referrerPolicy="no-referrer"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                        className={`w-full h-full object-cover transition-transform duration-500 ${
                          isSelected || isHovered ? 'scale-110' : 'scale-100'
                        }`}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#292A2D] via-[#161719]/40 to-[#161719]/15" />

                      {/* Category-Specific Animated Visual Element */}
                      {renderCategoryVisualOverlay(node.slug, isSelected || isHovered)}

                      {/* Top Plate Code & Selection Indicator */}
                      <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between gap-1.5">
                        <span className="px-2 py-0.5 rounded-md bg-[#161719]/90 border border-[#3A3B3F] font-mono text-[10px] tracking-wider text-[#ADAEAF]">
                          {node.plateCode}
                        </span>
                        {isSelected && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#E34843] text-[#F5F5F4] font-mono text-[10px] font-extrabold shadow-md">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>SELECTED</span>
                          </span>
                        )}
                      </div>

                      {/* Category Icon Badge */}
                      <div className="absolute bottom-2.5 left-2.5 flex items-center gap-2">
                        <div
                          className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-transform duration-200 ${
                            isSelected
                              ? 'bg-[#E34843] text-[#F5F5F4] scale-105'
                              : 'bg-[#161719]/90 border border-[#3A3B3F] text-[#E34843] group-hover:border-[#E34843]/70'
                          }`}
                        >
                          {renderTopicIcon(node.slug, 'w-4 h-4')}
                        </div>
                      </div>
                    </div>

                    {/* Card Content */}
                    <div className="p-3.5 flex-1 flex flex-col justify-between gap-2.5">
                      <div>
                        <h2 className="font-display font-extrabold text-xs sm:text-sm tracking-tight text-[#F5F5F4] group-hover:text-[#E34843] transition-colors">
                          {node.name}
                        </h2>
                        <p className="text-[11px] text-[#ADAEAF] mt-1 line-clamp-2 leading-relaxed">
                          {node.description}
                        </p>
                      </div>

                      <div className="pt-2 border-t border-[#3A3B3F] flex items-center justify-between gap-2 text-[10px] font-mono">
                        <span className="text-[#ADAEAF] truncate">{node.soundLabel}</span>
                        <span
                          className={`font-bold shrink-0 ${
                            isSelected ? 'text-[#E34843]' : 'text-[#ADAEAF] group-hover:text-[#F5F5F4]'
                          }`}
                        >
                          {isSelected ? 'Active ●' : 'Select →'}
                        </span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 5. DIFFICULTY SELECTION SECTION */}
          <div className="space-y-2.5 ka-fade-up" style={{ animationDelay: '200ms' }}>
            <div className="text-center space-y-0.5">
              <h2
                data-testid="difficulty-heading"
                className="text-lg sm:text-xl font-display font-extrabold tracking-tight text-[#F5F5F4]"
              >
                CHOOSE YOUR DIFFICULTY
              </h2>
              <p className="text-xs text-[#ADAEAF]">
                Start easy, challenge your limits, or step into the ultimate test.
              </p>
            </div>

            <div
              role="radiogroup"
              aria-label="Quiz Difficulty"
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5"
            >
              {MOOD_DIFFICULTY_OPTIONS.map((opt) => {
                const isSelected = selectedDifficulty?.difficulty === opt.difficulty;

                return (
                  <button
                    key={opt.difficulty}
                    type="button"
                    role="radio"
                    aria-checked={isSelected}
                    data-testid={`difficulty-card-${opt.difficulty.toLowerCase().replace(/\s+/g, '-')}`}
                    onClick={() => handleSelectDifficulty(opt)}
                    className={`group text-left rounded-2xl border-2 p-4 transition-all duration-200 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#E34843] ${
                      isSelected
                        ? 'border-[#E34843] bg-[#292A2D] ring-2 ring-[#E34843]/40 scale-[1.02] shadow-[0_0_30px_-8px_rgba(227,72,67,0.4)]'
                        : 'border-[#3A3B3F] bg-[#292A2D]/95 hover:border-[#E34843]/70 hover:scale-[1.01]'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg font-mono text-xs font-extrabold transition-colors ${
                          isSelected
                            ? 'bg-[#E34843] text-[#F5F5F4]'
                            : 'bg-[#161719] border border-[#3A3B3F] text-[#E34843] group-hover:border-[#E34843]/70'
                        }`}
                      >
                        <span>{opt.symbol}</span>
                        <span>{opt.displayLabel}</span>
                      </span>

                      <span className="font-mono text-[11px] text-[#ADAEAF]">
                        +{opt.pointsPerQ} PT / Q
                      </span>
                    </div>

                    <p className="text-xs text-[#F5F5F4] font-medium leading-relaxed">
                      {opt.audienceDescription}
                    </p>

                    <div className="mt-2.5 pt-2 border-t border-[#3A3B3F] flex items-center justify-between text-[11px] font-mono">
                      <span className="text-[#ADAEAF]">20 Questions · {opt.totalMaxPts} Pts</span>
                      <span className={isSelected ? 'text-[#E34843] font-bold' : 'text-[#ADAEAF]'}>
                        {isSelected ? 'Selected ✓' : 'Choose'}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 6. START CHALLENGE BUTTON */}
          <div className="flex flex-col items-center gap-2 ka-fade-up" style={{ animationDelay: '260ms' }}>
            <button
              type="button"
              data-testid="start-challenge-button"
              disabled={!isStartReady}
              onClick={handleStartChallengeClick}
              className={`inline-flex items-center justify-center gap-3 px-9 py-3.5 rounded-2xl font-display font-extrabold text-sm sm:text-base tracking-wide transition-all duration-200 ${
                isStartReady
                  ? 'bg-[#E34843] text-[#F5F5F4] hover:opacity-95 hover:scale-[1.03] active:scale-[0.99] shadow-[0_0_35px_-6px_rgba(227,72,67,0.55)] cursor-pointer'
                  : 'bg-[#292A2D] text-[#ADAEAF] border border-[#3A3B3F] cursor-not-allowed opacity-70'
              }`}
            >
              <Play className="w-4 h-4 fill-current" />
              <span>START CHALLENGE</span>
            </button>

            <div className="text-[11px] font-mono text-[#ADAEAF] text-center">
              {selectedTheme && selectedDifficulty ? (
                <span>
                  Ready: <strong className="text-[#E34843]">{selectedTheme.name}</strong> ·{' '}
                  <strong className="text-[#E34843]">{selectedDifficulty.displayLabel}</strong> (20 Questions)
                </span>
              ) : (
                <span>Select both a category and a difficulty tier above to unlock the arena.</span>
              )}
            </div>
          </div>

          {/* Logged-in Student Footer Bar + Audio Mute Control */}
          <div
            data-testid="logged-in-student-bar"
            className="max-w-5xl w-full mx-auto flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#3A3B3F] bg-[#292A2D] px-4 py-2.5 text-xs"
          >
            <div className="flex flex-wrap items-center gap-2 text-[#ADAEAF]">
              <UserCheck className="w-4 h-4 text-[#E34843] shrink-0" />
              <span className="font-bold text-[#F5F5F4]">{studentInfo.name}</span>
              <span className="text-[#ADAEAF]/50">·</span>
              <span className="font-mono text-[#E34843]">{studentInfo.studentClass}</span>
              <span className="text-[#ADAEAF]/50">·</span>
              <span className="text-[#ADAEAF]">{studentInfo.schoolCollege}</span>
            </div>

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => {
                  const nextMuted = soundFX.toggleMute();
                  setSoundMuted(nextMuted);
                }}
                aria-label={soundMuted ? 'Unmute sound effects' : 'Mute sound effects'}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#3A3B3F] bg-[#161719] text-[#ADAEAF] hover:border-[#E34843] hover:text-[#F5F5F4] transition-colors cursor-pointer"
              >
                {soundMuted ? (
                  <>
                    <VolumeX className="w-3.5 h-3.5 text-[#ADAEAF]" />
                    <span>Sound Off</span>
                  </>
                ) : (
                  <>
                    <Volume2 className="w-3.5 h-3.5 text-[#E34843]" />
                    <span>Sound On</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={onOpenLeaderboards}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#3A3B3F] bg-[#161719] text-[#F5F5F4] hover:border-[#E34843] transition-colors cursor-pointer"
              >
                <Trophy className="w-3.5 h-3.5 text-[#E34843]" />
                <span>Leaderboard</span>
              </button>

              <button
                type="button"
                onClick={onSwitchStudent}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#3A3B3F] bg-[#161719] text-[#ADAEAF] hover:border-[#E34843] hover:text-[#F5F5F4] transition-colors cursor-pointer"
              >
                <span>Switch Student</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Full-Screen Dive-In Portal Overlay in Racing Red Identity */}
      {divingState && (
        <div
          key="dive-portal"
          className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#161719]/95 text-[#F5F5F4] overflow-hidden ka-dive-enter"
          role="status"
          aria-live="assertive"
        >
          {[1, 2, 3].map((ring) => (
            <div
              key={ring}
              style={{ borderColor: '#E34843' }}
              className={`ka-portal-ring-${ring} absolute w-64 h-64 rounded-full border-2 pointer-events-none`}
            />
          ))}

          <div className="relative z-10 text-center space-y-4 px-6 max-w-lg ka-dive-enter">
            <div className="w-16 h-16 mx-auto rounded-2xl flex items-center justify-center shadow-2xl bg-[#E34843] text-[#F5F5F4]">
              {renderTopicIcon(divingState.topic.slug, 'w-8 h-8')}
            </div>
            <div className="text-xs font-mono uppercase tracking-widest text-[#E34843]">
              {divingState.difficulty.displayLabel} TIER · 20 QUESTIONS
            </div>
            <h2 className="text-3xl sm:text-4xl font-display font-extrabold text-[#F5F5F4]">
              {divingState.topic.name}
            </h2>
            <p className="text-xs sm:text-sm text-[#ADAEAF] font-mono">
              Launching 20 Randomized {divingState.difficulty.displayLabel} Questions (
              {divingState.difficulty.totalMaxPts} Max Points)...
            </p>
          </div>
        </div>
      )}
    </section>
  );
};
