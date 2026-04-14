import type { Route } from './+types/create';
import { data, redirect } from 'react-router';
import { getUserFromRequest } from '~/utils/session.server';
import { createCourse } from '~/db/courses';
import {
  CourseCreationForm,
  type CourseFormData,
} from '~/components/CourseCreationForm';
import { motion } from 'motion/react';
import { PlusCircle } from 'lucide-react';
import { useState } from 'react';
import type { ErrorResponse } from '~/types/api';

export const action = async ({ request }: Route.ActionArgs) => {
  const user = await getUserFromRequest(request);
  if (!user) {
    return data({ error: 'Unauthorized' }, { status: 401 });
  }

  const formData = await request.formData();
  const courseData = JSON.parse(
    formData.get('courseData') as string,
  ) as CourseFormData;

  if (!courseData.title || !courseData.code || !courseData.description) {
    return data({ error: 'Missing required fields' }, { status: 400 });
  }

  if (!courseData.contentKey) {
    return data({ error: 'Course content is required' }, { status: 400 });
  }

  const course = await createCourse({
    title: courseData.title,
    code: courseData.code,
    description: courseData.description,
    status: 'pending',
    createdBy: user.id,
    contentKey: courseData.contentKey,
    contentType: courseData.contentType,
    contentSize: courseData.fileSize,
  });

  if (!course) {
    return data({ error: 'Failed to create course' }, { status: 500 });
  }

  return redirect('/courses');
};

export default function CreateCoursePage({ actionData }: Route.ComponentProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const handleSubmit = async (formData: CourseFormData) => {
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const form = new FormData();
      form.append('courseData', JSON.stringify(formData));

      const response = await fetch('/create', {
        method: 'POST',
        body: form,
      });

      if (!response.ok) {
        const errorData = (await response.json()) as ErrorResponse;
        throw new Error(errorData.error || 'Failed to create course');
      }

      window.location.href = '/courses';
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to create course';
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
              Fill in the details to create your course.
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
