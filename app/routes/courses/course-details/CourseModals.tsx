import { motion, AnimatePresence } from 'motion/react';
import { Edit3, X } from 'lucide-react';
import {
  CURRICULUM_MODEL_OPTIONS,
  type CurriculumAiProvider,
} from '~/utils/curriculum-options';
import {
  GOOGLE_TTS_GENDER_OPTIONS,
  GOOGLE_TTS_LANGUAGE_OPTIONS,
  type GoogleTtsVoiceListItem,
} from '~/utils/google-tts';
import { WarningModal } from '~/components/WarningModal';
import { CoursePdfModal } from '~/components/CoursePdfModal';
import type { CourseModuleWithUnits } from './types';
import { useState } from 'react';

type AddModuleModalProps = {
  isOpen: boolean;
  isAdding: boolean;
  onClose: () => void;
  onConfirm: (title: string, rawText: string) => void;
};

const AddModuleModal = ({
  isOpen,
  isAdding,
  onClose,
  onConfirm,
}: AddModuleModalProps) => {
  const [title, setTitle] = useState('');
  const [rawText, setRawText] = useState('');

  return (
    <AnimatePresence>
      {isOpen ? (
        <div className='fixed inset-0 z-[106] flex items-center justify-center p-4 md:p-8'>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => {
              if (!isAdding) {
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
                  Add New Module
                </h3>
                <p className='mt-2 text-sm text-black/55'>
                  Enter a title and the raw text content for the new module.
                </p>
              </div>
              <button
                onClick={onClose}
                disabled={isAdding}
                className='flex h-10 w-10 items-center justify-center rounded-full bg-black/5 transition-colors hover:bg-black/10 disabled:opacity-50'
              >
                <X size={20} />
              </button>
            </div>

            <div className='space-y-5'>
              <div>
                <label
                  htmlFor='add-module-title'
                  className='mb-2 block text-xs font-bold tracking-widest text-black/50 uppercase'
                >
                  Module Title
                </label>
                <input
                  id='add-module-title'
                  type='text'
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder='e.g., Introduction to React'
                  className='w-full rounded-xl border border-black/10 bg-white px-4 py-3 text-sm font-medium text-[#1a1a1a] transition outline-none focus:border-[#5A5A40]'
                />
              </div>

              <div>
                <label
                  htmlFor='add-module-text'
                  className='mb-2 block text-xs font-bold tracking-widest text-black/50 uppercase'
                >
                  Raw Text Content
                </label>
                <textarea
                  id='add-module-text'
                  rows={8}
                  value={rawText}
                  onChange={(e) => setRawText(e.target.value)}
                  placeholder='Paste the content for this module here...'
                  className='w-full rounded-xl border border-black/10 bg-white px-4 py-3 text-sm font-medium text-[#1a1a1a] transition outline-none focus:border-[#5A5A40]'
                />
              </div>
            </div>

            <div className='mt-8 flex items-center justify-end gap-3'>
              <button
                onClick={onClose}
                disabled={isAdding}
                className='rounded-2xl border border-black/10 px-5 py-3 font-medium text-black/60 transition-all hover:bg-black/5 disabled:opacity-50'
              >
                Cancel
              </button>
              <button
                onClick={() => onConfirm(title, rawText)}
                disabled={isAdding || !title.trim() || !rawText.trim()}
                className='rounded-2xl bg-[#5A5A40] px-5 py-3 font-bold text-white transition-all hover:bg-[#4a4a35] disabled:opacity-50'
              >
                {isAdding ? 'Adding...' : 'Add Module'}
              </button>
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

type GenerateCurriculumModalProps = {
  isOpen: boolean;
  isGenerating: boolean;
  selectedProvider: CurriculumAiProvider;
  selectedModel: string;
  onClose: () => void;
  onProviderChange: (provider: CurriculumAiProvider) => void;
  onModelChange: (model: string) => void;
  onConfirm: () => void;
};

const GenerateCurriculumModal = ({
  isOpen,
  isGenerating,
  selectedProvider,
  selectedModel,
  onClose,
  onProviderChange,
  onModelChange,
  onConfirm,
}: GenerateCurriculumModalProps) => {
  return (
    <AnimatePresence>
      {isOpen ? (
        <div className='fixed inset-0 z-[106] flex items-center justify-center p-4 md:p-8'>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => {
              if (!isGenerating) {
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
                  Generate Curriculum
                </h3>
                <p className='mt-2 text-sm text-black/55'>
                  Choose an AI provider and model to generate the curriculum for
                  this course.
                </p>
              </div>
              <button
                onClick={onClose}
                disabled={isGenerating}
                className='flex h-10 w-10 items-center justify-center rounded-full bg-black/5 transition-colors hover:bg-black/10 disabled:opacity-50'
              >
                <X size={20} />
              </button>
            </div>

            <div className='space-y-5'>
              <div>
                <label
                  htmlFor='generate-curriculum-provider'
                  className='mb-2 block text-xs font-bold tracking-widest text-black/50 uppercase'
                >
                  AI Provider
                </label>
                <select
                  id='generate-curriculum-provider'
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
                  htmlFor='generate-curriculum-model'
                  className='mb-2 block text-xs font-bold tracking-widest text-black/50 uppercase'
                >
                  Model
                </label>
                <select
                  id='generate-curriculum-model'
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
            </div>

            <div className='mt-8 flex items-center justify-end gap-3'>
              <button
                onClick={onClose}
                disabled={isGenerating}
                className='rounded-2xl border border-black/10 px-5 py-3 font-medium text-black/60 transition-all hover:bg-black/5 disabled:opacity-50'
              >
                Cancel
              </button>
              <button
                onClick={onConfirm}
                disabled={isGenerating}
                className='rounded-2xl bg-[#5A5A40] px-5 py-3 font-bold text-white transition-all hover:bg-[#4a4a35] disabled:opacity-50'
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

type WorkflowSelectionModalProps = {
  isOpen: boolean;
  isRunning: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  selectedProvider: CurriculumAiProvider;
  selectedModel: string;
  onClose: () => void;
  onProviderChange: (provider: CurriculumAiProvider) => void;
  onModelChange: (model: string) => void;
  onConfirm: () => void;
  showVoiceSettings?: boolean;
  audioLanguageCode?: string;
  audioSsmlGender?: string;
  audioVoiceName?: string;
  audioSpeakingRate?: string;
  audioPitch?: string;
  availableVoices?: GoogleTtsVoiceListItem[];
  isLoadingVoices?: boolean;
  onAudioLanguageCodeChange?: (value: string) => void;
  onAudioSsmlGenderChange?: (value: string) => void;
  onAudioVoiceNameChange?: (value: string) => void;
  onAudioSpeakingRateChange?: (value: string) => void;
  onAudioPitchChange?: (value: string) => void;
};

const WorkflowSelectionModal = ({
  isOpen,
  isRunning,
  title,
  description,
  confirmLabel,
  selectedProvider,
  selectedModel,
  onClose,
  onProviderChange,
  onModelChange,
  onConfirm,
  showVoiceSettings = false,
  audioLanguageCode = 'en-US',
  audioSsmlGender = 'FEMALE',
  audioVoiceName = '',
  audioSpeakingRate = '1',
  audioPitch = '0',
  availableVoices = [],
  isLoadingVoices = false,
  onAudioLanguageCodeChange,
  onAudioSsmlGenderChange,
  onAudioVoiceNameChange,
  onAudioSpeakingRateChange,
  onAudioPitchChange,
}: WorkflowSelectionModalProps) => {
  return (
    <AnimatePresence>
      {isOpen ? (
        <div className='fixed inset-0 z-[106] flex items-center justify-center p-4 md:p-8'>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => {
              if (!isRunning) {
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
                <h3 className='font-serif text-2xl text-[#1a1a1a]'>{title}</h3>
                <p className='mt-2 text-sm text-black/55'>{description}</p>
              </div>
              <button
                onClick={onClose}
                disabled={isRunning}
                className='flex h-10 w-10 items-center justify-center rounded-full bg-black/5 transition-colors hover:bg-black/10 disabled:opacity-50'
              >
                <X size={20} />
              </button>
            </div>

            <div className='space-y-5'>
              <div>
                <label
                  htmlFor='workflow-provider'
                  className='mb-2 block text-xs font-bold tracking-widest text-black/50 uppercase'
                >
                  AI Provider
                </label>
                <select
                  id='workflow-provider'
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
                  htmlFor='workflow-model'
                  className='mb-2 block text-xs font-bold tracking-widest text-black/50 uppercase'
                >
                  Model
                </label>
                <select
                  id='workflow-model'
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

              {showVoiceSettings ? (
                <>
                  <div>
                    <label
                      htmlFor='workflow-audio-language'
                      className='mb-2 block text-xs font-bold tracking-widest text-black/50 uppercase'
                    >
                      Audio Language
                    </label>
                    <select
                      id='workflow-audio-language'
                      value={audioLanguageCode}
                      onChange={(event) =>
                        onAudioLanguageCodeChange?.(event.target.value)
                      }
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
                    <label
                      htmlFor='workflow-audio-gender'
                      className='mb-2 block text-xs font-bold tracking-widest text-black/50 uppercase'
                    >
                      Voice Gender
                    </label>
                    <select
                      id='workflow-audio-gender'
                      value={audioSsmlGender}
                      onChange={(event) =>
                        onAudioSsmlGenderChange?.(event.target.value)
                      }
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
                    <label
                      htmlFor='workflow-audio-voice'
                      className='mb-2 block text-xs font-bold tracking-widest text-black/50 uppercase'
                    >
                      Voice Name
                    </label>
                    <select
                      id='workflow-audio-voice'
                      value={audioVoiceName}
                      onChange={(event) =>
                        onAudioVoiceNameChange?.(event.target.value)
                      }
                      disabled={isLoadingVoices || availableVoices.length === 0}
                      className='w-full rounded-xl border border-black/10 bg-white px-4 py-3 text-sm font-medium text-[#1a1a1a] transition outline-none focus:border-[#5A5A40]'
                    >
                      <option value=''>
                        {isLoadingVoices
                          ? 'Loading Google voices...'
                          : availableVoices.length > 0
                            ? 'Select a Google voice'
                            : 'No Google voices found'}
                      </option>
                      {availableVoices.map((voice) => (
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
                      <label
                        htmlFor='workflow-audio-speaking-rate'
                        className='mb-2 block text-xs font-bold tracking-widest text-black/50 uppercase'
                      >
                        Speaking Rate
                      </label>
                      <input
                        id='workflow-audio-speaking-rate'
                        type='number'
                        min='0.25'
                        max='4'
                        step='0.05'
                        value={audioSpeakingRate}
                        onChange={(event) =>
                          onAudioSpeakingRateChange?.(event.target.value)
                        }
                        className='w-full rounded-xl border border-black/10 bg-white px-4 py-3 text-sm font-medium text-[#1a1a1a] transition outline-none focus:border-[#5A5A40]'
                      />
                    </div>

                    <div>
                      <label
                        htmlFor='workflow-audio-pitch'
                        className='mb-2 block text-xs font-bold tracking-widest text-black/50 uppercase'
                      >
                        Pitch
                      </label>
                      <input
                        id='workflow-audio-pitch'
                        type='number'
                        min='-20'
                        max='20'
                        step='0.5'
                        value={audioPitch}
                        onChange={(event) =>
                          onAudioPitchChange?.(event.target.value)
                        }
                        className='w-full rounded-xl border border-black/10 bg-white px-4 py-3 text-sm font-medium text-[#1a1a1a] transition outline-none focus:border-[#5A5A40]'
                      />
                    </div>
                  </div>
                </>
              ) : null}
            </div>

            <div className='mt-8 flex items-center justify-end gap-3'>
              <button
                onClick={onClose}
                disabled={isRunning}
                className='rounded-2xl border border-black/10 px-5 py-3 font-medium text-black/60 transition-all hover:bg-black/5 disabled:opacity-50'
              >
                Cancel
              </button>
              <button
                onClick={onConfirm}
                disabled={isRunning}
                className='rounded-2xl bg-[#5A5A40] px-5 py-3 font-bold text-white transition-all hover:bg-[#4a4a35] disabled:opacity-50'
              >
                {isRunning ? 'Starting...' : confirmLabel}
              </button>
            </div>
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>
  );
};

type TagRawTextModalProps = {
  isOpen: boolean;
  isTagging: boolean;
  selectedProvider: CurriculumAiProvider;
  selectedModel: string;
  onClose: () => void;
  onProviderChange: (provider: CurriculumAiProvider) => void;
  onModelChange: (model: string) => void;
  onConfirm: () => void;
};

const TagRawTextModal = ({
  isOpen,
  isTagging,
  selectedProvider,
  selectedModel,
  onClose,
  onProviderChange,
  onModelChange,
  onConfirm,
}: TagRawTextModalProps) => {
  return (
    <AnimatePresence>
      {isOpen ? (
        <div className='fixed inset-0 z-[106] flex items-center justify-center p-4 md:p-8'>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => {
              if (!isTagging) {
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
                  Tag Course Text
                </h3>
                <p className='mt-2 text-sm text-black/55'>
                  Choose an AI provider and model to detect where module and
                  unit markers should be inserted into the course raw text.
                </p>
              </div>
              <button
                onClick={onClose}
                disabled={isTagging}
                className='flex h-10 w-10 items-center justify-center rounded-full bg-black/5 transition-colors hover:bg-black/10 disabled:opacity-50'
              >
                <X size={20} />
              </button>
            </div>

            <div className='space-y-5'>
              <div>
                <label
                  htmlFor='tag-raw-text-provider'
                  className='mb-2 block text-xs font-bold tracking-widest text-black/50 uppercase'
                >
                  AI Provider
                </label>
                <select
                  id='tag-raw-text-provider'
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
                  htmlFor='tag-raw-text-model'
                  className='mb-2 block text-xs font-bold tracking-widest text-black/50 uppercase'
                >
                  Model
                </label>
                <select
                  id='tag-raw-text-model'
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
            </div>

            <div className='mt-8 flex items-center justify-end gap-3'>
              <button
                onClick={onClose}
                disabled={isTagging}
                className='rounded-2xl border border-black/10 px-5 py-3 font-medium text-black/60 transition-all hover:bg-black/5 disabled:opacity-50'
              >
                Cancel
              </button>
              <button
                onClick={onConfirm}
                disabled={isTagging}
                className='rounded-2xl bg-[#5A5A40] px-5 py-3 font-bold text-white transition-all hover:bg-[#4a4a35] disabled:opacity-50'
              >
                {isTagging ? 'Tagging...' : 'Start Tagging'}
              </button>
            </div>
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>
  );
};

type TagRawTextHeuristicModalProps = {
  isOpen: boolean;
  isTagging: boolean;
  moduleWordStyle: string;
  lookupDistance: number;
  onClose: () => void;
  onModuleWordStyleChange: (value: string) => void;
  onLookupDistanceChange: (value: number) => void;
  onConfirm: () => void;
};

const TagRawTextHeuristicModal = ({
  isOpen,
  isTagging,
  moduleWordStyle,
  lookupDistance,
  onClose,
  onModuleWordStyleChange,
  onLookupDistanceChange,
  onConfirm,
}: TagRawTextHeuristicModalProps) => {
  return (
    <AnimatePresence>
      {isOpen ? (
        <div className='fixed inset-0 z-[106] flex items-center justify-center p-4 md:p-8'>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => {
              if (!isTagging) {
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
                  Tag Course Modules
                </h3>
                <p className='mt-2 text-sm text-black/55'>
                  Provide the module word style pattern used to recognize where
                  module sections begin in the course raw text. Use `x` as the
                  module number placeholder, for example `module x unit 1`.
                </p>
              </div>
              <button
                onClick={onClose}
                disabled={isTagging}
                className='flex h-10 w-10 items-center justify-center rounded-full bg-black/5 transition-colors hover:bg-black/10 disabled:opacity-50'
              >
                <X size={20} />
              </button>
            </div>

            <div className='space-y-5'>
              <div>
                <label
                  htmlFor='tag-heuristic-module-style'
                  className='mb-2 block text-xs font-bold tracking-widest text-black/50 uppercase'
                >
                  Module Word Style
                </label>
                <input
                  id='tag-heuristic-module-style'
                  value={moduleWordStyle}
                  onChange={(event) =>
                    onModuleWordStyleChange(event.target.value)
                  }
                  className='w-full rounded-xl border border-black/10 bg-white px-4 py-3 text-sm font-medium text-[#1a1a1a] transition outline-none focus:border-[#5A5A40]'
                  placeholder='module x unit 1'
                />
                <p className='mt-2 text-sm text-black/45'>
                  `x` will be replaced with `2`, `3`, `4` and so on when
                  matching later modules.
                </p>
              </div>
            </div>

            <div className='space-y-5'>
              <div>
                <label
                  htmlFor='tag-heuristic-module-style'
                  className='mb-2 block text-xs font-bold tracking-widest text-black/50 uppercase'
                >
                  Lookup Distance
                </label>
                <input
                  id='tag-heuristic-lookup-distance'
                  value={lookupDistance}
                  onChange={(event) =>
                    onLookupDistanceChange(Number(event.target.value))
                  }
                  className='w-full rounded-xl border border-black/10 bg-white px-4 py-3 text-sm font-medium text-[#1a1a1a] transition outline-none focus:border-[#5A5A40]'
                  placeholder='module x unit 1'
                />
                <p className='mt-2 text-sm text-black/45'>
                  The number of characters to look ahead for the next unit
                </p>
              </div>
            </div>

            <div className='mt-8 flex items-center justify-end gap-3'>
              <button
                onClick={onClose}
                disabled={isTagging}
                className='rounded-2xl border border-black/10 px-5 py-3 font-medium text-black/60 transition-all hover:bg-black/5 disabled:opacity-50'
              >
                Cancel
              </button>
              <button
                onClick={onConfirm}
                disabled={isTagging || moduleWordStyle.trim().length === 0}
                className='rounded-2xl bg-[#5A5A40] px-5 py-3 font-bold text-white transition-all hover:bg-[#4a4a35] disabled:opacity-50'
              >
                {isTagging ? 'Tagging...' : 'Tag Modules'}
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

type ModuleRawTextModalProps = {
  isOpen: boolean;
  isUpdating: boolean;
  editableRawText: string;
  title: string;
  placeholder: string;
  onClose: () => void;
  onRawTextChange: (value: string) => void;
  onSave: () => void;
};

const ModuleRawTextModal = ({
  isOpen,
  isUpdating,
  editableRawText,
  title,
  placeholder,
  onClose,
  onRawTextChange,
  onSave,
}: ModuleRawTextModalProps) => {
  return (
    <AnimatePresence>
      {isOpen ? (
        <div className='fixed inset-0 z-[110] flex items-center justify-center p-4 md:p-8'>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => {
              if (!isUpdating) {
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
                    {title}
                  </h3>
                  <p className='text-xs font-bold tracking-widest text-black/40 uppercase'>
                    Raw extracted text
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                disabled={isUpdating}
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
                placeholder={placeholder}
              />
            </div>
            <div className='flex items-center justify-between border-t border-black/5 bg-white p-6'>
              <p className='text-sm text-black/45'>
                {editableRawText.length} characters
              </p>
              <div className='flex items-center gap-3'>
                <button
                  onClick={onClose}
                  disabled={isUpdating}
                  className='rounded-2xl border border-black/10 px-5 py-3 font-medium text-black/60 transition-all hover:bg-black/5 disabled:opacity-50'
                >
                  Cancel
                </button>
                <button
                  onClick={onSave}
                  disabled={isUpdating}
                  className='rounded-2xl bg-[#5A5A40] px-5 py-3 font-bold text-white transition-all hover:bg-[#4a4a35] disabled:opacity-50'
                >
                  {isUpdating ? 'Saving...' : 'Save Raw Text'}
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
  isGenerateCurriculumModalOpen: boolean;
  isTagRawTextHeuristicModalOpen: boolean;
  isTagRawTextModalOpen: boolean;
  isGenerateWarningOpen: boolean;
  isGenerateUnitsModalOpen: boolean;
  isCourseWorkflowModalOpen: boolean;
  isUnitAudioWorkflowModalOpen: boolean;
  isExtractWarningOpen: boolean;
  isSplitWarningOpen: boolean;
  isRawTextModalOpen: boolean;
  isModuleRawTextModalOpen: boolean;
  isUnitRawTextModalOpen: boolean;
  isAddModuleModalOpen: boolean;
  isGeneratingUnits: boolean;
  isGenerating: boolean;
  isRunningCourseWorkflow: boolean;
  isRunningUnitAudioWorkflow: boolean;
  isHeuristicTaggingRawText: boolean;
  isTaggingRawText: boolean;
  isUpdatingRawText: boolean;
  isUpdatingModuleRawText: boolean;
  isUpdatingUnitRawText: boolean;
  isAddingModule: boolean;
  selectedProvider: CurriculumAiProvider;
  selectedModel: string;
  moduleWordStyle: string;
  lookupDistance: number;
  selectedModuleId: string;
  modulesWithRawText: CourseModuleWithUnits[];
  editableRawText: string;
  editableModuleRawText: string;
  editableUnitRawText: string;
  workflowAudioLanguageCode: string;
  workflowAudioSsmlGender: string;
  workflowAudioVoiceName: string;
  workflowAudioSpeakingRate: string;
  workflowAudioPitch: string;
  workflowAudioVoices: GoogleTtsVoiceListItem[];
  isLoadingWorkflowAudioVoices: boolean;
  onClosePdf: () => void;
  onCloseGenerateCurriculumModal: () => void;
  onConfirmGenerateCurriculumSelection: () => void;
  onCloseTagRawTextHeuristicModal: () => void;
  onModuleWordStyleChange: (value: string) => void;
  onLookupDistanceChange: (value: number) => void;
  onConfirmTagRawTextHeuristic: () => void;
  onCloseTagRawTextModal: () => void;
  onConfirmTagRawText: () => void;
  onCloseGenerateWarning: () => void;
  onConfirmGenerateCurriculum: () => void;
  onCloseGenerateUnitsModal: () => void;
  onCloseCourseWorkflowModal: () => void;
  onConfirmCourseWorkflow: () => void;
  onCloseUnitAudioWorkflowModal: () => void;
  onConfirmUnitAudioWorkflow: () => void;
  onProviderChange: (provider: CurriculumAiProvider) => void;
  onModelChange: (model: string) => void;
  onWorkflowAudioLanguageCodeChange: (value: string) => void;
  onWorkflowAudioSsmlGenderChange: (value: string) => void;
  onWorkflowAudioVoiceNameChange: (value: string) => void;
  onWorkflowAudioSpeakingRateChange: (value: string) => void;
  onWorkflowAudioPitchChange: (value: string) => void;
  onModuleChange: (moduleId: string) => void;
  onGenerateUnits: () => void;
  onCloseExtractWarning: () => void;
  onConfirmExtractRawText: () => void;
  onCloseSplitWarning: () => void;
  onConfirmSplitRawText: () => void;
  onCloseRawTextModal: () => void;
  onRawTextChange: (value: string) => void;
  onSaveRawText: () => void;
  onCloseModuleRawTextModal: () => void;
  onModuleRawTextChange: (value: string) => void;
  onSaveModuleRawText: () => void;
  onCloseUnitRawTextModal: () => void;
  onUnitRawTextChange: (rawText: string) => void;
  onSaveUnitRawText: () => void;
  onCloseAddModuleModal: () => void;
  onConfirmAddModule: (title: string, rawText: string) => void;
};

export const CourseModals = ({
  courseCode,
  courseTitle,
  contentKey,
  isPdfModalOpen,
  isGenerateCurriculumModalOpen,
  isTagRawTextHeuristicModalOpen,
  isTagRawTextModalOpen,
  isGenerateWarningOpen,
  isGenerateUnitsModalOpen,
  isCourseWorkflowModalOpen,
  isUnitAudioWorkflowModalOpen,
  isExtractWarningOpen,
  isSplitWarningOpen,
  isRawTextModalOpen,
  isModuleRawTextModalOpen,
  isUnitRawTextModalOpen,
  isAddModuleModalOpen,
  isGeneratingUnits,
  isGenerating,
  isRunningCourseWorkflow,
  isRunningUnitAudioWorkflow,
  isHeuristicTaggingRawText,
  isTaggingRawText,
  isUpdatingRawText,
  isUpdatingModuleRawText,
  isUpdatingUnitRawText,
  isAddingModule,
  selectedProvider,
  selectedModel,
  moduleWordStyle,
  lookupDistance,
  selectedModuleId,
  modulesWithRawText,
  editableRawText,
  editableModuleRawText,
  editableUnitRawText,
  workflowAudioLanguageCode,
  workflowAudioSsmlGender,
  workflowAudioVoiceName,
  workflowAudioSpeakingRate,
  workflowAudioPitch,
  workflowAudioVoices,
  isLoadingWorkflowAudioVoices,
  onClosePdf,
  onCloseGenerateCurriculumModal,
  onConfirmGenerateCurriculumSelection,
  onCloseTagRawTextHeuristicModal,
  onModuleWordStyleChange,
  onLookupDistanceChange,
  onConfirmTagRawTextHeuristic,
  onCloseTagRawTextModal,
  onConfirmTagRawText,
  onCloseGenerateWarning,
  onConfirmGenerateCurriculum,
  onCloseGenerateUnitsModal,
  onCloseCourseWorkflowModal,
  onConfirmCourseWorkflow,
  onCloseUnitAudioWorkflowModal,
  onConfirmUnitAudioWorkflow,
  onProviderChange,
  onModelChange,
  onWorkflowAudioLanguageCodeChange,
  onWorkflowAudioSsmlGenderChange,
  onWorkflowAudioVoiceNameChange,
  onWorkflowAudioSpeakingRateChange,
  onWorkflowAudioPitchChange,
  onModuleChange,
  onGenerateUnits,
  onCloseExtractWarning,
  onConfirmExtractRawText,
  onCloseSplitWarning,
  onConfirmSplitRawText,
  onCloseRawTextModal,
  onRawTextChange,
  onSaveRawText,
  onCloseModuleRawTextModal,
  onModuleRawTextChange,
  onSaveModuleRawText,
  onCloseUnitRawTextModal,
  onUnitRawTextChange,
  onSaveUnitRawText,
  onCloseAddModuleModal,
  onConfirmAddModule,
}: CourseModalsProps) => {
  return (
    <>
      <CoursePdfModal
        isOpen={isPdfModalOpen}
        contentKey={contentKey}
        code={courseCode}
        title={courseTitle}
        onClose={onClosePdf}
      />

      <GenerateCurriculumModal
        isOpen={isGenerateCurriculumModalOpen}
        isGenerating={isGenerating}
        selectedProvider={selectedProvider}
        selectedModel={selectedModel}
        onClose={onCloseGenerateCurriculumModal}
        onProviderChange={onProviderChange}
        onModelChange={onModelChange}
        onConfirm={onConfirmGenerateCurriculumSelection}
      />

      <TagRawTextHeuristicModal
        isOpen={isTagRawTextHeuristicModalOpen}
        isTagging={isHeuristicTaggingRawText}
        moduleWordStyle={moduleWordStyle}
        lookupDistance={lookupDistance}
        onClose={onCloseTagRawTextHeuristicModal}
        onModuleWordStyleChange={onModuleWordStyleChange}
        onLookupDistanceChange={onLookupDistanceChange}
        onConfirm={onConfirmTagRawTextHeuristic}
      />

      <TagRawTextModal
        isOpen={isTagRawTextModalOpen}
        isTagging={isTaggingRawText}
        selectedProvider={selectedProvider}
        selectedModel={selectedModel}
        onClose={onCloseTagRawTextModal}
        onProviderChange={onProviderChange}
        onModelChange={onModelChange}
        onConfirm={onConfirmTagRawText}
      />

      <WarningModal
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

      <WorkflowSelectionModal
        isOpen={isCourseWorkflowModalOpen}
        isRunning={isRunningCourseWorkflow}
        title='Run Course Workflow'
        description='Choose an AI provider and model before starting the full course processing workflow.'
        confirmLabel='Start Workflow'
        selectedProvider={selectedProvider}
        selectedModel={selectedModel}
        onClose={onCloseCourseWorkflowModal}
        onProviderChange={onProviderChange}
        onModelChange={onModelChange}
        onConfirm={onConfirmCourseWorkflow}
      />

      <WorkflowSelectionModal
        isOpen={isUnitAudioWorkflowModalOpen}
        isRunning={isRunningUnitAudioWorkflow}
        title='Run Unit Audio Workflow'
        description='Choose an AI provider and model before generating audio scripts and audio for course units.'
        confirmLabel='Start Audio Workflow'
        selectedProvider={selectedProvider}
        selectedModel={selectedModel}
        onClose={onCloseUnitAudioWorkflowModal}
        onProviderChange={onProviderChange}
        onModelChange={onModelChange}
        onConfirm={onConfirmUnitAudioWorkflow}
        showVoiceSettings
        audioLanguageCode={workflowAudioLanguageCode}
        audioSsmlGender={workflowAudioSsmlGender}
        audioVoiceName={workflowAudioVoiceName}
        audioSpeakingRate={workflowAudioSpeakingRate}
        audioPitch={workflowAudioPitch}
        availableVoices={workflowAudioVoices}
        isLoadingVoices={isLoadingWorkflowAudioVoices}
        onAudioLanguageCodeChange={onWorkflowAudioLanguageCodeChange}
        onAudioSsmlGenderChange={onWorkflowAudioSsmlGenderChange}
        onAudioVoiceNameChange={onWorkflowAudioVoiceNameChange}
        onAudioSpeakingRateChange={onWorkflowAudioSpeakingRateChange}
        onAudioPitchChange={onWorkflowAudioPitchChange}
      />

      <WarningModal
        isOpen={isExtractWarningOpen}
        title='Extract PDF Text?'
        description='This will extract text from the uploaded PDF and save it to the course raw text field. If raw text already exists, it will be replaced.'
        onClose={onCloseExtractWarning}
        onConfirm={onConfirmExtractRawText}
      />

      <WarningModal
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

      <ModuleRawTextModal
        isOpen={isModuleRawTextModalOpen}
        isUpdating={isUpdatingModuleRawText}
        editableRawText={editableModuleRawText}
        title='Edit Module Text'
        placeholder='Module raw text will appear here.'
        onClose={onCloseModuleRawTextModal}
        onRawTextChange={onModuleRawTextChange}
        onSave={onSaveModuleRawText}
      />

      <ModuleRawTextModal
        isOpen={isUnitRawTextModalOpen}
        isUpdating={isUpdatingUnitRawText}
        editableRawText={editableUnitRawText}
        title='Edit Unit Text'
        placeholder='Unit raw text will appear here.'
        onClose={onCloseUnitRawTextModal}
        onRawTextChange={onUnitRawTextChange}
        onSave={onSaveUnitRawText}
      />
      <AddModuleModal
        isOpen={isAddModuleModalOpen}
        isAdding={isAddingModule}
        onClose={onCloseAddModuleModal}
        onConfirm={onConfirmAddModule}
      />
    </>
  );
};
