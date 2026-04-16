import { type ActionFunctionArgs, data } from 'react-router';
import { getCourseById, updateCourseRawText } from '~/db/courses';
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
      { error: 'Only the creator can update raw text' },
      { status: 403 },
    );
  }

  try {
    const formData = await request.formData();
    const rawTextValue = formData.get('rawText');

    if (typeof rawTextValue !== 'string') {
      return data({ error: 'Raw text is required' }, { status: 400 });
    }

    const updatedCourse = await updateCourseRawText(id, rawTextValue.trim());
    if (!updatedCourse) {
      return data({ error: 'Failed to update raw text' }, { status: 500 });
    }

    return data({
      success: true,
      characters: rawTextValue.trim().length,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Update failed';
    return data({ error: message }, { status: 500 });
  }
};
