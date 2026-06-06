/**
 * FlashcardCard — fills its grid cell, fully solid, zero transparency.
 * HOVER → 3D lateral flip. Back = topic accent color, solid.
 * CLICK → topic zoom transition.
 * backgroundColor applied as inline style directly on card div.
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight } from 'phosphor-react';

/**
 * All colors explicit per topic — no fallback to orange.
 * backBg = the back face solid background color.
 */
const CARD_THEME = {
  'mutual-funds':   { cardBg: '#1A0505', borderColor: '#C0392B', backBg: '#C0392B' },
  'stocks-trading': { cardBg: '#05051A', borderColor: '#1A56DB', backBg: '#1A56DB' },
  'banking':        { cardBg: '#051A05', borderColor: '#27AE60', backBg: '#27AE60' },
  'loans-credit':   { cardBg: '#051A1A', borderColor: '#0D9488', backBg: '#0D9488' },
  'taxes-saving':   { cardBg: '#0A051A', borderColor: '#6B21A8', backBg: '#6B21A8' },
  'investing-101':  { cardBg: '#1A0505', borderColor: '#E74C3C', backBg: '#E74C3C' },
};

export default function FlashcardCard({ topic, onClick, index }) {
  const [hovered, setHovered] = useState(false);

  const { id, name, teaser, description, progress } = topic;

  // Explicit lookup — if id is missing from map, derive from topic data directly
  // This prevents any card falling back to a shared default orange
  const theme = CARD_THEME[id] ?? {
    cardBg: '#111118',
    borderColor: topic.accentColor || '#888888',
    backBg: topic.accentColor || '#888888',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.06, ease: 'easeOut' }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => onClick(topic)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick(topic); }
      }}
      aria-label={`Explore ${name}`}
      style={{
        width: '100%',
        height: '100%',
        cursor: 'pointer',
        perspective: '1000px',
        // Ensure the motion.div itself has no bg that could bleed through
        backgroundColor: 'transparent',
      }}
    >
      {/* 3D flip wrapper */}
      <motion.div
        animate={{ rotateY: hovered ? 180 : 0 }}
        transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
        style={{
          width: '100%',
          height: '100%',
          position: 'relative',
          transformStyle: 'preserve-3d',
        }}
      >
        {/* ── FRONT FACE ── */}
        <div
          style={{
            // backgroundColor as direct inline style — no Tailwind class
            backgroundColor: theme.cardBg,
            position: 'absolute',
            inset: 0,
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
            borderRadius: '16px',
            // Left accent border via inset box-shadow
            boxShadow: `inset 4px 0 0 ${theme.borderColor}, 0 4px 20px rgba(0,0,0,0.50)`,
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            overflow: 'hidden',
          }}
        >
          {/* Left glow strip — narrow, solid linear-gradient between two known colors */}
          <div
            style={{
              position: 'absolute',
              left: 0,
              top: 0,
              bottom: 0,
              width: '56px',
              background: `linear-gradient(to right, ${theme.borderColor}28, ${theme.cardBg})`,
              pointerEvents: 'none',
            }}
          />

          {/* Name */}
          <div style={{ position: 'relative', zIndex: 1 }}>
            <h2
              style={{
                fontFamily: "'Bebas Neue', sans-serif",
                fontSize: 'clamp(24px, 2.5vw, 32px)',
                letterSpacing: '0.04em',
                color: '#FFFFFF',
                lineHeight: 1.1,
                marginBottom: '14px',
              }}
            >
              {name}
            </h2>

            {/* Teaser pill */}
            <div
              style={{
                display: 'inline-block',
                backgroundColor: '#FFFFFF12',
                border: '1px solid #FFFFFF22',
                borderRadius: '20px',
                padding: '5px 11px',
              }}
            >
              <span
                style={{
                  fontFamily: "'Space Grotesk', sans-serif",
                  fontSize: '13px',
                  color: '#FFFFFF',
                  fontWeight: 400,
                  lineHeight: 1.4,
                }}
              >
                {teaser}
              </span>
            </div>
          </div>

          {/* Progress bar */}
          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
              <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '10px', color: '#FFFFFF35' }}>
                Progress
              </span>
              <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '10px', color: theme.borderColor, fontWeight: 600 }}>
                {progress}%
              </span>
            </div>
            <div style={{ height: '2px', borderRadius: '9999px', backgroundColor: '#FFFFFF12', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${progress}%`, borderRadius: '9999px', backgroundColor: theme.borderColor }} />
            </div>
          </div>
        </div>

        {/* ── BACK FACE — solid topic accent color ── */}
        <div
          style={{
            // Each topic's specific accent as solid background — no shared default
            backgroundColor: theme.backBg,
            position: 'absolute',
            inset: 0,
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)',
            borderRadius: '16px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.50)',
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            overflow: 'hidden',
          }}
        >
          {/* Darkening overlay using the card's own solid bg color — no rgba */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: `linear-gradient(145deg, ${theme.backBg}, ${theme.cardBg})`,
              borderRadius: '16px',
              pointerEvents: 'none',
            }}
          />

          <div style={{ position: 'relative', zIndex: 1 }}>
            <h3
              style={{
                fontFamily: "'Bebas Neue', sans-serif",
                fontSize: 'clamp(28px, 3vw, 36px)',
                letterSpacing: '0.04em',
                color: '#FFFFFF',
                lineHeight: 1.05,
                marginBottom: '10px',
              }}
            >
              {name}
            </h3>
            <p
              style={{
                fontFamily: "'Space Grotesk', sans-serif",
                fontSize: '13px',
                color: '#FFFFFFCC',
                lineHeight: 1.55,
              }}
            >
              {description}
            </p>
          </div>

          <button
            onClick={(e) => { e.stopPropagation(); onClick(topic); }}
            style={{
              position: 'relative',
              zIndex: 1,
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              alignSelf: 'flex-start',
              padding: '9px 18px',
              borderRadius: '12px',
              backgroundColor: '#FFFFFF20',
              border: '1px solid #FFFFFF40',
              color: '#FFFFFF',
              fontFamily: "'Space Grotesk', sans-serif",
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'background-color 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#FFFFFF35'; }}
            onMouseLeave={e => { e.currentTarget.style.backgroundColor = '#FFFFFF20'; }}
          >
            Let&apos;s go <ArrowRight weight="bold" size={14} />
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
