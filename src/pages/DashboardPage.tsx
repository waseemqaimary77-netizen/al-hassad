import { ADMIN_NAV_ITEMS } from '../components/AdminLayout';
import {
  IconLayers,
  IconSchool,
  IconShapes,
  IconSwords,
  IconTrophy,
  IconUsers,
} from '../components/Icons';
import { Badge, Card, PageHeader } from '../components/ui';
import { useAppStore } from '../context/AppStoreContext';
import { CATEGORIES } from '../data/constants';
import { getCategoryStatus } from '../utils/tournament';

export function DashboardPage() {
  const { state } = useAppStore();
  const categoryStatuses = CATEGORIES.map((c) => getCategoryStatus(state, c.id));
  const overallStatus = categoryStatuses.every((s) => s === 'مكتملة')
    ? 'مكتملة'
    : categoryStatuses.some((s) => s !== 'قيد الإعداد')
      ? 'جارية'
      : 'قيد الإعداد';

  const stats = [
    { label: 'الفئات', value: CATEGORIES.length, Icon: IconLayers, tone: 'bg-soft text-royal' },
    {
      label: 'الصفوف',
      value: new Set(state.sections.map((s) => s.grade)).size,
      Icon: IconSchool,
      tone: 'bg-sky-50 text-sky',
    },
    { label: 'الشعب', value: state.sections.length, Icon: IconShapes, tone: 'bg-ok text-green-700' },
    { label: 'الفرق', value: state.teams.length, Icon: IconUsers, tone: 'bg-amber-50 text-gold' },
    { label: 'المواجهات', value: state.matches.length, Icon: IconSwords, tone: 'bg-soft text-royal' },
    { label: 'حالة البطولة', value: overallStatus, Icon: IconTrophy, tone: 'bg-amber-50 text-gold' },
  ];

  const sectionLinks = ADMIN_NAV_ITEMS.filter((item) => item.path !== 'dashboard');

  return (
    <>
      <PageHeader
        title="لوحة التحكم الرئيسية"
        subtitle={`${state.settings.school} — ${state.settings.organizer}`}
      />

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
        {stats.map(({ label, value, Icon, tone }) => (
          <Card key={label} className="flex items-center gap-4">
            <div className={`grid h-14 w-14 shrink-0 place-items-center rounded-2xl text-2xl ${tone}`}>
              <Icon />
            </div>
            <div>
              <div className={`font-black ${typeof value === 'number' ? 'text-4xl' : 'text-2xl'}`}>
                {value}
              </div>
              <div className="font-bold text-mute">{label}</div>
            </div>
          </Card>
        ))}
      </div>

      <h2 className="mb-3 mt-8 text-xl font-extrabold">الأقسام</h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {sectionLinks.map(({ path, label, Icon }) => (
          <a
            key={path}
            href={`#/${path}`}
            className="group rounded-2xl border border-line bg-white p-6 shadow-card transition hover:-translate-y-1 hover:border-sky"
          >
            <Icon className="mb-3 text-3xl text-royal" />
            <div className="text-lg font-extrabold">{label}</div>
          </a>
        ))}
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        {CATEGORIES.map((category, index) => (
          <Badge key={category.id} tone="gray">
            {category.name}: {categoryStatuses[index]}
          </Badge>
        ))}
      </div>
    </>
  );
}
