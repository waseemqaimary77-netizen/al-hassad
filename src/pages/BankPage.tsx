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
  onClose,
}: {
  initial: Question | null;
  onClose: () => void;
}) {
  const { dispatch } = useAppStore();
  const [form, setForm] = useState<Question>(
    initial ?? {
      id: createId('q'),
      subject: 'chemistry',
      category: 1,
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
        {renderTextarea('explanation', 'تفسير الإجابة')}
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
  const [subjectFilter, setSubjectFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState('');
  const [confirmDeleteQuestion, setConfirmDeleteQuestion] = useState<Question | null>(null);

  const filteredQuestions = state.questions.filter(
    (q) =>
      (!subjectFilter || q.subject === subjectFilter) &&
      (!categoryFilter || String(q.category) === categoryFilter) &&
      (!difficultyFilter || q.difficulty === difficultyFilter)
  );

  const renderFilter = (
    label: string,
    value: string,
    onChange: (val: string) => void,
    options: [string, string][]
  ) => (
    <select
      aria-label={label}
      className={`${inputClass} w-40`}
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

  return (
    <>
      <PageHeader
        title="بنك الأسئلة"
        subtitle="أسئلة تجريبية — استبدلها بالأسئلة المعتمدة من اللجنة العلمية"
        actions={
          <Button onClick={() => setEditing('new')}>
            <IconPlus />
            إضافة سؤال
          </Button>
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        {renderFilter(
          'الفرع',
          subjectFilter,
          setSubjectFilter,
          SUBJECTS.map((s) => [s.id, s.name])
        )}
        {renderFilter(
          'الفئة',
          categoryFilter,
          setCategoryFilter,
          CATEGORIES.map((c) => [String(c.id), c.name])
        )}
        {renderFilter(
          'المستوى',
          difficultyFilter,
          setDifficultyFilter,
          DIFFICULTIES.map((d) => [d.id, d.name])
        )}
        <Badge tone="gray">{filteredQuestions.length} سؤال</Badge>
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        {filteredQuestions.map((question) => (
          <Card key={question.id}>
            <div className="flex justify-between gap-2">
              <div className="flex flex-wrap gap-2">
                <Badge>{getSubjectName(question.subject)}</Badge>
                <Badge tone="gray">{CATEGORIES[question.category - 1].name}</Badge>
                <Badge tone="gold">{getDifficultyName(question.difficulty)}</Badge>
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

            <p className="mt-3 font-extrabold">{question.text}</p>
            <details className="mt-2 text-mute">
              <summary className="cursor-pointer font-bold text-royal">الإجابة والتفسير</summary>
              <p>
                <bdi>{question.answer}</bdi>
              </p>
              <p>{question.explanation}</p>
              <p className="text-sm">{question.reference}</p>
            </details>
          </Card>
        ))}
      </div>

      {editing && (
        <QuestionFormModal
          initial={editing === 'new' ? null : editing}
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
    </>
  );
}
