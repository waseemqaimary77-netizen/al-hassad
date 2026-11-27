import { useState } from 'react';
import { BracketView } from '../components/BracketView';
import { IconPlus, IconTrash } from '../components/Icons';
import { Badge, Button, Card, Notice, PageHeader, inputClass } from '../components/ui';
import { useAppStore } from '../context/AppStoreContext';
import { CATEGORIES, GRADES, GRADE_NAMES } from '../data/constants';
import type { Grade } from '../types/olympiad';
import {
  createId,
  getGradeBracket,
  getSectionsForGrade,
  getTeamForSection,
  hasGradeStarted,
} from '../utils/tournament';

export function ClassesPage() {
  const { state, dispatch } = useAppStore();
  const [selectedGrade, setSelectedGrade] = useState<Grade>(6);
  const [sectionName, setSectionName] = useState('');

  const sections = getSectionsForGrade(state, selectedGrade);
  const locked = hasGradeStarted(state, selectedGrade);
  const missingTeams = sections.filter((s) => !getTeamForSection(state, s.id));
  const duplicateSection = sections.some((s) => s.name === sectionName.trim());

  return (
    <>
      <PageHeader title="الصفوف والشعب" subtitle="نظّم الشعب والتصفيات الداخلية لكل صف" />

      <div className="mb-4 space-y-2">
        {CATEGORIES.map((category) => (
          <div key={category.id} className="flex flex-wrap items-center gap-2">
            <span className="w-24 font-bold text-mute">{category.name}</span>
            {GRADES.filter((grade) => category.grades.includes(grade)).map((grade) => (
              <Button
                key={grade}
                variant={grade === selectedGrade ? 'primary' : 'ghost'}
                onClick={() => {
                  setSelectedGrade(grade);
                  setSectionName('');
                }}
              >
                {GRADE_NAMES[grade]} ({getSectionsForGrade(state, grade).length})
              </Button>
            ))}
          </div>
        ))}
      </div>

      <Card className="mb-4">
        <h2 className="mb-3 text-xl font-extrabold">شعب الصف {GRADE_NAMES[selectedGrade]}</h2>
        <form
          className="mb-4 flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            dispatch({
              type: 'section/add',
              grade: selectedGrade,
              name: sectionName,
              id: createId('s'),
            });
            setSectionName('');
          }}
        >
          <input
            aria-label="اسم الشعبة"
            className={`${inputClass} max-w-56`}
            placeholder="اسم الشعبة (مثل: د)"
            maxLength={10}
            value={sectionName}
            onChange={(e) => setSectionName(e.target.value)}
            disabled={locked}
          />
          <Button type="submit" disabled={locked || !sectionName.trim() || duplicateSection}>
            <IconPlus />
            إضافة شعبة
          </Button>
        </form>

        {locked && (
          <Notice>بدأت مباريات هذا الصف، لذلك لا يمكن إضافة الشعب أو حذفها.</Notice>
        )}
        {duplicateSection && <Notice tone="red">هذه الشعبة موجودة.</Notice>}

        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {sections.map((section) => {
            const team = getTeamForSection(state, section.id);
            return (
              <div
                key={section.id}
                className="flex items-center justify-between rounded-xl border border-line p-3"
              >
                <div>
                  <div className="font-extrabold">
                    {GRADE_NAMES[selectedGrade]} {section.name}
                  </div>
                  {team ? (
                    <div className="text-sm text-mute">{team.name}</div>
                  ) : (
                    <a className="text-sm font-bold text-royal underline" href="#/teams">
                      أضف فريقاً
                    </a>
                  )}
                </div>
                <button
                  type="button"
                  aria-label={`حذف الشعبة ${section.name}`}
                  title={team ? 'احذف فريق الشعبة أولاً' : 'حذف'}
                  disabled={!!team || locked}
                  onClick={() => dispatch({ type: 'section/remove', id: section.id })}
                  className="cursor-pointer rounded-lg p-2 text-red-600 hover:bg-err disabled:opacity-25"
                >
                  <IconTrash />
                </button>
              </div>
            );
          })}
        </div>
      </Card>

      <Card>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-xl font-extrabold">التصفيات الداخلية</h2>
          {sections.length === 1 && !missingTeams.length && (
            <Badge tone="green">شعبة واحدة: يتأهل فريقها مباشرة</Badge>
          )}
        </div>

        {missingTeams.length > 0 && (
          <div className="mb-3">
            <Notice tone="red">
              لا يُعتمد ممثل الصف حتى يكون لكل شعبة فريق (
              {missingTeams.map((s) => s.name).join('، ')}).
            </Notice>
          </div>
        )}

        <BracketView bracket={getGradeBracket(state, selectedGrade)} />
      </Card>
    </>
  );
}
