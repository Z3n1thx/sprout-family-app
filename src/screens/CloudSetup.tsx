/**
 * Cloud setup flow for Sprout v2.
 *
 * Passwordless authentication with magic links. No password to forget,
 * no password to steal. Email-only auth is the modern standard for family apps.
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signInWithEmail } from '../lib/supabase';
import { Icon } from '../ui/Icons';
import { Sprig } from '../ui/Sprig';

type CloudSetupStep = 'email' | 'check-email' | 'waiting';

export default function CloudSetup() {
  const [step, setStep] = useState<CloudSetupStep>('email');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const nav = useNavigate();

  async function handleSendLink() {
    if (!email.trim()) return;

    setLoading(true);
    setError(null);

    const { error: authError } = await signInWithEmail(email.trim().toLowerCase());

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    setLoading(false);
    setStep('check-email');
  }

  if (step === 'email') {
    return (
      <div className="app" data-tier="p">
        <div className="screen" style={{ display: 'flex', flexDirection: 'column', gap: '24px', paddingTop: '24px' }}>
          <button
            className="btn ghost sm"
            onClick={() => nav('/onboarding')}
            style={{ alignSelf: 'flex-start' }}
          >
            <Icon name="arrowl" />
            Back
          </button>

          <Sprig mood="neutral" className="sprig" />

          <div style={{ textAlign: 'center' }}>
            <h1 className="h1" style={{ fontSize: '28px', marginBottom: '12px' }}>
              Set up cloud sync
            </h1>
            <p className="body" style={{ color: 'var(--ink-soft)' }}>
              We'll send you a magic link to sign in. No password needed.
            </p>
          </div>

          <div className="field">
            <label htmlFor="email">Your email</label>
            <p className="hint">
              This email is only for signing in and important notifications. We never spam or share it.
            </p>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendLink()}
              placeholder="you@example.com"
              autoComplete="email"
              autoFocus
              disabled={loading}
            />
          </div>

          {error ? (
            <div className="card t-berry">
              <p className="body" style={{ color: 'var(--berry-deep)' }}>
                {error}
              </p>
            </div>
          ) : null}

          <button
            className="btn green huge"
            onClick={handleSendLink}
            disabled={!email.trim() || loading}
          >
            {loading ? 'Sending...' : 'Send magic link'}
            <Icon name="arrowr" />
          </button>

          <div className="card soft">
            <p className="eyebrow">How it works</p>
            <ol style={{ paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <li className="meta">We send a link to your email</li>
              <li className="meta">Tap the link on any device you want to use Sprout on</li>
              <li className="meta">That device is now signed in — no password to remember</li>
            </ol>
          </div>

          <p className="meta" style={{ textAlign: 'center' }}>
            By continuing, you agree to our{' '}
            <a href="/terms" style={{ color: 'var(--sky-deep)', textDecoration: 'underline' }}>
              Terms of Service
            </a>{' '}
            and{' '}
            <a href="/privacy" style={{ color: 'var(--sky-deep)', textDecoration: 'underline' }}>
              Privacy Policy
            </a>
            .
          </p>
        </div>
      </div>
    );
  }

  if (step === 'check-email') {
    return (
      <div className="app" data-tier="p">
        <div className="screen" style={{ display: 'flex', flexDirection: 'column', gap: '24px', paddingTop: '48px', textAlign: 'center' }}>
          <Sprig mood="wait" className="sprig lg" />

          <div>
            <h1 className="h1" style={{ fontSize: '28px', marginBottom: '12px' }}>
              Check your email
            </h1>
            <p className="body" style={{ color: 'var(--ink-soft)' }}>
              We sent a sign-in link to:
            </p>
            <p className="h2" style={{ marginTop: '8px', color: 'var(--sky-deep)' }}>
              {email}
            </p>
          </div>

          <div className="card t-sky">
            <p className="body">
              Tap the link in your email to continue setting up Sprout. You can close this tab.
            </p>
          </div>

          <div className="card soft" style={{ textAlign: 'left' }}>
            <p className="eyebrow">Didn't get it?</p>
            <ul style={{ paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px' }}>
              <li className="meta">Check your spam folder</li>
              <li className="meta">Wait 2-3 minutes (it might take a moment)</li>
              <li className="meta">
                <button
                  onClick={() => setStep('email')}
                  style={{ color: 'var(--sky-deep)', textDecoration: 'underline', background: 'none', border: 'none', padding: 0, cursor: 'pointer', font: 'inherit' }}
                >
                  Try a different email address
                </button>
              </li>
            </ul>
          </div>

          <button
            className="btn ghost"
            onClick={() => nav('/')}
          >
            Cancel setup
          </button>
        </div>
      </div>
    );
  }

  return null;
}
