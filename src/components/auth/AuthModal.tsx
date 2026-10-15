import React, { useState } from 'react';
import { useApp } from '../../context/AppContext.tsx';
import { api } from '../../services/api.ts';
import { X, Sparkles, Lock, ArrowRight } from 'lucide-react';

export const AuthModal: React.FC = () => {
  const { showAuthModal, setShowAuthModal, refreshData, loginAsDemo } = useApp();
  const [isRegister, setIsRegister] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!showAuthModal) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isRegister) {
        if (!displayName.trim() || !email.trim()) {
          setError('Please provide both your name and email address.');
          setLoading(false);
          return;
        }
        await api.register(displayName.trim(), email.trim());
      } else {
        if (!email.trim()) {
          setError('Please provide your email address.');
          setLoading(false);
          return;
        }
        await api.login(email.trim());
      }

      await refreshData();
      setShowAuthModal(false);
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-lg border border-[#E6E3DE] shadow-2xl max-w-md w-full p-6 sm:p-8 relative">
        <button
          onClick={() => setShowAuthModal(false)}
          className="absolute top-4 right-4 text-[#878D82] hover:text-[#222421] p-1 rounded transition-colors"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="mb-6">
          <span className="font-editorial text-2xl font-semibold text-[#222421] block">
            {isRegister ? 'Begin Your Cognitive Diary' : 'Welcome Back'}
          </span>
          <p className="text-xs text-[#5C6059] mt-1.5 leading-relaxed">
            {isRegister
              ? 'Observe your natural working strengths from everyday reflections.'
              : 'Sign in to access your journal entries, skills profile, and roadmaps.'}
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-[#FEF2F2] border border-[#FCA5A5] rounded text-xs text-[#991B1B]">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {isRegister && (
            <div>
              <label className="block text-xs font-semibold text-[#222421] mb-1">
                Display Name
              </label>
              <input
                type="text"
                required
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="e.g. Maya Chen"
                className="w-full px-3 py-2 text-sm border border-[#D5D2CC] rounded focus:outline-none focus:ring-1 focus:ring-[#3E5A46] focus:border-[#3E5A46]"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-[#222421] mb-1">
              Email Address
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@domain.com"
              className="w-full px-3 py-2 text-sm border border-[#D5D2CC] rounded focus:outline-none focus:ring-1 focus:ring-[#3E5A46] focus:border-[#3E5A46]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#222421] mb-1">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-3 py-2 text-sm border border-[#D5D2CC] rounded focus:outline-none focus:ring-1 focus:ring-[#3E5A46] focus:border-[#3E5A46]"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 bg-[#3E5A46] hover:bg-[#2A4031] text-white text-xs font-semibold rounded transition-colors flex items-center justify-center gap-2 mt-2 disabled:opacity-50"
          >
            {loading ? (
              <span>Authenticating...</span>
            ) : (
              <>
                <span>{isRegister ? 'Create My Diary' : 'Sign In'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </form>

        <div className="mt-4 pt-4 border-t border-[#E6E3DE] flex items-center justify-between text-xs text-[#5C6059]">
          <button
            type="button"
            onClick={() => {
              setIsRegister(!isRegister);
              setError(null);
            }}
            className="hover:underline text-[#3E5A46] font-medium"
          >
            {isRegister ? 'Already have an account? Sign In' : 'Need an account? Sign Up'}
          </button>

          <button
            type="button"
            onClick={async () => {
              await loginAsDemo();
              setShowAuthModal(false);
            }}
            className="text-[#878D82] hover:text-[#222421] hover:underline"
          >
            Continue as Demo
          </button>
        </div>
      </div>
    </div>
  );
};
