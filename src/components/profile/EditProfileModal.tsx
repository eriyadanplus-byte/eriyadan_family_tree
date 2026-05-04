'use client';

import { useState } from 'react';
import { X, Camera } from 'lucide-react';
import AvatarUpload from './AvatarUpload';

interface Member {
  id: string;
  fullName: string;
  mobileNumber?: string;
  email?: string;
  generation: number;
  isLate: boolean;
  role: string;
  bio?: string;
  gender?: string;
  dob?: string;
  dod?: string;
  location?: string;
  currentRole?: string;
  company?: string;
  instagram?: string;
  linkedin?: string;
  twitter?: string;
  facebook?: string;
  youtube?: string;
  whatsapp?: string;
  profilePhotoUrl?: string;
  avatarVersion?: number;
}

interface Props {
  member: Member;
  currentUserRole?: 'super_admin' | 'editor' | 'contributor' | 'viewer';
  onClose: () => void;
  onSaved: () => void;
}

export default function EditProfileModal({ member, currentUserRole, onClose, onSaved }: Props) {
  const [form, setForm] = useState<Member>({ ...member });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const update = (key: keyof Member, value: any) => {
    setForm(prev => ({ ...prev, [key]: value }));
  };

  const canMarkDeceased = ['super_admin', 'editor'].includes(currentUserRole || '');

  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      const res = await fetch(`/api/members/${member.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || 'Failed to save');
      }
      onSaved();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center p-4 overflow-y-auto">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-2xl glass-card rounded-3xl p-6 my-8">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-display text-white">Edit Profile</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/10">
            <X className="w-5 h-5 text-white/60" />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl text-sm bg-rose-500/10 border border-rose-500/20 text-rose-400">
            {error}
          </div>
        )}

        <div className="space-y-6">
          <div className="flex flex-col items-center gap-2">
            <AvatarUpload
              memberId={form.id}
              currentVersion={form.avatarVersion || 0}
              currentUrl={form.profilePhotoUrl || null}
              onUploaded={(v) => update('avatarVersion', v)}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs text-white/40">FULL NAME</label>
              <input type="text" value={form.fullName} onChange={e => update('fullName', e.target.value)}
                className="w-full h-10 rounded-xl glass-input px-4 text-white text-sm" />
            </div>
            <div className="space-y-2">
              <label className="text-xs text-white/40">MOBILE</label>
              <input type="text" value={form.mobileNumber || ''} onChange={e => update('mobileNumber', e.target.value)}
                className="w-full h-10 rounded-xl glass-input px-4 text-white text-sm" />
            </div>
            <div className="space-y-2">
              <label className="text-xs text-white/40">EMAIL</label>
              <input type="email" value={form.email || ''} onChange={e => update('email', e.target.value)}
                className="w-full h-10 rounded-xl glass-input px-4 text-white text-sm" />
            </div>
            <div className="space-y-2">
              <label className="text-xs text-white/40">GENDER</label>
              <select value={form.gender || ''} onChange={e => update('gender', e.target.value)}
                className="w-full h-10 rounded-xl glass-input px-4 text-white text-sm">
                <option value="">Select</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-xs text-white/40">DATE OF BIRTH</label>
              <input type="date" value={form.dob || ''} onChange={e => update('dob', e.target.value)}
                className="w-full h-10 rounded-xl glass-input px-4 text-white text-sm" />
            </div>
            <div className="space-y-2">
              <label className="text-xs text-white/40">LOCATION</label>
              <input type="text" value={form.location || ''} onChange={e => update('location', e.target.value)}
                className="w-full h-10 rounded-xl glass-input px-4 text-white text-sm" />
            </div>
            <div className="space-y-2">
              <label className="text-xs text-white/40">PROFESSION</label>
              <input type="text" value={form.currentRole || ''} onChange={e => update('currentRole', e.target.value)}
                className="w-full h-10 rounded-xl glass-input px-4 text-white text-sm" />
            </div>
            <div className="space-y-2">
              <label className="text-xs text-white/40">COMPANY</label>
              <input type="text" value={form.company || ''} onChange={e => update('company', e.target.value)}
                className="w-full h-10 rounded-xl glass-input px-4 text-white text-sm" />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs text-white/40">BIO</label>
            <textarea value={form.bio || ''} rows={3} onChange={e => update('bio', e.target.value)}
              className="w-full rounded-xl glass-input px-4 text-white text-sm min-h-[80px] resize-none" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs text-white/40">INSTAGRAM</label>
              <input type="text" value={form.instagram || ''} onChange={e => update('instagram', e.target.value)}
                className="w-full h-10 rounded-xl glass-input px-4 text-white text-sm" />
            </div>
            <div className="space-y-2">
              <label className="text-xs text-white/40">LINKEDIN</label>
              <input type="text" value={form.linkedin || ''} onChange={e => update('linkedin', e.target.value)}
                className="w-full h-10 rounded-xl glass-input px-4 text-white text-sm" />
            </div>
            <div className="space-y-2">
              <label className="text-xs text-white/40">TWITTER / X</label>
              <input type="text" value={form.twitter || ''} onChange={e => update('twitter', e.target.value)}
                className="w-full h-10 rounded-xl glass-input px-4 text-white text-sm" />
            </div>
            <div className="space-y-2">
              <label className="text-xs text-white/40">FACEBOOK</label>
              <input type="text" value={form.facebook || ''} onChange={e => update('facebook', e.target.value)}
                className="w-full h-10 rounded-xl glass-input px-4 text-white text-sm" />
            </div>
            <div className="space-y-2">
              <label className="text-xs text-white/40">YOUTUBE</label>
              <input type="text" value={form.youtube || ''} onChange={e => update('youtube', e.target.value)}
                className="w-full h-10 rounded-xl glass-input px-4 text-white text-sm" />
            </div>
            <div className="space-y-2">
              <label className="text-xs text-white/40">WHATSAPP</label>
              <input type="text" value={form.whatsapp || ''} onChange={e => update('whatsapp', e.target.value)}
                className="w-full h-10 rounded-xl glass-input px-4 text-white text-sm" />
            </div>
          </div>

          {canMarkDeceased ? (
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={form.isLate} onChange={e => update('isLate', e.target.checked)}
                  className="w-4 h-4 rounded" />
                <span className="text-white text-sm">Mark as Deceased</span>
              </label>
              {form.isLate && (
                <div className="flex-1">
                  <label className="text-xs text-white/40 block mb-1">DATE OF DEATH</label>
                  <input type="date" value={form.dod || ''} onChange={e => update('dod', e.target.value)}
                    className="w-full h-10 rounded-xl glass-input px-4 text-white text-sm" />
                </div>
              )}
            </div>
          ) : form.isLate ? (
            <div className="text-rose-400 text-sm font-medium">Deceased Member</div>
          ) : null}
        </div>

        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl glass text-white hover:bg-white/10 transition-all">
            Cancel
          </button>
          <button onClick={handleSave} disabled={saving}
            className="flex-1 py-2.5 rounded-xl bg-purple-500 text-white hover:bg-purple-600 transition-all disabled:opacity-50">
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}
