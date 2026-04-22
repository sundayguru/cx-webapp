import { env } from 'cloudflare:workers';
import { eq } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
import { getDb } from '~/db/connection';
import {
  getCourseById,
  splitCourseRawTextIntoModules,
  splitModuleRawTextIntoUnits,
} from '~/db/courses';
import { modules, quizzes, units } from '~/db/schemas';
import type { InsertQuiz } from '~/db/schemas/quizzes';
import {
  DEFAULT_CURRICULUM_MODELS,
  DEFAULT_CURRICULUM_PROVIDER,
  type CurriculumAiProvider,
  isCurriculumAiProvider,
  isSupportedCurriculumModel,
} from '~/utils/curriculum-options';
import {
  generateModuleUnit,
  generateQuiz,
  generateUnitAudioScript,
} from '~/utils/ai.server';
import {
  generateModuleUnitWithGroq,
  generateQuizWithGroq,
  generateUnitAudioScriptWithGroq,
} from '~/utils/groq.server';
import { generateContentKey, uploadToR2 } from '~/utils/r2.server';

export const DEFAULT_WORKFLOW_QUIZ_TARGET = 50;
export const DEFAULT_WORKFLOW_QUIZ_BATCH_SIZE = 10;
export const DEFAULT_WORKFLOW_QUIZ_DELAY_SECONDS = 20;
const GOOGLE_TTS_ENDPOINT =
  'https://texttospeech.googleapis.com/v1/text:synthesize';

export type CourseAiOptions = {
  provider: CurriculumAiProvider;
  model: string;
};

export class CourseProcessingError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'CourseProcessingError';
    this.status = status;
  }
}

export const resolveCourseAiOptions = (
  providerValue: unknown,
  modelValue: unknown,
): CourseAiOptions => {
  const provider =
    typeof providerValue === 'string' && isCurriculumAiProvider(providerValue)
      ? providerValue
      : DEFAULT_CURRICULUM_PROVIDER;
  const model =
    typeof modelValue === 'string' &&
      isSupportedCurriculumModel(provider, modelValue)
      ? modelValue
      : DEFAULT_CURRICULUM_MODELS[provider];

  return { provider, model };
};

const getCourseProcessingApiKey = (provider: CurriculumAiProvider) => {
  return provider === 'google' ? env.GEMINI_API_KEY : env.GROQ_API_KEY;
};

const createUnitMediaKey = (
  unitId: string,
  mediaType: 'audio' | 'video',
  filename: string,
) => {
  return `units/${unitId}/${mediaType}/${generateContentKey(unitId, filename).split('/').pop()}`;
};

const decodeBase64ToUint8Array = (base64: string) => {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return bytes;
};

