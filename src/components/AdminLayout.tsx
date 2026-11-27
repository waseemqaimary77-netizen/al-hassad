import type { ReactNode } from 'react';
import { useAppStore } from '../context/AppStoreContext';
import { ASSETS } from '../data/constants';
import {
  IconBank,
  IconDashboard,
  IconSchool,
  IconSettings,
  IconSwords,
  IconTrophy,
  IconUsers,
} from './Icons';
import { Credits, Notice } from './ui';

export const ADMIN_NAV_ITEMS = [
  { path: 'dashboard', label: 'لوحة التحكم', Icon: IconDashboard },
  { path: 'tournaments', label: 'إدارة البطولات', Icon: IconTrophy },
  { path: 'classes', label: 'الصفوف والشعب', Icon: IconSchool },
  { path: 'teams', label: 'الفرق والطلاب', Icon: IconUsers },
  { path: 'matches', label: 'إدارة المواجهات', Icon: IconSwords },
  { path: 'bank', label: 'بنك الأسئلة', Icon: IconBank },
  { path: 'settings', label: 'الإعدادات', Icon: IconSettings },
];

export function AdminLayout({ page, children }: { page: string; children: ReactNode }) {
  const { saveFailed } = useAppStore();
  const activePath = page === 'new-match' ? 'matches' : page;

  return (
    <div className="min-h-screen bg-page lg:flex">
      <aside className="border-line bg-white lg:sticky lg:top-0 lg:flex lg:h-screen lg:w-64 lg:shrink-0 lg:flex-col lg:border-l">
        <a href="#/" className="flex items-center gap-3 border-b border-line p-4">
          <img
            src={ASSETS.committeeLogo}
            alt="شعار اللجنة العلمية"
            className="h-14 w-14 rounded-xl object-contain"
          />
          <div>
            <div className="font-extrabold leading-tight">أولمبياد الحصاد للعلوم</div>
            <div className="text-xs font-bold text-gold">وضع الإدارة</div>
          </div>
        </a>

        <nav className="flex gap-1 overflow-x-auto p-3 lg:flex-col">
          {ADMIN_NAV_ITEMS.map(({ path, label, Icon }) => (
            <a
              key={path}
              href={`#/${path}`}
              aria-current={activePath === path ? 'page' : undefined}
              className={`flex shrink-0 items-center gap-3 rounded-xl px-3 py-2.5 font-bold transition ${
                activePath === path ? 'bg-soft text-royal' : 'text-mute hover:bg-page'
              }`}
            >
              <Icon className="text-lg" />
              {label}
            </a>
          ))}
        </nav>

        <Credits className="mt-auto hidden px-4 pb-2 lg:block" />

        <div className="hidden items-center gap-3 border-t border-line p-4 lg:flex">
          <img src={ASSETS.schoolLogo} alt="شعار المدرسة" className="h-12 w-12 object-contain" />
          <span className="text-sm font-bold text-mute">مدارس الحصاد المقدسي</span>
        </div>
      </aside>

      <main className="min-w-0 flex-1 p-4 md:p-8">
        {saveFailed && (
          <div className="mb-4">
            <Notice tone="red">
              تعذر حفظ البيانات في المتصفح. صدّر نسخة احتياطية من الإعدادات.
            </Notice>
          </div>
        )}
        <div className="fade-in mx-auto max-w-7xl">{children}</div>
        <Credits className="mt-8 text-center lg:hidden" />
      </main>
    </div>
  );
}
