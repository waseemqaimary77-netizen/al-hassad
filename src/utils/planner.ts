import type { Match, PlanMatchSlot, TournamentPlan } from '../types/olympiad';

export interface ResolvedPlanNode {
  id: string;
  round: number;
  index: number;
  isThirdPlace: boolean;
  aName: string | null;
  bName: string | null;
  bye: boolean;
  winnerSide: 0 | 1 | null;
  winnerName: string | null;
  loserName: string | null;
  match: Match | null;
  scheduledAt: string;
  notes: string;
}

export interface RoundRobinStanding {
  name: string;
  played: number;
  won: number;
  lost: number;
  points: number;
  scoreFor: number;
}

export interface ResolvedPlan {
  rounds: ResolvedPlanNode[][];
  thirdPlace: ResolvedPlanNode | null;
  champion: string | null;
  standings: RoundRobinStanding[];
}

export function shuffleParticipants(items: string[]): string[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function seedStandardBracket(items: string[]): string[] {
  const n = items.length;
  if (n <= 2) return [...items];
  const result: string[] = [];
  let left = 0;
  let right = n - 1;
  while (left <= right) {
    result.push(items[left]);
    if (left !== right) {
      result.push(items[right]);
    }
    left++;
    right--;
  }
  return result;
}

export function getDefaultRoundName(
  roundIndex: number,
  totalRounds: number,
  mode: 'elimination' | 'round_robin'
): string {
  if (mode === 'round_robin') {
    return `الجولة ${roundIndex + 1}`;
  }
  const remaining = totalRounds - 1 - roundIndex;
  if (remaining === 0) return 'النهائي';
  if (remaining === 1) return 'نصف النهائي';
  if (remaining === 2) return 'ربع النهائي';
  if (remaining === 3) return 'دور الـ 16';
  return `الدور ${roundIndex + 1}`;
}

function nextPowerOfTwo(n: number): number {
  let p = 1;
  while (p < n) p *= 2;
  return p;
}

function pairRoundOneParticipants(participants: string[]): [string | null, string | null][] {
  const n = participants.length;
  const size = nextPowerOfTwo(n);
  const slotCount = size / 2;
  const pairs: [string | null, string | null][] = Array.from({ length: slotCount }, () => [
    null,
    null,
  ]);

  if (n === size) {
    for (let i = 0; i < slotCount; i++) {
      pairs[i] = [participants[i * 2] ?? null, participants[i * 2 + 1] ?? null];
    }
    return pairs;
  }

  for (let i = 0; i < slotCount; i++) {
    pairs[i][0] = participants[i] ?? null;
  }
  let idx = slotCount;
  // Distribute second entrants starting from alternating slots from the end so Byes stay balanced.
  const secondOrder: number[] = [];
  for (let i = slotCount - 1; i >= 0; i -= 2) secondOrder.push(i);
  for (let i = slotCount - 2; i >= 0; i -= 2) secondOrder.push(i);
  for (const slotIdx of secondOrder) {
    if (idx < n) {
      pairs[slotIdx][1] = participants[idx++] ?? null;
    }
  }
  return pairs;
}

function resolveSlotOutcome(
  slotId: string,
  aName: string | null,
  bName: string | null,
  isBye: boolean,
  slotsMap: Map<string, PlanMatchSlot>,
  matchesMap: Map<string, Match>
): {
  winnerSide: 0 | 1 | null;
  winnerName: string | null;
  loserName: string | null;
  match: Match | null;
  scheduledAt: string;
  notes: string;
} {
  const meta = slotsMap.get(slotId);
  const match = meta?.matchId ? (matchesMap.get(meta.matchId) ?? null) : null;

  let winnerSide: 0 | 1 | null = null;
  if (isBye) {
    winnerSide = aName ? 0 : bName ? 1 : null;
  } else if (match?.status === 'finished' && match.winnerId) {
    const idx = match.teamIds.indexOf(match.winnerId);
    if (idx === 0 || idx === 1) {
      winnerSide = idx;
    }
  } else if (meta?.winnerSide === 0 || meta?.winnerSide === 1) {
    if ((meta.winnerSide === 0 && aName) || (meta.winnerSide === 1 && bName)) {
      winnerSide = meta.winnerSide;
    }
  }

  const winnerName = winnerSide === 0 ? aName : winnerSide === 1 ? bName : null;
  const loserName = !isBye && winnerSide !== null ? (winnerSide === 0 ? bName : aName) : null;

  return {
    winnerSide,
    winnerName,
    loserName,
    match,
    scheduledAt: meta?.scheduledAt ?? '',
    notes: meta?.notes ?? '',
  };
}

export function resolvePlan(plan: TournamentPlan, matches: Match[]): ResolvedPlan {
  const cleanParticipants = plan.participants.map((p) => p.trim()).filter(Boolean);
  const slotsMap = new Map(plan.slots.map((s) => [s.id, s]));
  const matchesMap = new Map(matches.map((m) => [m.id, m]));

  if (cleanParticipants.length < 2) {
    return { rounds: [], thirdPlace: null, champion: null, standings: [] };
  }

  if (plan.mode === 'round_robin') {
    const list = [...cleanParticipants];
    if (list.length % 2 === 1) list.push('__BYE__');
    const n = list.length;
    const roundCount = n - 1;
    const rounds: ResolvedPlanNode[][] = [];

    const stats = new Map<string, RoundRobinStanding>(
      cleanParticipants.map((name) => [
        name,
        { name, played: 0, won: 0, lost: 0, points: 0, scoreFor: 0 },
      ])
    );

    const rot = [...list];
    for (let r = 0; r < roundCount; r++) {
      const roundNodes: ResolvedPlanNode[] = [];
      let matchIdx = 0;
      for (let i = 0; i < n / 2; i++) {
        const a = rot[i];
        const b = rot[n - 1 - i];
        if (a === '__BYE__' || b === '__BYE__') continue;
        const id = `rr-${r}-${matchIdx}`;
        const resolved = resolveSlotOutcome(id, a, b, false, slotsMap, matchesMap);
        roundNodes.push({
          id,
          round: r,
          index: matchIdx,
          isThirdPlace: false,
          aName: a,
          bName: b,
          bye: false,
          ...resolved,
        });

        if (resolved.winnerSide !== null) {
          const statA = stats.get(a);
          const statB = stats.get(b);
          if (statA && statB) {
            statA.played += 1;
            statB.played += 1;
            if (resolved.match) {
              statA.scoreFor += resolved.match.scores[0];
              statB.scoreFor += resolved.match.scores[1];
            }
            if (resolved.winnerSide === 0) {
              statA.won += 1;
              statA.points += 3;
              statB.lost += 1;
            } else {
              statB.won += 1;
              statB.points += 3;
              statA.lost += 1;
            }
          }
        }
        matchIdx++;
      }
      rounds.push(roundNodes);
      // Circle rotation keeping rot[0] fixed
      const last = rot.pop()!;
      rot.splice(1, 0, last);
    }

    const standings = [...stats.values()].sort(
      (x, y) => y.points - x.points || y.won - x.won || y.scoreFor - x.scoreFor
    );
    const allFinished = rounds.every((r) => r.every((node) => node.winnerSide !== null));
    return {
      rounds,
      thirdPlace: null,
      champion: allFinished && standings[0]?.won > 0 ? standings[0].name : null,
      standings,
    };
  }

  // Elimination bracket
  const rounds: ResolvedPlanNode[][] = [];
  const firstRoundPairs = pairRoundOneParticipants(cleanParticipants);
  const totalRounds = Math.log2(firstRoundPairs.length * 2);

  let currentPairs: [string | null, string | null][] = firstRoundPairs;
  for (let r = 0; r < totalRounds; r++) {
    const roundNodes: ResolvedPlanNode[] = currentPairs.map(([aName, bName], index) => {
      const id = `el-${r}-${index}`;
      const bye = (!!aName && !bName) || (!aName && !!bName);
      const resolved = resolveSlotOutcome(id, aName, bName, bye, slotsMap, matchesMap);
      return {
        id,
        round: r,
        index,
        isThirdPlace: false,
        aName,
        bName,
        bye,
        ...resolved,
      };
    });
    rounds.push(roundNodes);

    const nextPairs: [string | null, string | null][] = [];
    for (let i = 0; i < roundNodes.length; i += 2) {
      nextPairs.push([
        roundNodes[i]?.winnerName ?? null,
        roundNodes[i + 1]?.winnerName ?? null,
      ]);
    }
    currentPairs = nextPairs;
  }

  let thirdPlace: ResolvedPlanNode | null = null;
  if (plan.includeThirdPlace && rounds.length >= 2) {
    const semiRound = rounds[rounds.length - 2];
    const loserA = semiRound[0]?.loserName ?? null;
    const loserB = semiRound[1]?.loserName ?? null;
    const id = 'el-third-place';
    const resolved = resolveSlotOutcome(id, loserA, loserB, false, slotsMap, matchesMap);
    thirdPlace = {
      id,
      round: rounds.length - 1,
      index: 1,
      isThirdPlace: true,
      aName: loserA,
      bName: loserB,
      bye: false,
      ...resolved,
    };
  }

  const finalNode = rounds[rounds.length - 1]?.[0];
  return {
    rounds,
    thirdPlace,
    champion: finalNode?.winnerName ?? null,
    standings: [],
  };
}
