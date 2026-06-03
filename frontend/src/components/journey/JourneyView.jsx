/**
 * JourneyView — full-page journey with:
 * - Fixed left-side spacing (margin-left 48px, proper circle alignment)
 * - Vertical connecting line at left: 67px, width: 2px
 * - Completion screen after all steps are shown
 * - Action cards: Groww, Zerodha, Explore more
 */

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft } from 'phosphor-react';
import { useNavigate } from 'react-router-dom';
import { topicsAPI } from '../../lib/api';
import JourneyStep from './JourneyStep';

function buildFallbackJourney(topic, subTopic) {
  return [
    { id: 'step-1', title: `What Is ${subTopic?.title || topic?.name}?`, content: `Let's start from scratch. No assumptions, no jargon. Just the raw truth about ${subTopic?.title || topic?.name} and why it matters for your wallet right now.` },
    { id: 'step-2', title: 'Why Should You Care?', content: `Your money is either working for you or against you. Understanding this could be the difference between financial anxiety and financial confidence.` },
    { id: 'step-3', title: 'The Core Concept', content: `Breaking down the fundamentals — the stuff that nobody explains clearly. We're making it stupidly simple.` },
    { id: 'step-4', title: 'Common Mistakes to Avoid', content: `The mistakes that cost people money. Most of them are avoidable once you know what to look for.` },
    { id: 'step-5', title: 'Your Action Plan', content: `Enough theory. Here's exactly what you should do next — concrete steps, specific apps, real numbers.` },
  ];
}

// ── Completion action card ──
function ActionCard({ title, subtitle, href, onClick, accentColor }) {
  const [hovered, setHovered] = useState(false);
  const isLink = !!href;

  const inner = (
    <>
      <h4 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '22px', letterSpacing: '0.04em', color: '#FFFFFF', marginBottom: '6px' }}>
        {title}
      </h4>
      <p style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '13px', color: '#9CA3AF', lineHeight: 1.5 }}>
        {subtitle}
      </p>
    </>
  );

  const cardStyle = {
    flex: '1 1 180px',
    minWidth: '160px',
    backgroundColor: '#0F0F14',
    borderTop: `3px solid ${accentColor}`,
    borderLeft: '1px solid rgba(255,255,255,0.08)',
    borderRight: '1px solid rgba(255,255,255,0.08)',
    borderBottom: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '14px',
    padding: '20px',
    cursor: 'pointer',
    display: 'block',
    textDecoration: 'none',
    transition: 'box-shadow 0.18s, background-color 0.18s',
    boxShadow: hovered ? `0 0 20px ${accentColor}33, 0 4px 16px rgba(0,0,0,0.4)` : '0 4px 12px rgba(0,0,0,0.3)',
    backgroundColor: hovered ? '#161620' : '#0F0F14',
  };

  if (isLink) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer"
        style={cardStyle}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        {inner}
      </a>
    );
  }
  return (
    <button style={{ ...cardStyle, border: `1px solid rgba(255,255,255,0.08)`, borderTop: `3px solid ${accentColor}`, textAlign: 'left' }}
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {inner}
    </button>
  );
}

