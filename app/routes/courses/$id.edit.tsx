import type { Route } from './+types/$id.edit';
import { data, useFetcher } from 'react-router';
import { motion } from 'motion/react';
import { Edit3, X } from 'lucide-react';
import { useEffect } from 'react';
import {
  CourseCreationForm,
  type CourseFormData,
} from '~/components/CourseCreationForm';
import { createAuthor } from '~/db/authors';
import { createSchool } from '~/db/schools';
import { getCourseByCode, getCourseById, updateCourse } from '~/db/courses';
import { getUserFromRequest } from '~/utils/session.server';
import { generateContentKey, uploadToR2 } from '~/utils/r2.server';
import { v4 as uuidv4 } from 'uuid';

export const loader = async ({ request, params }: Route.LoaderArgs) => {
  const user = await getUserFromRequest(request);
  if (!user) {
    throw data({ error: 'Unauthorized' }, { status: 401 });
  }

  const courseId = params.id;
  if (!courseId) {
    throw data({ error: 'Course ID is required' }, { status: 400 });
  }

  const courseData = await getCourseById(courseId);
  if (!courseData) {
    throw data({ error: 'Course not found' }, { status: 404 });
  }

  if (courseData.course.createdBy !== user.id) {
    throw data(
      { error: 'Only the creator can edit this course' },
      { status: 403 },
    );
  }

  return { courseData };
};

export const action = async ({ request, params }: Route.ActionArgs) => {
  const user = await getUserFromRequest(request);
  if (!user) {
    return data({ error: 'Unauthorized' }, { status: 401 });
  }

  const courseId = params.id;
  if (!courseId) {
    return data({ error: 'Course ID is required' }, { status: 400 });
  }

  const existingCourseData = await getCourseById(courseId);
  if (!existingCourseData) {
    return data({ error: 'Course not found' }, { status: 404 });
  }

  if (existingCourseData.course.createdBy !== user.id) {
    return data(
      { error: 'Only the creator can edit this course' },
      { status: 403 },
    );
  }

  try {
    const formData = await request.formData();
    const courseDataStr = formData.get('courseData');
    if (!courseDataStr) {
      return data({ error: 'Missing course data' }, { status: 400 });
    }

    const courseData = JSON.parse(courseDataStr as string) as CourseFormData;
    const file = formData.get('file');
    const thumbnail = formData.get('thumbnail');
    const contentFile = file instanceof File && file.size > 0 ? file : null;
    const thumbnailFile =
      thumbnail instanceof File && thumbnail.size > 0 ? thumbnail : null;

    if (
      !courseData.title ||
      !courseData.code ||
      !courseData.description ||
      !courseData.schoolId ||
      !courseData.authorId
    ) {
      return data({ error: 'Missing required fields' }, { status: 400 });
    }

    const courseWithSameCode = await getCourseByCode(courseData.code);
    if (courseWithSameCode && courseWithSameCode.id !== courseId) {
      return data(
        { error: 'A course with this code already exists' },
        { status: 400 },
      );
    }

    let finalSchoolId = courseData.schoolId;
    if (courseData.isNewSchool) {
      const newSchool = await createSchool(courseData.schoolId, user.id);
      if (!newSchool) {
        return data({ error: 'Failed to create new school' }, { status: 500 });
      }
      finalSchoolId = newSchool.id;
    }

    let finalAuthorId = courseData.authorId;
    if (courseData.isNewAuthor) {
      const newAuthor = await createAuthor(courseData.authorId, user.id);
      if (!newAuthor) {
        return data({ error: 'Failed to create new author' }, { status: 500 });
      }
      finalAuthorId = newAuthor.id;
    }

    let thumbnailKey = existingCourseData.course.thumbnailKey;
    if (thumbnailFile) {
      const thumbnailId = uuidv4();
      const thumbKey = `thumbnails/${thumbnailId}-${thumbnailFile.name}`;
      const thumbBuffer = await thumbnailFile.arrayBuffer();
      const thumbResult = await uploadToR2(
        thumbKey,
        thumbBuffer,
        thumbnailFile.type,
      );
      if (thumbResult) {
        thumbnailKey = thumbResult.key;
      }
    }

    const updatedPayload: Parameters<typeof updateCourse>[1] = {
      title: courseData.title,
      code: courseData.code,
      description: courseData.description,
      schoolId: finalSchoolId,
      authorId: finalAuthorId,
      thumbnailKey,
      level: courseData.level || 'Beginner',
      category: courseData.category || 'General',
    };

    if (contentFile) {
      if (contentFile.type !== 'application/pdf') {
        return data(
          { error: 'Only PDF files are allowed for course content' },
          { status: 400 },
        );
      }

      const uploadId = uuidv4();
      const contentKey = generateContentKey(uploadId, contentFile.name);
      const fileBuffer = await contentFile.arrayBuffer();
      const uploadResult = await uploadToR2(
        contentKey,
        fileBuffer,
        contentFile.type,
      );

      if (!uploadResult) {
        return data(
          { error: 'Failed to upload updated course content' },
          { status: 500 },
        );
      }

      updatedPayload.contentKey = uploadResult.key;
      updatedPayload.contentType = contentFile.type;
      updatedPayload.contentSize = uploadResult.size;
    }

    const updatedCourse = await updateCourse(courseId, updatedPayload);
    if (!updatedCourse) {
      return data({ error: 'Failed to update course' }, { status: 500 });
    }

    return data({ courseId });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : 'Unknown update error';
    return data(
      { error: `Failed to update course: ${message}` },
      { status: 500 },
    );
  }
};

