import React from 'react';
import { Radio, Home, Search, Compass, AlertOctagon } from 'lucide-react';

interface NotFoundPageProps {
  onNavigateHome: () => void;
}

export const NotFoundPage: React.FC<NotFoundPageProps> = ({ onNavigateHome }) => {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center space-y-6 animate-in fade-in zoom-in-95 duration-200" id="404-page">
      <div className="w-20 h-20 rounded-3xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shadow-2xl">
        <AlertOctagon className="w-10 h-10 animate-pulse" />
      </div>

      <div className="space-y-2 max-w-md">
        <span className="px-3 py-1 rounded-full text-xs font-bold font-mono bg-rose-500/10 text-rose-400 border border-rose-500/20 uppercase tracking-widest">
          Error 404
        </span>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">Page Not Found</h1>
        <p className="text-sm text-slate-400 leading-relaxed">
          The requested page or route does not exist or may have been moved.
        </p>
      </div>

      <div className="flex items-center gap-3 pt-2">
        <button
          onClick={onNavigateHome}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-xs font-bold text-white shadow-xl shadow-indigo-600/30 transition-all cursor-pointer"
          id="return-home-404-btn"
        >
          <Home className="w-4 h-4" />
          <span>Return to Home</span>
        </button>
      </div>
    </div>
  );
};
