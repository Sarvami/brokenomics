/**
 * AuthModal — premium dark login / register modal.
 * Background: #13131A card, gradient border (purple → teal)
 * Inputs: #1E1E2E bg, rounded 12px
 * Sign in button: gradient #6C63FF → #00BCD4
 * Guest button: ghost style
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Eye, EyeSlash, UserCircle } from 'phosphor-react';
import { useAuth } from '../../hooks/useAuth';

/* Reusable input style */
const inputStyle = {
  width: '100%',
  height: '48px',
  padding: '0 14px',
  borderRadius: '12px',
  backgroundColor: '#1E1E2E',
  border: '1px solid rgba(255,255,255,0.08)',
  color: '#F3F4F6',
  fontFamily: "'Space Grotesk', sans-serif",
  fontSize: '14px',
  outline: 'none',
  boxSizing: 'border-box',
  transition: 'border-color 0.2s',
};

const labelStyle = {
  display: 'block',
  fontFamily: "'Space Grotesk', sans-serif",
  fontSize: '12px',
  color: '#6B7280',
  marginBottom: '6px',
  fontWeight: 500,
};

export default function AuthModal() {
  const {
    authModalOpen,
    authMode,
    loading,
    error,
    login,
    register,
    startGuestSession,
    setAuthModalOpen,
    setAuthMode,
    setError,
  } = useAuth();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
  });
  const [showPassword, setShowPassword] = useState(false);

  if (!authModalOpen) return null;

  const handleClose = () => {
    setAuthModalOpen(false);
    setError(null);
    setFormData({ email: '', password: '', firstName: '', lastName: '' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (authMode === 'login') {
      await login(formData.email, formData.password);
    } else {
      await register(formData.email, formData.password, formData.firstName, formData.lastName);
    }
  };

  return (
    <AnimatePresence>
      {authModalOpen && (
        <motion.div
          key="auth-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 60,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
            background: 'rgba(0,0,0,0.72)',
            backdropFilter: 'blur(8px)',
          }}
          onClick={handleClose}
        >
          {/* Modal card */}
          <motion.div
            key="auth-modal"
            initial={{ scale: 0.90, opacity: 0, y: 24 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.90, opacity: 0, y: 24 }}
            transition={{ type: 'spring', damping: 26, stiffness: 320 }}
            style={{
              position: 'relative',
              width: '100%',
              maxWidth: '420px',
              borderRadius: '24px',
              padding: '2px', // space for gradient border
              background: 'linear-gradient(135deg, #6C63FF44, #00BCD444, #6C63FF22)',
              boxShadow: '0 32px 80px rgba(0,0,0,0.65)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Inner card */}
            <div
              style={{
                background: '#13131A',
                borderRadius: '22px',
                padding: '28px',
              }}
            >
              {/* Header row */}
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '24px' }}>
                <div>
                  <h2
                    style={{
                      fontFamily: "'Bebas Neue', sans-serif",
                      fontSize: '40px',
                      letterSpacing: '0.04em',
                      color: '#FFFFFF',
                      lineHeight: 1,
                      marginBottom: '6px',
                    }}
                  >
                    {authMode === 'login' ? 'WELCOME BACK' : 'JOIN THE CLUB'}
                  </h2>
                  <p
                    style={{
                      fontFamily: "'Space Grotesk', sans-serif",
                      fontSize: '13px',
                      color: '#6B7280',
                    }}
                  >
                    {authMode === 'login' ? 'Pick up where you left off' : 'Create your free account'}
                  </p>
                </div>
                <button
                  onClick={handleClose}
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    background: 'rgba(255,255,255,0.06)',
                    border: '1px solid rgba(255,255,255,0.10)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    marginTop: '4px',
                  }}
                  aria-label="Close"
                >
                  <X size={16} color="#6B7280" />
                </button>
              </div>

              {/* Error */}
              {error && (
                <div
                  style={{
                    padding: '12px 14px',
                    borderRadius: '12px',
                    background: 'rgba(239,68,68,0.10)',
                    border: '1px solid rgba(239,68,68,0.25)',
                    color: '#FCA5A5',
                    fontFamily: "'Space Grotesk', sans-serif",
                    fontSize: '13px',
                    marginBottom: '20px',
                  }}
                >
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {/* Register: name row */}
                {authMode === 'register' && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div>
                      <label style={labelStyle}>First name</label>
                      <input
                        type="text"
                        required
                        value={formData.firstName}
                        onChange={(e) => setFormData((d) => ({ ...d, firstName: e.target.value }))}
                        placeholder="Rahul"
                        style={inputStyle}
                        onFocus={e => e.target.style.borderColor = 'rgba(108,99,255,0.5)'}
                        onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.08)'}
                      />
                    </div>
                    <div>
                      <label style={labelStyle}>Last name</label>
                      <input
                        type="text"
                        value={formData.lastName}
                        onChange={(e) => setFormData((d) => ({ ...d, lastName: e.target.value }))}
                        placeholder="Sharma"
                        style={inputStyle}
                        onFocus={e => e.target.style.borderColor = 'rgba(108,99,255,0.5)'}
                        onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.08)'}
                      />
                    </div>
                  </div>
                )}

                {/* Email */}
                <div>
                  <label style={labelStyle}>Email</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData((d) => ({ ...d, email: e.target.value }))}
                    placeholder="you@gmail.com"
                    style={inputStyle}
                    onFocus={e => e.target.style.borderColor = 'rgba(108,99,255,0.5)'}
                    onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.08)'}
                  />
                </div>

                {/* Password */}
                <div>
                  <label style={labelStyle}>Password</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={formData.password}
                      onChange={(e) => setFormData((d) => ({ ...d, password: e.target.value }))}
                      placeholder="••••••••"
                      style={{ ...inputStyle, paddingRight: '42px' }}
                      onFocus={e => e.target.style.borderColor = 'rgba(108,99,255,0.5)'}
                      onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.08)'}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((s) => !s)}
                      style={{
                        position: 'absolute',
                        right: '14px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        padding: 0,
                        display: 'flex',
                      }}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword
                        ? <EyeSlash size={16} color="#6B7280" />
                        : <Eye size={16} color="#6B7280" />}
                    </button>
                  </div>
                </div>

                {/* Submit — gradient fill */}
                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    width: '100%',
                    height: '48px',
                    borderRadius: '12px',
                    background: loading
                      ? 'rgba(108,99,255,0.4)'
                      : 'linear-gradient(135deg, #6C63FF, #00BCD4)',
                    color: '#FFFFFF',
                    fontFamily: "'Space Grotesk', sans-serif",
                    fontSize: '15px',
                    fontWeight: 700,
                    border: 'none',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    letterSpacing: '0.02em',
                    transition: 'opacity 0.2s',
                    marginTop: '4px',
                  }}
                >
                  {loading ? 'Hang on...' : authMode === 'login' ? 'Sign in' : 'Create account'}
                </button>

                {/* Divider */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.07)' }} />
                  <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '12px', color: '#4B5563' }}>or</span>
                  <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.07)' }} />
                </div>

                {/* Guest — ghost style */}
                <button
                  type="button"
                  onClick={() => startGuestSession()}
                  disabled={loading}
                  style={{
                    width: '100%',
                    height: '48px',
                    borderRadius: '12px',
                    background: 'transparent',
                    border: '1.5px solid rgba(255,255,255,0.12)',
                    color: '#9CA3AF',
                    fontFamily: "'Space Grotesk', sans-serif",
                    fontSize: '14px',
                    fontWeight: 500,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    transition: 'border-color 0.2s, color 0.2s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.25)'; e.currentTarget.style.color = '#D1D5DB'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'; e.currentTarget.style.color = '#9CA3AF'; }}
                >
                  <UserCircle size={17} />
                  Continue as guest
                </button>

                {/* Toggle login / register */}
                <p
                  style={{
                    textAlign: 'center',
                    fontFamily: "'Space Grotesk', sans-serif",
                    fontSize: '13px',
                    color: '#4B5563',
                  }}
                >
                  {authMode === 'login' ? (
                    <>
                      No account?{' '}
                      <button
                        type="button"
                        onClick={() => { setAuthMode('register'); setError(null); }}
                        style={{ color: '#A78BFA', background: 'none', border: 'none', cursor: 'pointer', fontFamily: "'Space Grotesk', sans-serif", fontSize: '13px', textDecoration: 'underline' }}
                      >
                        Sign up free
                      </button>
                    </>
                  ) : (
                    <>
                      Already have an account?{' '}
                      <button
                        type="button"
                        onClick={() => { setAuthMode('login'); setError(null); }}
                        style={{ color: '#A78BFA', background: 'none', border: 'none', cursor: 'pointer', fontFamily: "'Space Grotesk', sans-serif", fontSize: '13px', textDecoration: 'underline' }}
                      >
                        Sign in
                      </button>
                    </>
                  )}
                </p>
              </form>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
