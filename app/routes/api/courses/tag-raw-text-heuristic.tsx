import { type ActionFunctionArgs, data } from 'react-router';
import { getCourseById, updateCourseRawText } from '~/db/courses';
import { getUserFromRequest } from '~/utils/session.server';
import {
  DEFAULT_MODULE_WORD_STYLE,
  buildCourseModuleMarkers,
  insertMarkersIntoRawText,
  stripCourseModuleTags,
} from '~/utils/raw-text-tagging';

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

  if (courseData.course.createdBy !== user.id && !user.isAdmin) {
    return data(
      { error: 'Only the creator or an admin can tag course raw text' },
      { status: 403 },
    );
  }

  const currentRawText = courseData.course.rawText?.trim() || '';
  if (!currentRawText) {
    return data({ error: 'Course raw text is empty' }, { status: 400 });
  }

  try {
    const formData = await request.formData();
    const moduleWordStyleValue = formData.get('moduleWordStyle');
    const lookupDistanceValue = formData.get('lookupDistance');
    const moduleWordStyle =
      typeof moduleWordStyleValue === 'string' &&
      moduleWordStyleValue.trim().length > 0
        ? moduleWordStyleValue.trim()
        : undefined;
    const lookupDistance =
      typeof lookupDistanceValue === 'string' &&
      lookupDistanceValue.trim().length > 0
        ? Number(lookupDistanceValue.trim())
        : undefined;
    const effectiveModuleWordStyle =
      moduleWordStyle ?? DEFAULT_MODULE_WORD_STYLE;
    const effectiveLookupDistance = lookupDistance ?? 1000;

    const cleanRawText = stripCourseModuleTags(currentRawText);
    const markers = buildCourseModuleMarkers(
      cleanRawText,
      effectiveModuleWordStyle,
      effectiveLookupDistance,
    );
    const taggedText = insertMarkersIntoRawText(cleanRawText, markers);

    if (taggedText === cleanRawText) {
      return data(
        { error: 'No module boundaries matched the tagging rules' },
        { status: 400 },
      );
    }

    const updatedCourse = await updateCourseRawText(id, taggedText);

    if (!updatedCourse) {
      return data({ error: 'Failed to update raw text' }, { status: 500 });
    }

    return data({
      success: true,
      markersCount: markers.length,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Tagging failed';
    return data({ error: message }, { status: 500 });
  }
};
