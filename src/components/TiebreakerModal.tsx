import { useState } from 'react';
import { SUBJECTS } from '../data/constants';
import type { SubjectId } from '../types/olympiad';
import { SpinWheel } from './SpinWheel';
import { Button } from './ui';

export function TiebreakerModal({
  names,
  onStart,
  onClose,
}: {
  names: [string, string];
  onStart: (subject: SubjectId, first: 0 | 1) => void;
  onClose: () => void;
}) {
  const [subjectIdx, setSubjectIdx] = useState<number | null>(null);
  const [firstTeam, setFirstTeam] = useState<0 | 1 | null>(null);

  return (
    <div
      data-testid="tiebreaker"
      className="fixed inset-0 z-30 overflow-y-auto bg-white/90 p-4 backdrop-blur-sm"
    >
      <div className="pop mx-auto my-4 max-w-3xl rounded-3xl border-4 border-gold bg-white p-6 text-center shadow-2xl">
        <h2 className="text-4xl font-black">
          تعادل! <span className="text-gold">سؤال كسر التعادل</span>
        </h2>

        <div className="mt-5 grid gap-6 md:grid-cols-2">
          <div>
            <h3 className="mb-3 text-xl font-extrabold">١. قرعة المادة</h3>
            <SpinWheel
              size="h-60 w-60"
              items={SUBJECTS.map((s) => s.name)}
              disabled={subjectIdx !== null}
              onResult={setSubjectIdx}
            />
            {subjectIdx !== null && (
              <p className="pop mt-2 text-2xl font-black text-royal">
                {SUBJECTS[subjectIdx].name}
              </p>
            )}
          </div>

          <div>
            <h3 className="mb-3 text-xl font-extrabold">٢. من يجيب أولاً؟</h3>
            <SpinWheel
              size="h-60 w-60"
              items={names}
              disabled={subjectIdx === null || firstTeam !== null}
              onResult={(idx) => setFirstTeam(idx as 0 | 1)}
            />
            {firstTeam !== null && (
              <p className="pop mt-2 text-2xl font-black text-royal">{names[firstTeam]}</p>
            )}
          </div>
        </div>

        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Button
            variant="gold"
            className="px-10 py-3 text-xl"
            disabled={subjectIdx === null || firstTeam === null}
            onClick={() => {
              if (subjectIdx !== null && firstTeam !== null) {
                onStart(SUBJECTS[subjectIdx].id, firstTeam);
              }
            }}
          >
            عرض السؤال وبدء المؤقت
          </Button>
          <Button variant="ghost" onClick={onClose}>
            العودة للوحة
          </Button>
        </div>
      </div>
    </div>
  );
}
