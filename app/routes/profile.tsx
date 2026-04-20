import { Link, redirect } from 'react-router';
import type { Route } from './+types/profile';
import { BookmarkedUnitCard } from '~/components/BookmarkedUnitCard';
import { getBookmarkedUnitsByUser } from '~/db/bookmarks';
import { getPublicProfile } from '~/db/profile';
import { getUserEnrollments } from '~/db/enrollments';
import { getCourses } from '~/db/courses';
import { getUserFromRequest } from '~/utils/session.server';
import { motion } from 'motion/react';
import {
  BookOpen,
  GraduationCap,
  Target,
  Calendar,
  ChevronRight,
  Settings,
  FolderOpen,
} from 'lucide-react';

export const loader = async ({ request, params }: Route.LoaderArgs) => {
  const currentUser = await getUserFromRequest(request);

  if (!currentUser) {
    return redirect('/login');
  }

  const targetUserId = params.userId || currentUser.id;
  const isOwner = !params.userId || params.userId === currentUser.id;

  const profile = await getPublicProfile(targetUserId);
  if (!profile) {
    return redirect('/dashboard');
  }

  const [enrolledCourses, createdCourses, bookmarkedUnits] = await Promise.all([
    getUserEnrollments(targetUserId),
    isOwner ? getCourses({ createdBy: targetUserId }) : [],
    isOwner ? getBookmarkedUnitsByUser(targetUserId) : [],
  ]);

  return {
    profile,
    enrolledCourses: enrolledCourses.slice(0, 6),
    createdCourses: createdCourses.slice(0, 6),
    bookmarkedUnits: bookmarkedUnits.slice(0, 6),
    isOwner,
  };
};

