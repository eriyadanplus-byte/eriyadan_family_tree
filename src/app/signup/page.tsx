'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Eye, EyeOff, AlertCircle, Loader2, CheckCircle2,
  ChevronRight, ChevronLeft, TreeDeciduous, MessageCircle,
} from 'lucide-react';
import HelpComposer from '@/components/help/HelpComposer';
import AncestorSearch, { type AncestorResult } from '@/components/AncestorSearch';

/* ── Step dot ─────────────────────────────── */
function StepDot({ step, current }: { step: number; current: number }) {
  const done   = current > step;
  const active = current === step;
  return (
    <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300"
      style={
        done   ? { background: '#4CAF72', color: '#fff' } :
        active ? { background: '#4CAF72', color: '#fff', boxShadow: '0 0 16px rgba(76,175,114,0.5)' } :
                 { background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.10)', color: 'rgba(232,245,233,0.30)' }
      }>
      {done ? '✓' : step}
    </div>
  );
}

/* ── Main signup page ─────────────────────────────── */
export default function SignUpPage() {
  const router = useRouter();
  const [step,    setStep]    = useState(1);
  const [error,   setError]   = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [showPw,  setShowPw]  = useState(false);

  const [form, setForm] = useState({
    name: '', email: '', mobile: '', password: '', confirmPassword: '',
  });
  const [ancestor, setAncestor] = useState<AncestorResult | null>(null);
  const [relationType, setRelationType] = useState<'child' | 'spouse' | 'sibling' | ''>('');
  const [autoApproved, setAutoApproved] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [helpStage, setHelpStage] = useState<'signup_start' | 'signup_final_no_match' | 'login_help'>('signup_start');

  const setField = (k: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm(f => ({ ...f, [k]: e.target.value }));

  /* Validation */
  const validate = (): string => {
    if (step === 1) {
      if (!form.name.trim())  return 'Full name is required';
      if (!form.email.trim()) return 'Email is required';
      if (!/\S+@\S+\.\S+/.test(form.email)) return 'Enter a valid email address';
      if (!form.mobile.trim()) return 'Mobile number is required';
    }
    if (step === 2) {
      if (form.password.length < 8) return 'Password must be at least 8 characters';
      if (form.password !== form.confirmPassword) return 'Passwords do not match';
    }
    if (step === 3) {
      if (!ancestor) return 'Please select your ancestor from the family tree';
    }
    return '';
  };

  const next = () => {
    setError('');
    const err = validate();
    if (err) { setError(err); return; }
    if (step < 3) { setStep(s => s + 1); return; }
    submit();
  };

  const submit = async () => {
    setLoading(true);
    setError('');
    try {
      const payload: any = {
        name:       form.name,
        email:      form.email,
        mobile:     form.mobile,
        password:   form.password,
        ancestorId: ancestor?.id ?? null,
        relationType: relationType || null,
      };
      // If couple selected, pass the second parent's ID
      if (ancestor?.spouseId) {
        payload.secondaryAncestorId = ancestor.spouseId;
      }
      // If a stub member was selected, include disambiguation fields for auto-approval
      if (ancestor && ancestor.isStub && relationType) {
        payload.stubMemberId = ancestor.id;
        payload.relationType = relationType;
      }
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Registration failed');
      setAutoApproved(!!data.autoApproved);
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  /* Success screen */
  if (success) return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: '#0D1F0D' }}>
      <div className="orb orb-green fixed pointer-events-none" />
      <div className="orb orb-gold  fixed pointer-events-none" />
      <div className="relative z-10 w-full max-w-md text-center">
        <div className="mx-auto w-20 h-20 rounded-full flex items-center justify-center mb-6"
          style={{ background: autoApproved ? 'rgba(76,175,114,0.15)' : 'rgba(200,150,46,0.15)', border: autoApproved ? '1px solid rgba(76,175,114,0.30)' : '1px solid rgba(200,150,46,0.30)' }}>
          <CheckCircle2 className="w-10 h-10" style={{ color: autoApproved ? '#81C784' : '#E6B84A' }} />
        </div>
        <h1 className="font-display text-3xl font-bold text-white mb-4">
          {autoApproved ? 'Welcome to the Family!' : 'Registration Submitted!'}
        </h1>
        <p className="mb-8 text-base leading-relaxed" style={{ color: 'rgba(232,245,233,0.55)' }}>
          {autoApproved
            ? 'Your account has been automatically linked to your family profile. You can sign in right away!'
            : "Your request has been sent to the family admin for approval. You'll be able to sign in once approved — usually within 24 hours."}
        </p>
        <button onClick={() => router.push('/login')}
          className="btn-primary px-10 py-3 text-base">
          {autoApproved ? 'Sign In Now' : 'Go to Sign In'}
        </button>
      </div>
    </div>
  );

  const STEP_LABELS = ['Your Details', 'Set Password', 'Find Your Ancestor'];

  return (
    <div className="min-h-screen flex items-center justify-center p-4 py-12"
      style={{ background: '#0D1F0D' }}>
      <div className="orb orb-green fixed pointer-events-none" />
      <div className="orb orb-gold  fixed pointer-events-none" />

      <div className="relative z-10 w-full max-w-lg">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="mx-auto w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
            style={{ background: 'rgba(76,175,114,0.12)', border: '1px solid rgba(76,175,114,0.22)' }}>
            <TreeDeciduous className="w-7 h-7" style={{ color: '#81C784' }} />
          </div>
          <h1 className="font-display text-3xl font-bold text-white mb-1">Join Eriyadan's Legacy</h1>
          <p className="text-sm" style={{ color: 'rgba(232,245,233,0.45)' }}>
            Step {step} of 3 — {STEP_LABELS[step - 1]}
          </p>
        </div>

        {/* Step progress */}
        <div className="flex items-center justify-center gap-3 mb-8">
          {[1, 2, 3].map((s, i) => (
            <div key={s} className="flex items-center gap-3">
              <StepDot step={s} current={step} />
              {i < 2 && (
                <div className="w-12 h-px transition-colors duration-300"
                  style={{ background: step > s ? 'rgba(76,175,114,0.6)' : 'rgba(255,255,255,0.10)' }} />
              )}
            </div>
          ))}
        </div>

        {/* Card */}
        <div className="p-8 rounded-3xl"
          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.09)' }}>

          {error && (
            <div className="flex items-center gap-3 p-4 rounded-xl mb-6 text-sm"
              style={{ background: 'rgba(239,83,80,0.10)', border: '1px solid rgba(239,83,80,0.20)', color: '#EF5350' }}>
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Step 1 — Personal details */}
          {step === 1 && (
            <div className="space-y-5">
              {[
                { label: 'Full Name *', key: 'name',   type: 'text',  placeholder: 'e.g. Ahmed Al-Rashidi' },
                { label: 'Email Address *', key: 'email', type: 'email', placeholder: 'you@example.com' },
                { label: 'Mobile Number *', key: 'mobile', type: 'tel',  placeholder: '+971 50 000 0000' },
              ].map(({ label, key, type, placeholder }) => (
                <div key={key}>
                  <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5"
                    style={{ color: 'rgba(232,245,233,0.50)' }}>{label}</label>
                  <input type={type} value={form[key as keyof typeof form]}
                    onChange={setField(key as keyof typeof form)}
                    className="glass-input" placeholder={placeholder} />
                </div>
              ))}
            </div>
          )}

          {/* Step 2 — Password */}
          {step === 2 && (
            <div className="space-y-5">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5"
                  style={{ color: 'rgba(232,245,233,0.50)' }}>Create Password *</label>
                <div className="relative">
                  <input type={showPw ? 'text' : 'password'} value={form.password}
                    onChange={setField('password')} className="glass-input pr-12"
                    placeholder="Min. 8 characters" />
                  <button type="button" onClick={() => setShowPw(p => !p)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1">
                    {showPw
                      ? <EyeOff className="w-5 h-5" style={{ color: 'rgba(232,245,233,0.35)' }} />
                      : <Eye    className="w-5 h-5" style={{ color: 'rgba(232,245,233,0.35)' }} />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5"
                  style={{ color: 'rgba(232,245,233,0.50)' }}>Confirm Password *</label>
                <input type="password" value={form.confirmPassword}
                  onChange={setField('confirmPassword')} className="glass-input"
                  placeholder="Re-enter password" />
              </div>
              <div className="p-3 rounded-xl text-xs leading-relaxed"
                style={{ background: 'rgba(76,175,114,0.06)', color: 'rgba(232,245,233,0.50)' }}>
                💡 Use at least 8 characters. Mix letters and numbers for a strong password.
              </div>
            </div>
          )}

          {/* Step 3 — Ancestor */}
          {step === 3 && (
            <div className="space-y-4">
              <p className="text-sm leading-relaxed" style={{ color: 'rgba(232,245,233,0.55)' }}>
                Search for your closest relative already in the tree (parent, grandparent, uncle/aunt). This places you correctly in the family lineage.
              </p>
              <AncestorSearch
                value={ancestor}
                onChange={setAncestor}
                onNoMatch={() => { setHelpStage('signup_final_no_match'); setShowHelp(true); }}
              />
              {/* Relation type selector — shown after ancestor is selected */}
              {ancestor && (
                <div className="space-y-2">
                  <label className="block text-xs font-semibold uppercase tracking-wider"
                    style={{ color: 'rgba(232,245,233,0.50)' }}>How are you related?</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { value: 'child', label: 'Child' },
                      { value: 'spouse', label: 'Spouse' },
                      { value: 'sibling', label: 'Sibling' },
                    ].map(opt => (
                      <button key={opt.value} type="button"
                        onClick={() => setRelationType(opt.value as any)}
                        className="py-2 px-3 rounded-xl text-sm font-medium transition-all"
                        style={relationType === opt.value
                          ? { background: 'rgba(76,175,114,0.20)', border: '1px solid rgba(76,175,114,0.40)', color: '#81C784' }
                          : { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(232,245,233,0.45)' }
                        }>
                        {opt.label}
                      </button>
                    ))}
                  </div>
                  {(ancestor as AncestorResult)?.isStub && relationType && (
                    <div className="p-3 rounded-xl text-xs leading-relaxed"
                      style={{ background: 'rgba(76,175,114,0.06)', border: '1px solid rgba(76,175,114,0.15)', color: 'rgba(232,245,233,0.60)' }}>
                      ✨ This profile is unclaimed. If your name and mobile match, your account will be auto-approved and linked to this profile.
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Navigation */}
          <div className="flex gap-3 mt-8">
            {step > 1 && (
              <button type="button"
                onClick={() => { setStep(s => s - 1); setError(''); }}
                className="btn-ghost px-5 py-3 flex items-center gap-2 flex-shrink-0">
                <ChevronLeft className="w-4 h-4" /> Back
              </button>
            )}
            <button type="button" onClick={next} disabled={loading}
              className="flex-1 h-12 rounded-full font-bold text-white flex items-center justify-center gap-2 transition-all disabled:opacity-50"
              style={{
                background:  'linear-gradient(135deg, #4CAF72, #2E7D32)',
                boxShadow:   '0 4px 20px rgba(76,175,114,0.30)',
              }}>
              {loading
                ? <Loader2 className="w-5 h-5 animate-spin" />
                : step < 3
                  ? <><span>Continue</span><ChevronRight className="w-4 h-4" /></>
                  : <span>Submit Registration</span>}
            </button>
          </div>
        </div>

        <p className="text-center mt-6 text-sm" style={{ color: 'rgba(232,245,233,0.35)' }}>
          Already a member?{' '}
          <a href="/login" className="hover:underline font-semibold" style={{ color: '#81C784' }}>Sign In</a>
        </p>
        <p className="text-center mt-2">
          <a href="/" className="text-sm hover:underline" style={{ color: 'rgba(232,245,233,0.25)' }}>← Back to Home</a>
        </p>
      </div>

      {/* Entry Point B: persistent "Talk to admin" help button, visible throughout signup */}
      <button
        type="button"
        onClick={() => { setHelpStage('login_help'); setShowHelp(true); }}
        className="fixed bottom-6 right-6 z-40 flex items-center gap-2 px-4 py-2.5 rounded-full shadow-xl transition-all hover:scale-105"
        style={{ background: 'rgba(13,31,13,0.96)', border: '1px solid rgba(76,175,114,0.30)', color: '#81C784', backdropFilter: 'blur(12px)' }}
        title="Need help? Talk to admin"
      >
        <MessageCircle className="w-4 h-4" />
        <span className="text-xs font-semibold">Need help?</span>
      </button>

      {/* Help Composer modal */}
      <HelpComposer
        isOpen={showHelp}
        onClose={() => setShowHelp(false)}
        triggerStage={helpStage}
        contextSnapshot={helpStage === 'signup_final_no_match'
          ? { full_name: form.name, mobile: form.mobile, email: form.email }
          : { full_name: form.name, mobile: form.mobile }}
      />
    </div>
  );
}
