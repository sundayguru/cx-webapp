import type { Route } from './+types/courses';
import { Link, useFetcher, useSubmit } from 'react-router';
import { getUserFromRequest } from '~/utils/session.server';
import { getCoursesWithPagination, getAllCourseMetadata } from '~/db/courses';
import { motion, AnimatePresence } from 'motion/react';
import {
  PlusCircle,
  Clock,
  Search as SearchIcon,
  Filter,
  X,
  User,
  School,
  UserCircle,
} from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import { CourseContributorBadge } from '~/components/CourseContributorBadge';

export const loader = async ({ request }: Route.LoaderArgs) => {
  const user = await getUserFromRequest(request);
  const url = new URL(request.url);

  const search = url.searchParams.get('q') || undefined;
  const level = url.searchParams.get('level') || undefined;
  const category = url.searchParams.get('category') || undefined;
  const schoolId = url.searchParams.get('schoolId') || undefined;
  const authorId = url.searchParams.get('authorId') || undefined;
  const status = url.searchParams.get('status') || undefined;
  const mine = url.searchParams.get('mine') === 'true';
  const page = Number(url.searchParams.get('page')) || 1;

  const filters = {
    search,
    level,
    category,
    schoolId,
    authorId,
    createdBy: mine && user ? user.id : undefined,
    publishedOnly: !mine || !user,
    status: user?.isAdmin ? status : undefined,
  };

  const pageSize = 3;
  const result = await getCoursesWithPagination(
    filters,
    user?.isAdmin,
    page,
    pageSize,
  );
  const metadata = await getAllCourseMetadata();

  return {
    courses: result.courses,
    user,
    filters: {
      search: search || '',
      level: level || '',
      category: category || '',
      schoolId: schoolId || '',
      authorId: authorId || '',
      status: status || '',
      mine,
    },
    metadata,
    pagination: {
      page,
      pageSize,
      total: result.total,
      totalPages: result.totalPages,
    },
  };
};

