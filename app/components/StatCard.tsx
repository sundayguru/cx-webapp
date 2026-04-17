import type { ReactNode } from 'react';

type StatCardProps = {
  icon: ReactNode;
  label: string;
  value: string | number;
  variant?: 'default' | 'interactive';
  onClick?: () => void;
  className?: string;
};

export const StatCard = ({
  icon,
  label,
  value,
  variant = 'default',
  onClick,
  className = '',
}: StatCardProps) => {
  const baseStyles =
    'rounded-[24px] border border-black/5 bg-[#f7f6ef] p-5 cursor-default';

  const interactiveStyles =
    variant === 'interactive'
      ? 'bg-[#5A5A40] text-white shadow-lg shadow-[#5A5A40]/20 transition-all hover:bg-[#4a4a35] cursor-pointer'
      : '';

  const iconContainerStyles =
    variant === 'interactive'
      ? 'bg-white/15 text-white backdrop-blur-sm'
      : 'bg-white text-[#5A5A40] shadow-sm';

  const content = (
    <>
      <div
        className={`mb-3 flex h-11 w-11 items-center justify-center rounded-2xl ${iconContainerStyles}`}
      >
        {icon}
      </div>
      <p className='text-xs font-bold tracking-[0.18em] text-black/35 uppercase'>
        {label}
      </p>
      <p className='mt-2 text-lg font-semibold text-[#1a1a1a]'>{value}</p>
    </>
  );

  if (variant === 'interactive' && onClick) {
    return (
      <button
        onClick={onClick}
        className={`${baseStyles} ${interactiveStyles} text-left ${className}`}
      >
        {content}
      </button>
    );
  }

  return <div className={`${baseStyles} ${className}`}>{content}</div>;
};

type StatCardGridProps = {
  children: ReactNode;
  columns?: 1 | 2 | 4;
  className?: string;
};

export const StatCardGrid = ({
  children,
  columns = 4,
  className = '',
}: StatCardGridProps) => {
  const gridStyles = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 sm:grid-cols-2',
    4: 'grid-cols-1 sm:grid-cols-2 xl:grid-cols-4',
  };

  return (
    <div className={`grid ${gridStyles[columns]} gap-4 ${className}`}>
      {children}
    </div>
  );
};
