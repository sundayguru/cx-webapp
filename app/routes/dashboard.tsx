import { Link, useLoaderData, useSubmit } from 'react-router';
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
  BarChart3,
  BookOpen,
  Clock,
  Flame,
  GraduationCap,
  Target,
  ArrowRight,
  FolderOpen,
} from 'lucide-react';
import type { SelectCourse } from '~/db/schemas';
import {
  getQuizStreakData,
  getUnitAccuracyHistory,
  type QuizStreakData,
  type UnitAccuracyPoint,
} from '~/db/quizzes';

type DashboardCourseOption = {
  id: string;
  label: string;
};

type LoaderData = {
  user: Awaited<ReturnType<typeof getUserFromRequest>>;
  stats: UserStats;
  enrolledCourses: UserEnrollmentWithCourse[];
  createdCourses: {
    course: SelectCourse;
  }[];
  bookmarkedUnits: BookmarkedUnit[];
  accuracyHistory: UnitAccuracyPoint[];
  quizStreak: QuizStreakData;
  courseOptions: DashboardCourseOption[];
  selectedCourseId: string;
};

export const loader = async ({ request }: { request: Request }) => {
  const user = await getUserFromRequest(request);
  const url = new URL(request.url);
  const selectedCourseId = url.searchParams.get('courseId') || '';
  if (!user) {
    return {
      user: null,
      stats: {
        coursesEnrolled: 0,
        quizzesTaken: 0,
        totalTimeSpent: 0,
        averageScore: 0,
        totalSessions: 0,
        completedSessions: 0,
        sessionCompletionRate: 0,
      },
      enrolledCourses: [],
      createdCourses: [],
      bookmarkedUnits: [],
      accuracyHistory: [],
      quizStreak: { currentStreak: 0, activeDays: 0, days: [] },
      courseOptions: [],
      selectedCourseId: '',
    };
  }

  const [
    stats,
    enrolledCourses,
    createdCourses,
    bookmarkedUnits,
    accuracyHistory,
    quizStreak,
  ] = await Promise.all([
    getUserStats(user.id),
    getUserEnrollments(user.id),
    getCourses({ createdBy: user.id }),
    getBookmarkedUnitsByUser(user.id),
    getUnitAccuracyHistory(user.id, selectedCourseId || undefined),
    getQuizStreakData(user.id),
  ]);

  const courseOptionsMap = new Map<string, DashboardCourseOption>();

  enrolledCourses.forEach((enrollment) => {
    courseOptionsMap.set(enrollment.course.id, {
      id: enrollment.course.id,
      label: `${enrollment.course.code} • ${enrollment.course.title}`,
    });
  });

  createdCourses.forEach((courseItem) => {
    courseOptionsMap.set(courseItem.course.id, {
      id: courseItem.course.id,
      label: `${courseItem.course.code} • ${courseItem.course.title}`,
    });
  });

  bookmarkedUnits.forEach((bookmarkedUnit) => {
    courseOptionsMap.set(bookmarkedUnit.course.id, {
      id: bookmarkedUnit.course.id,
      label: `${bookmarkedUnit.course.code} • ${bookmarkedUnit.course.title}`,
    });
  });

  const courseOptions = Array.from(courseOptionsMap.values()).sort((a, b) =>
    a.label.localeCompare(b.label),
  );

  return {
    user,
    stats,
    enrolledCourses,
    createdCourses,
    bookmarkedUnits,
    accuracyHistory,
    quizStreak,
    courseOptions,
    selectedCourseId,
  };
};

