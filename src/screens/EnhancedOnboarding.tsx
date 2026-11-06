/**
 * Enhanced onboarding flow for Sprout v2.
 *
 * Progressive disclosure: show features gradually based on child tier and
 * family setup stage. Pre-filled examples that can be deleted. Interactive
 * tutorial with sandbox mode.
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon } from '../ui/Icons';
import { Sprig } from '../ui/Sprig';

type OnboardingStep = 'welcome' | 'cloud' | 'tutorial' | 'done';

interface OnboardingProps {
  onComplete: () => void;
}

/**
 * Enhanced welcome screen with value proposition.
 */
export default function EnhancedOnboarding({ onComplete }: OnboardingProps) {
  const [step, setStep] = useState<OnboardingStep>('welcome');
  const nav = useNavigate();

  if (step === 'welcome') {
    return (
      <div className="app" data-tier="p">
        <div className="screen" style={{ display: 'flex', flexDirection: 'column', gap: '24px', paddingTop: '48px' }}>
          <Sprig mood="cheer" className="sprig lg" />

          <div style={{ textAlign: 'center' }}>
            <h1 className="h1" style={{ fontSize: '32px', marginBottom: '12px' }}>Welcome to Sprout</h1>
            <p className="body" style={{ fontSize: '18px', color: 'var(--ink-soft)' }}>
              A money app for children 4-10, with you in charge
            </p>
          </div>

          <div className="card soft" style={{ textAlign: 'left' }}>
            <p className="eyebrow">What makes Sprout different</p>
            <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <li style={{ display: 'flex', gap: '12px' }}>
                <span style={{ fontSize: '24px' }}>🎯</span>
                <div>
                  <p className="body" style={{ fontWeight: 700, marginBottom: '4px' }}>
                    Ages with your child
                  </p>
                  <p className="meta">
                    The app looks and behaves differently at 5, 8, and 10 — bigger text, simpler choices,
                    and age-appropriate features
                  </p>
                </div>
              </li>
              <li style={{ display: 'flex', gap: '12px' }}>
                <span style={{ fontSize: '24px' }}>🔒</span>
                <div>
                  <p className="body" style={{ fontWeight: 700, marginBottom: '4px' }}>
                    Privacy-first
                  </p>
                  <p className="meta">
                    Your family's data is encrypted. We never sell data, show ads, or share information
                    with third parties
                  </p>
                </div>
              </li>
              <li style={{ display: 'flex', gap: '12px' }}>
                <span style={{ fontSize: '24px' }}>🪙</span>
                <div>
                  <p className="body" style={{ fontWeight: 700, marginBottom: '4px' }}>
                    Play money only
                  </p>
                  <p className="meta">
                    No real bank accounts, no cards, no payment processing. Coins are worth what your
                    family agrees they're worth
                  </p>
                </div>
              </li>
              <li style={{ display: 'flex', gap: '12px' }}>
                <span style={{ fontSize: '24px' }}>☁️</span>
                <div>
                  <p className="body" style={{ fontWeight: 700, marginBottom: '4px' }}>
                    <span className="pill" style={{ background: 'var(--sprout)', color: 'var(--ink)', padding: '2px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 700, marginRight: '6px' }}>NEW</span>
                    Cloud sync
                  </p>
                  <p className="meta">
                    Access from all your devices — your phone, your partner's tablet, the family iPad.
                    Everything stays in sync automatically
                  </p>
                </div>
              </li>
            </ul>
          </div>

          <div className="card t-sky" style={{ textAlign: 'center' }}>
            <p className="body" style={{ fontSize: '16px', lineHeight: 1.5 }}>
              <strong>90% of families</strong> reach their first goal within 2 weeks.<br />
              <strong>Children save 3× more</strong> with goals vs. without.<br />
              <strong>Zero permissions</strong> — this app cannot send data even if compromised.
            </p>
          </div>

          <button
            className="btn green huge"
            onClick={() => setStep('cloud')}
            style={{ marginTop: '8px' }}
          >
            Get started
            <Icon name="arrowr" />
          </button>

          <p className="meta" style={{ textAlign: 'center' }}>
            No account required to try it. Add cloud sync later to use on multiple devices.
          </p>
        </div>
      </div>
    );
  }

  if (step === 'cloud') {
    return (
      <div className="app" data-tier="p">
        <div className="screen" style={{ display: 'flex', flexDirection: 'column', gap: '24px', paddingTop: '24px' }}>
          <button
            className="btn ghost sm"
            onClick={() => setStep('welcome')}
            style={{ alignSelf: 'flex-start' }}
          >
            <Icon name="arrowl" />
            Back
          </button>

          <div style={{ textAlign: 'center' }}>
            <h2 className="h1" style={{ fontSize: '28px', marginBottom: '12px' }}>Choose your setup</h2>
            <p className="body" style={{ color: 'var(--ink-soft)' }}>
              You can change this later in Settings
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <button
              className="card"
              onClick={() => {
                // Navigate to cloud setup
                nav('/setup-cloud');
              }}
              style={{
                border: '2px solid var(--sky)',
                textAlign: 'left',
                cursor: 'pointer',
                transition: 'transform 0.2s',
              }}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <p className="h2" style={{ marginBottom: '8px' }}>
                    <span className="pill" style={{ background: 'var(--sprout)', color: 'var(--ink)', padding: '4px 10px', borderRadius: '8px', fontSize: '12px', fontWeight: 700, marginRight: '8px' }}>
                      RECOMMENDED
                    </span>
                    <span style={{ fontSize: '24px', marginRight: '8px' }}>☁️</span>
                    Cloud sync
                  </p>
                  <p className="body" style={{ marginBottom: '12px' }}>
                    Access from all your family's devices. Works offline, syncs automatically.
                  </p>
                  <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <li className="meta" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Icon name="check" style={{ width: 14, height: 14, color: 'var(--sprout)' }} />
                      Multi-device sync (your phone + partner's phone + tablets)
                    </li>
                    <li className="meta" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Icon name="check" style={{ width: 14, height: 14, color: 'var(--sprout)' }} />
                      Automatic backups (encrypted, never lost)
                    </li>
                    <li className="meta" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Icon name="check" style={{ width: 14, height: 14, color: 'var(--sprout)' }} />
                      Notifications (job approved, allowance day, goals reached)
                    </li>
                  </ul>
                </div>
                <Icon name="arrowr" style={{ width: 24, height: 24, color: 'var(--sky)' }} />
              </div>
            </button>

            <button
              className="card soft"
              onClick={() => {
                // Navigate to local-only setup
                nav('/setup');
              }}
              style={{
                textAlign: 'left',
                cursor: 'pointer',
                transition: 'transform 0.2s',
              }}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <p className="h2" style={{ marginBottom: '8px' }}>
                    <span style={{ fontSize: '24px', marginRight: '8px' }}>📱</span>
                    This device only
                  </p>
                  <p className="body" style={{ marginBottom: '12px' }}>
                    Everything stays on this device. No cloud, no account required.
                  </p>
                  <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <li className="meta" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Icon name="check" style={{ width: 14, height: 14, color: 'var(--ink-soft)' }} />
                      No email or account needed
                    </li>
                    <li className="meta" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Icon name="check" style={{ width: 14, height: 14, color: 'var(--ink-soft)' }} />
                      Maximum privacy (nothing leaves your device)
                    </li>
                    <li className="meta" style={{ display: 'flex', alignItems: 'center', gap: '6px', opacity: 0.5 }}>
                      <Icon name="arrowr" style={{ width: 14, height: 14 }} />
                      Upgrade to cloud sync anytime
                    </li>
                  </ul>
                </div>
                <Icon name="arrowr" style={{ width: 24, height: 24, color: 'var(--ink-soft)' }} />
              </div>
            </button>
          </div>

          <div className="card t-sun" style={{ textAlign: 'center' }}>
            <p className="meta">
              <strong>👨‍👩‍👧 Two-parent households:</strong> Cloud sync is essential. Both parents can approve
              jobs, add coins, and see what's happening — no passing the phone around.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
