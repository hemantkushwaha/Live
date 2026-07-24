import React, { useEffect, useState } from 'react';
import { Loader2, Radio } from 'lucide-react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { LoginForm } from './components/auth/LoginForm';
import { LobbyPage } from './components/lobby/LobbyPage';

function AppContent() {
  const { isAuthenticated, isLoading } = useAuth();
  const [currentPath, setCurrentPath] = useState<string>(
    typeof window !== 'undefined' ? window.location.pathname || '/' : '/'
  );

  // Synchronize route pathname and history
  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname || '/');
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Protected route redirection logic
  useEffect(() => {
    if (isLoading) return;

    if (!isAuthenticated && currentPath !== '/login') {
      window.history.replaceState(null, '', '/login');
      setCurrentPath('/login');
    } else if (isAuthenticated && currentPath === '/login') {
      window.history.replaceState(null, '', '/');
      setCurrentPath('/');
    }
  }, [isAuthenticated, isLoading, currentPath]);

  // Loading indicator during session restoration
  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-6 font-sans">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center shadow-lg">
            <Radio className="w-6 h-6 animate-pulse" />
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-400 font-medium">
            <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />
            <span>Restoring session...</span>
          </div>
        </div>
      </div>
    );
  }

  // Render view according to auth state
  if (!isAuthenticated || currentPath === '/login') {
    return (
      <LoginForm
        onSuccess={() => {
          window.history.pushState(null, '', '/');
          setCurrentPath('/');
        }}
      />
    );
  }

  return <LobbyPage />;
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
