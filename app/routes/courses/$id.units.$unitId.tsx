import type { Route } from './+types/$id.units.$unitId';
import { data, Link, useFetcher, useLoaderData } from 'react-router';
import { getCourseById } from '~/db/courses';
import { getUserFromRequest } from '~/utils/session.server';
import { motion, AnimatePresence } from 'motion/react';
import Markdown from 'react-markdown';
import type { SelectModule } from '~/db/schemas/modules';
import type { SelectUnit } from '~/db/schemas/units';
import type { User } from '~/types';
import {
  Bookmark,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  FileText,
  HelpCircle,
  MessageCircle,
  MoreVertical,
  Play,
  Sparkles,
  Volume2,
} from 'lucide-react';
import { useMemo, useRef, useState } from 'react';
import {
  CURRICULUM_MODEL_OPTIONS,
  DEFAULT_CURRICULUM_MODELS,
  DEFAULT_CURRICULUM_PROVIDER,
  type CurriculumAiProvider,
} from '~/utils/curriculum-options';

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

type QuizQuestion = {
  id: string;
  prompt: string;
  context?: string;
};

type LoaderData = {
  course: Awaited<ReturnType<typeof getCourseById>>;
  modules: CourseModuleWithUnits[];
  currentUnit: FlattenedUnit;
  previousUnit: FlattenedUnit | null;
  nextUnit: FlattenedUnit | null;
  user: User | null;
};

const cx = (...classes: Array<string | false | null | undefined>) =>
  classes.filter(Boolean).join(' ');

const splitIntoParagraphs = (content: string) =>
  content
    .split(/\n\s*\n/g)
    .map((paragraph) => paragraph.replace(/\s+/g, ' ').trim())
    .filter(Boolean);

