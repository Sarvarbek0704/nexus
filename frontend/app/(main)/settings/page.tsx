'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAppSelector, useAppDispatch } from '@/store';
import { logout } from '@/store/slices/authSlice';
import { useChangePasswordMutation } from '@/store/api/authApi';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import {
  Lock, Bell, Shield, Trash2, LogOut, Moon, Sun, Globe,
  Loader2, Save, Eye, EyeOff, CheckCircle,
} from 'lucide-react';
import { useTheme } from 'next-themes';
import Cookies from 'js-cookie';
import { cn } from '@/lib/utils';

const passwordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password required'),
  newPassword: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

type PasswordForm = z.infer<typeof passwordSchema>;

const SETTINGS_TABS = ['Security', 'Notifications', 'Privacy', 'Appearance'];

export default function SettingsPage() {
  const { user } = useAppSelector((s) => s.auth);
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [activeTab, setActiveTab] = useState('Security');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);

  const [changePassword, { isLoading: changingPassword }] = useChangePasswordMutation();

  const { register, handleSubmit, reset, formState: { errors } } = useForm<PasswordForm>({
    resolver: zodResolver(passwordSchema),
  });

  const handlePasswordChange = async (data: PasswordForm) => {
    try {
      await changePassword({ currentPassword: data.currentPassword, newPassword: data.newPassword }).unwrap();
      toast.success('Password changed successfully!');
      reset();
    } catch (err: any) {
      toast.error(err?.data?.message ?? 'Failed to change password');
    }
  };

  const handleLogout = () => {
    Cookies.remove('accessToken');
    Cookies.remove('refreshToken');
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    dispatch(logout());
    router.push('/login');
  };

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Settings</h2>
        <p className="text-gray-500 dark:text-gray-400 mt-1">Manage your account preferences and security settings.</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl w-fit">
        {SETTINGS_TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
              activeTab === tab ? 'bg-white dark:bg-gray-900 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
            )}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Security Tab */}
      {activeTab === 'Security' && (
        <div className="space-y-5">
          {/* Change Password */}
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="p-2.5 bg-nexus-100 dark:bg-nexus-900/50 rounded-lg">
                <Lock className="w-5 h-5 text-nexus-600 dark:text-nexus-400" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">Change Password</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">Update your account password</p>
              </div>
            </div>

            <form onSubmit={handleSubmit(handlePasswordChange)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Current Password</label>
                <div className="relative">
                  <input
                    {...register('currentPassword')}
                    type={showCurrent ? 'text' : 'password'}
                    className={cn('w-full px-4 py-2.5 pr-10 text-sm border rounded-lg focus:outline-none focus:border-nexus-500 bg-white dark:bg-gray-800 dark:border-gray-700', errors.currentPassword && 'border-red-400')}
                  />
                  <button type="button" onClick={() => setShowCurrent((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.currentPassword && <p className="text-xs text-red-500 mt-1">{errors.currentPassword.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">New Password</label>
                <div className="relative">
                  <input
                    {...register('newPassword')}
                    type={showNew ? 'text' : 'password'}
                    className={cn('w-full px-4 py-2.5 pr-10 text-sm border rounded-lg focus:outline-none focus:border-nexus-500 bg-white dark:bg-gray-800 dark:border-gray-700', errors.newPassword && 'border-red-400')}
                  />
                  <button type="button" onClick={() => setShowNew((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.newPassword && <p className="text-xs text-red-500 mt-1">{errors.newPassword.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Confirm New Password</label>
                <input
                  {...register('confirmPassword')}
                  type="password"
                  className={cn('w-full px-4 py-2.5 text-sm border rounded-lg focus:outline-none focus:border-nexus-500 bg-white dark:bg-gray-800 dark:border-gray-700', errors.confirmPassword && 'border-red-400')}
                />
                {errors.confirmPassword && <p className="text-xs text-red-500 mt-1">{errors.confirmPassword.message}</p>}
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={changingPassword}
                  className="flex items-center gap-2 px-5 py-2.5 bg-nexus-600 hover:bg-nexus-700 text-white rounded-lg font-medium text-sm transition-colors disabled:opacity-50"
                >
                  {changingPassword ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Change Password
                </button>
              </div>
            </form>
          </div>

          {/* Auth Provider Info */}
          {user?.authProvider !== 'local' && (
            <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-xl p-5">
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium text-blue-800 dark:text-blue-300">OAuth Login Detected</p>
                  <p className="text-sm text-blue-600 dark:text-blue-400 mt-1">
                    Your account uses {user?.authProvider} for sign-in. Password changes may not apply.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Danger Zone */}
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-red-200 dark:border-red-800 p-6">
            <h3 className="font-semibold text-red-600 dark:text-red-400 mb-4 flex items-center gap-2">
              <Shield className="w-5 h-5" /> Danger Zone
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-gray-800">
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">Sign Out</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Sign out from all devices</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                >
                  <LogOut className="w-4 h-4" /> Sign Out
                </button>
              </div>
              <div className="flex items-center justify-between py-3">
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">Delete Account</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Permanently delete your account and all data</p>
                </div>
                <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors">
                  <Trash2 className="w-4 h-4" /> Delete Account
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Notifications Tab */}
      {activeTab === 'Notifications' && (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="p-2.5 bg-nexus-100 dark:bg-nexus-900/50 rounded-lg">
              <Bell className="w-5 h-5 text-nexus-600 dark:text-nexus-400" />
            </div>
            <h3 className="font-semibold text-gray-900 dark:text-white">Notification Preferences</h3>
          </div>

          <div className="space-y-4">
            {[
              { label: 'New Bids', description: 'When someone bids on your project', defaultChecked: true },
              { label: 'Bid Accepted', description: 'When your bid is accepted', defaultChecked: true },
              { label: 'Contract Updates', description: 'Contract status changes', defaultChecked: true },
              { label: 'Milestone Updates', description: 'Milestone submissions and approvals', defaultChecked: true },
              { label: 'Payments', description: 'Payment confirmations and receipts', defaultChecked: true },
              { label: 'Messages', description: 'New direct messages', defaultChecked: true },
              { label: 'Dispute Alerts', description: 'Dispute opened or updated', defaultChecked: true },
              { label: 'Platform Updates', description: 'Product announcements and newsletters', defaultChecked: false },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-gray-800 last:border-0">
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{item.label}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{item.description}</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" defaultChecked={item.defaultChecked} className="sr-only peer" />
                  <div className="w-10 h-5 bg-gray-200 dark:bg-gray-700 peer-checked:bg-nexus-600 rounded-full peer-focus:outline-none transition-colors after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-5" />
                </label>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Appearance Tab */}
      {activeTab === 'Appearance' && (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-5">Theme Preferences</h3>
          <div className="grid grid-cols-3 gap-4">
            {[
              { value: 'light', label: 'Light', icon: Sun },
              { value: 'dark', label: 'Dark', icon: Moon },
              { value: 'system', label: 'System', icon: Globe },
            ].map((opt) => (
              <button
                key={opt.value}
                onClick={() => setTheme(opt.value)}
                className={cn(
                  'flex flex-col items-center gap-3 p-5 rounded-xl border-2 transition-all',
                  theme === opt.value
                    ? 'border-nexus-500 bg-nexus-50 dark:bg-nexus-950/30'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                )}
              >
                <opt.icon className={cn('w-6 h-6', theme === opt.value ? 'text-nexus-600 dark:text-nexus-400' : 'text-gray-400')} />
                <span className={cn('text-sm font-medium', theme === opt.value ? 'text-nexus-600 dark:text-nexus-400' : 'text-gray-600 dark:text-gray-400')}>
                  {opt.label}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Privacy Tab */}
      {activeTab === 'Privacy' && (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="p-2.5 bg-nexus-100 dark:bg-nexus-900/50 rounded-lg">
              <Shield className="w-5 h-5 text-nexus-600 dark:text-nexus-400" />
            </div>
            <h3 className="font-semibold text-gray-900 dark:text-white">Privacy Settings</h3>
          </div>

          <div className="space-y-4">
            {[
              { label: 'Show Profile Publicly', description: 'Your profile is visible to all users', defaultChecked: true },
              { label: 'Show Earnings', description: 'Display your earnings on your public profile', defaultChecked: false },
              { label: 'Show Online Status', description: 'Let others see when you are online', defaultChecked: true },
              { label: 'Allow Direct Messages', description: 'Receive messages from non-connections', defaultChecked: true },
              { label: 'Show in Search Results', description: 'Appear in freelancer search results', defaultChecked: true },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-gray-800 last:border-0">
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{item.label}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{item.description}</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" defaultChecked={item.defaultChecked} className="sr-only peer" />
                  <div className="w-10 h-5 bg-gray-200 dark:bg-gray-700 peer-checked:bg-nexus-600 rounded-full peer-focus:outline-none transition-colors after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-5" />
                </label>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
