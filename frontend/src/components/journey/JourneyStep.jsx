/**
 * JourneyStep — single node in the vertical flowchart.
 * STEP N label: 11px, #888, uppercase
 * Title: Bebas Neue 26px, white
 * Description: Space Grotesk 15px, #CCCCCC, line-height 1.6
 * Left vertical connecting line between circles.
 * Active circle: filled accent. Inactive: border only.
 * 24px padding between steps.
 * MemeSlot every 3rd step — dashed border uses accent color.
 */

import { motion } from 'framer-motion';
import JargonTooltip from './JargonTooltip';
import MemeSlot from './MemeSlot';

function parseContentWithJargon(content, jargonTerms = []) {
  if (!jargonTerms.length || !content) return <span>{content}</span>;

  const escaped = jargonTerms.map((j) =>
    j.term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  );
  const pattern = new RegExp(`(${escaped.join('|')})`, 'gi');
  const parts = content.split(pattern);
  const termMap = Object.fromEntries(
    jargonTerms.map((j) => [j.term.toLowerCase(), j.plain_english])
  );

  return (
    <>
      {parts.map((part, i) => {
        const lower = part.toLowerCase();
        if (termMap[lower]) {
          return <JargonTooltip key={i} word={part} plainEnglish={termMap[lower]} />;
        }
        return <span key={i}>{part}</span>;
      })}
    </>
  );
}

export default function JourneyStep({
  step,
  index,
  isLast,
  isCompleted,
  isCurrent,
  jargonTerms = [],
  accentColor = '#C0392B',
}) {
  const showMeme = index % 3 === 2 && !isLast;

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.45, delay: index * 0.07, ease: 'easeOut' }}
      style={{
        display: 'flex',
        gap: '16px',
        paddingBottom: '24px',
      }}
    >
      {/* Left column: circle + vertical line */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
        {/* Circle */}
        <div
          style={{
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            // Active = filled accent, inactive = border only
            backgroundColor: isCurrent ? accentColor : isCompleted ? `${accentColor}30` : 'transparent',
            border: `2px solid ${isCompleted || isCurrent ? accentColor : 'rgba(255,255,255,0.18)'}`,
            transition: 'background-color 0.3s, border-color 0.3s',
          }}
        >
          <span
            style={{
              fontFamily: "'Space Grotesk', sans-serif",
              fontSize: '13px',
              fontWeight: 700,
              color: isCurrent ? '#FFFFFF' : isCompleted ? accentColor : 'rgba(255,255,255,0.30)',
            }}
          >
            {index + 1}
          </span>
        </div>

        {/* Vertical connecting line */}
        {!isLast && (
          <div
            style={{
              width: '2px',
              flex: 1,
              minHeight: '32px',
              background: `linear-gradient(to bottom, ${accentColor}60, rgba(255,255,255,0.06))`,
              marginTop: '4px',
            }}
          />
        )}
      </div>

      {/* Right column: content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        {/* STEP N label */}
        <p
          style={{
            fontFamily: "'Space Grotesk', sans-serif",
            fontSize: '11px',
            color: '#888888',
            textTransform: 'uppercase',
            letterSpacing: '0.10em',
            marginBottom: '6px',
          }}
        >
          STEP {index + 1}
        </p>

        {/* Title */}
        <h4
          style={{
            fontFamily: "'Bebas Neue', sans-serif",
            fontSize: '26px',
            letterSpacing: '0.03em',
            color: '#FFFFFF',
            lineHeight: 1.1,
            marginBottom: '10px',
            opacity: isCompleted ? 0.65 : 1,
          }}
        >
          {step.title}
        </h4>

        {/* Description */}
        <p
          style={{
            fontFamily: "'Space Grotesk', sans-serif",
            fontSize: '15px',
            color: '#CCCCCC',
            lineHeight: 1.6,
          }}
        >
          {parseContentWithJargon(step.content || step.description, jargonTerms)}
        </p>

        {/* MemeSlot every 3rd step */}
        {showMeme && (
          <MemeSlot
            label={`${step.title} — the meme version`}
            context={step.title}
            accentColor={accentColor}
          />
        )}
      </div>
    </motion.div>
  );
}
