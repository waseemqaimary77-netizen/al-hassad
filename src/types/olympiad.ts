export type CategoryId = 1 | 2;
export type SubjectId = 'chemistry' | 'biology' | 'physics';
export type DifficultyId = 'easy' | 'medium' | 'hard';
export type Grade = 6 | 7 | 8 | 9 | 10 | 11 | 12;
export type MatchType = 'sections' | 'grades';
export type MatchStatus = 'setup' | 'live' | 'finished';
export type TeamStatus = 'champion' | 'out' | 'rep' | 'in';

export interface Section {
  id: string;
  grade: Grade;
  name: string;
}

export interface Team {
  id: string;
  name: string;
  category: CategoryId;
  grade: Grade;
  sectionId: string;
  students: string[];
}

export interface Question {
  id: string;
  category: CategoryId;
  subject: SubjectId;
  difficulty: DifficultyId;
  text: string;
  answer: string;
  explanation: string;
  reference: string;
}

export interface BoardCell {
  id: string;
  subject: SubjectId;
  difficulty: DifficultyId;
  slot: 0 | 1;
  points: number;
  locked: boolean;
  question: Question | null;
  used: boolean;
  awardedTo: 0 | 1 | null;
  tiebreakFirst?: 0 | 1;
}

export interface MatchTimer {
  duration: number;
  remaining: number;
  endsAt: number | null;
}

export interface MatchCelebration {
  side: 0 | 1 | null;
  points: number;
  at: number;
}

export interface MatchSlot {
  stage: string;
  round: number;
  index: number;
}

export interface Match {
  id: string;
  type: MatchType;
  category: CategoryId;
  teamIds: [string, string];
  names?: [string, string];
  slot: MatchSlot | null;
  status: MatchStatus;
  starter: 0 | 1;
  strictSets: boolean;
  cells: BoardCell[];
  scores: [number, number];
  activeCellId: string | null;
  answerRevealed: boolean;
  winnerId: string | null;
  manualResult: boolean;
  timer: MatchTimer;
  celebration?: MatchCelebration | null;
  createdAt: number;
}

export interface Entrant {
  key: string;
  teamId: string | null;
  label: string;
}

export interface BracketNode {
  stage: string;
  round: number;
  index: number;
  a: Entrant | null;
  b: Entrant | null;
  bye: boolean;
  winner: Entrant | null;
  match: Match | null;
}

export interface Bracket {
  stage: string;
  rounds: BracketNode[][];
  champion: Entrant | null;
  entrants: Entrant[];
}

export interface Settings {
  school: string;
  organizer: string;
  presenter: string;
  timerSeconds: number;
  firstSeconds: number;
  strictSets: boolean;
}

export interface AppState {
  version: number;
  sections: Section[];
  teams: Team[];
  questions: Question[];
  matches: Match[];
  orders: Record<string, string[]>;
  settings: Settings;
}

export type Action =
  | { type: 'section/add'; grade: Grade; name: string; id: string }
  | { type: 'section/remove'; id: string }
  | { type: 'team/save'; team: Team }
  | { type: 'team/remove'; id: string }
  | { type: 'question/save'; question: Question }
  | { type: 'question/remove'; id: string }
  | { type: 'order/set'; stage: string; order: string[] }
  | {
      type: 'match/quick';
      id: string;
      matchType: MatchType;
      category: CategoryId;
      names: [string, string];
      starter: 0 | 1;
    }
  | {
      type: 'match/create';
      id: string;
      matchType: MatchType;
      teamIds: [string, string];
      starter: 0 | 1;
      friendly: boolean;
    }
  | {
      type: 'match/manualResult';
      id: string;
      matchType: MatchType;
      teamIds: [string, string];
      winnerId: string;
    }
  | { type: 'match/remove'; id: string }
  | { type: 'match/starter'; id: string; starter: 0 | 1 }
  | { type: 'match/start'; id: string }
  | { type: 'match/open'; id: string; cellId: string; now: number }
  | { type: 'match/reveal'; id: string; now: number }
  | { type: 'match/judge'; id: string; side: 0 | 1 | null; now: number }
  | { type: 'match/adjust'; id: string; side: 0 | 1; delta: number }
  | { type: 'match/finish'; id: string; winnerId: string }
  | { type: 'timer/toggle'; id: string; now: number }
  | { type: 'timer/rewind'; id: string; seconds: number; now: number }
  | { type: 'timer/reset'; id: string }
  | { type: 'match/tiebreak'; id: string; subject: SubjectId; first: 0 | 1; now: number }
  | { type: 'settings/save'; settings: Settings }
  | { type: 'state/replace'; state: AppState }
  | { type: 'state/reset' };
