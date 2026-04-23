import type { Route } from './+types/$id.units.$unitId';
import { data, Link, useFetcher } from 'react-router';
import { isUnitBookmarked } from '~/db/bookmarks';
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
import { ChatWindow } from '~/components/ChatWindow';
import { ConfirmModal } from '~/components/ConfirmModal';
import {
  Bookmark,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Copy,
  FileText,
  HelpCircle,
  MessageCircle,
  MoreVertical,
  PanelLeft,
  Play,
  Sparkles,
  Trash2,
  Upload,
  Users,
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
  GOOGLE_TTS_GENDER_OPTIONS,
  GOOGLE_TTS_LANGUAGE_OPTIONS,
  type GoogleTtsVoiceListItem,
} from '~/utils/google-tts';
import {
  buildQuizPerformanceMap,
  getQuizDisplayAnswer,
  getQuizSessionQuizzes,
  isQuizAnswerCorrect,
  type QuizPerformanceStat,
  type QuizSessionAnswer,
} from '~/utils/quiz-session';
import { getChatHistoryByUnitId } from '~/db/chat-history';
import type { SelectChatMessage } from '~/db/schemas';
import { getYouTubeEmbedUrl } from '~/utils/video';

type CourseModuleWithUnits = SelectModule & {
  units: SelectUnit[];
};

type FlattenedUnit = SelectUnit & {
  moduleId: string;
  moduleTitle: string;
  moduleIndex: number;
  unitIndex: number;
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
  chatHistory: SelectChatMessage[];
  isBookmarked: boolean;
};

const cx = (...classes: Array<string | false | null | undefined>) =>
  classes.filter(Boolean).join(' ');
const QUIZ_SESSION_SIZE = 10;
const QUIZ_SESSION_OPEN_TEXT_LIMIT = 3;
const COURSE_SERVE_PREFIX = '/api/course/serve/';

const isUploadedUnitMedia = (url?: string | null) =>
  Boolean(url?.startsWith(COURSE_SERVE_PREFIX));

const buildQuizSessionAnswers = (
  quizzes: SelectQuiz[],
  userAnswers: (string | null)[],
  submittedCount: number,
) => {
  return quizzes.slice(0, submittedCount).map((quiz, index) => {
    const answerValue = userAnswers[index];
    const normalizedAnswer =
      typeof answerValue === 'string' && answerValue.trim().length > 0
        ? answerValue
        : null;

    return {
      quizId: quiz.id,
      answer: normalizedAnswer,
      isCorrect: isQuizAnswerCorrect(quiz, normalizedAnswer),
    } satisfies QuizSessionAnswer;
  });
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

  const chatHistory = user ? await getChatHistoryByUnitId(unitId, user.id) : [];
  const bookmarked = user ? await isUnitBookmarked(user.id, unitId) : false;

  return {
    course: courseData,
    modules,
    currentUnit: flattenedUnits[currentUnitIndex],
    previousUnit: flattenedUnits[currentUnitIndex - 1] ?? null,
    nextUnit: flattenedUnits[currentUnitIndex + 1] ?? null,
    quizzes,
    quizPerformance,
    user,
    chatHistory,
    isBookmarked: bookmarked,
  };
};

export default function UnitPage({ loaderData }: Route.ComponentProps) {
  return <UnitPageContent key={loaderData.currentUnit.id} {...loaderData} />;
}

