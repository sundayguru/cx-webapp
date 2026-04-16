import { motion, AnimatePresence } from 'motion/react';
import { AlertTriangle, Edit3, FileText, X } from 'lucide-react';
import {
  CURRICULUM_MODEL_OPTIONS,
  type CurriculumAiProvider,
} from '~/utils/curriculum-options';
import type { CourseModuleWithUnits } from './types';

type ConfirmationModalProps = {
  isOpen: boolean;
  title: string;
  description: string;
  onClose: () => void;
  onConfirm: () => void;
};

const ConfirmationModal = ({
  isOpen,
  title,
  description,
  onClose,
  onConfirm,
}: ConfirmationModalProps) => {
  return (
    <AnimatePresence>
      {isOpen ? (
        <div className='fixed inset-0 z-[105] flex items-center justify-center p-4 md:p-8'>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
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
                <h3 className='font-serif text-2xl text-[#1a1a1a]'>{title}</h3>
                <p className='mt-2 text-sm leading-6 text-black/55'>
                  {description}
                </p>
              </div>
            </div>
            <div className='flex items-center justify-end gap-3'>
              <button
                onClick={onClose}
                className='rounded-2xl border border-black/10 px-5 py-3 font-medium text-black/60 transition-all hover:bg-black/5'
              >
                Cancel
              </button>
              <button
                onClick={onConfirm}
                className='rounded-2xl bg-[#5A5A40] px-5 py-3 font-bold text-white transition-all hover:bg-[#4a4a35]'
              >
                Continue
              </button>
            </div>
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>
  );
};

type PdfModalProps = {
  isOpen: boolean;
  contentKey: string | null;
  code: string;
  title: string;
  onClose: () => void;
};

const PdfModal = ({
  isOpen,
  contentKey,
  code,
  title,
  onClose,
}: PdfModalProps) => {
  return (
    <AnimatePresence>
      {isOpen && contentKey ? (
        <div className='fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8'>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
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
                    {code}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className='flex h-10 w-10 items-center justify-center rounded-full bg-black/5 transition-colors hover:bg-black/10'
              >
                <X size={20} />
              </button>
            </div>
            <div className='flex-1 bg-gray-100 p-4'>
              <iframe
                src={`/api/course/serve/${contentKey}`}
                className='h-full w-full rounded-2xl border border-black/5 bg-white'
                title={title}
              />
            </div>
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>
  );
};

type GenerateUnitsModalProps = {
  isOpen: boolean;
  isGeneratingUnits: boolean;
  selectedProvider: CurriculumAiProvider;
  selectedModel: string;
  selectedModuleId: string;
  modulesWithRawText: CourseModuleWithUnits[];
  onClose: () => void;
  onProviderChange: (provider: CurriculumAiProvider) => void;
  onModelChange: (model: string) => void;
  onModuleChange: (moduleId: string) => void;
  onGenerate: () => void;
};

const GenerateUnitsModal = ({
  isOpen,
  isGeneratingUnits,
  selectedProvider,
  selectedModel,
  selectedModuleId,
  modulesWithRawText,
  onClose,
  onProviderChange,
  onModelChange,
  onModuleChange,
  onGenerate,
}: GenerateUnitsModalProps) => {
  return (
    <AnimatePresence>
      {isOpen ? (
        <div className='fixed inset-0 z-[106] flex items-center justify-center p-4 md:p-8'>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => {
              if (!isGeneratingUnits) {
                onClose();
              }
            }}
            className='absolute inset-0 bg-black/70 backdrop-blur-sm'
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 16 }}
            className='relative w-full max-w-2xl rounded-[32px] bg-white p-8 shadow-2xl'
          >
            <div className='mb-6 flex items-center justify-between'>
              <div>
                <h3 className='font-serif text-2xl text-[#1a1a1a]'>
                  Generate Units
                </h3>
                <p className='mt-2 text-sm text-black/55'>
                  Choose an AI provider, model, and module to generate
                  structured unit content from that module&apos;s raw text.
                </p>
              </div>
              <button
                onClick={onClose}
                disabled={isGeneratingUnits}
                className='flex h-10 w-10 items-center justify-center rounded-full bg-black/5 transition-colors hover:bg-black/10 disabled:opacity-50'
              >
                <X size={20} />
              </button>
            </div>

            <div className='space-y-5'>
              <div>
                <label
                  htmlFor='generate-units-provider'
                  className='mb-2 block text-xs font-bold tracking-widest text-black/50 uppercase'
                >
                  AI Provider
                </label>
                <select
                  id='generate-units-provider'
                  value={selectedProvider}
                  onChange={(event) =>
                    onProviderChange(event.target.value as CurriculumAiProvider)
                  }
                  className='w-full rounded-xl border border-black/10 bg-white px-4 py-3 text-sm font-medium text-[#1a1a1a] transition outline-none focus:border-[#5A5A40]'
                >
                  <option value='google'>Google</option>
                  <option value='groq'>Groq</option>
                </select>
              </div>

              <div>
                <label
                  htmlFor='generate-units-model'
                  className='mb-2 block text-xs font-bold tracking-widest text-black/50 uppercase'
                >
                  Model
                </label>
                <select
                  id='generate-units-model'
                  value={selectedModel}
                  onChange={(event) => onModelChange(event.target.value)}
                  className='w-full rounded-xl border border-black/10 bg-white px-4 py-3 text-sm font-medium text-[#1a1a1a] transition outline-none focus:border-[#5A5A40]'
                >
                  {CURRICULUM_MODEL_OPTIONS[selectedProvider].map(
                    (modelOption) => (
                      <option key={modelOption.value} value={modelOption.value}>
                        {modelOption.label}
                      </option>
                    ),
                  )}
                </select>
              </div>

              <div>
                <label
                  htmlFor='generate-units-module'
                  className='mb-2 block text-xs font-bold tracking-widest text-black/50 uppercase'
                >
                  Module
                </label>
                <select
                  id='generate-units-module'
                  value={selectedModuleId}
                  onChange={(event) => onModuleChange(event.target.value)}
                  className='w-full rounded-xl border border-black/10 bg-white px-4 py-3 text-sm font-medium text-[#1a1a1a] transition outline-none focus:border-[#5A5A40]'
                >
                  {modulesWithRawText.length > 0 ? (
                    modulesWithRawText.map((module, index) => (
                      <option key={module.id} value={module.id}>
                        {module.title || `Module ${index + 1}`}
                      </option>
                    ))
                  ) : (
                    <option value=''>No module available</option>
                  )}
                </select>
                {modulesWithRawText.length === 0 ? (
                  <p className='mt-2 text-sm text-red-600'>
                    No modules with raw text are available yet.
                  </p>
                ) : null}
              </div>
            </div>

            <div className='mt-8 flex items-center justify-end gap-3'>
              <button
                onClick={onClose}
                disabled={isGeneratingUnits}
                className='rounded-2xl border border-black/10 px-5 py-3 font-medium text-black/60 transition-all hover:bg-black/5 disabled:opacity-50'
              >
                Cancel
              </button>
              <button
                onClick={onGenerate}
                disabled={isGeneratingUnits || !selectedModuleId}
                className='rounded-2xl bg-[#1f4a57] px-5 py-3 font-bold text-white transition-all hover:bg-[#173944] disabled:opacity-50'
              >
                {isGeneratingUnits ? 'Generating...' : 'Generate Units'}
              </button>
            </div>
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>
  );
};

type RawTextModalProps = {
  isOpen: boolean;
  isUpdatingRawText: boolean;
  editableRawText: string;
  onClose: () => void;
  onRawTextChange: (value: string) => void;
  onSave: () => void;
};

const RawTextModal = ({
  isOpen,
  isUpdatingRawText,
  editableRawText,
  onClose,
  onRawTextChange,
  onSave,
}: RawTextModalProps) => {
  return (
    <AnimatePresence>
      {isOpen ? (
        <div className='fixed inset-0 z-[110] flex items-center justify-center p-4 md:p-8'>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => {
              if (!isUpdatingRawText) {
                onClose();
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
                onClick={onClose}
                disabled={isUpdatingRawText}
                className='flex h-10 w-10 items-center justify-center rounded-full bg-black/5 transition-colors hover:bg-black/10 disabled:opacity-50'
              >
                <X size={20} />
              </button>
            </div>
            <div className='flex-1 bg-[#f7f6ef] p-4'>
              <textarea
                value={editableRawText}
                onChange={(event) => onRawTextChange(event.target.value)}
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
                  onClick={onClose}
                  disabled={isUpdatingRawText}
                  className='rounded-2xl border border-black/10 px-5 py-3 font-medium text-black/60 transition-all hover:bg-black/5 disabled:opacity-50'
                >
                  Cancel
                </button>
                <button
                  onClick={onSave}
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
  );
};

type CourseModalsProps = {
  courseCode: string;
  courseTitle: string;
  contentKey: string | null;
  isPdfModalOpen: boolean;
  isGenerateWarningOpen: boolean;
  isGenerateUnitsModalOpen: boolean;
  isExtractWarningOpen: boolean;
  isSplitWarningOpen: boolean;
  isRawTextModalOpen: boolean;
  isGeneratingUnits: boolean;
  isUpdatingRawText: boolean;
  selectedProvider: CurriculumAiProvider;
  selectedModel: string;
  selectedModuleId: string;
  modulesWithRawText: CourseModuleWithUnits[];
  editableRawText: string;
  onClosePdf: () => void;
  onCloseGenerateWarning: () => void;
  onConfirmGenerateCurriculum: () => void;
  onCloseGenerateUnitsModal: () => void;
  onProviderChange: (provider: CurriculumAiProvider) => void;
  onModelChange: (model: string) => void;
  onModuleChange: (moduleId: string) => void;
  onGenerateUnits: () => void;
  onCloseExtractWarning: () => void;
  onConfirmExtractRawText: () => void;
  onCloseSplitWarning: () => void;
  onConfirmSplitRawText: () => void;
  onCloseRawTextModal: () => void;
  onRawTextChange: (value: string) => void;
  onSaveRawText: () => void;
};

export const CourseModals = ({
  courseCode,
  courseTitle,
  contentKey,
  isPdfModalOpen,
  isGenerateWarningOpen,
  isGenerateUnitsModalOpen,
  isExtractWarningOpen,
  isSplitWarningOpen,
  isRawTextModalOpen,
  isGeneratingUnits,
  isUpdatingRawText,
  selectedProvider,
  selectedModel,
  selectedModuleId,
  modulesWithRawText,
  editableRawText,
  onClosePdf,
  onCloseGenerateWarning,
  onConfirmGenerateCurriculum,
  onCloseGenerateUnitsModal,
  onProviderChange,
  onModelChange,
  onModuleChange,
  onGenerateUnits,
  onCloseExtractWarning,
  onConfirmExtractRawText,
  onCloseSplitWarning,
  onConfirmSplitRawText,
  onCloseRawTextModal,
  onRawTextChange,
  onSaveRawText,
}: CourseModalsProps) => {
  return (
    <>
      <PdfModal
        isOpen={isPdfModalOpen}
        contentKey={contentKey}
        code={courseCode}
        title={courseTitle}
        onClose={onClosePdf}
      />

      <ConfirmationModal
        isOpen={isGenerateWarningOpen}
        title='Replace Existing Curriculum?'
        description='Generating curriculum again will replace the current modules and units for this course.'
        onClose={onCloseGenerateWarning}
        onConfirm={onConfirmGenerateCurriculum}
      />

      <GenerateUnitsModal
        isOpen={isGenerateUnitsModalOpen}
        isGeneratingUnits={isGeneratingUnits}
        selectedProvider={selectedProvider}
        selectedModel={selectedModel}
        selectedModuleId={selectedModuleId}
        modulesWithRawText={modulesWithRawText}
        onClose={onCloseGenerateUnitsModal}
        onProviderChange={onProviderChange}
        onModelChange={onModelChange}
        onModuleChange={onModuleChange}
        onGenerate={onGenerateUnits}
      />

      <ConfirmationModal
        isOpen={isExtractWarningOpen}
        title='Extract PDF Text?'
        description='This will extract text from the uploaded PDF and save it to the course raw text field. If raw text already exists, it will be replaced.'
        onClose={onCloseExtractWarning}
        onConfirm={onConfirmExtractRawText}
      />

      <ConfirmationModal
        isOpen={isSplitWarningOpen}
        title='Split Raw Text Into Modules?'
        description='This will replace the current module and unit structure with modules created from the course raw text. Each section between `--end--` markers becomes one module.'
        onClose={onCloseSplitWarning}
        onConfirm={onConfirmSplitRawText}
      />

      <RawTextModal
        isOpen={isRawTextModalOpen}
        isUpdatingRawText={isUpdatingRawText}
        editableRawText={editableRawText}
        onClose={onCloseRawTextModal}
        onRawTextChange={onRawTextChange}
        onSave={onSaveRawText}
      />
    </>
  );
};
