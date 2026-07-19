import { useState } from 'react';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Lock } from 'lucide-react';

export default function PasswordField({ label, id, error, placeholder, register, ...rest }) {
  const [showPwd, setShowPwd] = useState(false);

  return (
    <div className="space-y-1.5 w-full">
      {label && (
        <label htmlFor={id} className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
          {label}
        </label>
      )}
      <motion.div
        whileFocusWithin={{ scale: 1.005 }}
        className={`flex items-center gap-3 rounded-2xl border px-4 py-3.5 transition-all duration-200 ${
          error
            ? 'border-red-400 bg-red-50/30 focus-within:border-red-500 focus-within:shadow-[0_0_0_4px_rgba(239,68,68,0.08)]'
            : 'border-slate-200 bg-slate-50/50 focus-within:border-[#2563EB] focus-within:bg-white focus-within:shadow-[0_0_0_4px_rgba(37,99,235,0.08)]'
        }`}
      >
        <Lock className={`h-4 w-4 shrink-0 ${error ? 'text-red-400' : 'text-slate-400'}`} />
        <input
          id={id}
          type={showPwd ? 'text' : 'password'}
          placeholder={placeholder}
          {...(register ? register(id) : {})}
          {...rest}
          className="w-full border-none bg-transparent text-sm text-slate-800 outline-none placeholder:text-slate-400"
        />
        <button
          type="button"
          onClick={() => setShowPwd((v) => !v)}
          className="shrink-0 text-slate-400 transition hover:text-slate-600 cursor-pointer"
          aria-label={showPwd ? 'Hide password' : 'Show password'}
        >
          {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </motion.div>
      {error && (
        <motion.p
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-xs font-semibold text-red-500 mt-1 pl-1"
        >
          {error.message}
        </motion.p>
      )}
    </div>
  );
}
