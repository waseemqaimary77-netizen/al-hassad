import { useMemo, useState, type FormEvent } from 'react';
import {
  IconArrowDown,
  IconArrowUp,
  IconBookmarkPlus,
  IconBracket,
  IconCheck,
  IconCrown,
  IconPlay,
  IconPlus,
  IconPrinter,
  IconShuffle,
  IconSwords,
  IconTrash,
} from '../components/Icons';
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
import { CATEGORIES, GRADE_NAMES, MATCH_TYPE_LABELS, getGradeCategory } from '../data/constants';
import { BUILTIN_PLAN_TEMPLATES } from '../data/planTemplates';
import type {
  BracketPlanMode,
  CategoryId,
  MatchType,
  PlanMatchSlot,
  PlanTemplate,
  TournamentPlan,
} from '../types/olympiad';
import {
  getDefaultRoundName,
  resolvePlan,
  seedStandardBracket,
  shuffleParticipants,
  type ResolvedPlanNode,
} from '../utils/planner';
import { navigate } from '../utils/router';
import { buildBoardCells, createId } from '../utils/tournament';

function createPlanFromTemplate(template: PlanTemplate): TournamentPlan {
  return {
    id: createId('plan'),
    title: template.title.replace(/^قالب\s*/, ''),
    description: template.description,
    category: template.category,
    matchType: template.matchType,
    mode: template.mode,
    includeThirdPlace: template.includeThirdPlace,
    participants: [...template.participants],
    roundNames: [...template.roundNames],
    slots: [],
    createdAt: Date.now(),
  };
}

function createBlankPlan(category: CategoryId = 1): TournamentPlan {
  return {
    id: createId('plan'),
    title: 'خطة مواجهات جديدة',
    description: '',
    category,
    matchType: 'sections',
    mode: 'elimination',
    includeThirdPlace: false,
    participants: ['الفريق ١', 'الفريق ٢', 'الفريق ٣', 'الفريق ٤'],
    roundNames: ['نصف النهائي', 'النهائي'],
    slots: [],
    createdAt: Date.now(),
  };
}

