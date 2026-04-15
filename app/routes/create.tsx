import type { Route } from './+types/create';
import { data } from 'react-router';
import { getUserFromRequest } from '~/utils/session.server';
import { createCourse, getCourseByCode } from '~/db/courses';
import { createSchool } from '~/db/schools';
import { createAuthor } from '~/db/authors';
import { uploadToR2, generateContentKey } from '~/utils/r2.server';
import {
  CourseCreationForm,
  type CourseFormData,
} from '~/components/CourseCreationForm';
import { motion } from 'motion/react';
import { PlusCircle, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useFetcher } from 'react-router';
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
      !courseData.authorId
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

    // Handle author creation if needed
    let finalAuthorId = courseData.authorId;
    if (courseData.isNewAuthor) {
      const newAuthor = await createAuthor(courseData.authorId, user.id);
      if (!newAuthor) {
        return data({ error: 'Failed to create new author' }, { status: 500 });
      }
      finalAuthorId = newAuthor.id;
    }

    // Upload content to R2
    const uploadId = uuidv4();
    const contentKey = generateContentKey(uploadId, file.name);
    const fileBuffer = await file.arrayBuffer();
    const uploadResult = await uploadToR2(contentKey, fileBuffer, file.type);

    if (!uploadResult) {
      return data({ error: 'Failed to upload course content' }, { status: 500 });
    }

    // Upload thumbnail if provided
    let finalThumbnailKey = null;
    if (thumbnail && thumbnail.size > 0) {
      const thumbKey = `thumbnails/${uploadId}-${thumbnail.name}`;
      const thumbBuffer = await thumbnail.arrayBuffer();
      const thumbResult = await uploadToR2(thumbKey, thumbBuffer, thumbnail.type);
      if (thumbResult) {
        finalThumbnailKey = thumbResult.key;
      }
    }

    const course = await createCourse({
      title: courseData.title,
      code: courseData.code,
      description: courseData.description,
      schoolId: finalSchoolId,
      authorId: finalAuthorId,
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
      return data({ error: 'Failed to create course in database' }, { status: 500 });
    }

    return data({ courseId: course.id });
  } catch (dbError: unknown) {
    console.error('Fatal error in course creation action:', dbError);
    const message = dbError instanceof Error ? dbError.message : 'Unknown database error';
    return data({ error: `Failed to save course: ${message}` }, { status: 500 });
  }
};

export default function CreateCoursePage() {
  const fetcher = useFetcher<typeof action>();
  const [submitError, setSubmitError] = useState<string | null>(null);

  const isSubmitting = fetcher.state !== 'idle';

  useEffect(() => {
    if (fetcher.data && 'courseId' in fetcher.data) {
      window.location.href = `/courses/${fetcher.data.courseId}`;
    } else if (fetcher.data && 'error' in fetcher.data) {
      setSubmitError(fetcher.data.error);
    }
  }, [fetcher.data]);

  const handleSubmit = async (
    formDataBase: CourseFormData, 
    file: File, 
    thumbnail?: File
  ) => {
    setSubmitError(null);

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
        className='rounded-[48px] border border-black/5 bg-white p-10 md:p-16 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)]'
      >
        <div className='mb-12 flex flex-col md:flex-row md:items-center gap-8'>
          <div className='flex h-20 w-20 items-center justify-center rounded-[28px] bg-[#5A5A40] shadow-xl shadow-[#5A5A40]/30'>
            <PlusCircle className='text-white' size={36} />
          </div>
          <div>
            <h1 className='font-serif text-5xl text-[#1a1a1a] mb-2'>
              Submit New Course
            </h1>
            <p className='text-lg text-black/40 italic font-serif'>
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
            <p className='text-sm font-bold text-red-600 flex items-center gap-2'>
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
