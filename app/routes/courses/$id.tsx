import type { Route } from './+types/$id';
import { Link, type LoaderFunctionArgs } from 'react-router';
import { getUserFromRequest } from '~/utils/session.server';
import { getCourseById } from '~/db/courses';
import { motion } from 'motion/react';
import { ArrowLeft, FileText, Clock, School, UserCircle } from 'lucide-react';

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  const user = await getUserFromRequest(request);
  if (!user) {
    return { data: null };
  }

  const courseId = (params as Record<string, string>).id;
  const data = await getCourseById(courseId);

  if (!data || data.course.createdBy !== user.id) {
    return { data: null };
  }

  return { data };
};

export default function CourseDetailsPage({
  loaderData,
}: Route.ComponentProps) {
  const { data } = loaderData;

  if (!data) {
    return (
      <div className='mx-auto max-w-4xl px-4 py-12'>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className='rounded-[40px] border border-black/5 bg-white p-12 text-center shadow-2xl'
        >
          <div className='mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-red-50 text-red-500'>
            <FileText size={40} />
          </div>
          <h1 className='mb-3 font-serif text-3xl text-[#1a1a1a]'>
            Course not found
          </h1>
          <p className='mb-8 text-black/60'>
            This course doesn&apos;t exist or you don&apos;t have access to view it.
          </p>
          <Link
            to='/courses'
            className='inline-flex items-center gap-2 rounded-2xl bg-[#5A5A40] px-8 py-3.5 font-bold text-white transition-all hover:bg-[#4a4a35] active:scale-95'
          >
            <ArrowLeft size={18} />
            Back to Courses
          </Link>
        </motion.div>
      </div>
    );
  }

  const { course, school, author } = data;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'approved':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'rejected':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className='mx-auto max-w-5xl px-4 py-8'>
      <div className='mb-8'>
        <Link
          to='/courses'
          className='group inline-flex items-center gap-2 text-sm font-semibold text-black/40 transition-colors hover:text-[#5A5A40]'
        >
          <ArrowLeft size={16} className='transition-transform group-hover:-translate-x-1' />
          Back to Courses
        </Link>
      </div>

      <div className='grid grid-cols-1 gap-8 lg:grid-cols-3'>
        {/* Main Content Area */}
        <div className='lg:col-span-2 space-y-8'>
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className='overflow-hidden rounded-[40px] border border-black/5 bg-white shadow-xl'
          >
            {/* Thumbnail Header */}
            {course.thumbnailKey && (
              <div className='aspect-video w-full overflow-hidden border-b border-black/5'>
                <img
                  src={`/api/course/serve/${course.thumbnailKey}`}
                  alt={course.title}
                  className='h-full w-full object-cover'
                />
              </div>
            )}

            <div className='p-8 md:p-10'>
              <div className='mb-6 flex flex-wrap items-start justify-between gap-4'>
                <div>
                  <div className='mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#5A5A40]'>
                    <span>{course.code}</span>
                    <span className='h-1 w-1 rounded-full bg-black/20'></span>
                    <span>{new Date(course.createdAt).toLocaleDateString()}</span>
                  </div>
                  <h1 className='font-serif text-4xl leading-tight text-[#1a1a1a]'>
                    {course.title}
                  </h1>
                </div>
                <span
                  className={`rounded-full border px-4 py-1.5 text-xs font-bold uppercase tracking-wider ${getStatusColor(
                    course.status,
                  )}`}
                >
                  {course.status}
                </span>
              </div>

              <div className='mb-10'>
                <h3 className='mb-4 text-sm font-bold uppercase tracking-wider text-black/30'>
                  About this course
                </h3>
                <p className='text-lg leading-relaxed text-black/70'>
                  {course.description}
                </p>
              </div>

              {course.contentKey && (
                <div className='space-y-6'>
                  <div className='flex items-center justify-between'>
                    <h3 className='text-sm font-bold uppercase tracking-wider text-black/30'>
                      Study Material
                    </h3>
                  </div>
                  
                  <div className='rounded-2xl border border-[#5A5A40]/20 bg-[#5A5A40]/5 p-6'>
                    <div className='flex items-center justify-between gap-4'>
                      <div className='flex items-center gap-4'>
                        <div className='flex h-12 w-12 items-center justify-center rounded-xl bg-[#5A5A40] text-white'>
                          <FileText size={24} />
                        </div>
                        <div>
                          <p className='truncate font-bold text-[#1a1a1a]'>
                            Course Content (PDF)
                          </p>
                          <p className='text-xs text-black/50'>
                            {course.contentSize
                              ? `${(course.contentSize / 1024 / 1024).toFixed(2)} MB`
                              : 'Unknown size'}
                          </p>
                        </div>
                      </div>
                      <a
                        href={`/api/course/serve/${course.contentKey}`}
                        target='_blank'
                        rel='noreferrer'
                        className='rounded-xl bg-white px-4 py-2 text-sm font-bold text-[#5A5A40] shadow-sm transition-all hover:shadow-md active:scale-95'
                      >
                        Open PDF
                      </a>
                    </div>
                  </div>

                  <div className='aspect-[3/4] w-full overflow-hidden rounded-[32px] border border-black/5 bg-gray-50 shadow-inner'>
                    <iframe
                      src={`/api/course/serve/${encodeURIComponent(course.contentKey)}`}
                      className='h-full w-full'
                      title='Course Content'
                    />
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </div>

        {/* Sidebar */}
        <div className='space-y-6'>
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className='space-y-6'
          >
            {/* School Info */}
            {school && (
              <div className='rounded-3xl border border-black/5 bg-white p-6 shadow-md'>
                <div className='mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#5A5A40]/10 text-[#5A5A40]'>
                  <School size={24} />
                </div>
                <h3 className='mb-1 text-sm font-bold uppercase tracking-wider text-black/30'>
                  Institution
                </h3>
                <p className='text-xl font-medium text-[#1a1a1a]'>{school.name}</p>
              </div>
            )}

            {/* Author Info */}
            {author && (
              <div className='rounded-3xl border border-black/5 bg-white p-6 shadow-md'>
                <div className='mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#5A5A40]/10 text-[#5A5A40]'>
                  <UserCircle size={24} />
                </div>
                <h3 className='mb-1 text-sm font-bold uppercase tracking-wider text-black/30'>
                  Course Author
                </h3>
                <p className='text-xl font-medium text-[#1a1a1a]'>{author.name}</p>
              </div>
            )}

            {/* Stats / Quick Info */}
            <div className='rounded-3xl border border-black/5 bg-[#1a1a1a] p-8 text-white shadow-xl'>
              <div className='flex items-center gap-3 mb-6'>
                <Clock size={20} className='text-white/40' />
                <span className='text-sm text-white/60'>Published {new Date(course.createdAt).toLocaleDateString()}</span>
              </div>
              <button className='w-full rounded-2xl bg-white py-4 font-bold text-[#1a1a1a] transition-all hover:bg-white/90 active:scale-95'>
                Edit Course
              </button>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
