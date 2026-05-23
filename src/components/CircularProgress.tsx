"use client";

interface CircularProgressProps {
  /** Value between 0–100 for the ring fill */
  value: number;
  /** Display size in pixels */
  size?: number;
  /** Ring stroke width */
  strokeWidth?: number;
  /** Label below the number */
  label: string;
  /** Large number/icon in center */
  centerText: string;
  /** Accent color (Tailwind class, e.g. "text-[#4A7C59]") */
  color?: string;
  /** Subtle animation on mount */
  animated?: boolean;
}

export default function CircularProgress({
  value,
  size = 80,
  strokeWidth = 6,
  label,
  centerText,
  color = "text-[#4A7C59]",
  animated = true,
}: CircularProgressProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clampedValue = Math.max(0, Math.min(100, value));
  const offset = circumference - (clampedValue / 100) * circumference;

  // Extract the actual CSS color value for the ring
  const ringColor = "currentColor";

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width: size, height: size }}>
        {/* Background ring */}
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          className={`-rotate-90 ${animated ? "animate-in fade-in duration-500" : ""}`}
          aria-label={`${label}: ${centerText}`}
          role="progressbar"
          aria-valuenow={clampedValue}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            className="text-[#E6E4DA]"
          />
          {/* Foreground ring */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            className={color}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            style={{
              transition: animated ? "stroke-dashoffset 0.8s ease-out" : undefined,
            }}
          />
        </svg>
        {/* Center text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`text-lg font-bold leading-none ${color}`}>
            {centerText}
          </span>
        </div>
      </div>
      <span className="text-[11px] text-[#9B9B9B] font-medium tracking-wide">
        {label}
      </span>
    </div>
  );
}
