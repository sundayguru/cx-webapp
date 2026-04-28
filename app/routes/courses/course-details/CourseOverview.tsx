import { Link } from 'react-router';
import { motion } from 'motion/react';
import {
  BarChart,
  BookOpen,
  ChevronRight,
  Clock,
  Globe,
  Play,
  Target,
  Users,
  Zap,
  UserCircle2,
  Music,
  Video,
} from 'lucide-react';
import type { SelectAuthor } from '~/db/schemas/authors';
import type { SelectCourse } from '~/db/schemas/courses';
import type { SelectSchool } from '~/db/schemas/schools';
import type { CourseProgressStats } from '~/db/quizzes';
import { CourseContributorBadge } from '~/components/CourseContributorBadge';
import type { CourseContributor } from '~/types/course';
import * as analytics from '~/utils/analytics';

type CourseOverviewProps = {
  course: SelectCourse;
  school: SelectSchool | null;
  author: SelectAuthor | null;
  authors: SelectAuthor[];
  contributor: CourseContributor;
  isCourseCreator: boolean;
  modulesCount: number;
  isDraft: boolean;
  onOpenPlaylist: () => void;
  hasPlaylist?: boolean;
  progressStats?: CourseProgressStats | null;
  learnerCount?: number;
  isEnrolled?: boolean;
  audioCount?: number;
  videoCount?: number;
};

