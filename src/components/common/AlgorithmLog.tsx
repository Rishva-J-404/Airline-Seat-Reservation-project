import React from 'react';
import { List, Activity, GitBranch, ArrowDownUp, Cpu, ScrollText } from 'lucide-react';
import { useApp } from '../../context/AppContext';

type LogType = 'queue' | 'linkedlist' | 'bst' | 'sort' | 'ai';

const typeIcon: Record<LogType, React.ReactNode> = {
  queue: <List size={14} />,
  linkedlist: <Activity size={14} />,
  bst: <GitBranch size={14} />,
  sort: <ArrowDownUp size={14} />,
  ai: <Cpu size={14} />,
};

const typeColor: Record<LogType, string> = {
  queue: 'bg-queue-100 text-queue-600',
  linkedlist: 'll-100 text-ll-600',
  bst: 'bg-bst-100 text-bst-600',
  sort: 'bg-sort-100 text-sort-600',
  ai: 'bg-ai-100 text-ai-600',
};

function getIcon(type: string): React.ReactNode {
  return typeIcon[type as LogType] ?? <List size={14} />;
}

function getColor(type: string): string {
  return typeColor[type as LogType] ?? 'bg-slate-100 text-slate-600';
}

export const AlgorithmLog: React.FC = () => {
  const { state } = useApp();
  const log = state.algorithmLog ?? [];

  if (log.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-center gap-3">
        <ScrollText size={32} className="text-slate-300" />
        <p className="text-sm text-slate-400 font-medium">No activity yet</p>
        <p className="text-xs text-slate-300 max-w-xs">
          Interact with any DSA module to see algorithm operations logged here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
      {[...log].reverse().map((entry, i) => (
        <div
          key={i}
          className="flex items-start gap-3 p-3 rounded-lg bg-slate-50 border border-slate-100 hover:bg-slate-100 transition-colors"
        >
          {/* Icon chip */}
          <span
            className={[
              'mt-0.5 flex items-center justify-center w-6 h-6 rounded-md shrink-0 font-medium',
              getColor(entry.type),
            ].join(' ')}
          >
            {getIcon(entry.type)}
          </span>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-slate-700 truncate">{entry.operation}</p>
            {entry.detail && (
              <p className="text-xs text-slate-500 mt-0.5 break-words">{entry.detail}</p>
            )}
          </div>

          {/* Timestamp */}
          {entry.timestamp && (
            <span className="text-[10px] text-slate-400 shrink-0 mt-0.5 whitespace-nowrap">
              {new Date(entry.timestamp).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
              })}
            </span>
          )}
        </div>
      ))}
    </div>
  );
};
