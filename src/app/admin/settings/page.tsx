'use client';

import { useState, useEffect } from 'react';
import {
  Shield, Loader2, Save, Globe, Database, Bell, CheckCircle, AlertCircle, MessageSquare, Lock, Eye, EyeOff
} from 'lucide-react';

export default function AdminSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'ok' | 'error'>('idle');
  const [saveError, setSaveError] = useState('');
  const [siteName, setSiteName] = useState("Eriyadan's Legacy");
  const [allowRegistration, setAllowRegistration] = useState(false);
  const [requireApproval, setRequireApproval] = useState(true);
  const [notifications, setNotifications] = useState(true);
  const [inAppMessage, setInAppMessage] = useState('');

  // Password change
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [pwSaveStatus, setPwSaveStatus] = useState<'idle' | 'saving' | 'ok' | 'error'>('idle');
  const [pwSaveError, setPwSaveError] = useState('');

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      const res = await fetch('/api/admin/config');
      if (res.ok) {
        const data = await res.json();
        setSiteName(data.siteName || "Eriyadan's Legacy");
        setAllowRegistration(data.allowRegistration ?? false);
        setRequireApproval(data.requireApproval ?? true);
        setNotifications(data.notifications ?? true);
        setInAppMessage(data.inAppMessage || '');
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaveStatus('saving');
    setSaveError('');
    try {
      const res = await fetch('/api/admin/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ siteName, allowRegistration, requireApproval, notifications, inAppMessage }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || 'Failed to save settings');
      }
      setSaveStatus('ok');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch (err: any) {
      setSaveError(err.message || 'Failed to save settings');
      setSaveStatus('error');
    }
  };

  const handleChangePassword = async () => {
    setPwSaveStatus('saving');
    setPwSaveError('');
    if (newPw.length < 8) {
      setPwSaveError('New password must be at least 8 characters.');
      setPwSaveStatus('error');
      return;
    }
    if (newPw !== confirmPw) {
      setPwSaveError('Passwords do not match.');
      setPwSaveStatus('error');
      return;
    }
    try {
      const res = await fetch('/api/admin/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword: currentPw, newPassword: newPw }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || 'Failed to change password');
      }
      setPwSaveStatus('ok');
      setCurrentPw('');
      setNewPw('');
      setConfirmPw('');
      setTimeout(() => setPwSaveStatus('idle'), 3000);
    } catch (err: any) {
      setPwSaveError(err.message || 'Failed to change password');
      setPwSaveStatus('error');
    }
  };

  return (
    <div className="p-8 lg:p-12">
        <header className="mb-8">
          <h2 className="text-3xl font-display text-white">Admin Settings</h2>
          <p className="text-on-surface-variant text-sm">Configure your family tree application</p>
        </header>

        {saveStatus === 'ok' && (
          <div className="mb-6 flex items-center gap-3 p-4 rounded-xl"
            style={{ background: 'rgba(76,175,114,0.10)', border: '1px solid rgba(76,175,114,0.25)', color: '#81C784' }}>
            <CheckCircle className="w-4 h-4 flex-shrink-0" />
            <span className="text-sm">Settings saved successfully.</span>
          </div>
        )}

        {saveStatus === 'error' && (
          <div className="mb-6 flex items-center gap-3 p-4 rounded-xl"
            style={{ background: 'rgba(239,83,80,0.10)', border: '1px solid rgba(239,83,80,0.20)', color: '#EF5350' }}>
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span className="text-sm">{saveError}</span>
          </div>
        )}

        <div className="space-y-6 max-w-2xl">
          {/* Account Security */}
          <div className="glass-card p-6 rounded-2xl">
            <div className="flex items-center gap-3 mb-6">
              <Lock className="w-5 h-5 text-emerald-400" />
              <h3 className="text-lg font-display text-white">Account Security</h3>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs text-white/40 uppercase">Current Password</label>
                <div className="relative">
                  <input
                    type={showCurrentPw ? 'text' : 'password'}
                    value={currentPw}
                    onChange={e => setCurrentPw(e.target.value)}
                    className="w-full h-10 rounded-xl glass-input px-4 pr-12 text-white text-sm"
                    placeholder="Enter current password"
                  />
                  <button type="button" onClick={() => setShowCurrentPw(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1" style={{ color: 'rgba(232,245,233,0.35)' }}>
                    {showCurrentPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs text-white/40 uppercase">New Password</label>
                <div className="relative">
                  <input
                    type={showNewPw ? 'text' : 'password'}
                    value={newPw}
                    onChange={e => setNewPw(e.target.value)}
                    className="w-full h-10 rounded-xl glass-input px-4 pr-12 text-white text-sm"
                    placeholder="Min 8 characters"
                  />
                  <button type="button" onClick={() => setShowNewPw(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1" style={{ color: 'rgba(232,245,233,0.35)' }}>
                    {showNewPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs text-white/40 uppercase">Confirm New Password</label>
                <input
                  type="password"
                  value={confirmPw}
                  onChange={e => setConfirmPw(e.target.value)}
                  className="w-full h-10 rounded-xl glass-input px-4 text-white text-sm"
                  placeholder="Re-enter new password"
                />
              </div>

              {pwSaveStatus === 'error' && (
                <div className="flex items-center gap-3 p-3 rounded-xl text-sm"
                  style={{ background: 'rgba(239,83,80,0.10)', border: '1px solid rgba(239,83,80,0.20)', color: '#EF5350' }}>
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{pwSaveError}</span>
                </div>
              )}
              {pwSaveStatus === 'ok' && (
                <div className="flex items-center gap-3 p-3 rounded-xl text-sm"
                  style={{ background: 'rgba(76,175,114,0.10)', border: '1px solid rgba(76,175,114,0.25)', color: '#81C784' }}>
                  <CheckCircle className="w-4 h-4 flex-shrink-0" />
                  <span>Password changed successfully.</span>
                </div>
              )}

              <button
                onClick={handleChangePassword}
                disabled={pwSaveStatus === 'saving' || !currentPw || !newPw || !confirmPw}
                className="w-full h-11 rounded-full font-bold text-sm flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                style={{ background: 'linear-gradient(135deg, #4CAF72, #2E7D32)', color: '#fff' }}
              >
                {pwSaveStatus === 'saving'
                  ? <><Loader2 className="w-4 h-4 animate-spin" /><span>Changing…</span></>
                  : <><Lock className="w-4 h-4" /><span>Change Password</span></>}
              </button>
            </div>
          </div>

          <div className="glass-card p-6 rounded-2xl">
            <div className="flex items-center gap-3 mb-6">
              <Globe className="w-5 h-5 text-purple-400" />
              <h3 className="text-lg font-display text-white">General Settings</h3>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs text-white/40 uppercase">Site Name</label>
                <input
                  type="text"
                  value={siteName}
                  onChange={(e) => setSiteName(e.target.value)}
                  className="w-full h-10 rounded-xl glass-input px-4 text-white text-sm"
                />
              </div>
            </div>
          </div>

          <div className="glass-card p-6 rounded-2xl">
            <div className="flex items-center gap-3 mb-6">
              <MessageSquare className="w-5 h-5 text-purple-400" />
              <h3 className="text-lg font-display text-white">In-App Banner Message</h3>
            </div>
            <div className="space-y-2">
              <label className="text-xs text-white/40 uppercase">Banner Message</label>
              <textarea
                value={inAppMessage}
                onChange={(e) => setInAppMessage(e.target.value)}
                rows={3}
                placeholder="Leave blank to hide. Shown to all logged-in members at the top of the app."
                className="w-full rounded-xl glass-input px-4 py-3 text-white text-sm resize-none"
              />
              <p className="text-[10px] text-white/30">
                This message appears as a dismissible amber banner for all family members. Clears on session end.
              </p>
            </div>
          </div>

          <div className="glass-card p-6 rounded-2xl">
            <div className="flex items-center gap-3 mb-6">
              <Shield className="w-5 h-5 text-purple-400" />
              <h3 className="text-lg font-display text-white">Registration</h3>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white font-medium">Allow Registration</p>
                  <p className="text-white/40 text-xs">Let new members sign up</p>
                </div>
                <button
                  onClick={() => setAllowRegistration(!allowRegistration)}
                  className={`w-12 h-6 rounded-full relative transition-all ${allowRegistration ? 'bg-purple-500' : 'bg-white/20'}`}
                >
                  <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${allowRegistration ? 'right-1' : 'left-1'}`} />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white font-medium">Require Admin Approval</p>
                  <p className="text-white/40 text-xs">New accounts need approval</p>
                </div>
                <button
                  onClick={() => setRequireApproval(!requireApproval)}
                  className={`w-12 h-6 rounded-full relative transition-all ${requireApproval ? 'bg-purple-500' : 'bg-white/20'}`}
                >
                  <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${requireApproval ? 'right-1' : 'left-1'}`} />
                </button>
              </div>
            </div>
          </div>

          <div className="glass-card p-6 rounded-2xl">
            <div className="flex items-center gap-3 mb-6">
              <Bell className="w-5 h-5 text-purple-400" />
              <h3 className="text-lg font-display text-white">Notifications</h3>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-white font-medium">Email Notifications</p>
                <p className="text-white/40 text-xs">Receive updates about family changes</p>
              </div>
              <button
                onClick={() => setNotifications(!notifications)}
                className={`w-12 h-6 rounded-full relative transition-all ${notifications ? 'bg-purple-500' : 'bg-white/20'}`}
              >
                <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${notifications ? 'right-1' : 'left-1'}`} />
              </button>
            </div>
          </div>

          <div className="glass-card p-6 rounded-2xl">
            <div className="flex items-center gap-3 mb-6">
              <Database className="w-5 h-5 text-purple-400" />
              <h3 className="text-lg font-display text-white">Data Management</h3>
            </div>

            <div className="space-y-3">
              <button className="w-full py-3 rounded-xl glass text-white hover:bg-white/10 transition-all text-left">
                Export All Data (JSON)
              </button>
              <button className="w-full py-3 rounded-xl glass text-white hover:bg-white/10 transition-all text-left">
                Backup Database
              </button>
              <button className="w-full py-3 rounded-xl glass text-rose-400 hover:bg-rose-500/10 transition-all text-left">
                Clear All Data
              </button>
            </div>
          </div>

          <button
            onClick={handleSave}
            disabled={loading || saveStatus === 'saving'}
            className="w-full py-3 rounded-xl bg-purple-500 text-white font-bold flex items-center justify-center gap-2 hover:shadow-purple-500/40 transition-all disabled:opacity-50"
          >
            {saveStatus === 'saving' ? (
              <><Loader2 className="w-5 h-5 animate-spin" /><span>Saving…</span></>
            ) : saveStatus === 'ok' ? (
              <><CheckCircle className="w-5 h-5" /><span>Saved!</span></>
            ) : (
              <><Save className="w-5 h-5" /><span>Save Settings</span></>
            )}
          </button>
        </div>
    </div>
  );
}
