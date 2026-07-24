import React from 'react';
import { ShieldAlert, RefreshCw, X, AlertTriangle, Camera, Mic, Info } from 'lucide-react';
import { useMedia } from '../../contexts/MediaContext';

export const PermissionDialog: React.FC = () => {
  const { permissionError, startPreview, stopPreview, isInitializing } = useMedia();

  if (!permissionError) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-5 animate-in zoom-in-95 duration-200">
        {/* Header Icon & Title */}
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 shrink-0">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight">Camera & Microphone Access Error</h2>
            <p className="text-xs text-slate-400 mt-1">
              Unable to initialize local media devices for live preview.
            </p>
          </div>
        </div>

        {/* Error Detail Box */}
        <div className="p-3.5 bg-rose-950/30 border border-rose-500/20 rounded-xl text-xs text-rose-300 font-medium space-y-1">
          <div className="flex items-center gap-1.5 font-semibold text-rose-200">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>Error details:</span>
          </div>
          <p className="pl-5 leading-relaxed">{permissionError}</p>
        </div>

        {/* Helpful Troubleshooting Advice */}
        <div className="space-y-2 bg-slate-950/60 p-3.5 rounded-xl border border-slate-800/80 text-xs text-slate-300">
          <p className="font-semibold text-slate-200 flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 text-indigo-400" /> Troubleshooting Checklist:
          </p>
          <ul className="list-disc list-inside space-y-1 text-[11px] text-slate-400 pl-1">
            <li className="flex items-start gap-2">
              <Camera className="w-3.5 h-3.5 text-slate-500 shrink-0 mt-0.5" />
              <span>Ensure browser camera & mic permissions are set to "Allow".</span>
            </li>
            <li className="flex items-start gap-2">
              <Mic className="w-3.5 h-3.5 text-slate-500 shrink-0 mt-0.5" />
              <span>Verify camera or microphone is not actively used by another app.</span>
            </li>
            <li className="flex items-start gap-2">
              <RefreshCw className="w-3.5 h-3.5 text-slate-500 shrink-0 mt-0.5" />
              <span>Try re-plugging external USB camera/mic devices.</span>
            </li>
          </ul>
        </div>

        {/* Actions Bar */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            onClick={stopPreview}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-xs font-medium transition-all"
          >
            Cancel
          </button>

          <button
            onClick={() => startPreview()}
            disabled={isInitializing}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-600 text-white text-xs font-semibold shadow-lg shadow-indigo-600/20 transition-all disabled:opacity-50"
          >
            {isInitializing ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
            <span>Retry Permissions</span>
          </button>
        </div>
      </div>
    </div>
  );
};
