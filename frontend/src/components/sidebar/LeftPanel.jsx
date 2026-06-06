/**
 * LeftPanel — collapsible sidebar with hamburger toggle.
 * Navigation items: Learn, Quiz, My Chats, Saved, Profile.
 * Auth-gated items open the auth modal when unauthenticated.
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  List,
  X,
  BookmarkSimple,
  User,
  SignOut,
  GraduationCap,
  ChatCircleText,
  Question,
} from 'phosphor-react';
import { useAuth } from '../../hooks/useAuth';
import { profileAPI } from '../../lib/api';

function SavedItem({ item }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: '10px',
        padding: '10px 12px',
        borderRadius: '10px',
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.07)',
      }}
    >
      <BookmarkSimple size={14} color="#6C63FF" weight="fill" style={{ flexShrink: 0, marginTop: '2px' }} />
      <p
        style={{
          fontFamily: "'Space Grotesk', sans-serif",
          fontSize: '12px',
          color: '#D1D5DB',
          lineHeight: 1.5,
          overflow: 'hidden',
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
        }}
      >
        {item.content || item.title || 'Saved item'}
      </p>
    </div>
  );
}

function NavItem({ icon: Icon, label, onClick, locked, isAuthenticated }) {
  const [hovered, setHovered] = useState(false);

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '14px',
        width: '100%',
        padding: '14px 16px',
        borderRadius: '12px',
        background: hovered ? 'rgba(108,99,255,0.10)' : 'transparent',
        border: 'none',
        cursor: 'pointer',
        transition: 'background 0.15s',
        textAlign: 'left',
      }}
    >
      <div
        style={{
          width: '36px',
          height: '36px',
          borderRadius: '10px',
          background: hovered
            ? `rgba(108,99,255,0.20)`
            : 'rgba(255,255,255,0.06)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          transition: 'background 0.15s',
        }}
      >
        <Icon
          size={18}
          color={hovered ? '#A78BFA' : '#6B7280'}
          weight={hovered ? 'fill' : 'regular'}
        />
      </div>
      <span
        style={{
          fontFamily: "'Space Grotesk', sans-serif",
          fontSize: '14px',
          fontWeight: 500,
          color: hovered ? '#F3F4F6' : '#9CA3AF',
          flex: 1,
          transition: 'color 0.15s',
        }}
      >
        {label}
      </span>
      {locked && !isAuthenticated && (
        <span
          style={{
            fontFamily: "'Space Grotesk', sans-serif",
            fontSize: '10px',
            color: '#4B5563',
            background: 'rgba(255,255,255,0.05)',
            padding: '2px 7px',
            borderRadius: '20px',
            border: '1px solid rgba(255,255,255,0.08)',
          }}
        >
          sign in
        </span>
      )}
    </button>
  );
}

export default function LeftPanel({ onNavigate, lastVisitedTopic }) {
  const [open, setOpen] = useState(false);
  const [activeSection, setActiveSection] = useState(null);
  const [savedItems, setSavedItems] = useState([]);
  const [savedLoading, setSavedLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const { user, isAuthenticated, isGuest, logout, requireAuth } = useAuth();
  const navigate = useNavigate();

  // Fetch saved items when that section is active and user is authenticated
  useEffect(() => {
    let active = true;
    if (activeSection === 'saved' && isAuthenticated && !isGuest) {
      Promise.resolve().then(() => {
        if (active) setSavedLoading(true);
      });
      profileAPI
        .getSavedItems()
        .then((data) => {
          if (active) setSavedItems(data.items || data || []);
        })
        .catch(() => {
          if (active) setSavedItems([]);
        })
        .finally(() => {
          if (active) setSavedLoading(false);
        });
    }
    return () => {
      active = false;
    };
  }, [activeSection, isAuthenticated, isGuest]);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2800);
  };

  const close = () => {
    setOpen(false);
    setActiveSection(null);
  };

  // ── Nav handlers — all actually navigate ──
  const handleLearn = () => {
    navigate('/');
    onNavigate?.('grid');
    close();
  };

  const handleQuiz = () => {
    if (lastVisitedTopic) {
      onNavigate?.('quiz', lastVisitedTopic);
      close();
    } else {
      showToast('pick a topic first 👆');
      close();
    }
  };

  const handleChats = () => {
    if (!isAuthenticated || isGuest) {
      requireAuth('login');
      close();
      return;
    }
    navigate('/chats');
    close();
  };

  const handleSaved = () => {
    if (!isAuthenticated || isGuest) {
      requireAuth('login');
      close();
      return;
    }
    navigate('/saved');
    close();
  };

  const handleProfile = () => {
    if (!isAuthenticated || isGuest) {
      requireAuth('login');
      close();
      return;
    }
    setActiveSection('profile');
  };



  return (
    <>
      {/* Toast notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            key="toast"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            style={{
              position: 'fixed',
              bottom: '90px',
              left: '50%',
              transform: 'translateX(-50%)',
              zIndex: 100,
              backgroundColor: '#1E1E2E',
              border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: '12px',
              padding: '10px 20px',
              fontFamily: "'Space Grotesk', sans-serif",
              fontSize: '14px',
              color: '#F3F4F6',
              boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
              whiteSpace: 'nowrap',
            }}
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hamburger trigger */}
      <button
        onClick={() => setOpen(true)}
        style={{
          position: 'fixed',
          top: '16px',
          left: '16px',
          zIndex: 40,
          width: '40px',
          height: '40px',
          borderRadius: '12px',
          background: 'rgba(15,15,20,0.80)',
          backdropFilter: 'blur(8px)',
          border: '1px solid rgba(255,255,255,0.12)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
        aria-label="Open menu"
        aria-expanded={open}
      >
        <List size={20} color="#F3F4F6" />
      </button>

      <AnimatePresence>
        {open && (
          <>
            {/* Backdrop */}
            <motion.div
              key="panel-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{
                position: 'fixed',
                inset: 0,
                zIndex: 50,
                background: 'rgba(0,0,0,0.50)',
                backdropFilter: 'blur(4px)',
              }}
              onClick={close}
            />

            {/* Sidebar */}
            <motion.aside
              key="panel-sidebar"
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 280 }}
              style={{
                position: 'fixed',
                top: 0,
                left: 0,
                bottom: 0,
                zIndex: 51,
                width: 'min(300px, 85vw)',
                background: '#111118',
                borderRight: '1px solid rgba(255,255,255,0.08)',
                display: 'flex',
                flexDirection: 'column',
                overflowY: 'auto',
              }}
            >
              {/* Header */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '20px',
                  borderBottom: '1px solid rgba(255,255,255,0.07)',
                }}
              >
                {activeSection ? (
                  <button
                    onClick={() => setActiveSection(null)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: '#9CA3AF',
                      fontFamily: "'Space Grotesk', sans-serif",
                      fontSize: '13px',
                      padding: 0,
                    }}
                  >
                    ← Back
                  </button>
                ) : (
                  <h2
                    style={{
                      fontFamily: "'Bebas Neue', sans-serif",
                      fontSize: '22px',
                      letterSpacing: '0.05em',
                      color: '#FFFFFF',
                    }}
                  >
                    BROKENOMICS
                  </h2>
                )}
                <button
                  onClick={close}
                  style={{
                    width: '30px',
                    height: '30px',
                    borderRadius: '8px',
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                  aria-label="Close menu"
                >
                  <X size={16} color="#6B7280" />
                </button>
              </div>

              {/* User strip — clickable if guest to trigger sign-in */}
              {(isGuest || !isAuthenticated) ? (
                <button
                  onClick={() => { requireAuth('login'); }}
                  style={{
                    padding: '12px',
                    borderBottom: '1px solid rgba(255,255,255,0.07)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    width: '100%',
                    background: 'rgba(255,255,255,0.08)',
                    borderRadius: '10px',
                    margin: '0 0 2px 0',
                    cursor: 'pointer',
                    border: '1px solid rgba(255,255,255,0.10)',
                    textAlign: 'left',
                  }}
                >
                  <div
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '50%',
                      background: 'rgba(255,255,255,0.08)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <User size={17} color="#9CA3AF" />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '13px', fontWeight: 600, color: '#F3F4F6' }}>
                      {isGuest ? 'Guest session' : 'Not signed in'}
                    </p>
                    <p style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '11px', color: '#6C63FF' }}>
                      Sign in for full access →
                    </p>
                  </div>
                </button>
              ) : (
                <div
                  style={{
                    padding: '14px 20px',
                    borderBottom: '1px solid rgba(255,255,255,0.07)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                  }}
                >
                  <div
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, #6C63FF, #00BCD4)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <User size={17} color="#FFFFFF" />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '13px', fontWeight: 600, color: '#F3F4F6', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {user?.first_name ? `${user.first_name} ${user.last_name || ''}`.trim() : user?.name || 'User'}
                    </p>
                    <p style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '11px', color: '#4B5563', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {user?.email || ''}
                    </p>
                  </div>
                  <button
                    onClick={() => { logout(); close(); }}
                    style={{ width: '30px', height: '30px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    aria-label="Sign out"
                  >
                    <SignOut size={15} color="#6B7280" />
                  </button>
                </div>
              )}

              {/* ── Main nav or sub-section ── */}
              <div style={{ flex: 1, padding: '12px 8px' }}>

                {/* Default nav list */}
                {!activeSection && (
                  <nav style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    <NavItem icon={GraduationCap} label="🎓  Learn" onClick={handleLearn} isAuthenticated={isAuthenticated} />
                    <NavItem icon={Question}      label="📝  Take a Quiz" onClick={handleQuiz} isAuthenticated={isAuthenticated} />
                    <NavItem icon={ChatCircleText} label="💬  My Chats" onClick={handleChats} locked isAuthenticated={isAuthenticated} />
                    <NavItem icon={BookmarkSimple} label="🔖  Saved" onClick={handleSaved} locked isAuthenticated={isAuthenticated} />
                    <NavItem icon={User}           label="👤  Profile" onClick={handleProfile} locked isAuthenticated={isAuthenticated} />
                  </nav>
                )}

                {/* Saved section */}
                {activeSection === 'saved' && (
                  <div style={{ padding: '4px 8px' }}>
                    <p
                      style={{
                        fontFamily: "'Bebas Neue', sans-serif",
                        fontSize: '18px',
                        color: '#FFFFFF',
                        letterSpacing: '0.05em',
                        marginBottom: '14px',
                      }}
                    >
                      SAVED ITEMS
                    </p>
                    {savedLoading ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {[...Array(3)].map((_, i) => (
                          <div
                            key={i}
                            style={{
                              height: '52px',
                              borderRadius: '10px',
                              background: 'rgba(255,255,255,0.04)',
                              animation: 'pulse 1.5s ease infinite',
                            }}
                          />
                        ))}
                      </div>
                    ) : savedItems.length === 0 ? (
                      <p
                        style={{
                          fontFamily: "'Space Grotesk', sans-serif",
                          fontSize: '13px',
                          color: '#4B5563',
                          lineHeight: 1.6,
                        }}
                      >
                        Nothing saved yet. Start learning and bookmark the good stuff!
                      </p>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {savedItems.slice(0, 10).map((item, i) => (
                          <SavedItem key={i} item={item} />
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* My Chats placeholder */}
                {activeSection === 'chats' && (
                  <div style={{ padding: '4px 8px' }}>
                    <p
                      style={{
                        fontFamily: "'Bebas Neue', sans-serif",
                        fontSize: '18px',
                        color: '#FFFFFF',
                        letterSpacing: '0.05em',
                        marginBottom: '14px',
                      }}
                    >
                      MY CHATS
                    </p>
                    <p
                      style={{
                        fontFamily: "'Space Grotesk', sans-serif",
                        fontSize: '13px',
                        color: '#4B5563',
                        lineHeight: 1.6,
                      }}
                    >
                      Your chat history will show up here once you start talking to the AI on a topic.
                    </p>
                  </div>
                )}

                {/* Profile placeholder */}
                {activeSection === 'profile' && (
                  <div style={{ padding: '4px 8px' }}>
                    <p
                      style={{
                        fontFamily: "'Bebas Neue', sans-serif",
                        fontSize: '18px',
                        color: '#FFFFFF',
                        letterSpacing: '0.05em',
                        marginBottom: '14px',
                      }}
                    >
                      PROFILE
                    </p>
                    <div
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '10px',
                      }}
                    >
                      {[
                        { label: 'Name', value: user?.first_name ? `${user.first_name} ${user.last_name || ''}`.trim() : '—' },
                        { label: 'Email', value: user?.email || '—' },
                      ].map(({ label, value }) => (
                        <div key={label}>
                          <p style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '11px', color: '#4B5563', marginBottom: '2px' }}>{label}</p>
                          <p style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '14px', color: '#D1D5DB' }}>{value}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div
                style={{
                  padding: '16px 20px',
                  borderTop: '1px solid rgba(255,255,255,0.06)',
                }}
              >
                <p
                  style={{
                    fontFamily: "'Space Grotesk', sans-serif",
                    fontSize: '10px',
                    color: '#374151',
                    textAlign: 'center',
                  }}
                >
                  Brokenomics · Finance for the rest of us
                </p>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
