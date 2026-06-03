/**
 * ChatMessage — renders a single chat bubble.
 * User messages: right-aligned dark bubble
 * Assistant messages: left-aligned glass bubble + followup chips + related subtopics
 */

import { motion } from 'framer-motion';
import FollowupChips from './FollowupChips';

function RelatedSubTopics({ subtopics, accentColor }) {
  if (!subtopics?.length) return null;

  return (
    <div className="mt-3 flex flex-wrap gap-2">
      <span
        className="text-xs text-gray-600 w-full"
        style={{ fontFamily: "'Space Grotesk', sans-serif" }}
      >
        Related topics:
      </span>
      {subtopics.map((sub, i) => (
        <span
          key={i}
          className="text-xs px-2.5 py-1 rounded-lg"
          style={{
            background: `${accentColor}15`,
            border: `1px solid ${accentColor}30`,
            color: accentColor,
            fontFamily: "'Space Grotesk', sans-serif",
          }}
        >
          {sub.title || sub}
        </span>
      ))}
    </div>
  );
}

export default function ChatMessage({ message, onFollowupClick, accentColor }) {
  const isUser = message.role === 'user';

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
    >
      {/* Bubble */}
      <div className={isUser ? 'chat-bubble-user' : 'chat-bubble-assistant'}>
        <p
          style={{
            fontFamily: "'Space Grotesk', sans-serif",
            fontSize: '13px',
            lineHeight: '1.6',
            margin: 0,
          }}
        >
          {message.content}
        </p>
      </div>

      {/* Timestamp */}
      <span
        className="text-[10px] text-gray-700 mt-1 px-1"
        style={{ fontFamily: "'Space Grotesk', sans-serif" }}
      >
        {message.timestamp
          ? new Date(message.timestamp).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })
          : ''}
      </span>

      {/* Assistant extras: followup chips + related subtopics */}
      {!isUser && (
        <>
          {message.suggested_followups?.length > 0 && (
            <FollowupChips
              chips={message.suggested_followups}
              onSelect={onFollowupClick}
              accentColor={accentColor}
            />
          )}
          {message.related_sub_topics?.length > 0 && (
            <RelatedSubTopics
              subtopics={message.related_sub_topics}
              accentColor={accentColor}
            />
          )}
        </>
      )}
    </motion.div>
  );
}
