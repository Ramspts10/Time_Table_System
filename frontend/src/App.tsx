import React, { useState } from 'react';
import { Layout } from './layouts/Layout';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { TimetableGridPage } from './pages/TimetableGridPage';
import { GeneratorPage } from './pages/GeneratorPage';
import { SimulatorPage } from './pages/SimulatorPage';
import { ConflictCenterPage } from './pages/ConflictCenterPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { FacultyPage } from './pages/FacultyPage';
import { CoursesPage } from './pages/CoursesPage';
import { SectionsPage } from './pages/SectionsPage';
import { RoomsPage } from './pages/RoomsPage';
import { ConstraintsPage } from './pages/ConstraintsPage';

export function App() {
  const [currentUser, setCurrentUser] = useState<{ role: string; full_name: string; token: string } | null>({
    role: 'ADMIN',
    full_name: 'Registrar Admin',
    token: 'demo-token'
  });
  const [currentTab, setCurrentTab] = useState('dashboard');

  if (!currentUser) {
    return <LoginPage onLoginSuccess={(u) => setCurrentUser(u)} />;
  }

  const renderContent = () => {
    switch (currentTab) {
      case 'dashboard':
        return <DashboardPage onNavigate={(tab) => setCurrentTab(tab)} />;
      case 'timetable':
        return <TimetableGridPage />;
      case 'generator':
        return <GeneratorPage onNavigateToMatrix={() => setCurrentTab('timetable')} />;
      case 'simulator':
        return <SimulatorPage />;
      case 'conflicts':
        return <ConflictCenterPage />;
      case 'analytics':
        return <AnalyticsPage />;
      case 'faculty':
        return <FacultyPage />;
      case 'courses':
        return <CoursesPage />;
      case 'sections':
        return <SectionsPage />;
      case 'rooms':
        return <RoomsPage />;
      case 'constraints':
        return <ConstraintsPage />;
      default:
        return <DashboardPage onNavigate={(tab) => setCurrentTab(tab)} />;
    }
  };

  return (
    <Layout
      currentTab={currentTab}
      setCurrentTab={setCurrentTab}
      userRole={currentUser.role}
      userName={currentUser.full_name}
      onLogout={() => setCurrentUser(null)}
    >
      {renderContent()}
    </Layout>
  );
}

export default App;
