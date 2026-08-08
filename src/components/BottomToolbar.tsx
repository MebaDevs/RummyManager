import React from 'react';
import { SkipForward, Pause, Play, AlertOctagon } from 'lucide-react';

interface BottomToolbarProps {
  isPaused?: boolean;
  onEndTurn: () => void;
  onTogglePause: () => void;
  onGameError: () => void;
}

export const BottomToolbar: React.FC<BottomToolbarProps> = ({
  isPaused = false,
  onEndTurn,
  onTogglePause,
  onGameError,
}) => {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'stretch',
        gap: 12,
        margin: '12px 0 24px 0',
        flexWrap: 'wrap',
        width: '100%',
      }}
    >
      {/* 1. Finalizar Turno */}
      <button
        onClick={onEndTurn}
        className="btn btn-success"
        style={{
          padding: '14px 20px',
          flex: '1 1 180px',
          borderRadius: 'var(--radius-lg)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 2,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 15, fontWeight: 800 }}>
          <SkipForward size={18} /> FINALIZAR TURNO
        </div>
        <span style={{ fontSize: 11, opacity: 0.85, fontWeight: 500 }}>Pasar al siguiente jugador</span>
      </button>

      {/* 2. Pausar Turno */}
      <button
        onClick={onTogglePause}
        className="btn btn-secondary"
        style={{
          padding: '14px 20px',
          flex: '1 1 180px',
          borderRadius: 'var(--radius-lg)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 2,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 15, fontWeight: 800 }}>
          {isPaused ? <Play size={18} color="var(--status-green)" /> : <Pause size={18} color="var(--status-amber)" />}
          {isPaused ? 'REANUDAR' : 'PAUSAR TURNO'}
        </div>
        <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 500 }}>
          {isPaused ? 'Continuar tiempo' : 'Pausar el temporizador'}
        </span>
      </button>

      {/* 3. Error de Juego (+150) */}
      <button
        onClick={onGameError}
        className="btn btn-danger"
        style={{
          padding: '14px 20px',
          flex: '1 1 180px',
          borderRadius: 'var(--radius-lg)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 2,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 15, fontWeight: 800 }}>
          <AlertOctagon size={18} /> ERROR DE JUEGO
        </div>
        <span style={{ fontSize: 11, opacity: 0.85, fontWeight: 500 }}>+150 puntos al jugador</span>
      </button>
    </div>
  );
};
