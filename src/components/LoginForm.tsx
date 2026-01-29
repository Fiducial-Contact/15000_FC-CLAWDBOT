'use client';

import { useState } from 'react';
import Image from 'next/image';

interface LoginFormProps {
  onLogin: (email: string, password: string) => void;
  error?: string;
  loading?: boolean;
}

export function LoginForm({ onLogin, error, loading }: LoginFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (email && password) {
      onLogin(email, password);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--fc-off-white)] flex items-center justify-center p-6">
      <div className="w-full max-w-[400px]">
        <div className="bg-white rounded-none border-0 sm:border sm:border-[var(--fc-border-gray)] sm:rounded-2xl sm:shadow-[var(--shadow-card)] p-8 sm:p-10">
          <div className="text-center mb-10">
            <Image
              src="/brand/Fiducial-logo-2021_RGB.svg"
              alt="Fiducial Communications"
              width={160}
              height={40}
              className="mx-auto mb-8 opacity-90"
              priority
            />
            <h1 className="text-xl font-semibold text-[var(--fc-black)] mb-2 tracking-tight">
              Welcome back
            </h1>
            <p className="text-[var(--fc-body-gray)] text-[14px]">
              Sign in to your workspace
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="email" className="block text-[13px] font-medium text-[var(--fc-black)] mb-2">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.com"
                required
                className="
                  w-full px-3.5 py-2.5
                  bg-white
                  border border-[var(--fc-border-gray)]
                  rounded-lg
                  text-[var(--fc-black)] text-[14px]
                  placeholder:text-[var(--fc-light-gray)]
                  transition-all
                  focus:border-[var(--fc-black)] focus:ring-1 focus:ring-[var(--fc-black)]
                "
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-[13px] font-medium text-[var(--fc-black)] mb-2">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                required
                className="
                  w-full px-3.5 py-2.5
                  bg-white
                  border border-[var(--fc-border-gray)]
                  rounded-lg
                  text-[var(--fc-black)] text-[14px]
                  placeholder:text-[var(--fc-light-gray)]
                  transition-all
                  focus:border-[var(--fc-black)] focus:ring-1 focus:ring-[var(--fc-black)]
                "
              />
            </div>

            {error && (
              <div className="bg-red-50 text-[var(--fc-action-red)] px-4 py-3 rounded-lg text-[13px] font-medium border border-red-100 flex items-start gap-2">
                <span>•</span>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !email || !password}
              className="
                w-full py-2.5
                bg-[var(--fc-black)]
                hover:bg-[var(--fc-charcoal)]
                disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed
                text-white font-medium text-[14px]
                rounded-lg
                shadow-sm hover:shadow-md
                transition-all
                mt-2
              "
            >
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-dashed border-[var(--fc-border-gray)]">
            <p className="text-[12px] text-[var(--fc-light-gray)] text-center">
              Protected by Fiducial Enterprise Grid
            </p>
          </div>
        </div>

        <p className="text-xs text-[var(--fc-light-gray)] text-center mt-6">
          Fiducial Communications Ltd.
        </p>
      </div>
    </div>
  );
}
