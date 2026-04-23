import type { Route } from './+types/create';
import { data, useFetcher } from 'react-router';
import { getUserFromRequest } from '~/utils/session.server';
import { createCourse, getCourseByCode, setCourseAuthors } from '~/db/courses';
import { createSchool } from '~/db/schools';
import { createAuthor } from '~/db/authors';
import { uploadToR2, generateContentKey } from '~/utils/r2.server';
import {
  CourseCreationForm,
  type CourseFormAuthor,
  type CourseFormData,
} from '~/components/CourseCreationForm';
import { motion } from 'motion/react';
import { PlusCircle, X } from 'lucide-react';
import { useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';

export const action = async ({ request }: Route.ActionArgs) => {
  const user = await getUserFromRequest(request);
  if (!user) {
    return data({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const courseDataStr = formData.get('courseData');
    if (!courseDataStr) {
      return data({ error: 'Missing course data' }, { status: 400 });
    }

    const courseData = JSON.parse(courseDataStr as string) as CourseFormData;
    const file = formData.get('file') as File | null;
    const thumbnail = formData.get('thumbnail') as File | null;

    if (
      !courseData.title ||
      !courseData.code ||
      !courseData.description ||
      !courseData.schoolId ||
      courseData.authors.length === 0
    ) {
      return data({ error: 'Missing required fields' }, { status: 400 });
    }

    if (!file || file.type !== 'application/pdf') {
      return data({ error: 'A valid PDF file is required' }, { status: 400 });
    }

    // Check if course code already exists
    const existingCourse = await getCourseByCode(courseData.code);
    if (existingCourse) {
      return data(
        { error: 'A course with this code already exists' },
        { status: 400 },
      );
    }

    // Handle school creation if needed
    let finalSchoolId = courseData.schoolId;
    if (courseData.isNewSchool) {
      const newSchool = await createSchool(courseData.schoolId, user.id);
      if (!newSchool) {
        return data({ error: 'Failed to create new school' }, { status: 500 });
      }
      finalSchoolId = newSchool.id;
    }

    const resolvedAuthors: CourseFormAuthor[] = [];
    for (const author of courseData.authors) {
      if (author.isNew) {
        const newAuthor = await createAuthor(author.name, user.id);
        if (!newAuthor) {
          return data(
            { error: 'Failed to create new author' },
            { status: 500 },
          );
        }
        resolvedAuthors.push({
          id: newAuthor.id,
          name: newAuthor.name,
        });
      } else {
        resolvedAuthors.push(author);
      }
    }

    const finalAuthorIds = resolvedAuthors.map((author) => author.id);
    const primaryAuthorId = finalAuthorIds[0];

    // Upload content to R2
    const uploadId = uuidv4();
    const contentKey = generateContentKey(uploadId, file.name);
    const fileBuffer = await file.arrayBuffer();
    const uploadResult = await uploadToR2(contentKey, fileBuffer, file.type);

    if (!uploadResult) {
      return data(
        { error: 'Failed to upload course content' },
        { status: 500 },
      );
    }

    // Upload thumbnail if provided
    let finalThumbnailKey = null;
    if (thumbnail && thumbnail.size > 0) {
      const thumbKey = `thumbnails/${uploadId}-${thumbnail.name}`;
      const thumbBuffer = await thumbnail.arrayBuffer();
      const thumbResult = await uploadToR2(
        thumbKey,
        thumbBuffer,
        thumbnail.type,
      );
      if (thumbResult) {
        finalThumbnailKey = thumbResult.key;
      }
    }

    const course = await createCourse({
      title: courseData.title,
      code: courseData.code,
      description: courseData.description,
      schoolId: finalSchoolId,
      authorId: primaryAuthorId,
      thumbnailKey: finalThumbnailKey,
      level: courseData.level || 'Beginner',
      category: courseData.category || 'General',
      status: 'pending',
      createdBy: user.id,
      contentKey: uploadResult.key,
      contentType: file.type,
      contentSize: uploadResult.size,
    });

    if (!course) {
      return data(
        { error: 'Failed to create course in database' },
        { status: 500 },
      );
    }

    const authorsAssigned = await setCourseAuthors(course.id, finalAuthorIds);
    if (!authorsAssigned) {
      return data(
        { error: 'Failed to assign course authors' },
        { status: 500 },
      );
    }

    return data({ courseId: course.id });
  } catch (dbError: unknown) {
    console.error('Fatal error in course creation action:', dbError);
    const message =
      dbError instanceof Error ? dbError.message : 'Unknown database error';
    return data(
      { error: `Failed to save course: ${message}` },
      { status: 500 },
    );
  }
};

export default function CreateCoursePage() {
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
    if (!file) {
      return;
    }

    const form = new FormData();
    form.append('courseData', JSON.stringify(formDataBase));
    form.append('file', file);
    if (thumbnail) {
      form.append('thumbnail', thumbnail);
    }

    fetcher.submit(form, { method: 'POST', encType: 'multipart/form-data' });
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
            <PlusCircle className='text-white' size={36} />
          </div>
          <div>
            <h1 className='mb-2 font-serif text-5xl text-[#1a1a1a]'>
              Submit New Course
            </h1>
            <p className='font-serif text-lg text-black/40 italic'>
              Contribute to the collective academic knowledge base.
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
        />
      </motion.div>
    </div>
  );
}
