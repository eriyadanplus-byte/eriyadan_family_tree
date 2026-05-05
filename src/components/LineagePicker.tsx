'use client';

import { useState, useCallback, useMemo } from 'react';
import { Search, User, ArrowRight, Plus, Minus } from 'lucide-react';
import AncestorSearch, { AncestorResult } from './AncestorSearch';

interface Member {
  id: string;
  fullName: string;
  generation: number;
  gender?: string;
}

interface LineagePickerProps {
  selectedAnchorId: string;
  selectedRelation: 'child' | 'spouse' | 'sibling';
  fatherId: string;
  motherId: string;
  onAnchorSelect: (member: Member | null) => void;
  onRelationChange: (relation: 'child' | 'spouse' | 'sibling') => void;
  onFatherSelect: (id: string) => void;
  onMotherSelect: (id: string) => void;
}

type RelationType = 'child' | 'spouse' | 'sibling';

const relationOptions: { value: RelationType; label: string; description: string }[] = [
  { value: 'child', label: 'Child of', description: 'Add as a child to an existing member' },
  { value: 'spouse', label: 'Spouse of', description: 'Add as a spouse to an existing member' },
  { value: 'sibling', label: 'Sibling of', description: 'Add as a sibling to an existing member' },
];

export default function LineagePicker({
  selectedAnchorId,
  selectedRelation,
  fatherId,
  motherId,
  onAnchorSelect,
  onRelationChange,
  onFatherSelect,
  onMotherSelect,
}: LineagePickerProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Member[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [anchorMember, setAnchorMember] = useState<Member | null>(null);
  const [fatherResult, setFatherResult] = useState<AncestorResult | null>(null);
  const [motherResult, setMotherResult] = useState<AncestorResult | null>(null);

  const selectedRelationOption = relationOptions.find(r => r.value === selectedRelation);

  const handleSearch = useCallback(async (query: string) => {
    setSearchQuery(query);
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const res = await fetch(`/api/members?search=${encodeURIComponent(query)}`);
      if (res.ok) {
        const data = await res.json();
        setSearchResults(data.slice(0, 10));
      }
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setIsSearching(false);
    }
  }, []);

  const handleSelectMember = useCallback((member: Member) => {
    setAnchorMember(member);
    onAnchorSelect(member);
    setSearchQuery(member.fullName);
    setSearchResults([]);
  }, [onAnchorSelect]);

  const handleClear = useCallback(() => {
    setAnchorMember(null);
    onAnchorSelect(null);
    setSearchQuery('');
    setSearchResults([]);
  }, [onAnchorSelect]);

  const miniPreview = useMemo(() => {
    if (!anchorMember) return null;
    const generation = anchorMember.generation;
    const nextGen = relationOptions.find(r => r.value === selectedRelation)?.value === 'child'
      ? generation + 1
      : generation;

    const preview = {
      grandparent: generation > 2 ? `Gen ${generation - 2} Ancestor` : null,
      parent: `${anchorMember.fullName} (Gen ${generation})`,
      children: `New member will be Gen ${nextGen}`,
    };

    return preview;
  }, [anchorMember, selectedRelation]);

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-white/40 text-xs uppercase tracking-wider mb-3">
          Relationship Type
        </label>
        <div className="grid grid-cols-3 gap-3">
          {relationOptions.map(({ value, label, description }) => (
            <button
              key={value}
              type="button"
              onClick={() => onRelationChange(value)}
              className={`p-3 rounded-xl border text-left transition-all ${selectedRelation === value ? 'border-[#7B61FF] bg-[#7B61FF]/10 text-white' : 'border-white/10 bg-white/5 text-white/60 hover:border-white/20'}`}
              style={{ minHeight: 44 }}
            >
              <div className="font-medium text-sm">{label}</div>
              <div className="text-[10px] mt-1 opacity-60">{description}</div>
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-white/40 text-xs uppercase tracking-wider mb-3">
          Search Ancestor / Member
        </label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            className="w-full h-12 rounded-xl glass-input pl-10 pr-10"
            placeholder="Type at least 2 characters..."
          />
          {anchorMember && (
            <button
              type="button"
              onClick={handleClear}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white"
              style={{ minWidth: 44, minHeight: 44 }}
            >
              <Minus className="w-4 h-4" />
            </button>
          )}
        </div>

        {isSearching && (
          <div className="mt-2 text-white/40 text-sm">Searching...</div>
        )}

        {searchResults.length > 0 && (
          <div className="mt-2 max-h-48 overflow-y-auto scrollbar-thin glass rounded-xl border border-white/10">
            {searchResults.map((member) => (
              <button
                key={member.id}
                type="button"
                onClick={() => handleSelectMember(member)}
                className="w-full text-left p-3 hover:bg-white/5 flex items-center gap-3 transition-colors border-b border-white/5 last:border-0"
                style={{ minHeight: 44 }}
              >
                <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                  <User className="w-4 h-4 text-white/40" />
                </div>
                <div>
                  <div className="text-white text-sm">{member.fullName}</div>
                  <div className="text-white/40 text-xs">Gen {member.generation}</div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {selectedRelation === 'child' && anchorMember && (
        <div className="space-y-4 p-4 glass rounded-xl border border-[#7B61FF]/20">
          <div className="text-sm text-[#7B61FF] font-medium">Select Both Parents</div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-white/40 text-xs">Father</label>
              <AncestorSearch
                value={fatherResult}
                onChange={(result) => {
                  setFatherResult(result);
                  onFatherSelect(result?.id || '');
                }}
                placeholder="Search father..."
              />
            </div>
            <div>
              <label className="text-white/40 text-xs">Mother</label>
              <AncestorSearch
                value={motherResult}
                onChange={(result) => {
                  setMotherResult(result);
                  onMotherSelect(result?.id || '');
                }}
                placeholder="Search mother..."
              />
            </div>
          </div>
        </div>
      )}

      {miniPreview && (
        <div className="p-4 glass rounded-xl border border-[#41eec2]/20">
          <div className="text-xs text-white/40 uppercase tracking-wider mb-3">Relationship Preview</div>
          <div className="flex items-center gap-2 text-sm">
            {miniPreview.grandparent && (
              <>
                <span className="text-white/30">{miniPreview.grandparent}</span>
                <ArrowRight className="w-3 h-3 text-white/20" />
              </>
            )}
            <span className="text-[#7B61FF]">{miniPreview.parent}</span>
            <ArrowRight className="w-3 h-3 text-white/20" />
            <span className="text-[#41eec2]">{miniPreview.children}</span>
          </div>
        </div>
      )}

      {anchorMember && (
        <input type="hidden" name="anchorId" value={anchorMember.id} />
      )}
    </div>
  );
}
