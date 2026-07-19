import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { motion } from 'framer-motion';
import { Mail, User, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import PolarisLogo from '../components/PolarisLogo';
import LoginAnimation from '../components/LoginAnimation';
import InputField from '../components/InputField';
import PasswordField from '../components/PasswordField';
import PrimaryButton from '../components/PrimaryButton';
import '../styles/login.css';

/**
 * Zod validation schema for Signup
 */
const signupSchema = z.object({
  fullName: z.string().trim().min(1, 'Full name is required'),
  email: z.string().trim().min(1, 'Email is required').email('Invalid email format'),
  password: z.string()
    .min(1, 'Password is required')
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[^a-zA-Z0-9]/, 'Password must contain at least one special character'),
  confirmPassword: z.string().min(1, 'Please confirm your password'),
  agree: z.literal(true, {
    errorMap: () => ({ message: 'You must agree to the Terms' }),
  }),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

export default function Signup() {
  const { signup } = useAuth();
  const navigate = useNavigate();
  const [apiError, setApiError] = useState(null);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(signupSchema),
    defaultValues: { fullName: '', email: '', password: '', confirmPassword: '', agree: false },
  });

  const onSubmit = async (data) => {
    setLoading(true);
    setApiError(null);
    try {
      await signup(data.fullName, data.email, data.password);
      // Successful signup redirects to login
      navigate('/login');
    } catch (err) {
      console.error('Signup error:', err);
      const errMsg = err.response?.data?.error || 'Email already exists';
      setApiError(errMsg);
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
      {/* ── Left panel (same animation as Login) ── */}
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

      {/* ── Right panel (Signup Card) ── */}
      <section className="relative flex flex-col flex-1 items-center justify-center bg-white p-6 sm:p-10 md:w-[60%] lg:w-[42%] h-full overflow-y-auto">
        <div className="w-full max-w-[460px] my-auto py-8">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.21, 1.02, 0.43, 1.01] }}
            className="w-full rounded-[30px] border border-slate-100 bg-white p-8 shadow-[0_20px_50px_rgba(0,0,0,0.05)] sm:p-10"
          >
            {/* Logo & Header */}
            <div className="flex flex-col items-center text-center mb-6">
              <PolarisLogo size={38} dark={false} loop={true} showWord={true} wordClass="text-2xl" />
              <h1 className="mt-6 text-2xl font-bold tracking-tight text-slate-900">Create Account</h1>
              <p className="mt-1 text-sm text-slate-500 font-medium">
                Get started with Polaris Route Optimization
              </p>
            </div>

            {/* API error alert box */}
            {apiError && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="mb-4 rounded-2xl bg-red-50 border border-red-200/50 p-4 text-xs font-semibold text-red-500"
              >
                {apiError}
              </motion.div>
            )}

            {/* Form */}
            <form className="space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
              {/* Full Name */}
              <InputField
                label="Full Name"
                id="fullName"
                placeholder="John Doe"
                error={errors.fullName}
                register={register}
                icon={User}
              />

              {/* Email */}
              <InputField
                label="Email Address"
                id="email"
                type="email"
                placeholder="john@company.com"
                error={errors.email}
                register={register}
                icon={Mail}
              />

              {/* Password */}
              <PasswordField
                label="Password"
                id="password"
                placeholder="••••••••"
                error={errors.password}
                register={register}
              />

              {/* Confirm Password */}
              <PasswordField
                label="Confirm Password"
                id="confirmPassword"
                placeholder="••••••••"
                error={errors.confirmPassword}
                register={register}
              />

              {/* Terms Checkbox */}
              <div className="space-y-1">
                <label className="flex cursor-pointer items-start gap-2.5 text-sm text-slate-500 select-none font-medium">
                  <input
                    id="agree"
                    type="checkbox"
                    {...register('agree')}
                    className="mt-1.5 h-4.5 w-4.5 rounded-lg border-slate-300 accent-[#2563EB] transition cursor-pointer"
                  />
                  <span>
                    I agree to the{' '}
                    <a href="#" className="font-bold text-[#2563EB] hover:underline">
                      Terms of Service
                    </a>{' '}
                    and{' '}
                    <a href="#" className="font-bold text-[#2563EB] hover:underline">
                      Privacy Policy
                    </a>
                  </span>
                </label>
                {errors.agree && (
                  <p className="text-xs font-semibold text-red-500 pl-1">
                    {errors.agree.message}
                  </p>
                )}
              </div>

              {/* Submit Button */}
              <PrimaryButton loading={loading}>
                <span className="flex items-center gap-1.5 justify-center">
                  SIGN UP <ArrowRight size={15} className="mt-0.5" />
                </span>
              </PrimaryButton>
            </form>

            {/* Back to Login */}
            <p className="mt-6 text-center text-sm text-slate-500 font-medium">
              Already have an account?{' '}
              <a href="/login" className="font-bold text-[#2563EB] transition hover:text-[#1d4ed8] hover:underline">
                Sign in
              </a>
            </p>

            {/* Footer */}
            <footer className="mt-6 text-center text-xs text-slate-400 font-medium select-none">
              &copy; 2026 Polaris
            </footer>
          </motion.div>
        </div>
      </section>
    </motion.main>
  );
}
