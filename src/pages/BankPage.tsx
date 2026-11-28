import { useState, type FormEvent } from 'react';
import { IconPencil, IconPlus, IconReset, IconSearch, IconTrash } from '../components/Icons';
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
import {
  CATEGORIES,
  DIFFICULTIES,
  SUBJECTS,
  getDifficultyName,
  getSubjectName,
} from '../data/constants';
import type { CategoryId, DifficultyId, Question, SubjectId } from '../types/olympiad';
import { createId } from '../utils/tournament';

function QuestionFormModal({
  initial,
  defaultCategory,
  onClose,
}: {
  initial: Question | null;
  defaultCategory: CategoryId;
  onClose: () => void;
}) {
  const { dispatch } = useAppStore();
  const [form, setForm] = useState<Question>(
    initial ?? {
      id: createId('q'),
      subject: 'chemistry',
      category: defaultCategory,
      difficulty: 'easy',
      text: '',
      answer: '',
      explanation: '',
      reference: '',
    }
  );
  const [error, setError] = useState('');

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!form.text.trim() || !form.answer.trim()) {
      setError('نص السؤال والإجابة النموذجية مطلوبان.');
      return;
    }
    dispatch({ type: 'question/save', question: form });
    onClose();
  };

  const renderTextarea = (field: 'text' | 'answer' | 'explanation' | 'reference', label: string) => (
    <Field label={label}>
      <textarea
        rows={2}
        className={inputClass}
        value={form[field]}
        onChange={(e) => setForm({ ...form, [field]: e.target.value })}
      />
    </Field>
  );

  return (
    <Modal title={initial ? 'تعديل السؤال' : 'إضافة سؤال'} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="grid grid-cols-3 gap-2">
          <Field label="الفرع">
            <select
              className={inputClass}
              value={form.subject}
              onChange={(e) => setForm({ ...form, subject: e.target.value as SubjectId })}
            >
              {SUBJECTS.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </Field>

          <Field label="الفئة">
            <select
              className={inputClass}
              value={form.category}
              onChange={(e) =>
                setForm({ ...form, category: Number(e.target.value) as CategoryId })
              }
            >
              {CATEGORIES.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </Field>

          <Field label="الصعوبة">
            <select
              className={inputClass}
              value={form.difficulty}
              onChange={(e) =>
                setForm({ ...form, difficulty: e.target.value as DifficultyId })
              }
            >
              {DIFFICULTIES.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name} ({d.points})
                </option>
              ))}
            </select>
          </Field>
        </div>

        {renderTextarea('text', 'نص السؤال')}
        {renderTextarea('answer', 'الإجابة النموذجية')}
        {renderTextarea('explanation', 'تفسير الإجابة (اختياري)')}
        {renderTextarea('reference', 'المرجع العلمي')}

        {error && <Notice tone="red">{error}</Notice>}

        <Button type="submit">حفظ السؤال</Button>
      </form>
    </Modal>
  );
}

