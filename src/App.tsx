import type { ReactNode } from 'react';
import { AdminLayout } from './components/AdminLayout';
import { AppStoreProvider } from './context/AppStoreContext';
import { BankPage } from './pages/BankPage';
import { BoardPage } from './pages/BoardPage';
import { ClassesPage } from './pages/ClassesPage';
import { DashboardPage } from './pages/DashboardPage';
import { HomePage } from './pages/HomePage';
import { MatchesPage } from './pages/MatchesPage';
import { NewMatchPage } from './pages/NewMatchPage';
import { PlannerPage } from './pages/PlannerPage';
import { SettingsPage } from './pages/SettingsPage';
import { StartMatchPage } from './pages/StartMatchPage';
import { TeamsPage } from './pages/TeamsPage';
import { TournamentsPage } from './pages/TournamentsPage';
import { useHashRoute } from './utils/router';

function AppRoutes() {
  const { page, param } = useHashRoute();

  if (page === '') return <HomePage />;
  if (page === 'start') return <StartMatchPage />;
  if (page === 'board') return <BoardPage key={param ?? ''} id={param ?? ''} />;

  const adminPages: Record<string, ReactNode> = {
    planner: <PlannerPage />,
    tournaments: <TournamentsPage />,
    classes: <ClassesPage />,
    teams: <TeamsPage />,
    'new-match': <NewMatchPage />,
    matches: <MatchesPage />,
    bank: <BankPage />,
    settings: <SettingsPage />,
  };

  return <AdminLayout page={page}>{adminPages[page] ?? <DashboardPage />}</AdminLayout>;
}

export default function App() {
  return (
    <AppStoreProvider>
      <AppRoutes />
    </AppStoreProvider>
  );
}
