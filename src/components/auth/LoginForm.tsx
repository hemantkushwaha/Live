import React, { useState } from 'react';
import { Mail, ArrowRight, Loader2, AlertCircle, Radio } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { APP_NAME, APP_VERSION } from '../../../shared/constants/constants';

interface LoginFormProps {
  onSuccess?: () => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({ onSuccess }) => {
  const [email, setEmail] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login, error: serverError, clearError } = useAuth();

  const validateEmail = (input: string): string | null => {
    if (!input || input.trim().length === 0) {
      return 'Email address is required';
    }
    const trimmed = input.trim();
    if (trimmed.length === 0) {
      return 'Email address cannot be whitespace only';
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmed)) {
      return 'Please enter a valid email address (e.g. name@domain.com)';
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    setValidationError(null);

    const errorMsg = validateEmail(email);
    if (errorMsg) {
      setValidationError(errorMsg);
      return;
    }

    setIsSubmitting(true);
    try {
      await login(email);
      if (onSuccess) {
        onSuccess();
      }
    } catch {
      // Error handled by AuthContext state
    } finally {
      setIsSubmitting(false);
    }
  };

  const activeError = validationError || serverError;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-6 font-sans">
      <div className="w-full max-w-md space-y-8">
        {/* Branding Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 shadow-inner">
            <Radio className="w-7 h-7 animate-pulse text-indigo-400" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-white">{APP_NAME}</h1>
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 mt-1">
              Version {APP_VERSION} &bull; Email Authentication
            </p>
          </div>
        </div>

        {/* Login Card */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl backdrop-blur-sm">
          <div className="mb-6 space-y-1">
            <h2 className="text-xl font-semibold text-white">Welcome to LiveConnect</h2>
            <p className="text-sm text-slate-400">
              Enter your email address below to join or continue your session.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            {/* Email Field */}
            <div className="space-y-2">
              <label htmlFor="email-input" className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-5 h-5" />
                </div>
                <input
                  id="email-input"
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (validationError) setValidationError(null);
                    if (serverError) clearError();
                  }}
                  placeholder="user@example.com"
                  disabled={isSubmitting}
                  autoFocus
                  className={`w-full pl-11 pr-4 py-3 bg-slate-950 border rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 transition-all ${
                    activeError
                      ? 'border-rose-500/80 focus:ring-rose-500/30'
                      : 'border-slate-800 focus:border-indigo-500 focus:ring-indigo-500/20'
                  }`}
                />
              </div>
            </div>

            {/* Validation / Server Error Message */}
            {activeError && (
              <div className="flex items-start gap-2.5 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs leading-relaxed animate-in fade-in duration-200">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{activeError}</span>
              </div>
            )}

            {/* Submit / Continue Button */}
            <button
              id="submit-login"
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 px-5 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-medium rounded-xl shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2 transition-all duration-150 disabled:opacity-60 disabled:cursor-not-allowed text-sm"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Authenticating...</span>
                </>
              ) : (
                <>
                  <span>Continue</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-slate-800/80 text-center text-xs text-slate-500">
            No password required &bull; Simple email verification MVP
          </div>
        </div>
      </div>
    </div>
  );
};
