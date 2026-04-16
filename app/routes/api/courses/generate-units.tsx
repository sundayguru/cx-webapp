import { type ActionFunctionArgs, data } from 'react-router';
import { env } from 'cloudflare:workers';
import { getCourseById, replaceModuleUnits } from '~/db/courses';
import { generateModuleUnits } from '~/utils/ai.server';
import {
  DEFAULT_CURRICULUM_MODELS,
  DEFAULT_CURRICULUM_PROVIDER,
  isCurriculumAiProvider,
  isSupportedCurriculumModel,
} from '~/utils/curriculum-options';
import { generateModuleUnitsWithGroq } from '~/utils/groq.server';
import { getUserFromRequest } from '~/utils/session.server';

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
      { error: 'Only the creator can generate units' },
      { status: 403 },
    );
  }

  const formData = await request.formData();
  const providerValue = formData.get('provider');
  const modelValue = formData.get('model');
  const moduleIdValue = formData.get('moduleId');

  const provider =
    typeof providerValue === 'string' && isCurriculumAiProvider(providerValue)
      ? providerValue
      : DEFAULT_CURRICULUM_PROVIDER;
  const model =
    typeof modelValue === 'string' &&
    isSupportedCurriculumModel(provider, modelValue)
      ? modelValue
      : DEFAULT_CURRICULUM_MODELS[provider];

  if (typeof moduleIdValue !== 'string' || !moduleIdValue) {
    return data({ error: 'Module selection is required' }, { status: 400 });
  }

  const selectedModule = courseData.modules.find(
    (module) => module.id === moduleIdValue,
  );
  if (!selectedModule) {
    return data({ error: 'Selected module was not found' }, { status: 404 });
  }

  if (!selectedModule.rawText?.trim()) {
    return data(
      {
        error: 'Selected module does not have raw text to generate units from',
      },
      { status: 400 },
    );
  }

  const apiKey = provider === 'google' ? env.GEMINI_API_KEY : env.GROQ_API_KEY;
  if (!apiKey) {
    return data(
      { error: `${provider} API key is missing for unit generation` },
      { status: 503 },
    );
  }

  try {
    const generatedModule =
      provider === 'google'
        ? await generateModuleUnits(selectedModule.rawText, apiKey, model)
        : await generateModuleUnitsWithGroq(
            selectedModule.rawText,
            apiKey,
            model,
          );

    if (!generatedModule.units.length) {
      return data(
        { error: 'The AI response did not include any units' },
        { status: 422 },
      );
    }

    const updated = await replaceModuleUnits(
      selectedModule.id,
      generatedModule,
    );
    if (!updated) {
      return data({ error: 'Failed to save generated units' }, { status: 500 });
    }

    return data({
      success: true,
      moduleId: selectedModule.id,
      moduleTitle: generatedModule.title,
      unitsCount: generatedModule.units.length,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Generation failed';
    return data({ error: message }, { status: 500 });
  }
};
