import type { Route } from './+types/create';
import { data } from 'react-router';
import { getUserFromRequest } from '~/utils/session.server';
import { createCourse, getCourseByCode } from '~/db/courses';
import { uploadToR2, generateContentKey } from '~/utils/r2.server';
import {
  CourseCreationForm,
  type CourseFormData,
} from '~/components/CourseCreationForm';
import { motion } from 'motion/react';
import { PlusCircle } from 'lucide-react';
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
    console.log('Action: formData received');

    const courseDataStr = formData.get('courseData');
    if (!courseDataStr) {
      console.error('Action: courseData missing from formData');
      return data({ error: 'Missing course data' }, { status: 400 });
    }

    const courseData = JSON.parse(courseDataStr as string) as CourseFormData;
    const file = formData.get('file') as File | null;

    console.log('Action: courseData parsed:', courseData.code);

    if (!courseData.title || !courseData.code || !courseData.description) {
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

    // Upload file to R2
    const uploadId = uuidv4();
    const contentKey = generateContentKey(uploadId, file.name);
    console.log('Action: Uploading to R2...', contentKey);

    const fileBuffer = await file.arrayBuffer();
    const uploadResult = await uploadToR2(contentKey, fileBuffer, file.type);

    if (!uploadResult) {
      console.error('R2 upload failed for course creation');
      return data({ error: 'Failed to upload course content' }, { status: 500 });
    }

    console.log('Action: Upload successful, saving to DB');

    const course = await createCourse({
      title: courseData.title,
      code: courseData.code,
      description: courseData.description,
      status: 'pending',
      createdBy: user.id,
      contentKey: uploadResult.key,
      contentType: file.type,
      contentSize: uploadResult.size,
    });

    if (!course) {
      console.error('Action: Database creation failed');
      return data({ error: 'Failed to create course in database' }, { status: 500 });
    }

    console.log('Action: Course created successfully:', course.id);
    return data({ courseId: course.id });
  } catch (dbError: unknown) {
    console.error('Fatal error in course creation action:', dbError);
    const message =
      dbError instanceof Error ? dbError.message : 'Unknown database error';
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

  const handleSubmit = async (formData: CourseFormData, file: File) => {
    setSubmitError(null);

    const form = new FormData();
    form.append('courseData', JSON.stringify(formData));
    form.append('file', file);

    fetcher.submit(form, { method: 'POST', encType: 'multipart/form-data' });
  };

  return (
    <div className='mx-auto max-w-3xl'>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className='rounded-[32px] border border-black/5 bg-white p-8 shadow-xl'
      >
        <div className='mb-8 flex items-center gap-3'>
          <div className='flex h-12 w-12 items-center justify-center rounded-2xl bg-[#5A5A40]'>
            <PlusCircle className='text-white' size={24} />
          </div>
          <div>
            <h1 className='font-serif text-3xl text-[#1a1a1a]'>
              Create New Course
            </h1>
            <p className='text-sm text-black/60'>
              Fill in the details and upload your course content.
            </p>
          </div>
        </div>

        {submitError && (
          <div className='mb-4 rounded-xl border border-red-200 bg-red-50 p-4'>
            <p className='text-sm text-red-600'>{submitError}</p>
          </div>
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
