import React from 'react';

type BadgeVariant =
  | 'default'
  | 'success'
  | 'warning'
  | 'danger'
  | 'queue'
  | 'll'
  | 'bst'
  | 'sort'
  | 'ai'
  | 'info';

type BadgeSize = 'sm' | 'md';

interface BadgeProps {
  variant?: BadgeVariant;
  size?: BadgeSize;
  dot?: boolean;
  children: React.ReactNode;
  className?: string;
}

const variantClass: Record<BadgeVariant, string> = {
  default: 'bg-slate-100 text-slate-800 border border-slate-200',
  success: 'bg-emerald-50 text-emerald-900 border border-emerald-200',
  warning: 'bg-amber-50 text-amber-900 border border-amber-200',
  danger: 'bg-rose-50 text-rose-900 border border-rose-200',
  queue: 'bg-slate-100 text-slate-800 border border-slate-200 font-mono',
  ll: 'bg-sky-50 text-sky-900 border border-sky-200 font-mono',
  bst: 'bg-orange-50 text-orange-900 border border-orange-200 font-mono',
  sort: 'bg-purple-50 text-purple-900 border border-purple-200 font-mono',
  ai: 'bg-emerald-50 text-emerald-900 border border-emerald-200 font-mono',
  info: 'bg-blue-50 text-blue-900 border border-blue-200',
};

const dotColor: Record<BadgeVariant, string> = {
  default: 'bg-slate-500',
  success: 'bg-emerald-600',
  warning: 'bg-amber-600',
  danger: 'bg-rose-600',
  queue: 'bg-slate-600',
  ll: 'bg-sky-600',
  bst: 'bg-orange-600',
  sort: 'bg-purple-600',
  ai: 'bg-emerald-600',
  info: 'bg-blue-600',
};

const sizeClass: Record<BadgeSize, string> = {
  sm: 'px-2 py-0.5 text-xs gap-1.5',
  md: 'px-2.5 py-1 text-sm gap-2',
};

export const Badge: React.FC<BadgeProps> = ({
  variant = 'default',
  size = 'sm',
  dot = false,
  children,
  className = '',
}) => {
  return (
    <span
      className={[
        'inline-flex items-center font-medium rounded-full leading-none',
        variantClass[variant],
        sizeClass[size],
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {dot && (
        <span
          className={['inline-block rounded-full shrink-0', dotColor[variant], size === 'sm' ? 'w-1.5 h-1.5' : 'w-2 h-2'].join(' ')}
        />
      )}
      {children}
    </span>
  );
};
