import { useEffect, useRef, useState, type ReactNode } from 'react';
import { getDifficultyName, getSubjectName } from '../data/constants';
import type { Match, MatchTimer } from '../types/olympiad';
import { playTone } from '../utils/sound';
import { getCurrentTurn } from '../utils/tournament';

function useCountdown(timer: MatchTimer): number {
  const [, setTick] = useState(0);

  useEffect(() => {
    if (!timer.endsAt) return;
    const interval = window.setInterval(() => setTick((t) => t + 1), 200);
    return () => window.clearInterval(interval);
  }, [timer.endsAt]);

  return timer.endsAt
    ? Math.max(0, Math.min(timer.duration, Math.ceil((timer.endsAt - Date.now()) / 1000)))
    : timer.remaining;
}

function getTimerPhase(
  remaining: number,
  duration: number,
  firstSeconds: number
): { phase: 0 | 1 | 2; count: number } {
  const stealWindow = Math.max(0, duration - firstSeconds);
  if (remaining > stealWindow) {
    return { phase: 0, count: remaining - stealWindow };
  }
  if (remaining > 0) {
    return { phase: 1, count: remaining };
  }
  return { phase: 2, count: 0 };
}

export function QuestionModal({
  match,
  names,
  first,
  sound = false,
  children,
}: {
  match: Match;
  names: [string, string];
  first: number;
  sound?: boolean;
  children?: ReactNode;
}) {
  const activeCell = match.cells.find((c) => c.id === match.activeCellId);
  const remaining = useCountdown(match.timer);
  const { phase, count } = getTimerPhase(remaining, match.timer.duration, first);
  const prevPhaseRef = useRef(phase);

  useEffect(() => {
    if (sound && !match.answerRevealed && phase > prevPhaseRef.current) {
      playTone(phase === 1 ? [660, 660] : [440, 330, 220], 0.22);
    }
    prevPhaseRef.current = phase;
  }, [phase, sound, match.answerRevealed]);

  if (!activeCell?.question) return null;

  const currentTeam = getCurrentTurn(match);
  const otherTeam = currentTeam === 0 ? 1 : 0;

  const phaseText = [
    `الوقت لفريق «${names[currentTeam]}»`,
    `انتهى وقت «${names[currentTeam]}» — الإجابة الآن لفريق «${names[otherTeam]}»`,
    'انتهى الوقت',
  ][phase];

  const phaseClass = [
    'bg-soft text-royal',
    'bg-amber-100 text-amber-800',
    'bg-err text-red-700',
  ][phase];

  const progressPct = (remaining / match.timer.duration) * 100;
  const splitPct = ((match.timer.duration - first) / match.timer.duration) * 100;

  return (
    <div className="fixed inset-0 z-40 overflow-y-auto bg-linear-to-b from-sky-100 via-soft to-white p-4 md:p-6">
      <div className="fade-in mx-auto flex min-h-full max-w-6xl flex-col items-center gap-4 text-center">
        <p className="text-2xl font-extrabold text-gold">
          {activeCell.tiebreakFirst !== undefined ? 'سؤال كسر التعادل · ' : ''}
          {getSubjectName(activeCell.subject)} · {getDifficultyName(activeCell.difficulty)} ·{' '}
          {activeCell.points} نقطة
        </p>

        {!match.answerRevealed && (
          <>
            <div
              data-testid="timer"
              className={`grid h-32 w-32 shrink-0 place-items-center rounded-full border-8 bg-white text-6xl font-black shadow-card ${
                phase === 0
                  ? 'border-sky text-royal'
                  : phase === 1
                    ? 'border-gold text-amber-700'
                    : 'border-red-300 text-red-600'
              }`}
            >
              {count}
            </div>

            <div
              key={phase}
              data-testid="phase"
              role="status"
              className={`pop rounded-full px-8 py-3 text-2xl font-black md:text-3xl ${phaseClass}`}
            >
              {phaseText}
              {!match.timer.endsAt && phase < 2 ? ' (متوقف)' : ''}
            </div>

            <div className="relative h-3 w-full max-w-3xl rounded-full bg-white">
              <div
                className={`absolute inset-y-0 right-0 rounded-full transition-all ${
                  phase === 0 ? 'bg-sky' : 'bg-gold'
                }`}
                style={{ width: `${progressPct}%` }}
              />
              <div
                className="absolute -inset-y-1 w-1 rounded bg-ink/40"
                style={{ right: `${splitPct}%` }}
              />
            </div>
          </>
        )}

        <div className="w-full rounded-3xl border-4 border-gold/60 bg-white p-6 shadow-xl md:p-10">
          <p className="text-3xl font-black leading-relaxed md:text-5xl">
            <bdi>{activeCell.question.text}</bdi>
          </p>

          {match.answerRevealed && (
            <div className="pop mx-auto mt-6 w-fit rounded-2xl bg-ok px-10 py-4">
              <p className="text-3xl font-black text-green-900 md:text-4xl">
                <bdi>{activeCell.question.answer}</bdi>
              </p>
              {activeCell.question.explanation && (
                <p className="mt-1 text-xl text-green-800">{activeCell.question.explanation}</p>
              )}
            </div>
          )}
        </div>

        {children}
      </div>
    </div>
  );
}
