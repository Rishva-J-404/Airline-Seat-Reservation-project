import React from 'react';

type ComplexityVariant = 'good' | 'medium' | 'bad';

interface ComplexityBadgeProps {
  label: string;
  complexity: string;
  variant?: ComplexityVariant;
}

const variantStyles: Record<ComplexityVariant, { badge: string; text: string }> = {
  good: { badge: 'bg-emerald-100 border-emerald-200', text: 'text-emerald-700' },
  medium: { badge: 'bg-amber-100 border-amber-200', text: 'text-amber-700' },
  bad: { badge: 'bg-red-100 border-red-200', text: 'text-red-700' },
};

export const ComplexityBadge: React.FC<ComplexityBadgeProps> = ({
  label,
  complexity,
  variant = 'good',
}) => {
  const styles = variantStyles[variant];
  return (
    <div
      className={[
        'inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-medium',
        styles.badge,
      ].join(' ')}
    >
      <span className="text-slate-600">{label}:</span>
      <span className={['font-mono font-bold', styles.text].join(' ')}>{complexity}</span>
    </div>
  );
};

interface ComplexityItem {
  label: string;
  complexity: string;
  variant?: ComplexityVariant;
}

interface ComplexityPanelProps {
  title?: string;
  items: ComplexityItem[];
}

export const ComplexityPanel: React.FC<ComplexityPanelProps> = ({
  title = 'Complexity Analysis',
  items,
}) => {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">
        {title}
      </p>
      <div className="flex flex-wrap gap-2">
        {items.map((item, i) => (
          <ComplexityBadge
            key={i}
            label={item.label}
            complexity={item.complexity}
            variant={item.variant ?? 'good'}
          />
        ))}
      </div>
    </div>
  );
};
