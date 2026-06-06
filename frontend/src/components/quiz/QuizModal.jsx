/**
 * QuizModal — personalisation quiz, slides in from bottom.
 * Clean rectangular options, no emojis, no pill borders.
 * Next → button: full width, Bebas Neue, topic accent.
 * Header: question number + question in Bebas Neue, 28px padding.
 * Max width 480px, centered.
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle } from 'phosphor-react';
import { quizAPI } from '../../lib/api';

// Fallback questions — no emojis
const FALLBACK_QUESTIONS = [
  {
    id: 'q1',
    question: 'How would you describe your current money situation?',
    options: [
      { id: 'a', text: 'Broke but curious' },
      { id: 'b', text: 'Stable, but money is just sitting there' },
      { id: 'c', text: 'Saving a bit, ready to invest' },
      { id: 'd', text: 'Already investing, want to level up' },
    ],
  },
  {
    id: 'q2',
    question: "What's your biggest money fear right now?",
    options: [
      { id: 'a', text: 'Running out before month end' },
      { id: 'b', text: 'Not having enough for emergencies' },
      { id: 'c', text: 'Inflation eating my savings' },
      { id: 'd', text: 'Making the wrong investment' },
    ],
  },
  {
    id: 'q3',
    question: 'How much time can you spend learning this?',
    options: [
      { id: 'a', text: '5 minutes a day' },
      { id: 'b', text: '15 to 30 minutes a day' },
      { id: 'c', text: 'As long as it takes' },
    ],
  },
];

export default function QuizModal({ topic, onClose, onComplete }) {
  const [questions, setQuestions] = useState(topic?.id ? [] : FALLBACK_QUESTIONS);
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(!!topic?.id);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  // track hover per option
  const [hoveredOption, setHoveredOption] = useState(null);

  const accentColor = topic?.accentColor || '#C0392B';

  useEffect(() => {
    const fetch = async () => {
      try {
        const data = await quizAPI.getQuestions(topic.id);
        setQuestions(data.questions || data || FALLBACK_QUESTIONS);
      } catch {
        setQuestions(FALLBACK_QUESTIONS);
      } finally {
        setLoading(false);
      }
    };
    if (topic?.id) fetch();
  }, [topic?.id]);

  const question = questions[currentQ];
  const isLast = currentQ === questions.length - 1;
  const progressPct = questions.length ? ((currentQ + 1) / questions.length) * 100 : 0;
  const selectedOption = answers[question?.id];
  const canProceed = !!selectedOption;

  const handleSelect = (id) => setAnswers(prev => ({ ...prev, [question?.id]: id }));

  const handleNext = async () => {
    if (isLast) {
      setSubmitting(true);
      try {
        const result = await quizAPI.submitAnswers(topic.id, answers);
        setDone(true);
        // Pass both recommended order AND the answers so Home can cache them
        setTimeout(() => onComplete(result?.recommended_subtopic_order || [], answers), 1400);
      } catch {
        setDone(true);
        setTimeout(() => onComplete([], answers), 1400);
      } finally {
        setSubmitting(false);
      }
    } else {
      setCurrentQ(q => q + 1);
      setHoveredOption(null);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        key="quiz-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 50,
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'center',
          background: 'rgba(0,0,0,0.65)',
          backdropFilter: 'blur(4px)',
        }}
        onClick={onClose}
      >
        <motion.div
          key="quiz-panel"
          initial={{ y: '100%', opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: '100%', opacity: 0 }}
          transition={{ type: 'spring', damping: 28, stiffness: 300 }}
          style={{
            width: '100%',
            maxWidth: '480px',
            backgroundColor: '#13131A',
            borderRadius: '24px 24px 0 0',
            borderTop: `3px solid ${accentColor}`,
            maxHeight: '90svh',
            overflowY: 'auto',
            padding: '28px',
          }}
          onClick={e => e.stopPropagation()}
        >
          {/* Header row */}
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '20px' }}>
            <div style={{ flex: 1 }}>
              {/* Question counter — #888, 13px, Space Grotesk */}
              <p
                style={{
                  fontFamily: "'Space Grotesk', sans-serif",
                  fontSize: '13px',
                  color: '#888888',
                  fontWeight: 400,
                  marginBottom: '10px',
                }}
              >
                {currentQ + 1} / {questions.length}
              </p>

              {!done && question && (
                <h3
                  style={{
                    fontFamily: "'Bebas Neue', sans-serif",
                    fontSize: '28px',
                    letterSpacing: '0.03em',
                    color: '#FFFFFF',
                    lineHeight: 1.1,
                    marginRight: '32px',
                  }}
                >
                  {question.question}
                </h3>
              )}
            </div>

            <button
              onClick={onClose}
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                backgroundColor: '#1E1E2E',
                border: '1px solid rgba(255,255,255,0.08)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
              aria-label="Close quiz"
            >
              <X size={16} color="#6B7280" />
            </button>
          </div>

          {/* Progress bar */}
          <div
            style={{
              height: '3px',
              borderRadius: '9999px',
              backgroundColor: '#1E1E2E',
              overflow: 'hidden',
              marginBottom: '24px',
            }}
          >
            <motion.div
              animate={{ width: `${progressPct}%` }}
              transition={{ duration: 0.4 }}
              style={{ height: '100%', backgroundColor: accentColor, borderRadius: '9999px' }}
            />
          </div>

          {/* Body */}
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '40px 0' }}>
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  border: `2px solid ${accentColor}`,
                  borderTopColor: 'transparent',
                  animation: 'spin 0.8s linear infinite',
                }}
              />
            </div>
          ) : done ? (
            <motion.div
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '32px 0', gap: '16px' }}
            >
              <CheckCircle size={56} color={accentColor} weight="fill" />
              <h4
                style={{
                  fontFamily: "'Bebas Neue', sans-serif",
                  fontSize: '28px',
                  letterSpacing: '0.04em',
                  color: '#FFFFFF',
                  textAlign: 'center',
                }}
              >
                SORTED! BUILDING YOUR JOURNEY...
              </h4>
              <p
                style={{
                  fontFamily: "'Space Grotesk', sans-serif",
                  fontSize: '14px',
                  color: '#6B7280',
                  textAlign: 'center',
                }}
              >
                We&apos;ve personalised the path just for you.
              </p>
            </motion.div>
          ) : (
            <AnimatePresence mode="wait">
              <motion.div
                key={currentQ}
                initial={{ x: 24, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -24, opacity: 0 }}
                transition={{ duration: 0.22 }}
              >
                {/* Options — solid #1A1A2A, no circular borders, gap 12px */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
                  {question?.options?.map((option) => {
                    const isSelected = selectedOption === option.id;
                    const isHovered = hoveredOption === option.id;
                    return (
                      <button
                        key={option.id}
                        onClick={() => handleSelect(option.id)}
                        onMouseEnter={() => setHoveredOption(option.id)}
                        onMouseLeave={() => setHoveredOption(null)}
                        style={{
                          width: '100%',
                          padding: '16px 20px',
                          borderRadius: '12px',
                          backgroundColor: isSelected
                            ? accentColor
                            : isHovered
                            ? '#252535'
                            : '#1A1A2A',
                          border: 'none',
                          color: '#FFFFFF',
                          fontFamily: "'Space Grotesk', sans-serif",
                          fontSize: '16px',
                          fontWeight: 400,
                          textAlign: 'left',
                          cursor: 'pointer',
                          transition: 'background-color 0.12s',
                          lineHeight: 1.4,
                        }}
                      >
                        {option.text}
                      </button>
                    );
                  })}
                </div>

                {/* Next button — full width, Bebas Neue 22px, 54px tall */}
                <button
                  onClick={handleNext}
                  disabled={!canProceed || submitting}
                  style={{
                    width: '100%',
                    height: '54px',
                    borderRadius: '12px',
                    backgroundColor: canProceed ? accentColor : '#1A1A2A',
                    color: canProceed ? '#FFFFFF' : '#4B5563',
                    fontFamily: "'Bebas Neue', sans-serif",
                    fontSize: '22px',
                    letterSpacing: '0.06em',
                    border: 'none',
                    cursor: canProceed ? 'pointer' : 'not-allowed',
                    transition: 'background-color 0.15s',
                    marginTop: '20px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {submitting
                    ? 'BUILDING YOUR PATH...'
                    : isLast
                    ? 'SHOW MY JOURNEY →'
                    : 'NEXT →'}
                </button>
              </motion.div>
            </AnimatePresence>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
