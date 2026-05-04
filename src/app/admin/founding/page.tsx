'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Loader2, Plus, TreeDeciduous, AlertCircle, Trash2, ChevronRight, Camera } from 'lucide-react';
import { uploadAvatar } from '@/lib/image';

interface CreatedMember {
  id: string;
  fullName: string;
  gender?: string;
  photoUploaded?: boolean;
  spouseId?: string;
}

interface MemberForm {
  fullName: string;
  mobileNumber: string;
  email: string;
  gender: '' | 'male' | 'female' | 'other';
  dob: string;
  dod: string;
  location: string;
  bio: string;
  isLate: boolean;
  parentId: string;
  addSpouse: boolean;
  spouseName: string;
  spouseMobile: string;
  spouseGender: '' | 'male' | 'female' | 'other';
  spouseIsLate: boolean;
  spouseDob: string;
  spouseDod: string;
  photoFile: File | null;
  photoPreview: string;
  spousePhotoFile: File | null;
  spousePhotoPreview: string;
  spouseGenderTouched: boolean;
}

const emptyMember = (): MemberForm => ({
  fullName: '', mobileNumber: '', email: '', gender: '', dob: '', dod: '',
  location: '', bio: '', isLate: false, parentId: '',
  addSpouse: false, spouseName: '', spouseMobile: '', spouseGender: '',
  spouseIsLate: false, spouseDob: '', spouseDod: '',
  photoFile: null, photoPreview: '',
  spousePhotoFile: null, spousePhotoPreview: '',
  spouseGenderTouched: false,
});

  const oppositeGender = (g: string): '' | 'male' | 'female' => {
    if (g === 'male') return 'female';
    if (g === 'female') return 'male';
    return '';
  };

  const getSpousePeggedParents = (parentOptions: CreatedMember[], createdMap: Record<string, CreatedMember>): CreatedMember[] => {
    const pegged: CreatedMember[] = [];
    const seen = new Set<string>();
    parentOptions.forEach(p => {
      if (seen.has(p.id)) return;
      seen.add(p.id);
      pegged.push(p);
      const spouse = parentOptions.find(o => o.id !== p.id && createdMap[o.id]?.spouseId === p.id);
      if (spouse && !seen.has(spouse.id)) {
        pegged.push(spouse);
        seen.add(spouse.id);
      }
    });
    return pegged;
  };

function safeJson(res: Response) {
  return res.json().catch(() => ({}));
}

