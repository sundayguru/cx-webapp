import type { Route } from './+types/courses';
import { Link, useSubmit, useNavigation } from 'react-router';
import { getUserFromRequest } from '~/utils/session.server';
import { getCourses, getAllCourseMetadata } from '~/db/courses';
import { motion, AnimatePresence } from 'motion/react';
import {
  PlusCircle,
  FileText,
  Clock,
  Search as SearchIcon,
  Filter,
  X,
  User,
  School,
  UserCircle,
  ToggleLeft,
  ToggleRight
} from 'lucide-react';
import { useState } from 'react';

export const loader = async ({ request }: Route.LoaderArgs) => {
  const user = await getUserFromRequest(request);
  const url = new URL(request.url);
  
  const search = url.searchParams.get('q') || undefined;
  const level = url.searchParams.get('level') || undefined;
  const category = url.searchParams.get('category') || undefined;
  const schoolId = url.searchParams.get('schoolId') || undefined;
  const authorId = url.searchParams.get('authorId') || undefined;
  const mine = url.searchParams.get('mine') === 'true';

  const filters = { 
    search, 
    level, 
    category, 
    schoolId, 
    authorId, 
    createdBy: mine && user ? user.id : undefined 
  };
  
  const courses = await getCourses(filters);
  const metadata = await getAllCourseMetadata();
  
  return { 
    courses, 
    user, 
    filters: {
      search: search || '',
      level: level || '',
      category: category || '',
      schoolId: schoolId || '',
      authorId: authorId || '',
      mine
    },
    metadata
  };
};