const UnitPageContent = ({
  course,
  modules,
  currentUnit,
  previousUnit,
  nextUnit,
  quizzes,
  quizPerformance,
  user,
  chatHistory,
  isBookmarked: initialIsBookmarked,
}: LoaderData) => {
  const [mode, setMode] = useState<'text' | 'audio' | 'video' | 'quiz'>('text');
  const [showChat, setShowChat] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [showSidebarDrawer, setShowSidebarDrawer] = useState(false);
  const [showCourseMaterialModal, setShowCourseMaterialModal] = useState(false);
  const [showViewAudioScriptModal, setShowViewAudioScriptModal] =
    useState(false);
  const [showUploadMediaModal, setShowUploadMediaModal] = useState(false);
  const [showGenerateAudioScriptModal, setShowGenerateAudioScriptModal] =
    useState(false);
  const [showGenerateAudioModal, setShowGenerateAudioModal] = useState(false);
  const [showGenerateQuizModal, setShowGenerateQuizModal] = useState(false);
  const [showClearQuizzesModal, setShowClearQuizzesModal] = useState(false);
  const [mediaPendingDelete, setMediaPendingDelete] = useState<
    'audio' | 'video' | null
  >(null);
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
  const [audioLanguageCode, setAudioLanguageCode] = useState('en-US');
  const [audioSsmlGender, setAudioSsmlGender] = useState('FEMALE');
  const [audioVoiceName, setAudioVoiceName] = useState('');
  const [audioSpeakingRate, setAudioSpeakingRate] = useState('1');
  const [audioPitch, setAudioPitch] = useState('0');
  const generateContentFetcher = useFetcher();
  const generateQuizFetcher = useFetcher();
  const generateAudioScriptFetcher = useFetcher();
  const generateAudioFetcher = useFetcher();
  const googleVoicesFetcher = useFetcher();
  const completeFetcher = useFetcher();
  const clearQuizzesFetcher = useFetcher();
  const uploadMediaFetcher = useFetcher();
  const bookmarkFetcher = useFetcher();
  const startQuizSessionFetcher = useFetcher();
  const saveQuizSessionFetcher = useFetcher();
  const isGenerating = generateContentFetcher.state !== 'idle';
  const isGeneratingQuiz = generateQuizFetcher.state !== 'idle';
  const isGeneratingAudioScript = generateAudioScriptFetcher.state !== 'idle';
  const isGeneratingAudio = generateAudioFetcher.state !== 'idle';
  const isClearingQuizzes = clearQuizzesFetcher.state !== 'idle';
  const isUploadingMedia = uploadMediaFetcher.state !== 'idle';
  const { showToast } = useToast();
  const handledGenerateContentResult = useRef<string | null>(null);
  const handledGenerateQuizResult = useRef<string | null>(null);
  const handledGenerateAudioScriptResult = useRef<string | null>(null);
  const handledGenerateAudioResult = useRef<string | null>(null);
  const handledGoogleVoicesResult = useRef<string | null>(null);
  const completedSessionSyncRef = useRef<string | null>(null);
  const currentQuizSessionId =
    startQuizSessionFetcher.state === 'idle' &&
    (startQuizSessionFetcher.data as { sessionId?: string } | undefined)
      ?.sessionId
      ? (startQuizSessionFetcher.data as { sessionId: string } | undefined)
          ?.sessionId
      : null;

  const isInstructor = user?.isAdmin === true;
  const hasRawText = Boolean(currentUnit.rawText?.trim());
  const hasUploadedAudio = isUploadedUnitMedia(currentUnit.audioUrl);
  const hasUploadedVideo = isUploadedUnitMedia(currentUnit.videoUrl);
  const hasVideoLink = Boolean(
    currentUnit.videoUrl && !isUploadedUnitMedia(currentUnit.videoUrl),
  );

  const isCompleted = currentUnit.isComplete === 1;
  const audioRef = useRef<HTMLAudioElement>(null);
  const currentUnitVideoEmbedUrl = currentUnit.videoUrl
    ? getYouTubeEmbedUrl(currentUnit.videoUrl)
    : null;
  const [quizPerformanceState, setQuizPerformanceState] =
    useState(quizPerformance);
  const googleVoiceResult = googleVoicesFetcher.data as
    | {
        success?: boolean;
        error?: string;
        voices?: GoogleTtsVoiceListItem[];
      }
    | undefined;
  const googleVoices = googleVoiceResult?.voices ?? [];
  const selectableGoogleVoices =
    audioSsmlGender === 'SSML_VOICE_GENDER_UNSPECIFIED'
      ? googleVoices
      : googleVoices.filter(
          (voice) =>
            voice.ssmlGender === audioSsmlGender ||
            voice.ssmlGender === 'SSML_VOICE_GENDER_UNSPECIFIED',
        );
  const isLoadingGoogleVoices = googleVoicesFetcher.state !== 'idle';

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

  const handleGenerateAudioScript = () => {
    generateAudioScriptFetcher.submit(
      { provider: selectedProvider, model: selectedModel },
      {
        method: 'post',
        action: `/api/courses/${course?.course.id}/units/${currentUnit.id}/generate-audio-script`,
      },
    );
  };

  const handleGenerateAudio = () => {
    generateAudioFetcher.submit(
      {
        languageCode: audioLanguageCode,
        ssmlGender: audioSsmlGender,
        voiceName: audioVoiceName,
        speakingRate: audioSpeakingRate,
        pitch: audioPitch,
      },
      {
        method: 'post',
        action: `/api/courses/${course?.course.id}/units/${currentUnit.id}/generate-audio`,
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

  const handleDeleteMedia = () => {
    if (!mediaPendingDelete) {
      return;
    }

    setMediaPendingDelete(null);
    setShowUploadMediaModal(false);

    uploadMediaFetcher.submit(
      {
        intent: mediaPendingDelete === 'audio' ? 'deleteAudio' : 'deleteVideo',
      },
      {
        method: 'post',
        action: `/api/courses/${course?.course.id}/units/${currentUnit.id}/upload-media`,
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
    if (
      generateAudioScriptFetcher.state === 'idle' &&
      generateAudioScriptFetcher.data
    ) {
      const result = generateAudioScriptFetcher.data as {
        success?: boolean;
        error?: string;
        scriptLength?: number;
      };
      const resultKey = JSON.stringify(result);

      if (
        result.success &&
        handledGenerateAudioScriptResult.current !== resultKey
      ) {
        handledGenerateAudioScriptResult.current = resultKey;
        showToast({
          tone: 'success',
          message: `Generated unit audio script${result.scriptLength ? ` (${result.scriptLength} chars)` : ''}`,
        });
        window.setTimeout(() => window.location.reload(), 1200);
      } else if (
        result.error &&
        handledGenerateAudioScriptResult.current !== resultKey
      ) {
        handledGenerateAudioScriptResult.current = resultKey;
        showToast({
          tone: 'error',
          message: result.error,
        });
      }
    }
  }, [generateAudioScriptFetcher, showToast]);

  useEffect(() => {
    if (generateAudioFetcher.state === 'idle' && generateAudioFetcher.data) {
      const result = generateAudioFetcher.data as {
        success?: boolean;
        error?: string;
      };
      const resultKey = JSON.stringify(result);

      if (result.success && handledGenerateAudioResult.current !== resultKey) {
        handledGenerateAudioResult.current = resultKey;
        showToast({
          tone: 'success',
          message: 'Generated unit audio successfully',
        });
        window.setTimeout(() => window.location.reload(), 1200);
      } else if (
        result.error &&
        handledGenerateAudioResult.current !== resultKey
      ) {
        handledGenerateAudioResult.current = resultKey;
        showToast({
          tone: 'error',
          message: result.error,
        });
      }
    }
  }, [generateAudioFetcher, showToast]);

  useEffect(() => {
    if (!showGenerateAudioModal || !course?.course.id) {
      return;
    }

    googleVoicesFetcher.load(
      `/api/courses/${course.course.id}/units/${currentUnit.id}/google-voices?languageCode=${encodeURIComponent(audioLanguageCode)}`,
    );
  }, [
    audioLanguageCode,
    course?.course.id,
    currentUnit.id,
    googleVoicesFetcher,
    showGenerateAudioModal,
  ]);

  useEffect(() => {
    if (googleVoicesFetcher.state !== 'idle' || !googleVoicesFetcher.data) {
      return;
    }

    const result = googleVoicesFetcher.data as {
      success?: boolean;
      error?: string;
      voices?: GoogleTtsVoiceListItem[];
    };
    const resultKey = JSON.stringify(result);

    if (result.error && handledGoogleVoicesResult.current !== resultKey) {
      handledGoogleVoicesResult.current = resultKey;
      showToast({
        tone: 'error',
        message: result.error,
      });
    }
  }, [googleVoicesFetcher.data, googleVoicesFetcher.state, showToast]);

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
    if (!uploadMediaFetcher.data) {
      return;
    }

    const result = uploadMediaFetcher.data as {
      success?: boolean;
      error?: string;
      audioUploaded?: boolean;
      videoUploaded?: boolean;
      videoLinked?: boolean;
      mediaDeleted?: 'audio' | 'video';
    };

    if (result.success) {
      if (result.mediaDeleted) {
        showToast({
          tone: 'success',
          message: `Deleted unit ${result.mediaDeleted} successfully`,
        });
      } else {
        const uploadedItems = [
          result.audioUploaded ? 'audio' : null,
          result.videoUploaded ? 'video' : null,
          result.videoLinked ? 'YouTube video' : null,
        ].filter(Boolean);

        showToast({
          tone: 'success',
          message: `Uploaded ${uploadedItems.join(' and ')} for this unit`,
        });
      }
      window.setTimeout(() => window.location.reload(), 1200);
    } else if (result.error) {
      showToast({
        tone: 'error',
        message: result.error,
      });
    }
    uploadMediaFetcher.reset();
  }, [showToast, uploadMediaFetcher, uploadMediaFetcher.data]);

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

  useEffect(() => {
    if (bookmarkFetcher.state !== 'idle' || !bookmarkFetcher.data) {
      return;
    }

    const result = bookmarkFetcher.data as {
      success?: boolean;
      error?: string;
      message?: string;
    };

    if (result.success) {
      showToast({
        tone: 'success',
        message: result.message || 'Bookmark updated',
      });
    } else if (result.error) {
      showToast({
        tone: 'error',
        message: result.error,
      });
    }
    bookmarkFetcher.reset();
  }, [bookmarkFetcher, bookmarkFetcher.data, bookmarkFetcher.state, showToast]);

  const isBookmarked =
    bookmarkFetcher.state !== 'idle'
      ? !initialIsBookmarked
      : initialIsBookmarked;

  const paginatedQuizzes = quizzes.slice(
    (quizPage - 1) * QUIZZES_PER_PAGE,
    quizPage * QUIZZES_PER_PAGE,
  );

  const syncQuizSession = ({
    completed,
    submittedCount,
  }: {
    completed: boolean;
    submittedCount: number;
  }) => {
    if (!currentQuizSessionId || submittedCount <= 0) {
      return;
    }

    const answers = buildQuizSessionAnswers(
      activeQuizzes,
      userAnswers,
      submittedCount,
    );

    if (answers.length === 0) {
      return;
    }

    const correctAnswers = answers.filter((answer) => answer.isCorrect).length;
    const timeSpent = Math.max(
      1,
      Math.round((Date.now() - quizStartTime) / 1000),
    );

    saveQuizSessionFetcher.submit(
      {
        sessionId: currentQuizSessionId,
        correctAnswers: String(correctAnswers),
        timeSpent: String(timeSpent),
        answers: JSON.stringify(answers),
        completed: String(completed),
      },
      {
        method: 'post',
        action: `/api/courses/${course?.course.id}/units/${currentUnit.id}/save-quiz-session`,
      },
    );
  };

  useEffect(() => {
    if (
      !showQuizTaker ||
      !showResults ||
      !currentQuizSessionId ||
      completedSessionSyncRef.current === currentQuizSessionId
    ) {
      return;
    }

    const answers = buildQuizSessionAnswers(
      activeQuizzes,
      userAnswers,
      activeQuizzes.length,
    );

    if (answers.length === 0) {
      return;
    }

    const correctAnswers = answers.filter((answer) => answer.isCorrect).length;
    const timeSpent = Math.max(
      1,
      Math.round((Date.now() - quizStartTime) / 1000),
    );

    saveQuizSessionFetcher.submit(
      {
        sessionId: currentQuizSessionId,
        correctAnswers: String(correctAnswers),
        timeSpent: String(timeSpent),
        answers: JSON.stringify(answers),
        completed: 'true',
      },
      {
        method: 'post',
        action: `/api/courses/${course?.course.id}/units/${currentUnit.id}/save-quiz-session`,
      },
    );
    completedSessionSyncRef.current = currentQuizSessionId;
  }, [
    activeQuizzes.length,
    activeQuizzes,
    course?.course.id,
    currentQuizSessionId,
    currentUnit.id,
    quizStartTime,
    saveQuizSessionFetcher,
    showQuizTaker,
    showResults,
    userAnswers,
  ]);

  const startQuiz = () => {
    if (quizzes.length === 0) {
      return;
    }

    const randomizedQuizzes = getQuizSessionQuizzes(
      quizzes,
      quizPerformanceState,
      QUIZ_SESSION_SIZE,
      QUIZ_SESSION_OPEN_TEXT_LIMIT,
      activeQuizzes.map((quiz) => quiz.id),
    );

    setActiveQuizzes(randomizedQuizzes);
    setCurrentQuizIndex(0);
    setUserAnswers(new Array(randomizedQuizzes.length).fill(null));
    setShowResults(false);
    setShowQuizTaker(true);
    setQuizStartTime(Date.now());
    completedSessionSyncRef.current = null;

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

    setShowResults(true);
  };

  const closeQuizExperience = () => {
    setShowQuizTaker(false);
    setShowResults(false);
    setCurrentQuizIndex(0);
    setUserAnswers([]);
    setActiveQuizzes([]);
    completedSessionSyncRef.current = null;
  };

  const retryQuiz = () => {
    const randomizedQuizzes = getQuizSessionQuizzes(
      quizzes,
      quizPerformanceState,
      QUIZ_SESSION_SIZE,
      QUIZ_SESSION_OPEN_TEXT_LIMIT,
      activeQuizzes.map((quiz) => quiz.id),
    );

    setActiveQuizzes(randomizedQuizzes);
    setCurrentQuizIndex(0);
    setUserAnswers(new Array(randomizedQuizzes.length).fill(null));
    setShowResults(false);
    setQuizStartTime(Date.now());
    completedSessionSyncRef.current = null;

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

  const handleCopyAudioScript = async () => {
    if (!currentUnit.audioScript?.trim()) {
      return;
    }

    try {
      await navigator.clipboard.writeText(currentUnit.audioScript);
      showToast({
        tone: 'success',
        message: 'Audio script copied to clipboard',
      });
    } catch {
      showToast({
        tone: 'error',
        message: 'Failed to copy audio script',
      });
    }
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
    if (!user) {
      showToast({
        tone: 'error',
        message: 'Sign in to bookmark units',
      });
      return;
    }

    bookmarkFetcher.submit(
      {},
      {
        method: 'post',
        action: `/api/units/${currentUnit.id}/bookmark`,
      },
    );
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
              {course?.course.contentKey ? (
                <button
                  onClick={() => setShowCourseMaterialModal(true)}
                  className='inline-flex items-center gap-2 rounded-xl border border-black/10 px-4 py-2 text-sm font-medium text-black/60 transition-all hover:bg-black/5'
                >
                  <FileText size={18} />
                  PDF
                </button>
              ) : null}
              <Link
                to={`/courses/${course?.course.id}/community`}
                className='inline-flex items-center gap-2 rounded-xl border border-black/10 px-4 py-2 text-sm font-medium text-black/60 transition-all hover:bg-black/5'
              >
                <Users size={18} />
                Community
              </Link>
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
                    {isInstructor ? (
                      <>
                        <div className='my-1 border-t border-black/5' />
                        {currentUnit.audioScript?.trim() ? (
                          <button
                            onClick={() => {
                              setShowMoreMenu(false);
                              setShowViewAudioScriptModal(true);
                            }}
                            className='flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-[#1a1a1a] hover:bg-black/5'
                          >
                            <FileText size={16} />
                            View Audio Script
                          </button>
                        ) : null}
                        <button
                          onClick={() => {
                            setShowMoreMenu(false);
                            setShowGenerateAudioScriptModal(true);
                          }}
                          disabled={!currentUnit.content?.trim()}
                          className='flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-[#1a1a1a] hover:bg-black/5 disabled:opacity-50'
                        >
                          <Sparkles size={16} />
                          Generate Unit Audio Script
                        </button>
                        <button
                          onClick={() => {
                            setShowMoreMenu(false);
                            setShowGenerateAudioModal(true);
                          }}
                          disabled={
                            isGeneratingAudio ||
                            !currentUnit.audioScript?.trim() ||
                            Boolean(currentUnit.audioUrl)
                          }
                          className='flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-[#1a1a1a] hover:bg-black/5 disabled:opacity-50'
                        >
                          <Volume2 size={16} />
                          {isGeneratingAudio
                            ? 'Generating Unit Audio...'
                            : 'Generate Unit Audio'}
                        </button>
                        <button
                          onClick={() => {
                            setShowMoreMenu(false);
                            setShowUploadMediaModal(true);
                          }}
                          className='flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-[#1a1a1a] hover:bg-black/5'
                        >
                          <Upload size={16} />
                          Upload Unit Media
                        </button>
                      </>
                    ) : null}
                    {isInstructor && hasRawText ? (
                      <>
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
                    ) : null}
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
                      className='rounded-[36px] border border-black/5 bg-[#f5f5f0] p-6 md:p-8'
                    >
                      {currentUnit.audioUrl ? (
                        <div className='mx-auto flex min-h-[28rem] max-w-3xl flex-col justify-center'>
                          <div className='mb-8 flex flex-col items-center text-center'>
                            <div className='mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-[#5A5A40] text-white shadow-xl shadow-[#5A5A40]/20'>
                              <Volume2 size={38} />
                            </div>
                            <h2 className='font-serif text-3xl text-[#1a1a1a]'>
                              Listening Mode
                            </h2>
                            <p className='mt-3 max-w-xl text-sm leading-7 text-black/50'>
                              Listen to the prepared narration for this unit.
                            </p>
                          </div>

                          <div className='rounded-[32px] border border-black/5 bg-white p-6 shadow-sm'>
                            <div className='mb-6 flex items-center justify-between gap-4'>
                              <div>
                                <p className='text-[11px] font-bold tracking-[0.24em] text-[#5A5A40] uppercase'>
                                  Unit Audio
                                </p>
                                <p className='mt-2 text-lg font-semibold text-[#1a1a1a]'>
                                  {currentUnit.title}
                                </p>
                              </div>
                              <div className='hidden items-center gap-1 md:flex'>
                                {[...Array(12)].map((_, index) => (
                                  <span
                                    key={index}
                                    className='w-1 rounded-full bg-[#5A5A40]/35'
                                    style={{
                                      height: `${18 + ((index % 4) + 1) * 7}px`,
                                    }}
                                  />
                                ))}
                              </div>
                            </div>

                            <audio
                              ref={audioRef}
                              controls
                              src={currentUnit.audioUrl}
                              className='w-full'
                            />
                          </div>
                        </div>
                      ) : (
                        <div className='flex min-h-[28rem] flex-col items-center justify-center text-center'>
                          <div className='mb-8 flex h-28 w-28 items-center justify-center rounded-full bg-[#5A5A40] text-white shadow-xl shadow-[#5A5A40]/20'>
                            <Volume2 size={42} />
                          </div>
                          <h2 className='mb-3 font-serif text-3xl text-[#1a1a1a]'>
                            Listening Mode
                          </h2>
                          <p className='mb-8 max-w-lg text-black/45'>
                            This unit does not have an audio track yet. You can
                            still read the lesson in text mode.
                          </p>
                          <div className='rounded-2xl border border-dashed border-black/10 bg-white px-6 py-5 text-sm text-black/50'>
                            Audio will appear here when a narration is
                            available.
                          </div>
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
                        <div className='bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.14),_transparent_40%),linear-gradient(180deg,_#232321,_#090909)] p-4 md:p-6'>
                          <div className='mb-5 flex flex-col gap-3 md:flex-row md:items-end md:justify-between'>
                            <div>
                              <p className='text-[11px] font-bold tracking-[0.24em] text-white/50 uppercase'>
                                Unit Video
                              </p>
                              <h2 className='mt-2 font-serif text-2xl text-white md:text-3xl'>
                                {currentUnit.title}
                              </h2>
                              <p className='mt-2 max-w-2xl text-sm leading-7 text-white/55'>
                                Watch the lesson presentation for this unit.
                              </p>
                            </div>
                          </div>

                          <div className='overflow-hidden rounded-[28px] border border-white/10 bg-black shadow-2xl'>
                            {currentUnitVideoEmbedUrl ? (
                              <iframe
                                src={currentUnitVideoEmbedUrl}
                                title={currentUnit.title}
                                className='aspect-video w-full'
                                allow='accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share'
                                referrerPolicy='strict-origin-when-cross-origin'
                                allowFullScreen
                              />
                            ) : (
                              <video
                                src={currentUnit.videoUrl}
                                controls
                                className='aspect-video w-full object-cover'
                              />
                            )}
                          </div>
                        </div>
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

            <ChatWindow
              unitId={currentUnit.id}
              courseId={course?.course.id ?? ''}
              isOpen={showChat}
              onClose={() => setShowChat(false)}
              initialMessages={chatHistory.map((message) => ({
                content: message.content,
                role: message.role as 'user' | 'assistant',
              }))}
            />
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showCourseMaterialModal && course?.course.contentKey ? (
          <div className='fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8'>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowCourseMaterialModal(false)}
              className='absolute inset-0 bg-black/80 backdrop-blur-sm'
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className='relative flex h-full w-full max-w-5xl flex-col overflow-hidden rounded-[40px] bg-white shadow-2xl'
            >
              <div className='flex items-center justify-between border-b border-black/5 bg-white p-6'>
                <div className='flex items-center gap-4 text-[#5A5A40]'>
                  <div className='flex h-10 w-10 items-center justify-center rounded-xl bg-[#5A5A40]/10'>
                    <FileText size={20} />
                  </div>
                  <div>
                    <h3 className='leading-tight font-bold text-[#1a1a1a]'>
                      Course Content
                    </h3>
                    <p className='text-xs font-bold tracking-widest text-black/40 uppercase'>
                      {course.course.code}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowCourseMaterialModal(false)}
                  className='flex h-10 w-10 items-center justify-center rounded-full bg-black/5 transition-colors hover:bg-black/10'
                >
                  <X size={20} />
                </button>
              </div>
              <div className='flex-1 bg-gray-100 p-4'>
                <iframe
                  src={`/api/course/serve/${course.course.contentKey}`}
                  className='h-full w-full rounded-2xl border border-black/5 bg-white'
                  title={course.course.title}
                />
              </div>
            </motion.div>
          </div>
        ) : null}
      </AnimatePresence>

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
        {showViewAudioScriptModal && currentUnit.audioScript?.trim() ? (
          <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm'>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className='flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-[32px] bg-white shadow-2xl'
            >
              <div className='flex items-center justify-between border-b border-black/5 p-6'>
                <div>
                  <h2 className='font-serif text-2xl text-[#1a1a1a]'>
                    Unit Audio Script
                  </h2>
                  <p className='mt-2 text-sm text-black/55'>
                    Review or copy the narration script prepared for this unit.
                  </p>
                </div>
                <button
                  onClick={() => setShowViewAudioScriptModal(false)}
                  className='flex h-10 w-10 items-center justify-center rounded-full bg-black/5 transition-colors hover:bg-black/10'
                >
                  <X size={20} />
                </button>
              </div>

              <div className='flex-1 overflow-y-auto p-6'>
                <div className='rounded-[28px] border border-black/5 bg-[#faf9f4] p-6'>
                  <p className='text-sm leading-7 whitespace-pre-wrap text-[#1a1a1a]'>
                    {currentUnit.audioScript}
                  </p>
                </div>
              </div>

              <div className='flex items-center justify-end gap-3 border-t border-black/5 p-6'>
                <button
                  onClick={() => setShowViewAudioScriptModal(false)}
                  className='rounded-2xl border border-black/10 px-5 py-3 font-medium text-black/60 transition-all hover:bg-black/5'
                >
                  Close
                </button>
                <button
                  onClick={handleCopyAudioScript}
                  className='inline-flex items-center gap-2 rounded-2xl bg-[#5A5A40] px-5 py-3 font-bold text-white transition-all hover:bg-[#4a4a35]'
                >
                  <Copy size={16} />
                  Copy
                </button>
              </div>
            </motion.div>
          </div>
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {showGenerateAudioScriptModal ? (
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
                    Generate Unit Audio Script
                  </h2>
                  <p className='mt-2 text-sm text-black/55'>
                    Turn this unit&apos;s lesson content into a spoken narration
                    script that can later be converted into audio.
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

                <div className='rounded-2xl border border-black/5 bg-[#faf9f4] p-4 text-sm text-black/55'>
                  {currentUnit.audioScript?.trim()
                    ? 'An audio script already exists for this unit. Generating again will replace it.'
                    : 'No audio script exists yet. Generating will save one to this unit.'}
                </div>
              </div>

              <div className='mt-8 flex items-center justify-end gap-3'>
                <button
                  onClick={() => {
                    if (!isGeneratingAudioScript) {
                      setShowGenerateAudioScriptModal(false);
                    }
                  }}
                  disabled={isGeneratingAudioScript}
                  className='rounded-2xl border border-black/10 px-5 py-3 font-medium text-black/60 transition-all hover:bg-black/5 disabled:opacity-50'
                >
                  {isGeneratingAudioScript ? 'Please wait...' : 'Cancel'}
                </button>
                <button
                  onClick={handleGenerateAudioScript}
                  disabled={
                    isGeneratingAudioScript || !currentUnit.content?.trim()
                  }
                  className='rounded-2xl bg-[#5A5A40] px-5 py-3 font-bold text-white transition-all hover:bg-[#4a4a35] disabled:opacity-50'
                >
                  {isGeneratingAudioScript ? 'Generating...' : 'Generate'}
                </button>
              </div>
            </motion.div>
          </div>
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {showGenerateAudioModal ? (
          <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm'>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className='w-full max-w-md rounded-[32px] bg-white p-8 shadow-2xl'
            >
              <div className='mb-6'>
                <h2 className='font-serif text-2xl text-[#1a1a1a]'>
                  Generate Unit Audio
                </h2>
                <p className='mt-2 text-sm text-black/55'>
                  Choose the Google voice settings used to synthesize this
                  unit&apos;s audio.
                </p>
              </div>

              <div className='space-y-5'>
                <div>
                  <label className='mb-2 block text-xs font-bold tracking-widest text-black/50 uppercase'>
                    Language
                  </label>
                  <select
                    value={audioLanguageCode}
                    onChange={(event) => {
                      setAudioLanguageCode(event.target.value);
                      setAudioVoiceName('');
                    }}
                    className='w-full rounded-xl border border-black/10 bg-white px-4 py-3 text-sm font-medium text-[#1a1a1a] transition outline-none focus:border-[#5A5A40]'
                  >
                    {GOOGLE_TTS_LANGUAGE_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className='mb-2 block text-xs font-bold tracking-widest text-black/50 uppercase'>
                    Gender
                  </label>
                  <select
                    value={audioSsmlGender}
                    onChange={(event) => {
                      setAudioSsmlGender(event.target.value);
                      setAudioVoiceName('');
                    }}
                    className='w-full rounded-xl border border-black/10 bg-white px-4 py-3 text-sm font-medium text-[#1a1a1a] transition outline-none focus:border-[#5A5A40]'
                  >
                    {GOOGLE_TTS_GENDER_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className='mb-2 block text-xs font-bold tracking-widest text-black/50 uppercase'>
                    Voice Name
                  </label>
                  <select
                    value={audioVoiceName}
                    onChange={(event) => {
                      const nextVoiceName = event.target.value;
                      const nextVoice = selectableGoogleVoices.find(
                        (voice) => voice.name === nextVoiceName,
                      );

                      setAudioVoiceName(nextVoiceName);

                      if (nextVoice) {
                        setAudioSsmlGender(nextVoice.ssmlGender);
                      }
                    }}
                    disabled={
                      isLoadingGoogleVoices ||
                      selectableGoogleVoices.length === 0
                    }
                    className='w-full rounded-xl border border-black/10 bg-white px-4 py-3 text-sm font-medium text-[#1a1a1a] transition outline-none focus:border-[#5A5A40]'
                  >
                    <option value=''>
                      {isLoadingGoogleVoices
                        ? 'Loading Google voices...'
                        : selectableGoogleVoices.length > 0
                          ? 'Select a Google voice'
                          : 'No Google voices found'}
                    </option>
                    {selectableGoogleVoices.map((voice) => (
                      <option key={voice.name} value={voice.name}>
                        {`${voice.name} • ${voice.ssmlGender.toLowerCase()} • ${voice.naturalSampleRateHertz}Hz`}
                      </option>
                    ))}
                  </select>
                  <p className='mt-2 text-xs text-black/45'>
                    Voice names are loaded from Google Text-to-Speech for the
                    selected language.
                  </p>
                </div>

                <div className='grid grid-cols-2 gap-4'>
                  <div>
                    <label className='mb-2 block text-xs font-bold tracking-widest text-black/50 uppercase'>
                      Speaking Rate
                    </label>
                    <input
                      type='number'
                      min='0.25'
                      max='4'
                      step='0.05'
                      value={audioSpeakingRate}
                      onChange={(event) =>
                        setAudioSpeakingRate(event.target.value)
                      }
                      className='w-full rounded-xl border border-black/10 bg-white px-4 py-3 text-sm font-medium text-[#1a1a1a] transition outline-none focus:border-[#5A5A40]'
                    />
                  </div>

                  <div>
                    <label className='mb-2 block text-xs font-bold tracking-widest text-black/50 uppercase'>
                      Pitch
                    </label>
                    <input
                      type='number'
                      min='-20'
                      max='20'
                      step='0.5'
                      value={audioPitch}
                      onChange={(event) => setAudioPitch(event.target.value)}
                      className='w-full rounded-xl border border-black/10 bg-white px-4 py-3 text-sm font-medium text-[#1a1a1a] transition outline-none focus:border-[#5A5A40]'
                    />
                  </div>
                </div>
              </div>

              <div className='mt-8 flex items-center justify-end gap-3'>
                <button
                  onClick={() => {
                    if (!isGeneratingAudio) {
                      setShowGenerateAudioModal(false);
                    }
                  }}
                  disabled={isGeneratingAudio}
                  className='rounded-2xl border border-black/10 px-5 py-3 font-medium text-black/60 transition-all hover:bg-black/5 disabled:opacity-50'
                >
                  {isGeneratingAudio ? 'Please wait...' : 'Cancel'}
                </button>
                <button
                  onClick={handleGenerateAudio}
                  disabled={
                    isGeneratingAudio || !currentUnit.audioScript?.trim()
                  }
                  className='rounded-2xl bg-[#5A5A40] px-5 py-3 font-bold text-white transition-all hover:bg-[#4a4a35] disabled:opacity-50'
                >
                  {isGeneratingAudio ? 'Generating...' : 'Generate Audio'}
                </button>
              </div>
            </motion.div>
          </div>
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {showUploadMediaModal ? (
          <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm'>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className='w-full max-w-lg rounded-[32px] bg-white p-8 shadow-2xl'
            >
              <div className='mb-6'>
                <h2 className='font-serif text-2xl text-[#1a1a1a]'>
                  Upload Unit Media
                </h2>
                <p className='mt-2 text-sm text-black/55'>
                  Add or replace the audio file, video file, or a YouTube link
                  used for this unit.
                </p>
              </div>

              <uploadMediaFetcher.Form
                method='post'
                encType='multipart/form-data'
                action={`/api/courses/${course?.course.id}/units/${currentUnit.id}/upload-media`}
                className='space-y-5'
              >
                <div>
                  <label className='mb-2 block text-xs font-bold tracking-widest text-black/50 uppercase'>
                    Audio File
                  </label>
                  <input
                    type='file'
                    name='audioFile'
                    accept='audio/*'
                    className='w-full rounded-xl border border-black/10 px-4 py-3 text-sm text-[#1a1a1a] file:mr-4 file:rounded-lg file:border-0 file:bg-[#5A5A40] file:px-3 file:py-2 file:text-sm file:font-bold file:text-white'
                  />
                  <p className='mt-2 text-xs text-black/45'>
                    {currentUnit.audioUrl
                      ? 'Uploading a new audio file will replace the current one.'
                      : 'Upload narration or lesson audio for this unit.'}
                  </p>
                </div>

                <div>
                  <label className='mb-2 block text-xs font-bold tracking-widest text-black/50 uppercase'>
                    Video File
                  </label>
                  <input
                    type='file'
                    name='videoFile'
                    accept='video/*'
                    className='w-full rounded-xl border border-black/10 px-4 py-3 text-sm text-[#1a1a1a] file:mr-4 file:rounded-lg file:border-0 file:bg-[#1f4a57] file:px-3 file:py-2 file:text-sm file:font-bold file:text-white'
                  />
                  <p className='mt-2 text-xs text-black/45'>
                    {currentUnit.videoUrl
                      ? 'Uploading a new video file will replace the current one.'
                      : 'Upload a video lesson for this unit.'}
                  </p>
                </div>

                <div>
                  <label className='mb-2 block text-xs font-bold tracking-widest text-black/50 uppercase'>
                    YouTube Link
                  </label>
                  <input
                    type='url'
                    name='videoLink'
                    placeholder='https://www.youtube.com/watch?v=...'
                    className='w-full rounded-xl border border-black/10 bg-white px-4 py-3 text-sm font-medium text-[#1a1a1a] transition outline-none focus:border-[#5A5A40]'
                  />
                  <p className='mt-2 text-xs text-black/45'>
                    Paste a YouTube link instead of uploading a video file.
                  </p>
                </div>

                <div className='rounded-2xl border border-black/5 bg-[#faf9f4] p-4 text-sm text-black/55'>
                  <p>Current media status:</p>
                  <p className='mt-2'>
                    Audio:{' '}
                    {hasUploadedAudio
                      ? 'Uploaded file'
                      : currentUnit.audioUrl
                        ? 'Attached'
                        : 'Not uploaded'}
                  </p>
                  <p>
                    Video:{' '}
                    {hasUploadedVideo
                      ? 'Uploaded file'
                      : hasVideoLink
                        ? 'YouTube link'
                        : 'Not uploaded'}
                  </p>
                  {hasUploadedAudio || hasUploadedVideo ? (
                    <div className='mt-4 flex flex-wrap gap-2'>
                      {hasUploadedAudio ? (
                        <button
                          type='button'
                          onClick={() => setMediaPendingDelete('audio')}
                          disabled={isUploadingMedia}
                          className='inline-flex items-center gap-2 rounded-xl border border-red-200 px-3 py-2 text-sm font-medium text-red-600 transition-all hover:bg-red-50 disabled:opacity-50'
                        >
                          <Trash2 size={16} />
                          Delete Audio
                        </button>
                      ) : null}
                      {hasUploadedVideo ? (
                        <button
                          type='button'
                          onClick={() => setMediaPendingDelete('video')}
                          disabled={isUploadingMedia}
                          className='inline-flex items-center gap-2 rounded-xl border border-red-200 px-3 py-2 text-sm font-medium text-red-600 transition-all hover:bg-red-50 disabled:opacity-50'
                        >
                          <Trash2 size={16} />
                          Delete Video
                        </button>
                      ) : null}
                    </div>
                  ) : null}
                </div>

                <div className='flex items-center justify-end gap-3'>
                  <button
                    type='button'
                    onClick={() => {
                      if (!isUploadingMedia) {
                        setShowUploadMediaModal(false);
                      }
                    }}
                    disabled={isUploadingMedia}
                    className='rounded-2xl border border-black/10 px-5 py-3 font-medium text-black/60 transition-all hover:bg-black/5 disabled:opacity-50'
                  >
                    {isUploadingMedia ? 'Please wait...' : 'Cancel'}
                  </button>
                  <button
                    type='submit'
                    disabled={isUploadingMedia}
                    className='rounded-2xl bg-[#5A5A40] px-5 py-3 font-bold text-white transition-all hover:bg-[#4a4a35] disabled:opacity-50'
                  >
                    {isUploadingMedia ? 'Uploading...' : 'Upload Media'}
                  </button>
                </div>
              </uploadMediaFetcher.Form>
            </motion.div>
          </div>
        ) : null}
      </AnimatePresence>

      <ConfirmModal
        isOpen={mediaPendingDelete !== null}
        title={`Delete unit ${mediaPendingDelete ?? 'media'}?`}
        description={`This will permanently remove the uploaded ${mediaPendingDelete ?? 'media'} file from this unit. This action cannot be undone.`}
        onClose={() => {
          if (!isUploadingMedia) {
            setMediaPendingDelete(null);
          }
        }}
        onConfirm={handleDeleteMedia}
        isLoading={isUploadingMedia}
        confirmVariant='danger'
      />

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
            key={`${currentQuizSessionId ?? 'quiz-session'}-${currentQuizIndex}-${quizTimerEnabled ? 'timed' : 'untimed'}`}
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
              syncQuizSession({
                completed: false,
                submittedCount: currentQuizIndex + 1,
              });
              if (currentQuizIndex < activeQuizzes.length - 1) {
                setCurrentQuizIndex((i) => i + 1);
              } else {
                completeQuizSession();
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
