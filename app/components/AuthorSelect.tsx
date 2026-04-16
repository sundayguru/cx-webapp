import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, UserCircle, Plus, Check, Loader2 } from 'lucide-react';

type Author = {
  id: string;
  name: string;
  slug: string;
};

type AuthorSelectProps = {
  value: string; // authorId or new author name
  label: string; // author name for display
  onChange: (value: string, label: string, isNew: boolean) => void;
  error?: string | null;
};

export const AuthorSelect = ({
  value,
  label,
  onChange,
  error,
}: AuthorSelectProps) => {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [authors, setAuthors] = useState<Author[]>([]);
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
      setAuthors([]);
      return;
    }

    const fetchAuthors = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(
          `/api/authors?q=${encodeURIComponent(query)}`,
        );
        const data = (await response.json()) as { authors: Author[] };
        setAuthors(data.authors || []);
      } catch (err) {
        console.error('Failed to fetch authors:', err);
      } finally {
        setIsLoading(false);
      }
    };

    const debounce = setTimeout(fetchAuthors, 300);
    return () => clearTimeout(debounce);
  }, [query, isOpen]);

  const handleSelect = (author: Author) => {
    onChange(author.id, author.name, false);
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
            setQuery('');
          }}
          placeholder='Search or enter author name...'
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
              {authors.length > 0 ? (
                <div className='space-y-1'>
                  <p className='px-3 py-2 text-[10px] font-bold tracking-wider text-black/40 uppercase'>
                    Existing Authors
                  </p>
                  {authors.map((author) => (
                    <button
                      key={author.id}
                      type='button'
                      onClick={() => handleSelect(author)}
                      className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors ${
                        value === author.id
                          ? 'bg-[#5A5A40] text-white'
                          : 'text-[#1a1a1a] hover:bg-black/5'
                      }`}
                    >
                      <div
                        className={`flex h-8 w-8 items-center justify-center rounded-lg ${
                          value === author.id
                            ? 'bg-white/20'
                            : 'bg-[#5A5A40]/10'
                        }`}
                      >
                        <UserCircle
                          size={16}
                          className={
                            value === author.id
                              ? 'text-white'
                              : 'text-[#5A5A40]'
                          }
                        />
                      </div>
                      <div className='flex-1 overflow-hidden'>
                        <p className='truncate font-medium'>{author.name}</p>
                        <p
                          className={`truncate text-xs ${value === author.id ? 'text-white/60' : 'text-black/40'}`}
                        >
                          @{author.slug}
                        </p>
                      </div>
                      {value === author.id && <Check size={16} />}
                    </button>
                  ))}
                </div>
              ) : (
                query.length >= 2 &&
                !isLoading && (
                  <div className='px-3 py-4 text-center text-sm text-black/50'>
                    No authors found matching &quot;{query}&quot;
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
                        Add this author to our database
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
