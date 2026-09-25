import type React from 'react';
import type { RequestPriority, RequestStatus } from '../../types';

interface StatusBadgeProps {
  status: RequestStatus | string;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'sm' }) => {
  const normStatus = (status || '').toUpperCase();

  const configs: Record<string, { bg: string; text: string; border: string; dot: string; label: string }> = {
    NEW: {
      bg: 'bg-sky-50',
      text: 'text-sky-700',
      border: 'border-sky-200',
      dot: 'bg-sky-500 animate-pulse',
      label: 'New Request',
    },
    ASSIGNED: {
      bg: 'bg-indigo-50',
      text: 'text-indigo-700',
      border: 'border-indigo-200',
      dot: 'bg-indigo-500',
      label: 'Assigned',
    },
    IN_PROGRESS: {
      bg: 'bg-amber-50',
      text: 'text-amber-700',
      border: 'border-amber-200',
      dot: 'bg-amber-500 animate-spin',
      label: 'In Progress',
    },
    ON_HOLD: {
      bg: 'bg-orange-50',
      text: 'text-orange-700',
      border: 'border-orange-200',
      dot: 'bg-orange-500',
      label: 'On Hold',
    },
    RESOLVED: {
      bg: 'bg-emerald-50',
      text: 'text-emerald-700',
      border: 'border-emerald-200',
      dot: 'bg-emerald-500',
      label: 'Resolved',
    },
    CLOSED: {
      bg: 'bg-slate-100',
      text: 'text-slate-700',
      border: 'border-slate-300',
      dot: 'bg-slate-400',
      label: 'Closed',
    },
    CANCELLED: {
      bg: 'bg-rose-50',
      text: 'text-rose-700',
      border: 'border-rose-200',
      dot: 'bg-rose-500',
      label: 'Cancelled',
    },
  };

  const current = configs[normStatus] || {
    bg: 'bg-slate-50',
    text: 'text-slate-700',
    border: 'border-slate-200',
    dot: 'bg-slate-400',
    label: normStatus,
  };

  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-sm font-medium';

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border ${current.border} ${current.bg} ${current.text} font-medium tracking-tight ${sizeClasses}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${current.dot}`} />
      <span>{current.label}</span>
    </span>
  );
};

interface PriorityBadgeProps {
  priority: RequestPriority | string;
  size?: 'sm' | 'md';
}

export const PriorityBadge: React.FC<PriorityBadgeProps> = ({ priority, size = 'sm' }) => {
  const normPriority = (priority || '').toUpperCase();

  const configs: Record<string, { bg: string; text: string; border: string; label: string }> = {
    CRITICAL: {
      bg: 'bg-rose-100/70',
      text: 'text-rose-800',
      border: 'border-rose-300',
      label: 'CRITICAL',
    },
    HIGH: {
      bg: 'bg-orange-100/70',
      text: 'text-orange-800',
      border: 'border-orange-300',
      label: 'HIGH',
    },
    MEDIUM: {
      bg: 'bg-yellow-50',
      text: 'text-amber-800',
      border: 'border-amber-200',
      label: 'MEDIUM',
    },
    LOW: {
      bg: 'bg-emerald-50',
      text: 'text-emerald-800',
      border: 'border-emerald-200',
      label: 'LOW',
    },
  };

  const current = configs[normPriority] || {
    bg: 'bg-slate-100',
    text: 'text-slate-700',
    border: 'border-slate-200',
    label: normPriority,
  };

  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs';

  return (
    <span
      className={`inline-flex items-center font-semibold rounded border ${current.border} ${current.bg} ${current.text} ${sizeClasses} tracking-wider uppercase`}
    >
      {current.label}
    </span>
  );
};
