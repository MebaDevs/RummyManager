import React, { useState } from 'react';
import { X, Trophy, Medal, ChevronLeft, ChevronRight, ListOrdered, BarChart2, ShieldAlert, Clock, Award } from 'lucide-react';
import { Game } from '../domain/models';

interface ScoreboardDrawerProps {
  game: Game;
  isOpen: boolean;
  onClose: () => void;
  onToggle: () => void;
}

type ScoreTab = 'players' | 'audit' | 'rounds';

export const ScoreboardDrawer: React.FC<ScoreboardDrawerProps> = ({
  game,
  isOpen,
  onClose,
  onToggle,
}) => {
  const [activeTab, setActiveTab] = useState<ScoreTab>('players');
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);

  // Dynamic ranking calculation based on scores in game (lowest points wins!)
  const playerTotals: Record<string, number> = {};
  game.players.forEach((p) => {
    playerTotals[p.id] = 0;
  });

  game.scores.forEach((sc) => {
    if (playerTotals[sc.playerId] !== undefined) {
      playerTotals[sc.playerId] += sc.points;
    }
  });

  const sortedPlayers = [...game.players]
    .map((player) => ({
      player,
      points: playerTotals[player.id] || 0,
      timeSpent: '03:15',
    }))
    .sort((a, b) => a.points - b.points);

  const getPositionBadge = (pos: number) => {
    if (pos === 1) return <span style={{ fontSize: 16 }}>🥇</span>;
    if (pos === 2) return <span style={{ fontSize: 16 }}>🥈</span>;
    if (pos === 3) return <span style={{ fontSize: 16 }}>🥉</span>;
    return <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>#{pos}</span>;
  };

  const selectedPlayer = game.players.find((p) => p.id === selectedPlayerId);
  const playerAuditScores = game.scores.filter((sc) => sc.playerId === selectedPlayerId);

  return (
    <>
      {/* Edge Flap Tab Button */}
      <button
        onClick={onToggle}
        className="scoreboard-flap-btn"
        style={{
          position: 'fixed',
          right: isOpen ? 380 : 0,
          top: '50%',
          transform: 'translateY(-50%)',
          zIndex: 101,
          background: 'linear-gradient(135deg, #9b5cff 0%, #35e58a 100%)',
          color: '#ffffff',
          border: 'none',
          borderTopLeftRadius: 12,
          borderBottomLeftRadius: 12,
          padding: '16px 10px',
          cursor: 'pointer',
          boxShadow: '-4px 0 20px rgba(155, 92, 255, 0.4)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 6,
          transition: 'right 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
        title={isOpen ? 'Ocultar Puntuación' : 'Abrir Tabla de Puntuación'}
      >
        {isOpen ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
        <BarChart2 size={18} />
        <span
          style={{
            writingMode: 'vertical-rl',
            textTransform: 'uppercase',
            fontSize: 11,
            fontWeight: 800,
            letterSpacing: '0.1em',
          }}
        >
          PUNTUACIÓN
        </span>
      </button>

      {/* Drawer Overlay Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            backdropFilter: 'blur(4px)',
            zIndex: 99,
          }}
        />
      )}

      {/* Sliding Drawer Container */}
      <aside
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          width: 380,
          maxWidth: '85vw',
          height: '100vh',
          background: '#0d121c',
          borderLeft: '1px solid var(--panel-border)',
          boxShadow: '-10px 0 40px rgba(0, 0, 0, 0.6)',
          zIndex: 100,
          transform: isOpen ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
        }}
      >
        {/* Drawer Header */}
        <div>
          <div
            style={{
              padding: '20px 24px',
              borderBottom: '1px solid var(--panel-border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Trophy size={22} color="var(--status-amber)" />
              <h3 style={{ fontSize: 18, fontWeight: 800 }} className="font-display">
                TABLA DE PUNTUACIÓN
              </h3>
            </div>
            <button
              onClick={onClose}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                padding: 4,
              }}
            >
              <X size={20} />
            </button>
          </div>

          {/* Top Tabs */}
          <div
            style={{
              display: 'flex',
              borderBottom: '1px solid var(--panel-border)',
              background: 'rgba(0,0,0,0.2)',
            }}
          >
            <button
              onClick={() => {
                setActiveTab('players');
                setSelectedPlayerId(null);
              }}
              style={{
                flex: 1,
                padding: '12px 8px',
                background: 'none',
                border: 'none',
                borderBottom: activeTab === 'players' ? '2px solid var(--accent-purple)' : '2px solid transparent',
                color: activeTab === 'players' ? '#ffffff' : 'var(--text-muted)',
                fontWeight: activeTab === 'players' ? 700 : 500,
                fontSize: 12,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 4,
              }}
            >
              <Medal size={14} /> Posiciones
            </button>

            <button
              onClick={() => {
                setActiveTab('audit');
                if (!selectedPlayerId && game.players.length > 0) {
                  setSelectedPlayerId(game.players[0].id);
                }
              }}
              style={{
                flex: 1,
                padding: '12px 8px',
                background: 'none',
                border: 'none',
                borderBottom: activeTab === 'audit' ? '2px solid var(--accent-purple)' : '2px solid transparent',
                color: activeTab === 'audit' ? '#ffffff' : 'var(--text-muted)',
                fontWeight: activeTab === 'audit' ? 700 : 500,
                fontSize: 12,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 4,
              }}
            >
              <Award size={14} /> Auditoría
            </button>

            <button
              onClick={() => {
                setActiveTab('rounds');
                setSelectedPlayerId(null);
              }}
              style={{
                flex: 1,
                padding: '12px 8px',
                background: 'none',
                border: 'none',
                borderBottom: activeTab === 'rounds' ? '2px solid var(--accent-purple)' : '2px solid transparent',
                color: activeTab === 'rounds' ? '#ffffff' : 'var(--text-muted)',
                fontWeight: activeTab === 'rounds' ? 700 : 500,
                fontSize: 12,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 4,
              }}
            >
              <ListOrdered size={14} /> Rondas
            </button>
          </div>

          {/* Drawer Body Content */}
          <div style={{ padding: 18, overflowY: 'auto', maxHeight: 'calc(100vh - 200px)' }}>
            {activeTab === 'players' && (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--panel-border)' }}>
                    <th style={{ padding: '8px 6px', fontSize: 11, color: 'var(--text-muted)' }}># POS</th>
                    <th style={{ padding: '8px 6px', fontSize: 11, color: 'var(--text-muted)' }}>JUGADOR</th>
                    <th style={{ padding: '8px 6px', fontSize: 11, color: 'var(--text-muted)', textAlign: 'right' }}>PUNTOS</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedPlayers.map((item, index) => (
                    <tr
                      key={item.player.id}
                      onClick={() => {
                        setSelectedPlayerId(item.player.id);
                        setActiveTab('audit');
                      }}
                      style={{
                        borderBottom: '1px solid rgba(255,255,255,0.05)',
                        background: index === 0 ? 'rgba(53, 229, 138, 0.08)' : 'transparent',
                        cursor: 'pointer',
                      }}
                      title="Haz clic para auditar el origen de sus puntos"
                    >
                      <td style={{ padding: '12px 6px', textAlign: 'center' }}>
                        {getPositionBadge(index + 1)}
                      </td>
                      <td style={{ padding: '12px 6px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div
                            style={{
                              width: 26,
                              height: 26,
                              borderRadius: '50%',
                              background: item.player.avatarColor,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: 12,
                              fontWeight: 800,
                              color: '#000',
                            }}
                          >
                            {item.player.name.charAt(0)}
                          </div>
                          <span style={{ fontWeight: 600, fontSize: 14 }}>{item.player.name}</span>
                        </div>
                      </td>
                      <td style={{ padding: '12px 6px', textAlign: 'right' }} className="font-mono">
                        <span style={{ fontWeight: 800, color: index === 0 ? 'var(--status-green)' : 'var(--text-primary)' }}>
                          {item.points} pts
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {/* TAB AUDIT (V0.8 Granular Score History) */}
            {activeTab === 'audit' && (
              <div>
                {/* Player Selector Bar */}
                <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 10, marginBottom: 14 }}>
                  {game.players.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => setSelectedPlayerId(p.id)}
                      className={`btn btn-sm ${selectedPlayerId === p.id ? 'btn-primary' : 'btn-secondary'}`}
                      style={{ borderRadius: 999 }}
                    >
                      {p.name}
                    </button>
                  ))}
                </div>

                {selectedPlayer && (
                  <div>
                    <h4 style={{ fontSize: 15, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                      Auditoría de Puntos: <span style={{ color: 'var(--status-green)' }}>{selectedPlayer.name}</span>
                    </h4>

                    {playerAuditScores.length === 0 ? (
                      <p style={{ color: 'var(--text-muted)', fontSize: 13, textAlign: 'center', padding: 20 }}>
                        No hay registros de puntos para este jugador todavía.
                      </p>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {playerAuditScores.map((sc) => (
                          <div
                            key={sc.id}
                            style={{
                              padding: '10px 12px',
                              borderRadius: 'var(--radius-sm)',
                              background:
                                sc.source === 'game_error'
                                  ? 'rgba(255, 83, 101, 0.12)'
                                  : sc.source === 'timeout'
                                  ? 'rgba(255, 200, 61, 0.12)'
                                  : 'rgba(255, 255, 255, 0.03)',
                              border:
                                sc.source === 'game_error'
                                  ? '1px solid var(--status-red)'
                                  : sc.source === 'timeout'
                                  ? '1px solid var(--status-amber)'
                                  : '1px solid var(--panel-border)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                            }}
                          >
                            <div>
                              <div style={{ fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
                                {sc.source === 'game_error' && <ShieldAlert size={14} color="var(--status-red)" />}
                                {sc.source === 'timeout' && <Clock size={14} color="var(--status-amber)" />}
                                {sc.reason}
                              </div>
                              <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                                Ronda {sc.roundNumber} · {new Date(sc.createdAt).toLocaleTimeString()}
                              </span>
                            </div>
                            <span
                              className="font-mono"
                              style={{
                                fontWeight: 800,
                                fontSize: 14,
                                color: sc.points > 0 ? (sc.source === 'game_error' ? 'var(--status-red)' : 'var(--status-amber)') : 'var(--status-green)',
                              }}
                            >
                              +{sc.points}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* TAB ROUNDS */}
            {activeTab === 'rounds' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {game.rounds.slice(0, game.currentRoundIndex + 1).map((rd) => (
                  <div
                    key={rd.number}
                    style={{
                      padding: 14,
                      borderRadius: 'var(--radius-md)',
                      background: 'rgba(255,255,255,0.03)',
                      border: '1px solid var(--panel-border)',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                      <span style={{ fontWeight: 700, fontSize: 14 }}>Ronda {rd.number}</span>
                      <span className={`badge ${rd.status === 'completed' ? 'badge-green' : 'badge-purple'}`}>
                        {rd.status === 'completed' ? 'Completada' : 'En Curso'}
                      </span>
                    </div>
                    <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>{rd.objective.name}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Drawer Footer Note */}
        <div
          style={{
            padding: '16px 24px',
            borderTop: '1px solid var(--panel-border)',
            background: 'rgba(0, 0, 0, 0.4)',
            textAlign: 'center',
          }}
        >
          <p style={{ fontSize: 12, color: 'var(--status-amber)', fontWeight: 600 }}>
            🏆 Gana el jugador con MENOS puntos
          </p>
        </div>
      </aside>
    </>
  );
};
