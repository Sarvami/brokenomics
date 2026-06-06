/**
 * MemeSlot — placeholder for contextual memes in journey steps.
 * Dashed border uses the topic's accent color.
 */

import { Image } from 'phosphor-react';

export default function MemeSlot({ label = 'Meme loading...', accentColor = 'rgba(255,255,255,0.20)' }) {
  return (
    <div
      style={{
        width: '100%',
        maxWidth: '320px',
        margin: '16px 0',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        borderRadius: '16px',
        // Dashed border uses topic accent color
        border: `2px dashed ${accentColor}50`,
        padding: '24px 20px',
        minHeight: '120px',
        backgroundColor: `${accentColor}08`,
      }}
      aria-label={`Meme placeholder: ${label}`}
    >
      <Image size={28} color={`${accentColor}60`} />
      <p
        style={{
          fontFamily: "'Space Grotesk', sans-serif",
          fontSize: '12px',
          color: '#555555',
          lineHeight: 1.5,
          textAlign: 'center',
        }}
      >
        {label}
      </p>
    </div>
  );
}
