import { useState } from 'react';
import { Link } from 'react-router';
import {
  BookOpen,
  Clock,
  Edit3,
  FileText,
  MoreVertical,
  Play,
  Plus,
  Sparkles,
  Send,
  Trash2,
  Volume2,
  XCircle,
} from 'lucide-react';
import type { SidebarProps } from './types';
import * as analytics from '~/utils/analytics';

export const CourseSidebar = ({
  course,
  isInstructor,
  canDeleteCourse,
  isAdminActionProcessing,
  isGenerating,
  isGeneratingUnits,
  isExtractingRawText,
  isHeuristicTaggingRawText,
  isTaggingModuleUnits,
  isTaggingRawText,
  isSplittingRawText,
  isSplittingAllModuleRawText,
  isRunningCourseWorkflow,
  isRunningUnitAudioWorkflow,
  hasRawText,
  modulesWithRawText,
  onOpenPdf,
  onOpenExtractWarning,
  onOpenTagRawTextHeuristicModal,
  onTagModuleUnits,
  onTagRawText,
  onOpenRawTextEditor,
  onOpenSplitWarning,
  onSplitAllModuleRawText,
  onOpenGenerateWarning,
  onOpenGenerateUnitsModal,
  onRunCourseWorkflow,
  onRunUnitAudioWorkflow,
  onOpenDeleteModal,
  onPublish,
  onUnpublish,
  isDeletingCourse = false,
  isEnrolled,
  onEnroll,
  isAddingModule = false,
  onOpenAddModuleModal,
}: SidebarProps) => {
  const [isAdminMenuOpen, setIsAdminMenuOpen] = useState(false);
  const deleteButton =
    canDeleteCourse && onOpenDeleteModal ? (
      <button
        onClick={onOpenDeleteModal}
        disabled={isDeletingCourse}
        className='flex w-full items-center justify-center gap-2 rounded-2xl border border-red-200 bg-red-50 py-4 text-lg font-bold text-red-600 transition-all hover:bg-red-100 disabled:opacity-50'
      >
        <Trash2 size={20} />
        {isDeletingCourse ? 'Deleting Course...' : 'Delete Course'}
      </button>
    ) : null;

  return (
    <aside className='relative z-20 space-y-6 xl:z-auto'>
      <div className='sticky top-8 z-20 overflow-visible rounded-[32px] border border-black/5 bg-white p-6 shadow-[0_30px_80px_-35px_rgba(0,0,0,0.2)] xl:z-auto'>
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
        </div>

        <div className='space-y-3'>
          {!isEnrolled && course.status === 'published' && (
            <button
              onClick={() => {
                analytics.trackEnrollNow(course.title);
                onEnroll?.();
              }}
              className='w-full rounded-2xl bg-[#5A5A40] py-4 text-lg font-bold text-white shadow-lg transition-all hover:bg-[#4a4a35]'
            >
              Enroll Now
            </button>
          )}

          {isInstructor ? (
            <div className='relative'>
              <button
                onClick={() => setIsAdminMenuOpen((open) => !open)}
                className='flex w-full items-center justify-center gap-2 rounded-2xl border border-black/10 py-4 text-lg font-bold text-black/60 transition-all hover:bg-black/5'
              >
                <MoreVertical size={20} />
                {isAdminActionProcessing ? 'Processing...' : 'Admin Actions'}
              </button>
              {isAdminMenuOpen ? (
                <div className='absolute top-[calc(100%+0.75rem)] right-0 z-40 min-w-[260px] rounded-2xl border border-black/10 bg-white py-2 shadow-2xl'>
                  <Link
                    to={`/courses/${course.id}/edit`}
                    onClick={() => setIsAdminMenuOpen(false)}
                    className='flex w-full items-center gap-2 px-4 py-3 text-left text-sm font-medium text-[#1a1a1a] hover:bg-black/5'
                  >
                    <Edit3 size={16} />
                    Edit Course
                  </Link>
                  <button
                    onClick={() => {
                      setIsAdminMenuOpen(false);
                      onOpenExtractWarning();
                    }}
                    disabled={isExtractingRawText}
                    className='flex w-full items-center gap-2 px-4 py-3 text-left text-sm font-medium text-[#1a1a1a] hover:bg-black/5 disabled:opacity-50'
                  >
                    <FileText size={16} />
                    {isExtractingRawText
                      ? 'Extracting PDF Text...'
                      : 'Extract PDF Text'}
                  </button>
                  {hasRawText ? (
                    <button
                      onClick={() => {
                        setIsAdminMenuOpen(false);
                        onOpenTagRawTextHeuristicModal();
                      }}
                      disabled={isHeuristicTaggingRawText}
                      className='flex w-full items-center gap-2 px-4 py-3 text-left text-sm font-medium text-[#1a1a1a] hover:bg-black/5 disabled:opacity-50'
                    >
                      <BookOpen size={16} />
                      {isHeuristicTaggingRawText
                        ? 'Tagging Course Modules...'
                        : 'Tag Course Modules'}
                    </button>
                  ) : null}
                  {modulesWithRawText.length > 0 ? (
                    <>
                      <button
                        onClick={() => {
                          setIsAdminMenuOpen(false);
                          onTagModuleUnits();
                        }}
                        disabled={isTaggingModuleUnits}
                        className='flex w-full items-center gap-2 px-4 py-3 text-left text-sm font-medium text-[#1a1a1a] hover:bg-black/5 disabled:opacity-50'
                      >
                        <BookOpen size={16} />
                        {isTaggingModuleUnits
                          ? 'Tagging Module Units...'
                          : 'Tag Module Units'}
                      </button>
                      <button
                        onClick={() => {
                          setIsAdminMenuOpen(false);
                          onSplitAllModuleRawText();
                        }}
                        disabled={isSplittingAllModuleRawText}
                        className='flex w-full items-center gap-2 px-4 py-3 text-left text-sm font-medium text-[#1a1a1a] hover:bg-black/5 disabled:opacity-50'
                      >
                        <BookOpen size={16} />
                        {isSplittingAllModuleRawText
                          ? 'Splitting All Modules...'
                          : 'Split All Modules Into Units'}
                      </button>
                    </>
                  ) : null}
                  {hasRawText ? (
                    <>
                      <button
                        onClick={() => {
                          setIsAdminMenuOpen(false);
                          onTagRawText();
                        }}
                        disabled={isTaggingRawText}
                        className='flex w-full items-center gap-2 px-4 py-3 text-left text-sm font-medium text-[#1a1a1a] hover:bg-black/5 disabled:opacity-50'
                      >
                        <Sparkles size={16} />
                        {isTaggingRawText
                          ? 'Tagging Course Text...'
                          : 'AI Tag Course Text'}
                      </button>
                      <button
                        onClick={() => {
                          setIsAdminMenuOpen(false);
                          onOpenRawTextEditor();
                        }}
                        className='flex w-full items-center gap-2 px-4 py-3 text-left text-sm font-medium text-[#1a1a1a] hover:bg-black/5'
                      >
                        <Edit3 size={16} />
                        Edit Course Text
                      </button>
                      <button
                        onClick={() => {
                          setIsAdminMenuOpen(false);
                          onOpenSplitWarning();
                        }}
                        disabled={isSplittingRawText}
                        className='flex w-full items-center gap-2 px-4 py-3 text-left text-sm font-medium text-[#1a1a1a] hover:bg-black/5 disabled:opacity-50'
                      >
                        <BookOpen size={16} />
                        {isSplittingRawText
                          ? 'Splitting Into Modules...'
                          : 'Split Raw Text Into Modules'}
                      </button>
                      <button
                        onClick={() => {
                          setIsAdminMenuOpen(false);
                          onRunCourseWorkflow();
                        }}
                        disabled={isRunningCourseWorkflow}
                        className='flex w-full items-center gap-2 px-4 py-3 text-left text-sm font-medium text-[#1a1a1a] hover:bg-black/5 disabled:opacity-50'
                      >
                        <Sparkles size={16} />
                        {isRunningCourseWorkflow
                          ? 'Starting Course Workflow...'
                          : 'Run Full Course Workflow'}
                      </button>
                    </>
                  ) : null}
                  <button
                    onClick={() => {
                      setIsAdminMenuOpen(false);
                      onRunUnitAudioWorkflow();
                    }}
                    disabled={isRunningUnitAudioWorkflow}
                    className='flex w-full items-center gap-2 px-4 py-3 text-left text-sm font-medium text-[#1a1a1a] hover:bg-black/5 disabled:opacity-50'
                  >
                    <Volume2 size={16} />
                    {isRunningUnitAudioWorkflow
                      ? 'Starting Unit Audio Workflow...'
                      : 'Run Unit Audio Workflow'}
                  </button>
                  <button
                    onClick={() => {
                      setIsAdminMenuOpen(false);
                      onOpenGenerateWarning();
                    }}
                    disabled={isGenerating}
                    className='flex w-full items-center gap-2 px-4 py-3 text-left text-sm font-medium text-[#1a1a1a] hover:bg-black/5 disabled:opacity-50'
                  >
                    <Sparkles size={16} />
                    {isGenerating ? 'Generating...' : 'AI Generate Curriculum'}
                  </button>
                  <button
                    onClick={() => {
                      setIsAdminMenuOpen(false);
                      onOpenGenerateUnitsModal();
                    }}
                    disabled={
                      isGeneratingUnits || modulesWithRawText.length === 0
                    }
                    className='flex w-full items-center gap-2 px-4 py-3 text-left text-sm font-medium text-[#1a1a1a] hover:bg-black/5 disabled:opacity-50'
                  >
                    <Sparkles size={16} />
                    {isGeneratingUnits
                      ? 'Generating Units...'
                      : 'Generate Units'}
                  </button>
                  <button
                    onClick={() => {
                      setIsAdminMenuOpen(false);
                      onOpenAddModuleModal?.();
                    }}
                    disabled={isAddingModule}
                    className='flex w-full items-center gap-2 px-4 py-3 text-left text-sm font-medium text-[#1a1a1a] hover:bg-black/5 disabled:opacity-50'
                  >
                    <Plus size={16} />
                    {isAddingModule ? 'Adding Module...' : 'Add Module'}
                  </button>
                  {course.status !== 'published' && onPublish ? (
                    <button
                      onClick={() => {
                        setIsAdminMenuOpen(false);
                        onPublish();
                      }}
                      className='flex w-full items-center gap-2 px-4 py-3 text-left text-sm font-medium text-green-700 hover:bg-green-50'
                    >
                      <Send size={16} />
                      Publish Course
                    </button>
                  ) : course.status === 'published' && onUnpublish ? (
                    <button
                      onClick={() => {
                        setIsAdminMenuOpen(false);
                        onUnpublish();
                      }}
                      className='flex w-full items-center gap-2 px-4 py-3 text-left text-sm font-medium text-orange-700 hover:bg-orange-50'
                    >
                      <XCircle size={16} />
                      Unpublish Course
                    </button>
                  ) : null}
                  {deleteButton ? (
                    <button
                      onClick={() => {
                        setIsAdminMenuOpen(false);
                        onOpenDeleteModal?.();
                      }}
                      disabled={isDeletingCourse}
                      className='flex w-full items-center gap-2 px-4 py-3 text-left text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50'
                    >
                      <Trash2 size={16} />
                      {isDeletingCourse
                        ? 'Deleting Course...'
                        : 'Delete Course'}
                    </button>
                  ) : null}
                </div>
              ) : null}
            </div>
          ) : null}

          <button
            onClick={onOpenPdf}
            className='flex w-full items-center justify-center gap-2 rounded-2xl border border-[#5A5A40] py-4 text-lg font-bold text-[#5A5A40] transition-all hover:bg-[#5A5A40]/5'
          >
            <FileText size={20} />
            Course Pdf
          </button>
          {!isInstructor && deleteButton}
        </div>

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
