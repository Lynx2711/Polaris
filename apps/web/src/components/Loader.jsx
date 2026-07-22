import { motion } from 'framer-motion';

export default function Loader({ fullPage = false }) {
  if (fullPage) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#081726]">
        <div className="flex flex-col items-center gap-4">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 1.2, ease: 'linear' }}
            className="h-10 w-10 rounded-full border-4 border-blue-500/20 border-t-blue-500"
          />
          <p className="text-xs font-bold tracking-[0.2em] uppercase text-slate-400">Loading Polaris...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center p-4">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ repeat: Infinity, duration: 1.2, ease: 'linear' }}
        className="h-6 w-6 rounded-full border-2 border-blue-500/20 border-t-blue-500"
      />
    </div>
  );
}
