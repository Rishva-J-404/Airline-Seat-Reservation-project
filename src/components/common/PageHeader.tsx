import React from 'react';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  accent?: string;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  subtitle,
  icon,
  action,
}) => {
  return (
    <div className="flex items-start justify-between gap-6 mb-8">
      <div className="flex items-start gap-3.5 min-w-0">
        {icon && (
          <div className="w-10 h-10 rounded-lg bg-aero-950 flex items-center justify-center text-white shrink-0 shadow-sm mt-0.5">
            {icon}
          </div>
        )}
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold text-aero-950 font-display leading-tight truncate">
            {title}
          </h1>
          {subtitle && (
            <p className="mt-1 text-xs sm:text-sm text-slate-500 leading-snug">{subtitle}</p>
          )}
        </div>
      </div>
      {action && <div className="shrink-0 flex items-center gap-2">{action}</div>}
    </div>
  );
};
