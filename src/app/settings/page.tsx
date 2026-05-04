'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  TreeDeciduous, Search as SearchIcon, User, Settings as SettingsIcon,
  Palette, Bell, Shield, Database, Globe, Moon, Sun, Loader2, Save, CheckCircle, AlertCircle
} from 'lucide-react';

interface SessionUser {
  id: string;
  email: string;
  role: 'super_admin' | 'editor' | 'contributor' | 'viewer';
  memberId: string | null;
}

export default function SettingsPage() {
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'ok' | 'error'>('idle');
  const [saveError, setSaveError] = useState('');
  const [session, setSession] = useState<SessionUser | null>(null);
  const [settings, setSettings] = useState({
    theme: 'dark',
    notifications: true,
    privacyLevel: 'family',
    autoArchive: true,
  });

  useEffect(() => {
    fetch('/api/auth/session')
      .then(res => res.ok ? res.json() : null)
      .then(data => setSession(data?.user || null));
  }, []);

  const handleSave = async () => {
    setSaveStatus('saving');
    setSaveError('');
    try {
      // Persist notification preference to the config API for super_admin,
      // otherwise just save locally (preferences are UI-only for non-admins currently)
      if (session?.role === 'super_admin') {
        const res = await fetch('/api/admin/config', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ notifications: settings.notifications }),
        });
        if (!res.ok) throw new Error('Failed to save settings');
      }
      setSaveStatus('ok');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch (err: any) {
      setSaveError(err.message || 'Failed to save settings');
      setSaveStatus('error');
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      <main className="px-4 md:px-8 max-w-2xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center">
            <SettingsIcon className="w-6 h-6 text-purple-400" />
          </div>
          <div>
            <h1 className="text-3xl font-display text-white">Settings</h1>
            <p className="text-white/40">Customize your experience</p>
          </div>
        </div>

        {saveStatus === 'ok' && (
          <div className="mb-6 flex items-center gap-3 p-4 rounded-xl"
            style={{ background: 'rgba(76,175,114,0.10)', border: '1px solid rgba(76,175,114,0.25)', color: '#81C784' }}>
            <CheckCircle className="w-4 h-4 flex-shrink-0" />
            <span className="text-sm">Settings saved.</span>
          </div>
        )}

        {saveStatus === 'error' && (
          <div className="mb-6 flex items-center gap-3 p-4 rounded-xl"
            style={{ background: 'rgba(239,83,80,0.10)', border: '1px solid rgba(239,83,80,0.20)', color: '#EF5350' }}>
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span className="text-sm">{saveError}</span>
          </div>
        )}

        <div className="space-y-6">
          <div className="glass-card p-6 rounded-2xl">
            <div className="flex items-center gap-3 mb-6">
              <Palette className="w-5 h-5 text-purple-400" />
              <h2 className="text-lg font-display text-white">Appearance</h2>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white font-medium">Theme</p>
                  <p className="text-white/40 text-sm">Choose your preferred look</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setSettings({ ...settings, theme: 'dark' })}
                    className={`px-4 py-2 rounded-xl flex items-center gap-2 transition-all ${settings.theme === 'dark' ? 'bg-purple-500/20 text-purple-400' : 'glass text-white/60'}`}
                  >
                    <Moon className="w-4 h-4" />
                    <span>Dark</span>
                  </button>
                  <button
                    onClick={() => setSettings({ ...settings, theme: 'light' })}
                    className={`px-4 py-2 rounded-xl flex items-center gap-2 transition-all ${settings.theme === 'light' ? 'bg-purple-500/20 text-purple-400' : 'glass text-white/60'}`}
                  >
                    <Sun className="w-4 h-4" />
                    <span>Light</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="glass-card p-6 rounded-2xl">
            <div className="flex items-center gap-3 mb-6">
              <Bell className="w-5 h-5 text-purple-400" />
              <h2 className="text-lg font-display text-white">Notifications</h2>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white font-medium">Push Notifications</p>
                  <p className="text-white/40 text-sm">Get updates about family additions</p>
                </div>
                <button
                  onClick={() => setSettings({ ...settings, notifications: !settings.notifications })}
                  className={`w-12 h-6 rounded-full relative transition-all ${settings.notifications ? 'bg-purple-500' : 'bg-white/20'}`}
                >
                  <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${settings.notifications ? 'right-1' : 'left-1'}`} />
                </button>
              </div>
            </div>
          </div>

          {session?.role === 'super_admin' && (
            <div className="glass-card p-6 rounded-2xl">
              <div className="flex items-center gap-3 mb-6">
                <Shield className="w-5 h-5 text-purple-400" />
                <h2 className="text-lg font-display text-white">Privacy</h2>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white font-medium">Data Visibility</p>
                    <p className="text-white/40 text-sm">Who can view family data</p>
                  </div>
                  <select
                    value={settings.privacyLevel}
                    onChange={(e) => setSettings({ ...settings, privacyLevel: e.target.value })}
                    className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white text-sm"
                  >
                    <option value="public">Public</option>
                    <option value="family">Family Only</option>
                    <option value="admin">Admins Only</option>
                  </select>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white font-medium">Auto-Archive</p>
                    <p className="text-white/40 text-sm">Mark members as late after 100 years</p>
                  </div>
                  <button
                    onClick={() => setSettings({ ...settings, autoArchive: !settings.autoArchive })}
                    className={`w-12 h-6 rounded-full relative transition-all ${settings.autoArchive ? 'bg-purple-500' : 'bg-white/20'}`}
                  >
                    <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${settings.autoArchive ? 'right-1' : 'left-1'}`} />
                  </button>
                </div>
              </div>
            </div>
          )}

          {session?.role === 'super_admin' && (
            <div className="glass-card p-6 rounded-2xl">
              <div className="flex items-center gap-3 mb-6">
                <Database className="w-5 h-5 text-purple-400" />
                <h2 className="text-lg font-display text-white">Data Management</h2>
              </div>

              <div className="space-y-4">
                <button className="w-full py-3 rounded-xl glass text-white hover:bg-white/10 transition-all text-left flex items-center justify-between">
                  <span>Export Family Data</span>
                  <Globe className="w-4 h-4 text-white/40" />
                </button>
                <button className="w-full py-3 rounded-xl glass text-white hover:bg-white/10 transition-all text-left flex items-center justify-between">
                  <span>Backup &amp; Restore</span>
                  <Database className="w-4 h-4 text-white/40" />
                </button>
              </div>
            </div>
          )}

          <button
            onClick={handleSave}
            disabled={saveStatus === 'saving'}
            className="w-full py-3 rounded-xl bg-purple-500 text-white font-bold flex items-center justify-center gap-2 shadow-lg hover:shadow-purple-500/40 transition-all disabled:opacity-50"
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
      </main>
    </div>
  );
}
