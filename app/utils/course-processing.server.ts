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
import { generateModuleUnit, generateQuiz } from '~/utils/ai.server';
import {
  generateModuleUnitWithGroq,
  generateQuizWithGroq,
} from '~/utils/groq.server';

export const DEFAULT_WORKFLOW_QUIZ_TARGET = 50;
export const DEFAULT_WORKFLOW_QUIZ_BATCH_SIZE = 10;
export const DEFAULT_WORKFLOW_QUIZ_DELAY_SECONDS = 20;

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
