import { useState } from 'react';
import { Link } from 'react-router';
import { Lock, MessageSquare, MoreVertical, Play } from 'lucide-react';
import type { CourseContentProps } from './types';

export const CourseContent = ({
  courseId,
  modules,
  isInstructor,
  isEnrolled,
  communityUsers,
  isSplittingModuleRawText,
  onSplitModuleRawText,
  onOpenModuleRawTextModal,
  onOpenUnitRawTextModal,
}: CourseContentProps) => {
  const [openMenuModuleId, setOpenMenuModuleId] = useState<string | null>(null);
  const [openMenuUnitId, setOpenMenuUnitId] = useState<string | null>(null);

  const toggleMenu = (moduleId: string) => {
    setOpenMenuUnitId(null);
    setOpenMenuModuleId(openMenuModuleId === moduleId ? null : moduleId);
  };

  const toggleUnitMenu = (unitId: string) => {
    setOpenMenuModuleId(null);
    setOpenMenuUnitId(openMenuUnitId === unitId ? null : unitId);
  };
  return (
    <div className='grid grid-cols-1 gap-8 xl:grid-cols-[minmax(0,1fr)_320px]'>
      <section className='rounded-[32px] border border-black/5 bg-white p-8 shadow-[0_25px_70px_-35px_rgba(0,0,0,0.18)]'>
        <div className='mb-8 flex items-end justify-between gap-6'>
          <div>
            <p className='mb-2 text-[11px] font-bold tracking-[0.24em] text-[#5A5A40] uppercase'>
              Course Structure
            </p>
            <h2 className='font-serif text-3xl text-[#1a1a1a]'>
              Course Curriculum
            </h2>
          </div>
          <p className='text-sm text-black/45'>
            {modules.length} module{modules.length === 1 ? '' : 's'}
          </p>
        </div>

        <div className='space-y-4'>
          {modules.map((module, moduleIndex) => (
            <article
              key={module.id}
              className='overflow-hidden rounded-[24px] border border-black/5 bg-[#fbfbf8] shadow-sm'
            >
              <div className='flex items-center justify-between gap-4 border-b border-black/5 bg-white px-6 py-5'>
                <div>
                  <p className='mb-1 text-[11px] font-bold tracking-[0.2em] text-black/35 uppercase'>
                    Module {moduleIndex + 1}
                  </p>
                  <h3 className='text-xl font-bold text-[#1a1a1a]'>
                    {module.title}
                  </h3>
                  {module.description ? (
                    <p className='mt-2 max-w-2xl text-sm leading-6 text-black/55'>
                      {module.description}
                    </p>
                  ) : null}
                </div>
                <div className='flex items-center gap-3'>
                  {isInstructor && module.rawText?.trim() ? (
                    <div className='relative'>
                      <button
                        onClick={() => toggleMenu(module.id)}
                        className='flex h-8 w-8 items-center justify-center rounded-full border border-black/10 text-black/60 transition-all hover:bg-black/5'
                      >
                        <MoreVertical size={16} />
                      </button>
                      {openMenuModuleId === module.id && (
                        <div className='absolute top-10 right-0 z-20 min-w-[160px] rounded-xl border border-black/10 bg-white py-1 shadow-lg'>
                          <button
                            onClick={() => {
                              onOpenModuleRawTextModal(
                                module.id,
                                module.rawText || '',
                              );
                              setOpenMenuModuleId(null);
                            }}
                            className='flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-[#1a1a1a] hover:bg-black/5'
                          >
                            Edit Raw Text
                          </button>
                          <button
                            onClick={() => {
                              onSplitModuleRawText(module.id);
                              setOpenMenuModuleId(null);
                            }}
                            disabled={isSplittingModuleRawText}
                            className='flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-[#1a1a1a] hover:bg-black/5 disabled:opacity-50'
                          >
                            {isSplittingModuleRawText
                              ? 'Splitting...'
                              : 'Split into Units'}
                          </button>
                        </div>
                      )}
                    </div>
                  ) : null}
                  <span className='rounded-full bg-black/5 px-3 py-1 text-xs font-bold tracking-wider text-black/45 uppercase'>
                    {module.units.length} Units
                  </span>
                </div>
              </div>

              <div className='divide-y divide-black/5'>
                {module.units.length > 0 ? (
                  module.units.map((unit, unitIndex) => (
                    <Link
                      key={unit.id}
                      to={
                        isEnrolled || isInstructor
                          ? `/courses/${courseId}/units/${unit.id}`
                          : '#'
                      }
                      className={`group relative flex items-center gap-4 px-6 py-4 transition-colors ${isEnrolled || isInstructor ? 'hover:bg-black/[0.02]' : 'cursor-not-allowed'}`}
                      onClick={(e) => {
                        if (!isEnrolled && !isInstructor) {
                          e.preventDefault();
                        }
                      }}
                    >
                      <div className='flex h-9 w-9 items-center justify-center rounded-full bg-black/5 text-xs font-bold text-black/40 transition-all group-hover:bg-[#5A5A40] group-hover:text-white'>
                        {unitIndex + 1}
                      </div>
                      <div className='min-w-0 flex-1'>
                        <p className='font-medium text-[#1a1a1a] transition-colors group-hover:text-[#5A5A40]'>
                          {unit.title}
                        </p>
                        {unit.summary ? (
                          <p className='mt-1 truncate text-sm text-black/45'>
                            {unit.summary}
                          </p>
                        ) : null}
                      </div>
                      {isEnrolled || isInstructor ? (
                        <Play
                          size={16}
                          className='text-black/20 group-hover:text-[#5A5A40]'
                        />
                      ) : (
                        <Lock size={16} className='text-black/20' />
                      )}
                      {isInstructor ? (
                        <div className='relative'>
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              toggleUnitMenu(unit.id);
                            }}
                            className='flex h-8 w-8 items-center justify-center rounded-full border border-black/10 text-black/60 transition-all hover:bg-black/5'
                          >
                            <MoreVertical size={16} />
                          </button>
                          {openMenuUnitId === unit.id ? (
                            <div className='absolute top-10 right-0 z-20 min-w-[160px] rounded-xl border border-black/10 bg-white py-1 shadow-lg'>
                              <button
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  onOpenUnitRawTextModal(
                                    unit.id,
                                    unit.rawText || '',
                                  );
                                  setOpenMenuUnitId(null);
                                }}
                                className='flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-[#1a1a1a] hover:bg-black/5'
                              >
                                Edit Raw Text
                              </button>
                            </div>
                          ) : null}
                        </div>
                      ) : null}
                      {!isEnrolled && !isInstructor && (
                        <div className='absolute inset-0 bg-black/5' />
                      )}
                    </Link>
                  ))
                ) : (
                  <div className='px-6 py-6 text-sm text-black/45'>
                    No units yet for this module.
                  </div>
                )}
              </div>
            </article>
          ))}
        </div>
      </section>

      <aside className='space-y-6'>
        <section className='rounded-[32px] border border-black/5 bg-white p-8 shadow-[0_25px_70px_-35px_rgba(0,0,0,0.18)]'>
          <h2 className='mb-6 font-serif text-3xl text-[#1a1a1a]'>Community</h2>
          <div className='mb-6 flex items-center gap-4'>
            {communityUsers.length > 0 && (
              <div className='flex -space-x-2'>
                {communityUsers.slice(0, 3).map((user) =>
                  user.avatarUrl ? (
                    <img
                      key={user.id}
                      src={user.avatarUrl}
                      className='h-10 w-10 shrink-0 rounded-full border-2 border-white object-cover shadow-sm'
                      alt={user.firstName}
                    />
                  ) : (
                    <div
                      key={user.id}
                      className='flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-white bg-[#5A5A40]/10 font-bold text-[#5A5A40] shadow-sm'
                    >
                      {user.firstName?.charAt(0) || '?'}
                    </div>
                  ),
                )}
              </div>
            )}
            <span className='text-sm font-medium text-black/60'>
              {communityUsers.length > 0
                ? 'Join active discussions'
                : 'Be the first to join the discussion'}
            </span>
          </div>
          <Link
            to={`/courses/${courseId}/community`}
            className='flex w-full items-center justify-center gap-2 rounded-2xl border border-black/10 py-4 font-bold text-[#1a1a1a] transition-all hover:bg-black/5'
          >
            <MessageSquare size={18} />
            Open Community Space
          </Link>
        </section>
      </aside>
    </div>
  );
};