export function PlannerPage() {
  const { state, dispatch } = useAppStore();
  const plans = state.plans ?? [];
  const customTemplates = state.planTemplates ?? [];
  const allTemplates = [...BUILTIN_PLAN_TEMPLATES, ...customTemplates];

  const [selectedPlanId, setSelectedPlanId] = useState<string>(() => plans[0]?.id ?? '');
  const [newParticipant, setNewParticipant] = useState('');
  const [showTemplates, setShowTemplates] = useState(plans.length === 0);
  const [saveTemplateOpen, setSaveTemplateOpen] = useState(false);
  const [tplTitle, setTplTitle] = useState('');
  const [tplDesc, setTplDesc] = useState('');
  const [confirmDeletePlan, setConfirmDeletePlan] = useState<TournamentPlan | null>(null);
  const [confirmDeleteTemplate, setConfirmDeleteTemplate] = useState<PlanTemplate | null>(null);
  const [launchError, setLaunchError] = useState('');

  const activePlan = useMemo(
    () => plans.find((p) => p.id === selectedPlanId) ?? plans[0] ?? null,
    [plans, selectedPlanId]
  );

  const resolved = useMemo(
    () => (activePlan ? resolvePlan(activePlan, state.matches) : null),
    [activePlan, state.matches]
  );

  const updatePlan = (updater: (plan: TournamentPlan) => TournamentPlan) => {
    if (!activePlan) return;
    dispatch({ type: 'plan/save', plan: updater(activePlan) });
  };

  const applyTemplate = (template: PlanTemplate) => {
    const created = createPlanFromTemplate(template);
    dispatch({ type: 'plan/save', plan: created });
    setSelectedPlanId(created.id);
    setShowTemplates(false);
    setLaunchError('');
  };

  const createNewPlan = () => {
    const created = createBlankPlan(1);
    dispatch({ type: 'plan/save', plan: created });
    setSelectedPlanId(created.id);
    setLaunchError('');
  };

  const upsertSlotMeta = (
    slotId: string,
    round: number,
    index: number,
    isThirdPlace: boolean,
    patch: Partial<PlanMatchSlot>
  ) => {
    updatePlan((plan) => {
      const existing = plan.slots.find((s) => s.id === slotId);
      const updatedSlot: PlanMatchSlot = existing
        ? { ...existing, ...patch }
        : { id: slotId, round, index, isThirdPlace, ...patch };
      const nextSlots = existing
        ? plan.slots.map((s) => (s.id === slotId ? updatedSlot : s))
        : [...plan.slots, updatedSlot];
      return { ...plan, slots: nextSlots };
    });
  };

  const handleAddParticipant = (event: FormEvent) => {
    event.preventDefault();
    const trimmed = newParticipant.trim();
    if (!trimmed || !activePlan) return;
    updatePlan((plan) => ({
      ...plan,
      participants: [...plan.participants, trimmed],
      slots: [],
    }));
    setNewParticipant('');
  };

  const moveParticipant = (index: number, delta: -1 | 1) => {
    if (!activePlan) return;
    const target = index + delta;
    if (target < 0 || target >= activePlan.participants.length) return;
    updatePlan((plan) => {
      const list = [...plan.participants];
      [list[index], list[target]] = [list[target], list[index]];
      return { ...plan, participants: list, slots: [] };
    });
  };

  const removeParticipant = (index: number) => {
    updatePlan((plan) => ({
      ...plan,
      participants: plan.participants.filter((_, i) => i !== index),
      slots: [],
    }));
  };

  const renameParticipant = (index: number, value: string) => {
    updatePlan((plan) => ({
      ...plan,
      participants: plan.participants.map((item, i) => (i === index ? value : item)),
    }));
  };

  const importRegisteredTeams = () => {
    if (!activePlan) return;
    const matching = state.teams
      .filter((t) => t.category === activePlan.category)
      .map((t) => {
        const secName = state.sections.find((s) => s.id === t.sectionId)?.name ?? '';
        return secName ? `${t.name} (${GRADE_NAMES[t.grade]} ${secName})` : t.name;
      });
    if (!matching.length) {
      setLaunchError('لا توجد فرق مسجلة في هذه الفئة بعد.');
      return;
    }
    setLaunchError('');
    updatePlan((plan) => ({ ...plan, participants: matching, slots: [] }));
  };

  const importSections = () => {
    if (!activePlan) return;
    const matching = state.sections
      .filter((s) => getGradeCategory(s.grade) === activePlan.category)
      .sort((a, b) => a.grade - b.grade || a.name.localeCompare(b.name, 'ar'))
      .map((s) => `${GRADE_NAMES[s.grade]} ${s.name}`);
    if (!matching.length) {
      setLaunchError('لا توجد شعب مضافة لهذه الفئة بعد.');
      return;
    }
    setLaunchError('');
    updatePlan((plan) => ({ ...plan, participants: matching, slots: [] }));
  };

  const launchBoardMatch = (node: ResolvedPlanNode) => {
    if (!activePlan || !node.aName || !node.bName || node.bye) return;
    if (node.match) {
      navigate(`board/${node.match.id}`);
      return;
    }
    const aTrim = node.aName.trim();
    const bTrim = node.bName.trim();
    if (!aTrim || !bTrim || aTrim === bTrim) {
      setLaunchError('يجب أن يكون للفريقين اسمان مختلفان لبدء المواجهة.');
      return;
    }
    const boardCheck = buildBoardCells(activePlan.matchType, activePlan.category, state.questions);
    if (!boardCheck.ok) {
      setLaunchError(boardCheck.error);
      return;
    }

    setLaunchError('');
    const matchId = createId('m');
    const next = dispatch({
      type: 'match/quick',
      id: matchId,
      matchType: activePlan.matchType,
      category: activePlan.category,
      names: [aTrim, bTrim],
      starter: 0,
    });
    if (next.matches.some((m) => m.id === matchId)) {
      upsertSlotMeta(node.id, node.round, node.index, node.isThirdPlace, { matchId });
      navigate(`board/${matchId}`);
    }
  };

  const handleSaveAsTemplate = (event: FormEvent) => {
    event.preventDefault();
    if (!activePlan || !tplTitle.trim()) return;
    const template: PlanTemplate = {
      id: createId('tpl'),
      title: tplTitle.trim(),
      description: tplDesc.trim() || `قالب مخصص (${activePlan.participants.length} مشاركين)`,
      category: activePlan.category,
      matchType: activePlan.matchType,
      mode: activePlan.mode,
      includeThirdPlace: activePlan.includeThirdPlace,
      participants: [...activePlan.participants],
      roundNames: [...activePlan.roundNames],
    };
    dispatch({ type: 'template/save', template });
    setSaveTemplateOpen(false);
    setTplTitle('');
    setTplDesc('');
  };

  const renderMatchCard = (node: ResolvedPlanNode) => {
    const canLaunch = Boolean(node.aName && node.bName && !node.bye && node.aName !== node.bName);
    return (
      <div
        key={node.id}
        className="space-y-2 rounded-2xl border border-line bg-white p-3 shadow-card"
      >
        {node.isThirdPlace && (
          <Badge tone="gold">مباراة تحديد المركز الثالث</Badge>
        )}

        <div className="space-y-1.5">
          {([0, 1] as const).map((side) => {
            const label = side === 0 ? node.aName : node.bName;
            const isWinner = node.winnerSide === side;
            const score = node.match ? node.match.scores[side] : null;

            if (side === 1 && node.bye) {
              return (
                <div key={side} className="flex items-center justify-between rounded-lg bg-amber-50 px-3 py-1.5">
                  <span className="text-xs font-extrabold text-amber-800">تأهل تلقائي (BYE)</span>
                  <Badge tone="gold">يتأهل مباشرة</Badge>
                </div>
              );
            }

            return (
              <div
                key={side}
                className={`flex items-center justify-between gap-2 rounded-lg px-3 py-2 ${
                  isWinner ? 'bg-ok font-extrabold text-green-900' : 'bg-page'
                }`}
              >
                <span className="truncate font-bold">{label ?? 'بانتظار المتأهل'}</span>
                <div className="flex items-center gap-1.5">
                  {score !== null && (
                    <span className="rounded bg-white px-2 py-0.5 text-xs font-black text-royal">
                      {score}
                    </span>
                  )}
                  {isWinner && <IconCheck className="text-green-700" />}
                </div>
              </div>
            );
          })}
        </div>

        {!node.bye && (
          <div className="grid gap-1.5 pt-1 print:hidden">
            <input
              type="text"
              placeholder="الموعد أو القاعة (اختياري)…"
              className="w-full rounded-lg border border-line bg-page px-2.5 py-1 text-xs font-semibold outline-none focus:border-royal"
              value={node.scheduledAt}
              onChange={(e) =>
                upsertSlotMeta(node.id, node.round, node.index, node.isThirdPlace, {
                  scheduledAt: e.target.value,
                })
              }
            />

            {canLaunch && (
              <div className="flex flex-wrap gap-1.5">
                <Button
                  className="flex-1 px-2.5 py-1.5 text-xs"
                  variant={node.match ? 'soft' : 'primary'}
                  onClick={() => launchBoardMatch(node)}
                >
                  <IconPlay />
                  {node.match ? 'فتح السبورة' : 'ابدأ على السبورة'}
                </Button>
              </div>
            )}

            {canLaunch && !node.match?.winnerId && (
              <div className="grid grid-cols-2 gap-1.5">
                {([0, 1] as const).map((side) => {
                  const name = side === 0 ? node.aName : node.bName;
                  const active = node.winnerSide === side;
                  return (
                    <button
                      key={side}
                      type="button"
                      onClick={() =>
                        upsertSlotMeta(node.id, node.round, node.index, node.isThirdPlace, {
                          winnerSide: active ? null : side,
                        })
                      }
                      className={`cursor-pointer truncate rounded-lg border px-2 py-1 text-xs font-bold transition ${
                        active
                          ? 'border-green-600 bg-ok text-green-900'
                          : 'border-line bg-white text-mute hover:border-royal hover:text-royal'
                      }`}
                      title={`تحديد فوز ${name}`}
                    >
                      {active ? `✓ فاز` : `فوز: ${name}`}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {node.scheduledAt && (
          <div className="hidden text-xs font-bold text-mute print:block">{node.scheduledAt}</div>
        )}
      </div>
    );
  };

  return (
    <>
      <PageHeader
        title="تخطيط المواجهات والقوالب"
        subtitle="صمّم الأدوار الإقصائية والدوريات باستخدام القوالب الجاهزة أو قوالبك المخصصة — بدون ذكاء اصطناعي"
        actions={
          <>
            <Button variant="ghost" onClick={() => setShowTemplates((s) => !s)}>
              <IconBracket />
              {showTemplates ? 'إخفاء القوالب' : `القوالب (${allTemplates.length})`}
            </Button>
            {activePlan && (
              <>
                <Button
                  variant="soft"
                  onClick={() => {
                    setTplTitle(`قالب ${activePlan.title}`);
                    setTplDesc(activePlan.description ?? '');
                    setSaveTemplateOpen(true);
                  }}
                >
                  <IconBookmarkPlus />
                  حفظ كقالب
                </Button>
                <Button variant="ghost" onClick={() => window.print()}>
                  <IconPrinter />
                  طباعة
                </Button>
              </>
            )}
            <Button onClick={createNewPlan}>
              <IconPlus />
              خطة جديدة
            </Button>
          </>
        }
      />

      {launchError && (
        <div className="mb-4">
          <Notice tone="red">{launchError}</Notice>
        </div>
      )}

      {showTemplates && (
        <Card className="mb-6 border-sky/50 bg-linear-to-bl from-white to-soft/40 print:hidden">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-xl font-black text-ink">قوالب التخطيط الجاهزة</h2>
              <p className="text-sm text-mute">
                اختر قالباً لإنشاء مخطط مواجهات فوري قابل للتعديل والقرعة والتشغيل
              </p>
            </div>
            <Badge tone="blue">{allTemplates.length} قوالب متوفرة</Badge>
          </div>

          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {allTemplates.map((tpl) => (
              <div
                key={tpl.id}
                className="flex flex-col justify-between rounded-2xl border border-line bg-white p-4 shadow-card"
              >
                <div>
                  <div className="mb-2 flex flex-wrap items-center justify-between gap-1.5">
                    <div className="flex flex-wrap gap-1.5">
                      <Badge tone={tpl.mode === 'elimination' ? 'blue' : 'gold'}>
                        {tpl.mode === 'elimination' ? 'أدوار إقصائية' : 'دوري كامل'}
                      </Badge>
                      <Badge tone="gray">{CATEGORIES[tpl.category - 1].name}</Badge>
                      <Badge tone="gray">{tpl.participants.length} مشاركين</Badge>
                    </div>
                    {!tpl.isBuiltIn && (
                      <button
                        type="button"
                        aria-label="حذف القالب"
                        onClick={() => setConfirmDeleteTemplate(tpl)}
                        className="cursor-pointer rounded-lg p-1 text-red-600 hover:bg-err"
                      >
                        <IconTrash />
                      </button>
                    )}
                  </div>
                  <h3 className="font-black text-ink">{tpl.title}</h3>
                  <p className="mt-1 text-sm text-mute">{tpl.description}</p>
                </div>

                <Button
                  variant="soft"
                  className="mt-3 w-full"
                  onClick={() => applyTemplate(tpl)}
                >
                  <IconPlus />
                  إنشاء خطة من هذا القالب
                </Button>
              </div>
            ))}
          </div>
        </Card>
      )}

      {plans.length > 0 && (
        <div className="mb-4 flex flex-wrap items-center gap-2 print:hidden">
          <span className="font-bold text-mute">الخطط المحفوظة:</span>
          {plans.map((plan) => (
            <div key={plan.id} className="inline-flex items-center">
              <Button
                variant={activePlan?.id === plan.id ? 'primary' : 'ghost'}
                onClick={() => setSelectedPlanId(plan.id)}
              >
                <IconSwords />
                {plan.title}
                <span className="text-xs opacity-75">({plan.participants.length})</span>
              </Button>
            </div>
          ))}
        </div>
      )}

      {!activePlan ? (
        <Notice>
          لا توجد خطط مواجهات حالياً. اختر أحد القوالب أعلاه أو اضغط على «خطة جديدة» للبدء.
        </Notice>
      ) : (
        <div className="space-y-6">
          <div className="grid gap-4 lg:grid-cols-12 print:hidden">
            <Card className="space-y-3 lg:col-span-5">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-black">إعدادات الخطة</h2>
                <Button
                  variant="danger"
                  className="px-3 py-1.5 text-sm"
                  onClick={() => setConfirmDeletePlan(activePlan)}
                >
                  <IconTrash />
                  حذف الخطة
                </Button>
              </div>

              <Field label="عنوان البطولة أو الخطة">
                <input
                  className={inputClass}
                  value={activePlan.title}
                  onChange={(e) => updatePlan((p) => ({ ...p, title: e.target.value }))}
                />
              </Field>

              <div className="grid grid-cols-2 gap-2">
                <Field label="الفئة (بنك الأسئلة)">
                  <select
                    className={inputClass}
                    value={activePlan.category}
                    onChange={(e) =>
                      updatePlan((p) => ({
                        ...p,
                        category: Number(e.target.value) as CategoryId,
                      }))
                    }
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </Field>

                <Field label="نوع المواجهة عند التشغيل">
                  <select
                    className={inputClass}
                    value={activePlan.matchType}
                    onChange={(e) =>
                      updatePlan((p) => ({ ...p, matchType: e.target.value as MatchType }))
                    }
                  >
                    <option value="sections">{MATCH_TYPE_LABELS.sections} (9 أسئلة)</option>
                    <option value="grades">{MATCH_TYPE_LABELS.grades} (18 سؤالاً)</option>
                  </select>
                </Field>
              </div>

              <Field label="نظام التخطيط">
                <div className="grid grid-cols-2 gap-2">
                  {(
                    [
                      ['elimination', 'أدوار إقصائية (خروج المغلوب)'],
                      ['round_robin', 'دوري (الكل ضد الكل)'],
                    ] as const
                  ).map(([mode, label]) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() =>
                        updatePlan((p) => ({
                          ...p,
                          mode: mode as BracketPlanMode,
                          slots: [],
                        }))
                      }
                      className={`cursor-pointer rounded-xl border-2 px-3 py-2 text-sm font-bold transition ${
                        activePlan.mode === mode
                          ? 'border-royal bg-soft text-royal'
                          : 'border-line bg-white text-mute hover:border-sky'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </Field>

              {activePlan.mode === 'elimination' && (
                <label className="flex items-center gap-2 font-bold">
                  <input
                    type="checkbox"
                    className="h-4 w-4 accent-royal"
                    checked={activePlan.includeThirdPlace}
                    onChange={(e) =>
                      updatePlan((p) => ({ ...p, includeThirdPlace: e.target.checked }))
                    }
                  />
                  إضافة مباراة تحديد المركز الثالث (لخاسري نصف النهائي)
                </label>
              )}
            </Card>

            <Card className="space-y-3 lg:col-span-7">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-xl font-black">
                  الفرق / المشاركون ({activePlan.participants.length})
                </h2>
                <div className="flex flex-wrap gap-1.5">
                  <Button
                    variant="ghost"
                    className="px-3 py-1.5 text-xs"
                    onClick={importRegisteredTeams}
                  >
                    استيراد الفرق المسجلة
                  </Button>
                  <Button
                    variant="ghost"
                    className="px-3 py-1.5 text-xs"
                    onClick={importSections}
                  >
                    استيراد الشعب
                  </Button>
                  <Button
                    variant="soft"
                    className="px-3 py-1.5 text-xs"
                    onClick={() =>
                      updatePlan((p) => ({
                        ...p,
                        participants: seedStandardBracket(p.participants),
                        slots: [],
                      }))
                    }
                  >
                    توزيع ١ ضد الأخير
                  </Button>
                  <Button
                    variant="soft"
                    className="px-3 py-1.5 text-xs"
                    onClick={() =>
                      updatePlan((p) => ({
                        ...p,
                        participants: shuffleParticipants(p.participants),
                        slots: [],
                      }))
                    }
                  >
                    <IconShuffle />
                    قرعة عشوائية
                  </Button>
                </div>
              </div>

              <form onSubmit={handleAddParticipant} className="flex gap-2">
                <input
                  className={inputClass}
                  placeholder="أضف فريقاً أو صفاً أو شعبة (مثال: التاسع أ)…"
                  value={newParticipant}
                  onChange={(e) => setNewParticipant(e.target.value)}
                />
                <Button type="submit" disabled={!newParticipant.trim()}>
                  <IconPlus />
                  إضافة
                </Button>
              </form>

              <div className="grid max-h-60 gap-2 overflow-y-auto sm:grid-cols-2">
                {activePlan.participants.map((participant, index) => (
                  <div
                    key={`${index}-${participant}`}
                    className="flex items-center gap-1.5 rounded-xl border border-line bg-page p-2"
                  >
                    <span className="w-6 text-center text-xs font-black text-mute">
                      {index + 1}
                    </span>
                    <input
                      aria-label={`اسم المشارك ${index + 1}`}
                      className="min-w-0 flex-1 rounded-lg border border-transparent bg-white px-2 py-1 text-sm font-bold outline-none focus:border-royal"
                      value={participant}
                      onChange={(e) => renameParticipant(index, e.target.value)}
                    />
                    <button
                      type="button"
                      aria-label="تقديم"
                      disabled={index === 0}
                      onClick={() => moveParticipant(index, -1)}
                      className="cursor-pointer rounded p-1 text-mute hover:bg-white disabled:opacity-30"
                    >
                      <IconArrowUp />
                    </button>
                    <button
                      type="button"
                      aria-label="تأخير"
                      disabled={index === activePlan.participants.length - 1}
                      onClick={() => moveParticipant(index, 1)}
                      className="cursor-pointer rounded p-1 text-mute hover:bg-white disabled:opacity-30"
                    >
                      <IconArrowDown />
                    </button>
                    <button
                      type="button"
                      aria-label="حذف"
                      disabled={activePlan.participants.length <= 2}
                      onClick={() => removeParticipant(index)}
                      className="cursor-pointer rounded p-1 text-red-600 hover:bg-err disabled:opacity-30"
                    >
                      <IconTrash />
                    </button>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          <Card>
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 className="text-2xl font-black text-ink">{activePlan.title}</h2>
                <p className="text-sm text-mute">
                  {CATEGORIES[activePlan.category - 1].name} ·{' '}
                  {MATCH_TYPE_LABELS[activePlan.matchType]} ·{' '}
                  {activePlan.mode === 'elimination' ? 'نظام خروج المغلوب' : 'دوري الكل ضد الكل'}
                </p>
              </div>
              {resolved?.champion && (
                <div className="flex items-center gap-2 rounded-2xl border border-gold bg-amber-50 px-4 py-2">
                  <IconCrown className="text-2xl text-gold" />
                  <div>
                    <div className="text-xs font-bold text-mute">بطل المخطط</div>
                    <div className="font-black text-ink">{resolved.champion}</div>
                  </div>
                </div>
              )}
            </div>

            {!resolved || resolved.rounds.length === 0 ? (
              <Notice>أضف مشاركين اثنين على الأقل لتوليد شجرة المواجهات.</Notice>
            ) : activePlan.mode === 'elimination' ? (
              <div className="flex items-stretch gap-4 overflow-x-auto pb-2">
                {resolved.rounds.map((nodes, roundIndex) => {
                  const roundTitle =
                    activePlan.roundNames[roundIndex] ??
                    getDefaultRoundName(roundIndex, resolved.rounds.length, activePlan.mode);
                  return (
                    <div
                      key={roundIndex}
                      className="flex min-w-68 flex-1 flex-col justify-around gap-3"
                    >
                      <input
                        aria-label={`اسم الدور ${roundIndex + 1}`}
                        className="rounded-xl border border-transparent bg-soft/60 px-3 py-1.5 text-center font-extrabold text-royal outline-none focus:border-royal"
                        value={roundTitle}
                        onChange={(e) => {
                          const nextVal = e.target.value;
                          updatePlan((p) => {
                            const names = [...p.roundNames];
                            while (names.length < resolved.rounds.length) {
                              names.push(
                                getDefaultRoundName(names.length, resolved.rounds.length, p.mode)
                              );
                            }
                            names[roundIndex] = nextVal;
                            return { ...p, roundNames: names };
                          });
                        }}
                      />

                      <div className="flex flex-1 flex-col justify-around gap-3">
                        {nodes.map((node) => renderMatchCard(node))}
                      </div>
                    </div>
                  );
                })}

                <div className="flex min-w-56 flex-col justify-center gap-4">
                  <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-gold/60 bg-amber-50 p-5 text-center">
                    <IconCrown className="text-4xl text-gold" />
                    <div className="mt-2 text-sm font-bold text-mute">المركز الأول</div>
                    <div className="mt-1 text-xl font-black text-ink">
                      {resolved.champion ?? 'بانتظار النهائي'}
                    </div>
                  </div>

                  {resolved.thirdPlace && renderMatchCard(resolved.thirdPlace)}
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="overflow-x-auto rounded-2xl border border-line">
                  <table className="w-full text-right text-sm">
                    <thead className="bg-page font-extrabold text-royal">
                      <tr>
                        <th className="px-4 py-3">#</th>
                        <th className="px-4 py-3">الفريق</th>
                        <th className="px-4 py-3">لعب</th>
                        <th className="px-4 py-3">فاز</th>
                        <th className="px-4 py-3">خسر</th>
                        <th className="px-4 py-3">نقاط المسابقة</th>
                        <th className="px-4 py-3">الرصيد</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-line">
                      {resolved.standings.map((row, idx) => (
                        <tr key={row.name} className={idx === 0 && row.won > 0 ? 'bg-amber-50/70' : ''}>
                          <td className="px-4 py-2.5 font-black">{idx + 1}</td>
                          <td className="px-4 py-2.5 font-extrabold">{row.name}</td>
                          <td className="px-4 py-2.5">{row.played}</td>
                          <td className="px-4 py-2.5 font-bold text-green-700">{row.won}</td>
                          <td className="px-4 py-2.5 text-red-600">{row.lost}</td>
                          <td className="px-4 py-2.5">{row.scoreFor}</td>
                          <td className="px-4 py-2.5 font-black text-royal">{row.points}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {resolved.rounds.map((nodes, roundIndex) => (
                    <div key={roundIndex} className="space-y-3 rounded-2xl border border-line bg-page p-3">
                      <h3 className="text-center font-extrabold text-royal">
                        {activePlan.roundNames[roundIndex] ??
                          getDefaultRoundName(roundIndex, resolved.rounds.length, 'round_robin')}
                      </h3>
                      {nodes.map((node) => renderMatchCard(node))}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Card>
        </div>
      )}

      {saveTemplateOpen && (
        <Modal title="حفظ الخطة الحالية كقالب" onClose={() => setSaveTemplateOpen(false)}>
          <form onSubmit={handleSaveAsTemplate} className="space-y-3">
            <Field label="اسم القالب">
              <input
                className={inputClass}
                value={tplTitle}
                onChange={(e) => setTplTitle(e.target.value)}
                required
              />
            </Field>
            <Field label="وصف مختصر">
              <textarea
                rows={2}
                className={inputClass}
                value={tplDesc}
                onChange={(e) => setTplDesc(e.target.value)}
              />
            </Field>
            <Button type="submit">حفظ القالب</Button>
          </form>
        </Modal>
      )}

      <ConfirmModal
        open={!!confirmDeletePlan}
        title="حذف الخطة"
        message={`هل تريد حذف خطة «${confirmDeletePlan?.title ?? ''}»؟`}
        confirmLabel="حذف"
        onCancel={() => setConfirmDeletePlan(null)}
        onConfirm={() => {
          if (confirmDeletePlan) {
            dispatch({ type: 'plan/remove', id: confirmDeletePlan.id });
            if (selectedPlanId === confirmDeletePlan.id) {
              setSelectedPlanId('');
            }
          }
          setConfirmDeletePlan(null);
        }}
      />

      <ConfirmModal
        open={!!confirmDeleteTemplate}
        title="حذف القالب"
        message={`هل تريد حذف القالب «${confirmDeleteTemplate?.title ?? ''}»؟`}
        confirmLabel="حذف"
        onCancel={() => setConfirmDeleteTemplate(null)}
        onConfirm={() => {
          if (confirmDeleteTemplate) {
            dispatch({ type: 'template/remove', id: confirmDeleteTemplate.id });
          }
          setConfirmDeleteTemplate(null);
        }}
      />
    </>
  );
}
