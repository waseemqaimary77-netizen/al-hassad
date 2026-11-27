const ORBIT_DURATIONS = [3.2, 3.5, 3.8];
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
                  calcMode="paced"
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
