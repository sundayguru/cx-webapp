import { type ActionFunctionArgs, data } from 'react-router';
import { Buffer } from 'node:buffer';
import { getCourseById, updateCourseRawText } from '~/db/courses';
import { getFromR2 } from '~/utils/r2.server';
import { extractTextFromPdf } from '~/utils/ai.server';
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
      { error: 'Only the creator can extract raw text' },
      { status: 403 },
    );
  }

  if (!courseData.course.contentKey) {
    return data(
      { error: 'No PDF content found for this course' },
      { status: 400 },
    );
  }

  try {
    const pdfObject = await getFromR2(courseData.course.contentKey);
    if (!pdfObject) {
      return data(
        { error: 'Failed to retrieve PDF from storage' },
        { status: 500 },
      );
    }

    const arrayBuffer = await pdfObject.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const rawText = await extractTextFromPdf(buffer);

    if (!rawText.trim()) {
      return data(
        { error: 'Could not extract any text from the PDF' },
        { status: 400 },
      );
    }

    const updatedCourse = await updateCourseRawText(id, rawText);
    if (!updatedCourse) {
      return data({ error: 'Failed to save extracted text' }, { status: 500 });
    }

    return data({
      success: true,
      characters: rawText.length,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Extraction failed';
    return data({ error: message }, { status: 500 });
  }
};
