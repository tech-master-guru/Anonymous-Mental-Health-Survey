import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Anonymous Mental Health Survey | ZK dApp on Midnight',
  description: 'Participate in confidential mental health assessments (PHQ-9, GAD-7) and prove response eligibility with zero-knowledge proofs without exposing personal identity or individual answers.',
};

export default function HomePage() {
  return (
    <>
      <main>
        {/* Hero */}
        <div className="hero">
          <div className="hero-badge">
            <span>🧠</span> Midnight Preview Network — Live dApp
          </div>
          <h1>Anonymous Mental Health Survey</h1>
          <p>
            Complete confidential mental health evaluations, authenticate cohort eligibility, and submit responses with <strong>zero-knowledge proofs</strong> — without revealing your name, student/employee ID, diagnosis, or raw answers on-chain.
          </p>
          <div className="hero-actions">
            <Link href="/claim" className="btn-primary">📋 Take Confidential Survey (ZK Proof)</Link>
            <Link href="/admin" className="btn-secondary">⚙️ Surveyor Admin Console</Link>
          </div>
        </div>

        {/* Stats Grid */}
        <div style={{ maxWidth: 1000, margin: '0 auto', padding: '0 1.5rem 2rem' }}>
          <div className="stats-grid" style={{ marginBottom: '2rem' }}>
            {[
              { value: '6', label: 'ZK Circuits', color: '#e11d48' },
              { value: '8', label: 'Ledger Fields', color: '#8b5cf6' },
              { value: '5', label: 'Private Witnesses', color: '#10b981' },
              { value: '13', label: 'Unit Tests Passing', color: '#f59e0b' },
            ].map(s => (
              <div className="stat-card" key={s.label}>
                <div className="stat-value" style={{ color: s.color }}>{s.value}</div>
                <div className="stat-label">{s.label}</div>
              </div>
            ))}
          </div>

          {/* ZK Contract Architecture */}
          <div className="glass-card" style={{ padding: '2rem', marginBottom: '1.5rem' }}>
            <div style={{ marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
                <span className="badge badge-amber">Compact v0.23</span>
                <span className="badge badge-purple">Midnight Preview</span>
                <span className="badge badge-green">6 Circuits</span>
              </div>
              <h2 className="section-title">ZK Survey Contract Architecture</h2>
              <p className="section-desc">contracts/anonymous_mental_health_survey.compact — 8 ledger fields, 5 witnesses, 6 circuits</p>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '0.75rem' }}>
              {[
                { circuit: 'submitSurveyResponse(Bytes<32>)', witnesses: '4 witnesses', desc: 'ZK survey response proof with private assessment threshold assertion', color: '#e11d48' },
                { circuit: 'verifySurveySubmission(Bytes<32>)', witnesses: '0 witnesses', desc: 'Public on-chain submission commitment verification', color: '#06b6d4' },
                { circuit: 'revokeSubmission(Bytes<32>)', witnesses: 'surveyorSigningKey', desc: 'Clinical admin revokes tainted/duplicate response (ZK auth)', color: '#ef4444' },
                { circuit: 'setSurveyorCommitment(Uint<32>)', witnesses: 'surveyorSigningKey', desc: 'Anchor surveyor authority + set assessment threshold parameter', color: '#f59e0b' },
                { circuit: 'resetSurveyCohort(Bytes<32>, Uint<32>)', witnesses: '—', desc: 'Rotate active study cohort ID + update threshold', color: '#10b981' },
                { circuit: 'incrementSession()', witnesses: '—', desc: 'Bump session nonce for replay protection', color: '#64748b' },
              ].map(c => (
                <div key={c.circuit} style={{ background: 'rgba(255,255,255,0.025)', borderRadius: '10px', padding: '1rem', border: `1px solid ${c.color}33` }}>
                  <div style={{ fontFamily: 'monospace', fontSize: '0.75rem', color: c.color, marginBottom: '0.35rem', fontWeight: '700' }}>{c.circuit}</div>
                  <div style={{ fontSize: '0.7rem', color: '#64748b', marginBottom: '0.4rem' }}>Witnesses: {c.witnesses}</div>
                  <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{c.desc}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Privacy Model Matrix */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
            <div className="glass-card" style={{ padding: '1.5rem', borderLeft: '3px solid #ef4444' }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#ef4444', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>🔒 Never Disclosed (Private Witnesses)</div>
              {[
                'participantSecretKey() — Respondent private key & anonymous identifier',
                'surveyResponseDataHash() — Hashed questionnaire responses & clinical notes',
                'assessmentScoreValue() — Private evaluation score (PHQ-9/GAD-7 total)',
                'surveyProofNonce() — Entropy salt for replay resistance',
                'surveyorSigningKey() — Clinical administrator signing key'
              ].map(w => (
                <div key={w} style={{ fontSize: '0.78rem', color: '#94a3b8', padding: '0.3rem 0', borderBottom: '1px solid rgba(255,255,255,0.04)', fontFamily: 'monospace' }}>{w}</div>
              ))}
            </div>
            <div className="glass-card" style={{ padding: '1.5rem', borderLeft: '3px solid #10b981' }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#10b981', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>🌐 Public Ledger (8 Fields)</div>
              {[
                'submissionCount — Total verified anonymous survey submissions',
                'revokedCount — Total revoked or voided submissions',
                'cohortId — Active research cohort identifier',
                'lastSubmissionCommitment — Most recent ZK submission commitment hash',
                'surveyorCommitment — Clinical authority anchor',
                'scoreThresholdLimit — Assessment validity threshold parameter',
                'activeSession — Epoch nonce (replay protection)',
                'lastRevokedCommitment — Most recent revoked submission hash'
              ].map(f => (
                <div key={f} style={{ fontSize: '0.78rem', color: '#94a3b8', padding: '0.25rem 0', borderBottom: '1px solid rgba(255,255,255,0.04)', fontFamily: 'monospace' }}>{f}</div>
              ))}
            </div>
          </div>

          {/* Action Links */}
          <div className="glass-card" style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              <a href="https://preview.midnightexplorer.com/contracts/0x2bf4b77c96faf17a985b45b11436edf3538bf6ba287cfbdefd592c571819d897"
                target="_blank" rel="noopener noreferrer" className="btn-secondary">
                🔍 Midnight Explorer
              </a>
              <a href="https://github.com/tech-master-guru/Anonymous-Mental-Health-Survey" target="_blank" rel="noopener noreferrer" className="btn-secondary">
                📦 GitHub Repo
              </a>
              <Link href="/claim" className="btn-primary">📋 Take Survey Now</Link>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
