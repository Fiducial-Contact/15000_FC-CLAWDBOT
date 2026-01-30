'use client';

import { memo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Loader2 } from 'lucide-react';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/client';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const LoginModal = memo(function LoginModal({
  isOpen,
  onClose,
  onSuccess,
}: LoginModalProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!email || !password) return;

    setLoading(true);
    setError('');

    const supabase = createClient();
    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    setLoading(false);
    onSuccess();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
          onClick={(e) => {
            if (e.target === e.currentTarget) onClose();
          }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
            className="w-full max-w-[400px] bg-white rounded-2xl shadow-2xl border border-[var(--fc-border-gray)] overflow-hidden"
          >
            <div className="flex items-center justify-between px-6 pt-5 pb-0">
              <div />
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg text-[var(--fc-body-gray)] hover:bg-[var(--fc-subtle-gray)] hover:text-[var(--fc-black)] transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="px-8 pb-8 pt-2">
              <div className="text-center mb-8">
                <Image
                  src="/brand/Fiducial-logo-2021_RGB.svg"
                  alt="Fiducial Communications"
                  width={140}
                  height={35}
                  className="mx-auto mb-6 opacity-90"
                />
                <h2 className="text-lg font-semibold text-[var(--fc-black)] mb-1">
                  Sign in to continue
                </h2>
                <p className="text-[13px] text-[var(--fc-body-gray)]">
                  Sign in to send messages
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="login-email" className="block text-[13px] font-medium text-[var(--fc-black)] mb-1.5">
                    Email
                  </label>
                  <input
                    id="login-email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@company.com"
                    required
                    className="w-full px-3.5 py-2.5 bg-white border border-[var(--fc-border-gray)] rounded-lg text-[var(--fc-black)] text-[14px] placeholder:text-[var(--fc-light-gray)] transition-all focus:border-[var(--fc-black)] focus:ring-1 focus:ring-[var(--fc-black)]"
                  />
                </div>

                <div>
                  <label htmlFor="login-password" className="block text-[13px] font-medium text-[var(--fc-black)] mb-1.5">
                    Password
                  </label>
                  <input
                    id="login-password"
                    type="password"
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter password"
                    required
                    className="w-full px-3.5 py-2.5 bg-white border border-[var(--fc-border-gray)] rounded-lg text-[var(--fc-black)] text-[14px] placeholder:text-[var(--fc-light-gray)] transition-all focus:border-[var(--fc-black)] focus:ring-1 focus:ring-[var(--fc-black)]"
                  />
                </div>

                {error && (
                  <div className="bg-red-50 text-[var(--fc-action-red)] px-4 py-3 rounded-lg text-[13px] font-medium border border-red-100">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading || !email || !password}
                  className="w-full py-2.5 bg-[var(--fc-black)] hover:bg-[var(--fc-charcoal)] disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed text-white font-medium text-[14px] rounded-lg shadow-sm hover:shadow-md transition-all mt-1"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 size={16} className="animate-spin" />
                      Signing in...
                    </span>
                  ) : (
                    'Sign in'
                  )}
                </button>
              </form>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
});
