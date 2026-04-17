import type { SelectAuthor } from '~/db/schemas/authors';
import type { SelectCourse } from '~/db/schemas/courses';
import type { SelectModule } from '~/db/schemas/modules';
import type { SelectSchool } from '~/db/schemas/schools';
import type { SelectUnit } from '~/db/schemas/units';
import type { User } from '~/types';
import type { CurriculumAiProvider } from '~/utils/curriculum-options';

export type CourseModuleWithUnits = SelectModule & {
  units: SelectUnit[];
};

export type CourseDetailsData = {
  course: SelectCourse;
  school: SelectSchool | null;
  author: SelectAuthor | null;
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
  isGenerating: boolean;
  isGeneratingUnits: boolean;
  isExtractingRawText: boolean;
  isSplittingRawText: boolean;
  isSplittingModuleRawText: boolean;
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
  onOpenRawTextEditor: () => void;
  onOpenSplitWarning: () => void;
  onOpenGenerateWarning: () => void;
  onOpenGenerateUnitsModal: () => void;
};

export type CourseContentProps = {
  courseId: string;
  modules: CourseModuleWithUnits[];
  isInstructor: boolean;
  isEnrolled: boolean;
  isSplittingModuleRawText: boolean;
  onSplitModuleRawText: (moduleId: string) => void;
  onOpenModuleRawTextModal: (moduleId: string, rawText: string) => void;
};
