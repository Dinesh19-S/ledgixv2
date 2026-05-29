import { useState, useMemo, useRef, useEffect } from 'react';
import { Search, ChevronDown, User } from 'lucide-react';
import type { Party } from '../../types';

interface SearchablePartySelectProps {
  parties: Party[];
  selectedParty: string;
  onSelect: (partyName: string) => void;
  label?: string;
  placeholder?: string;
  className?: string;
}

export default function SearchablePartySelect({
  parties,
  selectedParty,
  onSelect,
  label = "Select Party",
  placeholder = "Type to search...",
  className = ""
}: SearchablePartySelectProps) {
  const [partySearch, setPartySearch] = useState('');
  const [showPartyDropdown, setShowPartyDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const filteredParties = useMemo(() => {
    if (!partySearch.trim()) return parties;
    const search = partySearch.toLowerCase().trim();
    return parties.filter((p, idx) => 
      p.name.toLowerCase().includes(search) ||
      p.mobile.includes(search) ||
      (idx + 1).toString() === search
    );
  }, [parties, partySearch]);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowPartyDropdown(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div className={`space-y-2 ${className}`} ref={dropdownRef}>
      {label && (
        <label className="text-xs font-black text-slate-700 uppercase tracking-wider flex items-center space-x-2">
          <User size={14} className="text-indigo-600" />
          <span>{label}</span>
        </label>
      )}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
        <input
          type="text"
          value={showPartyDropdown ? partySearch : selectedParty}
          onChange={(e) => { setPartySearch(e.target.value); setShowPartyDropdown(true); }}
          onFocus={() => { setPartySearch(''); setShowPartyDropdown(true); }}
          placeholder={placeholder}
          className="w-full bg-slate-100 border border-slate-300 rounded-xl py-2.5 pl-9 pr-10 text-sm font-black focus:ring-2 focus:ring-indigo-500/20 transition-all text-slate-900"
        />
        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
        
        {showPartyDropdown && (
          <div className="absolute z-100 top-full mt-1 w-full bg-white border border-slate-300 rounded-xl shadow-2xl max-h-60 overflow-y-auto">
            {filteredParties.length === 0 ? (
              <div className="px-4 py-3 text-sm text-slate-400 italic">No parties found</div>
            ) : (
              filteredParties.map((p) => {
                const realIndex = parties.findIndex(original => original.id === p.id) + 1;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => { 
                      onSelect(p.name); 
                      setPartySearch(''); 
                      setShowPartyDropdown(false); 
                    }}
                    className={`w-full text-left px-4 py-2.5 text-sm font-bold hover:bg-indigo-50 transition-colors flex items-center justify-between ${
                      selectedParty === p.name ? 'bg-indigo-50 text-indigo-700 font-black' : 'text-slate-700'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded font-black min-w-[20px] text-center">{realIndex}</span>
                      <div className="flex flex-col">
                        <span>{p.name}</span>
                        <span className="text-[10px] text-slate-400 font-medium">{p.mobile || 'No mobile'}</span>
                      </div>
                    </div>
                    <span className="text-[10px] font-black text-slate-400">₹{p.openingBalance.toLocaleString()} {p.balanceType.charAt(0)}</span>
                  </button>
                );
              })
            )}
          </div>
        )}
      </div>
    </div>
  );
}
