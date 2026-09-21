import { Info } from 'lucide-react';
import { useState } from 'react';

interface TooltipBadgeProps {
  type: 'ats' | 'job-board';
}

export default function TooltipBadge({ type }: TooltipBadgeProps) {
  const [show, setShow] = useState(false);

  const text =
    type === 'ats'
      ? 'Only applies to ATS-sourced jobs.'
      : 'Only applies to job-board-sourced jobs.';

  const label = type === 'ats' ? 'ATS only' : 'Job board only';

  const badgeColor =
    type === 'ats'
      ? 'bg-purple-50 text-purple-700 border-purple-200'
      : 'bg-sky-50 text-sky-700 border-sky-200';

  return (
    <div
      className="relative inline-flex items-center ml-2"
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      <span
        className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full border cursor-help ${badgeColor}`}
        aria-label={text}
      >
        <Info className="w-3 h-3" />
        {label}
      </span>

      {show && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max max-w-xs px-3 py-1.5 bg-gray-900 text-white text-xs rounded-lg shadow-lg z-30 pointer-events-none animate-in fade-in duration-150">
          {text}
          <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-gray-900" />
        </div>
      )}
    </div>
  );
}
