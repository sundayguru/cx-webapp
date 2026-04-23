import { env } from 'cloudflare:workers';
import { type ActionFunctionArgs, data } from 'react-router';
import { getCourseById } from '~/db/courses';
import {
  resolveCourseAiOptions,
  resolveGoogleTtsVoiceOptions,
} from '~/utils/course-processing.server';
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
      { error: 'Only the creator can start the unit audio workflow' },
      { status: 403 },
    );
  }

  const formData = await request.formData();
  const options = resolveCourseAiOptions(
    formData.get('provider'),
    formData.get('model'),
  );
  const voiceOptions = resolveGoogleTtsVoiceOptions({
    languageCode: formData.get('languageCode'),
    ssmlGender: formData.get('ssmlGender'),
    voiceName: formData.get('voiceName'),
    speakingRate: formData.get('speakingRate'),
    pitch: formData.get('pitch'),
  });

  const instance = await env.COURSE_UNIT_AUDIO_WORKFLOW.create({
    id: `course-audio-${id}-${Date.now()}`,
    params: {
      courseId: id,
      provider: options.provider,
      model: options.model,
      languageCode: voiceOptions.languageCode,
      ssmlGender: voiceOptions.ssmlGender,
      voiceName: voiceOptions.voiceName,
      speakingRate: voiceOptions.speakingRate,
      pitch: voiceOptions.pitch,
    },
  });

  return data({
    success: true,
    instanceId: instance.id,
  });
};
