import { useState } from 'react';
import { IconPlus, IconTrash } from '../components/Icons';
import { Badge, Button, Card, ConfirmModal, Notice, PageHeader } from '../components/ui';
import { useAppStore } from '../context/AppStoreContext';
import { CATEGORIES, MATCH_STATUS_LABELS, MATCH_TYPE_LABELS } from '../data/constants';
import type { Match } from '../types/olympiad';
import { navigate } from '../utils/router';
import { getMatchTeamInfo, hasDependentMatches } from '../utils/tournament';

export function MatchesPage() {
  const { state, dispatch } = useAppStore();
  const [confirmDeleteMatch, setConfirmDeleteMatch] = useState<Match | null>(null);

  return (
    <>
      <PageHeader
        title="إدارة المواجهات"
        subtitle="نوع كل مواجهة محفوظ ضمن بياناتها"
        actions={
          <>
            <Button onClick={() => navigate('start')}>
              <IconPlus />
              مواجهة جديدة
            </Button>
            <Button variant="ghost" onClick={() => navigate('new-match')}>
              للفرق المسجلة (البطولة)
            </Button>
          </>
        }
      />

      {!state.matches.length && (
        <Notice>لا توجد مواجهات بعد. ابدأ بإنشاء مواجهة جديدة.</Notice>
      )}

      <div className="space-y-3">
        {[...state.matches].reverse().map((match) => {
          const teamInfo = [
            getMatchTeamInfo(state, match, 0),
            getMatchTeamInfo(state, match, 1),
          ];
          const locked = hasDependentMatches(state, match);
          const winner = match.winnerId
            ? teamInfo[match.teamIds.indexOf(match.winnerId)]
            : undefined;

          return (
            <Card key={match.id} className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="text-lg font-extrabold">
                  {match.names ? teamInfo[0].name : teamInfo[0].label}{' '}
                  <span className="text-gold">ضد</span>{' '}
                  {match.names ? teamInfo[1].name : teamInfo[1].label}
                </div>
                <div className="text-mute">
                  {match.names
                    ? teamInfo[0].label
                    : `${teamInfo[0].name} — ${teamInfo[1].name}`}
                  {!match.manualResult && ` · ${match.scores[0]} : ${match.scores[1]}`}
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  <Badge>{MATCH_TYPE_LABELS[match.type]}</Badge>
                  <Badge tone="gray">{CATEGORIES[match.category - 1].name}</Badge>
                  <Badge
                    tone={
                      match.status === 'finished'
                        ? 'green'
                        : match.status === 'live'
                          ? 'gold'
                          : 'gray'
                    }
                  >
                    {MATCH_STATUS_LABELS[match.status]}
                  </Badge>
                  {!match.slot && (
                    <Badge tone="gray">{match.names ? 'سريعة' : 'ودية'}</Badge>
                  )}
                  {match.manualResult && <Badge tone="gray">نتيجة يدوية</Badge>}
                  {winner && <Badge tone="gold">الفائز: {winner.name}</Badge>}
                </div>
              </div>

              <div className="flex gap-2">
                {!match.manualResult && (
                  <Button onClick={() => navigate(`board/${match.id}`)}>التحكم</Button>
                )}
                <Button
                  variant="danger"
                  aria-label="حذف المواجهة"
                  disabled={locked}
                  title={locked ? 'توجد مواجهات لاحقة مبنية على نتيجتها' : 'حذف'}
                  onClick={() => setConfirmDeleteMatch(match)}
                >
                  <IconTrash />
                </Button>
              </div>
            </Card>
          );
        })}
      </div>

      <ConfirmModal
        open={!!confirmDeleteMatch}
        title="حذف المواجهة"
        message="حذف المواجهة ونتيجتها؟"
        confirmLabel="حذف"
        onCancel={() => setConfirmDeleteMatch(null)}
        onConfirm={() => {
          if (confirmDeleteMatch) {
            dispatch({ type: 'match/remove', id: confirmDeleteMatch.id });
          }
          setConfirmDeleteMatch(null);
        }}
      />
    </>
  );
}