export default function JourneyView({ topic, subTopic }) {
  const navigate = useNavigate();
  const [journeySteps, setJourneySteps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentStep, setCurrentStep] = useState(0);
  const [jargonTerms, setJargonTerms] = useState([]);
  const [showCompletion, setShowCompletion] = useState(false);
  const completionRef = useRef(null);

  const accentColor = topic?.accentColor || '#C0392B';

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      try {
        const data = await topicsAPI.getJourney(topic.id);
        const steps = data.steps || data.journey || data || [];
        setJourneySteps(steps.length ? steps : buildFallbackJourney(topic, subTopic));
        if (data.jargon_terms) setJargonTerms(data.jargon_terms);
      } catch {
        setJourneySteps(buildFallbackJourney(topic, subTopic));
      } finally {
        setLoading(false);
      }
    };
    if (topic?.id) fetch();
  }, [topic?.id, subTopic?.id]);

  // Show completion section once all steps are visible (after a short delay)
  useEffect(() => {
    if (!loading && journeySteps.length > 0) {
      const timer = setTimeout(() => setShowCompletion(true), 1200);
      return () => clearTimeout(timer);
    }
  }, [loading, journeySteps.length]);

  return (
    <div style={{ minHeight: '100vh', width: '100%', background: '#0F0F14' }}>

      {/* ── Sticky top nav ── */}
      <div
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 30,
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          // Breadcrumb padding spec: 16px 48px
          padding: '16px 48px',
          background: 'rgba(15,15,20,0.90)',
          backdropFilter: 'blur(12px)',
          borderBottom: '1px solid rgba(255,255,255,0.07)',
        }}
      >
        <button
          onClick={() => navigate(-1)}
          style={{ width: '36px', height: '36px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.10)', cursor: 'pointer', flexShrink: 0 }}
          aria-label="Go back"
        >
          <ArrowLeft size={16} color="#9CA3AF" />
        </button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '11px', color: accentColor, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '2px' }}>
            {topic?.name}
          </p>
          <h1 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '20px', letterSpacing: '0.04em', color: '#FFFFFF', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {subTopic?.title || 'YOUR JOURNEY'}
          </h1>
        </div>
        {/* Progress counter */}
        <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '12px', color: '#6B7280', flexShrink: 0 }}>
          {journeySteps.length} steps
        </span>
      </div>

      {/* ── Main content ── */}
      <div style={{ maxWidth: '760px' }}>

        {/* Topic title — padding: 32px 48px 16px 48px */}
        <div style={{ padding: '32px 48px 16px 48px' }}>
          <h2
            style={{
              fontFamily: "'Bebas Neue', sans-serif",
              fontSize: 'clamp(36px, 7vw, 64px)',
              letterSpacing: '0.03em',
              color: '#FFFFFF',
              lineHeight: 1.05,
              marginBottom: '8px',
            }}
          >
            {subTopic?.title?.toUpperCase() || 'YOUR LEARNING PATH'}
          </h2>
          <p style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '14px', color: '#6B7280' }}>
            {subTopic?.description || `Deep dive into ${topic?.name}`}
          </p>
        </div>

        {/* Journey steps area — margin-left: 48px, relative for the vertical line */}
        <div style={{ position: 'relative', marginLeft: '48px', paddingRight: '48px', paddingBottom: '32px' }}>

          {/* Vertical connecting line — runs behind all steps */}
          {!loading && journeySteps.length > 1 && (
            <div
              style={{
                position: 'absolute',
                // left: 67px from container edge = 19px from margin-left (circle center is at 20px)
                left: '19px',
                top: '52px',    // starts below first circle
                bottom: '80px', // ends before last circle
                width: '2px',
                background: `linear-gradient(to bottom, ${accentColor}50, rgba(255,255,255,0.04))`,
                borderRadius: '2px',
                pointerEvents: 'none',
              }}
            />
          )}

          {/* Steps */}
          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', paddingTop: '16px' }}>
              {[...Array(4)].map((_, i) => (
                <div key={i} style={{ display: 'flex', gap: '16px' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#1E1E2E', flexShrink: 0 }} />
                  <div style={{ flex: 1, paddingTop: '4px' }}>
                    <div style={{ height: '14px', backgroundColor: '#1E1E2E', borderRadius: '4px', width: '60%', marginBottom: '10px' }} />
                    <div style={{ height: '12px', backgroundColor: '#161620', borderRadius: '4px', width: '90%', marginBottom: '6px' }} />
                    <div style={{ height: '12px', backgroundColor: '#161620', borderRadius: '4px', width: '75%' }} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div>
              {journeySteps.map((step, index) => (
                <JourneyStep
                  key={step.id || index}
                  step={step}
                  index={index}
                  isLast={index === journeySteps.length - 1}
                  isCompleted={index < currentStep}
                  isCurrent={index === currentStep}
                  jargonTerms={jargonTerms}
                  accentColor={accentColor}
                />
              ))}
            </div>
          )}
        </div>

        {/* ── Completion section ── */}
        <AnimatePresence>
          {showCompletion && !loading && (
            <motion.div
              ref={completionRef}
              key="completion"
              initial={{ opacity: 0, y: 32 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, ease: 'easeOut' }}
              style={{
                margin: '0 48px 64px',
                padding: '40px 36px',
                borderRadius: '20px',
                background: `linear-gradient(145deg, ${accentColor}15, #0F0F14)`,
                border: `1px solid ${accentColor}30`,
              }}
            >
              {/* Big text */}
              <h3
                style={{
                  fontFamily: "'Bebas Neue', sans-serif",
                  fontSize: '48px',
                  letterSpacing: '0.03em',
                  color: '#FFFFFF',
                  lineHeight: 1.1,
                  marginBottom: '10px',
                }}
              >
                you actually get it now 🎓
              </h3>
              <p
                style={{
                  fontFamily: "'Space Grotesk', sans-serif",
                  fontSize: '18px',
                  color: '#9CA3AF',
                  marginBottom: '32px',
                }}
              >
                here&apos;s how to actually start
              </p>

              {/* Action cards */}
              <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', marginBottom: '32px' }}>
                <ActionCard
                  title="Open Groww"
                  subtitle="set up your account in 10 mins"
                  href="https://groww.in"
                  accentColor={accentColor}
                />
                <ActionCard
                  title="Open Zerodha"
                  subtitle="india's most used trading app"
                  href="https://zerodha.com"
                  accentColor={accentColor}
                />
                <ActionCard
                  title={`Explore more in ${topic?.name}`}
                  subtitle="go back and try another sub-topic"
                  onClick={() => navigate('/')}
                  accentColor={accentColor}
                />
              </div>

              {/* Back to all topics */}
              <button
                onClick={() => navigate('/')}
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: "'Space Grotesk', sans-serif", fontSize: '14px', color: '#4B5563', display: 'flex', alignItems: 'center', gap: '6px', padding: 0, transition: 'color 0.15s' }}
                onMouseEnter={e => { e.currentTarget.style.color = '#9CA3AF'; }}
                onMouseLeave={e => { e.currentTarget.style.color = '#4B5563'; }}
              >
                ← back to all topics
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
