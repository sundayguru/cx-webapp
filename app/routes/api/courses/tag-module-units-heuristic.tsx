import { type ActionFunctionArgs, data } from 'react-router';
import { getCourseById, updateModuleRawText } from '~/db/courses';
import { getUserFromRequest } from '~/utils/session.server';
import {
  buildModuleUnitMarkers,
  insertMarkersIntoRawText,
  stripUnitTags,
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
      { error: 'Only the creator or an admin can tag module unit text' },
      { status: 403 },
    );
  }

  const modulesWithRawText = courseData.modules.filter((module) =>
    Boolean(module.rawText?.trim()),
  );

  if (modulesWithRawText.length === 0) {
    return data(
      { error: 'No module raw text is available to tag' },
      { status: 400 },
    );
  }

  try {
    let taggedModulesCount = 0;
    let markersCount = 0;

    for (const module of modulesWithRawText) {
      const cleanRawText = stripUnitTags(module.rawText ?? '');
      const markers = buildModuleUnitMarkers(cleanRawText);

      if (markers.length === 0) {
        continue;
      }

      const taggedText = insertMarkersIntoRawText(cleanRawText, markers);
      const updated = await updateModuleRawText(module.id, taggedText);

      if (!updated) {
        return data(
          { error: `Failed to update raw text for module "${module.title}"` },
          { status: 500 },
        );
      }

      taggedModulesCount += 1;
      markersCount += markers.length;
    }

    if (markersCount === 0) {
      return data(
        { error: 'No unit boundaries matched the existing tagging rules' },
        { status: 400 },
      );
    }

    return data({
      success: true,
      taggedModulesCount,
      markersCount,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Tagging failed';
    return data({ error: message }, { status: 500 });
  }
};