const buildQuiz = (content: string): QuizQuestion[] => {
  const paragraphs = splitIntoParagraphs(content);

  return paragraphs.slice(0, 3).map((paragraph, index) => ({
    id: `question-${index}`,
    prompt: `How would you explain insight ${index + 1} from this unit in your own words?`,
    context:
      paragraph.length > 180 ? `${paragraph.slice(0, 177)}...` : paragraph,
  }));
};

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

  return {
    course: courseData,
    modules,
    currentUnit: flattenedUnits[currentUnitIndex],
    previousUnit: flattenedUnits[currentUnitIndex - 1] ?? null,
    nextUnit: flattenedUnits[currentUnitIndex + 1] ?? null,
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
  user,
}: LoaderData) => {
  const [mode, setMode] = useState<'text' | 'audio' | 'video'>('text');
  const [showChat, setShowChat] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [showQuiz, setShowQuiz] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [selectedProvider, setSelectedProvider] =
    useState<CurriculumAiProvider>(DEFAULT_CURRICULUM_PROVIDER);
  const [selectedModel, setSelectedModel] = useState(
    DEFAULT_CURRICULUM_MODELS[DEFAULT_CURRICULUM_PROVIDER],
  );
  const generateContentFetcher = useFetcher();
  const isGenerating = generateContentFetcher.state !== 'idle';

  const isInstructor = user?.id === course?.course.createdBy;
  const hasRawText = Boolean(currentUnit.rawText?.trim());

  const [isBookmarked, setIsBookmarked] = useState(() =>
    readStoredUnitIds('coursex:bookmarked-units').includes(currentUnit.id),
  );
  const [isCompleted, setIsCompleted] = useState(() =>
    readStoredUnitIds('coursex:completed-units').includes(currentUnit.id),
  );
  const [question, setQuestion] = useState('');
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const audioRef = useRef<HTMLAudioElement>(null);

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

  const quizQuestions = useMemo(
    () => buildQuiz(currentUnit.content ?? ''),
    [currentUnit.content],
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
    const completedUnits = JSON.parse(
      window.localStorage.getItem('coursex:completed-units') ?? '[]',
    ) as string[];

    if (!completedUnits.includes(currentUnit.id)) {
      const nextCompletedUnits = [...completedUnits, currentUnit.id];
      window.localStorage.setItem(
        'coursex:completed-units',
        JSON.stringify(nextCompletedUnits),
      );
    }

    setIsCompleted(true);
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
    <div className='h-[calc(100vh-8rem)] overflow-hidden rounded-[36px] border border-black/5 bg-white shadow-[0_30px_80px_-30px_rgba(0,0,0,0.25)]'>
      <div className='flex h-full min-h-0'>
        <aside className='hidden w-80 border-r border-black/5 bg-[#faf9f4] lg:block'>
          <div className='border-b border-black/5 p-6'>
            <Link
              to={`/courses/${course?.course.id}`}
              className='mb-4 flex items-center gap-2 text-sm text-black/40 transition-colors hover:text-[#5A5A40]'
            >
              <ChevronLeft size={16} />
              Back to Course
            </Link>
            <h2 className='font-serif text-2xl text-[#1a1a1a]'>
              {course?.course.title}
            </h2>
            <p className='mt-2 text-sm text-black/45'>
              Continue through the course structure one unit at a time.
            </p>
          </div>

          <div className='h-[calc(100%-7.5rem)] overflow-y-auto p-4'>
            <div className='space-y-6'>
              {modules.map((module, moduleIndex) => (
                <div key={module.id}>
                  <h3 className='mb-3 px-2 text-[11px] font-bold tracking-[0.24em] text-black/30 uppercase'>
                    Module {moduleIndex + 1}: {module.title}
                  </h3>
                  <div className='space-y-1'>
                    {module.units.map((unit) => {
                      const isActive = unit.id === currentUnit.id;

                      return (
                        <Link
                          key={unit.id}
                          to={`/courses/${course?.course.id}/units/${unit.id}`}
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
                                : 'border-black/10 bg-white',
                            )}
                          >
                            {isActive ? (
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
        </aside>

        <div className='flex min-w-0 flex-1 flex-col'>
          <div className='sticky top-0 z-10 flex h-16 items-center justify-between border-b border-black/5 bg-white/90 px-4 backdrop-blur-md md:px-8'>
            <div className='flex items-center gap-2'>
              <div className='rounded-2xl bg-black/5 p-1'>
                <button
                  onClick={() => setMode('text')}
                  className={cx(
                    'rounded-xl px-3 py-2 text-sm font-medium transition-all md:px-4',
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
                    'rounded-xl px-3 py-2 text-sm font-medium transition-all md:px-4',
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
                    'rounded-xl px-3 py-2 text-sm font-medium transition-all md:px-4',
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
              </div>
            </div>

            <div className='hidden items-center gap-3 xl:flex'>
              <button
                onClick={() => setShowChat((visible) => !visible)}
                className={cx(
                  'flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-medium transition-all',
                  showChat
                    ? 'border-[#5A5A40] bg-[#5A5A40] text-white'
                    : 'border-black/10 text-black/60 hover:bg-black/5',
                )}
              >
                <MessageCircle size={18} />
                Ask AI
              </button>
              <button
                onClick={toggleBookmark}
                className={cx(
                  'flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-medium transition-all',
                  isBookmarked
                    ? 'border-orange-100 bg-orange-50 text-orange-600'
                    : 'border-black/10 text-black/60 hover:bg-black/5',
                )}
              >
                <Bookmark
                  size={18}
                  fill={isBookmarked ? 'currentColor' : 'none'}
                />
                {isBookmarked ? 'Bookmarked' : 'Bookmark'}
              </button>
              <button
                onClick={() => setShowSummary(true)}
                className='flex items-center gap-2 rounded-xl border border-black/10 px-3 py-2 text-sm font-medium text-black/60 transition-all hover:bg-black/5'
              >
                <Sparkles size={18} />
                Summary
              </button>
              <button
                onClick={() => setShowQuiz(true)}
                className='flex items-center gap-2 rounded-xl border border-black/10 px-3 py-2 text-sm font-medium text-black/60 transition-all hover:bg-black/5'
              >
                <HelpCircle size={18} />
                Quiz Me
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
              {isInstructor && (
                <div className='relative'>
                  <button
                    onClick={() => setShowMoreMenu(!showMoreMenu)}
                    className='flex h-10 w-10 items-center justify-center rounded-full border border-black/10 text-black/60 transition-all hover:bg-black/5'
                  >
                    <MoreVertical size={18} />
                  </button>
                  {showMoreMenu && (
                    <div className='absolute top-12 right-0 z-20 min-w-[180px] rounded-xl border border-black/10 bg-white py-1 shadow-lg'>
                      {hasRawText && (
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
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className='flex min-h-0 flex-1'>
            <div className='min-w-0 flex-1 overflow-y-auto p-6 md:p-10 xl:p-12'>
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
                </AnimatePresence>
                <div className='mt-4 flex items-center gap-3'>
                  {previousUnit ? (
                    <Link
                      to={`/courses/${course?.course.id}/units/${previousUnit.id}`}
                      className='inline-flex items-center gap-2 rounded-2xl border border-black/10 px-4 py-3 text-sm font-medium text-black/60 transition-all hover:bg-black/5'
                    >
                      <ChevronLeft size={16} />
                      Previous
                    </Link>
                  ) : null}
                  {nextUnit ? (
                    <Link
                      to={`/courses/${course?.course.id}/units/${nextUnit.id}`}
                      className='inline-flex items-center gap-2 rounded-2xl bg-[#5A5A40] px-4 py-3 text-sm font-bold text-white transition-all hover:bg-[#4a4a35]'
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
        {showQuiz ? (
          <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm'>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className='max-h-[80vh] w-full max-w-3xl overflow-y-auto rounded-[32px] bg-white p-8 shadow-2xl'
            >
              <div className='mb-8 flex items-center justify-between'>
                <div>
                  <h2 className='font-serif text-2xl text-[#1a1a1a]'>
                    Review Prompts
                  </h2>
                  <p className='mt-2 text-sm text-black/45'>
                    Use these questions to test recall and deepen understanding.
                  </p>
                </div>
                <button
                  onClick={() => setShowQuiz(false)}
                  className='text-black/40 transition-colors hover:text-black'
                >
                  <ChevronRight size={22} className='rotate-90' />
                </button>
              </div>

              <div className='space-y-5'>
                {quizQuestions.length > 0 ? (
                  quizQuestions.map((item, index) => (
                    <div
                      key={item.id}
                      className='rounded-2xl border border-black/5 bg-[#f5f5f0] p-6'
                    >
                      <p className='mb-3 font-bold text-[#1a1a1a]'>
                        {index + 1}. {item.prompt}
                      </p>
                      {item.context ? (
                        <p className='text-sm leading-7 text-black/60'>
                          Reference: {item.context}
                        </p>
                      ) : null}
                    </div>
                  ))
                ) : (
                  <div className='rounded-2xl border border-dashed border-black/10 bg-[#f5f5f0] p-6 text-sm text-black/55'>
                    Add more unit content to generate richer review prompts.
                  </div>
                )}
              </div>

              <button
                onClick={() => setShowQuiz(false)}
                className='mt-8 w-full rounded-2xl bg-[#5A5A40] py-4 font-bold text-white transition-colors hover:bg-[#4a4a35]'
              >
                Back to Lesson
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
                  onClick={() => setShowGenerateModal(false)}
                  disabled={isGenerating}
                  className='rounded-2xl border border-black/10 px-5 py-3 font-medium text-black/60 transition-all hover:bg-black/5 disabled:opacity-50'
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    setShowGenerateModal(false);
                    handleGenerateContent();
                  }}
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
    </div>
  );
};
