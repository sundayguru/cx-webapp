import { Link, useLoaderData } from 'react-router';
import { BookmarkedUnitCard } from '~/components/BookmarkedUnitCard';
import { getBookmarkedUnitsByUser, type BookmarkedUnit } from '~/db/bookmarks';
import { getUserFromRequest } from '~/utils/session.server';
import {
  getUserStats,
  getUserEnrollments,
  type UserStats,
  type UserEnrollmentWithCourse,
} from '~/db/enrollments';
import { getCourses } from '~/db/courses';
import { motion } from 'motion/react';
import {
  BookOpen,
  Clock,
  GraduationCap,
  Target,
  ArrowRight,
  FolderOpen,
} from 'lucide-react';
import type { SelectCourse } from '~/db/schemas';

type LoaderData = {
  user: Awaited<ReturnType<typeof getUserFromRequest>>;
  stats: UserStats;
  enrolledCourses: UserEnrollmentWithCourse[];
  createdCourses: {
    course: SelectCourse;
  }[];
  bookmarkedUnits: BookmarkedUnit[];
};

export const loader = async ({ request }: { request: Request }) => {
  const user = await getUserFromRequest(request);
  if (!user) {
    return {
      user: null,
      stats: {
        coursesEnrolled: 0,
        quizzesTaken: 0,
        totalTimeSpent: 0,
        averageScore: 0,
      },
      enrolledCourses: [],
      createdCourses: [],
      bookmarkedUnits: [],
    };
  }

  const [stats, enrolledCourses, createdCourses, bookmarkedUnits] =
    await Promise.all([
      getUserStats(user.id),
      getUserEnrollments(user.id),
      getCourses({ createdBy: user.id }),
      getBookmarkedUnitsByUser(user.id),
    ]);

  return {
    user,
    stats,
    enrolledCourses,
    createdCourses,
    bookmarkedUnits,
  };
};

