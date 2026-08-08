import React from 'react';
import { Player } from '../domain/models';
import { Bell, Clock, CheckCircle, AlertTriangle } from 'lucide-react';
import { PreciseTimerState } from '../hooks/usePreciseTimer';

interface CentralTimerTableProps {
  players: Player[];
  activePlayerId: string;
  timerState: PreciseTimerState;
}

export const CentralTimerTable: React.FC<CentralTimerTableProps> = ({
  players,
  activePlayerId,
  timerState,
}) => {
  // Dynamically split all players evenly between Left and Right columns
  const halfCount = Math.max(1, Math.ceil(players.length / 2));
  const leftPlayers = players.slice(0, halfCount);
  const rightPlayers = players.slice(halfCount);

  // SVG Circumference calculation: 2 * PI * 92 ~= 578
  const circumference = 578;
  const strokeOffset = circumference - (circumference * timerState.progressPercent) / 100;

  const getTimerColor = () => {
    if (timerState.isOverdue || timerState.isExpired) return 'var(--status-red)';
    if (timerState.isWarning) return 'var(--status-amber)';
    return 'var(--status-green)';
  };

  const timerColor = getTimerColor();

  const renderPlayerCard = (player: Player) => {
    const isActive = player.id === activePlayerId;
    const isOut = false; // Linked to playerState status

    return (
      <div
        key={player.id}
        className="glass-panel"
        style={{
          padding: '16px 18px',
          borderColor: isActive ? timerColor : 'var(--panel-border)',
          boxShadow: isActive ? `0 0 20px ${timerColor}66` : 'none',
          background: isActive ? `${timerColor}10` : 'var(--bg-card)',
          transition: 'all var(--transition-normal)',
          width: '100%',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 34,
                height: 34,
                borderRadius: '50%',
                background: player.avatarColor,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 800,
                color: '#000',
                fontSize: 14,
                boxShadow: `0 0 10px ${player.avatarColor}`,
              }}
            >
              {player.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h4 style={{ fontSize: 15, fontWeight: 700, lineHeight: 1.2 }}>{player.name}</h4>
              <span style={{ fontSize: 11, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                <Clock size={11} /> 03:15 total
              </span>
            </div>
          </div>

          {/* Status badge */}
          {isActive ? (
            <span
              className={`badge ${timerState.isOverdue ? 'badge-red pulse-warning' : timerState.isWarning ? 'badge-amber pulse-warning' : 'badge-green'}`}
            >
              {timerState.isOverdue ? 'TIEMPO EXCEDIDO' : 'TURNO'}
            </span>
          ) : isOut ? (
            <span className="badge badge-red">FUERA</span>
          ) : (
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: 'var(--text-muted)',
                display: 'inline-block',
              }}
            />
          )}
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingTop: 8,
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          }}
        >
          <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Puntos acumulados:</span>
          <span className="font-mono" style={{ fontSize: 16, fontWeight: 800, color: 'var(--accent-purple)' }}>
            0 pts
          </span>
        </div>
      </div>
    );
  };

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(220px, 1fr) minmax(280px, 320px) minmax(220px, 1fr)',
        gap: 24,
        alignItems: 'center',
        margin: '16px 0 28px 0',
      }}
    >
      {/* Left Players Column */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14, maxHeight: 520, overflowY: 'auto', paddingRight: 4 }}>
        {leftPlayers.map(renderPlayerCard)}
      </div>

      {/* Center Circular Timer Table */}
      <div
        className="glass-panel"
        style={{
          padding: '28px 20px',
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          borderColor: timerState.isOverdue ? 'var(--status-red)' : timerState.isWarning ? 'var(--status-amber)' : 'var(--panel-border)',
        }}
      >
        <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.1em', marginBottom: 8 }}>
          {timerState.isOverdue ? 'TIEMPO EXCEDIDO (EN CURSO)' : 'TEMPORIZADOR DE TURNO'}
        </span>

        {/* Circular Progress SVG */}
        <div style={{ position: 'relative', width: 220, height: 220, margin: '6px 0' }}>
          <svg width="220" height="220" viewBox="0 0 220 220">
            <circle cx="110" cy="110" r="92" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="12" />
            <circle
              cx="110"
              cy="110"
              r="92"
              fill="none"
              stroke={timerColor}
              strokeWidth="12"
              strokeDasharray={circumference}
              strokeDashoffset={strokeOffset}
              strokeLinecap="round"
              transform="rotate(-90 110 110)"
              style={{ transition: 'stroke-dashoffset 0.1s linear, stroke 0.3s ease' }}
            />
          </svg>
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <span
              className="font-mono"
              style={{
                fontSize: timerState.isOverdue ? 38 : 44,
                fontWeight: 800,
                color: timerColor,
                lineHeight: 1,
                transition: 'color 0.3s ease',
              }}
            >
              {timerState.formattedTime}
            </span>
            <span style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>
              {timerState.isOverdue ? 'tiempo excedido' : `de ${Math.floor(timerState.totalLimitSeconds / 60)}:${String(timerState.totalLimitSeconds % 60).padStart(2, '0')} min`}
            </span>
          </div>
        </div>

        {/* Dynamic Warning / Overdue Chip */}
        {timerState.isOverdue ? (
          <div
            className="badge badge-red pulse-warning"
            style={{
              marginTop: 6,
              padding: '6px 14px',
              fontSize: 12,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <AlertTriangle size={14} /> ⚠️ Sanción aplicada (Esperando jugada)
          </div>
        ) : timerState.isWarning ? (
          <div
            className="badge badge-amber pulse-warning"
            style={{
              marginTop: 6,
              padding: '6px 14px',
              fontSize: 12,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <Bell size={14} /> 🔔 Quedan {timerState.formattedTime} min
          </div>
        ) : (
          <div
            className="badge badge-green"
            style={{
              marginTop: 6,
              padding: '6px 14px',
              fontSize: 12,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <CheckCircle size={14} /> Tiempo Seguro
          </div>
        )}
      </div>

      {/* Right Players Column */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14, maxHeight: 520, overflowY: 'auto', paddingLeft: 4 }}>
        {rightPlayers.map(renderPlayerCard)}
      </div>
    </div>
  );
};
