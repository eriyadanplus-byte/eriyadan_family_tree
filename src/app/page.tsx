'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';

export default function LandingPage() {
  const rootRef = useRef<HTMLDivElement>(null);

  // Subtle floating leaves animation
  useEffect(() => {
    const leaves = document.querySelectorAll<HTMLElement>('.leaf');
    leaves.forEach((leaf, i) => {
      const duration = 6 + Math.random() * 6;
      const delay    = i * 0.8;
      leaf.style.animation = `floatLeaf ${duration}s ${delay}s ease-in-out infinite`;
    });
  }, []);

  return (
    <div ref={rootRef} className="min-h-screen relative overflow-hidden flex flex-col" style={{ background: '#0D1F0D' }}>

      {/* ── Background orbs ── */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="orb orb-green" />
        <div className="orb orb-gold" />
        {/* Dot grid */}
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: 'radial-gradient(rgba(76,175,114,0.6) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
        }} />
      </div>

      {/* ── Floating leaf decorations ── */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        {['🍃','🌿','🍀','🍃','🌿'].map((l, i) => (
          <span key={i} className="leaf absolute text-2xl opacity-20 select-none" style={{
            left: `${10 + i * 20}%`, top: `${15 + (i % 3) * 25}%`,
          }}>{l}</span>
        ))}
      </div>

      {/* ── Main content ── */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 text-center py-20">

        {/* Tree icon */}
        <div className="mb-8 relative">
          <div className="absolute inset-0 rounded-full bg-green-500/20 blur-3xl scale-150" />
          <div className="relative w-24 h-24 md:w-32 md:h-32 mx-auto flex items-center justify-center rounded-full"
            style={{ background: 'rgba(76,175,114,0.10)', border: '1px solid rgba(76,175,114,0.25)' }}>
            <svg viewBox="0 0 48 56" className="w-12 h-12 md:w-16 md:h-16" fill="none">
              <defs>
                <linearGradient id="tg" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#81C784"/>
                  <stop offset="100%" stopColor="#C8962E"/>
                </linearGradient>
              </defs>
              {/* Trunk */}
              <rect x="21" y="36" width="6" height="16" rx="3" fill="url(#tg)" opacity=".7"/>
              {/* Layers */}
              <polygon points="24,4 38,24 10,24" fill="url(#tg)" opacity=".9"/>
              <polygon points="24,14 40,34 8,34" fill="url(#tg)" opacity=".75"/>
              {/* Dots / members */}
              {[[24,4],[10,24],[38,24],[8,34],[40,34],[16,19],[32,19]].map(([cx,cy],i)=>(
                <circle key={i} cx={cx} cy={cy} r="2.5" fill="#C8962E" opacity=".9"/>
              ))}
            </svg>
          </div>
        </div>

        {/* Title */}
        <h1 className="font-display text-5xl md:text-7xl lg:text-8xl font-bold leading-none tracking-tight mb-4"
          style={{ color: '#E8F5E9', textShadow: '0 0 40px rgba(76,175,114,0.30)' }}>
          Eriyadan's<br />
          <span style={{ color: '#C8962E', textShadow: '0 0 40px rgba(200,150,46,0.35)' }}>Legacy</span>
        </h1>

        <p className="text-lg md:text-xl mb-3 font-light tracking-widest uppercase"
          style={{ color: 'rgba(232,245,233,0.55)', letterSpacing: '0.25em' }}>
          Every root tells a story
        </p>

        <p className="max-w-md text-base md:text-lg mb-12" style={{ color: 'rgba(232,245,233,0.45)' }}>
          A private space for your family to discover, connect and preserve your lineage — from the first ancestor to the newest generation.
        </p>

        {/* ── The only two CTAs ── */}
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-center w-full max-w-sm sm:max-w-none">
          <Link href="/signup"
            className="w-full sm:w-auto flex items-center justify-center gap-3 px-10 py-4 rounded-full font-bold text-lg transition-all duration-300"
            style={{
              background: 'linear-gradient(135deg, #4CAF72, #2E7D32)',
              color: '#fff',
              boxShadow: '0 4px 24px rgba(76,175,114,0.35)',
              minWidth: 220,
            }}
            onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 6px 36px rgba(76,175,114,0.55)')}
            onMouseLeave={e => (e.currentTarget.style.boxShadow = '0 4px 24px rgba(76,175,114,0.35)')}
          >
            <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 flex-shrink-0">
              <path d="M10 9a3 3 0 100-6 3 3 0 000 6zM6 15a4 4 0 018 0H6z"/>
            </svg>
            Join the Family
          </Link>

          <Link href="/login"
            className="w-full sm:w-auto flex items-center justify-center gap-3 px-10 py-4 rounded-full font-semibold text-lg transition-all duration-300"
            style={{
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.15)',
              color: 'rgba(232,245,233,0.85)',
              minWidth: 220,
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.10)'; e.currentTarget.style.borderColor = 'rgba(200,150,46,0.50)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)'; }}
          >
            <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 flex-shrink-0">
              <path fillRule="evenodd" d="M3 3a1 1 0 011 1v12a1 1 0 11-2 0V4a1 1 0 011-1zm7.707 3.293a1 1 0 010 1.414L9.414 9H17a1 1 0 110 2H9.414l1.293 1.293a1 1 0 01-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0z" clipRule="evenodd"/>
            </svg>
            Sign In
          </Link>
        </div>

        {/* Trust line */}
        <p className="mt-10 text-sm" style={{ color: 'rgba(232,245,233,0.25)' }}>
          🔒 Private &amp; invite-only — your family data stays within the family
        </p>
      </main>

      {/* ── Desktop feature strip (hidden on mobile) ── */}
      <div className="hidden lg:flex relative z-10 justify-center gap-8 px-8 pb-16">
        {[
          { icon: '🌳', title: 'Visual Family Tree', desc: 'Explore every branch of your lineage with an interactive tree' },
          { icon: '✝️', title: 'Honour the Late', desc: 'Preserve ancestors who have passed — their story lives on' },
          { icon: '🔐', title: 'Admin Approved', desc: 'Only verified family members can join — no strangers allowed' },
        ].map(({ icon, title, desc }) => (
          <div key={title}
            className="flex-1 max-w-xs p-6 rounded-2xl text-center"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
            <div className="text-4xl mb-3">{icon}</div>
            <h3 className="font-display font-semibold text-base mb-2" style={{ color: '#E8F5E9' }}>{title}</h3>
            <p className="text-sm" style={{ color: 'rgba(232,245,233,0.45)' }}>{desc}</p>
          </div>
        ))}
      </div>

      {/* Leaf float keyframes */}
      <style>{`
        @keyframes floatLeaf {
          0%,100% { transform: translateY(0) rotate(0deg); }
          50%      { transform: translateY(-18px) rotate(8deg); }
        }
      `}</style>
    </div>
  );
}
