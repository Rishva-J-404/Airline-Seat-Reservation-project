import React from 'react';
import { Loader2 } from 'lucide-react';

interface SpinnerProps {
  size?: number;
  className?: string;
}

export const Spinner: React.FC<SpinnerProps> = ({ size = 20, className = '' }) => {
  return (
    <Loader2
      size={size}
      className={['animate-spin text-brand-500', className].filter(Boolean).join(' ')}
    />
  );
};

export const PageLoader: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
      <Loader2 size={40} className="animate-spin text-brand-500" />
      <p className="text-sm text-slate-500 font-medium">Loading...</p>
    </div>
  );
};
