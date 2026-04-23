import { data, type ActionFunctionArgs } from 'react-router';
import { getCourseById } from '~/db/courses';
import {
  CourseProcessingError,
  listGoogleTtsVoices,
} from '~/utils/course-processing.server';
import { getUserFromRequest } from '~/utils/session.server';

export const loader = async ({ request, params }: ActionFunctionArgs) => {
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
      { error: 'Only the creator can view Google voice options' },
      { status: 403 },
    );
  }

  try {
    const requestUrl = new URL(request.url);
    const voices = await listGoogleTtsVoices(
      requestUrl.searchParams.get('languageCode') || undefined,
    );

    return data({
      success: true,
      voices: voices.map((voice) => ({
        name: voice.name,
        languageCodes: voice.languageCodes,
        ssmlGender: voice.ssmlGender,
        naturalSampleRateHertz: voice.naturalSampleRateHertz,
      })),
    });
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : 'Failed to load Google voices';

    return data(
      { error: message },
      { status: err instanceof CourseProcessingError ? err.status : 500 },
    );
  }
};
