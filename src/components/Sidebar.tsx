import React, { useState } from 'react';
import { useGame, PageView } from '../context/GameContext';
import { Flame, Play, History, Users, Settings, Volume2, VolumeX, Copy, Check } from 'lucide-react';

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen = false, onClose }) => {
  const { currentPage, setCurrentPage, activeGame, globalSettings, updateGlobalSettings } = useGame();
  const [copied, setCopied] = useState(false);

  const sessionCode = activeGame ? `RMY-${activeGame.id.slice(-4).toUpperCase()}` : 'RMY-4821';

  const navItems: { id: PageView; label: string; icon: React.ReactNode }[] = [
    { id: 'active_game', label: 'Partida', icon: <Play size={20} /> },
    { id: 'history', label: 'Historial', icon: <History size={20} /> },
    { id: 'new_game', label: 'Jugadores', icon: <Users size={20} /> },
    { id: 'settings', label: 'Configuración', icon: <Settings size={20} /> },
  ];

  const handleCopyCode = () => {
    navigator.clipboard.writeText(sessionCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const toggleSound = () => {
    updateGlobalSettings({
      ...globalSettings,
      soundEnabled: !globalSettings.soundEnabled,
    });
  };

  const handleNavClick = (pageId: PageView) => {
    setCurrentPage(pageId);
    if (onClose) onClose();
  };

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isOpen && (
        <div
          onClick={onClose}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.6)',
            backdropFilter: 'blur(4px)',
            WebkitBackdropFilter: 'blur(4px)',
            zIndex: 89,
          }}
        />
      )}

      <aside
        className={`sidebar-drawer ${isOpen ? 'open' : ''}`}
        style={{
          width: 260,
          height: '100vh',
          position: 'fixed',
          left: 0,
          top: 0,
          background: 'rgba(10, 14, 23, 0.96)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderRight: '1px solid var(--panel-border)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '24px 16px',
          zIndex: 90,
        }}
      >
        {/* Top Branding */}
        <div>
          <div
            onClick={() => handleNavClick('home')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '8px 12px',
              marginBottom: 32,
              cursor: 'pointer',
            }}
          >
            <div
              style={{
                width: 42,
                height: 42,
                borderRadius: 14,
                background: 'linear-gradient(135deg, #9b5cff 0%, #35e58a 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                boxShadow: '0 4px 20px rgba(155, 92, 255, 0.5)',
              }}
            >
              <Flame size={24} />
            </div>
            <div>
              <h1 style={{ fontSize: 18, fontWeight: 800, lineHeight: 1.1 }} className="gradient-text">
                RUMMY TIMER
              </h1>
              <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '0.08em' }}>
                LOCAL DASHBOARD
              </span>
            </div>
          </div>

          {/* Vertical Navigation Menu */}
          <nav style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {navItems.map((item) => {
              const isActive = currentPage === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    width: '100%',
                    padding: '12px 16px',
                    borderRadius: 'var(--radius-md)',
                    fontSize: 15,
                    fontWeight: isActive ? 700 : 500,
                    color: isActive ? '#ffffff' : 'var(--text-secondary)',
                    background: isActive ? 'linear-gradient(135deg, rgba(155, 92, 255, 0.25) 0%, rgba(53, 229, 138, 0.1) 100%)' : 'transparent',
                    border: isActive ? '1px solid rgba(155, 92, 255, 0.4)' : '1px solid transparent',
                    cursor: 'pointer',
                    transition: 'all var(--transition-fast)',
                    textAlign: 'left',
                  }}
                >
                  <span style={{ color: isActive ? 'var(--accent-purple)' : 'var(--text-muted)' }}>{item.icon}</span>
                  <span>{item.label}</span>
                  {item.id === 'active_game' && activeGame && activeGame.status !== 'finished' && (
                    <span
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        background: 'var(--status-green)',
                        boxShadow: '0 0 8px var(--status-green-glow)',
                        marginLeft: 'auto',
                      }}
                    />
                  )}
                </button>
              );
            })}

            {/* Sound Toggle Button */}
            <button
              onClick={toggleSound}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                width: '100%',
                padding: '12px 16px',
                borderRadius: 'var(--radius-md)',
                fontSize: 15,
                fontWeight: 500,
                color: 'var(--text-secondary)',
                background: 'transparent',
                border: '1px solid transparent',
                cursor: 'pointer',
                marginTop: 4,
              }}
            >
              <span style={{ color: globalSettings.soundEnabled ? 'var(--status-green)' : 'var(--status-red)' }}>
                {globalSettings.soundEnabled ? <Volume2 size={20} /> : <VolumeX size={20} />}
              </span>
              <span>Sonidos: {globalSettings.soundEnabled ? 'ON' : 'OFF'}</span>
            </button>
          </nav>
        </div>

        {/* Bottom Session Badge */}
        <div
          style={{
            background: 'rgba(255, 255, 255, 0.04)',
            border: '1px solid var(--panel-border)',
            borderRadius: 'var(--radius-md)',
            padding: '12px 14px',
          }}
        >
          <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, marginBottom: 4 }}>
            SESIÓN ACTUAL
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span className="font-mono" style={{ fontSize: 14, fontWeight: 700, color: 'var(--status-green)' }}>
              {sessionCode}
            </span>
            <button
              onClick={handleCopyCode}
              style={{
                background: 'none',
                border: 'none',
                color: copied ? 'var(--status-green)' : 'var(--text-secondary)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                padding: 4,
              }}
              title="Copiar código de sesión"
            >
              {copied ? <Check size={16} /> : <Copy size={16} />}
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
