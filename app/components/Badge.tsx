import type { ReactNode } from 'react';

type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'outline';

type BadgeProps = {
  variant?: BadgeVariant;
  children: ReactNode;
  className?: string;
};

const variantStyles: Record<BadgeVariant, string> = {
  default: 'bg-black/5 text-black/45',
  success: 'bg-green-100 text-green-700',
  warning: 'bg-orange-100 text-orange-600',
  danger: 'bg-red-100 text-red-700',
  outline: 'border border-black/10 text-black/60',
};

export const Badge = ({
  variant = 'default',
  children,
  className = '',
}: BadgeProps) => {
  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-bold tracking-wider uppercase ${variantStyles[variant]} ${className}`}
    >
      {children}
    </span>
  );
};

type LabelBadgeProps = {
  children: ReactNode;
  className?: string;
};

export const LabelBadge = ({ children, className = '' }: LabelBadgeProps) => {
  return (
    <span
      className={`text-[11px] font-bold tracking-[0.18em] text-black/35 uppercase ${className}`}
    >
      {children}
    </span>
  );
};
