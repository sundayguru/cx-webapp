import type { Route } from './+types/$id';
import { Link, type LoaderFunctionArgs, useFetcher } from 'react-router';
import { motion } from 'motion/react';
import { useEffect, useRef, useState } from 'react';
import { getCourseById } from '~/db/courses';
import { getCourseProgressStats } from '~/db/quizzes';
import { getEnrollmentCount, isUserEnrolled } from '~/db/enrollments';
import { getUserFromRequest } from '~/utils/session.server';
import { getAllCommunityPostsForCourse } from '~/db/community';
import {
  CURRICULUM_MODEL_OPTIONS,
  DEFAULT_CURRICULUM_MODELS,
  DEFAULT_CURRICULUM_PROVIDER,
  type CurriculumAiProvider,
} from '~/utils/curriculum-options';
import { useToast } from '~/utils/useToast';
import { ConfirmModal } from '~/components/ConfirmModal';
import { CourseContent } from './course-details/CourseContent';
import { CourseModals } from './course-details/CourseModals';
import { CourseOverview } from './course-details/CourseOverview';
import { CourseSidebar } from './course-details/CourseSidebar';
import { CoursePlaylist, type PlaylistItem } from '~/components/CoursePlaylist';

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  const user = await getUserFromRequest(request);
  const courseId = (params as Record<string, string>).id;

  if (!courseId) {
    return {
      data: null,
      user: null,
      progressStats: null,
      isEnrolled: false,
      enrollmentCount: 0,
      communityUsers: [],
    };
  }

  const data = await getCourseById(courseId);
  const enrollmentCount = await getEnrollmentCount(courseId);

  if (!user) {
    return {
      data,
      user: null,
      progressStats: null,
      isEnrolled: false,
      enrollmentCount,
      communityUsers: [],
    };
  }

  const isEnrolled = await isUserEnrolled(courseId, user.id);

  const allUnitIds =
    data?.modules.flatMap((m) => m.units.map((u) => u.id)) || [];
  const progressStats = isEnrolled
    ? await getCourseProgressStats(user.id, allUnitIds)
    : null;

  const communityData = await getAllCommunityPostsForCourse(courseId);
  const communityPosts = communityData?.allPosts || [];

  const uniqueUsersMap = new Map<
    string,
    { id: string; firstName: string; avatarUrl: string | null }
  >();
  communityPosts.forEach((postItem) => {
    if (!uniqueUsersMap.has(postItem.user.id)) {
      uniqueUsersMap.set(postItem.user.id, {
        id: postItem.user.id,
        firstName: postItem.user.firstName,
        avatarUrl: postItem.profile?.avatarUrl,
      });
    }
  });
  const communityUsers = Array.from(uniqueUsersMap.values()).slice(0, 5);

  return {
    data,
    user,
    progressStats,
    isEnrolled,
    enrollmentCount,
    communityUsers,
  };
};

