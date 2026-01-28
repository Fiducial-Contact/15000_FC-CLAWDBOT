'use client';

import { memo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, KeyRound, Eye, EyeOff, Loader2, Check, AlertCircle } from 'lucide-react';

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (currentPassword: string, newPassword: string) => Promise<{ success: boolean; error?: string }>;
}

export const ChangePasswordModal = memo(function ChangePasswordModal({
  isOpen,
  onClose,
  onSubmit,
}: ChangePasswordModalProps) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const passwordRequirements = [
    { label: 'At least 8 characters', valid: newPassword.length >= 8 },
    { label: 'Contains uppercase letter', valid: /[A-Z]/.test(newPassword) },
    { label: 'Contains lowercase letter', valid: /[a-z]/.test(newPassword) },
    { label: 'Contains number', valid: /\d/.test(newPassword) },
  ];

  const isPasswordValid = passwordRequirements.every((req) => req.valid);
  const passwordsMatch = newPassword === confirmPassword && confirmPassword.length > 0;
  const canSubmit = currentPassword && isPasswordValid && passwordsMatch && !isLoading;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!canSubmit) return;

    setIsLoading(true);
    setError('');

    const result = await onSubmit(currentPassword, newPassword);

    setIsLoading(false);

    if (result.success) {
      setSuccess(true);
      setTimeout(() => {
        handleClose();
      }, 1500);
    } else {
      setError(result.error || 'Failed to change password');
    }
  };

  const handleClose = () => {
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setError('');
    setSuccess(false);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            onClick={handleClose}
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white rounded-2xl shadow-2xl z-50 overflow-hidden"
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--fc-border-gray)]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--fc-red)] to-[var(--fc-action-red)] flex items-center justify-center">
                  <KeyRound size={20} className="text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-[var(--fc-black)]">Change Password</h2>
                  <p className="text-xs text-[var(--fc-body-gray)]">Update your account password</p>
                </div>
              </div>
              <button
                onClick={handleClose}
                className="p-2 hover:bg-[var(--fc-subtle-gray)] rounded-lg transition-colors"
              >
                <X size={20} className="text-[var(--fc-body-gray)]" />
              </button>
            </div>

            {success ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-8 text-center"
              >
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-100 flex items-center justify-center">
                  <Check size={32} className="text-green-600" />
                </div>
                <h3 className="text-lg font-semibold text-[var(--fc-black)] mb-2">Password Changed!</h3>
                <p className="text-sm text-[var(--fc-body-gray)]">Your password has been updated successfully.</p>
              </motion.div>
            ) : (
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700"
                  >
                    <AlertCircle size={16} />
                    {error}
                  </motion.div>
                )}

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-[var(--fc-dark-gray)]">Current Password</label>
                  <div className="relative">
                    <input
                      type={showCurrentPassword ? 'text' : 'password'}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className="w-full px-4 py-3 pr-12 bg-[var(--fc-subtle-gray)] border border-transparent rounded-xl text-sm focus:outline-none focus:border-[var(--fc-action-red)] focus:ring-2 focus:ring-[var(--fc-action-red)]/20 transition-all"
                      placeholder="Enter current password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-[var(--fc-body-gray)] hover:text-[var(--fc-dark-gray)] transition-colors"
                    >
                      {showCurrentPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-[var(--fc-dark-gray)]">New Password</label>
                  <div className="relative">
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full px-4 py-3 pr-12 bg-[var(--fc-subtle-gray)] border border-transparent rounded-xl text-sm focus:outline-none focus:border-[var(--fc-action-red)] focus:ring-2 focus:ring-[var(--fc-action-red)]/20 transition-all"
                      placeholder="Enter new password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-[var(--fc-body-gray)] hover:text-[var(--fc-dark-gray)] transition-colors"
                    >
                      {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>

                  {newPassword && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="mt-2 space-y-1"
                    >
                      {passwordRequirements.map((req, i) => (
                        <div key={i} className="flex items-center gap-2 text-xs">
                          <div
                            className={`w-4 h-4 rounded-full flex items-center justify-center ${
                              req.valid ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'
                            }`}
                          >
                            <Check size={10} />
                          </div>
                          <span className={req.valid ? 'text-green-600' : 'text-[var(--fc-body-gray)]'}>
                            {req.label}
                          </span>
                        </div>
                      ))}
                    </motion.div>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-[var(--fc-dark-gray)]">Confirm New Password</label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className={`w-full px-4 py-3 pr-12 bg-[var(--fc-subtle-gray)] border rounded-xl text-sm focus:outline-none focus:ring-2 transition-all ${
                        confirmPassword && !passwordsMatch
                          ? 'border-red-400 focus:border-red-400 focus:ring-red-400/20'
                          : 'border-transparent focus:border-[var(--fc-action-red)] focus:ring-[var(--fc-action-red)]/20'
                      }`}
                      placeholder="Confirm new password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-[var(--fc-body-gray)] hover:text-[var(--fc-dark-gray)] transition-colors"
                    >
                      {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  {confirmPassword && !passwordsMatch && (
                    <p className="text-xs text-red-500 mt-1">Passwords do not match</p>
                  )}
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={handleClose}
                    className="flex-1 px-4 py-3 text-sm font-medium text-[var(--fc-body-gray)] bg-[var(--fc-subtle-gray)] hover:bg-[var(--fc-border-gray)] rounded-xl transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={!canSubmit}
                    className="flex-1 px-4 py-3 text-sm font-medium text-white bg-gradient-to-r from-[var(--fc-red)] to-[var(--fc-action-red)] rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg disabled:hover:shadow-none flex items-center justify-center gap-2"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        Updating...
                      </>
                    ) : (
                      'Update Password'
                    )}
                  </button>
                </div>
              </form>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
});
