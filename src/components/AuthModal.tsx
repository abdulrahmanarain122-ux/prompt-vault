import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

interface AuthModalProps {
  onNotify?: (message: string, type?: 'success' | 'error') => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ onNotify }) => {
  const { authModalOpen, authModalMode, closeAuthModal, signIn, signUp } = useAuth();

  const [mode, setMode] = useState<'login' | 'signup'>(
    authModalMode === 'signup' ? 'signup' : 'login'
  );
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    // eslint-disable-next-line react/set-state-in-effect
    setMode(authModalMode === 'signup' ? 'signup' : 'login');
    setErrorMessage('');
    setEmail('');
    setPassword('');
    setUsername('');
  }, [authModalMode, authModalOpen]);

  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && authModalOpen) {
        closeAuthModal();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [authModalOpen, closeAuthModal]);

  if (!authModalOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!email.trim() || !password.trim()) {
      setErrorMessage('Please enter both email and password.');
      return;
    }

    if (mode === 'signup' && password.length < 6) {
      setErrorMessage('Password must be at least 6 characters long.');
      return;
    }

    setLoading(true);

    if (mode === 'login') {
      const { error } = await signIn(email.trim(), password);
      setLoading(false);
      if (error) {
        setErrorMessage(error.message || 'Invalid login credentials.');
      } else {
        onNotify?.('Successfully signed in to Vault!', 'success');
        closeAuthModal();
      }
    } else {
      const res = await signUp(email.trim(), password, username.trim());
      setLoading(false);
      if (res.error) {
        setErrorMessage(res.error.message || 'Registration failed.');
      } else if (res.needsConfirmation) {
        onNotify?.(
          'Account created! Check your inbox to confirm, or turn off "Confirm Email" in Supabase Auth Settings.',
          'success'
        );
        closeAuthModal();
      } else {
        onNotify?.('Account created and logged in successfully!', 'success');
        closeAuthModal();
      }
    }
  };

  return (
    <>
      <div className="drawer-backdrop open" style={{ zIndex: 60 }} onClick={closeAuthModal} aria-hidden="true" />
      <div
        className="auth-modal-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="auth-modal-title"
      >
        <div className="auth-modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div className="brand-icon-glyph" aria-hidden="true">
              PV
            </div>
            <div>
              <h2 id="auth-modal-title" className="font-headline-sm" style={{ color: 'var(--on-surface)' }}>
                {mode === 'login' ? 'Sign In to Prompt Vault' : 'Create Vault Account'}
              </h2>
              <span className="font-label-sm" style={{ color: 'var(--outline)' }}>
                {mode === 'login'
                  ? 'Access your cloud prompts and publish to the Explore feed'
                  : 'Join the community to save and share prompts globally'}
              </span>
            </div>
          </div>
          <button
            type="button"
            className="btn-card-icon"
            onClick={closeAuthModal}
            aria-label="Close dialog"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Mode Switcher Tabs */}
        <div className="auth-modal-tabs">
          <button
            type="button"
            className={`auth-tab-btn ${mode === 'login' ? 'active' : ''}`}
            onClick={() => {
              setMode('login');
              setErrorMessage('');
            }}
          >
            Sign In
          </button>
          <button
            type="button"
            className={`auth-tab-btn ${mode === 'signup' ? 'active' : ''}`}
            onClick={() => {
              setMode('signup');
              setErrorMessage('');
            }}
          >
            Create Account
          </button>
        </div>

        {errorMessage && (
          <div className="auth-error-banner">
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
              warning
            </span>
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-modal-form">
          {mode === 'signup' && (
            <div className="auth-field">
              <label htmlFor="auth-username-input" className="auth-label">
                Username / Author Handle
              </label>
              <input
                id="auth-username-input"
                type="text"
                placeholder="e.g. prompt_wizard"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="auth-input"
              />
            </div>
          )}

          <div className="auth-field">
            <label htmlFor="auth-email-input" className="auth-label">
              Email Address
            </label>
            <input
              id="auth-email-input"
              type="email"
              required
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="auth-input"
            />
          </div>

          <div className="auth-field">
            <label htmlFor="auth-password-input" className="auth-label">
              Password
            </label>
            <input
              id="auth-password-input"
              type="password"
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="auth-input"
            />
          </div>

          <div className="auth-modal-actions">
            <button
              type="button"
              className="btn-engine-add-cancel"
              onClick={closeAuthModal}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn-header-cta"
              style={{ height: '36px', padding: '0 20px' }}
            >
              {loading ? (
                <span>Processing...</span>
              ) : mode === 'login' ? (
                <span>Sign In</span>
              ) : (
                <span>Register</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </>
  );
};