const synthesizeAudioWithGoogleTts = async (audioScript: string) => {
  if (!env.GOOGLE_API_KEY) {
    throw new CourseProcessingError(
      'Google API key is missing for unit audio generation',
      503,
    );
  }

  const response = await fetch(GOOGLE_TTS_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': env.GOOGLE_API_KEY,
    },
    body: JSON.stringify({
      input: { text: audioScript },
      voice: {
        languageCode: 'en-US',
        ssmlGender: 'NEUTRAL',
      },
      audioConfig: {
        audioEncoding: 'MP3',
      },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new CourseProcessingError(
      `Google TTS request failed: ${errorText || response.statusText}`,
      502,
    );
  }

  const payload = (await response.json()) as { audioContent?: string };
  if (!payload.audioContent) {
    throw new CourseProcessingError(
      'Google TTS did not return audio content',
      502,
    );
  }

  return decodeBase64ToUint8Array(payload.audioContent);
};

export const splitCourseRawTextIntoModulesForCourse = async (
  courseId: string,
) => {
  const courseData = await getCourseById(courseId);
  if (!courseData) {
    throw new CourseProcessingError('Course not found', 404);
  }

  const rawText = courseData.course.rawText?.trim() || '';
  if (!rawText) {
    throw new CourseProcessingError('Course raw text is empty', 400);
  }

  if (!rawText.includes('--endmodule--') && !rawText.includes('--end--')) {
    throw new CourseProcessingError(
      'Course raw text must include "--endmodule--" separators before splitting.',
      400,
    );
  }

  const updatedCourse = await splitCourseRawTextIntoModules(courseId, rawText);
  if (!updatedCourse) {
    throw new CourseProcessingError(
      'Failed to create modules from raw text',
      500,
    );
  }

  return {
    modulesCount: updatedCourse.modules.length,
    modules: updatedCourse.modules.map((module) => ({
      id: module.id,
      title: module.title,
    })),
  };
};

export const splitModuleRawTextIntoUnitsForModule = async (
  moduleId: string,
) => {
  const db = getDb();
  const [module] = await db
    .select()
    .from(modules)
    .where(eq(modules.id, moduleId))
    .limit(1);

  if (!module) {
    throw new CourseProcessingError('Module not found', 404);
  }

  if (!module.rawText?.trim()) {
    throw new CourseProcessingError('Module raw text is empty', 400);
  }

  if (
    !module.rawText.includes('--endunit--') &&
    !module.rawText.includes('--end--')
  ) {
    throw new CourseProcessingError(
      'Module raw text must include "--endunit--" separators before splitting into units',
      400,
    );
  }

  const result = await splitModuleRawTextIntoUnits(moduleId);
  if (!result) {
    throw new CourseProcessingError(
      'Failed to create units from raw text',
      500,
    );
  }

  return {
    moduleId,
    unitsCount: result.unitsCount,
  };
};

export const generateUnitContentForUnit = async (
  unitId: string,
  options: CourseAiOptions,
) => {
  const db = getDb();
  const [unit] = await db
    .select()
    .from(units)
    .where(eq(units.id, unitId))
    .limit(1);

  if (!unit) {
    throw new CourseProcessingError('Unit not found', 404);
  }

  if (!unit.rawText?.trim()) {
    throw new CourseProcessingError(
      'Unit does not have raw text to generate content from',
      400,
    );
  }

  const apiKey = getCourseProcessingApiKey(options.provider);
  if (!apiKey) {
    throw new CourseProcessingError(
      `${options.provider} API key is missing for content generation`,
      503,
    );
  }

  const generatedUnit =
    options.provider === 'google'
      ? await generateModuleUnit(unit.rawText, apiKey, options.model)
      : await generateModuleUnitWithGroq(unit.rawText, apiKey, options.model);

  if (!generatedUnit) {
    throw new CourseProcessingError(
      'The AI response did not include any content',
      422,
    );
  }

  await db
    .update(units)
    .set({
      title: generatedUnit.title,
      summary: generatedUnit.summary,
      content: generatedUnit.content,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(units.id, unitId));

  return {
    title: generatedUnit.title,
    summary: generatedUnit.summary,
    contentLength: generatedUnit.content.length,
  };
};

export const generateUnitAudioScriptForUnit = async (
  unitId: string,
  options: CourseAiOptions,
) => {
  const db = getDb();
  const [unit] = await db
    .select()
    .from(units)
    .where(eq(units.id, unitId))
    .limit(1);

  if (!unit) {
    throw new CourseProcessingError('Unit not found', 404);
  }

  if (!unit.content?.trim()) {
    throw new CourseProcessingError(
      'Unit does not have content to convert into an audio script',
      400,
    );
  }

  const apiKey = getCourseProcessingApiKey(options.provider);
  if (!apiKey) {
    throw new CourseProcessingError(
      `${options.provider} API key is missing for audio script generation`,
      503,
    );
  }

  const generatedScript =
    options.provider === 'google'
      ? await generateUnitAudioScript(unit.content, apiKey, options.model)
      : await generateUnitAudioScriptWithGroq(
        unit.content,
        apiKey,
        options.model,
      );

  const audioScript = generatedScript.audioScript?.trim();
  if (!audioScript) {
    throw new CourseProcessingError(
      'The AI response did not include an audio script',
      422,
    );
  }

  await db
    .update(units)
    .set({
      audioScript,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(units.id, unitId));

  return {
    scriptLength: audioScript.length,
  };
};

export const generateUnitAudioForUnit = async (unitId: string) => {
  const db = getDb();
  const [unit] = await db
    .select()
    .from(units)
    .where(eq(units.id, unitId))
    .limit(1);

  if (!unit) {
    throw new CourseProcessingError('Unit not found', 404);
  }

  if (!unit.audioScript?.trim()) {
    throw new CourseProcessingError(
      'Unit does not have an audio script to synthesize',
      400,
    );
  }

  if (unit.audioUrl?.trim()) {
    throw new CourseProcessingError(
      'Unit already has audio. Remove or replace it before generating again.',
      409,
    );
  }

  const audioBytes = await synthesizeAudioWithGoogleTts(
    unit.audioScript.trim(),
  );
  const audioKey = createUnitMediaKey(unitId, 'audio', 'generated-audio.mp3');
  const audioBuffer = audioBytes.buffer.slice(
    audioBytes.byteOffset,
    audioBytes.byteOffset + audioBytes.byteLength,
  );
  const upload = await uploadToR2(audioKey, audioBuffer, 'audio/mpeg');

  if (!upload) {
    throw new CourseProcessingError('Failed to upload generated audio', 500);
  }

  const audioUrl = `/api/course/serve/${upload.key}`;

  await db
    .update(units)
    .set({
      audioUrl,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(units.id, unitId));

  return {
    audioUrl,
  };
};

type GenerateUnitQuizBatchOptions = CourseAiOptions & {
  maxNewQuizzes?: number;
  maxTotalQuizzes?: number;
};

export const generateQuizBatchForUnit = async (
  unitId: string,
  options: GenerateUnitQuizBatchOptions,
) => {
  const db = getDb();
  const [unit] = await db
    .select()
    .from(units)
    .where(eq(units.id, unitId))
    .limit(1);

  if (!unit) {
    throw new CourseProcessingError('Unit not found', 404);
  }

  if (!unit.rawText?.trim()) {
    throw new CourseProcessingError(
      'Unit does not have raw text to generate quiz from',
      400,
    );
  }

  const existingQuizzes = await db
    .select({ question: quizzes.question })
    .from(quizzes)
    .where(eq(quizzes.unitId, unitId));

  const existingQuestions = existingQuizzes.map((quiz) => quiz.question);
  const maxTotalQuizzes =
    options.maxTotalQuizzes ?? DEFAULT_WORKFLOW_QUIZ_TARGET;

  if (existingQuestions.length >= maxTotalQuizzes) {
    return {
      count: 0,
      totalCount: existingQuestions.length,
      reachedTarget: true,
    };
  }

  const apiKey = getCourseProcessingApiKey(options.provider);
  if (!apiKey) {
    throw new CourseProcessingError(
      `${options.provider} API key is missing for quiz generation`,
      503,
    );
  }

  const generatedQuiz =
    options.provider === 'google'
      ? await generateQuiz(
        unit.rawText,
        existingQuestions,
        apiKey,
        options.model,
      )
      : await generateQuizWithGroq(
        unit.rawText,
        existingQuestions,
        apiKey,
        options.model,
      );

  if (!generatedQuiz.quizzes || generatedQuiz.quizzes.length === 0) {
    throw new CourseProcessingError(
      'The AI response did not include any quiz questions',
      422,
    );
  }

  const remainingSlots = Math.max(
    0,
    maxTotalQuizzes - existingQuestions.length,
  );
  const maxNewQuizzes = Math.min(
    options.maxNewQuizzes ?? DEFAULT_WORKFLOW_QUIZ_BATCH_SIZE,
    remainingSlots,
  );
  const seenQuestions = new Set(existingQuestions);
  const newQuizzes: InsertQuiz[] = [];

  for (const quiz of generatedQuiz.quizzes) {
    if (newQuizzes.length >= maxNewQuizzes) {
      break;
    }

    if (seenQuestions.has(quiz.question)) {
      continue;
    }

    seenQuestions.add(quiz.question);
    newQuizzes.push({
      id: uuidv4(),
      unitId,
      question: quiz.question,
      questionType: quiz.questionType,
      answer: quiz.answer,
      options: quiz.options ? JSON.stringify(quiz.options) : '[]',
    });
  }

  if (newQuizzes.length === 0) {
    throw new CourseProcessingError(
      'The AI response did not include any new quiz questions',
      422,
    );
  }

  await db.insert(quizzes).values(newQuizzes);

  return {
    count: newQuizzes.length,
    totalCount: existingQuestions.length + newQuizzes.length,
    reachedTarget:
      existingQuestions.length + newQuizzes.length >= maxTotalQuizzes,
  };
};
