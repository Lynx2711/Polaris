import { RefreshCw, CheckCircle2, AlertOctagon } from 'lucide-react';

export default function SolveStatusBanner({ jobId, status, error, onClose }) {
  if (!jobId && !status) return null;

  return (
    <div className="absolute top-3 left-1/2 -translate-x-1/2 z-40 font-mono text-xs select-none">
      <div className="bg-[#0D0D0D] border border-[#333333] shadow-2xl px-4 py-2 flex items-center gap-3 backdrop-blur-md">
        {status === 'queued' || status === 'running' ? (
          <>
            <RefreshCw size={14} className="animate-spin text-[#818CF8]" />
            <div>
              <span className="text-white font-bold uppercase">CVRPTW SOLVER RUNNING</span>
              <span className="text-[#8C8C8C] ml-2">(JOB #{jobId} — STATUS: {status.toUpperCase()})</span>
            </div>
          </>
        ) : status === 'done' ? (
          <>
            <CheckCircle2 size={14} className="text-[#34D399]" />
            <div>
              <span className="text-white font-bold uppercase">OPTIMIZATION COMPLETE</span>
              <span className="text-[#34D399] ml-2">Routes successfully solved & updated!</span>
            </div>
          </>
        ) : (
          <>
            <AlertOctagon size={14} className="text-[#F43F5E]" />
            <div>
              <span className="text-white font-bold uppercase">SOLVER FAILED</span>
              <span className="text-[#F43F5E] ml-2">{error || 'Could not compute optimal routes'}</span>
            </div>
          </>
        )}

        <button
          onClick={onClose}
          className="ml-3 text-[#666666] hover:text-white transition cursor-pointer text-xs font-bold"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
