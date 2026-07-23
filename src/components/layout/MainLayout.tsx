import React, { ReactNode } from 'react';
import { Navbar } from './Navbar';
import { CallRequestModal } from '../ui/CallRequestModal';

export const MainLayout: React.FC<{ children: ReactNode }> = ({ children }) => {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans antialiased selection:bg-indigo-500 selection:text-white">
      <Navbar />
      <CallRequestModal />
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {children}
      </main>
    </div>
  );
};
