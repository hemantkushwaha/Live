import React from 'react';
import { UserStatus } from '../../types';

interface StatusBadgeProps {
  status: UserStatus;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  let colorBg = 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20';
  let label = 'Online';

  if (status === 'streaming') {
    colorBg = 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20 animate-pulse';
    label = 'Live Streaming';
  } else if (status === 'watching') {
    colorBg = 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20';
    label = 'Watching Stream';
  } else if (status === 'in_private_call') {
    colorBg = 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20';
    label = 'In Private Call';
  }

  const padding = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs';

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full font-medium border ${colorBg} ${padding}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${
        status === 'streaming' ? 'bg-rose-500 animate-ping' :
        status === 'in_private_call' ? 'bg-purple-500' :
        status === 'watching' ? 'bg-sky-500' : 'bg-emerald-500'
      }`} />
      {label}
    </span>
  );
};
