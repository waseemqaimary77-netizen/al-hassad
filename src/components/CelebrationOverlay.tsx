import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import type { MatchCelebration } from '../types/olympiad';
import { IconClock, IconCrown, IconParty, IconStar } from './Icons';

const CONFETTI_COLORS = ['#2563EB', '#0EA5E9', '#D4A017', '#4ADE80', '#F9A8D4', '#FDE047'];
const CELEBRATION_MS = 4000;

export function Confetti({ loop = false }: { loop?: boolean }) {
  const pieces = useMemo(
    () =>
      Array.from({ length: 140 }, (_, index) => ({
        left: Math.random() * 100,
        delay: Math.random() * (loop ? 4 : 0.8),
        time: 2.2 + Math.random() * 2,
        dx: (Math.random() - 0.5) * 220,
        rot: 360 + Math.random() * 900,
        color: CONFETTI_COLORS[index % CONFETTI_COLORS.length],
        round: index % 4 === 0,
      })),
    [loop]
  );

  return (
    <div aria-hidden={true} className="pointer-events-none fixed inset-0 z-[60] overflow-hidden">
      {pieces.map((p, index) => (
        <span
          key={index}
          className="confetti"
          style={
            {
              left: `${p.left}%`,
              width: 10,
              height: p.round ? 10 : 18,
              borderRadius: p.round ? 99 : 2,
              background: p.color,
              animationDelay: `${p.delay}s`,
              animationDuration: `${p.time}s`,
              animationIterationCount: loop ? 'infinite' : 1,
              '--dx': `${p.dx}px`,
              '--rot': `${p.rot}deg`,
            } as CSSProperties
          }
        />
      ))}
    </div>
  );
}

export function CelebrationOverlay({
  data,
  name,
}: {
  data: MatchCelebration;
  name: string;
}) {
  const [visible, setVisible] = useState(() => Date.now() - data.at < CELEBRATION_MS);

  useEffect(() => {
    const timer = window.setTimeout(
      () => setVisible(false),
      Math.max(0, CELEBRATION_MS - (Date.now() - data.at))
    );
    return () => window.clearTimeout(timer);
  }, [data.at]);

  if (!visible) return null;

  const hasWinner = data.side !== null;

  return (
    <div
      data-testid="celebration"
      onClick={() => setVisible(false)}
      className="fade-out fixed inset-0 z-50 grid cursor-pointer place-items-center bg-white/75 p-4 backdrop-blur-sm"
    >
      {hasWinner && <Confetti />}
      <div
        className={`pop relative rounded-[2.5rem] border-4 bg-white px-16 py-10 text-center shadow-2xl ${
          hasWinner ? 'border-gold' : 'border-slate-200'
        }`}
      >
        {hasWinner ? (
          <>
            <div className="relative mx-auto grid h-32 w-32 place-items-center">
              <span className="ring-burst absolute inset-0 rounded-full border-8 border-gold/50" />
              <span
                className="ring-burst absolute inset-0 rounded-full border-8 border-sky/40"
                style={{ animationDelay: '.5s' }}
              />
              <IconCrown className="text-8xl text-gold" />
            </div>
            <p className="mt-3 flex items-center justify-center gap-3 text-3xl font-extrabold text-royal">
              <IconParty />
              إجابة صحيحة!
              <IconParty />
            </p>
            <p className="mt-2 text-6xl font-black">{name}</p>
            <p
              className="pop mt-4 inline-flex items-center gap-3 rounded-full bg-ok px-10 py-3 text-5xl font-black text-green-800"
              style={{ animationDelay: '.35s' }}
            >
              <IconStar className="text-gold" />
              <bdi dir="ltr">+{data.points}</bdi>
            </p>
          </>
        ) : (
          <div className="shake">
            <IconClock className="mx-auto text-8xl text-slate-400" />
            <p className="mt-4 text-5xl font-black">لم يُجب أحد</p>
            <p className="mt-2 text-2xl text-mute">حظاً أوفر في السؤال القادم</p>
          </div>
        )}
      </div>
    </div>
  );
}
