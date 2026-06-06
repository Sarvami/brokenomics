/**
 * BentoGrid — topic sub-topic selector with varying card sizes.
 * 3 clearly different shades per topic for contrast.
 * Top accent border line on every card.
 * Hover: background brightens + glow box-shadow.
 * Zero transparency, zero backdrop-blur.
 */

import { useState } from 'react';
import { motion } from 'framer-motion';

/**
 * Three clearly different shades per topic:
 * [0] = darkest  → small cards
 * [1] = medium   → medium/tall cards
 * [2] = brightest → large/wide cards (most visible)
 *
 * hoverShades: one step brighter for each shade on hover
 */
const TOPIC_SHADES = {
  'mutual-funds':   { shades: ['#1A0505', '#2A0808', '#3A0A0A'], hover: ['#2A0808', '#3A0A0A', '#4A0D0D'], accent: '#C0392B' },
  'stocks-trading': { shades: ['#05051A', '#0A0A2A', '#0D0D3A'], hover: ['#0A0A2A', '#0D0D3A', '#121250'], accent: '#1A56DB' },
  'banking':        { shades: ['#051A05', '#0A2A0A', '#0D3A0D'], hover: ['#0A2A0A', '#0D3A0D', '#0F4A0F'], accent: '#27AE60' },
  'loans-credit':   { shades: ['#051A18', '#071F1E', '#0A2A28'], hover: ['#071F1E', '#0A2A28', '#0D3532'], accent: '#0D9488' },
  'taxes-saving':   { shades: ['#0A051A', '#14082A', '#1A0A3A'], hover: ['#14082A', '#1A0A3A', '#22104A'], accent: '#6B21A8' },
  'investing-101':  { shades: ['#1A0505', '#2A0808', '#350B0B'], hover: ['#2A0808', '#350B0B', '#440D0D'], accent: '#E74C3C' },
};

/**
 * Span pattern for 6 cards:
 * 0: col-span 2 (wide/large) → brightest shade [2]
 * 1: row-span 2 (tall/medium) → medium shade [1]
 * 2: 1×1 small → darkest shade [0]
 * 3: 1×1 small → darkest shade [0]
 * 4: row-span 2 (tall/medium) → medium shade [1]
 * 5: 1×1 small → darkest shade [0]
 */
const SPAN_PATTERN = [
  { colSpan: 2, rowSpan: 1, shadeIndex: 2 }, // large → brightest
  { colSpan: 1, rowSpan: 2, shadeIndex: 1 }, // tall  → medium
  { colSpan: 1, rowSpan: 1, shadeIndex: 0 }, // small → darkest
  { colSpan: 1, rowSpan: 1, shadeIndex: 0 }, // small → darkest
  { colSpan: 1, rowSpan: 2, shadeIndex: 1 }, // tall  → medium
  { colSpan: 1, rowSpan: 1, shadeIndex: 0 }, // small → darkest
];

function BentoCard({ subTopic, bg, hoverBg, accent, colSpan, rowSpan, delay, onClick }) {
  const [hovered, setHovered] = useState(false);

  return (
    <motion.button
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.35, delay }}
      onClick={() => onClick(subTopic)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        gridColumn: `span ${colSpan}`,
        gridRow: `span ${rowSpan}`,
        // Solid background — switches on hover via state
        backgroundColor: hovered ? hoverBg : bg,
        // Hover glow
        boxShadow: hovered
          ? `0 0 20px ${accent}33, 0 4px 16px rgba(0,0,0,0.50)`
          : `0 4px 12px rgba(0,0,0,0.40)`,
        borderRadius: '14px',
        padding: '20px 22px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-end',
        cursor: 'pointer',
        border: 'none',
        borderTop: `3px solid ${accent}`, // must repeat after border: none
        textAlign: 'left',
        position: 'relative',
        overflow: 'hidden',
        transition: 'background-color 0.18s, box-shadow 0.18s',
      }}
      aria-label={`Start: ${subTopic.title}`}
    >
      {/* Accent corner using two known solid colors — no rgba leakage */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          right: 0,
          width: '70px',
          height: '70px',
          background: `linear-gradient(225deg, ${accent}28, ${hovered ? hoverBg : bg})`,
          borderRadius: '0 14px 0 0',
          pointerEvents: 'none',
        }}
      />

      {/* Title — Bebas Neue 22px, white */}
      <h3
        style={{
          fontFamily: "'Bebas Neue', sans-serif",
          fontSize: '22px',
          letterSpacing: '0.04em',
          color: '#FFFFFF',
          lineHeight: 1.15,
          position: 'relative',
          zIndex: 1,
          display: '-webkit-box',
          WebkitLineClamp: 4,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
        }}
      >
        {subTopic.title}
      </h3>

      {/* Accent underline */}
      <div
        style={{
          width: hovered ? '36px' : '24px',
          height: '2px',
          backgroundColor: accent,
          borderRadius: '9999px',
          marginTop: '8px',
          position: 'relative',
          zIndex: 1,
          transition: 'width 0.2s',
        }}
      />
    </motion.button>
  );
}

export default function BentoGrid({ topic, subTopics, onSubTopicSelect }) {
  const topicId = topic?.id || 'mutual-funds';
  const themeData = TOPIC_SHADES[topicId] || TOPIC_SHADES['mutual-funds'];
  const { shades, hover: hoverShades, accent } = themeData;

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gridAutoRows: '140px',
        gap: '12px',
        width: '100%',
        maxWidth: '860px',
      }}
    >
      {subTopics.map((subTopic, i) => {
        const pattern = SPAN_PATTERN[i % SPAN_PATTERN.length];
        return (
          <BentoCard
            key={subTopic.id}
            subTopic={subTopic}
            bg={shades[pattern.shadeIndex]}
            hoverBg={hoverShades[pattern.shadeIndex]}
            accent={accent}
            colSpan={pattern.colSpan}
            rowSpan={pattern.rowSpan}
            delay={i * 0.05}
            onClick={onSubTopicSelect}
          />
        );
      })}
    </div>
  );
}
