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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email && password) {
      onLogin(email, password);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--fc-off-white)] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <div className="text-center mb-8">
            <Image
              src="/brand/Fiducial-logo-2021_RGB.svg"
              alt="Fiducial Communications"
              width={180}
              height={45}
              className="mx-auto mb-6"
              priority
            />
            <h1 className="text-2xl font-bold text-[var(--fc-black)] mb-2">
              Team AI Assistant
            </h1>
            <p className="text-[var(--fc-body-gray)] text-sm">
              Sign in to access your AI assistant
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-[var(--fc-black)] mb-1.5">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@fiducialcomms.com"
                required
                className="
                  w-full px-4 py-3
                  bg-[var(--fc-off-white)]
                  border border-[var(--fc-border-gray)]
                  rounded-xl
                  text-[var(--fc-black)] text-sm
                  placeholder:text-[var(--fc-light-gray)]
                  focus:outline-none focus:border-[var(--fc-action-red)] focus:ring-1 focus:ring-[var(--fc-action-red)]
                  transition-colors
                "
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-[var(--fc-black)] mb-1.5">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
                className="
                  w-full px-4 py-3
                  bg-[var(--fc-off-white)]
                  border border-[var(--fc-border-gray)]
                  rounded-xl
                  text-[var(--fc-black)] text-sm
                  placeholder:text-[var(--fc-light-gray)]
                  focus:outline-none focus:border-[var(--fc-action-red)] focus:ring-1 focus:ring-[var(--fc-action-red)]
                  transition-colors
                "
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !email || !password}
              className="
                w-full py-3.5
                bg-[var(--fc-action-red)]
                hover:bg-[var(--fc-dark-red)]
                disabled:bg-[var(--fc-border-gray)] disabled:cursor-not-allowed
                text-white font-semibold text-sm
                rounded-xl
                transition-colors
              "
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-[var(--fc-border-gray)]">
            <p className="text-xs text-[var(--fc-light-gray)] text-center">
              Having trouble signing in? Contact IT support.
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
