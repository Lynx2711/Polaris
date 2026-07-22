import { motion, AnimatePresence } from 'framer-motion';

export default function PrimaryButton({ children, loading, type = 'submit', onClick, ...rest }) {
  return (
    <motion.button
      whileHover={{ scale: 1.01, filter: 'brightness(1.05)', boxShadow: '0 8px 24px rgba(37,99,235,0.25)' }}
      whileTap={{ scale: 0.99 }}
      type={type}
      disabled={loading}
      onClick={onClick}
      {...rest}
      className="relative w-full overflow-hidden rounded-2xl bg-gradient-to-r from-[#2563EB] to-[#1D4ED8] px-4 py-3.5 text-sm font-bold text-white shadow-lg transition duration-200 disabled:opacity-70 flex items-center justify-center gap-2 cursor-pointer"
    >
      <AnimatePresence mode="wait">
        {loading ? (
          <motion.span
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex items-center justify-center gap-2"
          >
            <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <circle cx="12" cy="12" r="10" stroke="white" strokeWidth="3" strokeOpacity="0.3"/>
              <path d="M12 2 a10 10 0 0 1 10 10" stroke="white" strokeWidth="3" strokeLinecap="round"/>
            </svg>
            Processing…
          </motion.span>
        ) : (
          <motion.span 
            key="idle" 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
          >
            {children}
          </motion.span>
        )}
      </AnimatePresence>
    </motion.button>
  );
}
