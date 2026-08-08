import React from 'react';
import { useGame, PageView } from '../context/GameContext';
import { Timer, PlusCircle, Play, History, Settings, Flame } from 'lucide-react';

export const Navbar: React.FC = () => {
  const { currentPage, setCurrentPage, activeGame } = useGame();

  const navItems: { id: PageView; label: string; icon: React.ReactNode }[] = [
    { id: 'home', label: 'Inicio', icon: <Timer size={18} /> },
    { id: 'new_game', label: 'Nueva Partida', icon: <PlusCircle size={18} /> },
    ...(activeGame && activeGame.status !== 'finished'
      ? [{ id: 'active_game' as PageView, label: 'Mesa Activa', icon: <Play size={18} /> }]
      : []),
    { id: 'history', label: 'Historial', icon: <History size={18} /> },
    { id: 'settings', label: 'Ajustes', icon: <Settings size={18} /> },
  ];

  return (
    <header style={{
      position: 'sticky',
      top: 0,
      zIndex: 100,
      background: 'rgba(8, 10, 15, 0.88)',
      backdropFilter: 'blur(16px)',
      WebkitBackdropFilter: 'blur(16px)',
      borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
      padding: '12px 24px',
    }}>
      <div style={{
        maxWidth: 1200,
        margin: '0 auto',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 12
      }}>
        {/* Brand Logo */}
        <div 
          onClick={() => setCurrentPage('home')} 
          style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}
        >
          <div style={{
            width: 38,
            height: 38,
            borderRadius: 12,
            background: 'linear-gradient(135deg, #9b5cff 0%, #35e58a 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            boxShadow: '0 4px 16px rgba(155, 92, 255, 0.4)'
          }}>
            <Flame size={22} />
          </div>
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 800, lineHeight: 1 }} className="gradient-text">
              Rummy Timer
            </h1>
            <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '0.05em' }}>
              FASE 1 · V0.1
            </span>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 2 }}>
          {navItems.map((item) => {
            const isActive = currentPage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setCurrentPage(item.id)}
                className={`btn btn-sm ${isActive ? 'btn-primary' : 'btn-secondary'}`}
                style={{
                  borderRadius: 999,
                  position: 'relative',
                }}
              >
                {item.icon}
                <span>{item.label}</span>
                {item.id === 'active_game' && activeGame && (
                  <span style={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    background: 'var(--status-green)',
                    boxShadow: '0 0 8px var(--status-green-glow)',
                    marginLeft: 2
                  }} />
                )}
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
};
