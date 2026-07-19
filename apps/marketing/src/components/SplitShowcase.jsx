import React from 'react';
import { motion } from 'motion/react';
import { FiCheckCircle, FiCpu, FiLayers, FiRadio } from 'react-icons/fi';

/**
 * SplitShowcase Component
 * 
 * A premium 50/50 split layout. One side contains the text description, badges, 
 * and optimization metrics. The other side contains a floating layout container 
 * with a live status mockup and absolute-positioned sub-cards with hovering parallax animations.
 * 
 * Colors Used:
 * - Canvas Base: #ffffff
 * - Light Container Gradient: from-white to-[#F8F9F8] with border-[#DEE3DD]
 * - Primary CTA/Interactive: #182B25
 * - Sub-box highlights: #45594E
 * - Glow: #DEE3DD & #45594E (opacity 0.08 to 0.15)
 */
export default function SplitShowcase({
  tagline = "Multi-Driver Capacity Constraints",
  title = "Solve delivery schedules at industrial scale",
  description = "Polaris leverages Google OR-Tools to solve the Capacitated Vehicle Routing Problem with Time Windows (CVRPTW). It maps out optimized driver schedules, vehicle load distributions, and arrival ETA sequences on real-road data.",
  imageSrc = "/screenshots/optimize-placeholder.png",
  reverse = false
}) {
  return (
    <section className="relative w-full bg-white py-24 px-4 sm:px-6 lg:px-8 overflow-hidden">
      
      {/* Ambient Glow behind the mockup */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none select-none z-0">
        <div 
          className={`absolute top-1/3 ${reverse ? 'left-12' : 'right-12'} w-[500px] h-[500px] rounded-full bg-gradient-to-tr from-[#DEE3DD]/30 to-[#45594E]/10 blur-[100px] opacity-90`}
          style={{ mixBlendMode: 'multiply' }}
        />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
        
        {/* Content Panel (Heading & Descriptions) */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className={`flex flex-col gap-6 ${reverse ? 'lg:order-2' : ''}`}
        >
          {/* Tagline Badge */}
          <div className="inline-flex items-center gap-2 self-start px-3 py-1 rounded-full bg-[#DEE3DD]/30 border border-[#DEE3DD]/70 text-[#182B25] text-xs font-bold uppercase tracking-wider">
            <FiCpu className="h-3.5 w-3.5" />
            {tagline}
          </div>

          {/* Heading */}
          <h2 className="text-3xl sm:text-4xl font-extrabold text-[#1A1A1A] tracking-tight leading-tight">
            {title}
          </h2>

          {/* Description */}
          <p className="text-base sm:text-lg text-[#5A5F65] leading-relaxed">
            {description}
          </p>

          {/* Grid of Key Enclosure Sub-boxes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
            <div className="p-5 rounded-xl border border-[#DEE3DD] bg-gradient-to-br from-white to-[#F8F9F8] shadow-sm">
              <div className="flex items-center gap-3 mb-2">
                <FiCheckCircle className="text-[#182B25] h-5 w-5" />
                <h4 className="font-bold text-sm text-[#1A1A1A]">Capacity Bounds</h4>
              </div>
              <p className="text-xs text-[#5A5F65] leading-relaxed">Never overload a delivery vehicle. Auto-split routes based on order weight constraints.</p>
            </div>
            
            <div className="p-5 rounded-xl border border-[#DEE3DD] bg-gradient-to-br from-white to-[#F8F9F8] shadow-sm">
              <div className="flex items-center gap-3 mb-2">
                <FiCheckCircle className="text-[#182B25] h-5 w-5" />
                <h4 className="font-bold text-sm text-[#1A1A1A]">Time Windows</h4>
              </div>
              <p className="text-xs text-[#5A5F65] leading-relaxed">Ensure drivers arrive within customer delivery ranges, honoring strict SLA deadlines.</p>
            </div>
          </div>
        </motion.div>

        {/* Mockup Showcase Panel (Floating screen container) */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.7, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          className={`relative w-full aspect-[4/3] rounded-2xl border border-[#DEE3DD] bg-gradient-to-br from-white to-[#F8F9F8] p-3 shadow-xl ${reverse ? 'lg:order-1' : ''}`}
        >
          {/* Inner Screen Display */}
          <div className="relative w-full h-full rounded-lg overflow-hidden bg-white border border-[#DEE3DD]/30">
            
            {/* Screen Image */}
            <img 
              src={imageSrc} 
              alt="Polaris Optimization Screen" 
              className="w-full h-full object-cover select-none pointer-events-none"
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.nextSibling.style.display = 'flex';
              }}
            />

            {/* Fallback wireframe layout */}
            <div className="hidden absolute inset-0 bg-[#F8F9F8] flex-col p-4">
              <div className="w-1/3 h-5 bg-gray-200 rounded mb-4" />
              <div className="flex-1 border border-dashed border-gray-200 rounded-lg p-4 relative flex flex-col justify-end">
                <div className="absolute inset-0 bg-[radial-gradient(#45594E_1px,transparent_1px)] [background-size:16px_16px] opacity-10" />
                <div className="w-full h-4 bg-gray-100 rounded mb-2" />
                <div className="w-2/3 h-4 bg-gray-100 rounded" />
              </div>
            </div>

            {/* Parallax Floating Overlay Cards */}
            
            {/* Overlay: Optimization Metrics Box (#45594E Style) */}
            <motion.div
              animate={{ y: [0, -6, 0] }}
              transition={{ duration: 4.8, repeat: Infinity, ease: "easeInOut" }}
              className="absolute left-6 top-8 max-w-[200px] bg-[#45594E] text-white rounded-xl p-4 shadow-lg border border-[#182B25]/20 pointer-events-auto"
            >
              <div className="flex items-center gap-2 mb-2 text-[#DEE3DD]">
                <FiRadio className="h-4 w-4 animate-pulse" />
                <span className="text-[10px] font-bold uppercase tracking-wider">Live Solver Engine</span>
              </div>
              <h5 className="text-xs font-bold text-white">Algorithm Matrix</h5>
              <div className="mt-3 flex flex-col gap-1 text-[10px] text-gray-200">
                <div className="flex justify-between">
                  <span>Routing Mode</span>
                  <span className="font-semibold text-white">MLD Serving</span>
                </div>
                <div className="flex justify-between border-t border-white/10 pt-1 mt-1">
                  <span>Cache Hits</span>
                  <span className="font-semibold text-white">94.2%</span>
                </div>
              </div>
            </motion.div>

            {/* Overlay: Driver Assignment Float Card */}
            <motion.div
              animate={{ y: [0, 8, 0] }}
              transition={{ duration: 5.2, repeat: Infinity, ease: "easeInOut", delay: 0.4 }}
              className="absolute right-6 bottom-8 max-w-[250px] bg-white border border-[#DEE3DD] rounded-xl p-4 shadow-lg hover:shadow-xl transition-all duration-300 pointer-events-auto"
            >
              <div className="flex items-start gap-2.5">
                <div className="w-2.5 h-2.5 rounded-full bg-[#182B25] mt-1" />
                <div className="flex-1">
                  <h4 className="text-xs font-bold text-[#1A1A1A]">ETA Sequence Verified</h4>
                  <p className="text-[10px] text-[#5A5F65] mt-0.5 leading-normal">Ravinder assigned to Jalandhar East. Stops 1, 2, 4 synced.</p>
                </div>
              </div>
            </motion.div>

          </div>
        </motion.div>

      </div>
    </section>
  );
}
