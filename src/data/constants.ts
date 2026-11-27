import type {
  CategoryId,
  DifficultyId,
  Grade,
  MatchStatus,
  MatchType,
  SubjectId,
  TeamStatus,
} from '../types/olympiad';

export const ASSETS = {
  schoolLogo: '/assets/images/school-logo.webp',
  committeeLogo: '/assets/images/committee-logo.webp',
  presenter: '/assets/images/presenter.webp',
} as const;

export const CATEGORIES: { id: CategoryId; name: string; range: string; grades: Grade[] }[] = [
  { id: 1, name: 'الفئة الأولى', range: 'من السادس إلى التاسع', grades: [6, 7, 8, 9] },
  { id: 2, name: 'الفئة الثانية', range: 'من العاشر إلى الثاني عشر', grades: [10, 11, 12] },
];

export const GRADES: Grade[] = [6, 7, 8, 9, 10, 11, 12];

export const GRADE_NAMES: Record<Grade, string> = {
  6: 'السادس',
  7: 'السابع',
  8: 'الثامن',
  9: 'التاسع',
  10: 'العاشر',
  11: 'الحادي عشر',
  12: 'الثاني عشر',
};

export const getGradeCategory = (grade: Grade): CategoryId => (grade <= 9 ? 1 : 2);

export const SUBJECTS: { id: SubjectId; name: string }[] = [
  { id: 'chemistry', name: 'الكيمياء' },
  { id: 'biology', name: 'الأحياء' },
  { id: 'physics', name: 'الفيزياء' },
];

export const DIFFICULTIES: { id: DifficultyId; name: string; points: number }[] = [
  { id: 'easy', name: 'سهل', points: 100 },
  { id: 'medium', name: 'متوسط', points: 200 },
  { id: 'hard', name: 'صعب', points: 300 },
];

export const getSubjectName = (id: SubjectId): string =>
  SUBJECTS.find((subject) => subject.id === id)?.name ?? id;

export const getDifficultyName = (id: DifficultyId): string =>
  DIFFICULTIES.find((difficulty) => difficulty.id === id)?.name ?? id;

export const MATCH_TYPE_LABELS: Record<MatchType, string> = {
  sections: 'مواجهة بين شعب',
  grades: 'مواجهة بين صفوف',
};

export const MATCH_STATUS_LABELS: Record<MatchStatus, string> = {
  setup: 'لم تبدأ',
  live: 'جارية',
  finished: 'منتهية',
};

export const TEAM_STATUS_LABELS: Record<TeamStatus, string> = {
  champion: 'بطل الفئة',
  out: 'خرج من المنافسة',
  rep: 'ممثل الصف',
  in: 'في التصفيات',
};
