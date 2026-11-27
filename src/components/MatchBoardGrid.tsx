import { DIFFICULTIES, SUBJECTS } from '../data/constants';
import type { Match, SubjectId } from '../types/olympiad';
import { getCellBlockReason } from '../utils/tournament';
import {
  IconBiology,
  IconCheck,
  IconChemistry,
  IconClose,
  IconLock,
  IconPhysics,
} from './Icons';

const SUBJECT_ICONS: Record<SubjectId, typeof IconChemistry> = {
  chemistry: IconChemistry,
  biology: IconBiology,
  physics: IconPhysics,
};

export function MatchBoardGrid({
  match,
  teamNames,
  onSelect,
  large = false,
}: {
  match: Match;
  teamNames: [string, string];
  onSelect?: (cellId: string) => void;
  large?: boolean;
}) {
  return (
    <div
      data-testid="board"
      className={`grid grid-cols-[auto_1fr_1fr_1fr] ${large ? 'gap-2 2xl:gap-3' : 'gap-2'}`}
    >
      <div />
      {SUBJECTS.map((subject) => {
        const SubjectIcon = SUBJECT_ICONS[subject.id];
        return (
          <div
            key={subject.id}
            className="flex items-center justify-center gap-2 rounded-xl border-b-4 border-sky bg-white py-2 text-lg font-extrabold shadow-card"
          >
            <SubjectIcon className="text-royal" />
            {subject.name}
          </div>
        );
      })}

      {DIFFICULTIES.flatMap((difficulty) =>
        ([0, 1] as const).map((slot) => (
          <div key={`${difficulty.id}${slot}`} className="contents">
            <div className="flex min-w-20 flex-col items-center justify-center rounded-xl bg-white/80 px-2 text-center">
              <span className="font-extrabold">{difficulty.name}</span>
              {match.type === 'grades' && match.strictSets && (
                <span className="max-w-28 truncate text-xs text-mute">{teamNames[slot]}</span>
              )}
            </div>

            {SUBJECTS.map((subject) => {
              const cell = match.cells.find(
                (c) =>
                  c.subject === subject.id && c.difficulty === difficulty.id && c.slot === slot
              );
              if (!cell) return null;

              const blockReason = getCellBlockReason(match, cell.id);
              const isActive = match.activeCellId === cell.id;
              const visualState = cell.locked
                ? 'locked'
                : isActive
                  ? 'active'
                  : cell.used
                    ? 'used'
                    : 'open';
              const selectable = !!onSelect && !blockReason;

              const stateClasses = {
                locked: 'border-dashed border-slate-300 bg-slate-100 text-slate-400 opacity-60',
                used: 'border-line bg-slate-100 text-slate-400',
                active: 'border-gold bg-amber-50 text-gold ring-4 ring-gold/30',
                open: `border-sky/40 bg-white text-royal shadow-card ${
                  selectable ? 'cursor-pointer hover:-translate-y-0.5 hover:bg-soft' : ''
                }`,
              }[visualState];

              return (
                <button
                  key={cell.id}
                  type="button"
                  data-testid="cell"
                  data-state={visualState}
                  disabled={!selectable}
                  title={onSelect ? (blockReason ?? 'اختيار السؤال') : undefined}
                  aria-label={`${subject.name} ${cell.points}${
                    cell.locked ? ' مقفلة' : cell.used ? ' مستهلكة' : ''
                  }`}
                  onClick={() => onSelect?.(cell.id)}
                  className={`flex items-center justify-center gap-2 rounded-xl border-2 font-extrabold transition ${
                    large ? 'h-[8.2vh] min-h-12 text-3xl 2xl:text-4xl' : 'h-16 text-2xl'
                  } ${stateClasses}`}
                >
                  {cell.locked ? (
                    <>
                      <IconLock />
                      <span className="text-sm">غير متاحة</span>
                    </>
                  ) : cell.used && !isActive ? (
                    <>
                      {cell.awardedTo === null ? <IconClose /> : <IconCheck />}
                      <span className="text-sm">
                        {cell.awardedTo === null ? 'مستهلك' : teamNames[cell.awardedTo]}
                      </span>
                    </>
                  ) : (
                    cell.points
                  )}
                </button>
              );
            })}
          </div>
        ))
      )}
    </div>
  );
}
