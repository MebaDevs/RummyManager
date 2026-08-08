import React from 'react';
import { useGame } from '../context/GameContext';
import { Play, PlusCircle, History, ShieldCheck, Zap, Clock, Trophy, RotateCcw, Trash2 } from 'lucide-react';

export const HomePage: React.FC = () => {
  const { setCurrentPage, activeGame, quitCurrentGame } = useGame();

  const isGameActive = activeGame && activeGame.status !== 'finished';
  const activeRound = isGameActive ? activeGame.rounds[activeGame.currentRoundIndex] : null;

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '40px 20px' }}>
      {/* Active Game Recovery Banner if an unfinished game exists */}
      {isGameActive && (
        <div
          className="glass-panel pulse-warning"
          style={{
            padding: 24,
            marginBottom: 28,
            borderColor: 'var(--status-green)',
            background: 'linear-gradient(135deg, rgba(53, 229, 138, 0.12) 0%, rgba(155, 92, 255, 0.08) 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 16,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: '50%',
                background: 'var(--status-green)',
                color: '#000',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 800,
              }}
            >
              <RotateCcw size={22} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                <span className="badge badge-green">Partida en Curso</span>
                <span className="font-mono" style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                  {activeGame.name}
                </span>
              </div>
              <h3 style={{ fontSize: 18, fontWeight: 800 }}>
                Ronda {activeRound?.number || 1}: {activeRound?.objective.name}
              </h3>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                Jugadores: {activeGame.players.map((p) => p.name).join(', ')}
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <button
              onClick={() => quitCurrentGame()}
              className="btn btn-secondary btn-sm"
              style={{ color: 'var(--status-red)' }}
              title="Descartar partida anterior"
            >
              <Trash2 size={16} /> Descartar
            </button>
            <button onClick={() => setCurrentPage('active_game')} className="btn btn-success btn-lg">
              <Play size={20} /> Continuar Partida <RotateCcw size={18} />
            </button>
          </div>
        </div>
      )}

      {/* Hero Header */}
      <div className="glass-panel" style={{ padding: '48px 36px', marginBottom: 32, position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'relative', zIndex: 2, maxWidth: 750 }}>
          <div className="badge badge-purple" style={{ marginBottom: 16 }}>
            <Zap size={14} /> Aplicación Local-First · Alta Precisión
          </div>
          <h1 style={{ fontSize: 'clamp(32px, 5vw, 54px)', fontWeight: 800, marginBottom: 16, lineHeight: 1.1 }}>
            Gestión inteligente de tiempo y partidas para <span className="gradient-text">Rummy</span>
          </h1>
          <p style={{ fontSize: 18, color: 'var(--text-secondary)', marginBottom: 32, lineHeight: 1.6 }}>
            Controla turnos con temporizador exacto por timestamps, aplica sanciones automáticas (+150 pts por error de juego / timeout), registra puntuaciones acumuladas e historial offline.
          </p>

          <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
            <button onClick={() => setCurrentPage('new_game')} className="btn btn-primary btn-lg">
              <PlusCircle size={20} /> Crear Nueva Partida
            </button>
            <button onClick={() => setCurrentPage('history')} className="btn btn-secondary btn-lg">
              <History size={20} /> Ver Historial
            </button>
          </div>
        </div>
      </div>

      {/* Feature Highlights Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
        <div className="glass-panel" style={{ padding: 24 }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(53, 229, 138, 0.15)', color: 'var(--status-green)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
            <Clock size={24} />
          </div>
          <h3 style={{ fontSize: 20, marginBottom: 8 }}>Timer por Timestamps</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
            Calculado con tiempo real del sistema (`performance.now()`), inmune a minimizado de pestañas o recargas de navegador.
          </p>
        </div>

        <div className="glass-panel" style={{ padding: 24 }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(255, 83, 101, 0.15)', color: 'var(--status-red)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
            <Zap size={24} />
          </div>
          <h3 style={{ fontSize: 20, marginBottom: 8 }}>Sanción Error +150</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
            Aplica sanción inmediata de +150 puntos y saca al jugador de la ronda activa. Reingresa automáticamente en la siguiente.
          </p>
        </div>

        <div className="glass-panel" style={{ padding: 24 }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(155, 92, 255, 0.15)', color: 'var(--accent-purple)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
            <Trophy size={24} />
          </div>
          <h3 style={{ fontSize: 20, marginBottom: 8 }}>Scoreboard Transparente</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
            Cálculo acumulativo donde el menor puntaje lidera la partida. Auditoría completa del origen de los puntos.
          </p>
        </div>

        <div className="glass-panel" style={{ padding: 24 }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(72, 167, 255, 0.15)', color: 'var(--status-blue)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
            <ShieldCheck size={24} />
          </div>
          <h3 style={{ fontSize: 20, marginBottom: 8 }}>Local-First & Offline</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
            Toda la partida vive en tu dispositivo con autoguardado continuo en LocalStorage. Funciona 100% offline.
          </p>
        </div>
      </div>
    </div>
  );
};
