import { type ActionFunctionArgs, data } from 'react-router';
import { env } from 'cloudflare:workers';
import { getCourseById, updateCourseRawText } from '~/db/courses';
import { generateRawTextTags } from '~/utils/ai.server';
import { generateRawTextTagsWithGroq } from '~/utils/groq.server';
import { getUserFromRequest } from '~/utils/session.server';
import {
  CURRICULUM_MODEL_OPTIONS,
  DEFAULT_CURRICULUM_MODELS,
  DEFAULT_CURRICULUM_PROVIDER,
  isCurriculumAiProvider,
  isSupportedCurriculumModel,
} from '~/utils/curriculum-options';
import type { RawTextTagMarker } from '~/utils/curriculum-generation.server';

const COURSE_RAW_TEXT_TAG = '--endmodule--';
const UNIT_RAW_TEXT_TAG = '--endunit--';

const stripExistingTags = (rawText: string) =>
  rawText.replaceAll(COURSE_RAW_TEXT_TAG, '').replaceAll(UNIT_RAW_TEXT_TAG, '');

const insertMarkersIntoRawText = (
  rawText: string,
  markers: RawTextTagMarker[],
): string => {
  const validMarkers = markers
    .filter(
      (marker) =>
        Number.isInteger(marker.position) &&
        marker.position >= 0 &&
        marker.position <= rawText.length &&
        (marker.tag === COURSE_RAW_TEXT_TAG ||
          marker.tag === UNIT_RAW_TEXT_TAG),
    )
    .sort((a, b) => b.position - a.position);

  let nextRawText = rawText;

  validMarkers.forEach((marker) => {
    const prefix = nextRawText.slice(0, marker.position).replace(/\s+$/, '');
    const suffix = nextRawText.slice(marker.position).replace(/^\s+/, '');
    nextRawText = `${prefix}\n${marker.tag}\n${suffix}`;
  });

  return nextRawText;
};

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
      { error: 'Only the creator can tag course raw text' },
      { status: 403 },
    );
  }

  const currentRawText = courseData.course.rawText?.trim() || '';
  if (!currentRawText) {
    return data({ error: 'Course raw text is empty' }, { status: 400 });
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

    const cleanRawText = stripExistingTags(currentRawText);
    const response =
      provider === 'google'
        ? await generateRawTextTags(cleanRawText, apiKey, model)
        : await generateRawTextTagsWithGroq(cleanRawText, apiKey, model);

    if (!response.markers.length) {
      return data({ error: 'AI did not return any markers' }, { status: 400 });
    }

    const taggedRawText = insertMarkersIntoRawText(
      cleanRawText,
      response.markers,
    );
    const updatedCourse = await updateCourseRawText(id, taggedRawText);

    if (!updatedCourse) {
      return data({ error: 'Failed to update raw text' }, { status: 500 });
    }

    return data({
      success: true,
      markersCount: response.markers.length,
      provider,
      model,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Tagging failed';
    return data({ error: message }, { status: 500 });
  }
};
