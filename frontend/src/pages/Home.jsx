/**
 * Home page — /
 * Three screens/states:
 * 1. LANDING — full-screen, shown on load
 * 2. GRID    — flashcard grid
 * 3. TOPIC   — bento grid for sub-topic selection
 *
 * Quiz is shown once per topic — answers cached in localStorage.
 * Cursor gradient removed — static #0F0F14 background.
 */

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Sparkle, X, UserCircle } from 'phosphor-react';
import useTopics from '../hooks/useTopics';
import { useAuth } from '../hooks/useAuth';
import FlashcardGrid from '../components/flashcard/FlashcardGrid';
import BentoGrid from '../components/bento/BentoGrid';
import QuizModal from '../components/quiz/QuizModal';
import { useNavigate } from 'react-router-dom';

const SCREEN = { LANDING: 'landing', GRID: 'grid', TOPIC: 'topic' };

// ── localStorage helpers ──
const quizKey = (topicId) => `quiz_${topicId}`;

function hasCompletedQuiz(topicId) {
  try { return !!localStorage.getItem(quizKey(topicId)); } catch { return false; }
}
function saveQuizAnswers(topicId, answers) {
  try { localStorage.setItem(quizKey(topicId), JSON.stringify(answers)); } catch {}
}
function clearQuizAnswers(topicId) {
  try { localStorage.removeItem(quizKey(topicId)); } catch {}
}

