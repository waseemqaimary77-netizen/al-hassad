import { useState } from 'react';
import { CelebrationOverlay, Confetti } from '../components/CelebrationOverlay';
import {
  IconCheck,
  IconClose,
  IconCrown,
  IconEye,
  IconHome,
  IconPause,
  IconPlay,
  IconPlus,
  IconRewind,
} from '../components/Icons';
import { MatchBoardGrid } from '../components/MatchBoardGrid';
import { QuestionModal } from '../components/QuestionModal';
import { Scoreboard } from '../components/Scoreboard';
import { TiebreakerModal } from '../components/TiebreakerModal';
import { Button, ConfirmModal, Credits, Notice } from '../components/ui';
import { useAppStore } from '../context/AppStoreContext';
import { ASSETS, MATCH_TYPE_LABELS } from '../data/constants';
import { navigate } from '../utils/router';
import { playTone } from '../utils/sound';
import { getCurrentTurn, getMatchTeamInfo, needsTiebreaker } from '../utils/tournament';

export function BoardPage({ id }: { id: string }) {
  const { state, dispatch } = useAppStore();
  const match = state.matches.find((m) => m.id === id);
  const [tiebreakHidden, setTiebreakHidden] = useState(false);
  const [finishSideConfirm, setFinishSideConfirm] = useState<0 | 1 | null>(null);

  if (!match || match.manualResult) {
    return (
      <div className="p-8">
        <Notice>
          لا توجد لوحة لهذه المواجهة.{' '}
          <a className="font-bold underline" href="#/start">
            مواجهة جديدة
          </a>
        </Notice>
      </div>
    );
  }

  const teamInfo: [{ name: string; label: string }, { name: string; label: string }] = [
    getMatchTeamInfo(state, match, 0),
    getMatchTeamInfo(state, match, 1),
  ];
  const teamNames: [string, string] = [teamInfo[0].name, teamInfo[1].name];
  const currentTurn = getCurrentTurn(match);
  const hasActiveCell = !!match.activeCellId;
  const [scoreA, scoreB] = match.scores;
  const leaderSide: 0 | 1 | null = scoreA === scoreB ? null : scoreA > scoreB ? 0 : 1;
  const remainingCells = match.cells.filter((c) => !c.locked && !c.used).length;
  const winnerIndex = match.winnerId ? match.teamIds.indexOf(match.winnerId) : -1;

  const handleJudge = (side: 0 | 1 | null) => {
    setTiebreakHidden(false);
    dispatch({ type: 'match/judge', id: match.id, side, now: Date.now() });
    playTone(side === null ? [300, 220] : [523, 659, 784, 1047]);
  };

  return (
    <div className="flex min-h-screen flex-col gap-3 bg-linear-to-b from-sky-100 via-soft to-white p-3 md:px-6">
      <header className="flex items-center justify-between gap-3">
        <img
          src={ASSETS.committeeLogo}
          alt="شعار اللجنة العلمية"
          className="h-14 w-14 rounded-xl object-contain"
        />
        <div className="text-center">
          <h1 className="text-2xl font-black">أولمبياد الحصاد للعلوم</h1>
          <p className="font-bold text-royal">{MATCH_TYPE_LABELS[match.type]}</p>
        </div>
        <img src={ASSETS.schoolLogo} alt="شعار المدرسة" className="h-14 w-14 object-contain" />
      </header>

      <Scoreboard match={match} teams={teamInfo} />

      <div className="overflow-x-auto">
        <div className="min-w-[34rem]">
          <MatchBoardGrid
            large
            match={match}
            teamNames={teamNames}
            onSelect={(cellId) => {
              playTone([880], 0.08);
              dispatch({ type: 'match/open', id: match.id, cellId, now: Date.now() });
            }}
          />
        </div>
      </div>

      {match.status === 'setup' && (
        <div className="flex flex-wrap items-center justify-center gap-2">
          <span className="font-bold">يبدأ الاختيار:</span>
          {([0, 1] as const).map((side) => (
            <Button
              key={side}
              variant={match.starter === side ? 'soft' : 'ghost'}
              onClick={() => dispatch({ type: 'match/starter', id: match.id, starter: side })}
            >
              {teamNames[side]}
            </Button>
          ))}
          <Button
            variant="gold"
            onClick={() => dispatch({ type: 'match/start', id: match.id })}
          >
            <IconPlay />
            بدء المباراة
          </Button>
        </div>
      )}

      <footer className="mt-auto flex flex-wrap items-center justify-between gap-2 text-sm">
        <div className="flex gap-2">
          <Button variant="ghost" onClick={() => navigate('matches')}>
            <IconHome />
            الإدارة
          </Button>
          <Button variant="ghost" onClick={() => navigate('start')}>
            <IconPlus />
            مواجهة جديدة
          </Button>
        </div>

        {match.status === 'live' && (
          <div className="flex flex-wrap items-center gap-2">
            {([0, 1] as const).map((side) => (
              <span
                key={side}
                className="flex items-center gap-1 rounded-xl border border-line bg-white px-2 py-1"
              >
                <b className="max-w-28 truncate">{teamNames[side]}</b>
                {[100, -100].map((delta) => (
                  <button
                    key={delta}
                    type="button"
                    dir="ltr"
                    aria-label={`تعديل ${teamNames[side]} ${delta}`}
                    onClick={() =>
                      dispatch({ type: 'match/adjust', id: match.id, side, delta })
                    }
                    className="cursor-pointer rounded px-2 font-bold hover:bg-soft"
                  >
                    {delta > 0 ? '+' : ''}
                    {delta}
                  </button>
                ))}
              </span>
            ))}

            {leaderSide !== null && (
              <Button variant="gold" onClick={() => setFinishSideConfirm(leaderSide)}>
                <IconCrown />
                إنهاء وإعلان الفائز
              </Button>
            )}

            {needsTiebreaker(match) && tiebreakHidden && (
              <Button variant="gold" onClick={() => setTiebreakHidden(false)}>
                كسر التعادل
              </Button>
            )}
          </div>
        )}
      </footer>

      <Credits className="text-center" />

      {needsTiebreaker(match) && !tiebreakHidden && (
        <TiebreakerModal
          key={match.cells.length}
          names={teamNames}
          onClose={() => setTiebreakHidden(true)}
          onStart={(subject, first) =>
            dispatch({
              type: 'match/tiebreak',
              id: match.id,
              subject,
              first,
              now: Date.now(),
            })
          }
        />
      )}

      {hasActiveCell && (
        <QuestionModal
          match={match}
          names={teamNames}
          first={state.settings.firstSeconds ?? 45}
          sound
        >
          {match.answerRevealed ? (
            <div className="w-full">
              <p className="mb-2 text-xl font-extrabold">من أجاب إجابة صحيحة؟</p>
              <div className="flex flex-wrap justify-center gap-3">
                {[currentTurn, (currentTurn === 0 ? 1 : 0) as 0 | 1].map((side) => (
                  <Button
                    key={side}
                    variant="success"
                    className="px-8 py-4 text-2xl"
                    onClick={() => handleJudge(side)}
                  >
                    <IconCheck />
                    {teamNames[side]}
                  </Button>
                ))}
                <Button
                  variant="danger"
                  className="px-8 py-4 text-2xl"
                  onClick={() => handleJudge(null)}
                >
                  <IconClose />
                  لم يُجب أحد
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex flex-wrap justify-center gap-3">
              <Button
                variant="ghost"
                className="text-lg"
                onClick={() =>
                  dispatch({
                    type: 'timer/rewind',
                    id: match.id,
                    seconds: 5,
                    now: Date.now(),
                  })
                }
              >
                <IconRewind />
                إرجاع 5 ثوانٍ
              </Button>
              <Button
                variant="ghost"
                className="text-lg"
                onClick={() =>
                  dispatch({ type: 'timer/toggle', id: match.id, now: Date.now() })
                }
              >
                {match.timer.endsAt ? (
                  <>
                    <IconPause />
                    إيقاف مؤقت
                  </>
                ) : (
                  <>
                    <IconPlay />
                    متابعة
                  </>
                )}
              </Button>
              <Button
                className="px-8 text-lg"
                onClick={() =>
                  dispatch({ type: 'match/reveal', id: match.id, now: Date.now() })
                }
              >
                <IconEye />
                إظهار الإجابة
              </Button>
            </div>
          )}
        </QuestionModal>
      )}

      {match.celebration && (
        <CelebrationOverlay
          key={match.celebration.at}
          data={match.celebration}
          name={match.celebration.side === null ? '' : teamNames[match.celebration.side]}
        />
      )}

      {match.status === 'finished' && winnerIndex >= 0 && (
        <div className="fixed inset-0 z-30 grid place-items-center bg-white/85 p-4">
          <Confetti loop />
          <div className="pop rounded-[2.5rem] border-4 border-gold bg-amber-50 px-16 py-10 text-center shadow-2xl">
            <IconCrown className="mx-auto text-8xl text-gold" />
            <p className="mt-3 text-3xl font-bold text-mute">الفريق الفائز</p>
            <p className="text-6xl font-black">{teamNames[winnerIndex]}</p>
            <p className="mt-3 text-3xl font-black text-royal">
              {match.scores[winnerIndex]} نقطة
            </p>
            <div className="relative z-[70] mt-6 flex justify-center gap-3">
              <Button onClick={() => navigate('start')}>مواجهة جديدة</Button>
              <Button variant="ghost" onClick={() => navigate('matches')}>
                إدارة المواجهات
              </Button>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        open={finishSideConfirm !== null}
        title="إنهاء المباراة"
        message={
          finishSideConfirm !== null
            ? `${remainingCells ? `بقي ${remainingCells} سؤالاً. ` : ''}إنهاء المباراة وإعلان فوز «${teamNames[finishSideConfirm]}»؟`
            : ''
        }
        confirmLabel="إعلان الفائز"
        confirmVariant="gold"
        onCancel={() => setFinishSideConfirm(null)}
        onConfirm={() => {
          if (finishSideConfirm !== null) {
            dispatch({
              type: 'match/finish',
              id: match.id,
              winnerId: match.teamIds[finishSideConfirm],
            });
          }
          setFinishSideConfirm(null);
        }}
      />
    </div>
  );
}
