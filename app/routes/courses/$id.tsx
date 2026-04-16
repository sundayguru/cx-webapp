import type { Route } from './+types/$id';
import { Link, type LoaderFunctionArgs, useFetcher } from 'react-router';
import { getUserFromRequest } from '~/utils/session.server';
import { getCourseById } from '~/db/courses';
import { motion, AnimatePresence } from 'motion/react';
import {
  Play,
  CheckCircle,
  ChevronRight,
  AlertTriangle,
  MessageSquare,
  Users,
  BarChart,
  BookOpen,
  Globe,
  Edit3,
  HelpCircle,
  X,
  FileText,
  Clock,
  Sparkles,
} from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import {
  CURRICULUM_MODEL_OPTIONS,
  DEFAULT_CURRICULUM_MODELS,
  DEFAULT_CURRICULUM_PROVIDER,
  type CurriculumAiProvider,
} from '~/utils/curriculum-options';
import { useToast } from '~/utils/useToast';

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  const user = await getUserFromRequest(request);
  if (!user) {
    return { data: null, user: null };
  }

  const courseId = (params as Record<string, string>).id;
  const data = await getCourseById(courseId);

  return { data, user };
};

export default function CourseDetailsPage({
  loaderData,
}: Route.ComponentProps) {
  const { data, user } = loaderData;
  const { showToast } = useToast();
  const curriculumFetcher = useFetcher();
  const rawTextFetcher = useFetcher();
  const rawTextUpdateFetcher = useFetcher();
  const splitRawTextFetcher = useFetcher();
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);
  const [isRawTextModalOpen, setIsRawTextModalOpen] = useState(false);
  const [isGenerateWarningOpen, setIsGenerateWarningOpen] = useState(false);
  const [isExtractWarningOpen, setIsExtractWarningOpen] = useState(false);
  const [isSplitWarningOpen, setIsSplitWarningOpen] = useState(false);
  const [editableRawText, setEditableRawText] = useState(
    data?.course.rawText || '',
  );
  const handledCurriculumResult = useRef<string | null>(null);
  const handledRawTextExtractResult = useRef<string | null>(null);
  const handledRawTextUpdateResult = useRef<string | null>(null);
  const handledSplitRawTextResult = useRef<string | null>(null);
  const [selectedProvider, setSelectedProvider] =
    useState<CurriculumAiProvider>(DEFAULT_CURRICULUM_PROVIDER);
  const [selectedModel, setSelectedModel] = useState(
    DEFAULT_CURRICULUM_MODELS[DEFAULT_CURRICULUM_PROVIDER],
  );
  const isGenerating = curriculumFetcher.state !== 'idle';
  const isExtractingRawText = rawTextFetcher.state !== 'idle';
  const isUpdatingRawText = rawTextUpdateFetcher.state !== 'idle';
  const isSplittingRawText = splitRawTextFetcher.state !== 'idle';

  const triggerGenerateCurriculum = () => {
    curriculumFetcher.submit(
      {
        provider: selectedProvider,
        model: selectedModel,
      },
      {
        method: 'post',
        action: `/api/courses/${data?.course.id}/generate-curriculum`,
      },
    );
  };

  const handleExtractRawText = () => {
    rawTextFetcher.submit(
      {},
      {
        method: 'post',
        action: `/api/courses/${data?.course.id}/extract-raw-text`,
      },
    );
  };

  const handleUpdateRawText = () => {
    rawTextUpdateFetcher.submit(
      { rawText: editableRawText },
      {
        method: 'post',
        action: `/api/courses/${data?.course.id}/update-raw-text`,
      },
    );
  };

  const handleSplitRawTextIntoModules = () => {
    splitRawTextFetcher.submit(
      {},
      {
        method: 'post',
        action: `/api/courses/${data?.course.id}/split-raw-text-into-modules`,
      },
    );
  };

  useEffect(() => {
    if (curriculumFetcher.state === 'idle' && curriculumFetcher.data) {
      const result = curriculumFetcher.data as {
        success?: boolean;
        error?: string;
      };
      const resultKey = JSON.stringify(result);
      if (result.success && handledCurriculumResult.current !== resultKey) {
        handledCurriculumResult.current = resultKey;
        showToast({
          tone: 'success',
          message: 'Curriculum generated successfully.',
        });
        window.setTimeout(() => {
          window.location.reload();
        }, 1200);
      } else if (
        result.error &&
        handledCurriculumResult.current !== resultKey
      ) {
        handledCurriculumResult.current = resultKey;
        showToast({
          tone: 'error',
          message: result.error,
        });
      }
    }
  }, [curriculumFetcher, showToast]);

  useEffect(() => {
    if (rawTextFetcher.state === 'idle' && rawTextFetcher.data) {
      const result = rawTextFetcher.data as {
        success?: boolean;
        error?: string;
        characters?: number;
      };
      const resultKey = JSON.stringify(result);
      if (result.success && handledRawTextExtractResult.current !== resultKey) {
        handledRawTextExtractResult.current = resultKey;
        showToast({
          tone: 'success',
          message: `PDF text extracted successfully${result.characters ? ` (${result.characters} characters)` : ''}.`,
        });
        window.setTimeout(() => {
          window.location.reload();
        }, 1200);
      } else if (
        result.error &&
        handledRawTextExtractResult.current !== resultKey
      ) {
        handledRawTextExtractResult.current = resultKey;
        showToast({
          tone: 'error',
          message: result.error,
        });
      }
    }
  }, [rawTextFetcher, showToast]);

  useEffect(() => {
    if (rawTextUpdateFetcher.state === 'idle' && rawTextUpdateFetcher.data) {
      const result = rawTextUpdateFetcher.data as {
        success?: boolean;
        error?: string;
        characters?: number;
      };
      const resultKey = JSON.stringify(result);
      if (result.success && handledRawTextUpdateResult.current !== resultKey) {
        handledRawTextUpdateResult.current = resultKey;
        showToast({
          tone: 'success',
          message: `Raw text updated successfully${result.characters !== undefined ? ` (${result.characters} characters)` : ''}.`,
        });
        window.setTimeout(() => {
          window.location.reload();
        }, 1200);
      } else if (
        result.error &&
        handledRawTextUpdateResult.current !== resultKey
      ) {
        handledRawTextUpdateResult.current = resultKey;
        showToast({
          tone: 'error',
          message: result.error,
        });
      }
    }
  }, [rawTextUpdateFetcher, showToast]);

  useEffect(() => {
    if (splitRawTextFetcher.state === 'idle' && splitRawTextFetcher.data) {
      const result = splitRawTextFetcher.data as {
        success?: boolean;
        error?: string;
        modulesCount?: number;
      };
      const resultKey = JSON.stringify(result);
      if (result.success && handledSplitRawTextResult.current !== resultKey) {
        handledSplitRawTextResult.current = resultKey;
        showToast({
          tone: 'success',
          message: `Created ${result.modulesCount ?? 0} modules from raw text.`,
        });
        window.setTimeout(() => {
          window.location.reload();
        }, 1200);
      } else if (
        result.error &&
        handledSplitRawTextResult.current !== resultKey
      ) {
        handledSplitRawTextResult.current = resultKey;
        showToast({
          tone: 'error',
          message: result.error,
        });
      }
    }
  }, [showToast, splitRawTextFetcher]);

  if (!data) {
    return (
      <div className='mx-auto max-w-4xl px-4 py-12'>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className='rounded-[40px] border border-black/5 bg-white p-12 text-center shadow-2xl'
        >
          <h1 className='mb-3 font-serif text-3xl text-[#1a1a1a]'>
            Course not found
          </h1>
          <p className='mb-8 text-black/60'>
            We couldn't find the course you're looking for.
          </p>
          <Link
            to='/courses'
            className='rounded-2xl bg-[#5A5A40] px-8 py-3 font-bold text-white'
          >
            Back to Courses
          </Link>
        </motion.div>
      </div>
    );
  }

  const { course, school, author, modules } = data;
  const isInstructor = user?.id === course.createdBy;
  const isDraft = course.status === 'pending';

  return (
    <div className='mx-auto max-w-7xl px-4 py-8'>
      {/* Hero Section */}
      <div className='mb-12 grid grid-cols-1 gap-12 lg:grid-cols-3'>
        <div className='lg:col-span-2'>
          <nav className='mb-6 flex items-center gap-2 text-sm text-black/40'>
            <Link
              to='/courses'
              className='transition-colors hover:text-[#5A5A40]'
            >
              Courses
            </Link>
            <ChevronRight size={14} />
            <span className='truncate text-black/60'>{course.title}</span>
            {isDraft && (
              <span className='ml-4 rounded bg-orange-100 px-2 py-0.5 text-[10px] font-bold tracking-wider text-orange-600 uppercase'>
                Pending Review
              </span>
            )}
          </nav>

          <h1 className='mb-6 font-serif text-5xl leading-tight text-[#1a1a1a]'>
            {course.title}
          </h1>
          <p className='mb-8 font-serif text-xl leading-relaxed text-black/60 italic'>
            {course.description}
          </p>

          <div className='mb-8 flex flex-wrap gap-6'>
            <div className='flex items-center gap-2 text-black/60'>
              <Users size={20} />
              <span className='font-medium'>24 Students</span>
            </div>
            <div className='flex items-center gap-2 text-black/60'>
              <BarChart size={20} />
              <span className='font-medium'>{course.level} Level</span>
            </div>
            <div className='flex items-center gap-2 text-black/60'>
              <BookOpen size={20} />
              <span className='font-medium'>{modules.length} Modules</span>
            </div>
            <button
              onClick={() => setIsPdfModalOpen(true)}
              className='flex items-center gap-2 font-bold text-[#5A5A40] underline-offset-4 hover:underline'
            >
              <FileText size={20} />
              Read Course Content
            </button>
          </div>

          <div className='mt-8 flex items-center gap-4 border-t border-black/5 pt-8'>
            {author && (
              <div className='flex items-center gap-3'>
                <div className='flex h-10 w-10 items-center justify-center rounded-full bg-[#5A5A40]/10 text-[#5A5A40]'>
                  <Globe size={20} />
                </div>
                <div>
                  <p className='text-xs font-bold tracking-widest text-black/40 uppercase'>
                    Created by
                  </p>
                  <p className='font-medium text-[#1a1a1a]'>{author.name}</p>
                </div>
              </div>
            )}
            {school && (
              <div className='flex items-center gap-3 border-l border-black/5 pl-8'>
                <div className='flex h-10 w-10 items-center justify-center rounded-full bg-[#5A5A40]/10 text-[#5A5A40]'>
                  <Play size={18} />
                </div>
                <div>
                  <p className='text-xs font-bold tracking-widest text-black/40 uppercase'>
                    Institution
                  </p>
                  <p className='font-medium text-[#1a1a1a]'>{school.name}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className='lg:col-span-1'>
          <div className='sticky top-8 overflow-hidden rounded-[32px] border border-black/5 bg-white p-6 shadow-xl'>
            <div className='group relative mb-6 overflow-hidden rounded-2xl'>
              <img
                src={
                  course.thumbnailKey
                    ? `/api/course/serve/${course.thumbnailKey}`
                    : `https://picsum.photos/seed/${course.id}/600/400`
                }
                className='aspect-video w-full object-cover transition-transform duration-500 group-hover:scale-105'
                alt={course.title}
              />
              <button
                onClick={() => setIsPdfModalOpen(true)}
                className='absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100'
              >
                <div className='flex h-14 w-14 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-md'>
                  <Play size={24} fill='currentColor' />
                </div>
              </button>
            </div>

            {isInstructor ? (
              <div className='space-y-3'>
                <button className='flex w-full items-center justify-center gap-2 rounded-2xl bg-[#5A5A40] py-4 text-lg font-bold text-white shadow-lg transition-all hover:bg-[#4a4a35] hover:shadow-xl active:scale-95'>
                  <Globe size={20} />
                  Course Settings
                </button>
                <Link
                  to={`/courses/${course.id}/edit`}
                  className='flex w-full items-center justify-center gap-2 rounded-2xl border border-black/10 py-4 text-lg font-bold text-black/60 transition-all hover:bg-black/5 active:scale-95'
                >
                  <Edit3 size={20} />
                  Edit Course
                </Link>
                <button
                  onClick={() => setIsExtractWarningOpen(true)}
                  disabled={isExtractingRawText}
                  className='flex w-full items-center justify-center gap-2 rounded-2xl border border-black/10 py-4 text-lg font-bold text-black/60 transition-all hover:bg-black/5 active:scale-95 disabled:opacity-50'
                >
                  <FileText size={20} />
                  {isExtractingRawText
                    ? 'Extracting PDF Text...'
                    : 'Extract PDF Text'}
                </button>
                {course.rawText ? (
                  <button
                    onClick={() => {
                      setEditableRawText(course.rawText || '');
                      setIsRawTextModalOpen(true);
                    }}
                    className='flex w-full items-center justify-center gap-2 rounded-2xl border border-black/10 py-4 text-lg font-bold text-black/60 transition-all hover:bg-black/5 active:scale-95'
                  >
                    <Edit3 size={20} />
                    Edit Course Text
                  </button>
                ) : null}
                {course.rawText ? (
                  <button
                    onClick={() => setIsSplitWarningOpen(true)}
                    disabled={isSplittingRawText}
                    className='flex w-full items-center justify-center gap-2 rounded-2xl border border-black/10 py-4 text-lg font-bold text-black/60 transition-all hover:bg-black/5 active:scale-95 disabled:opacity-50'
                  >
                    <BookOpen size={20} />
                    {isSplittingRawText
                      ? 'Splitting Into Modules...'
                      : 'Split Raw Text Into Modules'}
                  </button>
                ) : null}
                <div className='space-y-3 rounded-2xl border border-black/10 bg-black/[0.02] p-4'>
                  <div>
                    <label
                      htmlFor='curriculum-provider'
                      className='mb-2 block text-xs font-bold tracking-widest text-black/50 uppercase'
                    >
                      AI Provider
                    </label>
                    <select
                      id='curriculum-provider'
                      value={selectedProvider}
                      onChange={(event) => {
                        const provider = event.target
                          .value as CurriculumAiProvider;
                        setSelectedProvider(provider);
                        setSelectedModel(DEFAULT_CURRICULUM_MODELS[provider]);
                      }}
                      className='w-full rounded-xl border border-black/10 bg-white px-4 py-3 text-sm font-medium text-[#1a1a1a] transition outline-none focus:border-[#5A5A40]'
                    >
                      <option value='google'>Google</option>
                      <option value='groq'>Groq</option>
                    </select>
                  </div>
                  <div>
                    <label
                      htmlFor='curriculum-model'
                      className='mb-2 block text-xs font-bold tracking-widest text-black/50 uppercase'
                    >
                      Model
                    </label>
                    <select
                      id='curriculum-model'
                      value={selectedModel}
                      onChange={(event) => setSelectedModel(event.target.value)}
                      className='w-full rounded-xl border border-black/10 bg-white px-4 py-3 text-sm font-medium text-[#1a1a1a] transition outline-none focus:border-[#5A5A40]'
                    >
                      {CURRICULUM_MODEL_OPTIONS[selectedProvider].map(
                        (modelOption) => (
                          <option
                            key={modelOption.value}
                            value={modelOption.value}
                          >
                            {modelOption.label}
                          </option>
                        ),
                      )}
                    </select>
                  </div>
                </div>
                <button
                  onClick={() => setIsGenerateWarningOpen(true)}
                  disabled={isGenerating}
                  className='flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-purple-500 to-blue-500 py-4 text-lg font-bold text-white shadow-md shadow-purple-200 transition-all hover:shadow-lg active:scale-95'
                >
                  <Sparkles size={20} />
                  {isGenerating ? 'Generating...' : 'AI Generate Curriculum'}
                </button>
              </div>
            ) : (
              <div className='space-y-3'>
                <button className='w-full rounded-2xl bg-[#5A5A40] py-4 text-lg font-bold text-white shadow-lg transition-all hover:bg-[#4a4a35] hover:shadow-xl active:scale-95'>
                  Go to Course
                </button>
                <button
                  onClick={() => setIsPdfModalOpen(true)}
                  className='flex w-full items-center justify-center gap-2 rounded-2xl border border-[#5A5A40] py-4 text-lg font-bold text-[#5A5A40] transition-all hover:bg-[#5A5A40]/5 active:scale-95'
                >
                  <HelpCircle size={20} />
                  View Syllabus
                </button>
              </div>
            )}

            <div className='mt-6 flex flex-col gap-3'>
              <div className='flex items-center gap-3 text-sm text-black/50'>
                <Clock size={16} />
                <span>Full lifetime access</span>
              </div>
              <div className='flex items-center gap-3 text-sm text-black/50'>
                <CheckCircle size={16} />
                <span>Certificate of completion</span>
              </div>
              <div className='flex items-center gap-3 text-sm text-black/50'>
                <FileText size={16} />
                <span>
                  {course.rawText
                    ? `Raw text stored (${course.rawText.length} chars)`
                    : 'Raw text not extracted yet'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Course Content */}
      <div className='grid grid-cols-1 gap-12 lg:grid-cols-3'>
        <div className='lg:col-span-2'>
          <h2 className='mb-8 font-serif text-3xl text-[#1a1a1a]'>
            Course Curriculum
          </h2>
          <div className='space-y-4'>
            {modules.map((module: any, mIdx: number) => (
              <div
                key={module.id}
                className='overflow-hidden rounded-[24px] border border-black/5 bg-white shadow-sm'
              >
                <div className='flex items-center justify-between border-b border-black/5 bg-black/[0.01] p-6'>
                  <div className='flex items-center gap-4'>
                    <h3 className='text-lg font-bold text-[#1a1a1a]'>
                      Module {mIdx + 1}: {module.title}
                    </h3>
                  </div>
                  <span className='text-xs font-bold tracking-wider text-black/30 uppercase'>
                    {module.units.length} Units
                  </span>
                </div>
                <div className='divide-y divide-black/5'>
                  {module.units.map((unit: any, uIdx: number) => (
                    <Link
                      key={unit.id}
                      to={`/courses/${course.id}/units/${unit.id}`}
                      className='group flex items-center gap-4 p-4 transition-colors hover:bg-black/[0.01]'
                    >
                      <div className='flex h-8 w-8 items-center justify-center rounded-full bg-black/5 text-xs font-bold text-black/40 transition-all group-hover:bg-[#5A5A40] group-hover:text-white'>
                        {uIdx + 1}
                      </div>
                      <span className='flex-1 font-medium text-[#1a1a1a] transition-colors group-hover:text-[#5A5A40]'>
                        {unit.title}
                      </span>
                      <Play
                        size={16}
                        className='text-black/20 group-hover:text-[#5A5A40]'
                      />
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className='lg:col-span-1'>
          <h2 className='mb-8 font-serif text-3xl text-[#1a1a1a]'>Community</h2>
          <div className='rounded-[24px] border border-black/5 bg-white p-8 shadow-md'>
            <div className='mb-6 flex items-center gap-4'>
              <div className='flex -space-x-2'>
                {[1, 2, 3].map((i) => (
                  <img
                    key={i}
                    src={`https://i.pravatar.cc/100?u=${i + 10}`}
                    className='h-10 w-10 rounded-full border-2 border-white shadow-sm'
                    alt='User'
                  />
                ))}
              </div>
              <span className='text-sm font-medium text-black/60'>
                Join active discussions
              </span>
            </div>
            <button className='flex w-full items-center justify-center gap-2 rounded-2xl border border-black/10 py-4 font-bold transition-all hover:bg-black/5 active:scale-95'>
              <MessageSquare size={18} />
              Open Community Space
            </button>
          </div>
        </div>
      </div>

      {/* PDF Modal */}
      <AnimatePresence>
        {isPdfModalOpen && course.contentKey && (
          <div className='fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8'>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsPdfModalOpen(false)}
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
                      {course.code}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsPdfModalOpen(false)}
                  className='flex h-10 w-10 items-center justify-center rounded-full bg-black/5 transition-colors hover:bg-black/10'
                >
                  <X size={20} />
                </button>
              </div>
              <div className='flex-1 bg-gray-100 p-4'>
                <iframe
                  src={`/api/course/serve/${course.contentKey}`}
                  className='h-full w-full rounded-2xl border border-black/5 bg-white'
                  title={course.title}
                />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isGenerateWarningOpen ? (
          <div className='fixed inset-0 z-[105] flex items-center justify-center p-4 md:p-8'>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsGenerateWarningOpen(false)}
              className='absolute inset-0 bg-black/70 backdrop-blur-sm'
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 16 }}
              className='relative w-full max-w-xl rounded-[32px] bg-white p-8 shadow-2xl'
            >
              <div className='mb-6 flex items-start gap-4'>
                <div className='flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-100 text-orange-600'>
                  <AlertTriangle size={24} />
                </div>
                <div>
                  <h3 className='font-serif text-2xl text-[#1a1a1a]'>
                    Replace Existing Curriculum?
                  </h3>
                  <p className='mt-2 text-sm leading-6 text-black/55'>
                    Generating curriculum again will replace the current modules
                    and units for this course.
                  </p>
                </div>
              </div>
              <div className='flex items-center justify-end gap-3'>
                <button
                  onClick={() => setIsGenerateWarningOpen(false)}
                  className='rounded-2xl border border-black/10 px-5 py-3 font-medium text-black/60 transition-all hover:bg-black/5'
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    setIsGenerateWarningOpen(false);
                    triggerGenerateCurriculum();
                  }}
                  className='rounded-2xl bg-[#5A5A40] px-5 py-3 font-bold text-white transition-all hover:bg-[#4a4a35]'
                >
                  Continue
                </button>
              </div>
            </motion.div>
          </div>
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {isExtractWarningOpen ? (
          <div className='fixed inset-0 z-[105] flex items-center justify-center p-4 md:p-8'>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsExtractWarningOpen(false)}
              className='absolute inset-0 bg-black/70 backdrop-blur-sm'
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 16 }}
              className='relative w-full max-w-xl rounded-[32px] bg-white p-8 shadow-2xl'
            >
              <div className='mb-6 flex items-start gap-4'>
                <div className='flex h-24 w-24 items-center justify-center rounded-2xl bg-orange-100 text-orange-600'>
                  <AlertTriangle size={24} />
                </div>
                <div>
                  <h3 className='font-serif text-2xl text-[#1a1a1a]'>
                    Extract PDF Text?
                  </h3>
                  <p className='mt-2 text-sm leading-6 text-black/55'>
                    This will extract text from the uploaded PDF and save it to
                    the course raw text field. If raw text already exists, it
                    will be replaced.
                  </p>
                </div>
              </div>
              <div className='flex items-center justify-end gap-3'>
                <button
                  onClick={() => setIsExtractWarningOpen(false)}
                  className='rounded-2xl border border-black/10 px-5 py-3 font-medium text-black/60 transition-all hover:bg-black/5'
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    setIsExtractWarningOpen(false);
                    handleExtractRawText();
                  }}
                  className='rounded-2xl bg-[#5A5A40] px-5 py-3 font-bold text-white transition-all hover:bg-[#4a4a35]'
                >
                  Continue
                </button>
              </div>
            </motion.div>
          </div>
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {isSplitWarningOpen ? (
          <div className='fixed inset-0 z-[105] flex items-center justify-center p-4 md:p-8'>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSplitWarningOpen(false)}
              className='absolute inset-0 bg-black/70 backdrop-blur-sm'
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 16 }}
              className='relative w-full max-w-xl rounded-[32px] bg-white p-8 shadow-2xl'
            >
              <div className='mb-6 flex items-start gap-4'>
                <div className='flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-100 text-orange-600'>
                  <AlertTriangle size={24} />
                </div>
                <div>
                  <h3 className='font-serif text-2xl text-[#1a1a1a]'>
                    Split Raw Text Into Modules?
                  </h3>
                  <p className='mt-2 text-sm leading-6 text-black/55'>
                    This will replace the current module and unit structure with
                    modules created from the course raw text. Each section
                    between `--end--` markers becomes one module.
                  </p>
                </div>
              </div>
              <div className='flex items-center justify-end gap-3'>
                <button
                  onClick={() => setIsSplitWarningOpen(false)}
                  className='rounded-2xl border border-black/10 px-5 py-3 font-medium text-black/60 transition-all hover:bg-black/5'
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    setIsSplitWarningOpen(false);
                    handleSplitRawTextIntoModules();
                  }}
                  className='rounded-2xl bg-[#5A5A40] px-5 py-3 font-bold text-white transition-all hover:bg-[#4a4a35]'
                >
                  Continue
                </button>
              </div>
            </motion.div>
          </div>
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {isRawTextModalOpen ? (
          <div className='fixed inset-0 z-[110] flex items-center justify-center p-4 md:p-8'>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                if (!isUpdatingRawText) {
                  setIsRawTextModalOpen(false);
                }
              }}
              className='absolute inset-0 bg-black/80 backdrop-blur-sm'
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 20 }}
              className='relative flex h-full w-full max-w-5xl flex-col overflow-hidden rounded-[40px] bg-white shadow-2xl'
            >
              <div className='flex items-center justify-between border-b border-black/5 bg-white p-6'>
                <div className='flex items-center gap-4 text-[#5A5A40]'>
                  <div className='flex h-10 w-10 items-center justify-center rounded-xl bg-[#5A5A40]/10'>
                    <Edit3 size={20} />
                  </div>
                  <div>
                    <h3 className='leading-tight font-bold text-[#1a1a1a]'>
                      Edit Course Text
                    </h3>
                    <p className='text-xs font-bold tracking-widest text-black/40 uppercase'>
                      Raw extracted text
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    if (!isUpdatingRawText) {
                      setIsRawTextModalOpen(false);
                    }
                  }}
                  disabled={isUpdatingRawText}
                  className='flex h-10 w-10 items-center justify-center rounded-full bg-black/5 transition-colors hover:bg-black/10 disabled:opacity-50'
                >
                  <X size={20} />
                </button>
              </div>
              <div className='flex-1 bg-[#f7f6ef] p-4'>
                <textarea
                  value={editableRawText}
                  onChange={(event) => setEditableRawText(event.target.value)}
                  className='h-full min-h-[24rem] w-full rounded-2xl border border-black/5 bg-white p-6 font-mono text-sm leading-6 text-[#1a1a1a] transition outline-none focus:border-[#5A5A40]'
                  placeholder='Course raw text will appear here.'
                />
              </div>
              <div className='flex items-center justify-between border-t border-black/5 bg-white p-6'>
                <p className='text-sm text-black/45'>
                  {editableRawText.length} characters
                </p>
                <div className='flex items-center gap-3'>
                  <button
                    onClick={() => setIsRawTextModalOpen(false)}
                    disabled={isUpdatingRawText}
                    className='rounded-2xl border border-black/10 px-5 py-3 font-medium text-black/60 transition-all hover:bg-black/5 disabled:opacity-50'
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleUpdateRawText}
                    disabled={isUpdatingRawText}
                    className='rounded-2xl bg-[#5A5A40] px-5 py-3 font-bold text-white transition-all hover:bg-[#4a4a35] disabled:opacity-50'
                  >
                    {isUpdatingRawText ? 'Saving...' : 'Save Raw Text'}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
