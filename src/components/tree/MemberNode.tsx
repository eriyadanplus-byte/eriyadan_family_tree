import { memo } from 'react';
import { User } from 'lucide-react';

interface MemberNodeProps {
  data: {
    label: string;
    generation: number;
    isLate: boolean;
    isOnline?: boolean;
    isStub?: boolean;
    photo?: string | null;
    gender?: string;
    isSelected?: boolean;
    onClick?: () => void;
  };
}

function MemberNode({ data }: MemberNodeProps) {
  const initials = data.label?.charAt(0)?.toUpperCase() || '?';
  const bgClass = data.isLate
    ? 'bg-rose-500/15'
    : data.isStub
      ? 'bg-yellow-500/15'
      : 'bg-purple-500/15';
  const textClass = data.isLate
    ? 'text-rose-400'
    : data.isStub
      ? 'text-yellow-400'
      : 'text-purple-300';

  return (
      <div
        className={`px-3 py-2 rounded-xl glass-card cursor-pointer transition-all hover:border-purple-400/50 ${
          data.isSelected ? 'border-purple-400' : 'border-white/10'
        }`}
        onClick={data.onClick}
        style={{ minWidth: 44, minHeight: 44 }}
      >
        <div className="flex flex-col items-center gap-1 relative">
          {data.photo ? (
            <img
              src={data.photo}
              alt={data.label}
              className="w-10 h-10 rounded-full object-cover border border-white/10"
            />
          ) : (
            <div className={`w-10 h-10 rounded-full ${bgClass} flex items-center justify-center`}>
              <span className={`text-sm font-bold ${textClass}`}>{initials}</span>
            </div>
          )}
          {/* LED Status Indicator */}
          <div className={`absolute -top-1 -right-1 w-3 h-3 rounded-full border-2 border-gray-900 shadow-lg ${
            data.isLate ? 'bg-red-500 shadow-red-500/50' :
            data.isOnline ? 'bg-green-500 shadow-green-500/50' :
            'bg-orange-500 shadow-orange-500/50'
          }`} title={
            data.isLate ? 'Deceased' :
            data.isOnline ? 'Online' :
            'Offline (inactive > 10 min)'
          } />
          <span className="text-xs font-bold text-white font-display text-center line-clamp-2">
            {data.label}
          </span>
          <span className="text-[9px] text-purple-400 font-bold uppercase">
            Gen {data.generation}
          </span>
          {data.isLate && <span className="text-[8px] text-rose-400">Late</span>}
          {data.isStub && !data.isLate && <span className="text-[8px] text-yellow-400/70">Unclaimed</span>}
        </div>
      </div>
  );
}

export default memo(MemberNode);
