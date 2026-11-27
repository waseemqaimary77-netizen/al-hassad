import { useEffect, useRef, useState } from 'react';
import { playTone } from '../utils/sound';

const WHEEL_COLORS = ['#2563EB', '#D4A017', '#0EA5E9'];
const SPIN_DURATION_MS = 3600;

function polarToCartesian(angleDeg: number, radius: number): [number, number] {
  const rad = (angleDeg * Math.PI) / 180;
  return [100 + radius * Math.sin(rad), 100 - radius * Math.cos(rad)];
}

export function SpinWheel({
  items,
  onResult,
  onSpin,
  disabled = false,
  size = 'h-52 w-52',
}: {
  items: string[];
  onResult: (index: number) => void;
  onSpin?: () => void;
  disabled?: boolean;
  size?: string;
}) {
  const [rotation, setRotation] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const timeoutRef = useRef<number>(0);

  useEffect(() => () => window.clearTimeout(timeoutRef.current), []);

  const sliceAngle = 360 / items.length;

  const spin = () => {
    const selectedIndex = Math.floor(Math.random() * items.length);
    const targetOffset =
      (selectedIndex + 0.5) * sliceAngle + (Math.random() - 0.5) * sliceAngle * 0.6;
    setRotation((prev) => (Math.ceil(prev / 360) + 6) * 360 - targetOffset);
    setSpinning(true);
    onSpin?.();
    playTone([523, 587, 659], 0.09);
    timeoutRef.current = window.setTimeout(() => {
      setSpinning(false);
      playTone([784, 1047], 0.18);
      onResult(selectedIndex);
    }, SPIN_DURATION_MS + 100);
  };

  return (
    <div className="flex flex-col items-center gap-2">
      <div className={`relative ${size}`}>
        <div className="absolute -top-1 left-1/2 z-10 -translate-x-1/2 border-x-[12px] border-t-[22px] border-x-transparent border-t-red-500 drop-shadow" />
        <svg
          viewBox="0 0 200 200"
          className="h-full w-full drop-shadow-lg"
          style={{
            transform: `rotate(${rotation}deg)`,
            transition: `transform ${SPIN_DURATION_MS}ms cubic-bezier(.15,.85,.2,1)`,
          }}
        >
          {items.map((label, index) => {
            const [x1, y1] = polarToCartesian(index * sliceAngle, 96);
            const [x2, y2] = polarToCartesian((index + 1) * sliceAngle, 96);
            const midAngle = (index + 0.5) * sliceAngle;
            const [tx, ty] = polarToCartesian(midAngle, 56);
            const text = label.length > 14 ? `${label.slice(0, 13)}…` : label;

            return (
              <g key={index}>
                <path
                  d={`M100 100 L${x1} ${y1} A96 96 0 0 1 ${x2} ${y2} Z`}
                  fill={WHEEL_COLORS[index % WHEEL_COLORS.length]}
                  stroke="#fff"
                  strokeWidth="3"
                />
                <text
                  x={tx}
                  y={ty}
                  transform={`rotate(${midAngle} ${tx} ${ty})`}
                  fill="#fff"
                  fontWeight="800"
                  fontSize={text.length > 9 ? 11 : 15}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  direction="rtl"
                >
                  {text}
                </text>
              </g>
            );
          })}
          <circle cx="100" cy="100" r="13" fill="#fff" stroke="#D4A017" strokeWidth="4" />
        </svg>
      </div>
      <button
        type="button"
        disabled={disabled || spinning}
        onClick={spin}
        className="cursor-pointer rounded-full bg-royal px-7 py-2 text-lg font-extrabold text-white shadow disabled:cursor-not-allowed disabled:opacity-45"
      >
        {spinning ? 'تدور…' : 'أدر العجلة'}
      </button>
    </div>
  );
}
