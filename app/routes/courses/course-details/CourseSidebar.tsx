import { Link } from 'react-router';
import {
  BookOpen,
  CheckCircle,
  Clock,
  Edit3,
  FileText,
  Globe,
  Sparkles,
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
  rawTextLength,
  modulesWithRawText,
  selectedProvider,
  selectedModel,
  modelOptions,
  onProviderChange,
  onModelChange,
  onOpenPdf,
  onOpenExtractWarning,
  onOpenRawTextEditor,
  onOpenSplitWarning,
  onOpenGenerateWarning,
  onOpenGenerateUnitsModal,
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
            <button className='flex w-full items-center justify-center gap-2 rounded-2xl bg-[#5A5A40] py-4 text-lg font-bold text-white shadow-lg transition-all hover:bg-[#4a4a35]'>
              <Globe size={20} />
              Course Settings
            </button>
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

            <div className='rounded-[26px] border border-black/10 bg-black/[0.02] p-4'>
              <p className='mb-3 text-xs font-bold tracking-widest text-black/50 uppercase'>
                AI Setup
              </p>
              <div className='space-y-3'>
                <div>
                  <label
                    htmlFor='curriculum-provider'
                    className='mb-2 block text-xs font-bold tracking-widest text-black/40 uppercase'
                  >
                    Provider
                  </label>
                  <select
                    id='curriculum-provider'
                    value={selectedProvider}
                    onChange={(event) =>
                      onProviderChange(
                        event.target.value as typeof selectedProvider,
                      )
                    }
                    className='w-full rounded-xl border border-black/10 bg-white px-4 py-3 text-sm font-medium text-[#1a1a1a] transition outline-none focus:border-[#5A5A40]'
                  >
                    <option value='google'>Google</option>
                    <option value='groq'>Groq</option>
                  </select>
                </div>

                <div>
                  <label
                    htmlFor='curriculum-model'
                    className='mb-2 block text-xs font-bold tracking-widest text-black/40 uppercase'
                  >
                    Model
                  </label>
                  <select
                    id='curriculum-model'
                    value={selectedModel}
                    onChange={(event) => onModelChange(event.target.value)}
                    className='w-full rounded-xl border border-black/10 bg-white px-4 py-3 text-sm font-medium text-[#1a1a1a] transition outline-none focus:border-[#5A5A40]'
                  >
                    {modelOptions.map((modelOption) => (
                      <option key={modelOption.value} value={modelOption.value}>
                        {modelOption.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

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
          </div>
        ) : (
          <div className='space-y-3'>
            <button className='w-full rounded-2xl bg-[#5A5A40] py-4 text-lg font-bold text-white shadow-lg transition-all hover:bg-[#4a4a35]'>
              Go to Course
            </button>
            <button
              onClick={onOpenPdf}
              className='flex w-full items-center justify-center gap-2 rounded-2xl border border-[#5A5A40] py-4 text-lg font-bold text-[#5A5A40] transition-all hover:bg-[#5A5A40]/5'
            >
              <FileText size={20} />
              View Syllabus
            </button>
          </div>
        )}

        <div className='mt-6 space-y-3 border-t border-black/5 pt-6'>
          <div className='flex items-center gap-3 text-sm text-black/50'>
            <Clock size={16} />
            <span>Full lifetime access</span>
          </div>
          <div className='flex items-center gap-3 text-sm text-black/50'>
            <CheckCircle size={16} />
            <span>Certificate of completion</span>
          </div>
          <div className='flex items-center gap-3 text-sm text-black/50'>
            <FileText size={16} />
            <span>
              {hasRawText
                ? `Raw text stored (${rawTextLength} chars)`
                : 'Raw text not extracted yet'}
            </span>
          </div>
        </div>
      </div>
    </aside>
  );
};
