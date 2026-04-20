import { Link } from 'react-router';
import {
  BookOpen,
  Clock,
  Edit3,
  FileText,
  Sparkles,
  Send,
  XCircle,
} from 'lucide-react';
import type { SidebarProps } from './types';

export const CourseSidebar = ({
  course,
  isInstructor,
  isGenerating,
  isGeneratingUnits,
  isExtractingRawText,
  isSplittingRawText,
  hasRawText,
  modulesWithRawText,
  onOpenPdf,
  onOpenExtractWarning,
  onOpenRawTextEditor,
  onOpenSplitWarning,
  onOpenGenerateWarning,
  onOpenGenerateUnitsModal,
  onPublish,
  onUnpublish,
  isEnrolled,
  onEnroll,
}: SidebarProps) => {
  return (
    <aside className='space-y-6'>
      <div className='sticky top-8 overflow-hidden rounded-[32px] border border-black/5 bg-white p-6 shadow-[0_30px_80px_-35px_rgba(0,0,0,0.2)]'>
        <div className='group relative mb-6 overflow-hidden rounded-[28px] border border-black/5 bg-[#f5f5f0]'>
          <img
            src={
              course.thumbnailKey
                ? `/api/course/serve/${course.thumbnailKey}`
                : `https://picsum.photos/seed/${course.id}/700/500`
            }
            className='aspect-[4/3] w-full object-cover transition-transform duration-500 group-hover:scale-105'
            alt={course.title}
          />
          <button
            onClick={onOpenPdf}
            className='absolute inset-0 flex items-center justify-center bg-black/35 opacity-0 transition-opacity group-hover:opacity-100'
          >
            <div className='flex h-16 w-16 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-md'>
              <FileText size={24} />
            </div>
          </button>
        </div>

        {isInstructor ? (
          <div className='space-y-3'>
            <Link
              to={`/courses/${course.id}/edit`}
              className='flex w-full items-center justify-center gap-2 rounded-2xl border border-black/10 py-4 text-lg font-bold text-black/60 transition-all hover:bg-black/5'
            >
              <Edit3 size={20} />
              Edit Course
            </Link>
            <button
              onClick={onOpenExtractWarning}
              disabled={isExtractingRawText}
              className='flex w-full items-center justify-center gap-2 rounded-2xl border border-black/10 py-4 text-lg font-bold text-black/60 transition-all hover:bg-black/5 disabled:opacity-50'
            >
              <FileText size={20} />
              {isExtractingRawText
                ? 'Extracting PDF Text...'
                : 'Extract PDF Text'}
            </button>
            {hasRawText ? (
              <button
                onClick={onOpenRawTextEditor}
                className='flex w-full items-center justify-center gap-2 rounded-2xl border border-black/10 py-4 text-lg font-bold text-black/60 transition-all hover:bg-black/5'
              >
                <Edit3 size={20} />
                Edit Course Text
              </button>
            ) : null}
            {hasRawText ? (
              <button
                onClick={onOpenSplitWarning}
                disabled={isSplittingRawText}
                className='flex w-full items-center justify-center gap-2 rounded-2xl border border-black/10 py-4 text-lg font-bold text-black/60 transition-all hover:bg-black/5 disabled:opacity-50'
              >
                <BookOpen size={20} />
                {isSplittingRawText
                  ? 'Splitting Into Modules...'
                  : 'Split Raw Text Into Modules'}
              </button>
            ) : null}

            <button
              onClick={onOpenGenerateWarning}
              disabled={isGenerating}
              className='flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#d96b43] to-[#d1a14d] py-4 text-lg font-bold text-white shadow-md shadow-[#d96b43]/25 transition-all hover:shadow-lg disabled:opacity-50'
            >
              <Sparkles size={20} />
              {isGenerating ? 'Generating...' : 'AI Generate Curriculum'}
            </button>
            <button
              onClick={onOpenGenerateUnitsModal}
              disabled={isGeneratingUnits || modulesWithRawText.length === 0}
              className='flex w-full items-center justify-center gap-2 rounded-2xl bg-[#1f4a57] py-4 text-lg font-bold text-white shadow-md shadow-[#1f4a57]/20 transition-all hover:bg-[#173944] disabled:opacity-50'
            >
              <Sparkles size={20} />
              {isGeneratingUnits ? 'Generating Units...' : 'Generate Units'}
            </button>
            {course.status !== 'published' && onPublish ? (
              <button
                onClick={onPublish}
                className='flex w-full items-center justify-center gap-2 rounded-2xl bg-green-600 py-4 text-lg font-bold text-white shadow-md shadow-green-600/25 transition-all hover:bg-green-700'
              >
                <Send size={20} />
                Publish Course
              </button>
            ) : course.status === 'published' && onUnpublish ? (
              <button
                onClick={onUnpublish}
                className='flex w-full items-center justify-center gap-2 rounded-2xl bg-orange-500 py-4 text-lg font-bold text-white shadow-md shadow-orange-500/25 transition-all hover:bg-orange-600'
              >
                <XCircle size={20} />
                Unpublish Course
              </button>
            ) : null}
          </div>
        ) : (
          <div className='space-y-3'>
            {!isEnrolled && (
              <button
                onClick={onEnroll}
                className='w-full rounded-2xl bg-[#5A5A40] py-4 text-lg font-bold text-white shadow-lg transition-all hover:bg-[#4a4a35]'
              >
                Enroll Now
              </button>
            )}
            <button
              onClick={onOpenPdf}
              className='flex w-full items-center justify-center gap-2 rounded-2xl border border-[#5A5A40] py-4 text-lg font-bold text-[#5A5A40] transition-all hover:bg-[#5A5A40]/5'
            >
              <FileText size={20} />
              Course Pdf
            </button>
          </div>
        )}

        <div className='mt-6 space-y-3 border-t border-black/5 pt-6'>
          <div className='flex items-center gap-3 text-sm text-black/50'>
            <Clock size={16} />
            <span>Full lifetime access</span>
          </div>
        </div>
      </div>
    </aside>
  );
};