export default function CoursesPage({ loaderData }: Route.ComponentProps) {
  const { courses, filters, metadata, user, pagination } = loaderData;
  const submit = useSubmit();
  const [showFilters, setShowFilters] = useState(false);
  const [loadedCourses, setLoadedCourses] = useState(courses);
  const [currentPage, setCurrentPage] = useState(pagination?.page || 1);
  const [totalPages, setTotalPages] = useState(pagination?.totalPages || 0);
  const [isLoading, setIsLoading] = useState(false);
  const courseFetcher = useFetcher()

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    submit(formData, { method: 'get' });
  };

  const handleFilterChange = (
    e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>,
  ) => {
    const form = e.target.form;
    if (form) {
      const formData = new FormData(form);
      formData.delete('page');
      submit(formData, { method: 'get' });
    }
  };

  const toggleMine = () => {
    const params = new URLSearchParams(window.location.search);
    params.delete('page');
    if (filters.mine) {
      params.delete('mine');
    } else {
      params.set('mine', 'true');
    }
    submit(params, { method: 'get' });
  };

  useEffect(() => {
    // Reset courses when loader data changes (e.g., after filter/search)
    setLoadedCourses(courses);
    setCurrentPage(pagination?.page || 1);
    setTotalPages(pagination?.totalPages || 0);
  }, [courses, pagination]);

  const loadMore = useCallback(async () => {
    if (isLoading || currentPage >= totalPages) { return; }

    setIsLoading(true);
    const nextPage = currentPage + 1;
    const params = new URLSearchParams(window.location.search);
    params.set('page', String(nextPage));

    courseFetcher.load(`${window.location.pathname}?${params.toString()}`)
    setCurrentPage(nextPage)
  }, [currentPage, totalPages, isLoading]);


  useEffect(() => {
    if (courseFetcher.data?.courses) {
      setLoadedCourses((prev) => {
        return [...prev, ...courseFetcher.data?.courses]
      })
    }
  }, [courseFetcher.data])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'approved':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'rejected':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const hasActiveFilters =
    filters.search ||
    filters.level ||
    filters.category ||
    filters.schoolId ||
    filters.authorId ||
    filters.status ||
    filters.mine;

  return (
    <div className='mx-auto max-w-7xl px-0 sm:px-4'>
      <div className='px-4 sm:px-0'>
        <div className='mb-12 flex flex-col justify-between gap-6 md:flex-row md:items-end'>
          <div>
            <h1 className='mb-2 font-serif text-5xl font-light text-[#1a1a1a]'>
              Explore Courses
            </h1>
            <p className='font-serif text-lg text-black/40 italic'>
              Curated collection of academic resources.
            </p>
          </div>

          <div className='flex items-center gap-3'>
            <form className='relative' onSubmit={handleSearch}>
              <SearchIcon
                className='absolute top-1/2 left-4 -translate-y-1/2 text-black/30'
                size={18}
              />
              <input
                type='text'
                name='q'
                defaultValue={filters.search}
                placeholder='Search collection...'
                className='w-full rounded-[20px] border border-black/5 bg-white py-3.5 pr-4 pl-11 shadow-sm transition-all outline-none placeholder:text-black/20 focus:ring-2 focus:ring-[#5A5A40] md:w-80'
              />
            </form>

            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex h-12 w-12 items-center justify-center rounded-[20px] border transition-all ${
                showFilters
                  ? 'border-[#5A5A40] bg-[#5A5A40] text-white'
                  : 'border-black/5 bg-white text-black/60 shadow-sm hover:border-black/10'
              }`}
            >
              <Filter size={18} />
            </button>

            <Link
              to='/create'
              className='flex items-center gap-2 rounded-[20px] bg-[#5A5A40] px-6 py-4 font-bold text-white shadow-xl shadow-[#5A5A40]/20 transition-all hover:-translate-y-1 hover:bg-[#4a4a35] active:scale-95'
            >
              <PlusCircle size={20} />
              <span className='hidden sm:inline'>New Course</span>
            </Link>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ height: 0, opacity: 0, y: -20 }}
            animate={{ height: 'auto', opacity: 1, y: 0 }}
            exit={{ height: 0, opacity: 0, y: -20 }}
            className='mb-12 overflow-hidden'
          >
            <div className='rounded-[32px] border border-black/5 bg-white p-8 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)]'>
              <form className='mb-8 grid grid-cols-1 gap-6 md:grid-cols-4'>
                <input type='hidden' name='q' defaultValue={filters.search} />
                <input
                  type='hidden'
                  name='mine'
                  defaultValue={filters.mine ? 'true' : ''}
                />

                <div className='space-y-2'>
                  <label className='block px-1 text-[10px] font-bold tracking-[0.2em] text-black/30 uppercase'>
                    Level
                  </label>
                  <select
                    name='level'
                    defaultValue={filters.level}
                    onChange={handleFilterChange}
                    className='w-full rounded-xl border border-black/5 bg-black/[0.02] px-4 py-3 text-sm font-medium outline-none focus:ring-2 focus:ring-[#5A5A40]'
                  >
                    <option value=''>All Levels</option>
                    <option value='Beginner'>Beginner</option>
                    <option value='Intermediate'>Intermediate</option>
                    <option value='Advanced'>Advanced</option>
                  </select>
                </div>

                <div className='space-y-2'>
                  <label className='block px-1 text-[10px] font-bold tracking-[0.2em] text-black/30 uppercase'>
                    Institution
                  </label>
                  <select
                    name='schoolId'
                    defaultValue={filters.schoolId}
                    onChange={handleFilterChange}
                    className='w-full rounded-xl border border-black/5 bg-black/[0.02] px-4 py-3 text-sm font-medium outline-none focus:ring-2 focus:ring-[#5A5A40]'
                  >
                    <option value=''>All Institutions</option>
                    {metadata.schools.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className='space-y-2'>
                  <label className='block px-1 text-[10px] font-bold tracking-[0.2em] text-black/30 uppercase'>
                    Author
                  </label>
                  <select
                    name='authorId'
                    defaultValue={filters.authorId}
                    onChange={handleFilterChange}
                    className='w-full rounded-xl border border-black/5 bg-black/[0.02] px-4 py-3 text-sm font-medium outline-none focus:ring-2 focus:ring-[#5A5A40]'
                  >
                    <option value=''>All Authors</option>
                    {metadata.authors.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className='flex items-end justify-between'>
                  <div className='mr-4 flex-1 space-y-2'>
                    <label className='block px-1 text-[10px] font-bold tracking-[0.2em] text-black/30 uppercase'>
                      Category
                    </label>
                    <select
                      name='category'
                      defaultValue={filters.category}
                      onChange={handleFilterChange}
                      className='w-full rounded-xl border border-black/5 bg-black/[0.02] px-4 py-3 text-sm font-medium outline-none focus:ring-2 focus:ring-[#5A5A40]'
                    >
                      <option value=''>All Categories</option>
                      <option value='General'>General</option>
                      <option value='Computer Science'>Computer Science</option>
                      <option value='Mathematics'>Mathematics</option>
                      <option value='Physics'>Physics</option>
                      <option value='Business'>Business</option>
                      <option value='Humanities'>Humanities</option>
                    </select>
                  </div>
                  <Link
                    to='/courses'
                    className='flex h-12 w-12 items-center justify-center rounded-xl bg-red-50 text-red-400 transition-colors hover:bg-red-100'
                    title='Clear All'
                  >
                    <X size={20} />
                  </Link>
                </div>

                {user?.isAdmin && (
                  <div className='space-y-2 md:col-start-1'>
                    <label className='block px-1 text-[10px] font-bold tracking-[0.2em] text-black/30 uppercase'>
                      Status
                    </label>
                    <select
                      name='status'
                      defaultValue={filters.status}
                      onChange={handleFilterChange}
                      className='w-full rounded-xl border border-black/5 bg-black/[0.02] px-4 py-3 text-sm font-medium outline-none focus:ring-2 focus:ring-[#5A5A40]'
                    >
                      <option value=''>All Statuses</option>
                      <option value='published'>Published</option>
                      <option value='pending'>Pending</option>
                      <option value='processing'>Processing</option>
                      <option value='failed'>Failed</option>
                    </select>
                  </div>
                )}
              </form>

              {user && (
                <div className='flex items-center justify-between border-t border-black/5 pt-6'>
                  <div className='flex items-center gap-3'>
                    <div className='flex h-10 w-10 items-center justify-center rounded-xl bg-black/5 text-black/40'>
                      <User size={20} />
                    </div>
                    <div>
                      <p className='text-sm font-bold text-[#1a1a1a]'>
                        My Contributions Only
                      </p>
                      <p className='text-xs text-black/40'>
                        Only show courses you have created
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={toggleMine}
                    className={`relative inline-flex h-8 w-14 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:ring-2 focus:ring-[#5A5A40] focus:ring-offset-2 focus:outline-none ${
                      filters.mine ? 'bg-[#5A5A40]' : 'bg-black/10'
                    }`}
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
        <div className='mb-8 flex flex-wrap items-center gap-2'>
          <span className='mr-2 text-xs font-bold tracking-widest text-black/20 uppercase'>
            Active:
          </span>
          {filters.search && (
            <div className='flex items-center gap-2 rounded-full border border-[#5A5A40]/10 bg-[#5A5A40]/5 px-4 py-1.5 text-xs font-bold text-[#5A5A40]'>
              &quot;{filters.search}&quot;
            </div>
          )}
          {filters.mine && (
            <div className='flex items-center gap-2 rounded-full bg-[#5A5A40] px-4 py-1.5 text-xs font-bold text-white shadow-md'>
              My Contributions
            </div>
          )}
          {filters.level && (
            <div className='rounded-full border border-black/5 bg-black/[0.02] px-4 py-1.5 text-xs font-bold text-black/60'>
              Level: {filters.level}
            </div>
          )}
          {filters.category && (
            <div className='rounded-full border border-black/5 bg-black/[0.02] px-4 py-1.5 text-xs font-bold text-black/60'>
              {filters.category}
            </div>
          )}
          {filters.schoolId && (
            <div className='flex items-center gap-2 rounded-full border border-black/5 bg-black/[0.02] px-4 py-1.5 text-xs font-bold text-black/60'>
              <School size={12} />
              {metadata.schools.find((s) => s.id === filters.schoolId)?.name}
            </div>
          )}
          {filters.authorId && (
            <div className='flex items-center gap-2 rounded-full border border-black/5 bg-black/[0.02] px-4 py-1.5 text-xs font-bold text-black/60'>
              <UserCircle size={12} />
              {metadata.authors.find((a) => a.id === filters.authorId)?.name}
            </div>
          )}
          {filters.status && (
            <div
              className={`rounded-full border px-4 py-1.5 text-xs font-bold uppercase ${getStatusColor(
                filters.status,
              )}`}
            >
              Status: {filters.status}
            </div>
          )}
        </div>
      )}

      {loadedCourses.length === 0 ? (
        <div className='rounded-[48px] border border-black/5 bg-white p-24 text-center shadow-sm'>
          <div className='mx-auto mb-8 flex h-28 w-28 items-center justify-center rounded-[36px] bg-black/[0.02] text-black/5'>
            <SearchIcon size={48} />
          </div>
          <h2 className='mb-3 font-serif text-4xl text-[#1a1a1a]'>
            No results found
          </h2>
          <p className='mx-auto mb-10 max-w-sm font-serif text-lg text-black/40 italic'>
            Adjust your filters or try a different search term to explore your
            collection.
          </p>
          <Link
            to='/courses'
            className='inline-flex items-center gap-2 rounded-2xl bg-black px-8 py-4 font-bold text-white transition-all hover:bg-black/80'
          >
            View All Courses
          </Link>
        </div>
      ) : (
        <div className='grid gap-10 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'>
          {loadedCourses.map(
            ({ course, school, author, authors, contributor }) => {
              const courseAuthors =
                authors.length > 0 ? authors : author ? [author] : [];

              return (
                <motion.div
                  key={course.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className='group relative flex flex-col overflow-hidden rounded-[40px] border border-black/5 bg-white transition-all hover:-translate-y-2 hover:shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)]'
                >
                  <Link
                    to={`/courses/${course.id}`}
                    className='relative aspect-[4/3] w-full overflow-hidden bg-black/[0.02]'
                  >
                    <img
                      src={
                        course.thumbnailKey
                          ? `/api/course/serve/${course.thumbnailKey}`
                          : `https://picsum.photos/seed/${course.id}/700/500`
                      }
                      alt={course.title}
                      className='h-full w-full object-cover transition-transform duration-1000 group-hover:scale-110'
                    />
                    {course.status !== 'published' && (
                      <div className='absolute top-6 left-6'>
                        <span
                          className={`rounded-full border border-white/20 px-4 py-1.5 text-[10px] font-bold tracking-widest uppercase shadow-lg backdrop-blur-xl ${getStatusColor(
                            course.status,
                          )}`}
                        >
                          {course.status}
                        </span>
                      </div>
                    )}
                  </Link>

                  <div className='flex flex-1 flex-col p-8'>
                    <div className='mb-4 flex items-center justify-between'>
                      <span className='text-[10px] font-bold tracking-widest text-[#5A5A40] uppercase'>
                        {course.code}
                      </span>
                      <span className='text-[10px] font-bold tracking-widest text-black/20 uppercase'>
                        {course.level}
                      </span>
                    </div>

                    <Link to={`/courses/${course.id}`} className='mb-4'>
                      <h3 className='line-clamp-2 font-serif text-2xl leading-tight font-medium text-[#1a1a1a] transition-colors group-hover:text-[#5A5A40]'>
                        {course.title}
                      </h3>
                    </Link>

                    <div className='mt-auto space-y-4 border-t border-black/5 pt-6 opacity-60'>
                      <div className='flex items-center justify-between gap-4'>
                        {courseAuthors.length > 0 && (
                          <div className='flex min-w-0 items-center gap-2'>
                            <UserCircle size={14} className='text-black/30' />
                            <span className='truncate text-xs font-bold tracking-wider text-black/80 uppercase'>
                              {courseAuthors
                                .map((courseAuthor) => courseAuthor.name)
                                .join(', ')}
                            </span>
                          </div>
                        )}
                        <div className='flex shrink-0 items-center gap-1.5 text-[10px] font-bold text-black/30'>
                          <Clock size={12} />
                          <span>
                            {new Date(course.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <CourseContributorBadge
                        contributor={contributor}
                        variant='card'
                      />
                      {school && (
                        <div className='flex items-center gap-2 text-[10px] font-bold tracking-[0.2em] text-black/20 uppercase'>
                          <School size={12} />
                          <span className='truncate'>{school.name}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            },
          )}
        </div>
      )}

      {currentPage < totalPages && totalPages > 0 && (
        <div className='mt-16 flex justify-center'>
          <button
            onClick={loadMore}
            disabled={isLoading}
            className='flex items-center gap-2 rounded-full border border-[#5A5A40] bg-[#5A5A40] px-8 py-4 font-bold text-white shadow-xl shadow-[#5A5A40]/20 transition-all hover:-translate-y-1 hover:bg-[#4a4a35] active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:-translate-y-0'
          >
            {isLoading ? (
              <>
                <div className='h-5 w-5 animate-spin rounded-full border-2 border-white/40 border-t-white' />
                Loading...
              </>
            ) : (
              <>
                <PlusCircle size={20} />
                Load More
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
