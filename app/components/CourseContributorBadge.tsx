import { Link } from 'react-router';
import type { CourseContributor } from '~/types/course';

type CourseContributorBadgeProps = {
  contributor: CourseContributor;
  variant?: 'card' | 'detail';
};

const getInitials = (contributor: CourseContributor) =>
  `${contributor.firstName.charAt(0)}${contributor.lastName.charAt(0)}`.toUpperCase();

const getContributorName = (contributor: CourseContributor) =>
  `${contributor.firstName} ${contributor.lastName}`.trim();

export const CourseContributorBadge = ({
  contributor,
  variant = 'detail',
}: CourseContributorBadgeProps) => {
  const contributorName = getContributorName(contributor);
  const wrapperClassName =
    variant === 'detail'
      ? 'flex items-center gap-3 rounded-2xl bg-black/[0.02] px-4 py-3 transition-colors hover:bg-black/[0.04]'
      : 'flex min-w-0 items-center gap-3 transition-colors hover:text-[#5A5A40]';

  const content = (
    <>
      {contributor.avatarUrl ? (
        <img
          src={contributor.avatarUrl}
          alt={contributorName}
          className={
            variant === 'detail'
              ? 'h-10 w-10 rounded-full object-cover'
              : 'h-8 w-8 rounded-full object-cover'
          }
        />
      ) : (
        <div
          className={
            variant === 'detail'
              ? 'flex h-10 w-10 items-center justify-center rounded-full bg-[#5A5A40]/10 text-xs font-bold text-[#5A5A40]'
              : 'flex h-8 w-8 items-center justify-center rounded-full bg-[#5A5A40]/10 text-[11px] font-bold text-[#5A5A40]'
          }
        >
          {getInitials(contributor)}
        </div>
      )}
      <div className='min-w-0'>
        <p className='text-[10px] font-bold tracking-widest text-black/40 uppercase'>
          Contributor
        </p>
        <p className='truncate font-medium text-[#1a1a1a]'>{contributorName}</p>
      </div>
    </>
  );

  if (contributor.isPrivate) {
    return <div className={wrapperClassName}>{content}</div>;
  }

  return (
    <Link to={`/profile/${contributor.id}`} className={wrapperClassName}>
      {content}
    </Link>
  );
};
