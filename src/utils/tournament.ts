import {
  CATEGORIES,
  DIFFICULTIES,
  GRADE_NAMES,
  SUBJECTS,
  getDifficultyName,
  getGradeCategory,
  getSubjectName,
} from '../data/constants';
import { createDefaultState } from '../data/defaultQuestions';
import type {
  Action,
  AppState,
  BoardCell,
  Bracket,
  BracketNode,
  CategoryId,
  Entrant,
  Grade,
  Match,
  MatchType,
  Question,
  Section,
  SubjectId,
  Team,
  TeamStatus,
} from '../types/olympiad';

export const createId = (prefix: string): string =>
  `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;

export function buildBoardCells(
  matchType: MatchType,
  category: CategoryId,
  questions: Question[],
  usageCounts: Record<string, number> = {}
): { ok: true; cells: BoardCell[] } | { ok: false; error: string } {
  const cells: BoardCell[] = [];
  const needed = matchType === 'grades' ? 2 : 1;

  for (const diff of DIFFICULTIES) {
    for (const subject of SUBJECTS) {
      const pool = questions
        .filter((q) => q.category === category && q.subject === subject.id && q.difficulty === diff.id)
        .map((q) => ({ q, key: (usageCounts[q.id] ?? 0) + Math.random() * 0.5 }))
        .sort((a, b) => a.key - b.key)
        .map((item) => item.q);

      if (pool.length < needed) {
        return {
          ok: false,
          error: `بنك الأسئلة يحتاج ${needed} على الأقل في ${getSubjectName(subject.id)} / ${getDifficultyName(diff.id)} لهذه الفئة (المتوفر ${pool.length}).`,
        };
      }

      for (const slot of [0, 1] as const) {
        const locked = slot >= needed;
        cells.push({
          id: `${subject.id}-${diff.id}-${slot}`,
          subject: subject.id,
          difficulty: diff.id,
          slot,
          points: diff.points,
          locked,
          question: locked ? null : { ...pool[slot] },
          used: false,
          awardedTo: null,
        });
      }
    }
  }

  return { ok: true, cells };
}

export function getCurrentTurn(match: Match): 0 | 1 {
  const activeCell = match.cells.find((c) => c.id === match.activeCellId);
  if (activeCell?.tiebreakFirst !== undefined) {
    return activeCell.tiebreakFirst;
  }
  const usedCount = match.cells.filter((c) => c.used).length;
  return usedCount % 2 === 0 ? match.starter : ((1 - match.starter) as 0 | 1);
}

export function getCellBlockReason(match: Match, cellId: string): string | null {
  const cell = match.cells.find((c) => c.id === cellId);
  if (!cell) return 'خانة غير موجودة';
  if (cell.locked) return 'مقفلة: غير متاحة في مواجهات الشعب';
  if (cell.used) return 'سؤال مستهلك';
  if (match.status !== 'live') return 'المباراة ليست جارية';
  if (match.activeCellId) return 'أنهِ السؤال المفتوح أولاً';
  if (match.type === 'grades' && match.strictSets && cell.slot !== getCurrentTurn(match)) {
    return 'هذا السؤال ضمن مجموعة الفريق الآخر';
  }
  return null;
}

export const needsTiebreaker = (match: Match): boolean =>
  match.status === 'live' &&
  !match.activeCellId &&
  match.scores[0] === match.scores[1] &&
  match.cells.every((cell) => cell.locked || cell.used);

export function pickTiebreakQuestion(
  match: Match,
  subject: SubjectId,
  questions: Question[],
  usageCounts: Record<string, number>
): Question | null {
  const usedIds = new Set(match.cells.map((c) => c.question?.id));
  const scoreQuestion = (q: Question) =>
    (q.difficulty === 'hard' ? 0 : 100) + (usageCounts[q.id] ?? 0) + Math.random() * 0.5;
  const candidates = questions.filter((q) => q.category === match.category && q.subject === subject);
  const unused = candidates.filter((q) => !usedIds.has(q.id));
  const pool = unused.length ? unused : candidates;
  return pool.map((q) => ({ q, k: scoreQuestion(q) })).sort((a, b) => a.k - b.k)[0]?.q ?? null;
}

export const gradeStage = (grade: Grade): string => `grade-${grade}`;
export const mainStage = (category: CategoryId): string => `main-${category}`;

function applyOrder(entrants: Entrant[], order?: string[]): Entrant[] {
  if (!order) return entrants;
  const getRank = (e: Entrant) => {
    const idx = order.indexOf(e.key);
    return idx < 0 ? order.length : idx;
  };
  return [...entrants].sort((a, b) => getRank(a) - getRank(b));
}

export function buildBracket(stage: string, entrants: Entrant[], matches: Match[]): Bracket {
  const rounds: BracketNode[][] = [];
  if (entrants.length === 0) {
    return { stage, rounds, champion: null, entrants };
  }

  let current: (Entrant | null)[] = entrants;
  let roundIndex = 0;

  while (current.length > 1) {
    const roundNodes: BracketNode[] = [];
    for (let i = 0; i < current.length; i += 2) {
      const nodeIndex = i / 2;
      const a = current[i] ?? null;
      const bye = i + 1 >= current.length;
      const b = bye ? null : (current[i + 1] ?? null);
      const match =
        matches.find(
          (m) =>
            m.slot?.stage === stage &&
            m.slot.round === roundIndex &&
            m.slot.index === nodeIndex &&
            !!a?.teamId &&
            !!b?.teamId &&
            m.teamIds.includes(a.teamId) &&
            m.teamIds.includes(b.teamId)
        ) ?? null;

      let winner: Entrant | null = null;
      if (bye) {
        winner = a;
      } else if (match?.status === 'finished' && match.winnerId) {
        winner = a?.teamId === match.winnerId ? a : b;
      }

      roundNodes.push({
        stage,
        round: roundIndex,
        index: nodeIndex,
        a,
        b,
        bye,
        winner,
        match,
      });
    }
    rounds.push(roundNodes);
    current = roundNodes.map((node) => node.winner);
    roundIndex++;
  }

  return {
    stage,
    rounds,
    champion: current[0] ?? null,
    entrants,
  };
}

export const getSectionsForGrade = (state: AppState, grade: Grade): Section[] =>
  state.sections.filter((s) => s.grade === grade).sort((a, b) => a.name.localeCompare(b.name, 'ar'));

export const getTeamForSection = (state: AppState, sectionId: string): Team | null =>
  state.teams.find((t) => t.sectionId === sectionId) ?? null;

export const getTeamSectionLabel = (state: AppState, team: Team): string => {
  const sectionName = state.sections.find((s) => s.id === team.sectionId)?.name ?? '';
  return `${GRADE_NAMES[team.grade]} ${sectionName}`;
};

export function getGradeBracket(state: AppState, grade: Grade): Bracket {
  const stage = gradeStage(grade);
  const entrants: Entrant[] = getSectionsForGrade(state, grade).map((section) => ({
    key: section.id,
    teamId: getTeamForSection(state, section.id)?.id ?? null,
    label: `${GRADE_NAMES[grade]} ${section.name}`,
  }));
  return buildBracket(stage, applyOrder(entrants, state.orders[stage]), state.matches);
}

export function getGradeRepresentativeId(state: AppState, grade: Grade): string | null {
  const bracket = getGradeBracket(state, grade);
  if (bracket.entrants.length === 0 || bracket.entrants.some((e) => !e.teamId)) {
    return null;
  }
  return bracket.champion?.teamId ?? null;
}

export function getMainBracket(state: AppState, category: CategoryId): Bracket {
  const stage = mainStage(category);
  const entrants: Entrant[] = CATEGORIES[category - 1].grades
    .filter((grade) => getSectionsForGrade(state, grade).length > 0)
    .map((grade) => ({
      key: `g${grade}`,
      teamId: getGradeRepresentativeId(state, grade),
      label: `ممثل ${GRADE_NAMES[grade]}`,
    }));
  return buildBracket(stage, applyOrder(entrants, state.orders[stage]), state.matches);
}

export function getRoundTitle(bracket: Bracket, roundIndex: number): string {
  const remaining = bracket.rounds.length - 1 - roundIndex;
  const isMain = bracket.stage.startsWith('main');
  if (remaining === 0) return isMain ? 'النهائي' : 'نهائي الصف';
  if (isMain && remaining === 1) return 'نصف النهائي';
  return `الدور ${roundIndex + 1}`;
}

export const hasCategoryStarted = (state: AppState, category: CategoryId): boolean =>
  state.matches.some((m) => m.category === category && m.status !== 'setup' && !m.names);

export const hasGradeStarted = (state: AppState, grade: Grade): boolean =>
  state.matches.some(
    (m) =>
      m.status !== 'setup' &&
      (m.slot?.stage === mainStage(getGradeCategory(grade)) ||
        m.teamIds.some((id) => state.teams.find((t) => t.id === id)?.grade === grade))
  );

export function getCategoryStatus(state: AppState, category: CategoryId): string {
  if (getMainBracket(state, category).champion?.teamId) return 'مكتملة';
  if (hasCategoryStarted(state, category)) return 'جارية';
  return 'قيد الإعداد';
}

export function getTeamStatus(state: AppState, team: Team): TeamStatus {
  if (getMainBracket(state, team.category).champion?.teamId === team.id) return 'champion';
  if (
    state.matches.some(
      (m) =>
        m.slot &&
        m.status === 'finished' &&
        m.teamIds.includes(team.id) &&
        m.winnerId !== team.id
    )
  ) {
    return 'out';
  }
  if (getGradeRepresentativeId(state, team.grade) === team.id) return 'rep';
  return 'in';
}

export function validateMatchup(
  state: AppState,
  matchType: MatchType,
  teamAId: string,
  teamBId: string,
  friendly: boolean
):
  | {
      ok: true;
      type: MatchType;
      category: CategoryId;
      slot: { stage: string; round: number; index: number } | null;
      existing: Match | null;
    }
  | { ok: false; error: string } {
  const teamA = state.teams.find((t) => t.id === teamAId);
  const teamB = state.teams.find((t) => t.id === teamBId);

  if (!teamA || !teamB) return { ok: false, error: 'اختر الفريقين' };
  if (teamA.id === teamB.id) return { ok: false, error: 'لا يمكن أن يواجه الفريق نفسه' };
  if (teamA.category !== teamB.category || getGradeCategory(teamA.grade) !== getGradeCategory(teamB.grade)) {
    return { ok: false, error: 'لا يجوز خلط فرق الفئتين' };
  }
  if (matchType === 'sections' && (teamA.grade !== teamB.grade || teamA.sectionId === teamB.sectionId)) {
    return { ok: false, error: 'مواجهة الشعب تكون بين شعبتين من الصف نفسه' };
  }
  if (matchType === 'grades' && teamA.grade === teamB.grade) {
    return { ok: false, error: 'مواجهة الصفوف تكون بين صفين مختلفين' };
  }
  if (friendly) {
    return { ok: true, type: matchType, category: teamA.category, slot: null, existing: null };
  }

  const bracket =
    matchType === 'sections'
      ? getGradeBracket(state, teamA.grade)
      : getMainBracket(state, teamA.category);
  const node = bracket.rounds.flat().find((item) => {
    const pair = [item.a?.teamId, item.b?.teamId];
    return !item.bye && pair.includes(teamA.id) && pair.includes(teamB.id);
  });

  if (!node) {
    return {
      ok: false,
      error: 'هذان الفريقان غير متقابلين حالياً في شجرة التأهل. رتّب القرعة أو أكمل التصفيات، أو فعّل «مواجهة ودية».',
    };
  }
  if (node.match?.status === 'finished') {
    return { ok: false, error: 'سُجلت نتيجة هذه المواجهة مسبقاً' };
  }

  return {
    ok: true,
    type: matchType,
    category: teamA.category,
    slot: { stage: node.stage, round: node.round, index: node.index },
    existing: node.match,
  };
}

export function hasDependentMatches(state: AppState, match: Match): boolean {
  if (!match.slot) return false;
  const { stage, round } = match.slot;
  return state.matches.some(
    (other) =>
      other.id !== match.id &&
      other.slot &&
      ((other.slot.stage === stage &&
        other.slot.round > round &&
        other.teamIds.some((id) => match.teamIds.includes(id))) ||
        (stage.startsWith('grade') &&
          other.slot.stage.startsWith('main') &&
          other.teamIds.some((id) => match.teamIds.includes(id))))
  );
}

export function getMatchTeamInfo(
  state: AppState,
  match: Match,
  side: 0 | 1
): { name: string; label: string } {
  if (match.names) {
    return {
      name: match.names[side],
      label: CATEGORIES[match.category - 1].range,
    };
  }
  const team = state.teams.find((t) => t.id === match.teamIds[side]);
  return team
    ? { name: team.name, label: getTeamSectionLabel(state, team) }
    : { name: '—', label: '' };
}

const mapMatch = (state: AppState, matchId: string, updater: (m: Match) => Match): AppState => ({
  ...state,
  matches: state.matches.map((m) => (m.id === matchId ? updater(m) : m)),
});

const getQuestionUsageCounts = (state: AppState): Record<string, number> => {
  const counts: Record<string, number> = {};
  state.matches.forEach((m) =>
    m.cells.forEach((c) => {
      if (c.question) {
        counts[c.question.id] = (counts[c.question.id] ?? 0) + 1;
      }
    })
  );
  return counts;
};

const resetTimer = (match: Match) => ({
  duration: match.timer.duration,
  remaining: match.timer.duration,
  endsAt: null,
});

export function appReducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'section/add': {
      const name = action.name.trim();
      if (
        !name ||
        hasGradeStarted(state, action.grade) ||
        state.sections.some((s) => s.grade === action.grade && s.name === name)
      ) {
        return state;
      }
      return {
        ...state,
        sections: [...state.sections, { id: action.id, grade: action.grade, name }],
      };
    }

    case 'section/remove': {
      const section = state.sections.find((s) => s.id === action.id);
      if (
        !section ||
        hasGradeStarted(state, section.grade) ||
        state.teams.some((t) => t.sectionId === action.id)
      ) {
        return state;
      }
      return {
        ...state,
        sections: state.sections.filter((s) => s.id !== action.id),
      };
    }

    case 'team/save': {
      const team = action.team;
      const section = state.sections.find((s) => s.id === team.sectionId);
      if (
        !section ||
        section.grade !== team.grade ||
        getGradeCategory(team.grade) !== team.category ||
        !team.name.trim() ||
        team.students.length !== 4 ||
        team.students.some((name) => !name.trim()) ||
        state.teams.some((t) => t.id !== team.id && t.sectionId === team.sectionId)
      ) {
        return state;
      }
      const existing = state.teams.find((t) => t.id === team.id);
      if (existing) {
        if (
          existing.sectionId !== team.sectionId &&
          (hasGradeStarted(state, existing.grade) ||
            hasGradeStarted(state, team.grade) ||
            state.matches.some((m) => m.teamIds.includes(team.id)))
        ) {
          return state;
        }
        return {
          ...state,
          teams: state.teams.map((t) => (t.id === team.id ? team : t)),
        };
      }
      if (hasGradeStarted(state, team.grade)) return state;
      return {
        ...state,
        teams: [...state.teams, team],
      };
    }

    case 'team/remove': {
      const team = state.teams.find((t) => t.id === action.id);
      if (
        !team ||
        hasGradeStarted(state, team.grade) ||
        state.matches.some((m) => m.teamIds.includes(action.id))
      ) {
        return state;
      }
      return {
        ...state,
        teams: state.teams.filter((t) => t.id !== action.id),
      };
    }

    case 'question/save': {
      const exists = state.questions.some((q) => q.id === action.question.id);
      return {
        ...state,
        questions: exists
          ? state.questions.map((q) => (q.id === action.question.id ? action.question : q))
          : [...state.questions, action.question],
      };
    }

    case 'question/remove':
      return {
        ...state,
        questions: state.questions.filter((q) => q.id !== action.id),
      };

    case 'order/set':
      if (state.matches.some((m) => m.slot?.stage === action.stage)) return state;
      return {
        ...state,
        orders: { ...state.orders, [action.stage]: action.order },
      };

    case 'match/quick': {
      const names: [string, string] = [action.names[0].trim(), action.names[1].trim()];
      if (!names[0] || !names[1] || names[0] === names[1]) return state;
      const board = buildBoardCells(
        action.matchType,
        action.category,
        state.questions,
        getQuestionUsageCounts(state)
      );
      if (!board.ok) return state;
      const duration = state.settings.timerSeconds;
      const match: Match = {
        id: action.id,
        type: action.matchType,
        category: action.category,
        teamIds: [`${action.id}-a`, `${action.id}-b`],
        names,
        slot: null,
        status: 'live',
        starter: action.starter,
        strictSets: state.settings.strictSets,
        cells: board.cells,
        scores: [0, 0],
        activeCellId: null,
        answerRevealed: false,
        winnerId: null,
        manualResult: false,
        timer: { duration, remaining: duration, endsAt: null },
        createdAt: Date.now(),
      };
      return { ...state, matches: [...state.matches, match] };
    }

    case 'match/create':
    case 'match/manualResult': {
      const isManual = action.type === 'match/manualResult';
      const check = validateMatchup(
        state,
        action.matchType,
        action.teamIds[0],
        action.teamIds[1],
        isManual ? false : action.friendly
      );
      if (!check.ok || check.existing) return state;
      if (isManual && !action.teamIds.includes(action.winnerId)) return state;

      const board = isManual
        ? null
        : buildBoardCells(
            action.matchType,
            check.category,
            state.questions,
            getQuestionUsageCounts(state)
          );
      if (board && !board.ok) return state;

      const duration = state.settings.timerSeconds;
      const match: Match = {
        id: action.id,
        type: action.matchType,
        category: check.category,
        teamIds: action.teamIds,
        slot: check.slot,
        status: isManual ? 'finished' : 'setup',
        starter: isManual ? 0 : action.starter,
        strictSets: state.settings.strictSets,
        cells: board && board.ok ? board.cells : [],
        scores: [0, 0],
        activeCellId: null,
        answerRevealed: false,
        winnerId: isManual ? action.winnerId : null,
        manualResult: isManual,
        timer: { duration, remaining: duration, endsAt: null },
        createdAt: Date.now(),
      };
      return { ...state, matches: [...state.matches, match] };
    }

    case 'match/remove': {
      const match = state.matches.find((m) => m.id === action.id);
      if (!match || hasDependentMatches(state, match)) return state;
      return {
        ...state,
        matches: state.matches.filter((m) => m.id !== action.id),
      };
    }

    case 'match/starter':
      return mapMatch(state, action.id, (m) =>
        m.status === 'setup' ? { ...m, starter: action.starter } : m
      );

    case 'match/start':
      return mapMatch(state, action.id, (m) =>
        m.status === 'setup' ? { ...m, status: 'live' } : m
      );

    case 'match/open':
      return mapMatch(state, action.id, (m) => {
        if (getCellBlockReason(m, action.cellId)) return m;
        return {
          ...m,
          activeCellId: action.cellId,
          answerRevealed: false,
          celebration: null,
          timer: {
            duration: m.timer.duration,
            remaining: m.timer.duration,
            endsAt: action.now + m.timer.duration * 1000,
          },
        };
      });

    case 'match/reveal':
      return mapMatch(state, action.id, (m) =>
        m.activeCellId
          ? {
              ...m,
              answerRevealed: true,
              timer: m.timer.endsAt
                ? {
                    ...m.timer,
                    remaining: Math.max(0, Math.ceil((m.timer.endsAt - action.now) / 1000)),
                    endsAt: null,
                  }
                : m.timer,
            }
          : m
      );

    case 'match/judge':
      return mapMatch(state, action.id, (m) => {
        const activeCell = m.cells.find((c) => c.id === m.activeCellId);
        if (m.status !== 'live' || !activeCell || !m.answerRevealed) return m;
        const scores: [number, number] = [...m.scores];
        if (action.side !== null) {
          scores[action.side] += activeCell.points;
        }
        const tiebreakWon = activeCell.tiebreakFirst !== undefined && action.side !== null;
        return {
          ...m,
          ...(tiebreakWon
            ? { status: 'finished' as const, winnerId: m.teamIds[action.side!] }
            : {}),
          scores,
          activeCellId: null,
          answerRevealed: false,
          timer: resetTimer(m),
          celebration: { side: action.side, points: activeCell.points, at: action.now },
          cells: m.cells.map((c) =>
            c.id === activeCell.id ? { ...c, used: true, awardedTo: action.side } : c
          ),
        };
      });

    case 'match/adjust':
      return mapMatch(state, action.id, (m) => {
        if (m.status !== 'live') return m;
        const scores: [number, number] = [...m.scores];
        scores[action.side] = Math.max(0, scores[action.side] + action.delta);
        return { ...m, scores };
      });

    case 'match/finish':
      return mapMatch(state, action.id, (m) => {
        if (m.status !== 'live' || m.activeCellId || !m.teamIds.includes(action.winnerId)) {
          return m;
        }
        const [scoreA, scoreB] = m.scores;
        if (scoreA !== scoreB && action.winnerId !== m.teamIds[scoreA > scoreB ? 0 : 1]) {
          return m;
        }
        return {
          ...m,
          status: 'finished',
          winnerId: action.winnerId,
          timer: resetTimer(m),
        };
      });

    case 'timer/toggle':
      return mapMatch(state, action.id, (m) => {
        const timer = m.timer;
        if (timer.endsAt) {
          return {
            ...m,
            timer: {
              ...timer,
              remaining: Math.max(0, Math.ceil((timer.endsAt - action.now) / 1000)),
              endsAt: null,
            },
          };
        }
        const remaining = timer.remaining || timer.duration;
        return {
          ...m,
          timer: { ...timer, remaining, endsAt: action.now + remaining * 1000 },
        };
      });

    case 'timer/rewind':
      return mapMatch(state, action.id, (m) => {
        if (!m.activeCellId || m.answerRevealed) return m;
        const timer = m.timer;
        const current = timer.endsAt
          ? Math.max(0, (timer.endsAt - action.now) / 1000)
          : timer.remaining;
        const next = Math.min(timer.duration, current + action.seconds);
        return {
          ...m,
          timer: {
            ...timer,
            remaining: Math.ceil(next),
            endsAt: timer.endsAt ? action.now + next * 1000 : null,
          },
        };
      });

    case 'timer/reset':
      return mapMatch(state, action.id, (m) => ({ ...m, timer: resetTimer(m) }));

    case 'match/tiebreak':
      return mapMatch(state, action.id, (m) => {
        if (!needsTiebreaker(m)) return m;
        const question = pickTiebreakQuestion(
          m,
          action.subject,
          state.questions,
          getQuestionUsageCounts(state)
        );
        if (!question) return m;
        const cellId = `tiebreak-${m.cells.filter((c) => c.tiebreakFirst !== undefined).length + 1}`;
        const points = DIFFICULTIES.find((d) => d.id === question.difficulty)?.points ?? 300;
        return {
          ...m,
          activeCellId: cellId,
          answerRevealed: false,
          celebration: null,
          cells: [
            ...m.cells,
            {
              id: cellId,
              subject: action.subject,
              difficulty: question.difficulty,
              slot: 0,
              points,
              locked: false,
              question: { ...question },
              used: false,
              awardedTo: null,
              tiebreakFirst: action.first,
            },
          ],
          timer: {
            duration: m.timer.duration,
            remaining: m.timer.duration,
            endsAt: action.now + m.timer.duration * 1000,
          },
        };
      });

    case 'settings/save':
      return { ...state, settings: action.settings };

    case 'state/replace':
      return action.state;

    case 'state/reset':
      return createDefaultState();

    default:
      return state;
  }
}
