import { type ActionFunctionArgs, data } from 'react-router';
import { getCourseById, splitCourseRawTextIntoModules } from '~/db/courses';
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
      { error: 'Only the creator can split raw text into modules' },
      { status: 403 },
    );
  }

  const rawText = courseData.course.rawText?.trim() || '';
  if (!rawText) {
    return data({ error: 'Course raw text is empty' }, { status: 400 });
  }

  if (!rawText.includes('--endmodule--') && !rawText.includes('--end--')) {
    return data(
      {
        error:
          'Course raw text must include "--endmodule--" separators before splitting.',
      },
      { status: 400 },
    );
  }

  const updatedCourse = await splitCourseRawTextIntoModules(id, rawText);
  if (!updatedCourse) {
    return data(
      { error: 'Failed to create modules from raw text' },
      { status: 500 },
    );
  }

  return data({
    success: true,
    modulesCount: updatedCourse.modules.length,
  });
};