export default function Home() {
  const { topics } = useTopics();
  const navigate = useNavigate();
  const { requireAuth, startGuestSession } = useAuth();

  const [screen, setScreen] = useState(SCREEN.LANDING);
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [zooming, setZooming] = useState(false);
  const [orderedSubTopics, setOrderedSubTopics] = useState([]);
  const [quizOpen, setQuizOpen] = useState(false);
  const [quizSubTopic, setQuizSubTopic] = useState(null);

  // Static dark background — no cursor gradient
  const pageBg = selectedTopic && screen === SCREEN.TOPIC
    ? `linear-gradient(180deg, ${selectedTopic.accentColor}18 0%, #0F0F14 35%)`
    : '#0F0F14';

  // ── Landing handlers ──
  const handleGetStarted = useCallback(() => {
    requireAuth('login');
    setScreen(SCREEN.GRID);
  }, [requireAuth]);

  const handleContinueAsGuest = useCallback(async () => {
    await startGuestSession();
    setScreen(SCREEN.GRID);
  }, [startGuestSession]);

  // ── Topic card click → zoom → topic screen ──
  const handleTopicSelect = useCallback((topic) => {
    setSelectedTopic(topic);
    setZooming(true);
    setOrderedSubTopics(topic.subTopics);
    setTimeout(() => { setZooming(false); setScreen(SCREEN.TOPIC); }, 800);
  }, []);

  // ── Back to grid ──
  const handleBackToGrid = useCallback(() => {
    setScreen(SCREEN.GRID);
    setSelectedTopic(null);
    setOrderedSubTopics([]);
  }, []);

  // ── Sub-topic click → check quiz cache first ──
  const handleSubTopicSelect = useCallback((subTopic) => {
    setQuizSubTopic(subTopic);
    if (hasCompletedQuiz(selectedTopic?.id)) {
      // Already answered — skip quiz, go straight to journey
      navigate(`/topic/${selectedTopic?.id}/subtopic/${subTopic.id}`);
    } else {
      setQuizOpen(true);
    }
  }, [selectedTopic, navigate]);

  // ── Quiz complete → save to localStorage + navigate ──
  const handleQuizComplete = useCallback((recommendedOrder, answersToSave) => {
    setQuizOpen(false);

    // Cache answers so quiz is skipped next time
    if (selectedTopic?.id) {
      saveQuizAnswers(selectedTopic.id, answersToSave || {});
    }

    // Reorder sub-topics if backend gave us an order
    if (recommendedOrder?.length && selectedTopic) {
      const reordered = [...selectedTopic.subTopics].sort((a, b) => {
        const ai = recommendedOrder.indexOf(a.id);
        const bi = recommendedOrder.indexOf(b.id);
        if (ai === -1 && bi === -1) return 0;
        if (ai === -1) return 1;
        if (bi === -1) return -1;
        return ai - bi;
      });
      setOrderedSubTopics(reordered);
    }

    setTimeout(() => {
      navigate(`/topic/${selectedTopic?.id}/subtopic/${quizSubTopic?.id || 'intro'}`);
    }, 300);
  }, [selectedTopic, quizSubTopic, navigate]);

  // ── Retake quiz — clears cache ──
  const handleRetakeQuiz = useCallback(() => {
    if (selectedTopic?.id) clearQuizAnswers(selectedTopic.id);
    setQuizSubTopic(selectedTopic?.subTopics?.[0] || null);
    setQuizOpen(true);
  }, [selectedTopic]);

  return (
    <div
      className="min-h-screen w-full relative overflow-x-hidden"
      style={{ background: pageBg }}
    >
      {/* ── ZOOM TRANSITION OVERLAY ── */}
      <AnimatePresence>
        {zooming && selectedTopic && (
          <motion.div
            key="zoom-overlay"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center"
            style={{ background: '#0F0F14' }}
          >
            <motion.h1
              initial={{ scale: 0.3, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 2, opacity: 0 }}
              transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
              className="text-center px-4"
              style={{
                fontFamily: "'Bebas Neue', sans-serif",
                fontSize: 'clamp(56px, 15vw, 140px)',
                letterSpacing: '0.04em',
                color: selectedTopic.accentColor,
                lineHeight: 1,
              }}
            >
              {selectedTopic.name}
            </motion.h1>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ══ SCREEN 1 — LANDING ══ */}
      <AnimatePresence>
        {screen === SCREEN.LANDING && (
          <motion.div
            key="landing"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 0.97 }} transition={{ duration: 0.4 }}
            className="fixed inset-0 z-20 flex flex-col items-center justify-center px-6 text-center"
          >
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="flex items-center gap-2 mb-6 px-4 py-1.5 rounded-full"
              style={{ background: 'rgba(108,99,255,0.12)', border: '1px solid rgba(108,99,255,0.30)' }}
            >
              <Sparkle size={13} color="#A78BFA" weight="fill" />
              <span style={{ fontFamily: "'Space Grotesk', sans-serif", color: '#A78BFA', fontSize: '20px' }}>
                Finance education that doesn&apos;t bore you to death
              </span>
            </motion.div>

            {/* Headline */}
            <motion.h1
              initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15, duration: 0.65 }}
              className="leading-none mb-10"
              style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 'clamp(72px, 16vw, 140px)', letterSpacing: '0.02em', color: '#FFFFFF' }}
            >
              BROKE<span style={{ color: '#6C63FF' }}>NOMICS</span>
            </motion.h1>

            {/* CTAs */}
            <motion.div
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.45 }}
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px', width: '100%', maxWidth: '480px' }}
            >
              <button
                onClick={handleGetStarted}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', width: '100%', minHeight: '56px', padding: '0 40px', borderRadius: '16px', background: 'linear-gradient(135deg, #6C63FF, #00BCD4)', color: '#FFFFFF', fontFamily: "'Space Grotesk', sans-serif", fontSize: '18px', fontWeight: 700, border: 'none', cursor: 'pointer', boxShadow: '0 0 48px rgba(108,99,255,0.40)', transition: 'background 0.2s, box-shadow 0.2s' }}
                onMouseEnter={e => { e.currentTarget.style.background = '#6C63FF'; e.currentTarget.style.boxShadow = '0 0 56px rgba(108,99,255,0.60)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'linear-gradient(135deg, #6C63FF, #00BCD4)'; e.currentTarget.style.boxShadow = '0 0 48px rgba(108,99,255,0.40)'; }}
              >
                Get Started <ArrowRight weight="bold" size={20} />
              </button>

              <button
                onClick={handleContinueAsGuest}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', width: '100%', minHeight: '56px', padding: '0 40px', borderRadius: '16px', background: 'transparent', border: '1.5px solid rgba(255,255,255,0.20)', color: '#D1D5DB', fontFamily: "'Space Grotesk', sans-serif", fontSize: '18px', fontWeight: 600, cursor: 'pointer', transition: 'background 0.2s, border-color 0.2s, box-shadow 0.2s, color 0.2s' }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.10)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.50)'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(255,255,255,0.08)'; e.currentTarget.style.color = '#FFFFFF'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.20)'; e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.color = '#D1D5DB'; }}
              >
                <UserCircle size={20} /> Continue as Guest
              </button>
            </motion.div>

            <motion.p
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.65 }}
              style={{ color: 'rgba(255,255,255,0.18)', fontFamily: "'Space Grotesk', sans-serif", fontSize: '12px', marginTop: '24px' }}
            >
              No credit card. No spam. Just learning.
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ══ SCREEN 2 — FLASHCARD GRID ══ */}
      <AnimatePresence>
        {screen === SCREEN.GRID && !zooming && (
          <motion.div
            key="grid-screen"
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }} transition={{ duration: 0.45 }}
            style={{ paddingTop: '80px', paddingBottom: '60px' }}
          >
            <FlashcardGrid topics={topics} onTopicSelect={handleTopicSelect} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ══ SCREEN 3 — TOPIC BENTO ══ */}
      <AnimatePresence>
        {screen === SCREEN.TOPIC && selectedTopic && !zooming && (
          <motion.div
            key="topic-screen"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            exit={{ opacity: 0 }} transition={{ duration: 0.4 }}
            style={{ minHeight: '100vh', padding: '32px 32px 64px' }}
          >
            {/* ← Back */}
            <button
              onClick={handleBackToGrid}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', fontFamily: "'Space Grotesk', sans-serif", fontSize: '13px', color: '#6B7280', background: 'none', border: 'none', cursor: 'pointer', marginBottom: '28px', padding: 0 }}
            >
              <X size={14} /> Back to topics
            </button>

            {/* Topic name */}
            <motion.h1
              initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45 }}
              style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 'clamp(64px, 12vw, 110px)', letterSpacing: '0.03em', color: selectedTopic.accentColor, lineHeight: 1, marginBottom: '32px' }}
            >
              {selectedTopic.name.toUpperCase()}
            </motion.h1>

            {/* Bento grid */}
            <BentoGrid
              topic={selectedTopic}
              subTopics={orderedSubTopics}
              onSubTopicSelect={handleSubTopicSelect}
            />

            {/* Retake quiz link — bottom of bento page */}
            <div style={{ marginTop: '40px', textAlign: 'center' }}>
              <button
                onClick={handleRetakeQuiz}
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: "'Space Grotesk', sans-serif", fontSize: '13px', color: '#4B5563', textDecoration: 'underline', textDecorationStyle: 'dotted', textUnderlineOffset: '3px', transition: 'color 0.15s' }}
                onMouseEnter={e => { e.currentTarget.style.color = '#9CA3AF'; }}
                onMouseLeave={e => { e.currentTarget.style.color = '#4B5563'; }}
              >
                retake personalisation quiz
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── QUIZ MODAL ── */}
      {quizOpen && (
        <QuizModal
          topic={selectedTopic}
          onClose={() => setQuizOpen(false)}
          onComplete={handleQuizComplete}
        />
      )}
    </div>
  );
}
