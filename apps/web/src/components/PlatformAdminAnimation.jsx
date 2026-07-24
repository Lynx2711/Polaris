import React from 'react';

export default function PlatformAdminAnimation({ isDark }) {
  // Use stroke and fill colors based on dark mode status
  const color = isDark ? '#ffffff' : '#000000';
  const colorDim = isDark ? '#333333' : '#e5e5e5';
  const colorAccent = isDark ? '#555555' : '#888888';

  return (
    <div className="w-full h-full flex items-center justify-center p-6 relative select-none">
      <svg 
        viewBox="0 0 400 280" 
        className="w-full h-full max-h-[260px]"
        fill="none" 
        stroke={color} 
        strokeWidth="1.5" 
        strokeLinecap="round" 
        strokeLinejoin="round"
      >
        {/* Style block for local animations */}
        <style>{`
          @keyframes drawGrid {
            0% { stroke-dashoffset: 400; }
            100% { stroke-dashoffset: 0; }
          }
          @keyframes createOrg {
            0%, 15% { opacity: 0; transform: scale(0.9) translate(0px, 10px); }
            30%, 45% { opacity: 1; transform: scale(1) translate(0px, 0px); }
            60%, 100% { opacity: 0; transform: scale(0.95) translate(0px, -10px); }
          }
          @keyframes addUser {
            0%, 35% { opacity: 0; transform: translateY(10px); }
            50%, 65% { opacity: 1; transform: translateY(0); }
            80%, 100% { opacity: 0; transform: translateY(-10px); }
          }
          @keyframes linePulse {
            0% { stroke-dashoffset: 100; }
            100% { stroke-dashoffset: 0; }
          }
          @keyframes chartGrow {
            0%, 55% { transform: scaleY(0.1); }
            70%, 85% { transform: scaleY(1); }
            95%, 100% { transform: scaleY(0.1); }
          }
          @keyframes pulseCircle {
            0%, 100% { r: 4px; opacity: 0.3; }
            50% { r: 8px; opacity: 0.9; }
          }
          .anim-grid {
            stroke-dasharray: 8 4;
            animation: drawGrid 20s linear infinite;
          }
          .anim-org {
            animation: createOrg 12s ease-in-out infinite;
            transform-origin: 200px 140px;
          }
          .anim-user {
            animation: addUser 12s ease-in-out infinite;
          }
          .anim-line {
            stroke-dasharray: 10 5;
            animation: linePulse 4s linear infinite;
          }
          .anim-chart-bar {
            animation: chartGrow 12s ease-in-out infinite;
            transform-origin: bottom;
          }
          .anim-pulse-dot {
            animation: pulseCircle 2s ease-in-out infinite;
          }
        `}</style>

        {/* ── Background Grid & Outer Console frame ── */}
        <rect x="10" y="10" width="380" height="260" rx="6" stroke={colorDim} strokeWidth="1" />
        
        {/* Header of mock application */}
        <line x1="10" y1="40" x2="390" y2="40" stroke={colorDim} strokeWidth="1" />
        <circle cx="30" cy="25" r="4" fill={color} stroke="none" />
        <circle cx="45" cy="25" r="4" fill={colorAccent} stroke="none" />
        <circle cx="60" cy="25" r="4" fill={colorDim} stroke="none" />
        
        <rect x="120" y="20" width="160" height="10" rx="3" stroke={colorDim} strokeWidth="1" />
        
        {/* Grid lines inside console */}
        <path d="M 10 90 L 390 90 M 10 140 L 390 140 M 10 190 L 390 190" stroke={colorDim} strokeWidth="0.5" strokeDasharray="3 3" />
        <path d="M 100 40 L 100 270 M 200 40 L 200 270 M 300 40 L 300 270" stroke={colorDim} strokeWidth="0.5" strokeDasharray="3 3" />

        {/* ── Dashboard Stats (Static background) ── */}
        {/* Org Box */}
        <rect x="25" y="55" width="60" height="25" rx="3" stroke={colorDim} />
        <line x1="35" y1="67" x2="60" y2="67" stroke={colorAccent} />
        <line x1="35" y1="73" x2="75" y2="73" stroke={colorDim} />

        {/* Health Box */}
        <rect x="115" y="55" width="60" height="25" rx="3" stroke={colorDim} />
        <path d="M 125 70 L 135 70 L 140 60 L 145 75 L 150 68 L 155 70 L 165 70" stroke={color} strokeWidth="1.2" />

        {/* Security Box */}
        <rect x="205" y="55" width="60" height="25" rx="3" stroke={colorDim} />
        <rect x="225" y="65" width="20" height="10" rx="2" stroke={color} fill="none" />
        <circle cx="235" cy="65" r="3" stroke={color} />

        {/* Analytics Box */}
        <rect x="295" y="55" width="60" height="25" rx="3" stroke={colorDim} />
        <line x1="305" y1="72" x2="335" y2="72" stroke={color} />
        <circle cx="335" cy="72" r="2" fill={color} stroke="none" />

        {/* ── Animation Stage ── */}

        {/* Phase 1: Organization Created (Center) */}
        <g className="anim-org">
          {/* Card Frame */}
          <rect x="110" y="110" width="180" height="90" rx="6" fill={isDark ? '#0d0d0d' : '#ffffff'} stroke={color} strokeWidth="2" />
          
          {/* Card Header */}
          <line x1="110" y1="135" x2="290" y2="135" stroke={colorDim} />
          <text x="125" y="127" fill={color} fontSize="9" fontWeight="bold" fontFamily="monospace" stroke="none">PROVISION_TENANT</text>
          
          {/* Form details (Lines appearing) */}
          <rect x="125" y="150" width="60" height="10" rx="2" stroke={colorDim} />
          <line x1="130" y1="155" x2="160" y2="155" stroke={colorAccent} strokeWidth="1" />
          
          <rect x="125" y="165" width="60" height="10" rx="2" stroke={colorDim} />
          <line x1="130" y1="170" x2="175" y2="170" stroke={colorAccent} strokeWidth="1" />

          {/* Success Check */}
          <circle cx="245" cy="162" r="14" stroke={color} strokeWidth="1.5" />
          <path d="M 238 162 L 243 167 L 253 157" stroke={color} strokeWidth="2" />
        </g>

        {/* Phase 2: Users Added (Floating Icons) */}
        <g className="anim-user">
          {/* Admin User Node */}
          <g transform="translate(45, 115)">
            <circle cx="15" cy="15" r="12" stroke={color} strokeWidth="1.5" fill={isDark ? '#0A0A0A' : '#ffffff'} />
            {/* User figure */}
            <circle cx="15" cy="12" r="4" fill="none" stroke={color} />
            <path d="M 7 23 A 8 8 0 0 1 23 23" fill="none" stroke={color} />
            <text x="35" y="18" fill={color} fontSize="8" fontFamily="monospace" stroke="none">ADMIN_USER</text>
          </g>

          {/* Connected network node */}
          <path d="M 120 130 L 160 150" stroke={colorDim} strokeWidth="1" className="anim-line" />
        </g>

        {/* Phase 3: Analytics Updated (Bar chart in bottom-right) */}
        <g transform="translate(295, 145)">
          {/* Chart Axes */}
          <line x1="10" y1="10" x2="10" y2="90" stroke={colorDim} />
          <line x1="10" y1="90" x2="80" y2="90" stroke={colorDim} />

          {/* Bar Chart Animations */}
          <rect x="20" y="30" width="8" height="60" fill={colorDim} stroke="none" className="anim-chart-bar" style={{ animationDelay: '0s' }} />
          <rect x="35" y="15" width="8" height="75" fill={colorAccent} stroke="none" className="anim-chart-bar" style={{ animationDelay: '0.2s' }} />
          <rect x="50" y="45" width="8" height="45" fill={color} stroke="none" className="anim-chart-bar" style={{ animationDelay: '0.4s' }} />
          <rect x="65" y="25" width="8" height="65" fill={color} stroke="none" className="anim-chart-bar" style={{ animationDelay: '0.6s' }} />
        </g>

        {/* Phase 4: System Monitoring (Pulsing Lines / Ping indicator) */}
        <g>
          {/* Connecting line to health indicator */}
          <path d="M 200 90 L 200 110" stroke={colorDim} strokeWidth="1.5" strokeDasharray="5 5" />
          <circle cx="200" cy="90" r="4" fill={color} className="anim-pulse-dot" />
        </g>

      </svg>
    </div>
  );
}
