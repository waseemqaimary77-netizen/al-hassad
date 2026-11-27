import { useState } from 'react';
import { BracketView } from '../components/BracketView';
import { IconCrown } from '../components/Icons';
import { Badge, Button, Card, Notice, PageHeader } from '../components/ui';
import { useAppStore } from '../context/AppStoreContext';
import { CATEGORIES, GRADE_NAMES, TEAM_STATUS_LABELS } from '../data/constants';
import type { CategoryId, TeamStatus } from '../types/olympiad';
import {
  getCategoryStatus,
  getGradeRepresentativeId,
  getMainBracket,
  getTeamSectionLabel,
  getTeamStatus,
} from '../utils/tournament';

const TEAM_STATUS_TONES: Record<TeamStatus, 'gold' | 'red' | 'green' | 'blue'> = {
  champion: 'gold',
  out: 'red',
  rep: 'green',
  in: 'blue',
};

export function TournamentsPage() {
  const { state } = useAppStore();
  const [categoryId, setCategoryId] = useState<CategoryId>(1);
  const category = CATEGORIES[categoryId - 1];
  const bracket = getMainBracket(state, categoryId);
  const champion = state.teams.find((t) => t.id === bracket.champion?.teamId);

  return (
    <>
      <PageHeader
        title="البطولات والفئات"
        subtitle="بطولتان مستقلتان بنظام خروج المغلوب"
        actions={CATEGORIES.map((cat) => (
          <Button
            key={cat.id}
            variant={cat.id === categoryId ? 'primary' : 'ghost'}
            onClick={() => setCategoryId(cat.id)}
          >
            {cat.name}
          </Button>
        ))}
      />

      {champion && (
        <Card className="mb-4 flex items-center gap-4 border-gold bg-amber-50">
          <IconCrown className="text-5xl text-gold" />
          <div>
            <div className="font-bold text-mute">الفائز في {category.name}</div>
            <div className="text-3xl font-black">
              {champion.name} — {getTeamSectionLabel(state, champion)}
            </div>
          </div>
        </Card>
      )}

      <Card className="mb-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-xl font-extrabold">
            {category.name} ({category.range})
          </h2>
          <Badge>{getCategoryStatus(state, categoryId)}</Badge>
        </div>

        <div className="mb-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {category.grades.map((grade) => {
            const repId = getGradeRepresentativeId(state, grade);
            const rep = state.teams.find((t) => t.id === repId);
            return (
              <div key={grade} className="rounded-xl bg-page p-3">
                <div className="font-extrabold">الصف {GRADE_NAMES[grade]}</div>
                <div className={rep ? 'font-bold text-green-700' : 'text-mute'}>
                  {rep ? `الممثل: ${rep.name}` : 'لم يتأهل ممثل بعد'}
                </div>
              </div>
            );
          })}
        </div>

        <Notice>
          تصفيات الشعب تُدار من صفحة «الصفوف والشعب»، وبعد تحديد ممثلي الصفوف تظهر مواجهاتهم هنا.
        </Notice>

        <div className="mt-4">
          <BracketView bracket={bracket} />
        </div>
      </Card>

      <Card>
        <h2 className="mb-3 text-xl font-extrabold">حالة الفرق</h2>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {state.teams
            .filter((team) => team.category === categoryId)
            .map((team) => {
              const status = getTeamStatus(state, team);
              return (
                <div
                  key={team.id}
                  className="flex items-center justify-between gap-2 rounded-xl border border-line p-3"
                >
                  <div>
                    <div className="font-bold">{team.name}</div>
                    <div className="text-sm text-mute">{getTeamSectionLabel(state, team)}</div>
                  </div>
                  <Badge tone={TEAM_STATUS_TONES[status]}>{TEAM_STATUS_LABELS[status]}</Badge>
                </div>
              );
            })}
        </div>
      </Card>
    </>
  );
}
