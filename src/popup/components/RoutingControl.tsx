import type { RoutingMode } from '../../shared/types';

interface RoutingControlProps {
  mode: RoutingMode;
  disabled: boolean;
  onSelect: (mode: RoutingMode) => void;
}

const OPTIONS: ReadonlyArray<{
  mode: RoutingMode;
  label: string;
  hint: string;
  accent: string;
}> = [
  { mode: 'left', label: 'Left only', hint: 'L', accent: 'bg-left/20 ring-left text-left' },
  {
    mode: 'stereo',
    label: 'Stereo',
    hint: 'L+R',
    accent: 'bg-accent-500/20 ring-accent-500 text-accent-400',
  },
  { mode: 'right', label: 'Right only', hint: 'R', accent: 'bg-right/20 ring-right text-right' },
];

export function RoutingControl({ mode, disabled, onSelect }: RoutingControlProps) {
  return (
    <div
      role="radiogroup"
      aria-label="Audio routing"
      className="grid grid-cols-3 gap-2"
    >
      {OPTIONS.map((option) => {
        const active = option.mode === mode;
        const baseClasses =
          'flex flex-col items-center justify-center rounded border border-ink-700 bg-ink-800 px-3 py-2 text-xs font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-500';
        const stateClasses = active
          ? `ring-2 ${option.accent}`
          : 'text-ink-200 hover:bg-ink-700';
        const disabledClasses = disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer';

        return (
          <button
            key={option.mode}
            type="button"
            role="radio"
            aria-checked={active}
            disabled={disabled}
            onClick={() => onSelect(option.mode)}
            className={`${baseClasses} ${stateClasses} ${disabledClasses}`}
          >
            <span>{option.label}</span>
            <span className="mt-0.5 text-[10px] text-ink-400">{option.hint}</span>
          </button>
        );
      })}
    </div>
  );
}
