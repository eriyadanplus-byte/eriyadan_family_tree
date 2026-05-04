'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { TreeDeciduous, X, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import LineagePicker from '@/components/LineagePicker';

interface Member {
  id: string; fullName: string; generation: number; gender?: string;
}
interface SessionUser {
  id: string; email: string;
  role: 'super_admin' | 'editor' | 'contributor' | 'viewer';
  memberId: string | null;
}

const CAN_ADD: Record<string, boolean> = {
  super_admin: true, editor: true, contributor: true, viewer: false,
};
const STEPS = ['Lineage', 'Identity', 'Profile', 'Review'];

export default function AddMemberPage() {
  const router = useRouter();
  const [session, setSession] = useState<SessionUser | null>(null);
  const [error,   setError]   = useState('');
  const [step,    setStep]    = useState(0);
  const [loading, setLoading] = useState(false);
  const [dod,     setDod]     = useState('');

  const [form, setForm] = useState({
    fullName: '', gender: '', dob: '', location: '', mobile: '', email: '',
    bio: '', current_role: '', company: '',
    fatherId: '', motherId: '', spouseId: '',
    generation: 1, isLate: false,
  });
  const [anchorMember,  setAnchorMember]  = useState<Member | null>(null);
  const [relationType,  setRelationType]  = useState<'child' | 'spouse' | 'sibling'>('child');

  useEffect(() => {
    fetch('/api/auth/session').then(r => r.ok ? r.json() : null)
      .then(d => { if (d?.user) setSession(d.user); else router.push('/login'); })
      .catch(() => router.push('/login'));
  }, [router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    setForm(prev => ({ ...prev, [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value }));
  };

  const handleLineageSelect = useCallback((member: Member | null) => {
    setAnchorMember(member);
    if (!member) {
      setForm(p => ({ ...p, fatherId: '', motherId: '', spouseId: '', generation: 1 }));
      return;
    }

    const generation = relationType === 'child'
      ? member.generation + 1
      : member.generation;

    setForm(p => ({
      ...p,
      generation,
      spouseId: relationType === 'spouse' ? member.id : p.spouseId,
      fatherId: relationType === 'child' ? p.fatherId : p.fatherId,
      motherId: relationType === 'child' ? p.motherId : p.motherId,
    }));
  }, [relationType]);

  useEffect(() => {
    if (!anchorMember) return;
    const generation = relationType === 'child'
      ? anchorMember.generation + 1
      : anchorMember.generation;
    setForm(p => ({ ...p, generation }));
  }, [anchorMember, relationType]);

  const next = () => {
    if (step === 0 && !anchorMember) { setError('Please select an ancestor or member.'); return; }
    setError('');
    setStep(s => Math.min(s + 1, STEPS.length - 1));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (step < STEPS.length - 1) { next(); return; }
    if (!session) return;
    setLoading(true);
    try {
      // Member-driven add (spouse/child) uses relatives API
      if (session.memberId && (relationType === 'spouse' || relationType === 'child')) {
        const payload: any = {
          relationType, name: form.fullName, mobile: form.mobile, gender: form.gender,
        };
        if (relationType === 'child') {
          payload.fatherId = form.fatherId || null;
          payload.motherId = form.motherId || null;
        }
        const res = await fetch('/api/members/relatives', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (res.ok) { router.push('/tree'); return; }
        else { const d = await res.json(); setError(d.error || 'Failed'); setLoading(false); return; }
      }
      // Admin add uses members API
      if (!CAN_ADD[session.role]) { setError('Permission denied'); setLoading(false); return; }
      const res = await fetch('/api/members', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: form.fullName, mobileNumber: form.mobile, email: form.email,
          location: form.location, bio: form.bio, gender: form.gender, dob: form.dob,
          current_role: form.current_role, company: form.company,
          dod: form.isLate ? dod : null, isLate: form.isLate,
          generation: form.generation,
          fatherId: form.fatherId || null, motherId: form.motherId || null, spouseId: form.spouseId || null,
        }),
      });
      if (res.ok) router.push('/tree');
      else { const d = await res.json(); setError(d.error || 'Failed'); }
    } catch { setError('Failed to create member'); }
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 md:p-8" style={{ background: '#0D1F0D' }}>
      <div className="orb orb-green fixed pointer-events-none" />
      <div className="orb orb-gold  fixed pointer-events-none" />

      <div className="relative z-10 w-full max-w-3xl rounded-3xl overflow-hidden"
        style={{ background: 'rgba(13,31,13,0.97)', border: '1px solid rgba(76,175,114,0.15)' }}>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: 'rgba(76,175,114,0.12)', border: '1px solid rgba(76,175,114,0.22)' }}>
              <TreeDeciduous className="w-5 h-5" style={{ color: '#81C784' }} />
            </div>
            <h2 className="font-display text-xl font-bold text-white">Add New Member</h2>
          </div>
          <Link href="/tree" className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors">
            <X className="w-5 h-5" style={{ color: 'rgba(232,245,233,0.50)' }} />
          </Link>
        </div>

        {/* Step pills */}
        <div className="flex items-center gap-2 px-6 py-4">
          {STEPS.map((label, i) => (
            <div key={label} className="flex items-center gap-2">
              <div className="flex items-center gap-1.5">
                <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold"
                  style={
                    i < step  ? { background: 'rgba(76,175,114,0.20)', color: '#81C784' } :
                    i === step ? { background: '#4CAF72', color: '#fff' } :
                                 { background: 'rgba(255,255,255,0.06)', color: 'rgba(232,245,233,0.30)' }
                  }>
                  {i < step ? '✓' : i + 1}
                </div>
                <span className="text-xs hidden sm:inline"
                  style={{ color: i === step ? '#E8F5E9' : 'rgba(232,245,233,0.35)' }}>{label}</span>
              </div>
              {i < STEPS.length - 1 && (
                <div className="w-8 h-px" style={{ background: i < step ? 'rgba(76,175,114,0.50)' : 'rgba(255,255,255,0.08)' }} />
              )}
            </div>
          ))}
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit}>
          <div className="px-6 pb-6 overflow-y-auto" style={{ maxHeight: '60vh' }}>

            {error && (
              <div className="flex items-center gap-3 p-4 rounded-xl mb-5 text-sm"
                style={{ background: 'rgba(239,83,80,0.10)', border: '1px solid rgba(239,83,80,0.20)', color: '#EF5350' }}>
                {error}
              </div>
            )}

            {/* Step 0 — Lineage */}
            {step === 0 && (
              <LineagePicker
                selectedAnchorId={anchorMember?.id || ''}
                selectedRelation={relationType}
                fatherId={form.fatherId}
                motherId={form.motherId}
                onAnchorSelect={handleLineageSelect}
                onRelationChange={setRelationType}
                onFatherSelect={id => setForm(p => ({ ...p, fatherId: id }))}
                onMotherSelect={id => setForm(p => ({ ...p, motherId: id }))}
              />
            )}

            {/* Step 1 — Identity */}
            {step === 1 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {[
                  { label: 'Full Name *', name: 'fullName', type: 'text', required: true },
                  { label: 'Mobile *',    name: 'mobile',   type: 'tel',  required: true },
                  { label: 'Email',       name: 'email',    type: 'email' },
                  { label: 'Location',    name: 'location', type: 'text' },
                  { label: 'Date of Birth', name: 'dob',   type: 'date' },
                ].map(({ label, name, type, required }) => (
                  <div key={name}>
                    <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5"
                      style={{ color: 'rgba(232,245,233,0.45)' }}>{label}</label>
                    <input type={type} name={name} required={required}
                      value={(form as any)[name]} onChange={handleChange}
                      className="glass-input" />
                  </div>
                ))}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5"
                    style={{ color: 'rgba(232,245,233,0.45)' }}>Gender</label>
                  <select name="gender" value={form.gender} onChange={handleChange} className="glass-input">
                    <option value="">Select gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>
            )}

            {/* Step 2 — Profile */}
            {step === 2 && (
              <div className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5"
                      style={{ color: 'rgba(232,245,233,0.45)' }}>Profession / Role</label>
                    <input name="current_role" value={form.current_role} onChange={handleChange}
                      className="glass-input" placeholder="e.g. Engineer" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5"
                      style={{ color: 'rgba(232,245,233,0.45)' }}>Company</label>
                    <input name="company" value={form.company} onChange={handleChange}
                      className="glass-input" placeholder="e.g. Acme Corp" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5"
                    style={{ color: 'rgba(232,245,233,0.45)' }}>Bio</label>
                  <textarea name="bio" value={form.bio} onChange={handleChange} rows={3}
                    className="glass-input min-h-[80px] resize-none" />
                </div>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" name="isLate" checked={form.isLate} onChange={handleChange}
                    className="w-4 h-4 rounded" />
                  <span className="text-sm text-white">Mark as Deceased</span>
                </label>
                {form.isLate && (
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5"
                      style={{ color: 'rgba(232,245,233,0.45)' }}>Date of Death</label>
                    <input type="date" value={dod} onChange={e => setDod(e.target.value)}
                      className="glass-input" />
                  </div>
                )}
              </div>
            )}

            {/* Step 3 — Review */}
            {step === 3 && anchorMember && (
              <div className="space-y-4">
                <div className="p-5 rounded-2xl"
                  style={{ background: 'rgba(76,175,114,0.06)', border: '1px solid rgba(76,175,114,0.18)' }}>
                  <p className="text-sm text-white leading-relaxed">
                    Adding <span className="font-bold" style={{ color: '#81C784' }}>{form.fullName || 'New Member'}</span> as a{' '}
                    <span className="font-bold" style={{ color: '#C8962E' }}>{relationType}</span> of{' '}
                    <span className="font-bold text-white">{anchorMember.fullName}</span> — Generation{' '}
                    <span className="font-bold" style={{ color: '#81C784' }}>{form.generation}</span>
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  {[
                    ['Name',     form.fullName],
                    ['Mobile',   form.mobile],
                    ['Gender',   form.gender],
                    ['Location', form.location],
                    ['Status',   form.isLate ? '† Deceased' : 'Living'],
                  ].map(([k, v]) => v ? (
                    <div key={k} className="p-3 rounded-xl"
                      style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                      <p className="text-xs font-semibold uppercase tracking-wider mb-1"
                        style={{ color: 'rgba(232,245,233,0.40)' }}>{k}</p>
                      <p className="text-white truncate">{v}</p>
                    </div>
                  ) : null)}
                </div>
              </div>
            )}
          </div>

          {/* Footer nav */}
          <div className="flex items-center justify-between px-6 py-4"
            style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}>
            <button type="button" onClick={() => { setStep(s => Math.max(s - 1, 0)); setError(''); }}
              disabled={step === 0}
              className="btn-ghost px-5 py-2.5 flex items-center gap-2 disabled:opacity-30">
              <ChevronLeft className="w-4 h-4" /> Back
            </button>
            <button type="submit" disabled={loading}
              className="flex items-center gap-2 px-8 py-2.5 rounded-full font-bold text-white disabled:opacity-50"
              style={{ background: 'linear-gradient(135deg,#4CAF72,#2E7D32)', boxShadow: '0 4px 16px rgba(76,175,114,0.30)' }}>
              {loading
                ? <Loader2 className="w-4 h-4 animate-spin" />
                : step === STEPS.length - 1
                  ? 'Save Member'
                  : <><span>Next</span><ChevronRight className="w-4 h-4" /></>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
