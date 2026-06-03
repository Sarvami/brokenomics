/**
 * JargonTooltip — renders a word with a dotted underline.
 * On hover, shows a tooltip with the plain_english explanation.
 * Used to replace jargon_terms found in journey step content.
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function JargonTooltip({ word, plainEnglish }) {
  const [visible, setVisible] = useState(false);

  return (
    <span
      className="jargon-word relative inline-block"
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
      onFocus={() => setVisible(true)}
      onBlur={() => setVisible(false)}
      tabIndex={0}
      aria-describedby={visible ? `tooltip-${word}` : undefined}
    >
      {word}

      <AnimatePresence>
        {visible && (
          <motion.div
            id={`tooltip-${word}`}
            role="tooltip"
            initial={{ opacity: 0, y: 6, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute bottom-full left-1/2 mb-2 z-50 pointer-events-none"
            style={{
              transform: 'translateX(-50%)',
              width: '200px',
            }}
          >
            <div
              className="rounded-xl px-3 py-2.5 text-xs leading-relaxed"
              style={{
                background: '#1E1E2E',
                border: '1px solid rgba(255,255,255,0.15)',
                boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
                color: '#E5E7EB',
                fontFamily: "'Space Grotesk', sans-serif",
              }}
            >
              <span
                className="block text-[10px] uppercase tracking-wider mb-1"
                style={{ color: 'rgba(255,255,255,0.35)' }}
              >
                plain english
              </span>
              {plainEnglish}
            </div>
            {/* Tooltip arrow */}
            <div
              className="absolute left-1/2 -translate-x-1/2"
              style={{
                bottom: '-5px',
                width: 0,
                height: 0,
                borderLeft: '6px solid transparent',
                borderRight: '6px solid transparent',
                borderTop: '6px solid #1E1E2E',
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </span>
  );
}
