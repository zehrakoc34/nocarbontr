interface NoCarbonLogoProps {
  size?: number;
  showText?: boolean;
  className?: string;
}

export function NoCarbonLogo({ size = 40, showText = true, className = "" }: NoCarbonLogoProps) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* Icon mark */}
      <svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* N letter - dark slate */}
        <path
          d="M8 14 L8 72 L18 72 L18 34 L38 72 L48 72 L48 14 L38 14 L38 52 L18 14 Z"
          fill="#334155"
        />
        {/* Green accent on N diagonal */}
        <path
          d="M18 34 L38 72 L42 72 L22 34 Z"
          fill="#10b981"
        />
        {/* O outer ring - dark slate arc (top-left portion) */}
        <path
          d="M58 14 C72 14 84 26 84 50 C84 60 80 69 74 75"
          stroke="#334155"
          strokeWidth="8"
          fill="none"
          strokeLinecap="round"
        />
        {/* O outer ring - green arc (bottom-right portion) */}
        <path
          d="M74 75 C68 81 62 84 55 84 C41 84 29 72 29 58"
          stroke="#10b981"
          strokeWidth="8"
          fill="none"
          strokeLinecap="round"
        />
        {/* O inner circle */}
        <circle cx="65" cy="50" r="14" fill="white" />
        <circle cx="65" cy="50" r="10" stroke="#10b981" strokeWidth="2" fill="none" />
        {/* Leaf shape inside O */}
        <path
          d="M65 42 C70 46 72 52 68 58 C64 54 62 48 65 42 Z"
          fill="#10b981"
        />
        <path
          d="M65 58 C60 54 58 48 62 42 C66 46 68 52 65 58 Z"
          fill="#10b981"
          opacity="0.5"
        />
        {/* Dot accent */}
        <circle cx="87" cy="26" r="5" fill="#10b981" />
      </svg>

      {/* Text */}
      {showText && (
        <span className="font-bold tracking-tight" style={{ fontSize: size * 0.55 }}>
          <span style={{ color: "#334155" }}>nocarbon</span>
          <span style={{ color: "#10b981" }}>tr</span>
        </span>
      )}
    </div>
  );
}
