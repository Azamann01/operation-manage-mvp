export function ProgressRing({
  percent,
  label,
  sublabel,
  size = 96,
  stroke = 9,
}: {
  percent: number;
  label: string;
  sublabel: string;
  size?: number;
  stroke?: number;
}) {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.min(100, Math.max(0, percent));
  const offset = circumference - (clamped / 100) * circumference;

  return (
    <div className="flex items-center gap-4">
      <div className="relative shrink-0" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            strokeWidth={stroke}
            className="stroke-muted"
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className="stroke-indigo-500 transition-[stroke-dashoffset] duration-700 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xl font-semibold tabular-nums">{Math.round(clamped)}%</span>
        </div>
      </div>
      <div>
        <p className="font-medium">{label}</p>
        <p className="text-xs text-muted-foreground">{sublabel}</p>
      </div>
    </div>
  );
}
