/**
 * FlashcardGrid — exactly 3×2 layout filling the screen.
 * All 6 cards visible at once, no scrolling needed.
 * Cards fill height: calc(100vh - 200px).
 * Zero transparency — each card uses the topic's exact solid bg color.
 */

import FlashcardCard from './FlashcardCard';

export default function FlashcardGrid({ topics, onTopicSelect }) {
  return (
    <section
      style={{
        width: '100%',
        padding: '0 24px 24px',
        boxSizing: 'border-box',
      }}
    >
      {/* Heading */}
      <div style={{ textAlign: 'center', marginBottom: '28px' }}>
        <h2
          style={{
            fontFamily: "'Bebas Neue', sans-serif",
            fontSize: 'clamp(42px, 7vw, 72px)',
            letterSpacing: '0.04em',
            color: '#FFFFFF',
            lineHeight: 1,
            marginBottom: '8px',
          }}
        >
          PICK YOUR VIBE
        </h2>
        <p
          style={{
            fontFamily: "'Space Grotesk', sans-serif",
            fontSize: '14px',
            color: '#6B7280',
          }}
        >
          6 topics. Real Indian finance. Zero BS.
        </p>
      </div>

      {/* Strict 3×2 grid — all 6 cards on screen at once */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gridTemplateRows: 'repeat(2, 1fr)',
          height: 'calc(100vh - 200px)',
          gap: '16px',
        }}
      >
        {topics.slice(0, 6).map((topic, index) => (
          <FlashcardCard
            key={topic.id}
            topic={topic}
            index={index}
            onClick={onTopicSelect}
          />
        ))}
      </div>
    </section>
  );
}
