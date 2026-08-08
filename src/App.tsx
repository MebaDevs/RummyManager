import React from 'react';
import { GameProvider, useGame } from './context/GameContext';
import { Sidebar } from './components/Sidebar';
import { HomePage } from './pages/HomePage';
import { NewGamePage } from './pages/NewGamePage';
import { ActiveGamePage } from './pages/ActiveGamePage';
import { HistoryPage } from './pages/HistoryPage';
import { SettingsPage } from './pages/SettingsPage';
import { Menu, X, Flame } from 'lucide-react';
import './styles/index.css';

const MainContent: React.FC = () => {
  const { currentPage } = useGame();

  switch (currentPage) {
    case 'home':
      return <HomePage />;
    case 'new_game':
      return <NewGamePage />;
    case 'active_game':
      return <ActiveGamePage />;
    case 'history':
      return <HistoryPage />;
    case 'settings':
      return <SettingsPage />;
    default:
      return <HomePage />;
  }
};

export const AppLayout: React.FC = () => {
  const [isMobileNavOpen, setIsMobileNavOpen] = React.useState(false);
  const { setCurrentPage } = useGame();

  return (
    <div style={{ display: 'flex', minHeight: '100vh', width: '100%', flexDirection: 'column' }}>
      {/* Mobile Header Bar (Only visible on screens <= 900px) */}
      <header
        className="mobile-header"
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 80,
          background: 'rgba(8, 10, 15, 0.95)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          borderBottom: '1px solid var(--panel-border)',
          padding: '12px 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div
          onClick={() => {
            setCurrentPage('home');
            setIsMobileNavOpen(false);
          }}
          style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}
        >
          <div
            style={{
              width: 34,
              height: 34,
              borderRadius: 10,
              background: 'linear-gradient(135deg, #9b5cff 0%, #35e58a 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
            }}
          >
            <Flame size={20} />
          </div>
          <span style={{ fontSize: 16, fontWeight: 800 }} className="gradient-text">
            RUMMY TIMER
          </span>
        </div>

        <button
          onClick={() => setIsMobileNavOpen(!isMobileNavOpen)}
          className="btn btn-secondary btn-sm"
          style={{ padding: '8px 12px', display: 'flex', alignItems: 'center', gap: 6 }}
          aria-label="Abrir Menú"
        >
          {isMobileNavOpen ? <X size={20} /> : <Menu size={20} />}
          <span style={{ fontSize: 13, fontWeight: 600 }}>Menú</span>
        </button>
      </header>

      <div style={{ display: 'flex', flex: 1, width: '100%' }}>
        {/* Sidebar Drawer */}
        <Sidebar isOpen={isMobileNavOpen} onClose={() => setIsMobileNavOpen(false)} />

        {/* Main Content Container */}
        <div
          className="main-app-content"
          style={{
            flex: 1,
            marginLeft: 260,
            display: 'flex',
            flexDirection: 'column',
            minHeight: '100vh',
            transition: 'margin-left 0.3s ease',
          }}
        >
          <main style={{ flex: 1 }}>
            <MainContent />
          </main>
          <footer
            style={{
              borderTop: '1px solid rgba(255, 255, 255, 0.08)',
              padding: '20px 24px',
              textAlign: 'center',
              fontSize: 12,
              color: 'var(--text-muted)',
            }}
          >
            Rummy Timer · Fase 1 (V0.1 a V1.0) · Arquitectura Local Dashboard
          </footer>
        </div>
      </div>
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <GameProvider>
      <AppLayout />
    </GameProvider>
  );
};

export default App;
