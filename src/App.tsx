import React, { useState, useEffect } from 'react';
import { GameProvider, useGame } from './context/GameContext';
import { Sidebar } from './components/Sidebar';
import { HomePage } from './pages/HomePage';
import { NewGamePage } from './pages/NewGamePage';
import { ActiveGamePage } from './pages/ActiveGamePage';
import { HistoryPage } from './pages/HistoryPage';
import { SettingsPage } from './pages/SettingsPage';
import { CreateRoomModal } from './components/CreateRoomModal';
import { JoinRoomModal } from './components/JoinRoomModal';
import { GuestLobbyView } from './components/GuestLobbyView';
import { Menu, X, Flame, Maximize, Minimize } from 'lucide-react';
import './styles/index.css';

const MainContent: React.FC = () => {
  const {
    currentPage,
    setCurrentPage,
    p2pRole,
    activeGame,
    setActiveGame,
    roomCode,
    lobbyPlayers,
    connectedPeersCount,
    leaveP2PRoom,
    addLocalPlayerToLobby,
    removePlayerFromLobby,
    reorderLobbyPlayers,
    startP2PGameFromLobby,
  } = useGame();

  React.useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }, [currentPage, p2pRole, activeGame?.status]);

  if (p2pRole === 'guest' && (!activeGame || activeGame.status === 'setup')) {
    return (
      <GuestLobbyView
        roomCode={roomCode}
        lobbyPlayers={lobbyPlayers}
        connectedCount={connectedPeersCount}
        onLeaveRoom={leaveP2PRoom}
      />
    );
  }

  if (p2pRole === 'host' && (!activeGame || activeGame.status === 'setup')) {
    return (
      <CreateRoomModal
        isOpen={true}
        roomCode={roomCode}
        connectedCount={connectedPeersCount}
        lobbyPlayers={lobbyPlayers}
        isHost={true}
        onClose={leaveP2PRoom}
        onAddLocalPlayer={addLocalPlayerToLobby}
        onRemovePlayer={removePlayerFromLobby}
        onReorderPlayers={reorderLobbyPlayers}
        onStartGame={async () => {
          try {
            const startedGame = await startP2PGameFromLobby();
            setActiveGame(startedGame);
            setCurrentPage('active_game');
          } catch (err: any) {
            alert(err.message || 'Error al iniciar la partida');
          }
        }}
      />
    );
  }

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
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [prefilledRoomCode, setPrefilledRoomCode] = useState<string>('');
  const [isUrlJoinModalOpen, setIsUrlJoinModalOpen] = useState(false);
  const { setCurrentPage, joinP2PRoom, p2pRole } = useGame();

  useEffect(() => {
    // Check if user arrived via share URL ?room=XXXX
    const params = new URLSearchParams(window.location.search);
    const urlRoom = params.get('room');
    if (urlRoom && urlRoom.trim()) {
      const cleanCode = urlRoom.trim().toUpperCase();
      setPrefilledRoomCode(cleanCode);
      setIsUrlJoinModalOpen(true);
      // Clean query string from browser address bar
      window.history.replaceState({}, document.title, window.location.pathname);
    }

    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

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
          <span style={{ fontSize: 16, fontWeight: 800 }} className="gradient-text mobile-header-title">
            RUMMY TIMER
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
          <button
            onClick={toggleFullscreen}
            className="btn btn-secondary"
            style={{
              width: 38,
              height: 38,
              padding: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 'var(--radius-md)',
              flexShrink: 0,
            }}
            title={isFullscreen ? 'Salir de pantalla completa' : 'Pantalla completa'}
            aria-label="Pantalla Completa"
          >
            {isFullscreen ? <Minimize size={18} /> : <Maximize size={18} />}
          </button>

          <button
            onClick={() => setIsMobileNavOpen(!isMobileNavOpen)}
            className="btn btn-secondary"
            style={{
              width: 38,
              height: 38,
              padding: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 'var(--radius-md)',
              flexShrink: 0,
            }}
            aria-label={isMobileNavOpen ? 'Cerrar Menú' : 'Abrir Menú'}
          >
            {isMobileNavOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </header>

      <div style={{ display: 'flex', flex: 1, width: '100%' }}>
        {/* Sidebar Drawer (Solo Host / Local) */}
        {p2pRole !== 'guest' && <Sidebar isOpen={isMobileNavOpen} onClose={() => setIsMobileNavOpen(false)} />}

        {/* Main Content Container */}
        <div
          className="main-app-content"
          style={{
            flex: 1,
            marginLeft: p2pRole === 'guest' ? 0 : 260,
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
      <JoinRoomModal
        isOpen={isUrlJoinModalOpen}
        initialCode={prefilledRoomCode}
        onClose={() => setIsUrlJoinModalOpen(false)}
        onJoinRoom={async (code, name) => {
          await joinP2PRoom(code, name);
        }}
      />
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
