import { IconArrowLeft } from '../components/Icons';
import { AtomOrbitSvg } from '../components/ScienceMotion';
import { Credits } from '../components/ui';
import { useAppStore } from '../context/AppStoreContext';
import { ASSETS } from '../data/constants';

export function HomePage() {
  const { settings } = useAppStore().state;

  return (
    <div className="relative flex min-h-dvh flex-col overflow-hidden bg-linear-to-bl from-white via-page to-soft">
      <div className="pointer-events-none absolute -top-40 -right-32 h-[32rem] w-[32rem] rounded-full bg-soft/70 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 right-1/3 h-96 w-96 rounded-full bg-amber-100/60 blur-3xl" />

      <div className="presenter pointer-events-none absolute bottom-0 left-0 hidden h-[88dvh] w-[40vw] md:block">
        <div className="absolute left-1/2 top-[16%] h-[32vw] w-[32vw] -translate-x-1/2 rounded-full bg-radial from-sky/30 via-soft/60 to-transparent" />
        <AtomOrbitSvg className="absolute left-1/2 top-[4%] h-[40vw] max-h-[80dvh] w-[40vw] -translate-x-1/2" />
        <img
          src={ASSETS.presenter}
          alt={settings.presenter}
          className="presenter-img absolute bottom-0 left-1/2 h-full w-auto max-w-none -translate-x-1/2"
        />
      </div>

      <header className="relative z-10 flex items-center justify-between gap-4 p-4 md:px-10">
        <div className="rounded-3xl border border-line bg-[#f5f1e5] p-2 shadow-card">
          <img
            src={ASSETS.committeeLogo}
            alt="شعار اللجنة العلمية"
            className="h-20 w-20 rounded-2xl object-contain md:h-[15dvh] md:w-[15dvh]"
          />
        </div>
        <img
          src={ASSETS.schoolLogo}
          alt="شعار مدارس الحصاد المقدسي"
          className="h-20 w-20 object-contain md:h-[16dvh] md:w-[16dvh]"
        />
      </header>

      <main className="relative z-10 flex flex-1 items-center px-6 pb-6 md:px-10">
        <div className="fade-in mx-auto max-w-2xl text-center md:mx-0 md:w-[48%] md:text-right lg:w-[44%]">
          <p className="mb-2 text-xl font-extrabold text-royal">{settings.school}</p>
          <h1 className="text-5xl font-black leading-tight text-ink lg:text-[min(4.6vw,10dvh)]">
            أولمبياد الحصاد
            <br />
            <span className="text-royal">للعلوم</span>
          </h1>
          <p
            dir="ltr"
            className="mt-2 text-base font-bold tracking-[0.14em] text-gold md:text-right lg:text-[min(1.5vw,3.4dvh)]"
          >
            AL-HASSAD SCIENCE OLYMPIAD
          </p>

          <div className="mx-auto my-[2.5dvh] h-1 w-40 rounded-full bg-linear-to-l from-gold via-sky to-transparent md:mx-0" />

          <div className="grid grid-cols-2 divide-x divide-x-reverse divide-line rounded-2xl border border-line bg-white/90 py-3 text-center shadow-card">
            <div className="px-3">
              <div className="text-sm font-bold text-mute">تحت إشراف</div>
              <div className="text-xl font-black text-ink">{settings.organizer}</div>
            </div>
            <div className="px-3">
              <div className="text-sm font-bold text-mute">تقديم</div>
              <div className="text-xl font-black text-ink">{settings.presenter}</div>
            </div>
          </div>

          <div className="mt-[3dvh] flex flex-wrap justify-center gap-3 md:justify-start">
            <a
              href="#/start"
              className="inline-flex items-center gap-3 rounded-2xl bg-royal px-8 py-3 text-xl font-extrabold text-white shadow-lg shadow-royal/25 transition hover:-translate-y-0.5"
            >
              ابدأ المسابقة
              <IconArrowLeft />
            </a>
            <a
              href="#/dashboard"
              className="inline-flex items-center rounded-2xl border border-line bg-white px-6 py-3 text-lg font-bold text-royal shadow-card"
            >
              دخول لوحة الإدارة
            </a>
          </div>

          <Credits className="mt-[2.5dvh]" />
        </div>
      </main>

      <img
        src={ASSETS.presenter}
        alt={settings.presenter}
        className="presenter-img relative z-10 mx-auto -mt-4 h-[55vh] w-auto md:hidden"
      />
    </div>
  );
}
