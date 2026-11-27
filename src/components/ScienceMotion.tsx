const ORBIT_DURATIONS = [8, 10.5, 13];
const ORBIT_PATH = 'M 20 200 a 180 62 0 1 0 360 0 a 180 62 0 1 0 -360 0';
const ORBIT_COLORS = ['#2563EB', '#0EA5E9', '#D4A017'];

export function AtomOrbitSvg({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 400 400" aria-hidden={true} className={className}>
      <g className="orbit">
        {[0, 60, 120].map((angle, index) => (
          <g key={angle} transform={`rotate(${angle} 200 200)`}>
            <path
              d={ORBIT_PATH}
              fill="none"
              stroke={ORBIT_COLORS[index]}
              strokeWidth="2.5"
              opacity="0.5"
            />
            {[0, 1].map((electron) => (
              <circle
                key={electron}
                r={electron ? 6 : 9}
                fill={ORBIT_COLORS[index]}
              >
                <animateMotion
                  path={ORBIT_PATH}
                  dur={`${ORBIT_DURATIONS[index]}s`}
                  begin={`-${(electron * ORBIT_DURATIONS[index]) / 2}s`}
                  repeatCount="indefinite"
                />
              </circle>
            ))}
          </g>
        ))}
      </g>
    </svg>
  );
}

export function DnaHelixSvg({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 360" aria-hidden={true} className={className}>
      {Array.from({ length: 18 }, (_, index) => {
        const delayStyle = { animationDelay: `-${index * 0.28}s` };
        const y = 10 + index * 20;
        return (
          <g key={index}>
            <line
              className="dna-rung"
              style={delayStyle}
              x1="14"
              x2="86"
              y1={y}
              y2={y}
              stroke={index % 2 ? '#D4A017' : '#94A3B8'}
              strokeWidth="3"
              strokeLinecap="round"
            />
            <circle className="dna-a" style={delayStyle} cx="50" cy={y} r="7" fill="#2563EB" />
            <circle className="dna-b" style={delayStyle} cx="50" cy={y} r="7" fill="#0EA5E9" />
          </g>
        );
      })}
    </svg>
  );
}
