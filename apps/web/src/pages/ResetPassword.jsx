import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { motion } from 'framer-motion';
import { useParams, useNavigate } from 'react-router-dom';
import authService from '../services/authService';
import PolarisLogo from '../components/PolarisLogo';
import LoginAnimation from '../components/LoginAnimation';
import PasswordField from '../components/PasswordField';
import PrimaryButton from '../components/PrimaryButton';
import '../styles/login.css';

const resetSchema = z.object({
  password: z.string()
    .min(1, 'Password is required')
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[^a-zA-Z0-9]/, 'Password must contain at least one special character'),
  confirmPassword: z.string().min(1, 'Please confirm your password'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

export default function ResetPassword() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [successMsg, setSuccessMsg] = useState(null);
  const [apiError, setApiError] = useState(null);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(resetSchema),
    defaultValues: { password: '', confirmPassword: '' },
  });

  const onSubmit = async (data) => {
    setLoading(true);
    setApiError(null);
    setSuccessMsg(null);
    try {
      const res = await authService.resetPassword({ token, password: data.password });
      setSuccessMsg(res.message || 'Password has been reset successfully.');
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (err) {
      console.error('Reset password submission error:', err);
      setApiError(err.response?.data?.error || 'Invalid or expired reset token');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.main
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.6 }}
      className="flex h-screen w-screen overflow-hidden bg-[#081726] md:bg-white"
    >
      {/* ── Left panel ── */}
      <section
        className="hidden flex-col bg-[#081726] p-6 md:flex md:w-[40%] lg:w-[58%] h-full overflow-hidden"
        aria-hidden="true"
      >
        <motion.div
          initial={{ opacity: 0, x: -24 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
          className="flex h-full flex-col"
        >
          <div className="mb-5 flex items-center justify-between shrink-0 px-2">
            <div className="flex items-center gap-3">
              <PolarisLogo size={36} dark={true} loop={true} showWord={false} />
              <div className="flex flex-col">
                <span 
                  className="font-bold text-white text-base tracking-[0.04em] leading-none" 
                  style={{ fontFamily: "'Manrope', sans-serif" }}
                >
                  POLARIS
                </span>
                <span 
                  className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mt-1.5"
                  style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                >
                  Route Optimization Platform
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="flex h-2 w-2 rounded-full bg-[#10B981]" />
              <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-slate-500">
                Live Dispatch
              </span>
            </div>
          </div>
          <div className="flex-1 min-h-0">
            <LoginAnimation />
          </div>
        </motion.div>
      </section>

      {/* ── Right panel ── */}
      <section className="relative flex flex-col flex-1 items-center justify-center bg-white p-6 sm:p-10 md:w-[60%] lg:w-[42%] h-full overflow-y-auto">
        <div className="w-full max-w-[460px] my-auto">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.21, 1.02, 0.43, 1.01] }}
            className="w-full rounded-[30px] border border-slate-100 bg-white p-8 shadow-[0_20px_50px_rgba(0,0,0,0.05)] sm:p-10"
          >
            <div className="flex flex-col items-center text-center mb-6">
              <PolarisLogo size={38} dark={false} loop={true} showWord={true} wordClass="text-2xl" />
              <h1 className="mt-6 text-2xl font-bold tracking-tight text-slate-950">New Password</h1>
              <p className="mt-1.5 text-sm text-slate-500 font-medium">
                Set a secure password for your account
              </p>
            </div>

            {apiError && (
              <div className="mb-4 rounded-2xl bg-red-50 border border-red-200/50 p-4 text-xs font-semibold text-red-500">
                {apiError}
              </div>
            )}

            {successMsg ? (
              <div className="space-y-4">
                <div className="rounded-2xl bg-emerald-50 border border-emerald-200/50 p-4 text-xs font-semibold text-emerald-600">
                  {successMsg}
                </div>
                <p className="text-xs font-medium text-slate-500 text-center animate-pulse">
                  Redirecting to login...
                </p>
              </div>
            ) : (
              <form className="space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
                <PasswordField
                  label="New Password"
                  id="password"
                  placeholder="••••••••"
                  error={errors.password}
                  register={register}
                />

                <PasswordField
                  label="Confirm New Password"
                  id="confirmPassword"
                  placeholder="••••••••"
                  error={errors.confirmPassword}
                  register={register}
                />

                <PrimaryButton loading={loading}>
                  Reset Password
                </PrimaryButton>
              </form>
            )}

            <footer className="mt-8 text-center text-xs text-slate-400 font-medium select-none">
              &copy; 2026 Polaris
            </footer>
          </motion.div>
        </div>
      </section>
    </motion.main>
  );
}
