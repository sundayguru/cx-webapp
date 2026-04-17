import type { ReactNode } from 'react';

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
