import type { Route } from './+types/create';
import { data, redirect } from 'react-router';
import { getUserFromRequest } from '~/utils/session.server';
import { createCourse } from '~/db/courses';
import { uploadToR2, generateContentKey } from '~/utils/r2.server';
import {
  CourseCreationForm,
  type CourseFormData,
} from '~/components/CourseCreationForm';
import { motion } from 'motion/react';
import { PlusCircle } from 'lucide-react';
import { useState } from 'react';
import type { ErrorResponse } from '~/types/api';
import { v4 as uuidv4 } from 'uuid';

export const action = async ({ request }: Route.ActionArgs) => {
  const user = await getUserFromRequest(request);
  if (!user) {
    return data({ error: 'Unauthorized' }, { status: 401 });
  }

  const formData = await request.formData();
  const courseData = JSON.parse(
    formData.get('courseData') as string,
  ) as CourseFormData;
  const file = formData.get('file') as File | null;

  if (!courseData.title || !courseData.code || !courseData.description) {
    return data({ error: 'Missing required fields' }, { status: 400 });
  }

  if (!file || file.type !== 'application/pdf') {
    return data({ error: 'A valid PDF file is required' }, { status: 400 });
  }

  // Upload file to R2
  const uploadId = uuidv4();
  const contentKey = generateContentKey(uploadId, file.name);
  const fileBuffer = await file.arrayBuffer();
  const uploadResult = await uploadToR2(contentKey, fileBuffer, file.type);

  if (!uploadResult) {
    return data({ error: 'Failed to upload course content' }, { status: 500 });
  }

  // Create course in database
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
    return data({ error: 'Failed to create course' }, { status: 500 });
  }

  return redirect(`/courses/${course.id}`);
};

export default function CreateCoursePage({ actionData }: Route.ComponentProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const handleSubmit = async (formData: CourseFormData, file: File) => {
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const form = new FormData();
      form.append('courseData', JSON.stringify(formData));
      form.append('file', file);

      const response = await fetch('/create', {
        method: 'POST',
        body: form,
      });

      if (!response.ok) {
        const errorData = (await response.json()) as ErrorResponse;
        throw new Error(errorData.error || 'Failed to create course');
      }

      const location = response.headers.get('Location');
      if (location) {
        window.location.href = location;
      } else {
        window.location.href = '/courses';
      }
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Failed to create course';
      setSubmitError(message);
      setIsSubmitting(false);
    }
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

        {actionData?.error && (
          <div className='mb-4 rounded-xl border border-red-200 bg-red-50 p-4'>
            <p className='text-sm text-red-600'>{actionData.error}</p>
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
