import type { Route } from './+types/courses';
import { Link } from 'react-router';
import { getUserFromRequest } from '~/utils/session.server';
import { getCoursesByUserId } from '~/db/courses';
import { motion } from 'motion/react';
import { PlusCircle, FileText, Clock } from 'lucide-react';

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
    <div>
      <div className='mb-6 flex items-center justify-between'>
        <div>
          <h1 className='font-serif text-3xl text-[#1a1a1a]'>My Courses</h1>
          <p className='mt-1 text-sm text-black/60'>
            Manage and view your courses.
          </p>
        </div>
        <Link
          to='/create'
          className='flex items-center gap-2 rounded-xl bg-[#5A5A40] px-4 py-2.5 font-medium text-white transition-colors hover:bg-[#4a4a35]'
        >
          <PlusCircle size={18} />
          Create Course
        </Link>
      </div>

      {courses.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className='rounded-[32px] border border-black/5 bg-white p-12 text-center shadow-xl'
        >
          <FileText className='mx-auto mb-4 h-16 w-16 text-black/20' />
          <h2 className='mb-2 font-serif text-2xl text-[#1a1a1a]'>
            No courses yet
          </h2>
          <p className='mb-6 text-black/60'>
            Create your first course to get started!
          </p>
          <Link
            to='/create'
            className='inline-flex items-center gap-2 rounded-xl bg-[#5A5A40] px-6 py-3 font-medium text-white transition-colors hover:bg-[#4a4a35]'
          >
            <PlusCircle size={18} />
            Create Course
          </Link>
        </motion.div>
      ) : (
        <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3'>
          {courses.map((course) => (
            <motion.div
              key={course.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className='rounded-xl border border-black/10 bg-white p-6 shadow-sm transition-shadow hover:shadow-md'
            >
              <div className='mb-3 flex items-start justify-between'>
                <div className='flex-1'>
                  <h3 className='text-lg font-semibold text-[#1a1a1a]'>
                    {course.title}
                  </h3>
                  <p className='text-sm text-black/50'>{course.code}</p>
                </div>
                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-medium ${getStatusColor(
                    course.status,
                  )}`}
                >
                  {course.status}
                </span>
              </div>
              <p className='mb-4 line-clamp-2 text-sm text-black/70'>
                {course.description}
              </p>
              <div className='flex items-center gap-2 text-xs text-black/50'>
                <Clock size={14} />
                <span>{new Date(course.createdAt).toLocaleDateString()}</span>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
