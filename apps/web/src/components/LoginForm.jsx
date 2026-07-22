import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { motion } from 'framer-motion';
import { Mail, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import useAuth from '../hooks/useAuth';
import PolarisLogo from './PolarisLogo';
import InputField from './InputField';
import PasswordField from './PasswordField';
import PrimaryButton from './PrimaryButton';

/**
 * Zod validation schema for Login
 */
const loginSchema = z.object({
  email: z.string().trim().min(1, 'Email is required').email('Invalid email format'),
  password: z.string().min(1, 'Password is required').min(8, 'Password must be at least 8 characters'),
});

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" fill="none" aria-hidden="true" className="shrink-0">
      <path d="M43.6 20.1H42V20H24v8h11.3C33.6 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3l5.7-5.7C34 6.1 29.3 4 24 4 13 4 4 13 4 24s9 20 20 20 20-9 20-20c0-1.3-.1-2.7-.4-3.9z" fill="#FFC107"/>
      <path d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" fill="#FF3D00"/>
      <path d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z" fill="#4CAF50"/>
      <path d="M43.6 20.1H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.7-.4-3.9z" fill="#1976D2"/>
    </svg>
  );
}

export default function LoginForm() {
  const { login, loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const [apiError, setApiError] = useState(null);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = async (data) => {
    setLoading(true);
    setApiError(null);
    try {
      await login(data.email, data.password);
      navigate('/dashboard');
    } catch (err) {
      console.error('Login submission error:', err);
      const errMsg = err.response?.data?.error || 'Invalid email or password';
      setApiError(errMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    setLoading(true);
    setApiError(null);
    try {
      const credential = credentialResponse.credential;
      await loginWithGoogle(credential);
      navigate('/dashboard');
    } catch (err) {
      console.error('Google login error:', err);
      const errMsg = err.response?.data?.error || 'Google authentication failed';
      setApiError(errMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleError = () => {
    setApiError('Google Sign-In was cancelled or failed.');
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, ease: [0.21, 1.02, 0.43, 1.01] }}
      className="w-full max-w-[460px] rounded-[30px] border border-slate-100 bg-white p-8 shadow-[0_20px_50px_rgba(0,0,0,0.05)] sm:p-10"
    >
      {/* ── Top Logo & Heading ── */}
      <div className="flex flex-col items-center text-center mb-8">
        <PolarisLogo size={38} dark={false} loop={true} showWord={true} wordClass="text-2xl" />
        <h1 className="mt-6 text-2xl font-bold tracking-tight text-slate-900">Welcome Back</h1>
        <p className="mt-1.5 text-sm text-slate-500 font-medium">
          Sign in to your Polaris Account
        </p>
      </div>

      {/* ── API error alert box ── */}
      {apiError && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mb-4 rounded-2xl bg-red-50 border border-red-200/50 p-4 text-xs font-semibold text-red-500"
        >
          {apiError}
        </motion.div>
      )}

      {/* ── Form ── */}
      <form className="space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
        {/* Email */}
        <InputField
          label="Email Address"
          id="email"
          type="email"
          placeholder="name@company.com"
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

        {/* Remember + Forgot */}
        <div className="flex items-center justify-between pt-1">
          <label className="flex cursor-pointer items-center gap-2.5 text-sm text-slate-500 select-none font-medium">
            <input
              id="remember"
              type="checkbox"
              className="h-4.5 w-4.5 rounded-lg border-slate-300 accent-[#2563EB] transition cursor-pointer"
            />
            Remember this device
          </label>
          <a
            href="/forgot-password"
            className="text-xs font-bold text-[#2563EB] transition hover:text-[#1d4ed8]"
          >
            Forgot Password?
          </a>
        </div>

        {/* Sign In button */}
        <PrimaryButton loading={loading}>
          <span className="flex items-center gap-1.5 justify-center">
            SIGN IN <ArrowRight size={15} className="mt-0.5" />
          </span>
        </PrimaryButton>
      </form>

      {/* ── Divider ── */}
      <div className="my-6 flex items-center gap-3">
        <div className="h-px flex-1 bg-slate-100" />
        <span className="text-[10px] font-extrabold uppercase tracking-[0.25em] text-slate-400">
          OR CONTINUE WITH
        </span>
        <div className="h-px flex-1 bg-slate-100" />
      </div>

      {/* ── Google SSO Button ── */}
      <div className="relative w-full">
        <motion.button
          whileHover={{ scale: 1.01, y: -1, bg: '#fafafa', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}
          whileTap={{ scale: 0.99 }}
          type="button"
          onClick={async () => {
            if (!import.meta.env.VITE_GOOGLE_CLIENT_ID) {
              setLoading(true);
              setApiError(null);
              try {
                // Simulated network latency
                await new Promise((resolve) => setTimeout(resolve, 800));
                await loginWithGoogle('mock_google_token');
                navigate('/dashboard');
              } catch (err) {
                console.error('Mock Google login error:', err);
                setApiError('Developer Mock Google Sign-In failed.');
              } finally {
                setLoading(false);
              }
            }
          }}
          className="flex w-full items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-sm font-bold text-slate-700 shadow-sm transition hover:border-slate-300 cursor-pointer"
        >
          <GoogleIcon />
          Google
        </motion.button>
        {import.meta.env.VITE_GOOGLE_CLIENT_ID && (
          <div className="absolute inset-0 opacity-0 cursor-pointer overflow-hidden z-10">
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={handleGoogleError}
              useOneTap={false}
              type="standard"
              theme="outline"
              size="large"
              shape="rectangular"
              width="460px"
            />
          </div>
        )}
      </div>

      {/* ── Create account ── */}
      <p className="mt-6 text-center text-sm text-slate-500 font-medium">
        Don't have an account?{' '}
        <a href="/signup" className="font-bold text-[#2563EB] transition hover:text-[#1d4ed8] hover:underline">
          Create account
        </a>
      </p>

      {/* ── Footer ── */}
      <footer className="mt-8 text-center text-xs text-slate-400 font-medium select-none">
        &copy; 2026 Polaris
      </footer>
    </motion.div>
  );
}
