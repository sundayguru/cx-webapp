import type { Route } from './+types/courses';
import { Link } from 'react-router';
import { getUserFromRequest } from '~/utils/session.server';
import { getCoursesByUserId } from '~/db/courses';
import { motion } from 'motion/react';
import { PlusCircle, FileText, Clock, School, User } from 'lucide-react';

export const loader = async ({ request }: Route.LoaderArgs) => {
  const user = await getUserFromRequest(request);
  if (!user) {
    return { courses: [] };
  }

  const courses = await getCoursesByUserId(user.id);
  return { courses };
};

export default function CoursesPage({ loaderData }: Route.ComponentProps) {
  const { courses } = loaderData;

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
    <div className='max-w-7xl mx-auto'>
      <div className='mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4'>
        <div>
          <h1 className='font-serif text-4xl text-[#1a1a1a]'>My Courses</h1>
          <p className='mt-1 text-black/60'>
            Explore, manage, and track your academic contributions.
          </p>
        </div>
        <Link
          to='/create'
          className='flex items-center justify-center gap-2 rounded-2xl bg-[#5A5A40] px-6 py-3 font-semibold text-white transition-all hover:bg-[#4a4a35] hover:shadow-lg active:scale-95'
        >
          <PlusCircle size={20} />
          Create New Course
        </Link>
      </div>

      {courses.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className='rounded-[40px] border border-black/5 bg-white p-16 text-center shadow-xl'
        >
          <div className='mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-3xl bg-black/[0.02]'>
            <FileText className='h-12 w-12 text-black/20' />
          </div>
          <h2 className='mb-3 font-serif text-3xl text-[#1a1a1a]'>
            Your library is empty
          </h2>
          <p className='mx-auto max-w-md mb-8 text-black/60'>
            Start your journey by creating your first course. Share your knowledge with the world.
          </p>
          <Link
            to='/create'
            className='inline-flex items-center gap-2 rounded-2xl bg-[#5A5A40] px-8 py-4 font-bold text-white transition-all hover:bg-[#4a4a35] hover:shadow-xl active:scale-95'
          >
            <PlusCircle size={20} />
            Create Course
          </Link>
        </motion.div>
      ) : (
        <div className='grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'>
          {courses.map(({ course, school, author }) => (
            <motion.div
              key={course.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className='group flex flex-col overflow-hidden rounded-[32px] border border-black/10 bg-white shadow-sm transition-all hover:shadow-xl hover:-translate-y-1'
            >
              <Link to={`/courses/${course.id}`} className='relative aspect-video w-full overflow-hidden bg-black/5'>
                {course.thumbnailKey ? (
                  <img
                    src={`/api/course/serve/${course.thumbnailKey}`}
                    alt={course.title}
                    className='h-full w-full object-cover transition-transform duration-500 group-hover:scale-110'
                  />
                ) : (
                  <div className='flex h-full w-full items-center justify-center bg-gradient-to-br from-[#5A5A40]/10 to-[#5A5A40]/20'>
                    <FileText className='h-12 w-12 text-[#5A5A40]/30' />
                  </div>
                )}
                <div className='absolute left-4 top-4'>
                  <span
                    className={`rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-wider backdrop-blur-md ${getStatusColor(
                      course.status,
                    )}`}
                  >
                    {course.status}
                  </span>
                </div>
              </Link>

              <div className='flex flex-1 flex-col p-6'>
                <div className='mb-2 flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-[#5A5A40]'>
                  <span>{course.code}</span>
                  {school && (
                    <>
                      <span className='h-1 w-1 rounded-full bg-black/20'></span>
                      <span>{school.name}</span>
                    </>
                  )}
                </div>
                
                <Link to={`/courses/${course.id}`} className='mb-3'>
                  <h3 className='font-serif text-xl font-medium text-[#1a1a1a] transition-colors hover:text-[#5A5A40] line-clamp-1'>
                    {course.title}
                  </h3>
                </Link>

                <p className='mb-6 line-clamp-2 text-sm leading-relaxed text-black/60'>
                  {course.description}
                </p>

                <div className='mt-auto flex items-center justify-between border-t border-black/5 pt-4'>
                  {author && (
                    <div className='flex items-center gap-2'>
                      <div className='flex h-6 w-6 items-center justify-center rounded-full bg-black/5'>
                        <User size={12} className='text-black/40' />
                      </div>
                      <span className='text-xs font-medium text-black/60'>{author.name}</span>
                    </div>
                  )}
                  <div className='flex items-center gap-1 text-[10px] font-medium text-black/30'>
                    <Clock size={12} />
                    <span>{new Date(course.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
