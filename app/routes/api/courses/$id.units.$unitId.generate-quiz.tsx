import { type ActionFunctionArgs, data } from 'react-router';
import { env } from 'cloudflare:workers';
import { getCourseById } from '~/db/courses';
import { getDb } from '~/db/connection';
import { units, quizzes } from '~/db/schemas';
import { eq } from 'drizzle-orm';
import { getUserFromRequest } from '~/utils/session.server';
import {
  DEFAULT_CURRICULUM_MODELS,
  DEFAULT_CURRICULUM_PROVIDER,
  isCurriculumAiProvider,
  isSupportedCurriculumModel,
} from '~/utils/curriculum-options';
import { generateQuiz } from '~/utils/ai.server';
import { v4 as uuidv4 } from 'uuid';
import { generateQuizWithGroq } from '~/utils/groq.server';

export const action = async ({ request, params }: ActionFunctionArgs) => {
  const user = await getUserFromRequest(request);
  if (!user) {
    return data({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id, unitId } = params;
  if (!id || !unitId) {
    return data(
      { error: 'Course ID and Unit ID are required' },
      { status: 400 },
    );
  }

  const courseData = await getCourseById(id);
  if (!courseData) {
    return data({ error: 'Course not found' }, { status: 404 });
  }

  if (courseData.course.createdBy !== user.id) {
    return data(
      { error: 'Only the creator can generate quizzes' },
      { status: 403 },
    );
  }

  const formData = await request.formData();
  const providerValue = formData.get('provider');
  const modelValue = formData.get('model');

  const provider =
    typeof providerValue === 'string' && isCurriculumAiProvider(providerValue)
      ? providerValue
      : DEFAULT_CURRICULUM_PROVIDER;
  const model =
    typeof modelValue === 'string' &&
    isSupportedCurriculumModel(provider, modelValue)
      ? modelValue
      : DEFAULT_CURRICULUM_MODELS[provider];

  const db = getDb();
  const [unit] = await db
    .select()
    .from(units)
    .where(eq(units.id, unitId))
    .limit(1);

  if (!unit) {
    return data({ error: 'Unit not found' }, { status: 404 });
  }

  if (!unit.rawText?.trim()) {
    return data(
      { error: 'Unit does not have raw text to generate quiz from' },
      { status: 400 },
    );
  }

  const existingQuizzes = await db
    .select({ question: quizzes.question })
    .from(quizzes)
    .where(eq(quizzes.unitId, unitId));

  const existingQuestions = existingQuizzes.map((q) => q.question);

  const apiKey = provider === 'google' ? env.GEMINI_API_KEY : env.GROQ_API_KEY;
  if (!apiKey) {
    return data(
      { error: `${provider} API key is missing for quiz generation` },
      { status: 503 },
    );
  }

  try {
    const generatedQuiz =
      provider === 'google'
        ? await generateQuiz(unit.rawText, existingQuestions, apiKey, model)
        : await generateQuizWithGroq(
            unit.rawText,
            existingQuestions,
            apiKey,
            model,
          );

    if (!generatedQuiz.quizzes || generatedQuiz.quizzes.length === 0) {
      return data(
        { error: 'The AI response did not include any quiz questions' },
        { status: 422 },
      );
    }

    const newQuizzes = generatedQuiz.quizzes.map((q) => ({
      id: uuidv4(),
      unitId,
      question: q.question,
      questionType: q.questionType,
      answer: q.answer,
      options: q.options ? JSON.stringify(q.options) : '[]',
    }));

    await db.insert(quizzes).values(newQuizzes);

    return data({
      success: true,
      count: newQuizzes.length,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Generation failed';
    return data({ error: message }, { status: 500 });
  }
};