export default function DashboardPage() {
  const { user, stats, enrolledCourses, createdCourses, bookmarkedUnits } =
    useLoaderData<LoaderData>();

  const formatTime = (seconds: number) => {
    if (seconds < 60) {
      return `${seconds}s`;
    }
    if (seconds < 3600) {
      return `${Math.floor(seconds / 60)}m`;
    }
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${mins}m`;
  };

  if (!user) {
    return (
      <div className='flex min-h-[50vh] items-center justify-center'>
        <div className='text-center'>
          <h2 className='mb-4 text-2xl font-bold text-[#1a1a1a]'>
            Welcome to CourseXQuiz
          </h2>
          <p className='mb-6 text-black/60'>
            Sign in to access your personalized learning dashboard
          </p>
          <Link
            to='/login'
            className='inline-flex items-center gap-2 rounded-xl bg-[#5A5A40] px-6 py-3 font-bold text-white transition-all hover:bg-[#4a4a35]'
          >
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className='space-y-8 p-6'>
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className='mb-2 font-serif text-4xl text-[#1a1a1a]'>
          Welcome back, {user.name?.split(' ')[0] || 'Learner'}!
        </h1>
        <p className='text-lg text-black/55'>Continue your learning journey</p>
      </motion.div>

      <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4'>
        <StatCard
          icon={<GraduationCap size={22} />}
          label='Enrolled Courses'
          value={stats.coursesEnrolled.toString()}
          color='#5A5A40'
        />
        <StatCard
          icon={<BookOpen size={22} />}
          label='Quizzes Taken'
          value={stats.quizzesTaken.toString()}
          color='#2563eb'
        />
        <StatCard
          icon={<Clock size={22} />}
          label='Time Spent'
          value={formatTime(stats.totalTimeSpent)}
          color='#059669'
        />
        <StatCard
          icon={<Target size={22} />}
          label='Average Score'
          value={`${stats.averageScore}%`}
          color={stats.averageScore >= 70 ? '#059669' : '#dc2626'}
          highlight={stats.averageScore >= 70}
        />
      </div>

      {createdCourses.length > 0 && (
        <section>
          <div className='mb-4 flex items-center justify-between'>
            <h2 className='flex items-center gap-2 font-serif text-2xl text-[#1a1a1a]'>
              <FolderOpen size={24} className='text-[#5A5A40]' />
              My Contributions
            </h2>
            <Link
              to='/create'
              className='flex items-center gap-1 text-sm font-medium text-[#5A5A40] transition-colors hover:text-[#4a4a35]'
            >
              Create New <ArrowRight size={16} />
            </Link>
          </div>
          <div className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3'>
            {createdCourses.slice(0, 6).map((courseItem) => (
              <Link
                key={courseItem.course.id}
                to={`/courses/${courseItem.course.id}`}
                className='group relative overflow-hidden rounded-2xl border border-black/5 bg-white p-5 shadow-sm transition-all hover:shadow-md'
              >
                {courseItem.course.thumbnailKey && (
                  <div className='absolute inset-0 opacity-5'>
                    <img
                      src={`/api/course/serve/${courseItem.course.thumbnailKey}`}
                      alt=''
                      className='h-full w-full object-cover'
                    />
                  </div>
                )}
                <div className='relative'>
                  <p className='mb-1 text-[10px] font-bold tracking-[0.18em] text-[#5A5A40] uppercase'>
                    {courseItem.course.code} • {courseItem.course.category}
                  </p>
                  <h3 className='mb-2 line-clamp-2 font-medium text-[#1a1a1a]'>
                    {courseItem.course.title}
                  </h3>
                  <div className='flex items-center gap-2 text-xs text-black/40'>
                    <span
                      className={`rounded-full px-2 py-1 ${
                        courseItem.course.status === 'published'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-yellow-100 text-yellow-700'
                      }`}
                    >
                      {courseItem.course.status}
                    </span>
                    <span className='rounded-full bg-black/5 px-2 py-1'>
                      {courseItem.course.level}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {enrolledCourses.length > 0 && (
        <section>
          <div className='mb-4 flex items-center justify-between'>
            <h2 className='font-serif text-2xl text-[#1a1a1a]'>My Courses</h2>
            <Link
              to='/courses'
              className='flex items-center gap-1 text-sm font-medium text-[#5A5A40] transition-colors hover:text-[#4a4a35]'
            >
              Browse More <ArrowRight size={16} />
            </Link>
          </div>
          <div className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3'>
            {enrolledCourses.slice(0, 6).map((enrollment) => (
              <Link
                key={enrollment.id}
                to={`/courses/${enrollment.course.id}`}
                className='group relative overflow-hidden rounded-2xl border border-black/5 bg-white p-5 shadow-sm transition-all hover:shadow-md'
              >
                {enrollment.course.thumbnailKey && (
                  <div className='absolute inset-0 opacity-5'>
                    <img
                      src={`/api/course/serve/${enrollment.course.thumbnailKey}`}
                      alt=''
                      className='h-full w-full object-cover'
                    />
                  </div>
                )}
                <div className='relative'>
                  <p className='mb-1 text-[10px] font-bold tracking-[0.18em] text-[#5A5A40] uppercase'>
                    {enrollment.course.code} • {enrollment.course.category}
                  </p>
                  <h3 className='mb-2 line-clamp-2 font-medium text-[#1a1a1a]'>
                    {enrollment.course.title}
                  </h3>
                  <div className='flex items-center gap-2 text-xs text-black/40'>
                    <span className='rounded-full bg-black/5 px-2 py-1'>
                      {enrollment.course.level}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {bookmarkedUnits.length > 0 && (
        <section>
          <div className='mb-4 flex items-center justify-between'>
            <h2 className='font-serif text-2xl text-[#1a1a1a]'>
              Bookmarked Units
            </h2>
            <Link
              to='/courses'
              className='flex items-center gap-1 text-sm font-medium text-[#5A5A40] transition-colors hover:text-[#4a4a35]'
            >
              Explore Courses <ArrowRight size={16} />
            </Link>
          </div>
          <div className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3'>
            {bookmarkedUnits.slice(0, 6).map((bookmarkedUnit) => (
              <BookmarkedUnitCard
                key={bookmarkedUnit.bookmark.id}
                bookmarkedUnit={bookmarkedUnit}
                formatDate={formatTimeLabel}
              />
            ))}
          </div>
        </section>
      )}

      {enrolledCourses.length === 0 &&
        createdCourses.length === 0 &&
        bookmarkedUnits.length === 0 && (
        <div className='rounded-2xl border border-black/5 bg-[#f7f6ef] p-8 text-center'>
          <GraduationCap size={48} className='mx-auto mb-4 text-black/20' />
          <h3 className='mb-2 text-xl font-bold text-[#1a1a1a]'>
            Start Your Learning Journey
          </h3>
          <p className='mb-6 text-black/55'>
            Browse our courses and enroll to begin learning
          </p>
          <Link
            to='/courses'
            className='inline-flex items-center gap-2 rounded-xl bg-[#5A5A40] px-6 py-3 font-bold text-white transition-all hover:bg-[#4a4a35]'
          >
            Browse Courses
          </Link>
        </div>
      )}
    </div>
  );
}

const formatTimeLabel = (dateStr: string) =>
  new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

type StatCardProps = {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: string;
  highlight?: boolean;
};

const StatCard = ({ icon, label, value, color, highlight }: StatCardProps) => (
  <motion.div
    initial={{ opacity: 0, y: 18 }}
    animate={{ opacity: 1, y: 0 }}
    className={`rounded-2xl border p-5 ${
      highlight ? 'border-green-200 bg-green-50' : 'border-black/5 bg-white'
    }`}
  >
    <div
      className='mb-3 flex h-11 w-11 items-center justify-center rounded-2xl'
      style={{ backgroundColor: `${color}15`, color }}
    >
      {icon}
    </div>
    <p className='text-[10px] font-bold tracking-[0.18em] text-black/35 uppercase'>
      {label}
    </p>
    <p
      className={`mt-1 text-2xl font-bold ${highlight ? 'text-green-600' : 'text-[#1a1a1a]'}`}
    >
      {value}
    </p>
  </motion.div>
);