export default function CoursesPage({ loaderData }: Route.ComponentProps) {
  const { courses, filters, metadata, user } = loaderData;
  const submit = useSubmit();
  const navigation = useNavigation();
  const [showFilters, setShowFilters] = useState(false);

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    submit(formData, { method: 'get' });
  };

  const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => {
    const form = e.target.form;
    if (form) {
      submit(form, { method: 'get' });
    }
  };

  const toggleMine = () => {
    const params = new URLSearchParams(window.location.search);
    if (filters.mine) {
      params.delete('mine');
    } else {
      params.set('mine', 'true');
    }
    submit(params, { method: 'get' });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'approved': return 'bg-green-100 text-green-800 border-green-200';
      case 'rejected': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const hasActiveFilters = filters.search || filters.level || filters.category || filters.schoolId || filters.authorId || filters.mine;

  return (
    <div className='max-w-7xl mx-auto'>
      <div className='mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6'>
        <div>
          <h1 className='font-serif text-5xl text-[#1a1a1a] mb-2 font-light'>Explore Courses</h1>
          <p className='text-black/40 text-lg font-serif italic'>
            Curate and manage your collection of academic resources.
          </p>
        </div>
        
        <div className='flex items-center gap-3'>
          <form className='relative' onSubmit={handleSearch}>
            <SearchIcon className='absolute left-4 top-1/2 -translate-y-1/2 text-black/30' size={18} />
            <input
              type='text'
              name='q'
              defaultValue={filters.search}
              placeholder='Search collection...'
              className='w-full md:w-80 rounded-[20px] border border-black/5 bg-white pl-11 pr-4 py-3.5 shadow-sm transition-all focus:ring-2 focus:ring-[#5A5A40] outline-none placeholder:text-black/20'
            />
          </form>
          
          <button 
            onClick={() => setShowFilters(!showFilters)}
            className={`flex h-12 w-12 items-center justify-center rounded-[20px] border transition-all ${showFilters ? 'bg-[#5A5A40] border-[#5A5A40] text-white' : 'bg-white border-black/5 text-black/60 shadow-sm hover:border-black/10'
              }`}
          >
            <Filter size={18} />
          </button>

          <Link
            to='/create'
            className='flex items-center gap-2 rounded-[20px] bg-[#5A5A40] px-6 py-4 font-bold text-white shadow-xl shadow-[#5A5A40]/20 transition-all hover:bg-[#4a4a35] hover:-translate-y-1 active:scale-95'
          >
            <PlusCircle size={20} />
            <span className='hidden sm:inline'>New Course</span>
          </Link>
        </div>
      </div>

      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ height: 0, opacity: 0, y: -20 }}
            animate={{ height: 'auto', opacity: 1, y: 0 }}
            exit={{ height: 0, opacity: 0, y: -20 }}
            className='overflow-hidden mb-12'
          >
            <div className='p-8 rounded-[32px] bg-white border border-black/5 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)]'>
              <form className='grid grid-cols-1 md:grid-cols-4 gap-6 mb-8'>
                <input type="hidden" name="q" defaultValue={filters.search} />
                <input type="hidden" name="mine" defaultValue={filters.mine ? 'true' : ''} />
                
                <div className='space-y-2'>
                  <label className='block text-[10px] font-bold uppercase tracking-[0.2em] text-black/30 px-1'>Level</label>
                  <select 
                    name="level" 
                    defaultValue={filters.level}
                    onChange={handleFilterChange}
                    className='w-full rounded-xl border border-black/5 bg-black/[0.02] px-4 py-3 outline-none focus:ring-2 focus:ring-[#5A5A40] text-sm font-medium'
                  >
                    <option value="">All Levels</option>
                    <option value="Beginner">Beginner</option>
                    <option value="Intermediate">Intermediate</option>
                    <option value="Advanced">Advanced</option>
                  </select>
                </div>

                <div className='space-y-2'>
                  <label className='block text-[10px] font-bold uppercase tracking-[0.2em] text-black/30 px-1'>Institution</label>
                  <select 
                    name="schoolId" 
                    defaultValue={filters.schoolId}
                    onChange={handleFilterChange}
                    className='w-full rounded-xl border border-black/5 bg-black/[0.02] px-4 py-3 outline-none focus:ring-2 focus:ring-[#5A5A40] text-sm font-medium'
                  >
                    <option value="">All Institutions</option>
                    {metadata.schools.map((s: any) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>

                <div className='space-y-2'>
                  <label className='block text-[10px] font-bold uppercase tracking-[0.2em] text-black/30 px-1'>Author</label>
                  <select 
                    name="authorId" 
                    defaultValue={filters.authorId}
                    onChange={handleFilterChange}
                    className='w-full rounded-xl border border-black/5 bg-black/[0.02] px-4 py-3 outline-none focus:ring-2 focus:ring-[#5A5A40] text-sm font-medium'
                  >
                    <option value="">All Authors</option>
                    {metadata.authors.map((a: any) => (
                      <option key={a.id} value={a.id}>{a.name}</option>
                    ))}
                  </select>
                </div>

                <div className='flex items-end justify-between'>
                  <div className='space-y-2 flex-1 mr-4'>
                    <label className='block text-[10px] font-bold uppercase tracking-[0.2em] text-black/30 px-1'>Category</label>
                    <select 
                      name="category" 
                      defaultValue={filters.category}
                      onChange={handleFilterChange}
                      className='w-full rounded-xl border border-black/5 bg-black/[0.02] px-4 py-3 outline-none focus:ring-2 focus:ring-[#5A5A40] text-sm font-medium'
                    >
                      <option value="">All Categories</option>
                      <option value="General">General</option>
                      <option value="Computer Science">Computer Science</option>
                      <option value="Mathematics">Mathematics</option>
                      <option value="Physics">Physics</option>
                      <option value="Business">Business</option>
                      <option value="Humanities">Humanities</option>
                    </select>
                  </div>
                  <Link to="/courses" className='h-12 w-12 flex items-center justify-center rounded-xl bg-red-50 text-red-400 hover:bg-red-100 transition-colors' title="Clear All">
                    <X size={20} />
                  </Link>
                </div>
              </form>

              {user && (
                <div className='flex items-center justify-between border-t border-black/5 pt-6'>
                  <div className='flex items-center gap-3'>
                    <div className='h-10 w-10 rounded-xl bg-black/5 flex items-center justify-center text-black/40'>
                      <User size={20} />
                    </div>
                    <div>
                      <p className='text-sm font-bold text-[#1a1a1a]'>My Contributions Only</p>
                      <p className='text-xs text-black/40'>Only show courses you have created</p>
                    </div>
                  </div>
                  <button 
                    onClick={toggleMine}
                    className={`relative inline-flex h-8 w-14 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[#5A5A40] focus:ring-offset-2 ${filters.mine ? 'bg-[#5A5A40]' : 'bg-black/10'}`}
                  >
                    <span 
                      className={`pointer-events-none inline-block h-7 w-7 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${filters.mine ? 'translate-x-6' : 'translate-x-0'}`}
                    />
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {hasActiveFilters && (
        <div className='mb-8 flex flex-wrap gap-2 items-center'>
          <span className='text-xs font-bold uppercase tracking-widest text-black/20 mr-2'>Active:</span>
          {filters.search && (
            <div className='flex items-center gap-2 bg-[#5A5A40]/5 text-[#5A5A40] px-4 py-1.5 rounded-full text-xs font-bold border border-[#5A5A40]/10'>
              &quot;{filters.search}&quot;
            </div>
          )}
          {filters.mine && (
            <div className='flex items-center gap-2 bg-[#5A5A40] text-white px-4 py-1.5 rounded-full text-xs font-bold shadow-md'>
              My Contributions
            </div>
          )}
          {filters.level && (
            <div className='bg-black/[0.02] text-black/60 px-4 py-1.5 rounded-full text-xs font-bold border border-black/5'>
              Level: {filters.level}
            </div>
          )}
          {filters.category && (
            <div className='bg-black/[0.02] text-black/60 px-4 py-1.5 rounded-full text-xs font-bold border border-black/5'>
              {filters.category}
            </div>
          )}
          {filters.schoolId && (
            <div className='flex items-center gap-2 bg-black/[0.02] text-black/60 px-4 py-1.5 rounded-full text-xs font-bold border border-black/5'>
              <School size={12} />
              {metadata.schools.find((s: any) => s.id === filters.schoolId)?.name}
            </div>
          )}
          {filters.authorId && (
            <div className='flex items-center gap-2 bg-black/[0.02] text-black/60 px-4 py-1.5 rounded-full text-xs font-bold border border-black/5'>
              <UserCircle size={12} />
              {metadata.authors.find((a: any) => a.id === filters.authorId)?.name}
            </div>
          )}
        </div>
      )}

      {courses.length === 0 ? (
        <div className='rounded-[48px] border border-black/5 bg-white p-24 text-center shadow-sm'>
          <div className='mx-auto mb-8 flex h-28 w-28 items-center justify-center rounded-[36px] bg-black/[0.02] text-black/5'>
            <SearchIcon size={48} />
          </div>
          <h2 className='mb-3 font-serif text-4xl text-[#1a1a1a]'>No results found</h2>
          <p className='mb-10 text-black/40 text-lg max-w-sm mx-auto font-serif italic'>Adjust your filters or try a different search term to explore your collection.</p>
          <Link to='/courses' className='inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-black text-white font-bold hover:bg-black/80 transition-all'>
            View All Courses
          </Link>
        </div>
      ) : (
        <div className='grid gap-10 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'>
          {courses.map(({ course, school, author }) => (
            <motion.div
              key={course.id}
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className='group relative flex flex-col bg-white rounded-[40px] border border-black/5 overflow-hidden transition-all hover:shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] hover:-translate-y-2'
            >
              <Link to={`/courses/${course.id}`} className='relative aspect-[4/3] w-full overflow-hidden bg-black/[0.02]'>
                {course.thumbnailKey ? (
                  <img
                    src={`/api/course/serve/${course.thumbnailKey}`}
                    alt={course.title}
                    className='h-full w-full object-cover transition-transform duration-1000 group-hover:scale-110'
                  />
                ) : (
                  <div className='flex h-full w-full items-center justify-center bg-gradient-to-br from-[#5A5A40]/10 to-[#5A5A40]/30 opacity-60'>
                    <FileText className='h-16 w-16 text-[#5A5A40]/20' />
                  </div>
                )}
                <div className='absolute left-6 top-6'>
                  <span className={`px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest backdrop-blur-xl border border-white/20 shadow-lg ${getStatusColor(course.status)}`}>
                    {course.status}
                  </span>
                </div>
              </Link>

              <div className='flex flex-1 flex-col p-8'>
                <div className='mb-4 flex items-center justify-between'>
                  <span className='text-[10px] font-bold uppercase tracking-widest text-[#5A5A40]'>{course.code}</span>
                  <span className='text-[10px] font-bold uppercase tracking-widest text-black/20'>{course.level}</span>
                </div>
                
                <Link to={`/courses/${course.id}`} className='mb-4'>
                  <h3 className='font-serif text-2xl font-medium text-[#1a1a1a] leading-tight group-hover:text-[#5A5A40] transition-colors line-clamp-2'>
                    {course.title}
                  </h3>
                </Link>

                <div className='mt-auto space-y-4 pt-6 border-t border-black/5 opacity-60'>
                  <div className='flex items-center justify-between gap-4'>
                    {author && (
                      <div className='flex items-center gap-2 min-w-0'>
                        <UserCircle size={14} className='text-black/30' />
                        <span className='text-xs font-bold uppercase tracking-wider text-black/80 truncate'>{author.name}</span>
                      </div>
                    )}
                    <div className='flex items-center gap-1.5 text-[10px] font-bold text-black/30 shrink-0'>
                      <Clock size={12} />
                      <span>{new Date(course.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                  {school && (
                    <div className='flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-black/20'>
                      <School size={12} />
                      <span className='truncate'>{school.name}</span>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
