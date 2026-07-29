import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, ChevronDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import useAuth from '../hooks/useAuth';
import authService from '../services/authService';
import InputField from './InputField';
import PasswordField from './PasswordField';
import PrimaryButton from './PrimaryButton';

const loginSchema = z.object({
  email: z.string().trim().min(1, 'Email is required').email('Invalid email format'),
  password: z.string().min(1, 'Password is required').min(8, 'Password must be at least 8 characters'),
});

export default function LoginForm({ loginTitle, portalName, isDriver }) {
  const { login, loginWithGoogle, logout } = useAuth();
  const navigate = useNavigate();
  
  const [companies, setCompanies] = useState([]);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [apiError, setApiError] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function loadCompanies() {
      try {
        const orgs = await authService.getOrganizations();
        if (Array.isArray(orgs) && orgs.length > 0) {
          setCompanies(orgs);
          setSelectedCompany(orgs[0]);
        }
      } catch (err) {
        console.error('Failed to load companies:', err);
      }
    }
    loadCompanies();
  }, []);

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
      const res = await login(data.email.trim().toLowerCase(), data.password, selectedCompany?.id);
      const userObj = res.user || res;
      
      const isPlatformAdminPortal = portalName === 'Platform Admin';
      const isDriverPortal = isDriver || portalName === 'Driver Workspace';
      
      // 1. Platform Admin Portal check
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

      // 2. Driver Portal check: Only drivers can access Driver Portal
      if (isDriverPortal && userObj.role !== 'driver') {
        await logout();
        setApiError('Access denied. Company staff cannot log into the Driver Portal. Please log in through Company Workspace.');
        return;
      }

      // 3. Company Workspace check: Drivers cannot access Company Workspace
      if (!isDriverPortal && !isPlatformAdminPortal && userObj.role === 'driver') {
        await logout();
        setApiError('Access denied. Drivers cannot log into Company Workspace. Please use the Driver Portal.');
        return;
      }

      // Navigate according to verified role
      if (userObj.role === 'superadmin') {
        navigate('/platform-admin/dashboard');
      } else if (userObj.role === 'driver') {
        navigate('/driver');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      console.error('Login submission error:', err);
      const errMsg = err.response?.data?.error || err.message || 'Invalid email or password';
      setApiError(errMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectCompany = (company) => {
    setSelectedCompany(company);
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
        {/* Company Dropdown */}
        {portalName !== 'Platform Admin' && (
          <div className="workspace-selector-field">
            <label className="workspace-selector-label">Select your company</label>
            <div className="workspace-dropdown-wrap">
              <button
                type="button"
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="workspace-dropdown-btn"
              >
                <span>{selectedCompany ? selectedCompany.name : 'Select a company'}</span>
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
                    {companies.map((c) => (
                      <li key={c.id}>
                        <button
                          type="button"
                          onClick={() => handleSelectCompany(c)}
                          className={`workspace-dropdown-option ${selectedCompany && c.id === selectedCompany.id ? 'is-selected' : ''}`}
                        >
                          {c.name}
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
