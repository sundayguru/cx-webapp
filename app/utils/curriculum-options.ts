import { GROQ_MODELS } from "./constants";

export type CurriculumAiProvider = 'google' | 'groq';

export type CurriculumModelOption = {
  value: string;
  label: string;
};

export const GOOGLE_CURRICULUM_MODEL_OPTIONS: CurriculumModelOption[] = [
  { value: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash' },
  { value: 'gemini-2.0-flash', label: 'Gemini 2.0 Flash' },
  { value: 'gemini-1.5-flash-latest', label: 'Gemini 1.5 Flash Latest' },
];

const formatGroqModelLabel = (key: string, value: string) => {
  const cleanedKey = key
    .replace(/_/g, ' ')
    .replace(/\bLLAMA\b/g, 'Llama')
    .replace(/\bMETA\b/g, 'Meta')
    .replace(/\bQWEN\b/g, 'Qwen')
    .replace(/\bGEMMA\b/g, 'Gemma')
    .replace(/\bDEEPSEEK\b/g, 'DeepSeek')
    .replace(/\bWHISPER\b/g, 'Whisper')
    .replace(/\bTURBO\b/g, 'Turbo')
    .replace(/\bINSTRUCT\b/g, 'Instruct')
    .replace(/\bVERSATILE\b/g, 'Versatile')
    .replace(/\bINSTANT\b/g, 'Instant')
    .replace(/\bGUARD\b/g, 'Guard')
    .replace(/\bSCOUT\b/g, 'Scout')
    .replace(/\bMAVERICK\b/g, 'Maverick')
    .replace(/\bLARGE\b/g, 'Large')
    .replace(/\bDISTILL\b/g, 'Distill')
    .replace(/\bR1\b/g, 'R1');

  return (
    cleanedKey
      .split(' ')
      .filter(Boolean)
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim() || value
  );
};

export const GROQ_CURRICULUM_MODEL_OPTIONS: CurriculumModelOption[] =
  Object.entries(GROQ_MODELS).map(([key, value]) => ({
    value,
    label: formatGroqModelLabel(key, value),
  }));

export const CURRICULUM_MODEL_OPTIONS: Record<
  CurriculumAiProvider,
  CurriculumModelOption[]
> = {
  google: GOOGLE_CURRICULUM_MODEL_OPTIONS,
  groq: GROQ_CURRICULUM_MODEL_OPTIONS,
};

export const DEFAULT_CURRICULUM_PROVIDER: CurriculumAiProvider = 'google';

export const DEFAULT_CURRICULUM_MODELS: Record<CurriculumAiProvider, string> = {
  google: GOOGLE_CURRICULUM_MODEL_OPTIONS[0].value,
  groq: GROQ_CURRICULUM_MODEL_OPTIONS[0].value,
};

export const isCurriculumAiProvider = (
  value: string,
): value is CurriculumAiProvider => value === 'google' || value === 'groq';

export const isSupportedCurriculumModel = (
  provider: CurriculumAiProvider,
  model: string,
) =>
  CURRICULUM_MODEL_OPTIONS[provider].some(
    (modelOption) => modelOption.value === model,
  );
