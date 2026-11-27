import { useState, type FormEvent } from 'react';
import { IconPencil, IconPlus, IconTrash } from '../components/Icons';
import {
  Badge,
  Button,
  Card,
  ConfirmModal,
  Field,
  Modal,
  Notice,
  PageHeader,
  inputClass,
} from '../components/ui';
import { useAppStore } from '../context/AppStoreContext';
import { CATEGORIES, GRADES, GRADE_NAMES, getGradeCategory } from '../data/constants';
import type { CategoryId, Grade, Team } from '../types/olympiad';
import {
  createId,
  getSectionsForGrade,
  getTeamForSection,
  getTeamSectionLabel,
  hasGradeStarted,
} from '../utils/tournament';

function TeamFormModal({ initial, onClose }: { initial: Team | null; onClose: () => void }) {
  const { state, dispatch } = useAppStore();
  const [form, setForm] = useState<Team>(
    initial ?? {
      id: createId('t'),
      name: '',
      category: 1,
      grade: 6,
      sectionId: '',
      students: ['', '', '', ''],
    }
  );
  const [error, setError] = useState('');

  const locked = !!initial && (hasGradeStarted(state, initial.grade) || state.matches.some((m) => m.teamIds.includes(initial.id)));

  const availableSections = getSectionsForGrade(state, form.grade).filter((section) => {
    const existing = getTeamForSection(state, section.id);
    return !existing || existing.id === form.id;
  });

  const handleGradeChange = (grade: Grade) => {
    setForm({ ...form, grade, category: getGradeCategory(grade), sectionId: '' });
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    const cleaned: Team = {
      ...form,
      name: form.name.trim(),
      students: form.students.map((s) => s.trim()),
    };
    if (!cleaned.name || !cleaned.sectionId || cleaned.students.some((s) => !s)) {
      setError('أكمل اسم الفريق والشعبة وأسماء الطلاب الأربعة.');
      return;
    }
    if (new Set(cleaned.students).size < 4) {
      setError('أسماء الطلاب يجب أن تكون مختلفة.');
      return;
    }
    const next = dispatch({ type: 'team/save', team: cleaned });
    if (!next.teams.includes(cleaned)) {
      setError('تعذر الحفظ: ربما بدأت مباريات هذا الصف.');
      return;
    }
    onClose();
  };

  return (
    <Modal title={initial ? 'تعديل الفريق' : 'إضافة فريق'} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-3">
        <Field label="اسم الفريق">
          <input
            className={inputClass}
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
        </Field>

        <div className="grid grid-cols-3 gap-2">
          <Field label="الفئة العمرية">
            <select
              className={inputClass}
              disabled={locked}
              value={form.category}
              onChange={(e) =>
                handleGradeChange(CATEGORIES[Number(e.target.value) - 1].grades[0])
              }
            >
              {CATEGORIES.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </Field>

          <Field label="الصف">
            <select
              className={inputClass}
              disabled={locked}
              value={form.grade}
              onChange={(e) => handleGradeChange(Number(e.target.value) as Grade)}
            >
              {CATEGORIES[form.category - 1].grades.map((grade) => (
                <option key={grade} value={grade}>
                  {GRADE_NAMES[grade]}
                </option>
              ))}
            </select>
          </Field>

          <Field label="الشعبة">
            <select
              className={inputClass}
              disabled={locked}
              value={form.sectionId}
              onChange={(e) => setForm({ ...form, sectionId: e.target.value })}
            >
              <option value="">اختر…</option>
              {availableSections.map((section) => (
                <option key={section.id} value={section.id}>
                  {section.name}
                </option>
              ))}
            </select>
          </Field>
        </div>

        {!availableSections.length && (
          <Notice>كل شعب هذا الصف لديها فرق. أضف شعبة من صفحة الصفوف والشعب.</Notice>
        )}

        <div className="grid grid-cols-2 gap-2">
          {form.students.map((student, index) => (
            <Field key={index} label={`الطالب ${index + 1}`}>
              <input
                className={inputClass}
                value={student}
                onChange={(e) =>
                  setForm({
                    ...form,
                    students: form.students.map((s, idx) =>
                      idx === index ? e.target.value : s
                    ),
                  })
                }
              />
            </Field>
          ))}
        </div>

        {error && <Notice tone="red">{error}</Notice>}

        <div className="flex gap-2">
          <Button type="submit">حفظ الفريق</Button>
          <Button variant="ghost" onClick={onClose}>
            إلغاء
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export function TeamsPage() {
  const { state, dispatch } = useAppStore();
  const [editing, setEditing] = useState<Team | 'new' | null>(null);
  const [filterCat, setFilterCat] = useState<0 | CategoryId>(0);
  const [confirmDeleteTeam, setConfirmDeleteTeam] = useState<Team | null>(null);

  const teams = state.teams
    .filter((team) => !filterCat || team.category === filterCat)
    .sort((a, b) => GRADES.indexOf(a.grade) - GRADES.indexOf(b.grade));

  return (
    <>
      <PageHeader
        title="الفرق والطلاب"
        subtitle="كل فريق من أربعة طلاب، وفريق واحد لكل شعبة"
        actions={
          <>
            <select
              aria-label="تصفية حسب الفئة"
              className={`${inputClass} w-40`}
              value={filterCat}
              onChange={(e) => setFilterCat(Number(e.target.value) as 0 | CategoryId)}
            >
              <option value={0}>كل الفئات</option>
              {CATEGORIES.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
            <Button onClick={() => setEditing('new')}>
              <IconPlus />
              إضافة فريق
            </Button>
          </>
        }
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {teams.map((team) => {
          const locked =
            hasGradeStarted(state, team.grade) ||
            state.matches.some((m) => m.teamIds.includes(team.id));
          return (
            <Card key={team.id}>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="text-lg font-extrabold">{team.name}</h3>
                  <Badge>{getTeamSectionLabel(state, team)}</Badge>
                </div>
                <div className="flex">
                  <button
                    type="button"
                    aria-label={`تعديل ${team.name}`}
                    onClick={() => setEditing(team)}
                    className="cursor-pointer rounded-lg p-2 text-royal hover:bg-soft"
                  >
                    <IconPencil />
                  </button>
                  <button
                    type="button"
                    aria-label={`حذف ${team.name}`}
                    title={locked ? 'مرتبط بمباريات أو بدأت مباريات الصف' : 'حذف'}
                    disabled={locked}
                    onClick={() => setConfirmDeleteTeam(team)}
                    className="cursor-pointer rounded-lg p-2 text-red-600 hover:bg-err disabled:opacity-25"
                  >
                    <IconTrash />
                  </button>
                </div>
              </div>

              <ol className="mt-3 list-inside list-decimal space-y-1 text-mute">
                {team.students.map((student, index) => (
                  <li key={index}>{student}</li>
                ))}
              </ol>
            </Card>
          );
        })}
      </div>

      {!teams.length && (
        <Notice>
          لا توجد فرق مسجلة. أضف الشعب من «الصفوف والشعب» ثم سجّل الفرق (للبطولة فقط؛ المواجهة
          السريعة لا تحتاج تسجيلاً).
        </Notice>
      )}

      {editing && (
        <TeamFormModal
          initial={editing === 'new' ? null : editing}
          onClose={() => setEditing(null)}
        />
      )}

      <ConfirmModal
        open={!!confirmDeleteTeam}
        title="حذف الفريق"
        message={confirmDeleteTeam ? `حذف فريق «${confirmDeleteTeam.name}»؟` : ''}
        confirmLabel="حذف"
        onCancel={() => setConfirmDeleteTeam(null)}
        onConfirm={() => {
          if (confirmDeleteTeam) {
            dispatch({ type: 'team/remove', id: confirmDeleteTeam.id });
          }
          setConfirmDeleteTeam(null);
        }}
      />
    </>
  );
}
