import React from 'react';
import { useGame } from '../context/GameContext';
import { Play, PlusCircle, History, ShieldCheck, Zap, Clock, Trophy } from 'lucide-react';

export const HomePage: React.FC = () => {
  const { setCurrentPage, activeGame } = useGame();

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '24px 16px' }}>
      {/* Hero Header */}
      <div className="glass-panel" style={{ padding: 'clamp(24px, 5vw, 48px) clamp(20px, 4vw, 36px)', marginBottom: 24, position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'relative', zIndex: 2, maxWidth: 750 }}>
          <div className="badge badge-purple" style={{ marginBottom: 16 }}>
            <Zap size={14} /> Aplicación Local-First · Alta Precisión
          </div>
          <h1 style={{ fontSize: 'clamp(26px, 5vw, 54px)', fontWeight: 800, marginBottom: 16, lineHeight: 1.1 }}>
            Gestión inteligente de tiempo y partidas para <span className="gradient-text">Rummy</span>
          </h1>
          <p style={{ fontSize: 'clamp(15px, 2.5vw, 18px)', color: 'var(--text-secondary)', marginBottom: 28, lineHeight: 1.6 }}>
            Controla turnos con temporizador exacto, aplica sanciones automáticas (+150 pts por error de juego / timeout), registra puntuaciones acumuladas e historial offline.
          </p>

          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            {activeGame && activeGame.status !== 'finished' ? (
              <button
                onClick={() => setCurrentPage('active_game')}
                className="btn btn-success btn-lg"
                style={{ flex: '1 1 auto' }}
              >
                <Play size={20} /> Reanudar Partida Activa
              </button>
            ) : null}
            <button
              onClick={() => setCurrentPage('new_game')}
              className="btn btn-primary btn-lg"
              style={{ flex: '1 1 auto' }}
            >
              <PlusCircle size={20} /> Crear Nueva Partida
            </button>
            <button
              onClick={() => setCurrentPage('history')}
              className="btn btn-secondary btn-lg"
              style={{ flex: '1 1 auto' }}
            >
              <History size={20} /> Ver Historial
            </button>
          </div>
        </div>
      </div>

      {/* Feature Highlights Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
        <div className="glass-panel" style={{ padding: 24 }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(53, 229, 138, 0.15)', color: 'var(--status-green)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
            <Clock size={24} />
          </div>
          <h3 style={{ fontSize: 20, marginBottom: 8 }}>Timer por Timestamps</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
            Calculado con tiempo real del sistema (`performance.now()`), inmune a minimizado de pestañas o pausas de JavaScript.
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
            Toda la partida vive en tu dispositivo con autoguardado continuo en LocalStorage. Funciona sin internet.
          </p>
        </div>
      </div>
    </div>
  );
};
