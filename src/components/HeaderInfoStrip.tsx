import React from 'react';
import { Clock, ShieldAlert, BarChart3, X, User } from 'lucide-react';
import { Game } from '../domain/models';

interface HeaderInfoStripProps {
  game: Game;
  isScoreboardOpen: boolean;
  onToggleScoreboard: () => void;
}

export const HeaderInfoStrip: React.FC<HeaderInfoStripProps> = ({
  game,
  isScoreboardOpen,
  onToggleScoreboard,
}) => {
  const currentRound = game.rounds[game.currentRoundIndex] || game.rounds[0];
  const activePlayer = game.players[0]; // Active player

  const timeMin = Math.floor(game.settings.turnTimeLimitSeconds / 60);
  const timeSec = game.settings.turnTimeLimitSeconds % 60;
  const timeFormatted = `${String(timeMin).padStart(2, '0')}:${String(timeSec).padStart(2, '0')} min`;

  return (
    <div className="header-info-container">
      {/* 1. Ronda Actual (Visible en Móvil y Desktop) */}
      <div
        className="glass-panel round-card-main"
        style={{
          padding: '14px 18px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
        }}
      >
        <div>
          <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 700, letterSpacing: '0.05em' }}>
            RONDA ACTUAL
          </span>
          <h3 style={{ fontSize: 20, fontWeight: 800, margin: '2px 0 4px 0' }}>
            Ronda {currentRound?.number || 1}
          </h3>
          <span className="badge badge-purple" style={{ fontSize: 11 }}>
            🃏 {currentRound?.objective.name.split(':')[1] || currentRound?.objective.name}
          </span>
        </div>

        {/* Botón de Puntuación Integrado para Móvil */}
        <button
          onClick={onToggleScoreboard}
          className={`btn ${isScoreboardOpen ? 'btn-secondary' : 'btn-primary'} mobile-scoreboard-toggle`}
          style={{ padding: '10px 14px', borderRadius: 'var(--radius-md)', flexShrink: 0 }}
          title={isScoreboardOpen ? 'Ocultar Puntuación' : 'Ver Puntuación'}
        >
          {isScoreboardOpen ? <X size={18} /> : <BarChart3 size={18} />}
          <span>{isScoreboardOpen ? 'Ocultar' : 'Puntuación'}</span>
        </button>
      </div>

      {/* 2. Jugador Actual (Solo Desktop) */}
      <div
        className="glass-panel desktop-only-card"
        style={{
          padding: '14px 18px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          borderColor: 'rgba(53, 229, 138, 0.3)',
        }}
      >
        <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 700, letterSpacing: '0.05em' }}>
          JUGADOR EN TURNO
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '2px 0 6px 0' }}>
          <User size={18} color="var(--status-green)" />
          <h3 style={{ fontSize: 18, fontWeight: 800 }}>{activePlayer?.name || 'Jugador'}</h3>
        </div>
        <span className="badge badge-green" style={{ width: 'fit-content', fontSize: 10 }}>
          🟢 TU TURNO
        </span>
      </div>

      {/* 3. Tiempo por Turno (Solo Desktop) */}
      <div
        className="glass-panel desktop-only-card"
        style={{
          padding: '14px 18px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
        }}
      >
        <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 700, letterSpacing: '0.05em' }}>
          TIEMPO POR TURNO
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, margin: '2px 0 2px 0' }}>
          <Clock size={18} color="var(--status-amber)" />
          <span className="font-mono" style={{ fontSize: 18, fontWeight: 800 }}>
            {timeFormatted}
          </span>
        </div>
        <span style={{ fontSize: 11, color: 'var(--status-amber)' }}>
          Penalización: +{game.settings.timeoutPenalty} pts
        </span>
      </div>

      {/* 4. Error de Juego (Solo Desktop) */}
      <div
        className="glass-panel desktop-only-card"
        style={{
          padding: '14px 18px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          borderColor: 'rgba(255, 83, 101, 0.3)',
        }}
      >
        <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 700, letterSpacing: '0.05em' }}>
          SANCIÓN ERROR DE JUEGO
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, margin: '2px 0 2px 0' }}>
          <ShieldAlert size={18} color="var(--status-red)" />
          <span className="font-mono" style={{ fontSize: 18, fontWeight: 800, color: 'var(--status-red)' }}>
            +{game.settings.gameErrorPenalty} pts
          </span>
        </div>
        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Jugador fuera de la ronda</span>
      </div>

      {/* 5. Acción Superior Derecha - Toggle Scoreboard Drawer (Solo Desktop) */}
      <div
        className="glass-panel desktop-only-card"
        style={{
          padding: '14px 18px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <button
          onClick={onToggleScoreboard}
          className={`btn ${isScoreboardOpen ? 'btn-secondary' : 'btn-primary'}`}
          style={{ width: '100%', height: '100%', borderRadius: 'var(--radius-md)' }}
        >
          {isScoreboardOpen ? <X size={18} /> : <BarChart3 size={18} />}
          <span>{isScoreboardOpen ? 'Ocultar puntuación' : 'Ver puntuación'}</span>
        </button>
      </div>
    </div>
  );
};
