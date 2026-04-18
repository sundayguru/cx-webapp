import { Link, useLoaderData, redirect } from 'react-router';
import type { Route } from './+types/profile';
import { getPublicProfile, type PublicUserProfile } from '~/db/profile';
import {
  getUserEnrollments,
  type UserEnrollmentWithCourse,
} from '~/db/enrollments';
import { getUserFromRequest } from '~/utils/session.server';
import { motion } from 'motion/react';
import {
  BookOpen,
  GraduationCap,
  Target,
  Calendar,
  Mail,
  ChevronRight,
  Settings,
} from 'lucide-react';

type LoaderData = {
  profile: PublicUserProfile;
  enrolledCourses: UserEnrollmentWithCourse[];
  isOwner: boolean;
};

export const loader = async ({ request }: Route.LoaderArgs) => {
  const currentUser = await getUserFromRequest(request);

  if (!currentUser) {
    return redirect('/login');
  }

  const profile = await getPublicProfile(currentUser.id);
  if (!profile) {
    return redirect('/dashboard');
  }

  const enrolledCourses = await getUserEnrollments(currentUser.id);

  return {
    profile,
    enrolledCourses: enrolledCourses.slice(0, 6),
    isOwner: true,
  };
};

export default function ProfilePage({ loaderData }: Route.ComponentProps) {
  const { profile, enrolledCourses } = loaderData;
console.log("profile", profile)
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
              <Link
                to='/settings'
                className='rounded-full border border-black/10 p-2 text-black/40 transition-colors hover:bg-black/5 hover:text-black/60'
              >
                <Settings size={20} />
              </Link>
            </div>
            <div className='mb-4 flex items-center justify-center gap-2 text-black/50 md:justify-start'>
              <Mail size={16} />
              <span>{profile.email}</span>
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
    </div>
  );
}