function PhotoPicker({ preview, inputId, onFile }: { preview: string; inputId: string; onFile: (file: File) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  return (
    <div className="flex flex-col items-center gap-1">
      <div
        className="relative w-20 h-20 rounded-full overflow-hidden border-2 border-white/10 bg-white/5 cursor-pointer group"
        onClick={() => inputRef.current?.click()}
      >
        {preview ? (
          <img src={preview} alt="Preview" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-white/30">
            <Camera className="w-7 h-7" />
          </div>
        )}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <Camera className="w-5 h-5 text-white" />
        </div>
      </div>
      <input
        ref={inputRef}
        id={inputId}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={e => {
          const file = e.target.files?.[0];
          if (file) onFile(file);
        }}
      />
      <span className="text-[10px] text-white/40">{preview ? 'Change' : 'Add photo'}</span>
    </div>
  );
}

export default function GenerationSeedPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [gen1, setGen1] = useState<CreatedMember[]>([]);
  const [gen2, setGen2] = useState<CreatedMember[]>([]);
  const [gen1Forms, setGen1Forms] = useState<MemberForm[]>([emptyMember()]);
  const [gen2Forms, setGen2Forms] = useState<MemberForm[]>([emptyMember()]);
  const [gen3Forms, setGen3Forms] = useState<MemberForm[]>([emptyMember()]);
  const [gen1Locked, setGen1Locked] = useState(false);
  const [loadingIds, setLoadingIds] = useState<Set<string>>(new Set());
  const [error, setError] = useState('');
  const [createdMap, setCreatedMap] = useState<Record<string, CreatedMember>>({});

  // On mount: if Gen 1 members already exist in DB, lock Gen 1 tab
  useEffect(() => {
    fetch('/api/members?generation=1&limit=1')
      .then(r => r.ok ? r.json() : [])
      .then((data: any[]) => {
        if (data.length > 0) {
          setGen1Locked(true);
          setGen1(data.map((m: any) => ({ id: String(m.id), fullName: m.fullName, gender: m.gender })));
        }
      })
      .catch(() => {});
  }, []);

  const updateForm = (forms: MemberForm[], setForms: (f: MemberForm[]) => void, idx: number, patch: Partial<MemberForm>) => {
    const next = [...forms];
    next[idx] = { ...next[idx], ...patch };
    setForms(next);
  };

  const addRow = (forms: MemberForm[], setForms: (f: MemberForm[]) => void) => {
    setForms([...forms, emptyMember()]);
  };

  const removeRow = (forms: MemberForm[], setForms: (f: MemberForm[]) => void, idx: number) => {
    if (forms.length <= 1) return;
    setForms(forms.filter((_, i) => i !== idx));
  };

  const createMember = async (body: any, setCreated: (m: CreatedMember) => void, generation: number) => {
    setError('');
    const res = await fetch('/api/members', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...body, createdVia: 'generation_seed' }),
    });
    if (!res.ok) {
      const d = await safeJson(res);
      throw new Error(d.error || 'Failed to create member');
    }
    const data = await safeJson(res);
    const m: CreatedMember = { id: data.id || data.insertId, fullName: body.fullName, gender: body.gender };
    setCreated(m);
    setCreatedMap(prev => ({ ...prev, [m.id]: { ...m, spouseId: body.spouseId } }));
    return m;
  };

  const linkSpouses = async (aId: string, bId: string) => {
    const res = await fetch('/api/admin/spouses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ memberAId: aId, memberBId: bId }),
    });
    if (!res.ok) throw new Error('Failed to link spouses');
  };

  const tryUploadPhoto = async (memberId: string, file: File | null) => {
    if (!file) return;
    try {
      await uploadAvatar(memberId, file);
      setCreatedMap(prev => {
        const entry = prev[memberId];
        if (!entry) return prev;
        return { ...prev, [memberId]: { ...entry, photoUploaded: true } };
      });
    } catch (err) {
      console.error('Photo upload failed for', memberId, err);
    }
  };

  const handleCreateGen1 = async (shouldAdvance: boolean = false) => {
    setError('');
    const f = gen1Forms[0];
    if (!f.fullName.trim()) { setError('Founder full name is required'); return; }
    if (!f.mobileNumber.trim() && !f.isLate) { setError('Mobile number is required for living members'); return; }

    setLoadingIds(s => new Set(s).add('gen1'));
    try {
      const founder = await createMember({
        fullName: f.fullName, mobileNumber: f.mobileNumber, email: f.email || null,
        gender: f.gender || null, dob: f.dob || null, dod: f.dod || null,
        location: f.location || null, bio: f.bio || null,
        isLate: f.isLate, generation: 1, allowRoot: true,
      }, m => setGen1(prev => [...prev, m]), 1);
      setCreatedMap(prev => ({ ...prev, [founder.id]: founder }));
      await tryUploadPhoto(founder.id, f.photoFile);

      if (f.addSpouse && f.spouseName.trim()) {
        if (!f.spouseMobile.trim() && !f.spouseIsLate) throw new Error('Spouse mobile is required for living members');
        const spouse = await createMember({
          fullName: f.spouseName, mobileNumber: f.spouseMobile,
          gender: f.spouseGender || null, dob: f.spouseDob || null, dod: f.spouseDod || null,
          isLate: f.spouseIsLate, generation: 1, allowRoot: true,
        }, m => setGen1(prev => [...prev, m]), 1);
        setCreatedMap(prev => ({ ...prev, [spouse.id]: spouse }));
        await tryUploadPhoto(spouse.id, f.spousePhotoFile);
        try {
          await linkSpouses(founder.id, spouse.id);
        } catch (linkErr: any) {
          setError(`Both members created, but spouse linking failed: ${linkErr.message || 'Unknown error'}. You can link them later from the member's page.`);
        }
      }

      setGen1Locked(true);
      if (shouldAdvance) {
        setStep(2);
        setGen2Forms([emptyMember()]);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoadingIds(s => { const n = new Set(s); n.delete('gen1'); return n; });
    }
  };

  const handleGen1Submit = (e: React.FormEvent) => {
    e.preventDefault();
    handleCreateGen1(false);
  };

  const handleCreateGen2 = async (shouldAdvance: boolean = false) => {
    setError('');
    for (let i = 0; i < gen2Forms.length; i++) {
      const f = gen2Forms[i];
      if (!f.fullName.trim()) continue;
      if (!f.mobileNumber.trim() && !f.isLate) { setError(`Gen 2 row ${i + 1}: mobile is required for living members`); return; }
      if (!f.parentId) { setError(`Gen 2 row ${i + 1}: select a parent`); return; }
    }

    const validForms = gen2Forms.filter(f => f.fullName.trim());
    if (validForms.length === 0) { setError('Add at least one Gen 2 member or skip'); return; }

    setLoadingIds(s => new Set(s).add('gen2'));
    try {
      for (const f of validForms) {
        const parent = gen1.find(g => g.id === f.parentId);
        const isFather = parent?.gender === 'male';
        const member = await createMember({
          fullName: f.fullName, mobileNumber: f.mobileNumber, email: f.email || null,
          gender: f.gender || null, dob: f.dob || null, dod: f.dod || null,
          location: f.location || null, bio: f.bio || null,
          isLate: f.isLate, generation: 2,
          ...(isFather ? { fatherId: f.parentId } : { motherId: f.parentId }),
        }, m => setGen2(prev => [...prev, m]), 2);
        setCreatedMap(prev => ({ ...prev, [member.id]: member }));
        await tryUploadPhoto(member.id, f.photoFile);

        if (f.addSpouse && f.spouseName.trim()) {
          if (!f.spouseMobile.trim() && !f.spouseIsLate) throw new Error(`Spouse mobile required for ${f.fullName}`);
          const spouse = await createMember({
            fullName: f.spouseName, mobileNumber: f.spouseMobile,
            gender: f.spouseGender || null, dob: f.spouseDob || null, dod: f.spouseDod || null,
            isLate: f.spouseIsLate, generation: 2,
          }, m => setGen2(prev => [...prev, m]), 2);
          setCreatedMap(prev => ({ ...prev, [spouse.id]: spouse }));
          await tryUploadPhoto(spouse.id, f.spousePhotoFile);
          try {
            await linkSpouses(member.id, spouse.id);
          } catch (linkErr: any) {
            setError(`Both members created, but spouse linking failed: ${linkErr.message || 'Unknown error'}. You can link them later from the member's page.`);
          }
        }
      }
      if (shouldAdvance) {
        setStep(3);
        setGen3Forms([emptyMember()]);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoadingIds(s => { const n = new Set(s); n.delete('gen2'); return n; });
    }
  };

  const handleCreateGen3 = async (shouldAdvance: boolean = false) => {
    setError('');
    for (let i = 0; i < gen3Forms.length; i++) {
      const f = gen3Forms[i];
      if (!f.fullName.trim()) continue;
      if (!f.mobileNumber.trim() && !f.isLate) { setError(`Gen 3 row ${i + 1}: mobile is required for living members`); return; }
      if (!f.parentId) { setError(`Gen 3 row ${i + 1}: select a parent`); return; }
    }

    const validForms = gen3Forms.filter(f => f.fullName.trim());
    if (validForms.length === 0) { setError('Add at least one Gen 3 member or skip'); return; }

    setLoadingIds(s => new Set(s).add('gen3'));
    try {
      for (const f of validForms) {
        const parent = gen2.find(g => g.id === f.parentId);
        const isFather = parent?.gender === 'male';
        const member = await createMember({
          fullName: f.fullName, mobileNumber: f.mobileNumber, email: f.email || null,
          gender: f.gender || null, dob: f.dob || null, dod: f.dod || null,
          location: f.location || null, bio: f.bio || null,
          isLate: f.isLate, generation: 3,
          ...(isFather ? { fatherId: f.parentId } : { motherId: f.parentId }),
        }, m => setGen2(prev => [...prev, m]), 3);
        setCreatedMap(prev => ({ ...prev, [member.id]: member }));
        await tryUploadPhoto(member.id, f.photoFile);

        if (f.addSpouse && f.spouseName.trim()) {
          if (!f.spouseMobile.trim() && !f.spouseIsLate) throw new Error(`Spouse mobile required for ${f.fullName}`);
          const spouse = await createMember({
            fullName: f.spouseName, mobileNumber: f.spouseMobile,
            gender: f.spouseGender || null, dob: f.spouseDob || null, dod: f.spouseDod || null,
            isLate: f.spouseIsLate, generation: 3,
          }, m => setGen2(prev => [...prev, m]), 3);
          setCreatedMap(prev => ({ ...prev, [spouse.id]: spouse }));
          await tryUploadPhoto(spouse.id, f.spousePhotoFile);
          try {
            await linkSpouses(member.id, spouse.id);
          } catch (linkErr: any) {
            setError(`Both members created, but spouse linking failed: ${linkErr.message || 'Unknown error'}. You can link them later from the member's page.`);
          }
        }
      }
      if (shouldAdvance) {
        router.push('/tree');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoadingIds(s => { const n = new Set(s); n.delete('gen3'); return n; });
    }
  };

  const handlePhotoSelect = (forms: MemberForm[], setForms: (f: MemberForm[]) => void, idx: number, field: 'photoFile' | 'spousePhotoFile', file: File) => {
    const previewField = field === 'photoFile' ? 'photoPreview' : 'spousePhotoPreview';
    const previewUrl = URL.createObjectURL(file);
    updateForm(forms, setForms, idx, { [field]: file, [previewField]: previewUrl });
  };

  const renderMemberFields = (form: MemberForm, idx: number, update: (patch: Partial<MemberForm>) => void, generation: number, parentOptions: CreatedMember[], formsArr: MemberForm[], setFormsArr: (f: MemberForm[]) => void) => (
    <div className="glass-card p-5 rounded-2xl space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-bold text-white uppercase tracking-wider">Gen {generation} Member {idx + 1}</h4>
        {generation > 1 && (
          <button onClick={() => removeRow(formsArr, setFormsArr, idx)}
            className="p-1.5 rounded-lg hover:bg-rose-500/20 text-white/40 hover:text-rose-400 transition-colors">
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Photo + Name row */}
      <div className="flex items-start gap-4">
        <PhotoPicker preview={form.photoPreview} inputId={`photo-${generation}-${idx}`} onFile={file => handlePhotoSelect(formsArr, setFormsArr, idx, 'photoFile', file)} />
        <div className="flex-1">
          <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'rgba(232,245,233,0.45)' }}>Full Name *</label>
          <input value={form.fullName} onChange={e => update({ fullName: e.target.value })} required className="glass-input w-full" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'rgba(232,245,233,0.45)' }}>
            Mobile Number {form.isLate ? '' : '*'}
          </label>
          <input value={form.mobileNumber} onChange={e => update({ mobileNumber: e.target.value })} required={!form.isLate} className="glass-input" />
        </div>
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'rgba(232,245,233,0.45)' }}>Email</label>
          <input type="email" value={form.email} onChange={e => update({ email: e.target.value })} className="glass-input" placeholder="optional" />
        </div>
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'rgba(232,245,233,0.45)' }}>Gender</label>
          <select value={form.gender} onChange={e => {
            const newGender = e.target.value as MemberForm['gender'];
            const patch: Partial<MemberForm> = { gender: newGender };
            if (form.addSpouse && !form.spouseGenderTouched) {
              patch.spouseGender = oppositeGender(newGender);
            }
            update(patch);
          }} className="glass-input">
            <option value="">Select</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'rgba(232,245,233,0.45)' }}>Date of Birth</label>
          <input type="date" value={form.dob} onChange={e => update({ dob: e.target.value })} className="glass-input" />
        </div>
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'rgba(232,245,233,0.45)' }}>Location</label>
          <input value={form.location} onChange={e => update({ location: e.target.value })} className="glass-input" placeholder="e.g. Dubai" />
        </div>
      </div>
      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'rgba(232,245,233,0.45)' }}>Bio</label>
        <textarea value={form.bio} onChange={e => update({ bio: e.target.value })} rows={2} className="glass-input min-h-[60px] resize-none" placeholder="Short biography..." />
      </div>
      <div className="flex items-center gap-4">
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={form.isLate} onChange={e => update({ isLate: e.target.checked })} className="w-4 h-4 rounded" />
          <span className="text-sm text-white">Deceased</span>
        </label>
        {form.isLate && (
          <div className="flex-1">
            <label className="text-xs text-white/40 block mb-1">Date of Death</label>
            <input type="date" value={form.dod} onChange={e => update({ dod: e.target.value })} className="glass-input" />
          </div>
        )}
      </div>
      {generation > 1 && (
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'rgba(232,245,233,0.45)' }}>Parent (Gen {generation - 1}) *</label>
          <select value={form.parentId} onChange={e => update({ parentId: e.target.value })} required className="glass-input">
            <option value="">Select parent</option>
            {getSpousePeggedParents(parentOptions, createdMap).map(p => (
              <option key={p.id} value={p.id}>{p.fullName}{p.spouseId ? ' (with spouse)' : ''}</option>
            ))}
          </select>
        </div>
      )}
      <label className="flex items-center gap-3 cursor-pointer">
        <input type="checkbox" checked={form.addSpouse} onChange={e => {
          const checked = e.target.checked;
          const patch: Partial<MemberForm> = { addSpouse: checked };
          if (checked && !form.spouseGenderTouched) {
            patch.spouseGender = oppositeGender(form.gender);
          }
          update(patch);
        }} className="w-4 h-4 rounded" />
        <span className="text-sm text-white font-medium">Add spouse</span>
      </label>
      {form.addSpouse && (
        <div className="space-y-4 pt-2 border-t border-white/5">
          {/* Spouse photo + name */}
          <div className="flex items-start gap-4">
            <PhotoPicker preview={form.spousePhotoPreview} inputId={`spouse-photo-${generation}-${idx}`} onFile={file => handlePhotoSelect(formsArr, setFormsArr, idx, 'spousePhotoFile', file)} />
            <div className="flex-1">
              <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'rgba(232,245,233,0.45)' }}>Spouse Name *</label>
              <input value={form.spouseName} onChange={e => update({ spouseName: e.target.value })} required={form.addSpouse} className="glass-input w-full" />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'rgba(232,245,233,0.45)' }}>
                Spouse Mobile {form.spouseIsLate ? '' : '*'}
              </label>
              <input value={form.spouseMobile} onChange={e => update({ spouseMobile: e.target.value })} required={!form.spouseIsLate} className="glass-input" />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'rgba(232,245,233,0.45)' }}>Spouse Gender</label>
              <select value={form.spouseGender} onChange={e => {
                update({ spouseGender: e.target.value as MemberForm['spouseGender'], spouseGenderTouched: true });
              }} className="glass-input">
                <option value="">Select</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'rgba(232,245,233,0.45)' }}>Spouse Date of Birth</label>
              <input type="date" value={form.spouseDob} onChange={e => update({ spouseDob: e.target.value })} className="glass-input" />
            </div>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.spouseIsLate} onChange={e => update({ spouseIsLate: e.target.checked })} className="w-4 h-4 rounded" />
                <span className="text-sm text-white">Deceased</span>
              </label>
              {form.spouseIsLate && (
                <div className="flex-1">
                  <label className="text-xs text-white/40 block mb-1">Date of Death</label>
                  <input type="date" value={form.spouseDod} onChange={e => update({ spouseDod: e.target.value })} className="glass-input" />
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-3xl mx-auto">
      <Link href="/admin" className="flex items-center gap-2 text-white/40 hover:text-white text-sm mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to Dashboard
      </Link>

      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ background: 'rgba(200,150,46,0.12)', border: '1px solid rgba(200,150,46,0.22)' }}>
          <TreeDeciduous className="w-5 h-5" style={{ color: '#E6B84A' }} />
        </div>
        <div>
          <h2 className="text-2xl font-display text-white">Generation Seed</h2>
          <p className="text-xs" style={{ color: 'rgba(232,245,233,0.45)' }}>
            Manually input the first 3 generations to start the tree
          </p>
        </div>
      </div>

      {/* Stepper */}
      <div className="flex items-center gap-2 mb-8">
        {[1, 2, 3].map(s => (
          <div key={s} className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
              step >= s ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'bg-white/5 text-white/30 border border-white/10'
            }`}>
              {s}
            </div>
            <span className={`text-xs uppercase tracking-wider ${step >= s ? 'text-white' : 'text-white/30'}`}>
              Gen {s}
            </span>
            {s < 3 && <ChevronRight className="w-4 h-4 text-white/20" />}
          </div>
        ))}
      </div>

      {error && (
        <div className="flex items-center gap-3 p-4 rounded-xl text-sm mb-6"
          style={{ background: 'rgba(239,83,80,0.10)', border: '1px solid rgba(239,83,80,0.20)', color: '#EF5350' }}>
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Step 1: Gen 1 */}
      {step === 1 && (
        <div className="space-y-6">
          {gen1Locked && gen1.length > 0 ? (
            <div className="glass-card p-5 rounded-2xl space-y-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h4 className="text-sm font-bold text-white uppercase tracking-wider">Gen 1 Founder</h4>
                  <p className="text-xs text-white/50 mt-1">Gen 1 inputs are locked after creation. Edit details from the founder profile if needed.</p>
                </div>
                <Link
                  href={`/profile/${gen1[0].id}`}
                  className="px-4 py-2 rounded-xl bg-purple-500 text-white text-sm font-medium hover:bg-purple-600 transition-all"
                >
                  View Founder
                </Link>
              </div>

              <div className="grid gap-3">
                {gen1.map((member) => (
                  <Link
                    key={member.id}
                    href={`/profile/${member.id}`}
                    className="glass-card p-4 rounded-2xl border border-white/10 hover:border-emerald-400/30 transition-all"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="font-semibold text-white">{member.fullName}</p>
                        <p className="text-[11px] text-white/50">Gen 1 · {member.gender ? member.gender : 'Unknown'}</p>
                      </div>
                      <span className="text-[11px] uppercase tracking-[0.18em] text-emerald-300">Founder</span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          ) : (
            renderMemberFields(gen1Forms[0], 0, patch => updateForm(gen1Forms, setGen1Forms, 0, patch), 1, [], gen1Forms, setGen1Forms)
          )}

          <div className="flex flex-col gap-3 sm:flex-row">
            <Link href="/admin" className="flex-1 py-3 rounded-xl glass text-white text-sm font-medium text-center hover:bg-white/10 transition-all">
              Cancel
            </Link>
            <button onClick={() => handleCreateGen1(false)} disabled={loadingIds.has('gen1') || gen1Locked}
              className="flex-1 py-3 rounded-xl bg-white/10 text-white text-sm font-medium flex items-center justify-center gap-2 hover:bg-white/20 transition-all disabled:opacity-50">
              {loadingIds.has('gen1') ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              Save Gen 1
            </button>
            <button onClick={() => handleCreateGen1(true)} disabled={loadingIds.has('gen1') || gen1Locked}
              className="flex-1 py-3 rounded-xl bg-purple-500 text-white text-sm font-medium flex items-center justify-center gap-2 hover:bg-purple-600 transition-all disabled:opacity-50">
              {loadingIds.has('gen1') ? <Loader2 className="w-4 h-4 animate-spin" /> : <ChevronRight className="w-4 h-4" />}
              Save & Continue
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Gen 2 */}
      {step === 2 && (
        <div className="space-y-6">
          {gen2Forms.map((form, idx) => renderMemberFields(form, idx, patch => updateForm(gen2Forms, setGen2Forms, idx, patch), 2, gen1, gen2Forms, setGen2Forms))}
          <button onClick={() => addRow(gen2Forms, setGen2Forms)}
            className="w-full py-3 rounded-xl glass text-white text-sm font-medium flex items-center justify-center gap-2 hover:bg-white/10 transition-all border-dashed border-white/10">
            <Plus className="w-4 h-4" /> Add Another Gen 2 Member
          </button>
          <div className="flex gap-3">
            <button onClick={() => setStep(1)}
              className="flex-1 py-3 rounded-xl glass text-white text-sm font-medium hover:bg-white/10 transition-all">
              Back
            </button>
            <button onClick={() => handleCreateGen2(false)} disabled={loadingIds.has('gen2')}
              className="flex-1 py-3 rounded-xl bg-white/10 text-white text-sm font-medium flex items-center justify-center gap-2 hover:bg-white/20 transition-all disabled:opacity-50">
              {loadingIds.has('gen2') ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              Save Gen 2
            </button>
            <button onClick={() => handleCreateGen2(true)} disabled={loadingIds.has('gen2')}
              className="flex-1 py-3 rounded-xl bg-purple-500 text-white text-sm font-medium flex items-center justify-center gap-2 hover:bg-purple-600 transition-all disabled:opacity-50">
              {loadingIds.has('gen2') ? <Loader2 className="w-4 h-4 animate-spin" /> : <ChevronRight className="w-4 h-4" />}
              Save & Continue
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Gen 3 */}
      {step === 3 && (
        <div className="space-y-6">
          {gen3Forms.map((form, idx) => renderMemberFields(form, idx, patch => updateForm(gen3Forms, setGen3Forms, idx, patch), 3, gen2, gen3Forms, setGen3Forms))}
          <button onClick={() => addRow(gen3Forms, setGen3Forms)}
            className="w-full py-3 rounded-xl glass text-white text-sm font-medium flex items-center justify-center gap-2 hover:bg-white/10 transition-all border-dashed border-white/10">
            <Plus className="w-4 h-4" /> Add Another Gen 3 Member
          </button>
          <div className="flex gap-3">
            <button onClick={() => setStep(2)}
              className="flex-1 py-3 rounded-xl glass text-white text-sm font-medium hover:bg-white/10 transition-all">
              Back
            </button>
            <button onClick={() => handleCreateGen3(false)} disabled={loadingIds.has('gen3')}
              className="flex-1 py-3 rounded-xl bg-white/10 text-white text-sm font-medium flex items-center justify-center gap-2 hover:bg-white/20 transition-all disabled:opacity-50">
              {loadingIds.has('gen3') ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              Save Gen 3
            </button>
            <button onClick={() => handleCreateGen3(true)} disabled={loadingIds.has('gen3')}
              className="flex-1 py-3 rounded-xl bg-purple-500 text-white text-sm font-medium flex items-center justify-center gap-2 hover:bg-purple-600 transition-all disabled:opacity-50">
              {loadingIds.has('gen3') ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              Finish & View Tree
            </button>
          </div>
        </div>
      )}

      {/* Created Generations Summary */}
      {Object.keys(createdMap).length > 0 && (
        <div className="mt-10 space-y-4">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">Created Generations</h3>
          <p className="text-xs text-white/40">You can edit member details or delete members before finishing setup.</p>
          <div className="space-y-3">
            {[1, 2, 3].map(gen => {
              const members = Object.values(createdMap).filter(m => {
                const memberData = gen1.includes(m) ? 1 : gen2.includes(m) ? 2 : 3;
                return memberData === gen;
              });
              if (members.length === 0) return null;
              return (
                <div key={gen} className="glass-card p-4 rounded-xl">
                  <h4 className="text-xs font-bold text-white/60 uppercase mb-2">Gen {gen}</h4>
                  <div className="flex flex-wrap gap-2">
                    {members.map(m => (
                      <Link
                        key={m.id}
                        href={`/profile/${m.id}`}
                        className="px-3 py-1.5 rounded-lg bg-white/5 text-xs text-white/80 hover:bg-white/10 transition-all"
                      >
                        {m.fullName} {m.gender ? `(${m.gender})` : ''}
                      </Link>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
          <div className="flex gap-3">
            <Link
              href="/tree"
              className="flex-1 py-3 rounded-xl bg-purple-500 text-white text-sm font-medium flex items-center justify-center gap-2 hover:bg-purple-600 transition-all"
            >
              <TreeDeciduous className="w-4 h-4" />
              View Tree
            </Link>
          </div>
        </div>
      )}

      {/* Created members needing photo upload */}
      {Object.values(createdMap).some(m => !m.photoUploaded) && (
        <div className="mt-10 space-y-3">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">Photos Pending</h3>
          <p className="text-xs text-white/40">These members did not get a photo during creation. Use the All Members page to add one later.</p>
          <div className="flex flex-wrap gap-2">
            {Object.values(createdMap).filter(m => !m.photoUploaded).map(m => (
              <span key={m.id} className="px-3 py-1.5 rounded-lg glass text-xs text-white/60">{m.fullName}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

