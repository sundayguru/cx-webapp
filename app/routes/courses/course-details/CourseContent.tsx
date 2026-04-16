import { Link } from 'react-router';
import { MessageSquare, Play } from 'lucide-react';
import type { CourseModuleWithUnits } from './types';

type CourseContentProps = {
  courseId: string;
  modules: CourseModuleWithUnits[];
};

export const CourseContent = ({ courseId, modules }: CourseContentProps) => {
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
                <span className='rounded-full bg-black/5 px-3 py-1 text-xs font-bold tracking-wider text-black/45 uppercase'>
                  {module.units.length} Units
                </span>
              </div>

              <div className='divide-y divide-black/5'>
                {module.units.length > 0 ? (
                  module.units.map((unit, unitIndex) => (
                    <Link
                      key={unit.id}
                      to={`/courses/${courseId}/units/${unit.id}`}
                      className='group flex items-center gap-4 px-6 py-4 transition-colors hover:bg-black/[0.02]'
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
                      <Play
                        size={16}
                        className='text-black/20 group-hover:text-[#5A5A40]'
                      />
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
            <div className='flex -space-x-2'>
              {[1, 2, 3].map((i) => (
                <img
                  key={i}
                  src={`https://i.pravatar.cc/100?u=${i + 10}`}
                  className='h-10 w-10 rounded-full border-2 border-white shadow-sm'
                  alt='User'
                />
              ))}
            </div>
            <span className='text-sm font-medium text-black/60'>
              Join active discussions
            </span>
          </div>
          <button className='flex w-full items-center justify-center gap-2 rounded-2xl border border-black/10 py-4 font-bold transition-all hover:bg-black/5'>
            <MessageSquare size={18} />
            Open Community Space
          </button>
        </section>
      </aside>
    </div>
  );
};
