import { Link } from 'react-router';
import { motion } from 'motion/react';
import {
  BarChart,
  BookOpen,
  ChevronRight,
  FileText,
  Globe,
  Play,
  Users,
} from 'lucide-react';
import type { SelectAuthor } from '~/db/schemas/authors';
import type { SelectCourse } from '~/db/schemas/courses';
import type { SelectSchool } from '~/db/schemas/schools';

type CourseOverviewProps = {
  course: SelectCourse;
  school: SelectSchool | null;
  author: SelectAuthor | null;
  modulesCount: number;
  isDraft: boolean;
  onOpenPdf: () => void;
};

export const CourseOverview = ({
  course,
  school,
  author,
  modulesCount,
  isDraft,
  onOpenPdf,
}: CourseOverviewProps) => {
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
      </nav>

      <div className='mb-8'>
        <p className='mb-3 text-[11px] font-bold tracking-[0.24em] text-[#5A5A40] uppercase'>
          {course.code} • {course.category}
        </p>
        <h1 className='mb-6 max-w-4xl font-serif text-5xl leading-tight text-[#1a1a1a] md:text-6xl'>
          {course.title}
        </h1>
        <p className='max-w-3xl font-serif text-xl leading-relaxed text-black/55 italic'>
          {course.description}
        </p>
      </div>

      <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4'>
        <div className='rounded-[24px] border border-black/5 bg-[#f7f6ef] p-5'>
          <div className='mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-[#5A5A40] shadow-sm'>
            <Users size={20} />
          </div>
          <p className='text-xs font-bold tracking-[0.18em] text-black/35 uppercase'>
            Learners
          </p>
          <p className='mt-2 text-lg font-semibold text-[#1a1a1a]'>
            24 Students
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

        <button
          onClick={onOpenPdf}
          className='cursor-pointer rounded-[24px] border border-black/5 bg-[#5A5A40] p-5 text-left text-white shadow-lg shadow-[#5A5A40]/20 transition-all hover:bg-[#4a4a35]'
        >
          <div className='mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-white/15 text-white backdrop-blur-sm'>
            <FileText size={20} />
          </div>
          <p className='text-xs font-bold tracking-[0.18em] text-white/60 uppercase'>
            Source Material
          </p>
          <p className='mt-2 text-lg font-semibold'>Read Course Content</p>
        </button>
      </div>

      <div className='mt-8 flex flex-wrap items-center gap-4 border-t border-black/5 pt-8'>
        {author ? (
          <div className='flex items-center gap-3 rounded-2xl bg-black/[0.02] px-4 py-3'>
            <div className='flex h-10 w-10 items-center justify-center rounded-full bg-[#5A5A40]/10 text-[#5A5A40]'>
              <Globe size={20} />
            </div>
            <div>
              <p className='text-xs font-bold tracking-widest text-black/40 uppercase'>
                Created by
              </p>
              <p className='font-medium text-[#1a1a1a]'>{author.name}</p>
            </div>
          </div>
        ) : null}
        {school ? (
          <div className='flex items-center gap-3 rounded-2xl bg-black/[0.02] px-4 py-3'>
            <div className='flex h-10 w-10 items-center justify-center rounded-full bg-[#5A5A40]/10 text-[#5A5A40]'>
              <Play size={18} />
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
