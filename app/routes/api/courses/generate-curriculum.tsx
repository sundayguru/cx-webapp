import { type ActionFunctionArgs, data } from 'react-router';
import { getUserFromRequest } from '~/utils/session.server';
import {
  getCourseById,
  clearCourseCurriculum,
  addCurriculum,
} from '~/db/courses';
import { getFromR2 } from '~/utils/r2.server';
import { extractTextFromPdf, generateCurriculum } from '~/utils/ai.server';
import { generateCurriculumWithGroq } from '~/utils/groq.server';
import { env } from 'cloudflare:workers';
import { Buffer } from 'node:buffer';
import {
  CURRICULUM_MODEL_OPTIONS,
  DEFAULT_CURRICULUM_MODELS,
  DEFAULT_CURRICULUM_PROVIDER,
  isCurriculumAiProvider,
  isSupportedCurriculumModel,
} from '~/utils/curriculum-options';

export const action = async ({ request, params }: ActionFunctionArgs) => {
  const user = await getUserFromRequest(request);
  if (!user) {
    return data({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = params;
  if (!id) {
    return data({ error: 'Course ID is required' }, { status: 400 });
  }

  const courseData = await getCourseById(id);
  if (!courseData) {
    return data({ error: 'Course not found' }, { status: 404 });
  }

  if (courseData.course.createdBy !== user.id) {
    return data(
      { error: 'Only the creator can generate curriculum' },
      { status: 403 },
    );
  }

  if (!courseData.course.contentKey) {
    return data(
      { error: 'No PDF content found for this course' },
      { status: 400 },
    );
  }

  try {
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

    // 1. Get PDF from R2
    const pdfObject = await getFromR2(courseData.course.contentKey);
    if (!pdfObject) {
      return data(
        { error: 'Failed to retrieve PDF from storage' },
        { status: 500 },
      );
    }

    const arrayBuffer = await pdfObject.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 2. Extract text
    const text = await extractTextFromPdf(buffer);
    if (!text || text.trim().length === 0) {
      return data(
        { error: 'Could not extract text from the PDF' },
        { status: 400 },
      );
    }

    // 3. AI Generate Structure
    const apiKey =
      provider === 'google' ? env.GEMINI_API_KEY : env.GROQ_API_KEY;
    if (!apiKey) {
      return data(
        {
          error: `AI processing is currently disabled (${provider} API key missing)`,
          provider,
          availableModels: CURRICULUM_MODEL_OPTIONS[provider],
        },
        { status: 503 },
      );
    }

    const { modules } =
      provider === 'google'
        ? await generateCurriculum(text, apiKey, model)
        : await generateCurriculumWithGroq(text, apiKey, model);

    // 4. Save to DB (Clear old first)
    await clearCourseCurriculum(id);
    await addCurriculum(id, modules);

    return data({
      success: true,
      modulesCount: modules.length,
      provider,
      model,
    });
  } catch (err: unknown) {
    console.error('Curriculum generation failed:', err);
    const message = err instanceof Error ? err.message : 'Generation failed';
    return data({ error: message }, { status: 500 });
  }
};
