import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, ChevronDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import useAuth from '../hooks/useAuth';
import InputField from './InputField';
import PasswordField from './PasswordField';
import PrimaryButton from './PrimaryButton';

const WORKSPACES = [
  { id: 'fc-jal', name: 'Fast Couriers Jalandhar' },
  { id: 'fg-log', name: 'FlashGo Logistics' },
  { id: 'se-exp', name: 'SwiftExpress' },
  { id: 'mc-car', name: 'Metro Cargo' },
  { id: 'pl-dem', name: 'Polaris Demo' }
];

const loginSchema = z.object({
  email: z.string().trim().min(1, 'Email is required').email('Invalid email format'),
  password: z.string().min(1, 'Password is required').min(8, 'Password must be at least 8 characters'),
});

export default function LoginForm({ loginTitle, portalName, isDriver }) {
  const { login, loginWithGoogle, logout } = useAuth();
  const navigate = useNavigate();
  
  const [selectedWorkspace, setSelectedWorkspace] = useState(WORKSPACES[0]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
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
      const res = await login(data.email, data.password);
      const userObj = res.user || res;
      
      const isPlatformAdminPortal = portalName === 'Platform Admin';
      
      if (isPlatformAdminPortal && userObj.role !== 'superadmin') {
        await logout();
        setApiError('Access denied. Only Platform Administrators can access the admin console.');
        return;
      }
      
      if (!isPlatformAdminPortal && userObj.role === 'superadmin') {
        await logout();
        setApiError('Access denied. Platform Administrators must log in via the Platform Admin portal.');
        return;
      }

      if (userObj.role === 'superadmin') {
        navigate('/platform-admin/dashboard');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      console.error('Login submission error:', err);
      const errMsg = err.response?.data?.error || 'Invalid email or password';
      setApiError(errMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectWorkspace = (workspace) => {
    setSelectedWorkspace(workspace);
    setIsDropdownOpen(false);
  };

  const renderPortalLinks = () => {
    if (portalName === 'Driver Workspace') {
      return (
        <>
          <button type="button" onClick={() => navigate('/login?portal=company')} className="portal-text-link">
            Company Workspace
          </button>
          <span className="portal-switcher-dot">·</span>
          <button type="button" onClick={() => navigate('/login?portal=platform-admin')} className="portal-text-link">
            Platform Admin
          </button>
        </>
      );
    } else if (portalName === 'Platform Admin') {
      return (
        <>
          <button type="button" onClick={() => navigate('/login?portal=company')} className="portal-text-link">
            Company Workspace
          </button>
          <span className="portal-switcher-dot">·</span>
          <button type="button" onClick={() => navigate('/login?portal=driver')} className="portal-text-link">
            Driver Portal
          </button>
        </>
      );
    } else {
      return (
        <>
          <button type="button" onClick={() => navigate('/login?portal=driver')} className="portal-text-link">
            Driver Portal
          </button>
          <span className="portal-switcher-dot">·</span>
          <button type="button" onClick={() => navigate('/login?portal=platform-admin')} className="portal-text-link">
            Platform Admin
          </button>
        </>
      );
    }
  };

  return (
    <div className="login-form-card">
      <div className="login-form-card__header">
        <h1 className="login-form-card__title">{loginTitle || 'Welcome Back'}</h1>
        <p className="login-form-card__subtitle">
          {portalName === 'Platform Admin' 
            ? 'Manage the Polaris platform and all tenant workspaces.' 
            : `Continue to your ${portalName || 'Workspace'}`}
        </p>
      </div>

      {apiError && (
        <div className="login-form-card__error">
          {apiError}
        </div>
      )}

      <form className="login-form-card__form" onSubmit={handleSubmit(onSubmit)} noValidate>
        {/* Workspace Dropdown */}
        {portalName !== 'Platform Admin' && (
          <div className="workspace-selector-field">
            <label className="workspace-selector-label">Workspace</label>
            <div className="workspace-dropdown-wrap">
              <button
                type="button"
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="workspace-dropdown-btn"
              >
                <span>{selectedWorkspace.name}</span>
                <ChevronDown size={16} className={`dropdown-arrow ${isDropdownOpen ? 'is-open' : ''}`} />
              </button>

              <AnimatePresence>
                {isDropdownOpen && (
                  <motion.ul
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.15 }}
                    className="workspace-dropdown-menu"
                  >
                    {WORKSPACES.map((w) => (
                      <li key={w.id}>
                        <button
                          type="button"
                          onClick={() => handleSelectWorkspace(w)}
                          className={`workspace-dropdown-option ${w.id === selectedWorkspace.id ? 'is-selected' : ''}`}
                        >
                          {w.name}
                        </button>
                      </li>
                    ))}
                  </motion.ul>
                )}
              </AnimatePresence>
            </div>
          </div>
        )}

        {/* Email Address */}
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

        {/* Remember Me / Forgot Password */}
        {isDriver || portalName === 'Platform Admin' ? (
          <div className="remember-me-wrap">
            <label className="remember-me-checkbox-label">
              <input type="checkbox" className="remember-me-checkbox" />
              <span>Remember Me</span>
            </label>
          </div>
        ) : (
          <div className="forgot-password-wrap">
            <a href="/forgot-password" className="forgot-password-link">
              Forgot Password?
            </a>
          </div>
        )}

        {/* Submit Button */}
        <PrimaryButton loading={loading}>
          {isDriver ? 'START SHIFT' : (portalName === 'Platform Admin' ? 'ACCESS CONSOLE' : 'LOGIN')}
        </PrimaryButton>
      </form>

      {/* Divider */}
      <div className="login-portals-divider" />

      {/* Switcher Text */}
      <div className="portal-switcher-label">Looking for another portal?</div>

      {/* Alternative Portals Switcher */}
      <div className="alternative-portals-wrap">
        {renderPortalLinks()}
      </div>
    </div>
  );
}
