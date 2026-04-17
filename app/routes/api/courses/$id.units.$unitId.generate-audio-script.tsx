import { eq } from 'drizzle-orm';
import { data, type ActionFunctionArgs } from 'react-router';
import { getDb } from '~/db/connection';
import { getCourseById } from '~/db/courses';
import { units } from '~/db/schemas';
import { generateUnitAudioScript } from '~/utils/ai.server';
import {
  DEFAULT_CURRICULUM_MODELS,
  DEFAULT_CURRICULUM_PROVIDER,
  isCurriculumAiProvider,
  isSupportedCurriculumModel,
} from '~/utils/curriculum-options';
import { generateUnitAudioScriptWithGroq } from '~/utils/groq.server';
import { getUserFromRequest } from '~/utils/session.server';

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
      { error: 'Only the creator can generate unit audio scripts' },
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

  if (!unit.content?.trim()) {
    return data(
      { error: 'Unit does not have content to convert into an audio script' },
      { status: 400 },
    );
  }

  const apiKey =
    provider === 'google'
      ? (await import('cloudflare:workers')).env.GEMINI_API_KEY
      : (await import('cloudflare:workers')).env.GROQ_API_KEY;

  if (!apiKey) {
    return data(
      { error: `${provider} API key is missing for audio script generation` },
      { status: 503 },
    );
  }

  try {
    const generatedScript =
      provider === 'google'
        ? await generateUnitAudioScript(unit.content, apiKey, model)
        : await generateUnitAudioScriptWithGroq(unit.content, apiKey, model);

    if (!generatedScript.audioScript?.trim()) {
      return data(
        { error: 'The AI response did not include an audio script' },
        { status: 422 },
      );
    }

    await db
      .update(units)
      .set({
        audioScript: generatedScript.audioScript.trim(),
        updatedAt: new Date().toISOString(),
      })
      .where(eq(units.id, unitId));

    return data({
      success: true,
      scriptLength: generatedScript.audioScript.trim().length,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Generation failed';
    return data({ error: message }, { status: 500 });
  }
};
