import React from 'react';
import { motion } from 'framer-motion';

export default function WorkspaceContainer({ id, title, subtitle, children }) {
  const subtitleMap = {
    'Order Management': 'Streamlined logistical control of global fleet assignments.',
    'Driver Management': 'Manage active drivers, assignments, and availability.',
    'Advanced Analytics': 'Real-time metrics and system performance.',
  };

  return (
    <motion.div
      key={id}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      style={{ width: '100%', maxWidth: 1200 }}
    >
      {/* Page heading */}
      <div style={{ marginBottom: 32 }}>
        <h1 style={{
          fontSize: 32, fontWeight: 300, letterSpacing: '-0.02em',
          fontFamily: "'Hanken Grotesk', sans-serif",
          color: 'var(--ink)', margin: 0, lineHeight: 1.1,
        }}>
          {title}
        </h1>
        <p style={{ fontSize: 13, color: 'var(--ink-muted)', marginTop: 4, fontFamily: 'Inter, sans-serif' }}>
          {subtitle || subtitleMap[title] || ''}
        </p>
      </div>

      {children}
    </motion.div>
  );
}
