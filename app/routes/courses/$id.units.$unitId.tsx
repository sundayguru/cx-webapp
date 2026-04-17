import type { Route } from './+types/$id.units.$unitId';
import { data, Link, useFetcher } from 'react-router';
import { getCourseById } from '~/db/courses';
import { getQuizzesByUnitId, getQuizSessionsByUnitAndUser } from '~/db/quizzes';
import { getUserFromRequest } from '~/utils/session.server';
import { motion, AnimatePresence } from 'motion/react';
import Markdown from 'react-markdown';
import type { SelectModule } from '~/db/schemas/modules';
import type { SelectUnit } from '~/db/schemas/units';
import type { SelectQuiz } from '~/db/schemas/quizzes';
import type { User } from '~/types';
import { useToast } from '~/utils/useToast';
import { QuizResultsView } from '~/components/quiz/QuizResultsView';
import { QuizTakerView } from '~/components/quiz/QuizTakerView';
import {
  Bookmark,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  FileText,
  HelpCircle,
  MessageCircle,
  MoreVertical,
  PanelLeft,
  Play,
  Sparkles,
  Trash2,
  Volume2,
  X,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import {
  CURRICULUM_MODEL_OPTIONS,
  DEFAULT_CURRICULUM_MODELS,
  DEFAULT_CURRICULUM_PROVIDER,
  type CurriculumAiProvider,
} from '~/utils/curriculum-options';
import {
  buildQuizPerformanceMap,
  getQuizDisplayAnswer,
  getWeightedRandomizedQuizzes,
  isQuizAnswerCorrect,
  type QuizPerformanceStat,
  type QuizSessionAnswer,
} from '~/utils/quiz-session';

type CourseModuleWithUnits = SelectModule & {
  units: SelectUnit[];
};

type FlattenedUnit = SelectUnit & {
  moduleId: string;
  moduleTitle: string;
  moduleIndex: number;
  unitIndex: number;
};

type ChatMessage = {
  role: 'user' | 'assistant';
  text: string;
};

type LoaderData = {
  course: Awaited<ReturnType<typeof getCourseById>>;
  modules: CourseModuleWithUnits[];
  currentUnit: FlattenedUnit;
  previousUnit: FlattenedUnit | null;
  nextUnit: FlattenedUnit | null;
  quizzes: SelectQuiz[];
  quizPerformance: Record<string, QuizPerformanceStat>;
  user: User | null;
};

const cx = (...classes: Array<string | false | null | undefined>) =>
  classes.filter(Boolean).join(' ');
const QUIZ_SESSION_SIZE = 10;

const splitIntoParagraphs = (content: string) =>
  content
    .split(/\n\s*\n/g)
    .map((paragraph) => paragraph.replace(/\s+/g, ' ').trim())
    .filter(Boolean);

const answerFromContent = (content: string, question: string) => {
  const paragraphs = splitIntoParagraphs(content);
  const keywords = question
    .toLowerCase()
    .split(/[^a-z0-9]+/g)
    .map((word) => word.trim())
    .filter((word) => word.length > 3);

  const relevantParagraph =
    paragraphs.find((paragraph) =>
      keywords.some((word) => paragraph.toLowerCase().includes(word)),
    ) || paragraphs[0];

  if (!relevantParagraph) {
    return "I couldn't find enough material in this unit yet. Try asking about a concept or section title from the page.";
  }

  return `Based on this unit, the most relevant section is: ${relevantParagraph}`;
};

export const loader = async ({
  params,
  request,
}: Route.LoaderArgs): Promise<LoaderData> => {
  const courseId = params.id;
  const unitId = params.unitId;
  const user = await getUserFromRequest(request);

  if (!courseId || !unitId) {
    throw data({ error: 'Course and unit are required' }, { status: 400 });
  }

  const courseData = await getCourseById(courseId);

  if (!courseData) {
    throw data({ error: 'Course not found' }, { status: 404 });
  }

  const modules = courseData.modules as CourseModuleWithUnits[];
  const flattenedUnits = modules.flatMap((module, moduleIndex) =>
    module.units.map((unit, unitIndex) => ({
      ...unit,
      moduleId: module.id,
      moduleTitle: module.title,
      moduleIndex,
      unitIndex,
    })),
  );

  const currentUnitIndex = flattenedUnits.findIndex(
    (unit) => unit.id === unitId,
  );

  if (currentUnitIndex === -1) {
    throw data({ error: 'Unit not found' }, { status: 404 });
  }

  const quizzes = await getQuizzesByUnitId(unitId);
  const quizSessions = user
    ? await getQuizSessionsByUnitAndUser(unitId, user.id)
    : [];
  const quizPerformance = buildQuizPerformanceMap(
    quizzes.map((quiz) => quiz.id),
    quizSessions,
  );

  return {
    course: courseData,
    modules,
    currentUnit: flattenedUnits[currentUnitIndex],
    previousUnit: flattenedUnits[currentUnitIndex - 1] ?? null,
    nextUnit: flattenedUnits[currentUnitIndex + 1] ?? null,
    quizzes,
    quizPerformance,
    user,
  };
};

export default function UnitPage({ loaderData }: Route.ComponentProps) {
  return <UnitPageContent key={loaderData.currentUnit.id} {...loaderData} />;
}

const readStoredUnitIds = (storageKey: string) => {
  if (typeof window === 'undefined') {
    return [] as string[];
  }

  return JSON.parse(
    window.localStorage.getItem(storageKey) ?? '[]',
  ) as string[];
};

const UnitPageContent = ({
  course,
  modules,
  currentUnit,
  previousUnit,
  nextUnit,
  quizzes,
  quizPerformance,
  user,
}: LoaderData) => {
  const [mode, setMode] = useState<'text' | 'audio' | 'video' | 'quiz'>('text');
  const [showChat, setShowChat] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [showSidebarDrawer, setShowSidebarDrawer] = useState(false);
  const [showGenerateQuizModal, setShowGenerateQuizModal] = useState(false);
  const [showClearQuizzesModal, setShowClearQuizzesModal] = useState(false);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [quizPage, setQuizPage] = useState(1);
  const QUIZZES_PER_PAGE = 10;
  const [showQuizTaker, setShowQuizTaker] = useState(false);
  const [quizMode, setQuizMode] = useState<'learning' | 'exam'>('learning');
  const [quizTimerEnabled, setQuizTimerEnabled] = useState(false);
  const [currentQuizIndex, setCurrentQuizIndex] = useState(0);
  const [activeQuizzes, setActiveQuizzes] = useState<SelectQuiz[]>([]);
  const [userAnswers, setUserAnswers] = useState<(string | null)[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [quizStartTime, setQuizStartTime] = useState<number>(() => Date.now());
  const [selectedProvider, setSelectedProvider] =
    useState<CurriculumAiProvider>(DEFAULT_CURRICULUM_PROVIDER);
  const [selectedModel, setSelectedModel] = useState(
    DEFAULT_CURRICULUM_MODELS[DEFAULT_CURRICULUM_PROVIDER],
  );
  const generateContentFetcher = useFetcher();
  const generateQuizFetcher = useFetcher();
  const completeFetcher = useFetcher();
  const clearQuizzesFetcher = useFetcher();
  const startQuizSessionFetcher = useFetcher();
  const saveQuizSessionFetcher = useFetcher();
  const isGenerating = generateContentFetcher.state !== 'idle';
  const isGeneratingQuiz = generateQuizFetcher.state !== 'idle';
  const isClearingQuizzes = clearQuizzesFetcher.state !== 'idle';
  const { showToast } = useToast();
  const handledGenerateContentResult = useRef<string | null>(null);
  const handledGenerateQuizResult = useRef<string | null>(null);
  const quizSessionId =
    startQuizSessionFetcher.state === 'idle' &&
    (startQuizSessionFetcher.data as { sessionId?: string } | undefined)
      ?.sessionId
      ? (startQuizSessionFetcher.data as { sessionId: string } | undefined)
          ?.sessionId
      : null;

  const isInstructor = user?.id === course?.course.createdBy;
  const hasRawText = Boolean(currentUnit.rawText?.trim());

  const isCompleted = currentUnit.isComplete === 1;
  const [isBookmarked, setIsBookmarked] = useState(() =>
    readStoredUnitIds('coursex:bookmarked-units').includes(currentUnit.id),
  );
  const [question, setQuestion] = useState('');
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [quizPerformanceState, setQuizPerformanceState] =
    useState(quizPerformance);

  const handleProviderChange = (provider: CurriculumAiProvider) => {
    setSelectedProvider(provider);
    setSelectedModel(DEFAULT_CURRICULUM_MODELS[provider]);
  };

  const handleGenerateContent = () => {
    generateContentFetcher.submit(
      { provider: selectedProvider, model: selectedModel },
      {
        method: 'post',
        action: `/api/courses/${course?.course.id}/units/${currentUnit.id}/generate-content`,
      },
    );
  };

  const handleGenerateQuiz = () => {
    generateQuizFetcher.submit(
      { provider: selectedProvider, model: selectedModel },
      {
        method: 'post',
        action: `/api/courses/${course?.course.id}/units/${currentUnit.id}/generate-quiz`,
      },
    );
  };

  const handleClearQuizzes = () => {
    clearQuizzesFetcher.submit(
      {},
      {
        method: 'post',
        action: `/api/courses/${course?.course.id}/units/${currentUnit.id}/clear-quizzes`,
      },
    );
  };

  useEffect(() => {
    if (
      generateContentFetcher.state === 'idle' &&
      generateContentFetcher.data
    ) {
      const result = generateContentFetcher.data as {
        success?: boolean;
        error?: string;
        title?: string;
      };
      const resultKey = JSON.stringify(result);

      if (
        result.success &&
        handledGenerateContentResult.current !== resultKey
      ) {
        handledGenerateContentResult.current = resultKey;
        showToast({
          tone: 'success',
          message: `Unit content generated: ${result.title || 'Success'}`,
        });
        window.setTimeout(() => window.location.reload(), 1200);
      } else if (
        result.error &&
        handledGenerateContentResult.current !== resultKey
      ) {
        handledGenerateContentResult.current = resultKey;
        showToast({
          tone: 'error',
          message: result.error,
        });
      }
    }
  }, [generateContentFetcher, showToast]);

  useEffect(() => {
    if (generateQuizFetcher.state === 'idle' && generateQuizFetcher.data) {
      const result = generateQuizFetcher.data as {
        success?: boolean;
        error?: string;
        count?: number;
      };
      const resultKey = JSON.stringify(result);

      if (result.success && handledGenerateQuizResult.current !== resultKey) {
        handledGenerateQuizResult.current = resultKey;
        showToast({
          tone: 'success',
          message: `Generated ${result.count ?? 0} quiz questions`,
        });
        window.setTimeout(() => window.location.reload(), 1200);
      } else if (
        result.error &&
        handledGenerateQuizResult.current !== resultKey
      ) {
        handledGenerateQuizResult.current = resultKey;
        showToast({
          tone: 'error',
          message: result.error,
        });
      }
    }
  }, [generateQuizFetcher, showToast]);

  useEffect(() => {
    if (clearQuizzesFetcher.data) {
      const result = clearQuizzesFetcher.data as {
        success?: boolean;
        error?: string;
      };

      if (result.success) {
        showToast({
          tone: 'success',
          message: 'All quizzes cleared successfully',
        });
        window.setTimeout(() => window.location.reload(), 1200);
      } else if (result.error) {
        showToast({
          tone: 'error',
          message: result.error,
        });
      }
      clearQuizzesFetcher.reset();
    }
  }, [clearQuizzesFetcher, clearQuizzesFetcher.data, showToast]);

  useEffect(() => {
    if (
      startQuizSessionFetcher.state !== 'idle' ||
      !startQuizSessionFetcher.data
    ) {
      return;
    }

    const result = startQuizSessionFetcher.data as {
      success?: boolean;
      error?: string;
    };

    if (result.error) {
      showToast({
        tone: 'error',
        message: result.error,
      });
    }
  }, [showToast, startQuizSessionFetcher.data, startQuizSessionFetcher.state]);

  useEffect(() => {
    if (
      saveQuizSessionFetcher.state !== 'idle' ||
      !saveQuizSessionFetcher.data
    ) {
      return;
    }

    const result = saveQuizSessionFetcher.data as {
      success?: boolean;
      error?: string;
    };

    if (result.error) {
      showToast({
        tone: 'error',
        message: result.error,
      });
    }
  }, [saveQuizSessionFetcher.data, saveQuizSessionFetcher.state, showToast]);

  const paginatedQuizzes = quizzes.slice(
    (quizPage - 1) * QUIZZES_PER_PAGE,
    quizPage * QUIZZES_PER_PAGE,
  );

  const startQuiz = () => {
    if (quizzes.length === 0) {
      return;
    }

    const randomizedQuizzes = getWeightedRandomizedQuizzes(
      quizzes,
      quizPerformanceState,
    ).slice(0, QUIZ_SESSION_SIZE);

    setActiveQuizzes(randomizedQuizzes);
    setCurrentQuizIndex(0);
    setUserAnswers(new Array(randomizedQuizzes.length).fill(null));
    setShowResults(false);
    setShowQuizTaker(true);
    setQuizStartTime(Date.now());

    startQuizSessionFetcher.submit(
      {
        mode: quizMode,
        timerEnabled: String(quizTimerEnabled),
        totalQuestions: String(randomizedQuizzes.length),
      },
      {
        method: 'post',
        action: `/api/courses/${course?.course.id}/units/${currentUnit.id}/start-quiz-session`,
      },
    );
  };

  const completeQuizSession = () => {
    const quizzesToGrade = activeQuizzes.length > 0 ? activeQuizzes : quizzes;
    const answers: QuizSessionAnswer[] = quizzesToGrade.map((quiz, index) => ({
      quizId: quiz.id,
      answer: userAnswers[index] ?? null,
      isCorrect: isQuizAnswerCorrect(quiz, userAnswers[index] ?? null),
    }));
    const correctAnswers = answers.filter((answer) => answer.isCorrect).length;
    const timeSpent = Math.max(
      1,
      Math.round((Date.now() - quizStartTime) / 1000),
    );

    setQuizPerformanceState((current) => {
      const next = { ...current };

      answers.forEach((answer) => {
        const previous = next[answer.quizId] ?? {
          quizId: answer.quizId,
          attempts: 0,
          correctCount: 0,
          incorrectCount: 0,
          accuracy: null,
          lastResult: null,
          lastAttemptedAt: null,
          priorityWeight: 6,
        };
        const attempts = previous.attempts + 1;
        const correctCount = previous.correctCount + (answer.isCorrect ? 1 : 0);
        const incorrectCount =
          previous.incorrectCount + (answer.isCorrect ? 0 : 1);
        const accuracy = correctCount / attempts;

        next[answer.quizId] = {
          quizId: answer.quizId,
          attempts,
          correctCount,
          incorrectCount,
          accuracy,
          lastResult: answer.isCorrect ? 'correct' : 'incorrect',
          lastAttemptedAt: new Date().toISOString(),
          priorityWeight: Math.max(
            1,
            attempts === 0
              ? 6
              : 1 +
                  Math.max(0, 1 - accuracy) * 4 +
                  incorrectCount * 1.5 +
                  (answer.isCorrect ? 0 : 1.5),
          ),
        };
      });

      return next;
    });

    if (quizSessionId) {
      saveQuizSessionFetcher.submit(
        {
          sessionId: quizSessionId,
          correctAnswers: String(correctAnswers),
          timeSpent: String(timeSpent),
          answers: JSON.stringify(answers),
        },
        {
          method: 'post',
          action: `/api/courses/${course?.course.id}/units/${currentUnit.id}/save-quiz-session`,
        },
      );
    }

    setShowResults(true);
  };

  const closeQuizExperience = () => {
    setShowQuizTaker(false);
    setShowResults(false);
    setCurrentQuizIndex(0);
    setUserAnswers([]);
    setActiveQuizzes([]);
  };

  const retryQuiz = () => {
    const randomizedQuizzes = getWeightedRandomizedQuizzes(
      quizzes,
      quizPerformanceState,
    ).slice(0, QUIZ_SESSION_SIZE);

    setActiveQuizzes(randomizedQuizzes);
    setCurrentQuizIndex(0);
    setUserAnswers(new Array(randomizedQuizzes.length).fill(null));
    setShowResults(false);
    setQuizStartTime(Date.now());

    startQuizSessionFetcher.submit(
      {
        mode: quizMode,
        timerEnabled: String(quizTimerEnabled),
        totalQuestions: String(randomizedQuizzes.length),
      },
      {
        method: 'post',
        action: `/api/courses/${course?.course.id}/units/${currentUnit.id}/start-quiz-session`,
      },
    );
  };

  const launchTakeQuiz = () => {
    setMode('quiz');
    setShowMoreMenu(false);
    startQuiz();
  };

  const renderUnitSidebar = (isMobile = false) => (
    <div className='flex h-full min-h-0 flex-col'>
      <div className='border-b border-black/5 p-6'>
        <div className='mb-4 flex items-center justify-between gap-3'>
          <Link
            to={`/courses/${course?.course.id}`}
            onClick={() => setShowSidebarDrawer(false)}
            className='flex items-center gap-2 text-sm text-black/40 transition-colors hover:text-[#5A5A40]'
          >
            <ChevronLeft size={16} />
            Back to Course
          </Link>
          {isMobile ? (
            <button
              onClick={() => setShowSidebarDrawer(false)}
              className='flex h-10 w-10 items-center justify-center rounded-full border border-black/10 text-black/45 transition-colors hover:bg-black/5 hover:text-black'
            >
              <X size={18} />
            </button>
          ) : null}
        </div>
        <h2 className='font-serif text-2xl text-[#1a1a1a]'>
          {course?.course.title}
        </h2>
        <p className='mt-2 text-sm text-black/45'>
          Continue through the course structure one unit at a time.
        </p>
      </div>

      <div className='min-h-0 flex-1 overflow-y-auto p-4'>
        <div className='space-y-6'>
          {modules.map((module, moduleIndex) => (
            <div key={module.id}>
              <h3 className='mb-3 px-2 text-[11px] font-bold tracking-[0.24em] text-black/30 uppercase'>
                Module {moduleIndex + 1}: {module.title}
              </h3>
              <div className='space-y-1'>
                {module.units.map((unit) => {
                  const isActive = unit.id === currentUnit.id;
                  const isUnitComplete = unit.isComplete === 1;

                  return (
                    <Link
                      key={unit.id}
                      to={`/courses/${course?.course.id}/units/${unit.id}`}
                      onClick={() => setShowSidebarDrawer(false)}
                      className={cx(
                        'flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-sm transition-all',
                        isActive
                          ? 'bg-[#5A5A40] text-white shadow-lg shadow-[#5A5A40]/15'
                          : 'text-black/60 hover:bg-black/5',
                      )}
                    >
                      <span
                        className={cx(
                          'flex h-6 w-6 items-center justify-center rounded-full border text-[10px]',
                          isActive
                            ? 'border-white/20 bg-white/10'
                            : isUnitComplete
                              ? 'border-green-200 bg-green-50 text-green-600'
                              : 'border-black/10 bg-white',
                        )}
                      >
                        {isUnitComplete && !isActive ? (
                          <CheckCircle size={12} />
                        ) : isActive ? (
                          <Play size={10} fill='currentColor' />
                        ) : (
                          unit.order + 1
                        )}
                      </span>
                      <span className='flex-1'>{unit.title}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const toggleBookmark = () => {
    const bookmarks = JSON.parse(
      window.localStorage.getItem('coursex:bookmarked-units') ?? '[]',
    ) as string[];

    const nextBookmarks = isBookmarked
      ? bookmarks.filter((id) => id !== currentUnit.id)
      : [...bookmarks, currentUnit.id];

    window.localStorage.setItem(
      'coursex:bookmarked-units',
      JSON.stringify(nextBookmarks),
    );
    setIsBookmarked(!isBookmarked);
  };

  const markAsComplete = () => {
    const newIsComplete = !isCompleted;
    completeFetcher.submit(
      { isComplete: String(newIsComplete) },
      {
        method: 'post',
        action: `/api/courses/${course?.course.id}/units/${currentUnit.id}/set-complete`,
      },
    );
  };

  const handleAskQuestion = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!question.trim()) {
      return;
    }

    const userMessage: ChatMessage = {
      role: 'user',
      text: question.trim(),
    };
    const answer = answerFromContent(currentUnit.content ?? '', question);
    const assistantMessage: ChatMessage = {
      role: 'assistant',
      text: answer,
    };

    setChatHistory((history) => [...history, userMessage, assistantMessage]);
    setQuestion('');
  };

  return (
    <div className='min-h-[calc(100vh-8rem)] overflow-hidden rounded-[24px] border border-black/5 bg-white shadow-[0_30px_80px_-30px_rgba(0,0,0,0.25)] md:h-[calc(100vh-8rem)] md:rounded-[36px]'>
      <div className='flex h-full min-h-0 flex-col lg:flex-row'>
        <aside className='hidden w-80 border-r border-black/5 bg-[#faf9f4] lg:block'>
          {renderUnitSidebar()}
        </aside>

        <div className='flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden'>
          <div className='sticky top-0 z-10 flex flex-col gap-3 border-b border-black/5 bg-white/90 px-4 py-3 backdrop-blur-md md:px-8 xl:h-16 xl:flex-row xl:items-center xl:justify-between xl:py-0'>
            <div className='min-w-0'>
              <div className='flex w-full gap-1 overflow-x-auto rounded-2xl bg-black/5 p-1'>
                <button
                  onClick={() => setMode('text')}
                  className={cx(
                    'flex shrink-0 items-center justify-center rounded-xl px-3 py-2 text-sm font-medium transition-all md:px-4',
                    mode === 'text'
                      ? 'bg-white text-[#1a1a1a] shadow-sm'
                      : 'text-black/40',
                  )}
                >
                  <span className='flex items-center gap-2'>
                    <FileText size={16} />
                    Text
                  </span>
                </button>
                <button
                  onClick={() => {
                    setMode('audio');
                    audioRef.current?.load();
                  }}
                  className={cx(
                    'flex shrink-0 items-center justify-center rounded-xl px-3 py-2 text-sm font-medium transition-all md:px-4',
                    mode === 'audio'
                      ? 'bg-white text-[#1a1a1a] shadow-sm'
                      : 'text-black/40',
                  )}
                >
                  <span className='flex items-center gap-2'>
                    <Volume2 size={16} />
                    Audio
                  </span>
                </button>
                <button
                  onClick={() => setMode('video')}
                  className={cx(
                    'flex shrink-0 items-center justify-center rounded-xl px-3 py-2 text-sm font-medium transition-all md:px-4',
                    mode === 'video'
                      ? 'bg-white text-[#1a1a1a] shadow-sm'
                      : 'text-black/40',
                  )}
                >
                  <span className='flex items-center gap-2'>
                    <Play size={16} />
                    Video
                  </span>
                </button>
                <button
                  onClick={() => setMode('quiz')}
                  className={cx(
                    'flex shrink-0 items-center justify-center rounded-xl px-3 py-2 text-sm font-medium transition-all md:px-4',
                    mode === 'quiz'
                      ? 'bg-white text-[#1a1a1a] shadow-sm'
                      : 'text-black/40',
                  )}
                >
                  <span className='flex items-center gap-2'>
                    <HelpCircle size={16} />
                    Quiz
                    {quizzes.length > 0 && (
                      <span className='ml-1 rounded-full bg-[#5A5A40] px-1.5 py-0.5 text-[10px] text-white'>
                        {quizzes.length}
                      </span>
                    )}
                  </span>
                </button>
              </div>
            </div>

            <div className='flex flex-wrap items-center gap-2 sm:gap-3 xl:flex-nowrap'>
              <button
                onClick={() => setShowSidebarDrawer(true)}
                className='inline-flex items-center gap-2 rounded-xl border border-black/10 px-4 py-2 text-sm font-medium text-black/60 transition-all hover:bg-black/5 lg:hidden'
              >
                <PanelLeft size={18} />
                Units
              </button>
              <button
                onClick={markAsComplete}
                className={cx(
                  'flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold transition-all',
                  isCompleted
                    ? 'bg-green-100 text-green-700'
                    : 'bg-green-50 text-green-700 hover:bg-green-100',
                )}
              >
                <CheckCircle size={18} />
                {isCompleted ? 'Completed' : 'Complete'}
              </button>
              <div className='relative'>
                <button
                  onClick={() => setShowMoreMenu(!showMoreMenu)}
                  className={cx(
                    'flex h-10 w-10 items-center justify-center rounded-full border transition-all',
                    showMoreMenu
                      ? 'border-[#5A5A40] bg-[#5A5A40] text-white'
                      : 'border-black/10 text-black/60 hover:bg-black/5',
                  )}
                >
                  <MoreVertical size={18} />
                </button>
                {showMoreMenu && (
                  <div className='absolute top-12 right-0 z-20 min-w-[200px] rounded-xl border border-black/10 bg-white py-1 shadow-lg'>
                    <button
                      onClick={() => {
                        setShowMoreMenu(false);
                        setShowChat((visible) => !visible);
                      }}
                      className='flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-[#1a1a1a] hover:bg-black/5'
                    >
                      <MessageCircle size={16} />
                      Ask AI
                    </button>
                    <button
                      onClick={() => {
                        setShowMoreMenu(false);
                        toggleBookmark();
                      }}
                      className='flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-[#1a1a1a] hover:bg-black/5'
                    >
                      <Bookmark size={16} />
                      {isBookmarked ? 'Bookmarked' : 'Bookmark'}
                    </button>
                    <button
                      onClick={() => {
                        setShowMoreMenu(false);
                        setShowSummary(true);
                      }}
                      className='flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-[#1a1a1a] hover:bg-black/5'
                    >
                      <Sparkles size={16} />
                      Summary
                    </button>
                    <button
                      onClick={() => {
                        launchTakeQuiz();
                      }}
                      className='flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-[#1a1a1a] hover:bg-black/5'
                    >
                      <HelpCircle size={16} />
                      Quiz Me
                    </button>
                    {isInstructor && hasRawText && (
                      <>
                        <div className='my-1 border-t border-black/5' />
                        <button
                          onClick={() => {
                            setShowMoreMenu(false);
                            setShowGenerateModal(true);
                          }}
                          className='flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-[#1a1a1a] hover:bg-black/5'
                        >
                          <Sparkles size={16} />
                          Generate Content
                        </button>
                        <button
                          onClick={() => {
                            setShowMoreMenu(false);
                            setShowGenerateQuizModal(true);
                          }}
                          className='flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-[#1a1a1a] hover:bg-black/5'
                        >
                          <HelpCircle size={16} />
                          Generate Quiz
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className='flex min-h-0 flex-1 overflow-hidden'>
            <div className='min-w-0 flex-1 overflow-y-auto p-6 md:min-h-0 md:p-10 xl:p-12'>
              <div className='mx-auto max-w-4xl'>
                <div className='mb-8 flex flex-wrap items-center gap-3 text-sm text-black/40'>
                  <Link
                    to={`/courses/${course?.course.id}`}
                    className='transition-colors hover:text-[#5A5A40]'
                  >
                    {course?.course.title}
                  </Link>
                  <ChevronRight size={14} />
                  <span>{currentUnit.moduleTitle}</span>
                  <ChevronRight size={14} />
                  <span className='text-black/60'>{currentUnit.title}</span>
                </div>

                <div className='mb-10 flex flex-wrap items-end justify-between gap-6'>
                  <div>
                    <p className='mb-3 text-[11px] font-bold tracking-[0.24em] text-[#5A5A40] uppercase'>
                      Module {currentUnit.moduleIndex + 1} • Unit{' '}
                      {currentUnit.unitIndex + 1}
                    </p>
                  </div>
                </div>

                <AnimatePresence mode='wait'>
                  {mode === 'text' ? (
                    <motion.div
                      key='text'
                      initial={{ opacity: 0, y: 18 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -18 }}
                      className='rounded-[32px] border border-black/5 bg-white p-8 shadow-sm'
                    >
                      <div className='lesson-markdown'>
                        <Markdown>
                          {currentUnit.content ?? 'No content yet.'}
                        </Markdown>
                      </div>
                    </motion.div>
                  ) : null}

                  {mode === 'audio' ? (
                    <motion.div
                      key='audio'
                      initial={{ opacity: 0, scale: 0.96 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.96 }}
                      className='flex min-h-[28rem] flex-col items-center justify-center rounded-[36px] border border-black/5 bg-[#f5f5f0] p-8 text-center'
                    >
                      <div className='mb-8 flex h-28 w-28 items-center justify-center rounded-full bg-[#5A5A40] text-white shadow-xl shadow-[#5A5A40]/20'>
                        <Volume2 size={42} />
                      </div>
                      <h2 className='mb-3 font-serif text-3xl text-[#1a1a1a]'>
                        Listening Mode
                      </h2>
                      <p className='mb-8 max-w-lg text-black/45'>
                        {currentUnit.audioUrl
                          ? 'Listen to the prepared narration for this unit.'
                          : 'This unit does not have an audio track yet. You can still read the lesson in text mode.'}
                      </p>

                      {currentUnit.audioUrl ? (
                        <audio
                          ref={audioRef}
                          controls
                          src={currentUnit.audioUrl}
                          className='w-full max-w-xl'
                        />
                      ) : (
                        <div className='rounded-2xl border border-dashed border-black/10 bg-white px-6 py-5 text-sm text-black/50'>
                          Audio will appear here when a narration is available.
                        </div>
                      )}
                    </motion.div>
                  ) : null}

                  {mode === 'video' ? (
                    <motion.div
                      key='video'
                      initial={{ opacity: 0, scale: 0.98 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.98 }}
                      className='overflow-hidden rounded-[36px] border border-black/5 bg-black'
                    >
                      {currentUnit.videoUrl ? (
                        <video
                          src={currentUnit.videoUrl}
                          controls
                          className='aspect-video w-full object-cover'
                        />
                      ) : (
                        <div className='flex aspect-video flex-col items-center justify-center bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.14),_transparent_40%),linear-gradient(180deg,_#232321,_#090909)] p-8 text-center'>
                          <Play
                            size={60}
                            className='mb-4 text-white'
                            fill='currentColor'
                          />
                          <p className='text-lg font-medium text-white/90'>
                            Video presentation coming soon
                          </p>
                          <p className='mt-2 max-w-md text-sm text-white/45'>
                            When a video lesson is attached to this unit, it
                            will appear here with playback controls.
                          </p>
                        </div>
                      )}
                    </motion.div>
                  ) : null}

                  {mode === 'quiz' ? (
                    <motion.div
                      key='quiz'
                      initial={{ opacity: 0, scale: 0.96 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.96 }}
                      className='rounded-[32px] border border-black/5 bg-white p-8 shadow-sm'
                    >
                      <div className='mb-8 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between'>
                        <div>
                          <h2 className='font-serif text-2xl text-[#1a1a1a]'>
                            Quiz Questions
                          </h2>
                          <p className='mt-2 max-w-2xl text-sm text-black/50'>
                            Each run is shuffled so weaker and unattempted
                            questions surface earlier, while still keeping the
                            session varied.
                          </p>
                        </div>
                        <div className='flex flex-wrap items-center gap-2'>
                          {quizzes.length > 0 && isInstructor ? (
                            <button
                              onClick={() => setShowClearQuizzesModal(true)}
                              className='flex items-center gap-2 rounded-xl border border-red-200 px-4 py-2 text-sm font-medium text-red-600 transition-all hover:bg-red-50'
                            >
                              <Trash2 size={16} />
                              Clear All
                            </button>
                          ) : null}
                          {isInstructor && hasRawText ? (
                            <button
                              onClick={() => setShowGenerateQuizModal(true)}
                              className='rounded-xl bg-[#5A5A40] px-4 py-2 text-sm font-bold text-white'
                            >
                              Generate More
                            </button>
                          ) : null}
                        </div>
                      </div>

                      {quizzes.length > 0 ? (
                        <div>
                          <div className='mb-6 grid gap-4 rounded-[28px] border border-black/5 bg-[#faf9f4] p-5 md:grid-cols-[minmax(0,1fr)_auto] md:items-end'>
                            <div className='grid gap-4 sm:grid-cols-2'>
                              <label className='block'>
                                <span className='mb-2 block text-[11px] font-bold tracking-[0.2em] text-black/35 uppercase'>
                                  Quiz Mode
                                </span>
                                <select
                                  value={quizMode}
                                  onChange={(event) =>
                                    setQuizMode(
                                      event.target.value as 'learning' | 'exam',
                                    )
                                  }
                                  className='w-full rounded-xl border border-black/10 bg-white px-4 py-3 text-sm font-medium text-[#1a1a1a] outline-none focus:border-[#5A5A40]'
                                >
                                  <option value='learning'>
                                    Learning mode
                                  </option>
                                  <option value='exam'>Exam mode</option>
                                </select>
                              </label>
                              <label className='flex items-center gap-3 rounded-xl border border-black/10 bg-white px-4 py-3 text-sm text-[#1a1a1a]'>
                                <input
                                  type='checkbox'
                                  checked={quizTimerEnabled}
                                  onChange={(event) =>
                                    setQuizTimerEnabled(event.target.checked)
                                  }
                                  className='h-4 w-4 rounded border-black/20 text-[#5A5A40] focus:ring-[#5A5A40]'
                                />
                                <span>
                                  Timed questions
                                  <span className='ml-2 text-black/45'>
                                    30 seconds each
                                  </span>
                                </span>
                              </label>
                            </div>
                            <button
                              onClick={startQuiz}
                              disabled={
                                startQuizSessionFetcher.state !== 'idle'
                              }
                              className='w-full rounded-2xl bg-[#5A5A40] px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-[#4a4a35] disabled:opacity-50 md:w-auto'
                            >
                              {startQuizSessionFetcher.state !== 'idle'
                                ? 'Preparing Quiz...'
                                : 'Take Quiz'}
                            </button>
                          </div>

                          <div className='space-y-6'>
                            {paginatedQuizzes.map((quiz, index) => {
                              const stats = quizPerformanceState[quiz.id];
                              const displayAnswer = getQuizDisplayAnswer(quiz);

                              return (
                                <div
                                  key={quiz.id}
                                  className='rounded-2xl border border-black/5 bg-[#faf9f4] p-6'
                                >
                                  <div className='mb-3 flex flex-wrap items-center gap-2'>
                                    <span className='rounded-full bg-black/5 px-2.5 py-1 text-xs font-medium text-black/60'>
                                      {quiz.questionType === 'choice'
                                        ? 'Multiple Choice'
                                        : 'Open Text'}
                                    </span>
                                    <span
                                      className={cx(
                                        'rounded-full px-2.5 py-1 text-xs font-medium',
                                        stats?.attempts
                                          ? 'bg-[#5A5A40]/10 text-[#5A5A40]'
                                          : 'bg-amber-100 text-amber-700',
                                      )}
                                    >
                                      {stats?.attempts
                                        ? `${stats.attempts} attempt${stats.attempts === 1 ? '' : 's'}`
                                        : 'Unattempted'}
                                    </span>
                                    {stats?.attempts ? (
                                      <span className='rounded-full bg-black/5 px-2.5 py-1 text-xs font-medium text-black/60'>
                                        {Math.round(
                                          (stats.accuracy ?? 0) * 100,
                                        )}
                                        % accuracy
                                      </span>
                                    ) : null}
                                    {stats?.lastResult === 'incorrect' ? (
                                      <span className='rounded-full bg-red-100 px-2.5 py-1 text-xs font-medium text-red-700'>
                                        Needs review
                                      </span>
                                    ) : null}
                                  </div>
                                  <p className='mb-4 font-medium text-[#1a1a1a]'>
                                    {(quizPage - 1) * QUIZZES_PER_PAGE +
                                      index +
                                      1}
                                    . {quiz.question}
                                  </p>
                                  {quiz.questionType === 'choice' &&
                                  quiz.options ? (
                                    <div className='space-y-2'>
                                      {JSON.parse(quiz.options).map(
                                        (option: string, optIndex: number) => {
                                          const isCorrect =
                                            option === displayAnswer;
                                          return (
                                            <div
                                              key={optIndex}
                                              className={cx(
                                                'flex items-center gap-3 rounded-xl border px-4 py-3',
                                                isCorrect
                                                  ? 'border-green-500/50 bg-green-50'
                                                  : 'border-black/10 bg-white',
                                              )}
                                            >
                                              <span
                                                className={cx(
                                                  'flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold',
                                                  isCorrect
                                                    ? 'bg-green-500 text-white'
                                                    : 'bg-black/5',
                                                )}
                                              >
                                                {String.fromCharCode(
                                                  65 + optIndex,
                                                )}
                                              </span>
                                              <span
                                                className={cx(
                                                  'text-sm',
                                                  isCorrect
                                                    ? 'font-medium text-green-800'
                                                    : 'text-[#1a1a1a]',
                                                )}
                                              >
                                                {option}
                                              </span>
                                            </div>
                                          );
                                        },
                                      )}
                                    </div>
                                  ) : (
                                    <div className='rounded-xl border border-black/10 bg-white px-4 py-3'>
                                      <p className='mb-1 text-xs font-medium text-black/40'>
                                        Answer:
                                      </p>
                                      <p className='text-sm text-[#1a1a1a]'>
                                        {displayAnswer}
                                      </p>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                          {quizzes.length > QUIZZES_PER_PAGE && (
                            <div className='mt-6 flex items-center justify-center gap-2'>
                              <button
                                onClick={() =>
                                  setQuizPage((p) => Math.max(1, p - 1))
                                }
                                disabled={quizPage === 1}
                                className='rounded-lg border border-black/10 px-3 py-2 text-sm font-medium text-black/60 transition-all hover:bg-black/5 disabled:opacity-50'
                              >
                                Previous
                              </button>
                              <span className='px-3 text-sm text-black/60'>
                                Page {quizPage} of{' '}
                                {Math.ceil(quizzes.length / QUIZZES_PER_PAGE)}
                              </span>
                              <button
                                onClick={() =>
                                  setQuizPage((p) =>
                                    Math.min(
                                      Math.ceil(
                                        quizzes.length / QUIZZES_PER_PAGE,
                                      ),
                                      p + 1,
                                    ),
                                  )
                                }
                                disabled={
                                  quizPage >=
                                  Math.ceil(quizzes.length / QUIZZES_PER_PAGE)
                                }
                                className='rounded-lg border border-black/10 px-3 py-2 text-sm font-medium text-black/60 transition-all hover:bg-black/5 disabled:opacity-50'
                              >
                                Next
                              </button>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className='py-12 text-center text-black/50'>
                          <HelpCircle
                            size={48}
                            className='mx-auto mb-4 text-black/20'
                          />
                          <p>No quiz questions yet.</p>
                          {isInstructor && hasRawText && (
                            <button
                              onClick={() => setShowGenerateQuizModal(true)}
                              className='mt-4 text-[#5A5A40] underline'
                            >
                              Generate quiz from unit content
                            </button>
                          )}
                        </div>
                      )}
                    </motion.div>
                  ) : null}
                </AnimatePresence>
                <div className='mt-4 flex flex-col gap-3 sm:flex-row sm:items-center'>
                  {previousUnit ? (
                    <Link
                      to={`/courses/${course?.course.id}/units/${previousUnit.id}`}
                      className='inline-flex items-center justify-center gap-2 rounded-2xl border border-black/10 px-4 py-3 text-sm font-medium text-black/60 transition-all hover:bg-black/5'
                    >
                      <ChevronLeft size={16} />
                      Previous
                    </Link>
                  ) : null}
                  {nextUnit ? (
                    <Link
                      to={`/courses/${course?.course.id}/units/${nextUnit.id}`}
                      className='inline-flex items-center justify-center gap-2 rounded-2xl bg-[#5A5A40] px-4 py-3 text-sm font-bold text-white transition-all hover:bg-[#4a4a35]'
                    >
                      Next Unit
                      <ChevronRight size={16} />
                    </Link>
                  ) : null}
                </div>
              </div>
            </div>

            <AnimatePresence>
              {showChat ? (
                <motion.aside
                  initial={{ x: 320 }}
                  animate={{ x: 0 }}
                  exit={{ x: 320 }}
                  className='hidden w-[24rem] border-l border-black/5 bg-white xl:flex xl:flex-col'
                >
                  <div className='flex items-center justify-between border-b border-black/5 bg-[#f5f5f0]/70 p-6'>
                    <div className='flex items-center gap-2'>
                      <Sparkles size={20} className='text-[#5A5A40]' />
                      <h2 className='font-bold text-[#1a1a1a]'>
                        Course Assistant
                      </h2>
                    </div>
                    <button
                      onClick={() => setShowChat(false)}
                      className='text-black/40 transition-colors hover:text-black'
                    >
                      <ChevronRight size={20} />
                    </button>
                  </div>

                  <div className='flex-1 space-y-4 overflow-y-auto p-4'>
                    <div className='rounded-2xl bg-[#f5f5f0] p-4 text-sm text-black/60 italic'>
                      I am grounded in this unit&apos;s content. Ask me anything
                      about &quot;{currentUnit.title}&quot;.
                    </div>

                    {chatHistory.map((message, index) => (
                      <div
                        key={`${message.role}-${index}`}
                        className={cx(
                          'flex flex-col',
                          message.role === 'user' ? 'items-end' : 'items-start',
                        )}
                      >
                        <div
                          className={cx(
                            'max-w-[85%] rounded-2xl px-4 py-3 text-sm',
                            message.role === 'user'
                              ? 'bg-[#5A5A40] text-white'
                              : 'bg-black/5 text-[#1a1a1a]',
                          )}
                        >
                          {message.text}
                        </div>
                      </div>
                    ))}
                  </div>

                  <form
                    onSubmit={handleAskQuestion}
                    className='border-t border-black/5 p-4'
                  >
                    <div className='relative'>
                      <input
                        type='text'
                        value={question}
                        onChange={(event) => setQuestion(event.target.value)}
                        placeholder='Ask a question about this unit...'
                        className='w-full rounded-xl bg-black/5 py-3 pr-12 pl-4 text-sm transition-all outline-none focus:ring-2 focus:ring-[#5A5A40]/20'
                      />
                      <button
                        type='submit'
                        className='absolute top-1/2 right-2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg bg-[#5A5A40] text-white transition-colors hover:bg-[#4a4a35]'
                      >
                        <ChevronRight size={18} />
                      </button>
                    </div>
                  </form>
                </motion.aside>
              ) : null}
            </AnimatePresence>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showSidebarDrawer ? (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowSidebarDrawer(false)}
              className='fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden'
            />
            <motion.aside
              initial={{ x: -320 }}
              animate={{ x: 0 }}
              exit={{ x: -320 }}
              className='fixed inset-y-0 left-0 z-50 w-[min(22rem,88vw)] border-r border-black/5 bg-[#faf9f4] shadow-2xl lg:hidden'
            >
              {renderUnitSidebar(true)}
            </motion.aside>
          </>
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {showSummary ? (
          <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm'>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className='w-full max-w-2xl rounded-[32px] bg-white p-8 shadow-2xl'
            >
              <div className='mb-8 flex items-center justify-between'>
                <div className='flex items-center gap-3'>
                  <Sparkles className='text-[#5A5A40]' />
                  <h2 className='font-serif text-2xl text-[#1a1a1a]'>
                    Unit Summary
                  </h2>
                </div>
                <button
                  onClick={() => setShowSummary(false)}
                  className='text-black/40 transition-colors hover:text-black'
                >
                  <ChevronRight size={22} className='rotate-90' />
                </button>
              </div>

              <div className='space-y-6'>
                <div className='rounded-2xl border border-black/5 bg-[#f5f5f0] p-6'>
                  <h3 className='mb-3 font-bold text-[#1a1a1a]'>Overview</h3>
                  <p className='text-sm leading-7 text-black/70'>
                    {currentUnit.summary}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowSummary(false)}
                className='mt-8 w-full rounded-2xl bg-[#5A5A40] py-4 font-bold text-white transition-colors hover:bg-[#4a4a35]'
              >
                Close Summary
              </button>
            </motion.div>
          </div>
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {showGenerateModal ? (
          <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm'>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className='w-full max-w-md rounded-[32px] bg-white p-8 shadow-2xl'
            >
              <div className='mb-6 flex items-center justify-between'>
                <div>
                  <h2 className='font-serif text-2xl text-[#1a1a1a]'>
                    Generate Unit Content
                  </h2>
                  <p className='mt-2 text-sm text-black/55'>
                    Choose an AI provider and model to generate content for this
                    unit.
                  </p>
                </div>
              </div>

              <div className='space-y-5'>
                <div>
                  <label className='mb-2 block text-xs font-bold tracking-widest text-black/50 uppercase'>
                    AI Provider
                  </label>
                  <select
                    value={selectedProvider}
                    onChange={(e) =>
                      handleProviderChange(
                        e.target.value as CurriculumAiProvider,
                      )
                    }
                    className='w-full rounded-xl border border-black/10 bg-white px-4 py-3 text-sm font-medium text-[#1a1a1a] transition outline-none focus:border-[#5A5A40]'
                  >
                    <option value='google'>Google</option>
                    <option value='groq'>Groq</option>
                  </select>
                </div>

                <div>
                  <label className='mb-2 block text-xs font-bold tracking-widest text-black/50 uppercase'>
                    Model
                  </label>
                  <select
                    value={selectedModel}
                    onChange={(e) => setSelectedModel(e.target.value)}
                    className='w-full rounded-xl border border-black/10 bg-white px-4 py-3 text-sm font-medium text-[#1a1a1a] transition outline-none focus:border-[#5A5A40]'
                  >
                    {CURRICULUM_MODEL_OPTIONS[selectedProvider].map(
                      (option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ),
                    )}
                  </select>
                </div>
              </div>

              <div className='mt-8 flex items-center justify-end gap-3'>
                <button
                  onClick={() => {
                    if (!isGenerating) {
                      setShowGenerateModal(false);
                    }
                  }}
                  disabled={isGenerating}
                  className='rounded-2xl border border-black/10 px-5 py-3 font-medium text-black/60 transition-all hover:bg-black/5 disabled:opacity-50'
                >
                  {isGenerating ? 'Please wait...' : 'Cancel'}
                </button>
                <button
                  onClick={handleGenerateContent}
                  disabled={isGenerating}
                  className='rounded-2xl bg-[#5A5A40] px-5 py-3 font-bold text-white transition-all hover:bg-[#4a4a35] disabled:opacity-50'
                >
                  {isGenerating ? 'Generating...' : 'Generate'}
                </button>
              </div>
            </motion.div>
          </div>
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {showGenerateQuizModal ? (
          <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm'>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className='w-full max-w-md rounded-[32px] bg-white p-8 shadow-2xl'
            >
              <div className='mb-6 flex items-center justify-between'>
                <div>
                  <h2 className='font-serif text-2xl text-[#1a1a1a]'>
                    Generate Quiz Questions
                  </h2>
                  <p className='mt-2 text-sm text-black/55'>
                    Choose an AI provider and model to generate quiz questions
                    for this unit.
                  </p>
                </div>
              </div>

              <div className='space-y-5'>
                <div>
                  <label className='mb-2 block text-xs font-bold tracking-widest text-black/50 uppercase'>
                    AI Provider
                  </label>
                  <select
                    value={selectedProvider}
                    onChange={(e) =>
                      handleProviderChange(
                        e.target.value as CurriculumAiProvider,
                      )
                    }
                    className='w-full rounded-xl border border-black/10 bg-white px-4 py-3 text-sm font-medium text-[#1a1a1a] transition outline-none focus:border-[#5A5A40]'
                  >
                    <option value='google'>Google</option>
                    <option value='groq'>Groq</option>
                  </select>
                </div>

                <div>
                  <label className='mb-2 block text-xs font-bold tracking-widest text-black/50 uppercase'>
                    Model
                  </label>
                  <select
                    value={selectedModel}
                    onChange={(e) => setSelectedModel(e.target.value)}
                    className='w-full rounded-xl border border-black/10 bg-white px-4 py-3 text-sm font-medium text-[#1a1a1a] transition outline-none focus:border-[#5A5A40]'
                  >
                    {CURRICULUM_MODEL_OPTIONS[selectedProvider].map(
                      (option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ),
                    )}
                  </select>
                </div>
              </div>

              <div className='mt-8 flex items-center justify-end gap-3'>
                <button
                  onClick={() => {
                    if (!isGeneratingQuiz) {
                      setShowGenerateQuizModal(false);
                    }
                  }}
                  disabled={isGeneratingQuiz}
                  className='rounded-2xl border border-black/10 px-5 py-3 font-medium text-black/60 transition-all hover:bg-black/5 disabled:opacity-50'
                >
                  {isGeneratingQuiz ? 'Please wait...' : 'Cancel'}
                </button>
                <button
                  onClick={handleGenerateQuiz}
                  disabled={isGeneratingQuiz}
                  className='rounded-2xl bg-[#5A5A40] px-5 py-3 font-bold text-white transition-all hover:bg-[#4a4a35] disabled:opacity-50'
                >
                  {isGeneratingQuiz ? 'Generating...' : 'Generate'}
                </button>
              </div>
            </motion.div>
          </div>
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {showClearQuizzesModal ? (
          <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm'>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className='w-full max-w-md rounded-[32px] bg-white p-8 shadow-2xl'
            >
              <div className='mb-6'>
                <div className='mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100'>
                  <Trash2 size={24} className='text-red-600' />
                </div>
                <h2 className='font-serif text-2xl text-[#1a1a1a]'>
                  Clear All Quizzes?
                </h2>
                <p className='mt-2 text-sm text-black/55'>
                  This will permanently delete all {quizzes.length} quiz
                  questions for this unit. This action cannot be undone.
                </p>
              </div>

              <div className='mt-8 flex items-center justify-end gap-3'>
                <button
                  onClick={() => setShowClearQuizzesModal(false)}
                  disabled={isClearingQuizzes}
                  className='rounded-2xl border border-black/10 px-5 py-3 font-medium text-black/60 transition-all hover:bg-black/5 disabled:opacity-50'
                >
                  {isClearingQuizzes ? 'Please wait...' : 'Cancel'}
                </button>
                <button
                  onClick={handleClearQuizzes}
                  disabled={isClearingQuizzes}
                  className='rounded-2xl bg-red-600 px-5 py-3 font-bold text-white transition-all hover:bg-red-700 disabled:opacity-50'
                >
                  {isClearingQuizzes ? 'Clearing...' : 'Clear All'}
                </button>
              </div>
            </motion.div>
          </div>
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {showQuizTaker && !showResults && (
          <QuizTakerView
            key={`${quizSessionId ?? 'quiz-session'}-${currentQuizIndex}-${quizTimerEnabled ? 'timed' : 'untimed'}`}
            quizzes={activeQuizzes}
            mode={quizMode}
            timerEnabled={quizTimerEnabled}
            currentIndex={currentQuizIndex}
            userAnswers={userAnswers}
            onAnswer={(answer) => {
              const newAnswers = [...userAnswers];
              newAnswers[currentQuizIndex] = answer;
              setUserAnswers(newAnswers);
            }}
            onNext={() => {
              if (currentQuizIndex < activeQuizzes.length - 1) {
                setCurrentQuizIndex((i) => i + 1);
              } else {
                completeQuizSession();
              }
            }}
            onPrev={() => {
              if (currentQuizIndex > 0) {
                setCurrentQuizIndex((i) => i - 1);
              }
            }}
            onClose={closeQuizExperience}
            onFinish={completeQuizSession}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showQuizTaker && showResults && (
          <QuizResultsView
            quizzes={activeQuizzes}
            userAnswers={userAnswers}
            mode={quizMode}
            onClose={closeQuizExperience}
            onRetry={retryQuiz}
          />
        )}
      </AnimatePresence>
    </div>
  );
};
