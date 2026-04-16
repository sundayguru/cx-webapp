import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, School, Plus, Check, Loader2 } from 'lucide-react';

type School = {
  id: string;
  name: string;
  slug: string;
};

type SchoolSelectProps = {
  value: string; // schoolId or new school name
  label: string; // school name for display
  onChange: (value: string, label: string, isNew: boolean) => void;
  error?: string | null;
};

export const SchoolSelect = ({
  value,
  label,
  onChange,
  error,
}: SchoolSelectProps) => {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [schools, setSchools] = useState<School[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (!isOpen || query.length < 2) {
      setSchools([]);
      return;
    }

    const fetchSchools = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(
          `/api/schools?q=${encodeURIComponent(query)}`,
        );
        const data = (await response.json()) as { schools: School[] };
        setSchools(data.schools || []);
      } catch (err) {
        console.error('Failed to fetch schools:', err);
      } finally {
        setIsLoading(false);
      }
    };

    const debounce = setTimeout(fetchSchools, 300);
    return () => clearTimeout(debounce);
  }, [query, isOpen]);

  const handleSelect = (school: School) => {
    onChange(school.id, school.name, false);
    setQuery('');
    setIsOpen(false);
  };

  const handleCreateNew = () => {
    onChange(query, query, true);
    setQuery('');
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className='relative w-full'>
      <div className='relative'>
        <div
          className={`absolute top-1/2 left-4 -translate-y-1/2 text-black/40 transition-colors ${isOpen ? 'text-[#5A5A40]' : ''}`}
        >
          <Search size={18} />
        </div>
        <input
          type='text'
          value={isOpen ? query : label}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => {
            setIsOpen(true);
            setQuery(''); // Reset query on focus to show search clearly
          }}
          placeholder='Search or enter your school name...'
          className={`w-full rounded-xl border border-black/10 py-3 pr-4 pl-11 transition-all outline-none focus:ring-2 focus:ring-[#5A5A40] ${
            error ? 'border-red-500 ring-red-500/20' : ''
          }`}
        />
        {isLoading && (
          <div className='absolute top-1/2 right-4 -translate-y-1/2 text-[#5A5A40]'>
            <Loader2 size={18} className='animate-spin' />
          </div>
        )}
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 4, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className='absolute z-50 w-full overflow-hidden rounded-2xl border border-black/5 bg-white shadow-2xl backdrop-blur-xl'
          >
            <div className='max-h-64 overflow-y-auto p-2'>
              {schools.length > 0 ? (
                <div className='space-y-1'>
                  <p className='px-3 py-2 text-[10px] font-bold tracking-wider text-black/40 uppercase'>
                    Existing Schools
                  </p>
                  {schools.map((school) => (
                    <button
                      key={school.id}
                      type='button'
                      onClick={() => handleSelect(school)}
                      className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors ${
                        value === school.id
                          ? 'bg-[#5A5A40] text-white'
                          : 'text-[#1a1a1a] hover:bg-black/5'
                      }`}
                    >
                      <div
                        className={`flex h-8 w-8 items-center justify-center rounded-lg ${
                          value === school.id
                            ? 'bg-white/20'
                            : 'bg-[#5A5A40]/10'
                        }`}
                      >
                        <School
                          size={16}
                          className={
                            value === school.id
                              ? 'text-white'
                              : 'text-[#5A5A40]'
                          }
                        />
                      </div>
                      <div className='flex-1 overflow-hidden'>
                        <p className='truncate font-medium'>{school.name}</p>
                        <p
                          className={`truncate text-xs ${value === school.id ? 'text-white/60' : 'text-black/40'}`}
                        >
                          {school.slug}
                        </p>
                      </div>
                      {value === school.id && <Check size={16} />}
                    </button>
                  ))}
                </div>
              ) : (
                query.length >= 2 &&
                !isLoading && (
                  <div className='px-3 py-4 text-center text-sm text-black/50'>
                    No schools found matching &quot;{query}&quot;
                  </div>
                )
              )}

              {query.length > 0 && (
                <div className='mt-2 border-t border-black/5 pt-2'>
                  <button
                    type='button'
                    onClick={handleCreateNew}
                    className='flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition-all hover:translate-x-1 hover:bg-[#5A5A40]/10'
                  >
                    <div className='flex h-8 w-8 items-center justify-center rounded-lg bg-[#5A5A40] text-white'>
                      <Plus size={18} />
                    </div>
                    <div className='flex-1 overflow-hidden'>
                      <p className='font-semibold text-[#1a1a1a]'>
                        Create &quot;{query}&quot;
                      </p>
                      <p className='text-xs text-black/40'>
                        Add this school to our database
                      </p>
                    </div>
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