export default function EditCoursePage({ loaderData }: Route.ComponentProps) {
  const { courseData } = loaderData;
  const fetcher = useFetcher<typeof action>();

  const isSubmitting = fetcher.state !== 'idle';
  const submitError =
    fetcher.data && 'error' in fetcher.data ? fetcher.data.error : null;

  useEffect(() => {
    if (fetcher.data && 'courseId' in fetcher.data) {
      window.location.href = `/courses/${fetcher.data.courseId}`;
    }
  }, [fetcher.data]);

  const handleSubmit = async (
    formDataBase: CourseFormData,
    file?: File,
    thumbnail?: File,
  ) => {
    const form = new FormData();
    form.append('courseData', JSON.stringify(formDataBase));
    if (file) {
      form.append('file', file);
    }
    if (thumbnail) {
      form.append('thumbnail', thumbnail);
    }

    fetcher.submit(form, { method: 'POST', encType: 'multipart/form-data' });
  };

  const initialData: CourseFormData = {
    title: courseData.course.title,
    code: courseData.course.code,
    description: courseData.course.description,
    schoolId: courseData.school?.id || '',
    schoolName: courseData.school?.name || '',
    authorId: courseData.author?.id || '',
    authorName: courseData.author?.name || '',
    level: courseData.course.level,
    category: courseData.course.category,
  };

  return (
    <div className='mx-auto max-w-4xl px-4'>
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className='rounded-[48px] border border-black/5 bg-white p-10 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] md:p-16'
      >
        <div className='mb-12 flex flex-col gap-8 md:flex-row md:items-center'>
          <div className='flex h-20 w-20 items-center justify-center rounded-[28px] bg-[#5A5A40] shadow-xl shadow-[#5A5A40]/30'>
            <Edit3 className='text-white' size={36} />
          </div>
          <div>
            <h1 className='mb-2 font-serif text-5xl text-[#1a1a1a]'>
              Edit Course
            </h1>
            <p className='font-serif text-lg text-black/40 italic'>
              Update the course details, assets, and source material.
            </p>
          </div>
        </div>

        {submitError && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className='mb-8 rounded-2xl border border-red-200 bg-red-50 p-6 shadow-sm'
          >
            <p className='flex items-center gap-2 text-sm font-bold text-red-600'>
              <X size={18} />
              {submitError}
            </p>
          </motion.div>
        )}

        <CourseCreationForm
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
          submitError={submitError}
          initialData={initialData}
          mode='edit'
          existingContentLabel={
            courseData.course.contentKey
              ? courseData.course.contentKey.split('/').pop()
              : 'Existing course PDF'
          }
          existingThumbnailUrl={
            courseData.course.thumbnailKey
              ? `/api/course/serve/${courseData.course.thumbnailKey}`
              : null
          }
        />
      </motion.div>
    </div>
  );
}
