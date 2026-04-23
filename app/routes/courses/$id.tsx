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
import type { GoogleTtsVoiceListItem } from '~/utils/google-tts';

type PendingCurriculumDelete =
  | {
      type: 'module';
      id: string;
      title: string;
      unitsCount: number;
    }
  | {
      type: 'unit';
      id: string;
      title: string;
      moduleTitle: string;
    };

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
        avatarUrl: postItem.profile?.avatarUrl ?? null,
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
  const heuristicTagRawTextFetcher = useFetcher();
  const tagModuleUnitsFetcher = useFetcher();
  const tagRawTextFetcher = useFetcher();
  const splitRawTextFetcher = useFetcher();
  const splitModuleRawTextFetcher = useFetcher();
  const splitAllModuleRawTextFetcher = useFetcher();
  const courseWorkflowFetcher = useFetcher();
  const unitAudioWorkflowFetcher = useFetcher();
  const workflowAudioVoicesFetcher = useFetcher();
  const moduleRawTextUpdateFetcher = useFetcher();
  const unitRawTextUpdateFetcher = useFetcher();
  const curriculumDeleteFetcher = useFetcher();
  const publishFetcher = useFetcher();
  const deleteFetcher = useFetcher();

  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);
  const [isPlaylistOpen, setIsPlaylistOpen] = useState(false);
  const [isRawTextModalOpen, setIsRawTextModalOpen] = useState(false);
  const [isGenerateCurriculumModalOpen, setIsGenerateCurriculumModalOpen] =
    useState(false);
  const [isTagRawTextHeuristicModalOpen, setIsTagRawTextHeuristicModalOpen] =
    useState(false);
  const [isTagRawTextModalOpen, setIsTagRawTextModalOpen] = useState(false);
  const [isGenerateWarningOpen, setIsGenerateWarningOpen] = useState(false);
  const [isGenerateUnitsModalOpen, setIsGenerateUnitsModalOpen] =
    useState(false);
  const [isCourseWorkflowModalOpen, setIsCourseWorkflowModalOpen] =
    useState(false);
  const [isUnitAudioWorkflowModalOpen, setIsUnitAudioWorkflowModalOpen] =
    useState(false);
  const [isExtractWarningOpen, setIsExtractWarningOpen] = useState(false);
  const [isSplitWarningOpen, setIsSplitWarningOpen] = useState(false);
  const [isModuleRawTextModalOpen, setIsModuleRawTextModalOpen] =
    useState(false);
  const [isUnitRawTextModalOpen, setIsUnitRawTextModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [pendingCurriculumDelete, setPendingCurriculumDelete] =
    useState<PendingCurriculumDelete | null>(null);
  const [editingModuleId, setEditingModuleId] = useState<string | null>(null);
  const [editingUnitId, setEditingUnitId] = useState<string | null>(null);
  const [editableRawText, setEditableRawText] = useState(
    data?.course.rawText || '',
  );
  const [editableModuleRawText, setEditableModuleRawText] = useState('');
  const [editableUnitRawText, setEditableUnitRawText] = useState('');
  const [selectedProvider, setSelectedProvider] =
    useState<CurriculumAiProvider>(DEFAULT_CURRICULUM_PROVIDER);
  const [selectedModel, setSelectedModel] = useState(
    DEFAULT_CURRICULUM_MODELS[DEFAULT_CURRICULUM_PROVIDER],
  );
  const [moduleWordStyle, setModuleWordStyle] = useState('module x unit 1');
  const [lookupDistance, setLookupDistance] = useState(1000);
  const [workflowAudioLanguageCode, setWorkflowAudioLanguageCode] =
    useState('en-US');
  const [workflowAudioSsmlGender, setWorkflowAudioSsmlGender] =
    useState('FEMALE');
  const [workflowAudioVoiceName, setWorkflowAudioVoiceName] = useState('');
  const [workflowAudioSpeakingRate, setWorkflowAudioSpeakingRate] =
    useState('1');
  const [workflowAudioPitch, setWorkflowAudioPitch] = useState('0');

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
  const handledHeuristicTagRawTextResult = useRef<string | null>(null);
  const handledTagModuleUnitsResult = useRef<string | null>(null);
  const handledTagRawTextResult = useRef<string | null>(null);
  const handledSplitRawTextResult = useRef<string | null>(null);
  const pendingCurriculumDeleteRef = useRef<PendingCurriculumDelete | null>(
    null,
  );

  const isGenerating = curriculumFetcher.state !== 'idle';
  const isGeneratingUnits = unitGenerationFetcher.state !== 'idle';
  const isExtractingRawText = rawTextFetcher.state !== 'idle';
  const isUpdatingRawText = rawTextUpdateFetcher.state !== 'idle';
  const isHeuristicTaggingRawText = heuristicTagRawTextFetcher.state !== 'idle';
  const isTaggingModuleUnits = tagModuleUnitsFetcher.state !== 'idle';
  const isTaggingRawText = tagRawTextFetcher.state !== 'idle';
  const isSplittingRawText = splitRawTextFetcher.state !== 'idle';
  const isSplittingModuleRawText = splitModuleRawTextFetcher.state !== 'idle';
  const isSplittingAllModuleRawText =
    splitAllModuleRawTextFetcher.state !== 'idle';
  const isRunningCourseWorkflow = courseWorkflowFetcher.state !== 'idle';
  const isRunningUnitAudioWorkflow = unitAudioWorkflowFetcher.state !== 'idle';
  const isLoadingWorkflowAudioVoices =
    workflowAudioVoicesFetcher.state !== 'idle';
  const isUpdatingModuleRawText = moduleRawTextUpdateFetcher.state !== 'idle';
  const isUpdatingUnitRawText = unitRawTextUpdateFetcher.state !== 'idle';
  const isDeletingCurriculumItem = curriculumDeleteFetcher.state !== 'idle';
  const isPublishingCourse = publishFetcher.state !== 'idle';
  const isDeletingCourse = deleteFetcher.state !== 'idle';
  const isAdminActionProcessing =
    isExtractingRawText ||
    isHeuristicTaggingRawText ||
    isTaggingModuleUnits ||
    isTaggingRawText ||
    isSplittingRawText ||
    isSplittingAllModuleRawText ||
    isRunningCourseWorkflow ||
    isRunningUnitAudioWorkflow ||
    isGenerating ||
    isGeneratingUnits ||
    isPublishingCourse ||
    isDeletingCourse;

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

  const handleDeleteCurriculumItem = () => {
    if (!pendingCurriculumDelete) {
      return;
    }

    pendingCurriculumDeleteRef.current = pendingCurriculumDelete;
    setPendingCurriculumDelete(null);

    if (pendingCurriculumDelete.type === 'module') {
      curriculumDeleteFetcher.submit(
        { moduleId: pendingCurriculumDelete.id },
        {
          method: 'post',
          action: `/api/courses/${data?.course.id}/delete-module`,
        },
      );
      return;
    }

    curriculumDeleteFetcher.submit(
      {},
      {
        method: 'post',
        action: `/api/courses/${data?.course.id}/units/${pendingCurriculumDelete.id}/delete`,
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

  const handleTagRawTextHeuristically = () => {
    heuristicTagRawTextFetcher.submit(
      { moduleWordStyle, lookupDistance },
      {
        method: 'post',
        action: `/api/courses/${data?.course.id}/tag-raw-text-heuristic`,
      },
    );
  };

  const handleTagModuleUnitsHeuristically = () => {
    tagModuleUnitsFetcher.submit(
      {},
      {
        method: 'post',
        action: `/api/courses/${data?.course.id}/tag-module-units-heuristic`,
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

  const handleSplitAllModuleRawTextIntoUnits = () => {
    splitAllModuleRawTextFetcher.submit(
      {},
      {
        method: 'post',
        action: `/api/courses/${data?.course.id}/split-all-module-raw-text-into-units`,
      },
    );
  };

  const handleRunCourseWorkflow = () => {
    courseWorkflowFetcher.submit(
      {
        provider: selectedProvider,
        model: selectedModel,
      },
      {
        method: 'post',
        action: `/api/courses/${data?.course.id}/run-processing-workflow`,
      },
    );
  };

  const handleRunUnitAudioWorkflow = () => {
    unitAudioWorkflowFetcher.submit(
      {
        provider: selectedProvider,
        model: selectedModel,
        languageCode: workflowAudioLanguageCode,
        ssmlGender: workflowAudioSsmlGender,
        voiceName: workflowAudioVoiceName,
        speakingRate: workflowAudioSpeakingRate,
        pitch: workflowAudioPitch,
      },
      {
        method: 'post',
        action: `/api/courses/${data?.course.id}/run-unit-audio-workflow`,
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

  const handleUpdateUnitRawText = () => {
    if (!editingUnitId) {
      return;
    }

    unitRawTextUpdateFetcher.submit(
      { rawText: editableUnitRawText },
      {
        method: 'post',
        action: `/api/courses/${data?.course.id}/units/${editingUnitId}/update-raw-text`,
      },
    );
  };

  const openUnitRawTextModal = (unitId: string, rawText: string) => {
    setEditingUnitId(unitId);
    setEditableUnitRawText(rawText || '');
    setIsUnitRawTextModalOpen(true);
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
    if (
      curriculumDeleteFetcher.state !== 'idle' ||
      !curriculumDeleteFetcher.data
    ) {
      return;
    }

    const result = curriculumDeleteFetcher.data as {
      success?: boolean;
      error?: string;
    };

    if (result.success) {
      showToast({
        tone: 'success',
        message:
          pendingCurriculumDeleteRef.current?.type === 'module'
            ? 'Module deleted successfully'
            : 'Unit deleted successfully',
      });
      window.setTimeout(() => window.location.reload(), 1200);
    } else if (result.error) {
      showToast({
        tone: 'error',
        message: result.error,
      });
    }
  }, [curriculumDeleteFetcher.data, curriculumDeleteFetcher.state, showToast]);

  useEffect(() => {
    if (
      heuristicTagRawTextFetcher.state === 'idle' &&
      heuristicTagRawTextFetcher.data
    ) {
      const result = heuristicTagRawTextFetcher.data as {
        success?: boolean;
        error?: string;
        markersCount?: number;
      };
      const resultKey = JSON.stringify(result);

      if (
        result.success &&
        handledHeuristicTagRawTextResult.current !== resultKey
      ) {
        handledHeuristicTagRawTextResult.current = resultKey;
        showToast({
          tone: 'success',
          message: `Tagged course modules successfully${result.markersCount !== undefined ? ` (${result.markersCount} markers)` : ''}.`,
        });
        window.setTimeout(() => window.location.reload(), 1200);
      } else if (
        result.error &&
        handledHeuristicTagRawTextResult.current !== resultKey
      ) {
        handledHeuristicTagRawTextResult.current = resultKey;
        showToast({
          tone: 'error',
          message: result.error,
        });
      }
    }
  }, [heuristicTagRawTextFetcher, showToast]);

  useEffect(() => {
    if (tagModuleUnitsFetcher.state === 'idle' && tagModuleUnitsFetcher.data) {
      const result = tagModuleUnitsFetcher.data as {
        success?: boolean;
        error?: string;
        markersCount?: number;
        taggedModulesCount?: number;
      };
      const resultKey = JSON.stringify(result);

      if (result.success && handledTagModuleUnitsResult.current !== resultKey) {
        handledTagModuleUnitsResult.current = resultKey;
        showToast({
          tone: 'success',
          message: `Tagged module units successfully${result.markersCount !== undefined ? ` (${result.markersCount} markers across ${result.taggedModulesCount ?? 0} modules)` : ''}.`,
        });
        window.setTimeout(() => window.location.reload(), 1200);
      } else if (
        result.error &&
        handledTagModuleUnitsResult.current !== resultKey
      ) {
        handledTagModuleUnitsResult.current = resultKey;
        showToast({
          tone: 'error',
          message: result.error,
        });
      }
    }
  }, [showToast, tagModuleUnitsFetcher]);

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

  const handledSplitAllModuleRawTextResult = useRef<string | null>(null);

  useEffect(() => {
    if (
      splitAllModuleRawTextFetcher.state === 'idle' &&
      splitAllModuleRawTextFetcher.data
    ) {
      const result = splitAllModuleRawTextFetcher.data as {
        success?: boolean;
        error?: string;
        modulesCount?: number;
        unitsCount?: number;
      };
      const resultKey = JSON.stringify(result);

      if (
        result.success &&
        handledSplitAllModuleRawTextResult.current !== resultKey
      ) {
        handledSplitAllModuleRawTextResult.current = resultKey;
        showToast({
          tone: 'success',
          message: `Split ${result.modulesCount ?? 0} modules into ${result.unitsCount ?? 0} units.`,
        });
        window.setTimeout(() => window.location.reload(), 1200);
      } else if (
        result.error &&
        handledSplitAllModuleRawTextResult.current !== resultKey
      ) {
        handledSplitAllModuleRawTextResult.current = resultKey;
        showToast({
          tone: 'error',
          message: result.error,
        });
      }
    }
  }, [showToast, splitAllModuleRawTextFetcher]);

  const handledCourseWorkflowResult = useRef<string | null>(null);

  useEffect(() => {
    if (courseWorkflowFetcher.state === 'idle' && courseWorkflowFetcher.data) {
      const result = courseWorkflowFetcher.data as {
        success?: boolean;
        error?: string;
        instanceId?: string;
      };
      const resultKey = JSON.stringify(result);

      if (result.success && handledCourseWorkflowResult.current !== resultKey) {
        handledCourseWorkflowResult.current = resultKey;
        showToast({
          tone: 'success',
          message: `Course workflow started successfully${result.instanceId ? ` (${result.instanceId})` : ''}.`,
        });
      } else if (
        result.error &&
        handledCourseWorkflowResult.current !== resultKey
      ) {
        handledCourseWorkflowResult.current = resultKey;
        showToast({
          tone: 'error',
          message: result.error,
        });
      }
    }
  }, [courseWorkflowFetcher, showToast]);

  const handledUnitAudioWorkflowResult = useRef<string | null>(null);
  const handledWorkflowAudioVoicesResult = useRef<string | null>(null);
  const workflowAudioVoiceResult = workflowAudioVoicesFetcher.data as
    | {
        success?: boolean;
        error?: string;
        voices?: GoogleTtsVoiceListItem[];
      }
    | undefined;
  const workflowAudioVoices = workflowAudioVoiceResult?.voices ?? [];
  const selectableWorkflowAudioVoices =
    workflowAudioSsmlGender === 'SSML_VOICE_GENDER_UNSPECIFIED'
      ? workflowAudioVoices
      : workflowAudioVoices.filter(
          (voice) =>
            voice.ssmlGender === workflowAudioSsmlGender ||
            voice.ssmlGender === 'SSML_VOICE_GENDER_UNSPECIFIED',
        );

  useEffect(() => {
    if (!isUnitAudioWorkflowModalOpen || !data?.course.id) {
      return;
    }

    workflowAudioVoicesFetcher.load(
      `/api/courses/${data.course.id}/google-voices?languageCode=${encodeURIComponent(workflowAudioLanguageCode)}`,
    );
  }, [
    data?.course.id,
    isUnitAudioWorkflowModalOpen,
    workflowAudioLanguageCode,
  ]);

  useEffect(() => {
    if (
      workflowAudioVoicesFetcher.state !== 'idle' ||
      !workflowAudioVoicesFetcher.data
    ) {
      return;
    }

    const result = workflowAudioVoicesFetcher.data as {
      success?: boolean;
      error?: string;
      voices?: GoogleTtsVoiceListItem[];
    };
    const resultKey = JSON.stringify(result);

    if (
      result.error &&
      handledWorkflowAudioVoicesResult.current !== resultKey
    ) {
      handledWorkflowAudioVoicesResult.current = resultKey;
      showToast({
        tone: 'error',
        message: result.error,
      });
    }
  }, [
    showToast,
    workflowAudioVoicesFetcher.data,
    workflowAudioVoicesFetcher.state,
  ]);

  useEffect(() => {
    if (
      unitAudioWorkflowFetcher.state === 'idle' &&
      unitAudioWorkflowFetcher.data
    ) {
      const result = unitAudioWorkflowFetcher.data as {
        success?: boolean;
        error?: string;
        instanceId?: string;
      };
      const resultKey = JSON.stringify(result);

      if (
        result.success &&
        handledUnitAudioWorkflowResult.current !== resultKey
      ) {
        handledUnitAudioWorkflowResult.current = resultKey;
        showToast({
          tone: 'success',
          message: `Unit audio workflow started successfully${result.instanceId ? ` (${result.instanceId})` : ''}.`,
        });
      } else if (
        result.error &&
        handledUnitAudioWorkflowResult.current !== resultKey
      ) {
        handledUnitAudioWorkflowResult.current = resultKey;
        showToast({
          tone: 'error',
          message: result.error,
        });
      }
    }
  }, [showToast, unitAudioWorkflowFetcher]);

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

  const handledUnitRawTextUpdateResult = useRef<string | null>(null);

  useEffect(() => {
    if (
      unitRawTextUpdateFetcher.state === 'idle' &&
      unitRawTextUpdateFetcher.data
    ) {
      const result = unitRawTextUpdateFetcher.data as {
        success?: boolean;
        error?: string;
        characters?: number;
      };
      const resultKey = JSON.stringify(result);

      if (
        result.success &&
        handledUnitRawTextUpdateResult.current !== resultKey
      ) {
        handledUnitRawTextUpdateResult.current = resultKey;
        showToast({
          tone: 'success',
          message: `Unit raw text updated successfully${result.characters !== undefined ? ` (${result.characters} characters)` : ''}.`,
        });
        window.setTimeout(() => window.location.reload(), 1200);
      } else if (
        result.error &&
        handledUnitRawTextUpdateResult.current !== resultKey
      ) {
        handledUnitRawTextUpdateResult.current = resultKey;
        showToast({
          tone: 'error',
          message: result.error,
        });
      }
    }
  }, [showToast, unitRawTextUpdateFetcher]);

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
    <div className='mx-auto max-w-[1400px] px-0 py-8 sm:px-4'>
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
          isAdminActionProcessing={isAdminActionProcessing}
          isGenerating={isGenerating}
          isGeneratingUnits={isGeneratingUnits}
          isExtractingRawText={isExtractingRawText}
          isHeuristicTaggingRawText={isHeuristicTaggingRawText}
          isTaggingModuleUnits={isTaggingModuleUnits}
          isTaggingRawText={isTaggingRawText}
          isSplittingRawText={isSplittingRawText}
          isSplittingModuleRawText={isSplittingModuleRawText}
          isSplittingAllModuleRawText={isSplittingAllModuleRawText}
          isRunningCourseWorkflow={isRunningCourseWorkflow}
          isRunningUnitAudioWorkflow={isRunningUnitAudioWorkflow}
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
          onOpenTagRawTextHeuristicModal={() =>
            setIsTagRawTextHeuristicModalOpen(true)
          }
          onTagModuleUnits={handleTagModuleUnitsHeuristically}
          onTagRawText={() => setIsTagRawTextModalOpen(true)}
          onOpenRawTextEditor={() => {
            setEditableRawText(course.rawText || '');
            setIsRawTextModalOpen(true);
          }}
          onOpenSplitWarning={() => setIsSplitWarningOpen(true)}
          onSplitAllModuleRawText={handleSplitAllModuleRawTextIntoUnits}
          onOpenGenerateWarning={() => setIsGenerateCurriculumModalOpen(true)}
          onOpenGenerateUnitsModal={() => setIsGenerateUnitsModalOpen(true)}
          onRunCourseWorkflow={() => setIsCourseWorkflowModalOpen(true)}
          onRunUnitAudioWorkflow={() => {
            setWorkflowAudioVoiceName('');
            setIsUnitAudioWorkflowModalOpen(true);
          }}
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
          onOpenUnitRawTextModal={openUnitRawTextModal}
          onRequestDeleteModule={(moduleId, moduleTitle, unitsCount) =>
            setPendingCurriculumDelete({
              type: 'module',
              id: moduleId,
              title: moduleTitle,
              unitsCount,
            })
          }
          onRequestDeleteUnit={(unitId, unitTitle, moduleTitle) =>
            setPendingCurriculumDelete({
              type: 'unit',
              id: unitId,
              title: unitTitle,
              moduleTitle,
            })
          }
        />
      </div>

      <CourseModals
        courseCode={course.code}
        courseTitle={course.title}
        contentKey={course.contentKey}
        isPdfModalOpen={isPdfModalOpen}
        isGenerateCurriculumModalOpen={isGenerateCurriculumModalOpen}
        isTagRawTextHeuristicModalOpen={isTagRawTextHeuristicModalOpen}
        isTagRawTextModalOpen={isTagRawTextModalOpen}
        isGenerateWarningOpen={isGenerateWarningOpen}
        isGenerateUnitsModalOpen={isGenerateUnitsModalOpen}
        isCourseWorkflowModalOpen={isCourseWorkflowModalOpen}
        isUnitAudioWorkflowModalOpen={isUnitAudioWorkflowModalOpen}
        isExtractWarningOpen={isExtractWarningOpen}
        isSplitWarningOpen={isSplitWarningOpen}
        isRawTextModalOpen={isRawTextModalOpen}
        isModuleRawTextModalOpen={isModuleRawTextModalOpen}
        isUnitRawTextModalOpen={isUnitRawTextModalOpen}
        isGeneratingUnits={isGeneratingUnits}
        isGenerating={isGenerating}
        isRunningCourseWorkflow={isRunningCourseWorkflow}
        isRunningUnitAudioWorkflow={isRunningUnitAudioWorkflow}
        isHeuristicTaggingRawText={isHeuristicTaggingRawText}
        isTaggingRawText={isTaggingRawText}
        isUpdatingRawText={isUpdatingRawText}
        isUpdatingModuleRawText={isUpdatingModuleRawText}
        isUpdatingUnitRawText={isUpdatingUnitRawText}
        selectedProvider={selectedProvider}
        selectedModel={selectedModel}
        moduleWordStyle={moduleWordStyle}
        lookupDistance={lookupDistance}
        selectedModuleId={effectiveSelectedModuleId}
        modulesWithRawText={modulesWithRawText}
        editableRawText={editableRawText}
        editableModuleRawText={editableModuleRawText}
        editableUnitRawText={editableUnitRawText}
        workflowAudioLanguageCode={workflowAudioLanguageCode}
        workflowAudioSsmlGender={workflowAudioSsmlGender}
        workflowAudioVoiceName={workflowAudioVoiceName}
        workflowAudioSpeakingRate={workflowAudioSpeakingRate}
        workflowAudioPitch={workflowAudioPitch}
        workflowAudioVoices={selectableWorkflowAudioVoices}
        isLoadingWorkflowAudioVoices={isLoadingWorkflowAudioVoices}
        onClosePdf={() => setIsPdfModalOpen(false)}
        onLookupDistanceChange={setLookupDistance}
        onCloseGenerateCurriculumModal={() =>
          setIsGenerateCurriculumModalOpen(false)
        }
        onConfirmGenerateCurriculumSelection={() => {
          setIsGenerateCurriculumModalOpen(false);
          setIsGenerateWarningOpen(true);
        }}
        onCloseTagRawTextHeuristicModal={() =>
          setIsTagRawTextHeuristicModalOpen(false)
        }
        onModuleWordStyleChange={setModuleWordStyle}
        onConfirmTagRawTextHeuristic={() => {
          setIsTagRawTextHeuristicModalOpen(false);
          handleTagRawTextHeuristically();
        }}
        onCloseTagRawTextModal={() => setIsTagRawTextModalOpen(false)}
        onConfirmTagRawText={() => {
          setIsTagRawTextModalOpen(false);
          handleTagRawText();
        }}
        onProviderChange={handleProviderChange}
        onModelChange={setSelectedModel}
        onWorkflowAudioLanguageCodeChange={(value) => {
          setWorkflowAudioLanguageCode(value);
          setWorkflowAudioVoiceName('');
        }}
        onWorkflowAudioSsmlGenderChange={(value) => {
          setWorkflowAudioSsmlGender(value);
          setWorkflowAudioVoiceName('');
        }}
        onWorkflowAudioVoiceNameChange={(value) => {
          setWorkflowAudioVoiceName(value);

          const nextVoice = selectableWorkflowAudioVoices.find(
            (voice) => voice.name === value,
          );

          if (nextVoice) {
            setWorkflowAudioSsmlGender(nextVoice.ssmlGender);
          }
        }}
        onWorkflowAudioSpeakingRateChange={setWorkflowAudioSpeakingRate}
        onWorkflowAudioPitchChange={setWorkflowAudioPitch}
        onCloseGenerateWarning={() => setIsGenerateWarningOpen(false)}
        onConfirmGenerateCurriculum={() => {
          setIsGenerateWarningOpen(false);
          triggerGenerateCurriculum();
        }}
        onCloseGenerateUnitsModal={() => setIsGenerateUnitsModalOpen(false)}
        onCloseCourseWorkflowModal={() => setIsCourseWorkflowModalOpen(false)}
        onConfirmCourseWorkflow={() => {
          setIsCourseWorkflowModalOpen(false);
          handleRunCourseWorkflow();
        }}
        onCloseUnitAudioWorkflowModal={() =>
          setIsUnitAudioWorkflowModalOpen(false)
        }
        onConfirmUnitAudioWorkflow={() => {
          setIsUnitAudioWorkflowModalOpen(false);
          handleRunUnitAudioWorkflow();
        }}
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
        onCloseModuleRawTextModal={() => setIsModuleRawTextModalOpen(false)}
        onModuleRawTextChange={setEditableModuleRawText}
        onSaveModuleRawText={handleUpdateModuleRawText}
        onCloseUnitRawTextModal={() => setIsUnitRawTextModalOpen(false)}
        onUnitRawTextChange={setEditableUnitRawText}
        onSaveUnitRawText={handleUpdateUnitRawText}
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
      <ConfirmModal
        isOpen={pendingCurriculumDelete !== null}
        title={
          pendingCurriculumDelete?.type === 'module'
            ? `Delete module "${pendingCurriculumDelete.title}"?`
            : `Delete unit "${pendingCurriculumDelete?.title ?? ''}"?`
        }
        description={
          pendingCurriculumDelete?.type === 'module'
            ? `This will permanently delete the module and its ${pendingCurriculumDelete.unitsCount} unit${pendingCurriculumDelete.unitsCount === 1 ? '' : 's'}. This action cannot be undone.`
            : `This will permanently delete the unit from ${pendingCurriculumDelete?.moduleTitle ?? 'this module'}. This action cannot be undone.`
        }
        onClose={() => {
          if (!isDeletingCurriculumItem) {
            setPendingCurriculumDelete(null);
          }
        }}
        onConfirm={handleDeleteCurriculumItem}
        isLoading={isDeletingCurriculumItem}
        confirmVariant='danger'
      />
    </div>
  );
}