export default function CourseDetailsPage({
  loaderData,
}: Route.ComponentProps) {
  const {
    data,
    user,
    progressStats,
    isEnrolled,
    enrollmentCount,
    communityUsers,
  } = loaderData;
  const { showToast } = useToast();
  const curriculumFetcher = useFetcher();
  const unitGenerationFetcher = useFetcher();
  const enrollFetcher = useFetcher();
  const rawTextFetcher = useFetcher();
  const rawTextUpdateFetcher = useFetcher();
  const tagRawTextFetcher = useFetcher();
  const splitRawTextFetcher = useFetcher();
  const splitModuleRawTextFetcher = useFetcher();
  const moduleRawTextUpdateFetcher = useFetcher();
  const publishFetcher = useFetcher();
  const deleteFetcher = useFetcher();

  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);
  const [isPlaylistOpen, setIsPlaylistOpen] = useState(false);
  const [isRawTextModalOpen, setIsRawTextModalOpen] = useState(false);
  const [isGenerateCurriculumModalOpen, setIsGenerateCurriculumModalOpen] =
    useState(false);
  const [isTagRawTextModalOpen, setIsTagRawTextModalOpen] = useState(false);
  const [isGenerateWarningOpen, setIsGenerateWarningOpen] = useState(false);
  const [isGenerateUnitsModalOpen, setIsGenerateUnitsModalOpen] =
    useState(false);
  const [isExtractWarningOpen, setIsExtractWarningOpen] = useState(false);
  const [isSplitWarningOpen, setIsSplitWarningOpen] = useState(false);
  const [isModuleRawTextModalOpen, setIsModuleRawTextModalOpen] =
    useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [editingModuleId, setEditingModuleId] = useState<string | null>(null);
  const [editableRawText, setEditableRawText] = useState(
    data?.course.rawText || '',
  );
  const [editableModuleRawText, setEditableModuleRawText] = useState('');
  const [selectedProvider, setSelectedProvider] =
    useState<CurriculumAiProvider>(DEFAULT_CURRICULUM_PROVIDER);
  const [selectedModel, setSelectedModel] = useState(
    DEFAULT_CURRICULUM_MODELS[DEFAULT_CURRICULUM_PROVIDER],
  );

  const modulesWithRawText =
    data?.modules.filter((module) => module.rawText?.trim()) || [];
  const [selectedModuleId, setSelectedModuleId] = useState(
    modulesWithRawText[0]?.id || '',
  );
  const effectiveSelectedModuleId =
    modulesWithRawText.find((module) => module.id === selectedModuleId)?.id ||
    modulesWithRawText[0]?.id ||
    '';

  const handledCurriculumResult = useRef<string | null>(null);
  const handledGenerateUnitsResult = useRef<string | null>(null);
  const handledRawTextExtractResult = useRef<string | null>(null);
  const handledRawTextUpdateResult = useRef<string | null>(null);
  const handledTagRawTextResult = useRef<string | null>(null);
  const handledSplitRawTextResult = useRef<string | null>(null);

  const isGenerating = curriculumFetcher.state !== 'idle';
  const isGeneratingUnits = unitGenerationFetcher.state !== 'idle';
  const isExtractingRawText = rawTextFetcher.state !== 'idle';
  const isUpdatingRawText = rawTextUpdateFetcher.state !== 'idle';
  const isTaggingRawText = tagRawTextFetcher.state !== 'idle';
  const isSplittingRawText = splitRawTextFetcher.state !== 'idle';
  const isSplittingModuleRawText = splitModuleRawTextFetcher.state !== 'idle';
  const isUpdatingModuleRawText = moduleRawTextUpdateFetcher.state !== 'idle';
  const isDeletingCourse = deleteFetcher.state !== 'idle';

  const handleProviderChange = (provider: CurriculumAiProvider) => {
    setSelectedProvider(provider);
    setSelectedModel(DEFAULT_CURRICULUM_MODELS[provider]);
  };

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

  const handleGenerateUnits = () => {
    unitGenerationFetcher.submit(
      {
        provider: selectedProvider,
        model: selectedModel,
        moduleId: effectiveSelectedModuleId,
      },
      {
        method: 'post',
        action: `/api/courses/${data?.course.id}/generate-units`,
      },
    );
  };

  const handlePublish = () => {
    publishFetcher.submit(
      { intent: 'publish' },
      {
        method: 'post',
        action: `/api/courses/${data?.course.id}/publish`,
      },
    );
  };

  const handleUnpublish = () => {
    publishFetcher.submit(
      { intent: 'unpublish' },
      {
        method: 'post',
        action: `/api/courses/${data?.course.id}/publish`,
      },
    );
  };

  const handleDeleteCourse = () => {
    deleteFetcher.submit(
      {},
      {
        method: 'post',
        action: `/api/courses/${data?.course.id}/delete`,
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

  const handleTagRawText = () => {
    tagRawTextFetcher.submit(
      {
        provider: selectedProvider,
        model: selectedModel,
      },
      {
        method: 'post',
        action: `/api/courses/${data?.course.id}/tag-raw-text`,
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

  const handleSplitModuleRawTextIntoUnits = (moduleId: string) => {
    splitModuleRawTextFetcher.submit(
      { moduleId },
      {
        method: 'post',
        action: `/api/courses/${data?.course.id}/split-module-raw-text-into-units`,
      },
    );
  };

  const handleUpdateModuleRawText = () => {
    if (!editingModuleId) {
      return;
    }
    moduleRawTextUpdateFetcher.submit(
      { moduleId: editingModuleId, rawText: editableModuleRawText },
      {
        method: 'post',
        action: `/api/courses/${data?.course.id}/update-module-raw-text`,
      },
    );
  };

  const openModuleRawTextModal = (moduleId: string, rawText: string) => {
    setEditingModuleId(moduleId);
    setEditableModuleRawText(rawText || '');
    setIsModuleRawTextModalOpen(true);
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
        window.setTimeout(() => window.location.reload(), 1200);
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
    if (unitGenerationFetcher.state === 'idle' && unitGenerationFetcher.data) {
      const result = unitGenerationFetcher.data as {
        success?: boolean;
        error?: string;
        unitsCount?: number;
        moduleTitle?: string;
      };
      const resultKey = JSON.stringify(result);

      if (result.success && handledGenerateUnitsResult.current !== resultKey) {
        handledGenerateUnitsResult.current = resultKey;
        showToast({
          tone: 'success',
          message: `Generated ${result.unitsCount ?? 0} units for ${result.moduleTitle || 'the selected module'}.`,
        });
        window.setTimeout(() => window.location.reload(), 1200);
      } else if (
        result.error &&
        handledGenerateUnitsResult.current !== resultKey
      ) {
        handledGenerateUnitsResult.current = resultKey;
        showToast({
          tone: 'error',
          message: result.error,
        });
      }
    }
  }, [showToast, unitGenerationFetcher]);

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
        window.setTimeout(() => window.location.reload(), 1200);
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
        window.setTimeout(() => window.location.reload(), 1200);
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
    if (tagRawTextFetcher.state === 'idle' && tagRawTextFetcher.data) {
      const result = tagRawTextFetcher.data as {
        success?: boolean;
        error?: string;
        markersCount?: number;
      };
      const resultKey = JSON.stringify(result);

      if (result.success && handledTagRawTextResult.current !== resultKey) {
        handledTagRawTextResult.current = resultKey;
        showToast({
          tone: 'success',
          message: `Tagged raw text successfully${result.markersCount !== undefined ? ` (${result.markersCount} markers)` : ''}.`,
        });
        window.setTimeout(() => window.location.reload(), 1200);
      } else if (
        result.error &&
        handledTagRawTextResult.current !== resultKey
      ) {
        handledTagRawTextResult.current = resultKey;
        showToast({
          tone: 'error',
          message: result.error,
        });
      }
    }
  }, [showToast, tagRawTextFetcher]);

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
        window.setTimeout(() => window.location.reload(), 1200);
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

  const handledSplitModuleRawTextResult = useRef<string | null>(null);

  useEffect(() => {
    if (
      splitModuleRawTextFetcher.state === 'idle' &&
      splitModuleRawTextFetcher.data
    ) {
      const result = splitModuleRawTextFetcher.data as {
        success?: boolean;
        error?: string;
        unitsCount?: number;
      };
      const resultKey = JSON.stringify(result);

      if (
        result.success &&
        handledSplitModuleRawTextResult.current !== resultKey
      ) {
        handledSplitModuleRawTextResult.current = resultKey;
        showToast({
          tone: 'success',
          message: `Created ${result.unitsCount ?? 0} units from module raw text.`,
        });
        window.setTimeout(() => window.location.reload(), 1200);
      } else if (
        result.error &&
        handledSplitModuleRawTextResult.current !== resultKey
      ) {
        handledSplitModuleRawTextResult.current = resultKey;
        showToast({
          tone: 'error',
          message: result.error,
        });
      }
    }
  }, [showToast, splitModuleRawTextFetcher]);

  const handledModuleRawTextUpdateResult = useRef<string | null>(null);

  useEffect(() => {
    if (
      moduleRawTextUpdateFetcher.state === 'idle' &&
      moduleRawTextUpdateFetcher.data
    ) {
      const result = moduleRawTextUpdateFetcher.data as {
        success?: boolean;
        error?: string;
        characters?: number;
      };
      const resultKey = JSON.stringify(result);

      if (
        result.success &&
        handledModuleRawTextUpdateResult.current !== resultKey
      ) {
        handledModuleRawTextUpdateResult.current = resultKey;
        showToast({
          tone: 'success',
          message: `Module raw text updated successfully${result.characters !== undefined ? ` (${result.characters} characters)` : ''}.`,
        });
        window.setTimeout(() => window.location.reload(), 1200);
      } else if (
        result.error &&
        handledModuleRawTextUpdateResult.current !== resultKey
      ) {
        handledModuleRawTextUpdateResult.current = resultKey;
        showToast({
          tone: 'error',
          message: result.error,
        });
      }
    }
  }, [showToast, moduleRawTextUpdateFetcher]);

  const handledEnrollResult = useRef<string | null>(null);
  useEffect(() => {
    if (enrollFetcher.state === 'idle' && enrollFetcher.data) {
      const result = enrollFetcher.data as {
        success?: boolean;
        error?: string;
      };
      const resultKey = JSON.stringify(result);

      if (result.success && handledEnrollResult.current !== resultKey) {
        handledEnrollResult.current = resultKey;
        showToast({ tone: 'success', message: 'Successfully enrolled!' });
        window.location.reload();
      } else if (result.error && handledEnrollResult.current !== resultKey) {
        handledEnrollResult.current = resultKey;
        showToast({ tone: 'error', message: result.error });
      }
    }
  }, [showToast, enrollFetcher]);

  const handledPublishResult = useRef<string | null>(null);
  useEffect(() => {
    if (publishFetcher.state === 'idle' && publishFetcher.data) {
      const result = publishFetcher.data as {
        success?: boolean;
        error?: string;
        message?: string;
      };
      const resultKey = JSON.stringify(result);

      if (result.success && handledPublishResult.current !== resultKey) {
        handledPublishResult.current = resultKey;
        showToast({
          tone: 'success',
          message: result.message || 'Course updated successfully!',
        });
        window.location.reload();
      } else if (result.error && handledPublishResult.current !== resultKey) {
        handledPublishResult.current = resultKey;
        showToast({ tone: 'error', message: result.error });
      }
    }
  }, [showToast, publishFetcher]);

  const handledDeleteResult = useRef<string | null>(null);
  useEffect(() => {
    if (deleteFetcher.state === 'idle' && deleteFetcher.data) {
      const result = deleteFetcher.data as {
        success?: boolean;
        error?: string;
        message?: string;
      };
      const resultKey = JSON.stringify(result);

      if (result.success && handledDeleteResult.current !== resultKey) {
        handledDeleteResult.current = resultKey;
        showToast({
          tone: 'success',
          message: result.message || 'Course deleted successfully!',
        });
        window.location.assign('/courses');
      } else if (result.error && handledDeleteResult.current !== resultKey) {
        handledDeleteResult.current = resultKey;
        showToast({ tone: 'error', message: result.error });
      }
    }
  }, [deleteFetcher, showToast]);

  const handleEnroll = () => {
    enrollFetcher.submit(
      {},
      { method: 'post', action: `/api/courses/${course.id}/enroll` },
    );
  };

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
            We couldn&apos;t find the course you&apos;re looking for.
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

  const { course, school, author, contributor, modules } = data;
  const isInstructor = user?.isAdmin === true;
  const isCourseCreator = user?.id === course.createdBy;
  const isDraft = course.status === 'pending';
  const canDeleteCourse = isInstructor || (isCourseCreator && isDraft);

  const playlistItems: PlaylistItem[] = modules.flatMap((module) =>
    module.units
      .filter((unit) => unit.audioUrl || unit.videoUrl)
      .map((unit) => ({
        id: unit.id,
        title: unit.title,
        moduleTitle: module.title,
        audioUrl: unit.audioUrl,
        videoUrl: unit.videoUrl,
      })),
  );
  const hasPlaylist = playlistItems.length > 0;

  return (
    <div className='mx-auto max-w-[1400px] px-4 py-8'>
      <div className='grid grid-cols-1 gap-8 xl:grid-cols-[minmax(0,1.65fr)_380px]'>
        <CourseOverview
          course={course}
          school={school}
          author={author}
          contributor={contributor}
          isCourseCreator={isCourseCreator}
          modulesCount={modules.length}
          isDraft={isDraft}
          onOpenPlaylist={() => setIsPlaylistOpen(true)}
          hasPlaylist={hasPlaylist && isEnrolled}
          progressStats={progressStats}
          isEnrolled={isEnrolled}
          learnerCount={enrollmentCount}
        />

        <CourseSidebar
          course={course}
          onEnroll={handleEnroll}
          isEnrolled={isEnrolled}
          isInstructor={isInstructor}
          canDeleteCourse={canDeleteCourse}
          isGenerating={isGenerating}
          isGeneratingUnits={isGeneratingUnits}
          isExtractingRawText={isExtractingRawText}
          isTaggingRawText={isTaggingRawText}
          isSplittingRawText={isSplittingRawText}
          isSplittingModuleRawText={isSplittingModuleRawText}
          hasRawText={Boolean(course.rawText)}
          rawTextLength={course.rawText?.length || 0}
          modulesWithRawText={modulesWithRawText}
          selectedProvider={selectedProvider}
          selectedModel={selectedModel}
          modelOptions={CURRICULUM_MODEL_OPTIONS[selectedProvider]}
          onProviderChange={handleProviderChange}
          onModelChange={setSelectedModel}
          onOpenPdf={() => setIsPdfModalOpen(true)}
          onOpenExtractWarning={() => setIsExtractWarningOpen(true)}
          onTagRawText={() => setIsTagRawTextModalOpen(true)}
          onOpenRawTextEditor={() => {
            setEditableRawText(course.rawText || '');
            setIsRawTextModalOpen(true);
          }}
          onOpenSplitWarning={() => setIsSplitWarningOpen(true)}
          onOpenGenerateWarning={() => setIsGenerateCurriculumModalOpen(true)}
          onOpenGenerateUnitsModal={() => setIsGenerateUnitsModalOpen(true)}
          onOpenDeleteModal={() => setIsDeleteModalOpen(true)}
          onPublish={handlePublish}
          onUnpublish={handleUnpublish}
          isDeletingCourse={isDeletingCourse}
        />
      </div>

      <div className='mt-8'>
        <CourseContent
          courseId={course.id}
          modules={modules}
          isInstructor={isInstructor}
          isEnrolled={isEnrolled}
          communityUsers={communityUsers}
          isSplittingModuleRawText={isSplittingModuleRawText}
          onSplitModuleRawText={handleSplitModuleRawTextIntoUnits}
          onOpenModuleRawTextModal={openModuleRawTextModal}
        />
      </div>

      <CourseModals
        courseCode={course.code}
        courseTitle={course.title}
        contentKey={course.contentKey}
        isPdfModalOpen={isPdfModalOpen}
        isGenerateCurriculumModalOpen={isGenerateCurriculumModalOpen}
        isTagRawTextModalOpen={isTagRawTextModalOpen}
        isGenerateWarningOpen={isGenerateWarningOpen}
        isGenerateUnitsModalOpen={isGenerateUnitsModalOpen}
        isExtractWarningOpen={isExtractWarningOpen}
        isSplitWarningOpen={isSplitWarningOpen}
        isRawTextModalOpen={isRawTextModalOpen}
        isModuleRawTextModalOpen={isModuleRawTextModalOpen}
        isGeneratingUnits={isGeneratingUnits}
        isGenerating={isGenerating}
        isTaggingRawText={isTaggingRawText}
        isUpdatingRawText={isUpdatingRawText}
        isUpdatingModuleRawText={isUpdatingModuleRawText}
        selectedProvider={selectedProvider}
        selectedModel={selectedModel}
        selectedModuleId={effectiveSelectedModuleId}
        modulesWithRawText={modulesWithRawText}
        editableRawText={editableRawText}
        onClosePdf={() => setIsPdfModalOpen(false)}
        onCloseGenerateCurriculumModal={() =>
          setIsGenerateCurriculumModalOpen(false)
        }
        onConfirmGenerateCurriculumSelection={() => {
          setIsGenerateCurriculumModalOpen(false);
          setIsGenerateWarningOpen(true);
        }}
        onCloseTagRawTextModal={() => setIsTagRawTextModalOpen(false)}
        onConfirmTagRawText={() => {
          setIsTagRawTextModalOpen(false);
          handleTagRawText();
        }}
        onProviderChange={handleProviderChange}
        onModelChange={setSelectedModel}
        onCloseGenerateWarning={() => setIsGenerateWarningOpen(false)}
        onConfirmGenerateCurriculum={() => {
          setIsGenerateWarningOpen(false);
          triggerGenerateCurriculum();
        }}
        onCloseGenerateUnitsModal={() => setIsGenerateUnitsModalOpen(false)}
        onModuleChange={setSelectedModuleId}
        onGenerateUnits={handleGenerateUnits}
        onCloseExtractWarning={() => setIsExtractWarningOpen(false)}
        onConfirmExtractRawText={() => {
          setIsExtractWarningOpen(false);
          handleExtractRawText();
        }}
        onCloseSplitWarning={() => setIsSplitWarningOpen(false)}
        onConfirmSplitRawText={() => {
          setIsSplitWarningOpen(false);
          handleSplitRawTextIntoModules();
        }}
        onCloseRawTextModal={() => setIsRawTextModalOpen(false)}
        onRawTextChange={setEditableRawText}
        onSaveRawText={handleUpdateRawText}
        editableModuleRawText={editableModuleRawText}
        onCloseModuleRawTextModal={() => setIsModuleRawTextModalOpen(false)}
        onModuleRawTextChange={setEditableModuleRawText}
        onSaveModuleRawText={handleUpdateModuleRawText}
      />

      <CoursePlaylist
        items={playlistItems}
        isOpen={isPlaylistOpen}
        onClose={() => setIsPlaylistOpen(false)}
      />
      <ConfirmModal
        isOpen={isDeleteModalOpen}
        title='Delete this course?'
        description='This will permanently delete the course and its associated content. This action cannot be undone.'
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeleteCourse}
        isLoading={isDeletingCourse}
        confirmVariant='danger'
      />
    </div>
  );
}
