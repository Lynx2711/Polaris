import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { motion } from 'framer-motion';
import { User as UserIcon, Mail, Shield, Calendar } from 'lucide-react';
import useAuth from '../hooks/useAuth';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import InputField from '../components/InputField';
import PasswordField from '../components/PasswordField';
import PrimaryButton from '../components/PrimaryButton';

const profileSchema = z.object({
  fullName: z.string().trim().min(1, 'Full name is required'),
  email: z.string().trim().min(1, 'Email is required').email('Invalid email format'),
});

const passwordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string()
    .min(1, 'New password is required')
    .min(8, 'New password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[^a-zA-Z0-9]/, 'Password must contain at least one special character'),
  confirmPassword: z.string().min(1, 'Please confirm your new password'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "New passwords don't match",
  path: ['confirmPassword'],
});

export default function Profile() {
  const { user, updateProfile, changePassword } = useAuth();

  // Profile Edit Form
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState(null);
  const [profileError, setProfileError] = useState(null);

  const {
    register: registerProfile,
    handleSubmit: handleProfileSubmit,
    formState: { errors: profileErrors },
  } = useForm({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      fullName: user?.fullName || '',
      email: user?.email || '',
    },
  });

  const onProfileSubmit = async (data) => {
    setProfileLoading(true);
    setProfileSuccess(null);
    setProfileError(null);
    try {
      await updateProfile(data.fullName, data.email);
      setProfileSuccess('Profile updated successfully!');
    } catch (err) {
      console.error(err);
      setProfileError(err.response?.data?.error || 'Failed to update profile');
    } finally {
      setProfileLoading(false);
    }
  };

  // Password Edit Form
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState(null);
  const [passwordError, setPasswordError] = useState(null);

  const {
    register: registerPassword,
    handleSubmit: handlePasswordSubmit,
    reset: resetPasswordForm,
    formState: { errors: passwordErrors },
  } = useForm({
    resolver: zodResolver(passwordSchema),
    defaultValues: { currentPassword: '', newPassword: '', confirmPassword: '' },
  });

  const onPasswordSubmit = async (data) => {
    setPasswordLoading(true);
    setPasswordSuccess(null);
    setPasswordError(null);
    try {
      await changePassword(data.currentPassword, data.newPassword);
      setPasswordSuccess('Password changed successfully!');
      resetPasswordForm();
    } catch (err) {
      console.error(err);
      setPasswordError(err.response?.data?.error || 'Failed to change password');
    } finally {
      setPasswordLoading(false);
    }
  };

  // Format created date
  const createdDate = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : 'N/A';

  return (
    <div className="flex flex-col h-screen w-screen bg-slate-50 overflow-hidden font-sans">
      <Navbar />

      <div className="flex flex-1 overflow-hidden">
        <Sidebar />

        <main className="flex-1 overflow-y-auto p-6 lg:p-8 space-y-6">
          <div className="flex flex-col gap-1">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Profile Settings</h1>
            <p className="text-sm text-slate-500 font-medium">
              Manage your personal information and security credentials.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            {/* Left: User Card View */}
            <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm flex flex-col items-center text-center select-none lg:col-span-1">
              <div className="h-20 w-20 rounded-full bg-gradient-to-br from-[#2563EB]/20 to-[#00D4FF]/20 border-2 border-blue-100 flex items-center justify-center text-2xl font-black text-[#2563EB]">
                {user?.fullName ? user.fullName.split(' ').map(n => n[0]).join('').toUpperCase() : 'U'}
              </div>
              <h2 className="mt-4 text-lg font-bold text-slate-900">{user?.fullName}</h2>
              <p className="text-xs font-semibold text-slate-400 capitalize">{user?.role || 'Dispatcher'}</p>

              <div className="mt-6 w-full border-t border-slate-100 pt-6 space-y-4 text-left text-xs font-semibold text-slate-500">
                <div className="flex items-center gap-3">
                  <Mail size={16} className="text-slate-400 shrink-0" />
                  <span className="truncate">{user?.email}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Shield size={16} className="text-slate-400 shrink-0" />
                  <span className="capitalize">{user?.role} Role</span>
                </div>
                <div className="flex items-center gap-3">
                  <Calendar size={16} className="text-slate-400 shrink-0" />
                  <span>Joined {createdDate}</span>
                </div>
              </div>
            </div>

            {/* Right: Edit & Password Forms */}
            <div className="lg:col-span-2 space-y-6">
              {/* Profile Details Form */}
              <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm">
                <h3 className="text-base font-bold text-slate-900 mb-1">Personal Details</h3>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-6">Update name and email address</p>

                {profileSuccess && (
                  <div className="mb-4 rounded-xl bg-emerald-50 border border-emerald-200/50 p-3.5 text-xs font-semibold text-emerald-600">
                    {profileSuccess}
                  </div>
                )}
                {profileError && (
                  <div className="mb-4 rounded-xl bg-red-50 border border-red-200/50 p-3.5 text-xs font-semibold text-red-500">
                    {profileError}
                  </div>
                )}

                <form onSubmit={handleProfileSubmit(onProfileSubmit)} className="space-y-4" noValidate>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <InputField
                      label="Full Name"
                      id="fullName"
                      placeholder="John Doe"
                      error={profileErrors.fullName}
                      register={registerProfile}
                      icon={UserIcon}
                    />
                    <InputField
                      label="Email Address"
                      id="email"
                      type="email"
                      placeholder="john@company.com"
                      error={profileErrors.email}
                      register={registerProfile}
                      icon={Mail}
                    />
                  </div>
                  <div className="flex justify-end pt-2">
                    <div className="w-full sm:w-44">
                      <PrimaryButton loading={profileLoading}>Save Profile</PrimaryButton>
                    </div>
                  </div>
                </form>
              </div>

              {/* Password change Form */}
              <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm">
                <h3 className="text-base font-bold text-slate-900 mb-1">Change Password</h3>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-6">Update login security credentials</p>

                {passwordSuccess && (
                  <div className="mb-4 rounded-xl bg-emerald-50 border border-emerald-200/50 p-3.5 text-xs font-semibold text-emerald-600">
                    {passwordSuccess}
                  </div>
                )}
                {passwordError && (
                  <div className="mb-4 rounded-xl bg-red-50 border border-red-200/50 p-3.5 text-xs font-semibold text-red-500">
                    {passwordError}
                  </div>
                )}

                <form onSubmit={handlePasswordSubmit(onPasswordSubmit)} className="space-y-4" noValidate>
                  <PasswordField
                    label="Current Password"
                    id="currentPassword"
                    placeholder="••••••••"
                    error={passwordErrors.currentPassword}
                    register={registerPassword}
                  />

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <PasswordField
                      label="New Password"
                      id="newPassword"
                      placeholder="••••••••"
                      error={passwordErrors.newPassword}
                      register={registerPassword}
                    />
                    <PasswordField
                      label="Confirm New Password"
                      id="confirmPassword"
                      placeholder="••••••••"
                      error={passwordErrors.confirmPassword}
                      register={registerPassword}
                    />
                  </div>
                  <div className="flex justify-end pt-2">
                    <div className="w-full sm:w-44">
                      <PrimaryButton loading={passwordLoading}>Update Password</PrimaryButton>
                    </div>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
