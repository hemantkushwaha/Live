import React from 'react';
import { Activity, AlertCircle, CheckCircle2, Clock } from 'lucide-react';
import { PeerConnectionState } from '../../webrtc/peer/PeerConnectionManager';

interface ConnectionIndicatorProps {
  state: PeerConnectionState;
  className?: string;
}

export const ConnectionIndicator: React.FC<ConnectionIndicatorProps> = ({ state, className = '' }) => {
  const getStatusDetails = () => {
    switch (state) {
      case 'connected':
        return {
          label: 'Connected',
          subLabel: 'Direct P2P Stream',
          color: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20 dark:text-emerald-400',
          dotColor: 'bg-emerald-500',
          icon: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />,
        };
      case 'connecting':
        return {
          label: 'Connecting',
          subLabel: 'WebRTC Handshake',
          color: 'bg-amber-500/10 text-amber-600 border-amber-500/20 dark:text-amber-400',
          dotColor: 'bg-amber-500 animate-pulse',
          icon: <Clock className="w-3.5 h-3.5 text-amber-500 animate-spin" />,
        };
      case 'disconnected':
        return {
          label: 'Disconnected',
          subLabel: 'Reconnecting...',
          color: 'bg-orange-500/10 text-orange-600 border-orange-500/20 dark:text-orange-400',
          dotColor: 'bg-orange-500',
          icon: <Activity className="w-3.5 h-3.5 text-orange-500" />,
        };
      case 'failed':
        return {
          label: 'Connection Failed',
          subLabel: 'ICE Timeout',
          color: 'bg-rose-500/10 text-rose-600 border-rose-500/20 dark:text-rose-400',
          dotColor: 'bg-rose-500',
          icon: <AlertCircle className="w-3.5 h-3.5 text-rose-500" />,
        };
      default:
        return {
          label: 'Initializing',
          subLabel: 'Signaling',
          color: 'bg-slate-500/10 text-slate-600 border-slate-500/20 dark:text-slate-400',
          dotColor: 'bg-slate-400',
          icon: <Clock className="w-3.5 h-3.5 text-slate-400" />,
        };
    }
  };

  const details = getStatusDetails();

  return (
    <div
      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-medium backdrop-blur-sm ${details.color} ${className}`}
      id="connection-indicator-badge"
    >
      <span className={`w-2 h-2 rounded-full ${details.dotColor}`} />
      <span className="font-semibold">{details.label}</span>
      <span className="opacity-70 text-[11px] font-normal border-l border-current/20 pl-2">{details.subLabel}</span>
    </div>
  );
};
