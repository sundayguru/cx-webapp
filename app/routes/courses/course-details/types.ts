import type { SelectAuthor } from '~/db/schemas/authors';
import type { SelectCourse } from '~/db/schemas/courses';
import type { SelectModule } from '~/db/schemas/modules';
import type { SelectSchool } from '~/db/schemas/schools';
import type { SelectUnit } from '~/db/schemas/units';
import type { CourseContributor } from '~/types/course';
import type { User } from '~/types';
import type { CurriculumAiProvider } from '~/utils/curriculum-options';


export type CourseModuleWithUnits = SelectModule & {
  units: SelectUnit[];
};

export type CourseDetailsData = {
  course: SelectCourse;
  school: SelectSchool | null;
  author: SelectAuthor | null;
  authors: SelectAuthor[];
  contributor: CourseContributor;
  modules: CourseModuleWithUnits[];
};

export type CoursePageUser = User | null;

export type CurriculumModelOption = {
  value: string;
  label: string;
};

export type SidebarProps = {
  course: SelectCourse;
  isInstructor: boolean;
  canDeleteCourse: boolean;
  isAdminActionProcessing: boolean;
  isGenerating: boolean;
  isGeneratingUnits: boolean;
  isExtractingRawText: boolean;
  isHeuristicTaggingRawText: boolean;
  isTaggingModuleUnits: boolean;
  isTaggingRawText: boolean;
  isSplittingRawText: boolean;
  isSplittingModuleRawText: boolean;
  isSplittingAllModuleRawText: boolean;
  isRunningCourseWorkflow: boolean;
  isRunningUnitAudioWorkflow: boolean;
  hasRawText: boolean;
  rawTextLength: number;
  modulesWithRawText: CourseModuleWithUnits[];
  selectedProvider: CurriculumAiProvider;
  selectedModel: string;
  modelOptions: CurriculumModelOption[];
  onProviderChange: (provider: CurriculumAiProvider) => void;
  onModelChange: (model: string) => void;
  onOpenPdf: () => void;
  onOpenExtractWarning: () => void;
  onOpenTagRawTextHeuristicModal: () => void;
  onTagModuleUnits: () => void;
  onTagRawText: () => void;
  onOpenRawTextEditor: () => void;
  onOpenSplitWarning: () => void;
  onSplitAllModuleRawText: () => void;
  onOpenGenerateWarning: () => void;
  onOpenGenerateUnitsModal: () => void;
  onRunCourseWorkflow: () => void;
  onRunUnitAudioWorkflow: () => void;
  onOpenDeleteModal?: () => void;
  onPublish?: () => void;
  onUnpublish?: () => void;
  isDeletingCourse?: boolean;
  isAddingModule?: boolean;
  isEnrolled?: boolean;
  onEnroll?: () => void;
  onOpenAddModuleModal?: () => void;
};

export type CourseContentProps = {
  courseId: string;
  modules: CourseModuleWithUnits[];
  isInstructor: boolean;
  isEnrolled: boolean;
  communityUsers: Array<{
    id: string;
    firstName: string;
    avatarUrl: string | null;
  }>;
  isSplittingModuleRawText: boolean;
  onSplitModuleRawText: (moduleId: string) => void;
  onOpenModuleRawTextModal: (moduleId: string, rawText: string) => void;
  onOpenUnitRawTextModal: (unitId: string, rawText: string) => void;
  onRequestDeleteModule: (
    moduleId: string,
    moduleTitle: string,
    unitsCount: number,
  ) => void;
  onRequestDeleteUnit: (
    unitId: string,
    unitTitle: string,
    moduleTitle: string,
  ) => void;
  quizCount: number;
};
