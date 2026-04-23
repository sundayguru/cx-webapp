import { Link } from 'react-router';
import { Bookmark, Calendar, ChevronRight } from 'lucide-react';
import type { BookmarkedUnit } from '~/db/bookmarks';

type BookmarkedUnitCardProps = {
  bookmarkedUnit: BookmarkedUnit;
  formatDate: (dateStr: string) => string;
};

export const BookmarkedUnitCard = ({
  bookmarkedUnit,
  formatDate,
}: BookmarkedUnitCardProps) => (
  <Link
    to={`/courses/${bookmarkedUnit.course.id}/units/${bookmarkedUnit.unit.id}`}
    className='group relative overflow-hidden rounded-2xl border border-black/5 bg-white p-5 shadow-sm transition-all hover:shadow-md'
  >
    <div className='absolute inset-0 opacity-5'>
      <img
        src={
          bookmarkedUnit.course.thumbnailKey
            ? `/api/course/serve/${bookmarkedUnit.course.thumbnailKey}`
            : `https://picsum.photos/seed/${bookmarkedUnit.course.id}/700/500`
        }
        alt=''
        className='h-full w-full object-cover'
      />
    </div>
    <div className='relative'>
      <p className='mb-1 text-[10px] font-bold tracking-[0.18em] text-[#5A5A40] uppercase'>
        {bookmarkedUnit.course.code} • {bookmarkedUnit.module.title}
      </p>
      <h3 className='mb-2 line-clamp-2 font-medium text-[#1a1a1a] group-hover:text-[#5A5A40]'>
        {bookmarkedUnit.unit.title}
      </h3>
      <p className='mb-4 line-clamp-2 text-sm text-black/45'>
        {bookmarkedUnit.unit.summary || bookmarkedUnit.course.title}
      </p>
      <div className='flex items-center justify-between'>
        <div className='flex items-center gap-2 text-xs text-black/40'>
          <Bookmark size={14} />
          <span>Saved {formatDate(bookmarkedUnit.bookmark.createdAt)}</span>
          <span>•</span>
          <Calendar size={14} />
          <span>{bookmarkedUnit.course.category}</span>
        </div>
        <ChevronRight
          size={16}
          className='text-black/20 group-hover:text-[#5A5A40]'
        />
      </div>
    </div>
  </Link>
);
