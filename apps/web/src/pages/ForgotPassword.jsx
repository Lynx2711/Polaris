import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { motion } from 'framer-motion';
import { Mail, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import authService from '../services/authService';
import PolarisLogo from '../components/PolarisLogo';
import LoginAnimation from '../components/LoginAnimation';
import InputField from '../components/InputField';
import PrimaryButton from '../components/PrimaryButton';
import '../styles/login.css';

const forgotSchema = z.object({
  email: z.string().trim().min(1, 'Email is required').email('Invalid email format'),
});

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [successMsg, setSuccessMsg] = useState(null);
  const [apiError, setApiError] = useState(null);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(forgotSchema),
    defaultValues: { email: '' },
  });

  const onSubmit = async (data) => {
    setLoading(true);
    setApiError(null);
    setSuccessMsg(null);
    try {
      const res = await authService.forgotPassword({ email: data.email });
      setSuccessMsg(res.message || 'If an account exists, a reset link has been sent.');
    } catch (err) {
      console.error('Forgot password submission error:', err);
      setApiError(err.response?.data?.error || 'Something went wrong. Please try again.');
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
              <h1 className="mt-6 text-2xl font-bold tracking-tight text-slate-900">Reset Password</h1>
              <p className="mt-1.5 text-sm text-slate-500 font-medium">
                Enter your email to receive a password reset link
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
                <button
                  onClick={() => navigate('/login')}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-2xl border border-slate-200 hover:bg-slate-50 text-sm font-bold text-slate-700 cursor-pointer"
                >
                  <ArrowLeft size={16} /> Back to Login
                </button>
              </div>
            ) : (
              <form className="space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
                <InputField
                  label="Email Address"
                  id="email"
                  type="email"
                  placeholder="name@company.com"
                  error={errors.email}
                  register={register}
                  icon={Mail}
                />

                <PrimaryButton loading={loading}>
                  Send Reset Link
                </PrimaryButton>

                <button
                  type="button"
                  onClick={() => navigate('/login')}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-2xl border border-slate-200 hover:bg-slate-50 text-sm font-bold text-slate-700 mt-2 cursor-pointer"
                >
                  <ArrowLeft size={16} /> Back to Login
                </button>
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
