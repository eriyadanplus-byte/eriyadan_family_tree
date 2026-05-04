'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { Search, X, Loader2, MessageCircle } from 'lucide-react';

export interface AncestorResult {
  id: string;
  fullName: string;
  generation: number;
  isLate: boolean;
  isStub?: boolean;
  gender?: string;
  location?: string;
  photo?: string | null;
  initials?: string;
  fatherName?: string;
  motherName?: string;
  // Couple fields (null for singletons)
  spouseId?: string | null;
  spouseName?: string | null;
  spouseIsLate?: boolean;
  spousePhoto?: string | null;
  husbandId?: string | null;
  wifeId?: string | null;
  husbandName?: string | null;
  wifeName?: string | null;
  husbandPhoto?: string | null;
  wifePhoto?: string | null;
}

interface AncestorSearchProps {
  value: AncestorResult | null;
  onChange: (v: AncestorResult | null) => void;
  onNoMatch?: () => void;
  apiEndpoint?: string;
  placeholder?: string;
}

export default function AncestorSearch({
  value,
  onChange,
  onNoMatch,
  apiEndpoint = '/api/auth/signup/search',
  placeholder = 'Search by name… (e.g. Ahmed, Fatima)',
}: AncestorSearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<AncestorResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>();
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const doSearch = useCallback(async (q: string) => {
    if (q.length < 2) { setResults([]); return; }
    setLoading(true);
    try {
      const res = await fetch(`${apiEndpoint}?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      const safe: AncestorResult[] = (Array.isArray(data?.results) ? data.results : [])
        .filter((m: any) => m && typeof m.id === 'string' && typeof m.fullName === 'string' && m.fullName.length > 0);
      setResults(safe);
    } catch { setResults([]); }
    finally { setLoading(false); }
  }, [apiEndpoint]);

  // Debounce search - do NOT call in render
  const handleQueryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const q = e.target.value;
    setQuery(q);
    setOpen(true);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => doSearch(q), 320);
  };

  // Cleanup on unmount
  useEffect(() => () => clearTimeout(timer.current), []);

  /* Show selected ancestor (single or couple) */
  if (value) {
    const v = value;
    const isCouple = !!v.spouseId;
    return (
      <div className="flex items-center justify-between p-4 rounded-xl"
        style={{ background: 'rgba(76,175,114,0.08)', border: '1px solid rgba(76,175,114,0.25)' }}>
        <div className="flex items-center gap-3 min-w-0">
          {isCouple ? (
            <div className="flex -space-x-2 flex-shrink-0">
              {v.husbandPhoto ? (
                <img src={v.husbandPhoto} alt={v.husbandName || v.fullName} className="w-9 h-9 rounded-full border-2 border-[#0D1F0D] object-cover flex-shrink-0" />
              ) : (
                <div className="w-9 h-9 rounded-full border-2 border-[#0D1F0D] flex items-center justify-center font-bold text-xs"
                  style={{ background: 'rgba(76,175,114,0.15)', color: '#81C784' }}>
                  {(v.husbandName || v.fullName)![0].toUpperCase()}
                </div>
              )}
              {v.wifePhoto ? (
                <img src={v.wifePhoto} alt={v.wifeName || v.spouseName || ''} className="w-9 h-9 rounded-full border-2 border-[#0D1F0D] object-cover flex-shrink-0" />
              ) : (
                <div className="w-9 h-9 rounded-full border-2 border-[#0D1F0D] flex items-center justify-center font-bold text-xs"
                  style={{ background: 'rgba(200,150,46,0.15)', color: '#E6B84A' }}>
                  {(v.wifeName || v.spouseName || '?')![0].toUpperCase()}
                </div>
              )}
            </div>
          ) : v.photo ? (
            <img src={v.photo} alt={v.fullName} className="w-10 h-10 rounded-full object-cover border border-white/10 flex-shrink-0" />
          ) : (
            <div className="w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center font-bold text-sm"
              style={{ background: v.isLate ? 'rgba(239,83,80,0.15)' : 'rgba(76,175,114,0.15)', color: v.isLate ? '#EF5350' : '#81C784' }}>
              {v.initials || v.fullName![0].toUpperCase()}
            </div>
          )}
          <div className="min-w-0">
            <p className="font-semibold text-white truncate">
              {isCouple ? `${v.husbandName || v.fullName} & ${v.wifeName || v.spouseName}` : v.fullName}
            </p>
            <p className="text-xs mt-0.5 truncate" style={{ color: 'rgba(232,245,233,0.55)' }}>
              Gen {v.generation} · {isCouple ? 'Couple' : (v.isLate ? '† Deceased' : v.isStub ? 'Unclaimed' : 'Living')}
              {!isCouple && v.location ? ` · ${v.location}` : ''}
            </p>
          </div>
        </div>
        <button type="button" onClick={() => onChange(null)}
          className="p-2 rounded-lg hover:bg-white/10 transition-colors flex-shrink-0">
          <X className="w-4 h-4" style={{ color: 'rgba(232,245,233,0.40)' }} />
        </button>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative">
      {/* Search input */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none"
          style={{ color: 'rgba(232,245,233,0.35)' }} />
        <input
          value={query}
          onChange={handleQueryChange}
          onFocus={() => setOpen(true)}
          className="glass-input pl-11 pr-4"
          placeholder={placeholder}
          autoComplete="off"
        />
        {loading && (
          <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin pointer-events-none"
            style={{ color: 'rgba(232,245,233,0.35)' }} />
        )}
      </div>

      {/* Dropdown results */}
      {open && query.length >= 2 && (
        <div className="absolute top-full left-0 right-0 mt-2 rounded-2xl overflow-hidden z-[60] shadow-2xl"
          style={{ background: '#0D1F0D', border: '1px solid rgba(76,175,114,0.22)' }}>
          {!loading && results.length === 0 && (
            <div className="px-4 py-3 space-y-2">
              <p className="text-sm" style={{ color: 'rgba(232,245,233,0.45)' }}>
                No family members found for &ldquo;{query}&rdquo;
              </p>
              {onNoMatch && (
                <button
                  type="button"
                  onClick={() => onNoMatch?.()}
                  className="flex items-center gap-1.5 text-xs font-semibold transition-colors hover:underline"
                  style={{ color: '#81C784' }}
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  Can&apos;t find your ancestor? Message admin →
                </button>
              )}
            </div>
          )}
          {loading && (
            <div className="px-4 py-3 flex items-center gap-2 text-sm" style={{ color: 'rgba(232,245,233,0.45)' }}>
              <Loader2 className="w-4 h-4 animate-spin" /> Searching…
            </div>
          )}
          {results.slice(0, 8).map(m => {
            const isCouple = !!m.spouseId;
            return (
              <button key={m.id} type="button"
                onClick={() => { onChange(m); setOpen(false); setQuery(''); }}
                className="w-full text-left px-4 py-3 transition-colors hover:bg-white/5 flex items-center gap-3"
                style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                {/* Couple: overlapping photos/initials; singleton: photo or initial */}
                {isCouple ? (
                  <div className="flex -space-x-2 flex-shrink-0">
                    {m.husbandPhoto ? (
                      <img src={m.husbandPhoto} alt={m.husbandName || m.fullName} className="w-9 h-9 rounded-full border-2 border-[#0D1F0D] object-cover flex-shrink-0" />
                    ) : (
                      <div className="w-9 h-9 rounded-full border-2 border-[#0D1F0D] flex items-center justify-center font-bold text-xs"
                        style={{ background: 'rgba(76,175,114,0.15)', color: '#81C784' }}>
                        {(m.husbandName || m.fullName)![0].toUpperCase()}
                      </div>
                    )}
                    {m.wifePhoto ? (
                      <img src={m.wifePhoto} alt={m.wifeName || m.spouseName || ''} className="w-9 h-9 rounded-full border-2 border-[#0D1F0D] object-cover flex-shrink-0" />
                    ) : (
                      <div className="w-9 h-9 rounded-full border-2 border-[#0D1F0D] flex items-center justify-center font-bold text-xs"
                        style={{ background: 'rgba(200,150,46,0.15)', color: '#E6B84A' }}>
                        {(m.wifeName || m.spouseName || '?')![0].toUpperCase()}
                      </div>
                    )}
                  </div>
                ) : m.photo ? (
                  <img src={m.photo} alt={m.fullName} className="w-9 h-9 rounded-full flex-shrink-0 object-cover border border-white/10" />
                ) : (
                  <div className="w-9 h-9 rounded-full flex-shrink-0 flex items-center justify-center font-bold text-sm"
                    style={{
                      background: m.isLate ? 'rgba(239,83,80,0.15)' : m.isStub ? 'rgba(200,150,46,0.15)' : 'rgba(76,175,114,0.15)',
                      color:      m.isLate ? '#EF5350'              : m.isStub ? '#E6B84A'            : '#81C784',
                    }}>
                    {m.initials || m.fullName![0].toUpperCase()}
                  </div>
                )}
                <div className="min-w-0">
                  <p className="font-semibold text-sm text-white truncate">
                    {isCouple
                      ? `${m.husbandName || m.fullName} & ${m.wifeName || m.spouseName}`
                      : m.fullName}
                  </p>
                  <p className="text-xs truncate" style={{ color: 'rgba(232,245,233,0.45)' }}>
                    Gen {m.generation} · {isCouple
                      ? `Couple${m.spouseIsLate || m.isLate ? ' (†)' : ''}`
                      : (m.isLate ? '† Deceased' : m.isStub ? 'Unclaimed' : 'Living')}
                    {!isCouple && m.location ? ` · ${m.location}` : ''}
                    {!isCouple && m.fatherName ? ` · Child of ${m.fatherName}` : ''}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      )}

    </div>
  );
}
