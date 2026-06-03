/**
 * FollowupChips — clickable quick-reply suggestions below assistant messages.
 */

export default function FollowupChips({ chips, onSelect, accentColor }) {
  if (!chips?.length) return null;

  return (
    <div className="flex flex-wrap gap-2 mt-2 max-w-[90%]">
      {chips.map((chip, i) => (
        <button
          key={i}
          onClick={() => onSelect(typeof chip === 'string' ? chip : chip.text)}
          className="pill-btn text-xs"
          style={{
            padding: '5px 12px',
            fontSize: '12px',
            borderColor: `${accentColor}40`,
            color: '#D1D5DB',
          }}
        >
          {typeof chip === 'string' ? chip : chip.text}
        </button>
      ))}
    </div>
  );
}
