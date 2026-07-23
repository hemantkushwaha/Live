import React from 'react';
import { Video, PhoneOff, Check, X } from 'lucide-react';
import { useSocket } from '../../contexts/SocketContext';

export const CallRequestModal: React.FC = () => {
  const { incomingCallRequest, respondPrivateCall, clearIncomingRequest } = useSocket();

  if (!incomingCallRequest) return null;

  const handleAccept = async () => {
    try {
      await respondPrivateCall(incomingCallRequest.id, true);
    } catch (err) {
      console.error('Failed to accept call request:', err);
    }
  };

  const handleDecline = async () => {
    try {
      await respondPrivateCall(incomingCallRequest.id, false);
    } catch (err) {
      console.error('Failed to decline call request:', err);
      clearIncomingRequest();
    }
  };

  return (
    <div className="fixed inset-x-0 top-4 z-50 flex justify-center px-4 animate-in fade-in slide-in-from-top-4 duration-300">
      <div className="bg-slate-900 text-white border border-slate-700 shadow-2xl rounded-2xl p-4 max-w-md w-full flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-purple-500/20 text-purple-400 rounded-xl animate-bounce">
            <Video className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-semibold text-sm text-slate-100">Private 1-on-1 Call Request</h4>
            <p className="text-xs text-slate-400">
              <span className="font-medium text-purple-300">{incomingCallRequest.viewerName}</span> ({incomingCallRequest.viewerEmail}) wants to talk privately.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleDecline}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
            title="Decline"
          >
            <X className="w-5 h-5 text-rose-400" />
          </button>
          <button
            onClick={handleAccept}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg shadow-lg shadow-emerald-600/30 transition-all"
          >
            <Check className="w-4 h-4" />
            Accept
          </button>
        </div>
      </div>
    </div>
  );
};
