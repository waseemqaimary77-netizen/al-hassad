import { useState } from 'react';
import { IconDownload, IconReset, IconUpload } from '../components/Icons';
import {
  Button,
  Card,
  ConfirmModal,
  Field,
  Notice,
  PageHeader,
  inputClass,
} from '../components/ui';
import { useAppStore } from '../context/AppStoreContext';
import type { AppState, Settings } from '../types/olympiad';
import { isValidState } from '../utils/storage';

export function SettingsPage() {
  const { state, dispatch } = useAppStore();
  const [form, setForm] = useState<Settings>(state.settings);
  const [statusMessage, setStatusMessage] = useState<{
    tone: 'green' | 'red';
    text: string;
  } | null>(null);
  const [pendingImport, setPendingImport] = useState<AppState | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);

  const handleExport = () => {
    const url = URL.createObjectURL(
      new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' })
    );
    const link = document.createElement('a');
    link.href = url;
    link.download = 'hassad-olympiad-backup.json';
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleImportFile = async (file: File) => {
    try {
      const parsed = JSON.parse(await file.text());
      if (!isValidState(parsed)) {
        throw new Error('Invalid state');
      }
      setPendingImport(parsed);
    } catch {
      setStatusMessage({ tone: 'red', text: 'الملف غير صالح.' });
    }
  };

  return (
    <>
      <PageHeader title="الإعدادات" />

      {statusMessage && (
        <div className="mb-4">
          <Notice tone={statusMessage.tone}>{statusMessage.text}</Notice>
        </div>
      )}

      <Card className="mb-4">
        <form
          className="grid gap-3 md:grid-cols-2"
          onSubmit={(e) => {
            e.preventDefault();
            const timerSeconds = Math.min(600, Math.max(10, form.timerSeconds || 60));
            const firstSeconds = Math.min(timerSeconds - 5, Math.max(5, form.firstSeconds || 45));
            dispatch({
              type: 'settings/save',
              settings: { ...form, timerSeconds, firstSeconds },
            });
            setStatusMessage({ tone: 'green', text: 'تم حفظ الإعدادات.' });
          }}
        >
          <Field label="اسم المدرسة">
            <input
              className={inputClass}
              value={form.school}
              onChange={(e) => setForm({ ...form, school: e.target.value })}
            />
          </Field>

          <Field label="الجهة المنظمة">
            <input
              className={inputClass}
              value={form.organizer}
              onChange={(e) => setForm({ ...form, organizer: e.target.value })}
            />
          </Field>

          <Field label="مقدم الأولمبياد">
            <input
              className={inputClass}
              value={form.presenter}
              onChange={(e) => setForm({ ...form, presenter: e.target.value })}
            />
          </Field>

          <Field label="حصة الفريق المختار (ثانية)">
            <input
              type="number"
              min={5}
              className={inputClass}
              value={form.firstSeconds}
              onChange={(e) => setForm({ ...form, firstSeconds: Number(e.target.value) })}
            />
          </Field>

          <Field label="مدة المؤقت الكلية (ثانية)">
            <input
              type="number"
              min={5}
              max={600}
              className={inputClass}
              value={form.timerSeconds}
              onChange={(e) => setForm({ ...form, timerSeconds: Number(e.target.value) })}
            />
          </Field>

          <label className="flex items-center gap-2 font-bold md:col-span-2">
            <input
              type="checkbox"
              className="h-5 w-5 accent-royal"
              checked={form.strictSets}
              onChange={(e) => setForm({ ...form, strictSets: e.target.checked })}
            />
            في مواجهات الصفوف: لكل فريق مجموعة أسئلته (للتكافؤ). يطبق على المواجهات الجديدة.
          </label>

          <Button type="submit" className="md:col-span-2 md:justify-self-start">
            حفظ
          </Button>
        </form>
      </Card>

      <Card>
        <h2 className="mb-1 text-xl font-extrabold">البيانات</h2>
        <p className="mb-3 text-mute">
          تُحفظ البيانات في هذا المتصفح فقط. خذ نسخة احتياطية قبل يوم المسابقة.
        </p>

        <div className="flex flex-wrap gap-2">
          <Button variant="soft" onClick={handleExport}>
            <IconDownload />
            تصدير نسخة احتياطية
          </Button>

          <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-line px-4 py-2.5 font-bold">
            <IconUpload />
            استيراد
            <input
              type="file"
              accept="application/json"
              className="sr-only"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  void handleImportFile(file);
                }
                e.target.value = '';
              }}
            />
          </label>

          <Button variant="danger" onClick={() => setConfirmReset(true)}>
            <IconReset />
            إعادة البيانات الافتراضية
          </Button>
        </div>
      </Card>

      <ConfirmModal
        open={!!pendingImport}
        title="استيراد بيانات"
        message="سيتم استبدال البيانات الحالية. متابعة؟"
        confirmLabel="استيراد واستبدال"
        confirmVariant="primary"
        onCancel={() => setPendingImport(null)}
        onConfirm={() => {
          if (pendingImport) {
            dispatch({ type: 'state/replace', state: pendingImport });
            setForm(pendingImport.settings);
            setStatusMessage({ tone: 'green', text: 'تم استيراد البيانات.' });
          }
          setPendingImport(null);
        }}
      />

      <ConfirmModal
        open={confirmReset}
        title="إعادة البيانات الافتراضية"
        message="إعادة البيانات الافتراضية وبنك الأسئلة الرسمي وحذف كل التعديلات؟"
        confirmLabel="إعادة التعيين"
        onCancel={() => setConfirmReset(false)}
        onConfirm={() => {
          const next = dispatch({ type: 'state/reset' });
          setForm(next.settings);
          setStatusMessage({ tone: 'green', text: 'أعيدت البيانات الافتراضية وبنك الأسئلة الرسمي.' });
          setConfirmReset(false);
        }}
      />
    </>
  );
}
