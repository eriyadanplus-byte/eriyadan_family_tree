'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import LineagePicker from '@/components/LineagePicker';
import RelationshipPreview from '@/components/RelationshipPreview';

interface Member { id: string; fullName: string; generation: number; gender?: string; }

const STEPS = ['Lineage', 'Identity', 'Profile', 'Review'];

export default function AddMemberForm() {
  const router = useRouter();
  const [step,    setStep]    = useState(0);
  const [error,   setError]   = useState('');
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    fullName: '', gender: '', dob: '', location: '', mobile: '', email: '',
    bio: '', current_role: '', company: '', fatherId: '', motherId: '', spouseId: '',
    generation: 1, isLate: false, dod: '',
  });
  const [anchor,      setAnchor]      = useState<Member | null>(null);
  const [relationType, setRelationType] = useState<'child' | 'spouse' | 'sibling'>('child');

  // Re-sync parent/spouse IDs whenever the anchor or relation type changes
  useEffect(() => {
    if (!anchor) return;
    if (relationType === 'child') {
      setForm(p => ({
        ...p,
        generation: anchor.generation + 1,
        fatherId: anchor.gender !== 'female' ? anchor.id : '',
        motherId: anchor.gender === 'female' ? anchor.id : '',
        spouseId: '',
      }));
    } else if (relationType === 'spouse') {
      setForm(p => ({ ...p, generation: anchor.generation, spouseId: anchor.id, fatherId: '', motherId: '' }));
    } else if (relationType === 'sibling') {
      setForm(p => ({ ...p, generation: anchor.generation, fatherId: '', motherId: '', spouseId: '' }));
    }
  }, [relationType, anchor]);

  const change = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setForm(p => ({ ...p, [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value }));
  };

  const onAnchorSelect = useCallback((member: Member | null) => {
    setAnchor(member);
    if (!member) return;
    if (relationType === 'child')   setForm(p => ({ ...p, generation: member.generation + 1, fatherId: member.gender !== 'female' ? member.id : '', motherId: member.gender === 'female' ? member.id : '' }));
    if (relationType === 'spouse')  setForm(p => ({ ...p, spouseId: member.id }));
    if (relationType === 'sibling') setForm(p => ({ ...p, generation: member.generation }));
  }, [relationType]);

  const next = () => {
    if (step === 0 && !anchor) { setError('Please select an ancestor or member to connect to.'); return; }
    setError(''); setStep(s => Math.min(s + 1, STEPS.length - 1));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (step < STEPS.length - 1) { next(); return; }
    setLoading(true);
    try {
      const res = await fetch('/api/members', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: form.fullName, mobileNumber: form.mobile, email: form.email || null,
          generation: form.generation, isLate: form.isLate, gender: form.gender || null,
          dob: form.dob || null, dod: form.isLate ? form.dod || null : null,
          location: form.location || null, bio: form.bio || null,
          current_role: form.current_role || null, company: form.company || null,
          fatherId: form.fatherId || null, motherId: form.motherId || null, spouseId: form.spouseId || null,
        }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error || 'Failed'); }
      router.push('/admin/members');
      router.refresh();
    } catch (err: any) { setError(err.message || 'An unexpected error occurred'); }
    finally { setLoading(false); }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="p-4 rounded-xl text-sm"
          style={{ background: 'rgba(239,83,80,0.10)', border: '1px solid rgba(239,83,80,0.20)', color: '#EF5350' }}>
          {error}
        </div>
      )}

      {/* Step indicators */}
      <div className="flex items-center gap-2 mb-6">
        {STEPS.map((label, i) => (
          <div key={label} className="flex items-center">
            <div className="flex items-center gap-1.5">
              <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all"
                style={i < step ? { background: 'rgba(76,175,114,0.20)', color: '#81C784' } :
                       i === step ? { background: '#4CAF72', color: '#fff' } :
                       { background: 'rgba(255,255,255,0.06)', color: 'rgba(232,245,233,0.30)' }}>
                {i < step ? '✓' : i + 1}
              </div>
              <span className="text-xs hidden sm:inline"
                style={{ color: i === step ? '#E8F5E9' : 'rgba(232,245,233,0.35)' }}>{label}</span>
            </div>
            {i < STEPS.length - 1 && (
              <div className="w-8 h-px ml-2"
                style={{ background: i < step ? 'rgba(76,175,114,0.50)' : 'rgba(255,255,255,0.08)' }} />
            )}
          </div>
        ))}
      </div>

      {/* Step 0 — Lineage */}
      {step === 0 && (
        <div className="space-y-5">
          <LineagePicker selectedAnchorId={anchor?.id || ''} selectedRelation={relationType}
            fatherId={form.fatherId} motherId={form.motherId}
            onAnchorSelect={onAnchorSelect} onRelationChange={setRelationType}
            onFatherSelect={id => setForm(p => ({ ...p, fatherId: id }))}
            onMotherSelect={id => setForm(p => ({ ...p, motherId: id }))} />
          {anchor && <RelationshipPreview anchorMember={anchor}
            newMemberName={form.fullName || 'New Member'} relationType={relationType}
            fatherId={form.fatherId} motherId={form.motherId} />}
        </div>
      )}

      {/* Step 1 — Identity */}
      {step === 1 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {(['fullName','mobile','email','location'] as const).map(k => (
            <div key={k}>
              <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5"
                style={{ color: 'rgba(232,245,233,0.45)' }}>
                {k === 'fullName' ? 'Full Name *' : k === 'mobile' ? 'Mobile *' : k.charAt(0).toUpperCase() + k.slice(1)}
              </label>
              <input name={k} value={form[k]} onChange={change}
                required={k === 'fullName' || k === 'mobile'}
                className="glass-input" />
            </div>
          ))}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5"
              style={{ color: 'rgba(232,245,233,0.45)' }}>Date of Birth</label>
            <input type="date" name="dob" value={form.dob} onChange={change} className="glass-input" />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5"
              style={{ color: 'rgba(232,245,233,0.45)' }}>Gender</label>
            <select name="gender" value={form.gender} onChange={change} className="glass-input">
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
              <input name="current_role" value={form.current_role} onChange={change}
                className="glass-input" placeholder="e.g. Engineer" />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5"
                style={{ color: 'rgba(232,245,233,0.45)' }}>Company</label>
              <input name="company" value={form.company} onChange={change}
                className="glass-input" placeholder="e.g. Acme Corp" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5"
              style={{ color: 'rgba(232,245,233,0.45)' }}>Bio</label>
            <textarea name="bio" value={form.bio} onChange={change} rows={3}
              className="glass-input min-h-[80px] resize-none" />
          </div>
          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" name="isLate" checked={form.isLate} onChange={change} className="w-4 h-4 rounded" />
            <span className="text-sm text-white">Mark as Deceased</span>
          </label>
          {form.isLate && (
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5"
                style={{ color: 'rgba(232,245,233,0.45)' }}>Date of Death</label>
              <input type="date" name="dod" value={form.dod} onChange={change} className="glass-input" />
            </div>
          )}
        </div>
      )}

      {/* Step 3 — Review */}
      {step === 3 && anchor && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl"
            style={{ background: 'rgba(76,175,114,0.06)', border: '1px solid rgba(76,175,114,0.18)' }}>
            <p className="text-sm text-white">
              Adding <strong style={{ color: '#81C784' }}>{form.fullName || 'New Member'}</strong> as{' '}
              <strong style={{ color: '#C8962E' }}>{relationType}</strong> of{' '}
              <strong>{anchor.fullName}</strong> — Gen {form.generation}
            </p>
          </div>
          <RelationshipPreview anchorMember={anchor} newMemberName={form.fullName || 'New Member'}
            relationType={relationType} fatherId={form.fatherId} motherId={form.motherId} />
        </div>
      )}

      {/* Navigation */}
      <div className="flex items-center justify-between pt-6"
        style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}>
        <button type="button" onClick={() => { setStep(s => Math.max(s - 1, 0)); setError(''); }}
          disabled={step === 0}
          className="btn-ghost px-5 py-2.5 flex items-center gap-2 disabled:opacity-30">
          <ChevronLeft className="w-4 h-4" /> Back
        </button>
        <button type="submit" disabled={loading}
          className="flex items-center gap-2 px-8 py-2.5 rounded-full font-bold text-white disabled:opacity-50 transition-all"
          style={{ background: 'linear-gradient(135deg,#4CAF72,#2E7D32)', boxShadow: '0 4px 16px rgba(76,175,114,0.30)' }}>
          {loading
            ? <Loader2 className="w-4 h-4 animate-spin" />
            : step === STEPS.length - 1
              ? 'Save Member'
              : <><span>Next</span><ChevronRight className="w-4 h-4" /></>}
        </button>
      </div>
    </form>
  );
}
