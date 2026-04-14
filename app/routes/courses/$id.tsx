import type { Route } from './+types/$id';
import { Link, type LoaderFunctionArgs } from 'react-router';
import { getUserFromRequest } from '~/utils/session.server';
import { getCourseById } from '~/db/courses';
import { motion } from 'motion/react';
import { ArrowLeft, FileText, Clock } from 'lucide-react';

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  const user = await getUserFromRequest(request);
  if (!user) {
    return { course: null };
  }

  const courseId =(params as Record<string, string>).id;
  const course = await getCourseById(courseId);

  if (!course || course.createdBy !== user.id) {
    return { course: null };
  }

  return { course };
};

export default function CourseDetailsPage({
  loaderData,
}: Route.ComponentProps) {
  const { course } = loaderData;

  if (!course) {
    return (
      <div className='mx-auto max-w-3xl'>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className='rounded-[32px] border border-black/5 bg-white p-12 text-center shadow-xl'
        >
          <h1 className='mb-2 font-serif text-2xl text-[#1a1a1a]'>
            Course not found
          </h1>
          <p className='mb-6 text-black/60'>
            This course doesn&apos;t exist or you don&apos;t have access.
          </p>
          <Link
            to='/courses'
            className='inline-flex items-center gap-2 rounded-xl bg-[#5A5A40] px-6 py-3 font-medium text-white transition-colors hover:bg-[#4a4a35]'
          >
            <ArrowLeft size={18} />
            Back to Courses
          </Link>
        </motion.div>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className='mx-auto max-w-3xl'>
      <div className='mb-6'>
        <Link
          to='/courses'
          className='inline-flex items-center gap-2 text-sm text-black/60 transition-colors hover:text-[#1a1a1a]'
        >
          <ArrowLeft size={16} />
          Back to Courses
        </Link>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className='rounded-[32px] border border-black/5 bg-white p-8 shadow-xl'
      >
        <div className='mb-6 flex items-start justify-between'>
          <div>
            <h1 className='mb-2 font-serif text-3xl text-[#1a1a1a]'>
              {course.title}
            </h1>
            <p className='text-lg text-black/50'>{course.code}</p>
          </div>
          <span
            className={`rounded-full px-3 py-1.5 text-sm font-medium ${getStatusColor(
              course.status,
            )}`}
          >
            {course.status}
          </span>
        </div>

        <div className='mb-6 space-y-4 rounded-xl border border-black/10 p-6'>
          <div>
            <h3 className='mb-2 text-sm font-medium text-black/50'>
              Description
            </h3>
            <p className='text-black/70'>{course.description}</p>
          </div>
        </div>

        {course.contentKey && (
          <div className='mb-6 space-y-4'>
            <h3 className='text-sm font-medium text-black/50'>
              Course Content
            </h3>
            <div className='rounded-xl border border-[#5A5A40]/20 bg-[#5A5A40]/5 p-4'>
              <div className='flex items-center gap-3'>
                <FileText className='text-[#5A5A40]' size={24} />
                <div>
                  <p className='font-medium text-[#1a1a1a]'>
                    {course.contentKey.split('/').pop()}
                  </p>
                  <p className='text-xs text-black/60'>
                    {course.contentSize
                      ? `${(course.contentSize / 1024 / 1024).toFixed(2)} MB`
                      : 'Unknown size'}
                  </p>
                </div>
              </div>
            </div>

            <div className='aspect-[8.5/11] w-full overflow-hidden rounded-lg border border-black/5 bg-gray-50'>
              <iframe
                src={`/api/course/serve/${encodeURIComponent(course.contentKey)}`}
                className='h-full w-full'
                title='Course Content'
              />
            </div>
          </div>
        )}

        <div className='flex items-center gap-2 text-sm text-black/50'>
          <Clock size={16} />
          <span>Created {new Date(course.createdAt).toLocaleDateString()}</span>
        </div>
      </motion.div>
    </div>
  );
}
