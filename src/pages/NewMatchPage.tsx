import { useState } from 'react';
import { IconSchool, IconShapes } from '../components/Icons';
import { Button, Card, Field, Notice, PageHeader, inputClass } from '../components/ui';
import { useAppStore } from '../context/AppStoreContext';
import type { MatchType } from '../types/olympiad';
import { navigate } from '../utils/router';
import {
  buildBoardCells,
  createId,
  getTeamSectionLabel,
  validateMatchup,
} from '../utils/tournament';

const MATCH_TYPE_OPTIONS = [
  {
    type: 'sections' as const,
    title: 'مواجهة بين شعب',
    example: 'السادس أ ضد السادس ب',
    info: '9 أسئلة — 1800 نقطة',
    Icon: IconShapes,
  },
  {
    type: 'grades' as const,
    title: 'مواجهة بين صفوف',
    example: 'الصف السادس ضد الصف السابع',
    info: '18 سؤالاً — 3600 نقطة',
    Icon: IconSchool,
  },
];

export function NewMatchPage() {
  const { state, dispatch } = useAppStore();
  const [matchType, setMatchType] = useState<MatchType | null>(null);
  const [teamAId, setTeamAId] = useState('');
  const [teamBId, setTeamBId] = useState('');
  const [starter, setStarter] = useState<0 | 1>(0);
  const [friendly, setFriendly] = useState(false);

  const teamA = state.teams.find((t) => t.id === teamAId);
  const opponents = state.teams.filter(
    (t) =>
      teamA &&
      t.id !== teamA.id &&
      t.category === teamA.category &&
      (matchType === 'sections' ? t.grade === teamA.grade : t.grade !== teamA.grade)
  );

  const check =
    matchType && teamAId && teamBId
      ? validateMatchup(state, matchType, teamAId, teamBId, friendly)
      : null;

  const boardCheck = check?.ok
    ? buildBoardCells(check.type, check.category, state.questions)
    : null;

  const formatTeamOption = (id: string) => {
    const team = state.teams.find((t) => t.id === id);
    return team ? `${getTeamSectionLabel(state, team)} — ${team.name}` : '';
  };

  const handleCreate = () => {
    if (!matchType || !check?.ok) return;
    if (check.existing) {
      navigate(`board/${check.existing.id}`);
      return;
    }
    const matchId = createId('m');
    const next = dispatch({
      type: 'match/create',
      id: matchId,
      matchType,
      teamIds: [teamAId, teamBId],
      starter,
      friendly,
    });
    if (next.matches.some((m) => m.id === matchId)) {
      navigate(`board/${matchId}`);
    }
  };

  return (
    <>
      <PageHeader
        title="تحديد نوع المواجهة"
        subtitle="حدد النوع أولاً ثم اختر الفريقين. لا يتغير النوع بعد إنشاء المواجهة."
      />

      <div className="mb-5 grid gap-4 md:grid-cols-2">
        {MATCH_TYPE_OPTIONS.map(({ type, title, example, info, Icon }) => (
          <button
            key={type}
            type="button"
            aria-pressed={matchType === type}
            onClick={() => {
              setMatchType(type);
              setTeamAId('');
              setTeamBId('');
            }}
            className={`cursor-pointer rounded-3xl border-2 p-6 text-right shadow-card transition hover:-translate-y-0.5 ${
              matchType === type ? 'border-royal bg-soft' : 'border-line bg-white'
            }`}
          >
            <Icon className="mb-3 text-4xl text-royal" />
            <div className="text-2xl font-extrabold">{title}</div>
            <div className="mt-1 text-mute">مثال: {example}</div>
            <div className="mt-3 font-extrabold text-gold">{info}</div>
          </button>
        ))}
      </div>

      {matchType && (
        <Card className="fade-in space-y-4">
          <div className="grid gap-3 md:grid-cols-2">
            <Field label="الفريق الأول">
              <select
                className={inputClass}
                value={teamAId}
                onChange={(e) => {
                  setTeamAId(e.target.value);
                  setTeamBId('');
                }}
              >
                <option value="">اختر…</option>
                {state.teams.map((team) => (
                  <option key={team.id} value={team.id}>
                    {formatTeamOption(team.id)}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="الفريق الثاني">
              <select
                className={inputClass}
                value={teamBId}
                disabled={!teamAId}
                onChange={(e) => setTeamBId(e.target.value)}
              >
                <option value="">اختر…</option>
                {opponents.map((team) => (
                  <option key={team.id} value={team.id}>
                    {formatTeamOption(team.id)}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          {teamAId && !opponents.length && (
            <Notice tone="red">لا يوجد خصم مناسب لهذا النوع من المواجهات.</Notice>
          )}

          <fieldset>
            <legend className="mb-1 text-sm font-bold text-mute">من يبدأ باختيار السؤال؟</legend>
            <div className="flex flex-wrap gap-2">
              {([0, 1] as const).map((side) => (
                <Button
                  key={side}
                  variant={starter === side ? 'primary' : 'ghost'}
                  onClick={() => setStarter(side)}
                >
                  {formatTeamOption([teamAId, teamBId][side]) ||
                    (side ? 'الفريق الثاني' : 'الفريق الأول')}
                </Button>
              ))}
              <Button
                variant="soft"
                onClick={() => setStarter(Math.random() < 0.5 ? 0 : 1)}
              >
                قرعة
              </Button>
            </div>
          </fieldset>

          <label className="flex items-center gap-2 font-bold">
            <input
              type="checkbox"
              className="h-5 w-5 accent-royal"
              checked={friendly}
              onChange={(e) => setFriendly(e.target.checked)}
            />
            مواجهة ودية (لا تؤثر على شجرة التأهل)
          </label>

          {check && !check.ok && <Notice tone="red">{check.error}</Notice>}
          {boardCheck && !boardCheck.ok && <Notice tone="red">{boardCheck.error}</Notice>}
          {check?.ok && check.existing && <Notice>هذه المواجهة منشأة مسبقاً.</Notice>}

          <Button
            className="px-8 py-3 text-lg"
            disabled={!check?.ok || (!check.existing && !boardCheck?.ok)}
            onClick={handleCreate}
          >
            {check?.ok && check.existing ? 'فتح المواجهة' : 'إنشاء المواجهة'}
          </Button>
        </Card>
      )}
    </>
  );
}
