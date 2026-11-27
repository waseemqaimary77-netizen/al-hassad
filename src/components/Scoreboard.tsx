import type { Match } from '../types/olympiad';
import { getCurrentTurn } from '../utils/tournament';

export function Scoreboard({
  match,
  teams,
}: {
  match: Match;
  teams: [{ name: string; label: string }, { name: string; label: string }];
}) {
  const turn = getCurrentTurn(match);
  const isLive = match.status === 'live';

  return (
    <>
      <div className="grid grid-cols-2 gap-3">
        {([0, 1] as const).map((side) => (
          <div
            key={side}
            className={`flex items-center justify-between gap-3 rounded-2xl border-4 bg-white px-5 py-2 shadow-card transition ${
              isLive && turn === side ? 'border-gold' : 'border-white'
            }`}
          >
            <div className="min-w-0">
              <div className="truncate text-2xl font-black md:text-3xl">{teams[side].name}</div>
              <div className="text-mute">{teams[side].label}</div>
            </div>
            <div
              data-testid={`score-${side}`}
              className="text-4xl font-black text-royal md:text-6xl"
            >
              {match.scores[side]}
            </div>
          </div>
        ))}
      </div>

      {isLive && (
        <div
          data-testid="turnbar"
          role="status"
          className="rounded-full border-2 border-gold bg-amber-50 py-1.5 text-center text-xl font-extrabold"
        >
          دور الاختيار الآن: <span className="text-royal">{teams[turn].name}</span>
        </div>
      )}
    </>
  );
}