export default function ProfilePage({ loaderData }: Route.ComponentProps) {
  const { profile, enrolledCourses, createdCourses, bookmarkedUnits, isOwner } =
    loaderData;
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'long',
      year: 'numeric',
    });
  };

  return (
    <div className='mx-auto max-w-4xl px-4 py-8'>
      <motion.section
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        className='rounded-[36px] border border-black/5 bg-white p-8 shadow-[0_30px_80px_-35px_rgba(0,0,0,0.18)] md:p-10'
      >
        <div className='flex flex-col items-center md:flex-row md:items-start md:gap-8'>
          <div className='mb-6 shrink-0 md:mb-0'>
            {profile.avatarUrl ? (
              <img
                src={profile.avatarUrl}
                alt={profile.name || 'User'}
                className='h-32 w-32 rounded-full object-cover shadow-lg'
              />
            ) : (
              <div className='flex h-32 w-32 items-center justify-center rounded-full bg-[#5A5A40] text-4xl font-bold text-white shadow-lg'>
                {profile.name?.charAt(0).toUpperCase() ||
                  profile.email.charAt(0).toUpperCase()}
              </div>
            )}
          </div>

          <div className='flex-1 text-center md:text-left'>
            <div className='mb-2 flex items-center justify-center gap-3 md:justify-start'>
              <h1 className='font-serif text-4xl text-[#1a1a1a]'>
                {profile.name || 'Anonymous User'}
              </h1>
              {isOwner && (
                <Link
                  to='/settings'
                  className='rounded-full border border-black/10 p-2 text-black/40 transition-colors hover:bg-black/5 hover:text-black/60'
                >
                  <Settings size={20} />
                </Link>
              )}
            </div>

            {profile.bio && (
              <p className='mb-6 text-lg text-black/60'>{profile.bio}</p>
            )}

            <div className='grid grid-cols-3 gap-4'>
              <div className='rounded-2xl border border-black/5 bg-[#f7f6ef] p-4 text-center'>
                <GraduationCap
                  size={24}
                  className='mx-auto mb-2 text-[#5A5A40]'
                />
                <p className='text-2xl font-bold text-[#1a1a1a]'>
                  {profile.stats.coursesEnrolled}
                </p>
                <p className='text-xs font-bold tracking-wider text-black/40 uppercase'>
                  Courses
                </p>
              </div>
              <div className='rounded-2xl border border-black/5 bg-[#f7f6ef] p-4 text-center'>
                <BookOpen size={24} className='mx-auto mb-2 text-[#5A5A40]' />
                <p className='text-2xl font-bold text-[#1a1a1a]'>
                  {profile.stats.quizzesTaken}
                </p>
                <p className='text-xs font-bold tracking-wider text-black/40 uppercase'>
                  Quizzes
                </p>
              </div>
              <div className='rounded-2xl border border-black/5 bg-[#f7f6ef] p-4 text-center'>
                <Target size={24} className='mx-auto mb-2 text-[#5A5A40]' />
                <p className='text-2xl font-bold text-[#1a1a1a]'>
                  {profile.stats.averageScore}%
                </p>
                <p className='text-xs font-bold tracking-wider text-black/40 uppercase'>
                  Score
                </p>
              </div>
            </div>
          </div>
        </div>
      </motion.section>

      {isOwner && createdCourses.length > 0 && (
        <section className='mt-8'>
          <h2 className='mb-6 flex items-center gap-2 font-serif text-2xl text-[#1a1a1a]'>
            <FolderOpen size={24} className='text-[#5A5A40]' />
            My Contributions
          </h2>
          <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
            {createdCourses.map((courseItem) => (
              <Link
                key={courseItem.course.id}
                to={`/courses/${courseItem.course.id}`}
                className='group relative overflow-hidden rounded-2xl border border-black/5 bg-white p-5 shadow-sm transition-all hover:shadow-md'
              >
                {courseItem.course.thumbnailKey && (
                  <div className='absolute inset-0 opacity-5'>
                    <img
                      src={`/api/course/serve/${courseItem.course.thumbnailKey}`}
                      alt=''
                      className='h-full w-full object-cover'
                    />
                  </div>
                )}
                <div className='relative'>
                  <p className='mb-1 text-[10px] font-bold tracking-[0.18em] text-[#5A5A40] uppercase'>
                    {courseItem.course.code} • {courseItem.course.category}
                  </p>
                  <h3 className='mb-2 line-clamp-2 font-medium text-[#1a1a1a] group-hover:text-[#5A5A40]'>
                    {courseItem.course.title}
                  </h3>
                  <div className='flex items-center justify-between'>
                    <div className='flex items-center gap-2 text-xs text-black/40'>
                      <span>{courseItem.course.status}</span>
                      <span>•</span>
                      <Calendar size={14} />
                      <span>
                        Created {formatDate(courseItem.course.createdAt)}
                      </span>
                    </div>
                    <ChevronRight
                      size={16}
                      className='text-black/20 group-hover:text-[#5A5A40]'
                    />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {enrolledCourses.length > 0 && (
        <section className='mt-8'>
          <h2 className='mb-6 font-serif text-2xl text-[#1a1a1a]'>
            Enrolled Courses
          </h2>
          <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
            {enrolledCourses.map((enrollment) => (
              <Link
                key={enrollment.id}
                to={`/courses/${enrollment.course.id}`}
                className='group relative overflow-hidden rounded-2xl border border-black/5 bg-white p-5 shadow-sm transition-all hover:shadow-md'
              >
                {enrollment.course.thumbnailKey && (
                  <div className='absolute inset-0 opacity-5'>
                    <img
                      src={`/api/course/serve/${enrollment.course.thumbnailKey}`}
                      alt=''
                      className='h-full w-full object-cover'
                    />
                  </div>
                )}
                <div className='relative'>
                  <p className='mb-1 text-[10px] font-bold tracking-[0.18em] text-[#5A5A40] uppercase'>
                    {enrollment.course.code} • {enrollment.course.category}
                  </p>
                  <h3 className='mb-2 line-clamp-2 font-medium text-[#1a1a1a] group-hover:text-[#5A5A40]'>
                    {enrollment.course.title}
                  </h3>
                  <div className='flex items-center justify-between'>
                    <div className='flex items-center gap-2 text-xs text-black/40'>
                      <Calendar size={14} />
                      <span>Enrolled {formatDate(enrollment.enrolledAt)}</span>
                    </div>
                    <ChevronRight
                      size={16}
                      className='text-black/20 group-hover:text-[#5A5A40]'
                    />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {isOwner && bookmarkedUnits.length > 0 && (
        <section className='mt-8'>
          <h2 className='mb-6 font-serif text-2xl text-[#1a1a1a]'>
            Bookmarked Units
          </h2>
          <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
            {bookmarkedUnits.map((bookmarkedUnit) => (
              <BookmarkedUnitCard
                key={bookmarkedUnit.bookmark.id}
                bookmarkedUnit={bookmarkedUnit}
                formatDate={formatDate}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