export const CourseOverview = ({
  course,
  school,
  author,
  authors,
  contributor,
  isCourseCreator,
  modulesCount,
  isDraft,
  onOpenPlaylist,
  hasPlaylist = false,
  progressStats,
  isEnrolled = true,
  learnerCount = 0,
  audioCount = 0,
  videoCount = 0,
}: CourseOverviewProps) => {
  const courseAuthors = authors.length > 0 ? authors : author ? [author] : [];

  return (
    <motion.section
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      className='rounded-[36px] border border-black/5 bg-white p-8 shadow-[0_30px_80px_-35px_rgba(0,0,0,0.18)] md:p-10'
    >
      <nav className='mb-6 flex items-center gap-2 text-sm text-black/40'>
        <Link to='/courses' className='transition-colors hover:text-[#5A5A40]'>
          Courses
        </Link>
        <ChevronRight size={14} />
        <span className='truncate text-black/60'>{course.title}</span>
        {isDraft ? (
          <span className='ml-4 rounded-full bg-orange-100 px-3 py-1 text-[10px] font-bold tracking-[0.18em] text-orange-600 uppercase'>
            Pending Review
          </span>
        ) : null}
        {course.status === 'processing' && (
          <span className='ml-4 rounded-full bg-yellow-100 px-3 py-1 text-[10px] font-bold tracking-[0.18em] text-orange-600 uppercase'>
            Processing
          </span>
        )}
      </nav>

      <div className='mb-8'>
        <p className='mb-3 text-[11px] font-bold tracking-[0.24em] text-[#5A5A40] uppercase'>
          {course.code} • {course.category}
        </p>
        <h1 className='mb-6 max-w-4xl font-serif text-3xl leading-tight text-[#1a1a1a] md:text-6xl'>
          {course.title}
        </h1>
        <p className='max-w-3xl font-serif text-xl leading-relaxed text-black/55 italic'>
          {course.description}
        </p>
        {isDraft && isCourseCreator ? (
          <div className='mt-6 max-w-3xl rounded-[24px] border border-orange-200 bg-orange-50 px-5 py-4 text-sm text-orange-900'>
            <p>
              We&apos;ve received your course and will process it as soon as
              possible.
            </p>
            <p className='mt-2'>
              Once it&apos;s published, this course will be available to
              everyone. If any uploaded material should not be made public,
              please delete the course before we start processing it.
            </p>
          </div>
        ) : null}
      </div>

      <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3'>
        <div className='rounded-[24px] border border-black/5 bg-[#f7f6ef] p-5'>
          <div className='mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-[#5A5A40] shadow-sm'>
            <Users size={20} />
          </div>
          <p className='text-xs font-bold tracking-[0.18em] text-black/35 uppercase'>
            Learners
          </p>
          <p className='mt-2 text-lg font-semibold text-[#1a1a1a]'>
            {learnerCount} Student{learnerCount !== 1 ? 's' : ''}
          </p>
        </div>

        <div className='rounded-[24px] border border-black/5 bg-[#f7f6ef] p-5'>
          <div className='mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-[#5A5A40] shadow-sm'>
            <BarChart size={20} />
          </div>
          <p className='text-xs font-bold tracking-[0.18em] text-black/35 uppercase'>
            Level
          </p>
          <p className='mt-2 text-lg font-semibold text-[#1a1a1a]'>
            {course.level}
          </p>
        </div>

        <div className='rounded-[24px] border border-black/5 bg-[#f7f6ef] p-5'>
          <div className='mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-[#5A5A40] shadow-sm'>
            <BookOpen size={20} />
          </div>
          <p className='text-xs font-bold tracking-[0.18em] text-black/35 uppercase'>
            Modules
          </p>
          <p className='mt-2 text-lg font-semibold text-[#1a1a1a]'>
            {modulesCount}
          </p>
        </div>

        <div className='rounded-[24px] border border-black/5 bg-[#f7f6ef] p-5'>
          <div className='mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-[#5A5A40] shadow-sm'>
            <Music size={20} />
          </div>
          <p className='text-xs font-bold tracking-[0.18em] text-black/35 uppercase'>
            Audio
          </p>
          <p className='mt-2 text-lg font-semibold text-[#1a1a1a]'>
            {audioCount}
          </p>
        </div>

        <div className='rounded-[24px] border border-black/5 bg-[#f7f6ef] p-5'>
          <div className='mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-[#5A5A40] shadow-sm'>
            <Video size={20} />
          </div>
          <p className='text-xs font-bold tracking-[0.18em] text-black/35 uppercase'>
            Video
          </p>
          <p className='mt-2 text-lg font-semibold text-[#1a1a1a]'>
            {videoCount}
          </p>
        </div>

        {hasPlaylist && (
          <button
            onClick={() => {
              analytics.trackListenWatch(course.title, 'watch'); // General 'watch' action for course player
              onOpenPlaylist();
            }}
            disabled={!isEnrolled}
            className='cursor-pointer rounded-[24px] border border-black/5 bg-[#1a1a1a] p-5 text-left text-white shadow-lg shadow-black/20 transition-all hover:bg-[#2a2a2a] disabled:cursor-not-allowed disabled:opacity-50'
          >
            <div className='mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-white/15 text-white backdrop-blur-sm'>
              <Play size={20} />
            </div>
            <p className='text-xs font-bold tracking-[0.18em] text-white/60 uppercase'>
              Course Player
            </p>
            <p className='mt-2 text-lg font-semibold'>Listen & Watch</p>
          </button>
        )}
      </div>

      {progressStats && progressStats.quizzesTaken > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          className='mt-6 rounded-[24px] border border-black/5 bg-white p-4 sm:p-6'
        >
          <h3 className='mb-4 flex items-center gap-2 text-sm font-bold tracking-wider text-black/40 uppercase sm:text-base'>
            Your Progress
          </h3>
          <div className='grid grid-cols-2 gap-3 sm:grid-cols-4'>
            <StatPill
              icon={<Target size={14} className='sm:size-4' />}
              label='Score'
              value={`${progressStats.averageScore}%`}
              highlight={progressStats.averageScore >= 70}
            />
            <StatPill
              icon={<Zap size={14} className='sm:size-4' />}
              label='Correct'
              value={`${progressStats.correctAnswers}/${progressStats.totalQuestions}`}
            />
            <StatPill
              icon={<BarChart size={14} className='sm:size-4' />}
              label='Attempts'
              value={`${progressStats.quizzesTaken}/${progressStats.totalQuizzes}`}
            />
            <StatPill
              icon={<Clock size={14} className='sm:size-4' />}
              label='Units'
              value={`${progressStats.unitsStarted}/${progressStats.totalUnits}`}
            />
          </div>
          <div className='mt-4'>
            <div className='flex items-center justify-between text-xs sm:text-sm'>
              <span className='text-black/40'>Units Covered</span>
              <span className='font-medium text-[#1a1a1a]'>
                {Math.round(
                  (progressStats.unitsStarted / progressStats.totalUnits) * 100,
                )}
                %
              </span>
            </div>
            <div className='mt-1.5 h-2 overflow-hidden rounded-full bg-black/5'>
              <div
                className='h-full rounded-full bg-[#5A5A40] transition-all'
                style={{
                  width: `${Math.min((progressStats.unitsStarted / progressStats.totalUnits) * 100, 100)}%`,
                }}
              />
            </div>
          </div>
        </motion.div>
      )}

      <div className='mt-8 flex flex-wrap items-center gap-4 border-t border-black/5 pt-8'>
        {courseAuthors.length > 0 ? (
          <div className='flex items-center gap-3 rounded-2xl bg-black/[0.02] px-4 py-3'>
            <div className='flex h-10 w-10 items-center justify-center rounded-full bg-[#5A5A40]/10 text-[#5A5A40]'>
              <UserCircle2 size={20} />
            </div>
            <div>
              <p className='text-xs font-bold tracking-widest text-black/40 uppercase'>
                {courseAuthors.length === 1 ? 'Author' : 'Authors'}
              </p>
              <p className='font-medium text-[#1a1a1a]'>
                {courseAuthors
                  .map((courseAuthor) => courseAuthor.name)
                  .join(', ')}
              </p>
            </div>
          </div>
        ) : null}
        <CourseContributorBadge contributor={contributor} />
        {school ? (
          <div className='flex items-center gap-3 rounded-2xl bg-black/[0.02] px-4 py-3'>
            <div className='flex h-10 w-10 items-center justify-center rounded-full bg-[#5A5A40]/10 text-[#5A5A40]'>
              <Globe size={18} />
            </div>
            <div>
              <p className='text-xs font-bold tracking-widest text-black/40 uppercase'>
                Institution
              </p>
              <p className='font-medium text-[#1a1a1a]'>{school.name}</p>
            </div>
          </div>
        ) : null}
      </div>
    </motion.section>
  );
};

type StatPillProps = {
  icon: React.ReactNode;
  label: string;
  value: string;
  highlight?: boolean;
};

const StatPill = ({ icon, label, value, highlight }: StatPillProps) => (
  <div
    className={`flex items-center gap-2 rounded-xl px-3 py-2 sm:rounded-2xl sm:p-5 ${
      highlight
        ? 'border border-green-200 bg-green-50'
        : 'border border-black/5 bg-[#f7f6ef]'
    }`}
  >
    <div
      className={`flex shrink-0 ${
        highlight ? 'text-green-600' : 'text-[#5A5A40]'
      }`}
    >
      {icon}
    </div>
    <div className='min-w-0'>
      <p className='text-[10px] font-bold tracking-[0.18em] text-black/35 uppercase sm:text-xs'>
        {label}
      </p>
      <p className='truncate text-sm font-semibold text-[#1a1a1a] sm:text-base'>
        {value}
      </p>
    </div>
  </div>
);
