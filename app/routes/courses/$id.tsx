import type { Route } from './+types/$id';
import { Link, type LoaderFunctionArgs, useFetcher } from 'react-router';
import { motion } from 'motion/react';
import { useEffect, useRef, useState } from 'react';
import { getCourseById } from '~/db/courses';
import { getUserFromRequest } from '~/utils/session.server';
import {
  CURRICULUM_MODEL_OPTIONS,
  DEFAULT_CURRICULUM_MODELS,
  DEFAULT_CURRICULUM_PROVIDER,
  type CurriculumAiProvider,
} from '~/utils/curriculum-options';
import { useToast } from '~/utils/useToast';
import { CourseContent } from './course-details/CourseContent';
import { CourseModals } from './course-details/CourseModals';
import { CourseOverview } from './course-details/CourseOverview';
import { CourseSidebar } from './course-details/CourseSidebar';

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
  const unitGenerationFetcher = useFetcher();
  const rawTextFetcher = useFetcher();
  const rawTextUpdateFetcher = useFetcher();
  const splitRawTextFetcher = useFetcher();

  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);
  const [isRawTextModalOpen, setIsRawTextModalOpen] = useState(false);
  const [isGenerateWarningOpen, setIsGenerateWarningOpen] = useState(false);
  const [isGenerateUnitsModalOpen, setIsGenerateUnitsModalOpen] =
    useState(false);
  const [isExtractWarningOpen, setIsExtractWarningOpen] = useState(false);
  const [isSplitWarningOpen, setIsSplitWarningOpen] = useState(false);
  const [editableRawText, setEditableRawText] = useState(
    data?.course.rawText || '',
  );
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
  const handledSplitRawTextResult = useRef<string | null>(null);

  const isGenerating = curriculumFetcher.state !== 'idle';
  const isGeneratingUnits = unitGenerationFetcher.state !== 'idle';
  const isExtractingRawText = rawTextFetcher.state !== 'idle';
  const isUpdatingRawText = rawTextUpdateFetcher.state !== 'idle';
  const isSplittingRawText = splitRawTextFetcher.state !== 'idle';

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

  const { course, school, author, modules } = data;
  const isInstructor = user?.id === course.createdBy;
  const isDraft = course.status === 'pending';

  return (
    <div className='mx-auto max-w-[1400px] px-4 py-8'>
      <div className='grid grid-cols-1 gap-8 xl:grid-cols-[minmax(0,1.65fr)_380px]'>
        <CourseOverview
          course={course}
          school={school}
          author={author}
          modulesCount={modules.length}
          isDraft={isDraft}
          onOpenPdf={() => setIsPdfModalOpen(true)}
        />

        <CourseSidebar
          course={course}
          isInstructor={isInstructor}
          isGenerating={isGenerating}
          isGeneratingUnits={isGeneratingUnits}
          isExtractingRawText={isExtractingRawText}
          isSplittingRawText={isSplittingRawText}
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
          onOpenRawTextEditor={() => {
            setEditableRawText(course.rawText || '');
            setIsRawTextModalOpen(true);
          }}
          onOpenSplitWarning={() => setIsSplitWarningOpen(true)}
          onOpenGenerateWarning={() => setIsGenerateWarningOpen(true)}
          onOpenGenerateUnitsModal={() => setIsGenerateUnitsModalOpen(true)}
        />
      </div>

      <div className='mt-8'>
        <CourseContent courseId={course.id} modules={modules} />
      </div>

      <CourseModals
        courseCode={course.code}
        courseTitle={course.title}
        contentKey={course.contentKey}
        isPdfModalOpen={isPdfModalOpen}
        isGenerateWarningOpen={isGenerateWarningOpen}
        isGenerateUnitsModalOpen={isGenerateUnitsModalOpen}
        isExtractWarningOpen={isExtractWarningOpen}
        isSplitWarningOpen={isSplitWarningOpen}
        isRawTextModalOpen={isRawTextModalOpen}
        isGeneratingUnits={isGeneratingUnits}
        isUpdatingRawText={isUpdatingRawText}
        selectedProvider={selectedProvider}
        selectedModel={selectedModel}
        selectedModuleId={effectiveSelectedModuleId}
        modulesWithRawText={modulesWithRawText}
        editableRawText={editableRawText}
        onClosePdf={() => setIsPdfModalOpen(false)}
        onCloseGenerateWarning={() => setIsGenerateWarningOpen(false)}
        onConfirmGenerateCurriculum={() => {
          setIsGenerateWarningOpen(false);
          triggerGenerateCurriculum();
        }}
        onCloseGenerateUnitsModal={() => setIsGenerateUnitsModalOpen(false)}
        onProviderChange={handleProviderChange}
        onModelChange={setSelectedModel}
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
      />
    </div>
  );
}
