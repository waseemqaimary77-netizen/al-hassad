import { useState } from 'react';
import { useAppStore } from '../context/AppStoreContext';
import type { Bracket, BracketNode, Entrant } from '../types/olympiad';
import { navigate } from '../utils/router';
import { createId, getRoundTitle } from '../utils/tournament';
import { IconArrowDown, IconArrowUp, IconCrown } from './Icons';
import { Badge, Button, Notice } from './ui';

export function BracketView({
  bracket,
  editable = true,
}: {
  bracket: Bracket;
  editable?: boolean;
}) {
  const { state, dispatch } = useAppStore();
  const [error, setError] = useState('');

  const getTeamName = (entrant: Entrant | null): string | null =>
    entrant?.teamId ? (state.teams.find((t) => t.id === entrant.teamId)?.name ?? null) : null;

  const matchType = bracket.stage.startsWith('grade') ? 'sections' : 'grades';
  const orderLocked = state.matches.some((m) => m.slot?.stage === bracket.stage);

  const moveEntrant = (index: number, delta: -1 | 1) => {
    const order = bracket.entrants.map((e) => e.key);
    [order[index], order[index + delta]] = [order[index + delta], order[index]];
    dispatch({ type: 'order/set', stage: bracket.stage, order });
  };

  const createMatch = (node: BracketNode) => {
    if (!node.a?.teamId || !node.b?.teamId) return;
    const matchId = createId('m');
    const next = dispatch({
      type: 'match/create',
      id: matchId,
      matchType,
      teamIds: [node.a.teamId, node.b.teamId],
      starter: 0,
      friendly: false,
    });
    if (next.matches.some((m) => m.id === matchId)) {
      navigate(`board/${matchId}`);
    } else {
      setError('تعذر إنشاء المواجهة: تحقق من توفر أسئلة كافية في بنك الأسئلة.');
    }
  };

  const recordManualWinner = (node: BracketNode, winnerId: string) => {
    if (!node.a?.teamId || !node.b?.teamId) return;
    dispatch({
      type: 'match/manualResult',
      id: createId('m'),
      matchType,
      teamIds: [node.a.teamId, node.b.teamId],
      winnerId,
    });
  };

  const EntrantRow = ({ entrant, win }: { entrant: Entrant | null; win: boolean }) => (
    <div
      className={`rounded-lg px-3 py-2 ${win ? 'bg-ok font-extrabold text-green-900' : 'bg-page'}`}
    >
      <div className="font-bold">{entrant ? entrant.label : 'بانتظار المتأهل'}</div>
      <div className="text-sm text-mute">{entrant ? (getTeamName(entrant) ?? 'لم يتحدد الفريق') : '—'}</div>
    </div>
  );

  if (!bracket.entrants.length) {
    return <p className="text-mute">لا توجد شعب بعد.</p>;
  }

  return (
    <div className="space-y-4">
      {error && <Notice tone="red">{error}</Notice>}

      {editable && bracket.entrants.length > 2 && (
        <div className="rounded-xl border border-line p-3">
          <p className="mb-2 text-sm text-mute">
            {orderLocked
              ? 'القرعة مثبتة لوجود مباريات.'
              : 'ترتيب القرعة: كل اثنين متتاليين يتواجهان، والأخير في العدد الفردي يتأهل تلقائياً.'}
          </p>
          <ol className="flex flex-wrap gap-2">
            {bracket.entrants.map((entrant, index) => (
              <li
                key={entrant.key}
                className="flex items-center gap-1 rounded-lg bg-page px-2 py-1 text-sm font-bold"
              >
                {index + 1}. {entrant.label}
                <button
                  type="button"
                  aria-label={`تقديم ${entrant.label}`}
                  disabled={orderLocked || index === 0}
                  onClick={() => moveEntrant(index, -1)}
                  className="cursor-pointer p-1 disabled:opacity-30"
                >
                  <IconArrowUp />
                </button>
                <button
                  type="button"
                  aria-label={`تأخير ${entrant.label}`}
                  disabled={orderLocked || index === bracket.entrants.length - 1}
                  onClick={() => moveEntrant(index, 1)}
                  className="cursor-pointer p-1 disabled:opacity-30"
                >
                  <IconArrowDown />
                </button>
              </li>
            ))}
          </ol>
        </div>
      )}

      <div className="flex items-stretch gap-4 overflow-x-auto pb-2">
        {bracket.rounds.map((nodes, roundIndex) => (
          <div key={roundIndex} className="flex min-w-60 flex-1 flex-col justify-around gap-3">
            <h4 className="text-center font-extrabold text-royal">
              {getRoundTitle(bracket, roundIndex)}
            </h4>
            {nodes.map((node) => (
              <div
                key={node.index}
                data-testid={`node-${node.stage}-${node.round}-${node.index}`}
                className="space-y-2 rounded-2xl border border-line bg-white p-3 shadow-card"
              >
                <EntrantRow
                  entrant={node.a}
                  win={!!node.winner && node.winner.key === node.a?.key}
                />
                {node.bye ? (
                  <Badge tone="gold">تأهل تلقائي</Badge>
                ) : (
                  <EntrantRow
                    entrant={node.b}
                    win={!!node.winner && node.winner.key === node.b?.key}
                  />
                )}

                {editable && !node.bye && node.match && (
                  <Button
                    variant="ghost"
                    className="w-full"
                    onClick={() =>
                      node.match?.manualResult
                        ? navigate('matches')
                        : navigate(`board/${node.match?.id}`)
                    }
                  >
                    {node.match.manualResult ? 'نتيجة يدوية' : 'فتح المواجهة'}
                  </Button>
                )}

                {editable &&
                  !node.bye &&
                  !node.match &&
                  node.a?.teamId &&
                  node.b?.teamId && (
                    <div className="space-y-2">
                      <Button className="w-full" onClick={() => createMatch(node)}>
                        إنشاء المواجهة
                      </Button>
                      <div className="grid grid-cols-2 gap-2">
                        {[node.a, node.b].map((side) => (
                          <Button
                            key={side.key}
                            variant="ghost"
                            className="px-2 text-sm"
                            onClick={() => side.teamId && recordManualWinner(node, side.teamId)}
                          >
                            فاز {side.label}
                          </Button>
                        ))}
                      </div>
                    </div>
                  )}
              </div>
            ))}
          </div>
        ))}

        <div className="flex min-w-44 flex-col items-center justify-center rounded-2xl border-2 border-gold/50 bg-amber-50 p-4 text-center">
          <IconCrown className="text-4xl text-gold" />
          <div className="mt-2 text-sm font-bold text-mute">
            {matchType === 'sections' ? 'ممثل الصف' : 'بطل الفئة'}
          </div>
          <div className="text-lg font-extrabold">
            {getTeamName(bracket.champion) ?? 'لم يتحدد'}
          </div>
          {getTeamName(bracket.champion) && bracket.champion && (
            <div className="text-sm text-mute">{bracket.champion.label}</div>
          )}
        </div>
      </div>
    </div>
  );
}
