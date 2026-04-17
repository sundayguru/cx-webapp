import { type ActionFunctionArgs, data } from 'react-router';
import { getCourseById } from '~/db/courses';
import { getDb } from '~/db/connection';
import { units } from '~/db/schemas';
import { eq } from 'drizzle-orm';
import { getUserFromRequest } from '~/utils/session.server';
import {
  DEFAULT_CURRICULUM_MODELS,
  DEFAULT_CURRICULUM_PROVIDER,
  isCurriculumAiProvider,
  isSupportedCurriculumModel,
} from '~/utils/curriculum-options';
import { generateModuleUnit } from '~/utils/ai.server';
import { generateModuleUnitWithGroq } from '~/utils/groq.server';

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
      { error: 'Only the creator can generate unit content' },
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
      { error: 'Unit does not have raw text to generate content from' },
      { status: 400 },
    );
  }

  const apiKey =
    provider === 'google'
      ? (await import('cloudflare:workers')).env.GEMINI_API_KEY
      : (await import('cloudflare:workers')).env.GROQ_API_KEY;

  if (!apiKey) {
    return data(
      { error: `${provider} API key is missing for content generation` },
      { status: 503 },
    );
  }

  try {
    const generatedContent =
      provider === 'google'
        ? await generateModuleUnit(unit.rawText, apiKey, model)
        : await generateModuleUnitWithGroq(unit.rawText, apiKey, model);

    const generatedUnit = generatedContent;
    if (!generatedUnit) {
      return data(
        { error: 'The AI response did not include any content' },
        { status: 422 },
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

    return data({
      success: true,
      title: generatedUnit.title,
      summary: generatedUnit.summary,
      contentLength: generatedUnit.content.length,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Generation failed';
    return data({ error: message }, { status: 500 });
  }
};
