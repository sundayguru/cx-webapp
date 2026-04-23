import { type ActionFunctionArgs, data } from 'react-router';
import { getCourseById } from '~/db/courses';
import {
  CourseProcessingError,
  splitModuleRawTextIntoUnitsForModule,
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

  if (courseData.course.createdBy !== user.id && !user.isAdmin) {
    return data(
      { error: 'Only the creator or an admin can split modules into units' },
      { status: 403 },
    );
  }

  const modulesWithRawText = courseData.modules.filter((module) =>
    Boolean(module.rawText?.trim()),
  );

  if (modulesWithRawText.length === 0) {
    return data(
      { error: 'No module raw text is available to split into units' },
      { status: 400 },
    );
  }

  try {
    let modulesCount = 0;
    let unitsCount = 0;

    for (const module of modulesWithRawText) {
      const result = await splitModuleRawTextIntoUnitsForModule(module.id);
      modulesCount += 1;
      unitsCount += result.unitsCount;
    }

    return data({
      success: true,
      modulesCount,
      unitsCount,
    });
  } catch (err: unknown) {
    const message =
      err instanceof Error
        ? err.message
        : 'Failed to create units from module raw text';
    return data(
      { error: message },
      { status: err instanceof CourseProcessingError ? err.status : 500 },
    );
  }
};
