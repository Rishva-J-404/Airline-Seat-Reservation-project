import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  padding?: boolean;
}

export const Card: React.FC<CardProps> = ({ children, padding = true, className = '', ...rest }) => {
  return (
    <div
      className={[
        'bg-white rounded-xl shadow-subtle border border-slate-200',
        padding ? 'p-6' : '',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      {...rest}
    >
      {children}
    </div>
  );
};

interface CardHeaderProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  icon?: React.ReactNode;
  accentColor?: string;
}

export const CardHeader: React.FC<CardHeaderProps> = ({
  title,
  subtitle,
  action,
  icon,
  accentColor = 'text-brand-600',
}) => {
  return (
    <div className="flex items-start justify-between gap-4 mb-4">
      <div className="flex items-start gap-3 min-w-0">
        {icon && (
          <span className={['shrink-0 mt-0.5', accentColor].join(' ')}>
            {icon}
          </span>
        )}
        <div className="min-w-0">
          <h3 className="text-base font-semibold text-slate-800 leading-tight truncate">{title}</h3>
          {subtitle && (
            <p className="mt-0.5 text-sm text-slate-500 leading-snug">{subtitle}</p>
          )}
        </div>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
};
