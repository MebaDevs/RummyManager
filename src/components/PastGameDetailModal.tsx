import React, { useEffect, useState } from 'react';
import { Trophy, X, Calendar, Clock, BarChart2 } from 'lucide-react';
import { Game } from '../domain/models';
import { useGame } from '../context/GameContext';
import { getPlayerTotalTimeMs, formatPlayerTime } from '../domain/rules/timeUtils';
import { useModalBackHandler } from '../hooks/useModalBackHandler';

interface PastGameDetailModalProps {
  gameId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

export const PastGameDetailModal: React.FC<PastGameDetailModalProps> = ({
  gameId,
  isOpen,
  onClose,
}) => {
  const { repository } = useGame();
  const [game, setGame] = useState<Game | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'standings' | 'scores'>('standings');

  useModalBackHandler(isOpen, onClose);

  useEffect(() => {
    if (isOpen && gameId) {
      setLoading(true);
      repository.getGame(gameId).then((fetched) => {
        setGame(fetched);
        setLoading(false);
      });
    } else {
      setGame(null);
    }
  }, [isOpen, gameId, repository]);

  if (!isOpen || !gameId) return null;

  // Calculate scores per player
  const playerTotals: Record<string, number> = {};
  if (game) {
    game.players.forEach((p) => { playerTotals[p.id] = 0; });
    const gameErrorRoundsPerPlayer = new Set<string>();
    game.scores.forEach((sc) => {
      if (sc.source === 'game_error') gameErrorRoundsPerPlayer.add(`${sc.playerId}_r${sc.roundNumber}`);
    });
    game.scores.forEach((sc) => {
      if (playerTotals[sc.playerId] !== undefined) {
        if (sc.source === 'timeout' && gameErrorRoundsPerPlayer.has(`${sc.playerId}_r${sc.roundNumber}`)) return;
        playerTotals[sc.playerId] += sc.points;
      }
    });
  }

  const sortedPlayers = game
    ? [...game.players]
        .map((player) => {
          const timeMs = getPlayerTotalTimeMs(game, player.id);
          return {
            player,
            points: playerTotals[player.id] || 0,
            timeSpentMs: timeMs,
            timeSpentFormatted: formatPlayerTime(timeMs),
          };
        })
        .sort((a, b) => a.points - b.points)
    : [];

  const podiumMedals = ['🥇', '🥈', '🥉'];

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.8)',
        backdropFilter: 'blur(10px)',
        zIndex: 300,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
      }}
    >
      <div
        className="glass-panel"
        style={{
          width: '100%',
          maxWidth: 580,
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
          background: '#0d121c',
          padding: 0,
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div style={{ padding: '24px 28px 16px 28px', borderBottom: '1px solid var(--panel-border)', position: 'relative' }}>
          <button
            onClick={onClose}
            style={{
              position: 'absolute',
              top: 20,
              right: 20,
              background: 'none',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
            }}
          >
            <X size={20} />
          </button>

          {game && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                <h3 style={{ fontSize: 22, fontWeight: 800 }} className="font-display">
                  {game.name}
                </h3>
                <span className={`badge ${game.status === 'finished' ? 'badge-purple' : 'badge-green'}`}>
                  {game.status === 'finished' ? 'Finalizada' : 'En Curso'}
                </span>
              </div>

              <div style={{ display: 'flex', gap: 16, fontSize: 13, color: 'var(--text-secondary)' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Calendar size={14} /> {new Date(game.createdAt).toLocaleDateString()}
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Clock size={14} /> {game.settings.turnTimeLimitSeconds}s por turno
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Tab Navigation */}
        <div style={{ display: 'flex', borderBottom: '1px solid var(--panel-border)', background: 'rgba(0,0,0,0.2)' }}>
          <button
            onClick={() => setActiveTab('standings')}
            style={{
              flex: 1,
              padding: '12px 16px',
              background: activeTab === 'standings' ? 'rgba(155, 92, 255, 0.12)' : 'transparent',
              border: 'none',
              borderBottom: activeTab === 'standings' ? '2px solid var(--accent-purple)' : 'none',
              color: activeTab === 'standings' ? '#fff' : 'var(--text-secondary)',
              fontWeight: 700,
              fontSize: 14,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
            }}
          >
            <Trophy size={16} color="var(--status-amber)" /> Tabla de Posiciones
          </button>
          <button
            onClick={() => setActiveTab('scores')}
            style={{
              flex: 1,
              padding: '12px 16px',
              background: activeTab === 'scores' ? 'rgba(155, 92, 255, 0.12)' : 'transparent',
              border: 'none',
              borderBottom: activeTab === 'scores' ? '2px solid var(--accent-purple)' : 'none',
              color: activeTab === 'scores' ? '#fff' : 'var(--text-secondary)',
              fontWeight: 700,
              fontSize: 14,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
            }}
          >
            <BarChart2 size={16} /> Registro de Puntuación
          </button>
        </div>

        {/* Body Content */}
        <div style={{ padding: 24, overflowY: 'auto', flex: 1 }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>Cargando partida...</div>
          ) : !game ? (
            <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>No se encontraron datos.</div>
          ) : activeTab === 'standings' ? (
            <div>
              {/* Standings Table */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {sortedPlayers.map((sp, idx) => (
                  <div
                    key={sp.player.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '14px 18px',
                      borderRadius: 'var(--radius-md)',
                      background: idx === 0 ? 'rgba(255, 200, 61, 0.08)' : 'rgba(255, 255, 255, 0.03)',
                      border: idx === 0 ? '1px solid rgba(255, 200, 61, 0.3)' : '1px solid var(--panel-border)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <span style={{ fontSize: 18, width: 26, textAlign: 'center' }}>
                        {podiumMedals[idx] || `#${idx + 1}`}
                      </span>

                      <div
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: '50%',
                          background: sp.player.avatarColor,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 800,
                          color: '#000',
                          fontSize: 14,
                        }}
                      >
                        {sp.player.name.charAt(0).toUpperCase()}
                      </div>

                      <div>
                        <div style={{ fontWeight: 700, fontSize: 15 }}>{sp.player.name}</div>
                        {idx === 0 && (
                          <span style={{ fontSize: 11, color: 'var(--status-amber)', fontWeight: 700 }}>
                            GANADOR DE LA PARTIDA
                          </span>
                        )}
                      </div>
                    </div>

                    <div style={{ textAlign: 'right', display: 'flex', gap: 20, alignItems: 'center' }}>
                      {/* Puntos Acumulados */}
                      <div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                          PUNTOS
                        </div>
                        <div className="font-mono" style={{ fontWeight: 800, fontSize: 16, color: idx === 0 ? '#ffc83d' : '#fff' }}>
                          {sp.points} pts
                        </div>
                      </div>

                      {/* Tiempo Acumulado */}
                      <div style={{ minWidth: 70, textAlign: 'right' }}>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 3, justifyContent: 'flex-end' }}>
                          <Clock size={10} /> TIEMPO
                        </div>
                        <div className="font-mono" style={{ fontWeight: 700, fontSize: 14, color: 'var(--status-green)' }}>
                          {sp.timeSpentFormatted}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            /* Audit / Score Entries Log */
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {game.scores.length === 0 ? (
                <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 24 }}>
                  No hay anotaciones registradas aún.
                </div>
              ) : (
                game.scores.map((sc) => {
                  const player = game.players.find((p) => p.id === sc.playerId);
                  return (
                    <div
                      key={sc.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '10px 14px',
                        borderRadius: 'var(--radius-sm)',
                        background: 'rgba(255,255,255,0.02)',
                        border: '1px solid var(--panel-border)',
                        fontSize: 13,
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span className="badge badge-purple" style={{ fontSize: 10 }}>
                          Ronda {sc.roundNumber}
                        </span>
                        <span style={{ fontWeight: 600 }}>{player?.name || sc.playerId}</span>
                        <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>— {sc.reason}</span>
                      </div>
                      <span
                        className="font-mono"
                        style={{
                          fontWeight: 700,
                          color: sc.source === 'game_error' ? 'var(--status-red)' : sc.source === 'timeout' ? 'var(--status-amber)' : '#fff',
                        }}
                      >
                        +{sc.points} pts
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: '16px 24px', borderTop: '1px solid var(--panel-border)', display: 'flex', justifyContent: 'flex-end' }}>
          <button onClick={onClose} className="btn btn-secondary">
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