export function BankPage() {
  const { state, dispatch } = useAppStore();
  const [editing, setEditing] = useState<Question | 'new' | null>(null);
  const [categoryTab, setCategoryTab] = useState<'' | '1' | '2'>('');
  const [subjectFilter, setSubjectFilter] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [confirmDeleteQuestion, setConfirmDeleteQuestion] = useState<Question | null>(null);
  const [confirmRestore, setConfirmRestore] = useState(false);

  const normalizedSearch = searchQuery.trim().toLowerCase();

  const categoryQuestions = categoryTab
    ? state.questions.filter((q) => String(q.category) === categoryTab)
    : state.questions;

  const filteredQuestions = categoryQuestions.filter(
    (q) =>
      (!subjectFilter || q.subject === subjectFilter) &&
      (!difficultyFilter || q.difficulty === difficultyFilter) &&
      (!normalizedSearch ||
        q.text.toLowerCase().includes(normalizedSearch) ||
        q.answer.toLowerCase().includes(normalizedSearch))
  );

  const renderFilter = (
    label: string,
    value: string,
    onChange: (val: string) => void,
    options: [string, string][]
  ) => (
    <select
      aria-label={label}
      className={`${inputClass} w-44`}
      value={value}
      onChange={(e) => onChange(e.target.value)}
    >
      <option value="">{label}: الكل</option>
      {options.map(([optValue, optLabel]) => (
        <option key={optValue} value={optValue}>
          {optLabel}
        </option>
      ))}
    </select>
  );

  const cat1Count = state.questions.filter((q) => q.category === 1).length;
  const cat2Count = state.questions.filter((q) => q.category === 2).length;

  return (
    <>
      <PageHeader
        title="بنك الأسئلة الرسمي"
        subtitle="مصنّف حسب الفئة الأولى والثانية، والمواد العلمية الثلاث، ومستويات الصعوبة (سهل 100 · متوسط 200 · صعب 300)"
        actions={
          <>
            <Button variant="ghost" onClick={() => setConfirmRestore(true)}>
              <IconReset />
              استعادة البنك الرسمي (270)
            </Button>
            <Button onClick={() => setEditing('new')}>
              <IconPlus />
              إضافة سؤال
            </Button>
          </>
        }
      />

      <div className="mb-4 flex flex-wrap gap-2">
        <Button
          variant={categoryTab === '' ? 'primary' : 'ghost'}
          onClick={() => setCategoryTab('')}
        >
          جميع الفئات ({state.questions.length})
        </Button>
        <Button
          variant={categoryTab === '1' ? 'primary' : 'ghost'}
          onClick={() => setCategoryTab('1')}
        >
          الفئة الأولى: السادس – التاسع ({cat1Count})
        </Button>
        <Button
          variant={categoryTab === '2' ? 'primary' : 'ghost'}
          onClick={() => setCategoryTab('2')}
        >
          الفئة الثانية: العاشر – الثاني عشر ({cat2Count})
        </Button>
      </div>

      <div className="mb-5 grid gap-3 sm:grid-cols-3">
        {SUBJECTS.map((subject) => {
          const subjectQuestions = categoryQuestions.filter((q) => q.subject === subject.id);
          const easyCount = subjectQuestions.filter((q) => q.difficulty === 'easy').length;
          const mediumCount = subjectQuestions.filter((q) => q.difficulty === 'medium').length;
          const hardCount = subjectQuestions.filter((q) => q.difficulty === 'hard').length;
          const active = subjectFilter === subject.id;

          return (
            <button
              key={subject.id}
              type="button"
              onClick={() => setSubjectFilter(active ? '' : subject.id)}
              className={`cursor-pointer rounded-2xl border p-4 text-right shadow-card transition ${
                active
                  ? 'border-royal bg-soft'
                  : 'border-line bg-white hover:border-sky'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-lg font-black text-ink">فرع {subject.name}</span>
                <Badge tone="blue">{subjectQuestions.length} سؤالاً</Badge>
              </div>
              <div className="mt-2 flex flex-wrap gap-1.5 text-xs font-bold">
                <span className="rounded-lg bg-ok px-2 py-1 text-green-900">
                  سهل (100): {easyCount}
                </span>
                <span className="rounded-lg bg-amber-100 px-2 py-1 text-amber-900">
                  متوسط (200): {mediumCount}
                </span>
                <span className="rounded-lg bg-err px-2 py-1 text-red-800">
                  صعب (300): {hardCount}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="relative min-w-60 flex-1">
          <IconSearch className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-mute" />
          <input
            type="search"
            aria-label="بحث في الأسئلة"
            placeholder="ابحث في نص السؤال أو الإجابة…"
            className={`${inputClass} pr-9`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        {renderFilter(
          'الفرع',
          subjectFilter,
          setSubjectFilter,
          SUBJECTS.map((s) => [s.id, s.name])
        )}
        {renderFilter(
          'المستوى',
          difficultyFilter,
          setDifficultyFilter,
          DIFFICULTIES.map((d) => [d.id, `${d.name} (${d.points})`])
        )}
        <Badge tone="gray">{filteredQuestions.length} سؤال</Badge>
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        {filteredQuestions.map((question, idx) => {
          const diffInfo = DIFFICULTIES.find((d) => d.id === question.difficulty);
          return (
            <Card key={question.id}>
              <div className="flex justify-between gap-2">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-xs font-black text-mute">#{idx + 1}</span>
                  <Badge>{getSubjectName(question.subject)}</Badge>
                  <Badge tone="gray">{CATEGORIES[question.category - 1].name}</Badge>
                  <Badge
                    tone={
                      question.difficulty === 'easy'
                        ? 'green'
                        : question.difficulty === 'medium'
                          ? 'gold'
                          : 'red'
                    }
                  >
                    {getDifficultyName(question.difficulty)} ({diffInfo?.points})
                  </Badge>
                </div>
                <div className="flex">
                  <button
                    type="button"
                    aria-label="تعديل السؤال"
                    onClick={() => setEditing(question)}
                    className="cursor-pointer rounded-lg p-2 text-royal hover:bg-soft"
                  >
                    <IconPencil />
                  </button>
                  <button
                    type="button"
                    aria-label="حذف السؤال"
                    onClick={() => setConfirmDeleteQuestion(question)}
                    className="cursor-pointer rounded-lg p-2 text-red-600 hover:bg-err"
                  >
                    <IconTrash />
                  </button>
                </div>
              </div>

              <p className="mt-3 font-extrabold leading-relaxed">{question.text}</p>
              <div className="mt-2 rounded-xl bg-page px-3 py-2 text-sm">
                <span className="font-bold text-royal">الإجابة النموذجية: </span>
                <bdi className="font-extrabold text-ink">{question.answer}</bdi>
              </div>
              {(question.explanation || question.reference) && (
                <details className="mt-2 text-xs text-mute">
                  <summary className="cursor-pointer font-bold text-royal">المرجع والتفاصيل</summary>
                  {question.explanation && <p className="mt-1">{question.explanation}</p>}
                  {question.reference && <p className="mt-1">{question.reference}</p>}
                </details>
              )}
            </Card>
          );
        })}
      </div>

      {editing && (
        <QuestionFormModal
          initial={editing === 'new' ? null : editing}
          defaultCategory={categoryTab === '2' ? 2 : 1}
          onClose={() => setEditing(null)}
        />
      )}

      <ConfirmModal
        open={!!confirmDeleteQuestion}
        title="حذف السؤال"
        message="حذف السؤال من البنك؟"
        confirmLabel="حذف"
        onCancel={() => setConfirmDeleteQuestion(null)}
        onConfirm={() => {
          if (confirmDeleteQuestion) {
            dispatch({ type: 'question/remove', id: confirmDeleteQuestion.id });
          }
          setConfirmDeleteQuestion(null);
        }}
      />

      <ConfirmModal
        open={confirmRestore}
        title="استعادة بنك الأسئلة الرسمي"
        message="سيتم استعادة جميع الأسئلة الرسمية (270 سؤالاً: 135 للفئة الأولى و135 للفئة الثانية) وحذف أي تعديلات يدوية على البنك. متابعة؟"
        confirmLabel="استعادة"
        confirmVariant="primary"
        onCancel={() => setConfirmRestore(false)}
        onConfirm={() => {
          dispatch({ type: 'bank/restoreOfficial' });
          setConfirmRestore(false);
        }}
      />
    </>
  );
}
