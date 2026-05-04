'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { GitBranch, Save, Loader2, CheckCircle, AlertCircle, Search, ShieldOff } from 'lucide-react';

interface LineageData {
  id: string;
  fullName: string;
  generation: number;
  fatherId: string | null;
  fatherName: string | null;
  motherId: string | null;
  motherName: string | null;
  spouseId: string | null;
  spouseName: string | null;
}

interface CoupleValue {
  fatherId: string;
  fatherName: string;
  motherId: string;
  motherName: string;
  generation: number;
}

interface SpouseOption {
  id: string;
  fullName: string;
  generation: number;
}

async function safeJson<T = any>(url: string, signal?: AbortSignal): Promise<T | null> {
  try {
    const r = await fetch(url, { signal });
    if (!r.ok) return null;
    const text = await r.text();
    if (!text) return null;
    return JSON.parse(text) as T;
  } catch {
    return null;
  }
}

// ── Couple search (paired father+mother) ──────────────────────────────────────
function CoupleSelect({
  label,
  value,
  onChange,
}: {
  label: string;
  value: CoupleValue | null;
  onChange: (v: CoupleValue | null) => void;
}) {
  const [search, setSearch] = useState('');
  const [results, setResults] = useState<CoupleValue[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (search.length < 2) { setResults([]); return; }
    setLoading(true);
    const controller = new AbortController();
    const t = setTimeout(() => {
      safeJson<{ couples: CoupleValue[] }>(
        `/api/members/couples?search=${encodeURIComponent(search)}`,
        controller.signal
      )
        .then(d => setResults(d?.couples || []))
        .catch(() => setResults([]))
        .finally(() => setLoading(false));
    }, 300);
    return () => {
      clearTimeout(t);
      controller.abort();
    };
  }, [search]);

  return (
    <div className="space-y-2">
      <label className="text-xs text-white/40 uppercase tracking-widest">{label}</label>
      {value ? (
        <div className="flex items-center gap-3 p-3 rounded-xl glass border border-white/10">
          <div className="flex-1 min-w-0">
            <span className="text-sm text-white font-medium">
              {value.fatherName} + {value.motherName}
            </span>
            <span className="ml-2 text-xs text-white/40">Gen {value.generation}</span>
          </div>
          <button
            onClick={() => { onChange(null); setSearch(''); }}
            className="text-white/40 hover:text-rose-400 text-xs flex-shrink-0"
          >
            Clear
          </button>
        </div>
      ) : (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
          <input
            type="text"
            value={search}
            onChange={e => { setSearch(e.target.value); setOpen(true); }}
            onFocus={() => setOpen(true)}
            placeholder="Search by father or mother name…"
            className="w-full h-10 rounded-xl glass-input pl-9 pr-4 text-white text-sm"
          />
          {loading && (
            <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 animate-spin" />
          )}
          {open && results.length > 0 && (
            <div className="absolute z-50 top-full mt-1 w-full rounded-xl glass border border-white/10 overflow-hidden shadow-xl max-h-52 overflow-y-auto">
              {results.map((r, i) => (
                <button
                  key={`${r.fatherId}-${r.motherId}-${i}`}
                  className="w-full text-left px-4 py-2.5 text-sm text-white hover:bg-white/10 transition-colors border-b border-white/5 last:border-0"
                  onClick={() => { onChange(r); setSearch(''); setOpen(false); }}
                >
                  <span className="font-medium">{r.fatherName}</span>
                  <span className="text-white/50"> + </span>
                  <span className="font-medium">{r.motherName}</span>
                  <span className="text-white/40 text-xs ml-2">Gen {r.generation}</span>
                </button>
              ))}
            </div>
          )}
          {open && !loading && search.length >= 2 && results.length === 0 && (
            <div className="absolute z-50 top-full mt-1 w-full rounded-xl glass border border-white/10 px-4 py-3 text-sm text-white/40 shadow-xl">
              No couples found
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Spouse-only search (individual member) ────────────────────────────────────
function MemberSelect({
  label,
  value,
  onChange,
}: {
  label: string;
  value: { id: string; name: string; generation?: number } | null;
  onChange: (v: { id: string; name: string; generation?: number } | null) => void;
}) {
  const [search, setSearch] = useState('');
  const [results, setResults] = useState<SpouseOption[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (search.length < 2) { setResults([]); return; }
    setLoading(true);
    const controller = new AbortController();
    const t = setTimeout(() => {
      safeJson<any[] | { members: any[] }>(
        `/api/members?search=${encodeURIComponent(search)}&limit=20`,
        controller.signal
      )
        .then(d => {
          const arr = Array.isArray(d) ? d : d?.members || [];
          setResults(arr.map((m: any) => ({
            id: String(m.id),
            fullName: m.fullName || m.full_name,
            generation: m.generation,
          })));
        })
        .catch(() => setResults([]))
        .finally(() => setLoading(false));
    }, 300);
    return () => {
      clearTimeout(t);
      controller.abort();
    };
  }, [search]);

  return (
    <div className="space-y-2">
      <label className="text-xs text-white/40 uppercase tracking-widest">{label}</label>
      {value ? (
        <div className="flex items-center gap-3 p-3 rounded-xl glass border border-white/10">
          <span className="flex-1 text-sm text-white">{value.name}</span>
          {value.generation !== undefined && (
            <span className="text-xs text-white/40">Gen {value.generation}</span>
          )}
          <button
            onClick={() => { onChange(null); setSearch(''); }}
            className="text-white/40 hover:text-rose-400 text-xs"
          >
            Clear
          </button>
        </div>
      ) : (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
          <input
            type="text"
            value={search}
            onChange={e => { setSearch(e.target.value); setOpen(true); }}
            onFocus={() => setOpen(true)}
            placeholder="Search by name…"
            className="w-full h-10 rounded-xl glass-input pl-9 pr-4 text-white text-sm"
          />
          {loading && (
            <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 animate-spin" />
          )}
          {open && results.length > 0 && (
            <div className="absolute z-50 top-full mt-1 w-full rounded-xl glass border border-white/10 overflow-hidden shadow-xl max-h-48 overflow-y-auto">
              {results.map(r => (
                <button
                  key={r.id}
                  className="w-full text-left px-4 py-2.5 text-sm text-white hover:bg-white/10 transition-colors"
                  onClick={() => {
                    onChange({ id: r.id, name: r.fullName, generation: r.generation });
                    setSearch('');
                    setOpen(false);
                  }}
                >
                  {r.fullName} <span className="text-white/40 text-xs ml-1">Gen {r.generation}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Main form ─────────────────────────────────────────────────────────────────
function AdminLineageForm({ targetMemberId }: { targetMemberId: string | null }) {
  const [data, setData] = useState<LineageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [successMsg, setSuccessMsg] = useState('Lineage updated successfully.');
  const [error, setError] = useState('');

  const [generation, setGeneration] = useState<number | null>(null);
  const [generationManual, setGenerationManual] = useState(false);
  const [couple, setCouple] = useState<CoupleValue | null>(null);
  const [spouse, setSpouse] = useState<{ id: string; name: string; generation?: number } | null>(null);

  // Auto-derive generation from selected couple
  useEffect(() => {
    if (generationManual) return;
    if (couple) setGeneration(couple.generation + 1);
  }, [couple, generationManual]);

  useEffect(() => {
    const url = targetMemberId
      ? `/api/admin/lineage?memberId=${encodeURIComponent(targetMemberId)}`
      : '/api/admin/lineage';
    const controller = new AbortController();
    fetch(url, { signal: controller.signal })
      .then(res => {
        if (!res.ok) {
          return res.json().then(err => {
            const errorMsg = err.error || 'Failed to load member profile';
            setError(`Error: ${errorMsg}`);
            setLoading(false);
            throw new Error(errorMsg);
          });
        }
        return res.json();
      })
      .then(d => {
        if (!d) {
          setError('Failed to load member profile.');
          setLoading(false);
          return;
        }
        setData(d);
        setGeneration(d.generation);
        // Reconstruct couple from loaded data if both parents are set
        if (d.fatherId && d.motherId) {
          setCouple({
            fatherId:   d.fatherId,
            fatherName: d.fatherName || '',
            motherId:   d.motherId,
            motherName: d.motherName || '',
            generation: d.generation - 1,
          });
        }
        if (d.spouseId) setSpouse({ id: d.spouseId, name: d.spouseName || '' });
        setLoading(false);
      })
      .catch(error => {
        if (error.name !== 'AbortError') {
          // Use the error from the above .then() block
          if (!error.message.includes('Error:')) {
            setError(`Failed to load member profile: ${error.message}`);
          }
          setLoading(false);
        }
      });
    return () => controller.abort();
  }, [targetMemberId]);

  const handleSave = async () => {
    setSaving(true);
    setError('');
    setSuccess(false);
    try {
      const res = await fetch('/api/admin/lineage', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          memberId:   targetMemberId || undefined,
          generation: generation ?? undefined,
          fatherId:   couple?.fatherId || null,
          motherId:   couple?.motherId || null,
          spouseId:   spouse?.id || null,
        }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || 'Failed to save');
      }
      const d = await res.json().catch(() => ({} as any));
      setSuccessMsg(
        d.generationAligned
          ? `Lineage saved — generation auto-set to Gen ${d.effectiveGeneration} to match spouse.`
          : 'Lineage updated successfully.'
      );
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-purple-400 animate-spin" />
      </div>
    );
  }

  const noParents = !couple;

  return (
    <div className="p-4 md:p-8 max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center">
          <GitBranch className="w-5 h-5 text-purple-400" />
        </div>
        <div>
          <h2 className="text-2xl font-display text-white">
            {targetMemberId && data ? `Lineage — ${data.fullName}` : 'My Lineage'}
          </h2>
          <p className="text-xs text-white/40">
            {data?.fullName} — connect position in the family tree
          </p>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center gap-3 text-rose-400 text-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {success && (
        <div className="mb-6 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-3 text-emerald-400 text-sm">
          <CheckCircle className="w-4 h-4 flex-shrink-0" />
          {successMsg}
        </div>
      )}

      <div className="glass rounded-2xl p-6 space-y-6">
        {/* Generation — auto-derived from couple, manual fallback */}
        <div className="space-y-2">
          <label className="text-xs text-white/40 uppercase tracking-widest">Generation</label>
          {noParents ? (
            <div className="flex items-center gap-3">
              <input
                type="number"
                min={1}
                max={100}
                value={generation ?? ''}
                onChange={e => { setGeneration(Number(e.target.value) || null); setGenerationManual(true); }}
                className="w-32 h-10 rounded-xl glass-input px-4 text-white text-sm"
                placeholder="e.g. 3"
              />
              <span className="text-xs text-white/30">Select parents to auto-calculate</span>
            </div>
          ) : (
            <div className="flex items-center gap-3 p-3 rounded-xl glass border border-white/10">
              <span className="text-white font-medium">Generation {generation}</span>
              <span className="text-xs text-white/40">
                (auto-calculated: Gen {couple.generation} + 1)
              </span>
              <button
                onClick={() => setGenerationManual(true)}
                className="ml-auto text-xs text-purple-400 hover:underline"
              >
                Override
              </button>
            </div>
          )}
          {generationManual && !noParents && (
            <div className="flex items-center gap-3">
              <input
                type="number"
                min={1}
                max={100}
                value={generation ?? ''}
                onChange={e => setGeneration(Number(e.target.value) || null)}
                className="w-32 h-10 rounded-xl glass-input px-4 text-white text-sm"
              />
              <button
                onClick={() => { setGenerationManual(false); }}
                className="text-xs text-white/40 hover:text-white/70"
              >
                Reset to auto
              </button>
            </div>
          )}
          <p className="text-[10px] text-white/30">
            Other members' generations are not affected by this change.
          </p>
          {spouse && typeof spouse.generation === 'number' && generation !== null && spouse.generation !== generation && (
            <p className="text-[10px] text-amber-400/70">
              Will be auto-set to Gen {spouse.generation} to match spouse on save.
            </p>
          )}
        </div>

        {/* Couple search — sets both father and mother together */}
        <CoupleSelect
          label="Parents (couple)"
          value={couple}
          onChange={v => { setCouple(v); setGenerationManual(false); }}
        />

        <MemberSelect label="Spouse" value={spouse} onChange={setSpouse} />

        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full py-3 rounded-xl bg-purple-500 text-white font-medium hover:bg-purple-600 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {saving ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</>
          ) : (
            <><Save className="w-4 h-4" /> Save Lineage</>
          )}
        </button>
      </div>
    </div>
  );
}

// ── Page wrapper with role guard ──────────────────────────────────────────────
function AdminLineagePageInner() {
  const searchParams = useSearchParams();
  const targetMemberId = searchParams.get('memberId');
  const [role, setRole] = useState<string | null>(null);
  const [sessionLoading, setSessionLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    safeJson<any>('/api/auth/session', controller.signal)
      .then(d => setRole(d?.user?.role ?? null))
      .catch(() => setRole(null))
      .finally(() => setSessionLoading(false));
    return () => controller.abort();
  }, []);

  if (sessionLoading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-purple-400 animate-spin" />
      </div>
    );
  }

  if (role !== 'super_admin') {
    return (
      <div className="p-8 flex flex-col items-center justify-center gap-4 text-center">
        <div className="w-12 h-12 rounded-full bg-rose-500/15 flex items-center justify-center">
          <ShieldOff className="w-6 h-6 text-rose-400" />
        </div>
        <p className="text-white/60 text-sm">
          Lineage management is restricted to administrators.
        </p>
      </div>
    );
  }

  return <AdminLineageForm targetMemberId={targetMemberId} />;
}

export default function AdminLineagePage() {
  return (
    <Suspense fallback={
      <div className="p-8 flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-purple-400 animate-spin" />
      </div>
    }>
      <AdminLineagePageInner />
    </Suspense>
  );
}