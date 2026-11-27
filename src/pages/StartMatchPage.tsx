import { useState, type FormEvent } from 'react';
import { IconArrowLeft, IconHome, IconSchool, IconShapes } from '../components/Icons';
import { SpinWheel } from '../components/SpinWheel';
import { Button, Credits, Notice, inputClass } from '../components/ui';
import { useAppStore } from '../context/AppStoreContext';
import { ASSETS, CATEGORIES } from '../data/constants';
import type { CategoryId, MatchType } from '../types/olympiad';
import { navigate } from '../utils/router';
import { buildBoardCells, createId } from '../utils/tournament';

const optionCardClass = (selected: boolean) =>
  `cursor-pointer rounded-2xl border-2 p-4 text-center transition ${
    selected
      ? 'border-royal bg-soft shadow-card'
      : 'border-line bg-white hover:border-sky'
  }`;

export function StartMatchPage() {
  const { state, dispatch } = useAppStore();
  const [names, setNames] = useState<[string, string]>(['', '']);
  const [matchType, setMatchType] = useState<MatchType | null>(null);
  const [category, setCategory] = useState<CategoryId | null>(null);
  const [starter, setStarter] = useState<0 | 1 | null>(null);
  const [spinning, setSpinning] = useState(false);

  const hasNames = Boolean(names[0].trim() && names[1].trim());
  const duplicateNames = hasNames && names[0].trim() === names[1].trim();
  const boardCheck =
    matchType && category ? buildBoardCells(matchType, category, state.questions) : null;
  const canStart = Boolean(
    hasNames && !duplicateNames && boardCheck?.ok && starter !== null && !spinning
  );

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!canStart || !matchType || !category || starter === null) return;
    const matchId = createId('m');
    const next = dispatch({
      type: 'match/quick',
      id: matchId,
      matchType,
      category,
      names,
      starter,
    });
    if (next.matches.some((m) => m.id === matchId)) {
      navigate(`board/${matchId}`);
    }
  };

  const displayTeamName = (index: 0 | 1) =>
    names[index].trim() || (index === 1 ? 'الفريق الثاني' : 'الفريق الأول');

  const panelClass =
    'flex flex-col justify-center gap-3 rounded-3xl border border-line bg-white p-4 shadow-card xl:p-5';

  return (
    <div className="flex min-h-dvh flex-col gap-3 bg-linear-to-bl from-white via-page to-soft p-3 md:px-6 lg:h-dvh lg:min-h-[34rem]">
      <header className="flex items-center justify-between gap-3">
        <img
          src={ASSETS.committeeLogo}
          alt="شعار اللجنة العلمية"
          className="h-[11dvh] max-h-24 min-h-14 w-auto rounded-2xl object-contain"
        />
        <div className="text-center">
          <h1 className="text-3xl font-black">مواجهة جديدة</h1>
          <p className="font-bold text-gold">أولمبياد الحصاد للعلوم</p>
        </div>
        <img
          src={ASSETS.schoolLogo}
          alt="شعار المدرسة"
          className="h-[11dvh] max-h-24 min-h-14 w-auto object-contain"
        />
      </header>

      <form
        onSubmit={handleSubmit}
        className="fade-in mx-auto flex w-full max-w-[100rem] flex-1 flex-col gap-3 lg:min-h-0"
      >
        <div className="grid flex-1 gap-3 lg:min-h-0 lg:grid-cols-3">
          <section className={panelClass}>
            <h2 className="text-xl font-black text-royal">١. الفريقان</h2>
            {([0, 1] as const).map((index) => (
              <label key={index} className="block">
                <span className="mb-1 block font-extrabold">
                  اسم الفريق {index === 0 ? 'الأول' : 'الثاني'}
                </span>
                <input
                  autoFocus={index === 0}
                  maxLength={30}
                  className={`${inputClass} text-2xl`}
                  value={names[index]}
                  onChange={(e) =>
                    setNames(index === 0 ? [e.target.value, names[1]] : [names[0], e.target.value])
                  }
                />
              </label>
            ))}
            {duplicateNames && <Notice tone="red">اكتب اسمين مختلفين.</Notice>}
          </section>

          <section className={panelClass}>
            <h2 className="text-xl font-black text-royal">٢. المواجهة</h2>
            <fieldset>
              <legend className="mb-1 font-extrabold">نوع المواجهة</legend>
              <div className="grid grid-cols-2 gap-3">
                {(
                  [
                    ['sections', 'بين الشعب', '9 أسئلة', IconShapes],
                    ['grades', 'بين الصفوف', '18 سؤالاً', IconSchool],
                  ] as const
                ).map(([type, label, countLabel, Icon]) => (
                  <button
                    key={type}
                    type="button"
                    aria-pressed={matchType === type}
                    onClick={() => setMatchType(type)}
                    className={optionCardClass(matchType === type)}
                  >
                    <Icon className="mx-auto text-3xl text-royal" />
                    <div className="text-xl font-extrabold">{label}</div>
                    <div className="text-mute">{countLabel}</div>
                  </button>
                ))}
              </div>
            </fieldset>

            <fieldset>
              <legend className="mb-1 font-extrabold">فئة المسابقة</legend>
              <div className="grid grid-cols-2 gap-3">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    aria-pressed={category === cat.id}
                    onClick={() => setCategory(cat.id)}
                    className={optionCardClass(category === cat.id)}
                  >
                    <div className="text-xl font-extrabold">{cat.name}</div>
                    <div className="text-sm text-mute">{cat.range}</div>
                  </button>
                ))}
              </div>
            </fieldset>
          </section>

          <section className={`${panelClass} items-center`}>
            <h2 className="self-start text-xl font-black text-royal">٣. من يبدأ؟</h2>
            <SpinWheel
              size="h-[min(30dvh,16rem)] w-[min(30dvh,16rem)] min-h-40 min-w-40"
              items={[displayTeamName(0), displayTeamName(1)]}
              disabled={!hasNames || duplicateNames}
              onSpin={() => {
                setSpinning(true);
                setStarter(null);
              }}
              onResult={(idx) => {
                setSpinning(false);
                setStarter(idx as 0 | 1);
              }}
            />
            <div className="min-h-9">
              {starter !== null && (
                <p
                  data-testid="starter"
                  className="pop rounded-full bg-ok px-6 py-1 text-xl font-black text-green-900"
                >
                  يبدأ: {names[starter].trim()}
                </p>
              )}
            </div>
            <div className="flex flex-wrap items-center justify-center gap-2 text-sm">
              <span className="text-mute">أو يدوياً:</span>
              {([0, 1] as const).map((side) => (
                <Button
                  key={side}
                  variant={starter === side ? 'soft' : 'ghost'}
                  className="max-w-32 truncate py-1"
                  disabled={spinning}
                  onClick={() => setStarter(side)}
                >
                  {displayTeamName(side)}
                </Button>
              ))}
            </div>
          </section>
        </div>

        {boardCheck && !boardCheck.ok && <Notice tone="red">{boardCheck.error}</Notice>}

        <div className="flex flex-wrap items-center justify-between gap-3">
          <a href="#/dashboard" className="inline-flex items-center gap-2 font-bold text-royal">
            <IconHome />
            لوحة الإدارة
          </a>
          <Button type="submit" className="px-24 py-3 text-2xl" disabled={!canStart}>
            التالي
            <IconArrowLeft />
          </Button>
          <Credits />
        </div>
      </form>
    </div>
  );
}