export default function DashboardPage() {
  const {
    user,
    stats,
    enrolledCourses,
    createdCourses,
    bookmarkedUnits,
    accuracyHistory,
    quizStreak,
    courseOptions,
    selectedCourseId,
  } = useLoaderData<LoaderData>();
  const submit = useSubmit();

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

  const handleCourseFilterChange = (
    event: React.ChangeEvent<HTMLSelectElement>,
  ) => {
    const params = new URLSearchParams(window.location.search);
    if (event.target.value) {
      params.set('courseId', event.target.value);
    } else {
      params.delete('courseId');
    }
    submit(params, { method: 'get' });
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
    <div className='mx-auto max-w-[1400px] space-y-4 px-0 py-8 sm:px-4'>
      <div className='px-4 sm:px-0'>
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className='mb-2 font-serif text-4xl text-[#1a1a1a]'>
            Welcome back, {user.name?.split(' ')[0] || 'Learner'}!
          </h1>
        </motion.div>
        <p className='mb-8 text-lg text-black/55'>
          Continue your learning journey
        </p>
      </div>

      <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7'>
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
        <StatCard
          icon={<BarChart3 size={22} />}
          label='Total Sessions'
          value={stats.totalSessions.toString()}
          color='#7c3aed'
        />
        <StatCard
          icon={<BookOpen size={22} />}
          label='Completed Sessions'
          value={stats.completedSessions.toString()}
          color='#0f766e'
        />
        <StatCard
          icon={<BarChart3 size={22} />}
          label='Session Completion'
          value={`${stats.sessionCompletionRate}%`}
          color={stats.sessionCompletionRate >= 70 ? '#059669' : '#dc2626'}
          highlight={stats.sessionCompletionRate >= 70}
        />
      </div>

      <div className='mt-4 space-y-12 sm:px-0'>
        <section>
          <QuizStreakPanel quizStreak={quizStreak} />
        </section>

        <section>
          <div className='rounded-2xl border border-black/5 bg-white p-6 shadow-sm'>
            <div className='mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between'>
              <div className='flex items-center gap-2'>
                <BarChart3 size={22} className='text-[#5A5A40]' />
                <h2 className='font-serif text-2xl text-[#1a1a1a]'>
                  Accuracy By Unit
                </h2>
              </div>
              <div className='w-full max-w-sm'>
                <label className='mb-2 block text-[10px] font-bold tracking-[0.2em] text-black/35 uppercase'>
                  Course Filter
                </label>
                <select
                  value={selectedCourseId}
                  onChange={handleCourseFilterChange}
                  className='w-full rounded-2xl border border-black/5 bg-[#f7f6ef] px-4 py-3 text-sm font-medium text-[#1a1a1a] transition-all outline-none focus:ring-2 focus:ring-[#5A5A40]'
                >
                  <option value=''>All Courses</option>
                  {courseOptions.map((courseOption) => (
                    <option key={courseOption.id} value={courseOption.id}>
                      {courseOption.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <AccuracyChart
              accuracyHistory={accuracyHistory}
              selectedCourseId={selectedCourseId}
            />
          </div>
        </section>

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
                  <div className='absolute inset-0 opacity-5'>
                    <img
                      src={
                        courseItem.course.thumbnailKey
                          ? `/api/course/serve/${courseItem.course.thumbnailKey}`
                          : `https://picsum.photos/seed/${courseItem.course.id}/700/500`
                      }
                      alt=''
                      className='h-full w-full object-cover'
                    />
                  </div>
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
                  <div className='absolute inset-0 opacity-5'>
                    <img
                      src={
                        enrollment.course.thumbnailKey
                          ? `/api/course/serve/${enrollment.course.thumbnailKey}`
                          : `https://picsum.photos/seed/${enrollment.course.id}/700/500`
                      }
                      alt=''
                      className='h-full w-full object-cover'
                    />
                  </div>
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
      </div>

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

type AccuracyChartProps = {
  accuracyHistory: UnitAccuracyPoint[];
  selectedCourseId: string;
};

type QuizStreakPanelProps = {
  quizStreak: QuizStreakData;
};

const QuizStreakPanel = ({ quizStreak }: QuizStreakPanelProps) => (
  <motion.div
    initial={{ opacity: 0, y: 18 }}
    animate={{ opacity: 1, y: 0 }}
    className='overflow-hidden rounded-[32px] border border-[#f0c36b]/30 bg-[radial-gradient(circle_at_top_left,_rgba(255,209,102,0.3),_transparent_35%),linear-gradient(135deg,_#fff8e8,_#fff1cc)] p-6 shadow-sm'
  >
    <div className='flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between'>
      <div>
        <div className='inline-flex items-center gap-2 rounded-full bg-white/70 px-3 py-1 text-[10px] font-bold tracking-[0.2em] text-[#b45309] uppercase'>
          <Flame size={14} />
          Daily Quiz Streak
        </div>
        <div className='mt-4 flex items-end gap-3'>
          <p className='font-serif text-5xl text-[#7c2d12]'>
            {quizStreak.currentStreak}
          </p>
          <p className='pb-2 text-sm font-medium text-[#9a3412]'>
            day{quizStreak.currentStreak === 1 ? '' : 's'} in a row
          </p>
        </div>
        <p className='mt-3 max-w-xl text-sm leading-6 text-[#7c2d12]/75'>
          Complete at least one quiz session each day to keep your fire alive.
        </p>
      </div>

      <div className='grid grid-cols-2 gap-3 sm:min-w-72'>
        <div className='rounded-2xl border border-white/60 bg-white/75 p-4'>
          <p className='text-[10px] font-bold tracking-[0.18em] text-[#b45309]/70 uppercase'>
            Active Days
          </p>
          <p className='mt-2 text-2xl font-bold text-[#7c2d12]'>
            {quizStreak.activeDays}/{quizStreak.days.length}
          </p>
        </div>
        <div className='rounded-2xl border border-white/60 bg-white/75 p-4'>
          <p className='text-[10px] font-bold tracking-[0.18em] text-[#b45309]/70 uppercase'>
            Today
          </p>
          <p className='mt-2 text-2xl font-bold text-[#7c2d12]'>
            {quizStreak.days.find((day) => day.isToday)?.sessionCount ?? 0}
          </p>
        </div>
      </div>
    </div>

    <div className='mt-8 rounded-[28px] border border-white/60 bg-white/65 p-4 sm:p-5'>
      <div className='mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between'>
        <h3 className='font-serif text-xl text-[#7c2d12]'>Past 14 Days</h3>
        <p className='text-xs font-medium text-[#9a3412]/75'>
          One flame per day with quiz activity
        </p>
      </div>

      {quizStreak.days.length > 0 ? (
        <div className='grid grid-cols-4 gap-3 sm:grid-cols-7 lg:grid-cols-14'>
          {quizStreak.days.map((day) => (
            <div
              key={day.date}
              className={`rounded-2xl border p-3 text-center transition-all ${
                day.hasSession
                  ? day.isInCurrentStreak
                    ? 'border-orange-300 bg-orange-50 shadow-sm'
                    : 'border-amber-200 bg-amber-50'
                  : 'border-black/5 bg-white/70'
              } ${day.isToday ? 'ring-2 ring-[#f59e0b]/30' : ''}`}
              title={`${day.label}${day.hasSession ? ` • ${day.sessionCount} session${day.sessionCount === 1 ? '' : 's'}` : ' • No quiz sessions'}`}
            >
              <p className='text-[10px] font-bold tracking-[0.16em] text-black/35 uppercase'>
                {day.shortLabel}
              </p>
              <div className='my-2 flex justify-center'>
                <Flame
                  size={22}
                  className={
                    day.hasSession
                      ? day.isInCurrentStreak
                        ? 'fill-[#f97316] text-[#ea580c]'
                        : 'fill-[#fbbf24] text-[#f59e0b]'
                      : 'text-black/15'
                  }
                />
              </div>
              <p className='text-xs font-medium text-[#1a1a1a]'>
                {day.date.slice(-2)}
              </p>
            </div>
          ))}
        </div>
      ) : (
        <div className='rounded-2xl border border-black/5 bg-[#f7f6ef] p-8 text-center text-black/50'>
          No quiz sessions yet. Your streak will begin with your first quiz.
        </div>
      )}
    </div>
  </motion.div>
);

const AccuracyChart = ({
  accuracyHistory,
  selectedCourseId,
}: AccuracyChartProps) => {
  if (accuracyHistory.length === 0) {
    return (
      <div className='rounded-2xl border border-black/5 bg-[#f7f6ef] p-8 text-center text-black/50'>
        {selectedCourseId
          ? 'No quiz sessions yet for this course.'
          : 'No quiz sessions yet to chart.'}
      </div>
    );
  }

  return (
    <div className='flex h-80 items-stretch gap-3 overflow-x-auto'>
      {accuracyHistory.map((unit, index) => (
        <div
          key={unit.unitId}
          className='flex max-w-16 min-w-16 flex-1 flex-col items-center'
          title={unit.unitTitle}
        >
          <span
            className='mb-3 rounded-full bg-[#f7f6ef] px-2 py-1 text-xs font-bold text-[#1a1a1a]'
            title={`${unit.correctAnswers}/${unit.totalQuestions} correct`}
          >
            {unit.accuracy}%
          </span>
          <div className='mt-auto flex h-56 w-full items-end rounded-t-2xl bg-[#f7f6ef] px-1.5 pt-2'>
            <div
              className='w-full rounded-t-xl bg-gradient-to-t from-[#5A5A40] to-[#d1a14d] transition-all'
              style={{ height: `${Math.max(unit.accuracy, 6)}%` }}
            />
          </div>
          <span className='mt-3 text-[11px] font-bold tracking-[0.14em] text-black/35 uppercase'>
            U{index + 1}
          </span>
          <span
            className='mt-1 line-clamp-2 cursor-help text-center text-xs text-black/45'
            title={unit.unitTitle}
          >
            {unit.unitTitle}
          </span>
        </div>
      ))}
    </div>
  );
};
