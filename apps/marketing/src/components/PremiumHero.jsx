import React from 'react';
import { motion } from 'motion/react';
import { FiChevronRight, FiGitPullRequest, FiActivity, FiMapPin } from 'react-icons/fi';

/**
 * PremiumHero Component
 * 
 * An elegant, light-canvas hero showcase section inspired by GitHub's landing page,
 * adapted for a high-contrast white theme with custom platform colors (#182B25, #45594E, #DEE3DD).
 * 
 * Stacking Architecture:
 * - Back Layer: Ambient diffused glows (radial gradients + blur-3xl) + 64px Grid Overlay
 * - Mid Layer: Main Hero copy, CTA buttons, and the 16:10 base mockup container
 * - Front Layer: Absolute-positioned interactive floating overlay cards with subtle parallax animations
 */
export default function PremiumHero({
  title = "Route optimization, built for real fleets.",
  subtitle = "Polaris plans your drivers' routes the way Amazon and DPD do — real roads, real constraints, solved in seconds.",
  ctaText = "See it in action",
  onCtaClick,
  imageSrc = "/screenshots/image.png"
}) {
  return (
    <section className="relative min-h-screen w-full bg-white overflow-hidden py-24 px-4 sm:px-6 lg:px-8 flex flex-col items-center justify-center">
      
      {/* 1. AMBIENT GLOW SYSTEM (Light Mode Diffusion) */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none select-none z-0">
        {/* Top-Left glow using Light Green (#DEE3DD) */}
        <div 
          className="absolute -top-48 -left-48 w-[600px] h-[600px] rounded-full bg-gradient-to-br from-[#DEE3DD]/45 to-transparent blur-[100px] opacity-80"
          style={{ mixBlendMode: 'multiply' }}
        />
        {/* Center-Right glow using Medium Slate Green (#45594E) */}
        <div 
          className="absolute top-1/4 -right-48 w-[700px] h-[700px] rounded-full bg-gradient-to-tl from-[#45594E]/15 to-transparent blur-[120px] opacity-75"
          style={{ mixBlendMode: 'multiply' }}
        />
        {/* Bottom-Center subtle glow */}
        <div 
          className="absolute -bottom-64 left-1/3 w-[800px] h-[800px] rounded-full bg-gradient-to-tr from-[#DEE3DD]/30 to-[#45594E]/5 blur-[120px] opacity-60"
        />
      </div>

      {/* 2. SUBTLE 64px GRID OVERLAY */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(20,23,28,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(20,23,28,0.03)_1px,transparent_1px)] bg-[size:64px_64px] pointer-events-none z-0" />

      {/* 3. HERO CONTENT & COPY */}
      <div className="relative z-10 max-w-5xl mx-auto text-center flex flex-col items-center mb-16">
        {/* Animated Badge */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#DEE3DD]/40 border border-[#DEE3DD] text-[#182B25] text-xs font-semibold uppercase tracking-wider mb-6 shadow-sm"
        >
          <span className="flex h-2 w-2 rounded-full bg-[#182B25] animate-pulse" />
          Polaris v2.0 Multi-Tenant Engine
        </motion.div>

        {/* Heading */}
        <motion.h1
          initial={{ opacity: 0, y: 25 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1, ease: "easeOut" }}
          className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-[#1A1A1A] tracking-tight leading-[1.05] max-w-4xl"
        >
          {title}
        </motion.h1>

        {/* Subhead */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
          className="mt-6 text-lg sm:text-xl text-[#5A5F65] max-w-3xl leading-relaxed"
        >
          {subtitle}
        </motion.p>

        {/* CTA Actions */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3, ease: "easeOut" }}
          className="mt-10 flex flex-col sm:flex-row gap-4"
        >
          <button
            onClick={onCtaClick}
            className="inline-flex items-center justify-center px-8 py-4 bg-[#182B25] hover:bg-[#1E3D33] text-white font-bold rounded-lg transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
          >
            {ctaText}
            <FiChevronRight className="ml-2 -mr-1 h-5 w-5" />
          </button>
          <a
            href="#how-it-works"
            className="inline-flex items-center justify-center px-8 py-4 bg-white hover:bg-[#F8F9F8] text-[#1A1A1A] font-bold rounded-lg border border-[#DEE3DD] transition-all duration-200 shadow-sm cursor-pointer"
          >
            How it works
          </a>
        </motion.div>
      </div>

      {/* 4. SHOWCASE CANVAS (16:10 Aspect Ratio) */}
      <motion.div
        initial={{ opacity: 0, y: 40, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.8, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 w-full max-w-5xl aspect-[16/10] rounded-2xl border border-[#DEE3DD] bg-gradient-to-br from-white to-[#F8F9F8] p-3 shadow-2xl shadow-gray-200/50"
      >
        {/* Window Chrome Header */}
        <div className="flex items-center justify-between pb-3 px-3 border-b border-[#DEE3DD]/40">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-red-400/80" />
            <span className="w-3 h-3 rounded-full bg-yellow-400/80" />
            <span className="w-3 h-3 rounded-full bg-green-400/80" />
          </div>
          <div className="px-12 py-1 rounded-md bg-white border border-[#DEE3DD]/50 text-[10px] text-[#5A5F65] font-medium tracking-wide">
            polaris.dispatch.io/dashboard
          </div>
          <div className="w-12 h-2" />
        </div>

        {/* Mockup Screen Viewport */}
        <div className="relative w-full h-[calc(100%-32px)] mt-2 rounded-lg overflow-hidden bg-white border border-[#DEE3DD]/30">
          {/* Main Dashboard Screenshot or Wireframe */}
          <img 
            src={imageSrc} 
            alt="Polaris Dispatcher Dashboard" 
            className="w-full h-full object-cover select-none pointer-events-none"
            onError={(e) => {
              // Fallback wireframe if file doesn't exist yet
              e.target.style.display = 'none';
              e.target.nextSibling.style.display = 'flex';
            }}
          />

          {/* Fallback wireframe UI */}
          <div className="hidden absolute inset-0 bg-[#F8F9F8] flex-col p-6">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4 mb-4">
              <div className="flex items-center gap-4">
                <div className="w-32 h-6 bg-gray-200 rounded animate-pulse" />
                <div className="w-16 h-4 bg-gray-200 rounded animate-pulse" />
              </div>
              <div className="w-24 h-8 bg-[#182B25] rounded" />
            </div>
            <div className="flex-1 grid grid-cols-4 gap-4">
              <div className="col-span-1 border-r border-gray-100 pr-4 flex flex-col gap-3">
                <div className="w-full h-8 bg-gray-100 rounded" />
                <div className="w-full h-24 bg-gray-50 rounded border border-dashed border-gray-200" />
                <div className="w-full h-12 bg-gray-100 rounded" />
              </div>
              <div className="col-span-3 bg-gray-50 rounded border border-[#DEE3DD]/60 p-4 relative flex items-center justify-center">
                <div className="absolute inset-0 bg-[radial-gradient(#45594E_1px,transparent_1px)] [background-size:16px_16px] opacity-20" />
                <span className="text-xs text-[#5A5F65] font-semibold uppercase tracking-wider z-10">Map Viewport Panel</span>
              </div>
            </div>
          </div>

          {/* 5. PARALLAX OVERLAY CARDS (Hovering / Float effects) */}
          
          {/* Overlay Card 1: Route Dispatch Status */}
          <motion.div
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
            className="absolute left-6 bottom-8 max-w-[280px] bg-white border border-[#DEE3DD] rounded-xl p-4 shadow-lg hover:shadow-xl transition-all duration-300 pointer-events-auto"
          >
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#DEE3DD]/50 text-[#182B25]">
                <FiGitPullRequest className="h-5 w-5" />
              </span>
              <div>
                <h4 className="text-xs font-bold text-[#1A1A1A]">Optimized Route JAL-12</h4>
                <p className="text-[10px] text-[#5A5F65] mt-0.5">5 stops • 12.4 km • 24m</p>
              </div>
            </div>
            <div className="mt-3 flex items-center justify-between border-t border-[#DEE3DD]/40 pt-3">
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-semibold bg-green-100 text-[#182B25]">
                Active Dispatch
              </span>
              <span className="text-[10px] font-bold text-[#182B25]">Jalandhar City</span>
            </div>
          </motion.div>

          {/* Overlay Card 2: OR-Tools Solver Statistics */}
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
            className="absolute right-6 top-8 max-w-[240px] bg-white border border-[#DEE3DD] rounded-xl p-4 shadow-lg hover:shadow-xl transition-all duration-300 pointer-events-auto"
          >
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#DEE3DD]/50 text-[#182B25]">
                <FiActivity className="h-5 w-5" />
              </span>
              <div>
                <h4 className="text-xs font-bold text-[#1A1A1A]">OR-Tools Solver</h4>
                <p className="text-[10px] text-green-700 font-semibold mt-0.5">98.4% Efficiency</p>
              </div>
            </div>
            <div className="mt-3 bg-[#F8F9F8] border border-[#DEE3DD]/40 rounded-lg p-2 flex justify-between text-[10px]">
              <span className="text-[#5A5F65]">Compute Time</span>
              <span className="font-bold text-[#1A1A1A]">1.2s</span>
            </div>
          </motion.div>

          {/* Overlay Card 3: Live Driver Tracking Pill */}
          <motion.div
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 5.5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
            className="absolute right-12 bottom-12 bg-[#182B25] text-white border border-[#45594E] rounded-full py-2 px-4 shadow-lg flex items-center gap-2 hover:scale-105 transition-transform duration-300 pointer-events-auto"
          >
            <FiMapPin className="h-3.5 w-3.5 text-[#DEE3DD]" />
            <span className="text-[10px] font-bold tracking-wide">Driver Active Tracking</span>
            <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
          </motion.div>

        </div>
      </motion.div>

    </section>
  );
}
