import React from 'react';
import { Wifi, Users, LogOut, Loader2, Sparkles } from 'lucide-react';
import { Player } from '../domain/models';

interface GuestLobbyViewProps {
  roomCode: string;
  lobbyPlayers: Player[];
  connectedCount: number;
  onLeaveRoom: () => void;
}

export const GuestLobbyView: React.FC<GuestLobbyViewProps> = ({
  roomCode,
  lobbyPlayers,
  connectedCount,
  onLeaveRoom,
}) => {
  // Read current guest name saved in P2P session if available
  let guestName = '';
  try {
    const saved = localStorage.getItem('rummy_p2p_session');
    if (saved) {
      const parsed = JSON.parse(saved);
      guestName = parsed.playerName || '';
    }
  } catch (e) {
    // fallback empty
  }

  return (
    <div
      style={{
        maxWidth: 580,
        margin: '40px auto',
        padding: '20px',
        width: '100%',
        boxSizing: 'border-box',
      }}
    >
      <div
        className="glass-panel"
        style={{
          padding: '32px 24px',
          background: 'var(--panel-bg)',
          border: '1px solid rgba(155, 92, 255, 0.3)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
          borderRadius: 'var(--radius-lg)',
          textAlign: 'center',
        }}
      >
        {/* Status Badge */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '6px 14px',
              borderRadius: 999,
              background: 'rgba(53, 229, 138, 0.12)',
              border: '1px solid var(--status-green)',
              color: 'var(--status-green)',
              fontSize: 13,
              fontWeight: 700,
            }}
          >
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: 'var(--status-green)',
                boxShadow: '0 0 8px var(--status-green)',
                animation: 'pulse 1.5s infinite',
              }}
            />
            <Wifi size={16} /> Sala: {roomCode} ({connectedCount} disp.)
          </div>
        </div>

        {/* Title */}
        <h2 className="font-display" style={{ fontSize: 28, fontWeight: 800, marginBottom: 8 }}>
          Sala de Espera (Lobby)
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 24, lineHeight: 1.5 }}>
          Te has unido a la sala. El organizador organizará el orden de asientos e iniciará la partida en breve.
        </p>

        {/* Players List in Seat Order */}
        <div
          style={{
            background: 'rgba(0, 0, 0, 0.25)',
            border: '1px solid var(--panel-border)',
            borderRadius: 'var(--radius-md)',
            padding: '16px',
            marginBottom: 24,
            textAlign: 'left',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 12,
              paddingBottom: 8,
              borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            }}
          >
            <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              ORDEN DE ASIENTOS / TURNOS
            </span>
            <span style={{ fontSize: 11, color: 'var(--status-amber)', display: 'flex', alignItems: 'center', gap: 4, fontWeight: 700 }}>
              <Users size={12} /> {lobbyPlayers.length} Jugadores
            </span>
          </div>

          {lobbyPlayers.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '20px 0', color: 'var(--text-muted)', fontSize: 13 }}>
              Cargando lista de jugadores...
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {lobbyPlayers.map((player, index) => {
                const isYou = guestName && player.name.toLowerCase() === guestName.toLowerCase();
                const isFirst = index === 0;

                return (
                  <div
                    key={player.id}
                    style={{
                      padding: '12px 14px',
                      borderRadius: 'var(--radius-md)',
                      background: isYou ? 'rgba(155, 92, 255, 0.15)' : 'rgba(255, 255, 255, 0.03)',
                      border: isYou ? '1px solid var(--accent-purple)' : '1px solid rgba(255, 255, 255, 0.06)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <span
                        className="font-mono"
                        style={{
                          fontSize: 13,
                          fontWeight: 800,
                          color: isFirst ? 'var(--status-amber)' : 'var(--text-muted)',
                          width: 24,
                          textAlign: 'center',
                        }}
                      >
                        #{index + 1}
                      </span>

                      <div
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: '50%',
                          background: player.avatarColor,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 800,
                          color: '#000',
                          fontSize: 14,
                          boxShadow: isYou ? `0 0 12px ${player.avatarColor}` : 'none',
                        }}
                      >
                        {player.name.charAt(0).toUpperCase()}
                      </div>

                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700, fontSize: 15 }}>
                          <span>{player.name}</span>
                          {isYou && (
                            <span
                              className="badge badge-purple"
                              style={{ fontSize: 10, padding: '2px 6px', fontWeight: 800 }}
                            >
                              TÚ
                            </span>
                          )}
                        </div>
                        <span style={{ fontSize: 11, color: isFirst ? 'var(--status-amber)' : 'var(--text-muted)' }}>
                          {isFirst ? '⭐ Empieza la Ronda 1' : `Asiento ${index + 1}`}
                        </span>
                      </div>
                    </div>

                    {isFirst && <Sparkles size={16} color="var(--status-amber)" />}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Live waiting indicator */}
        <div
          style={{
            padding: '14px',
            borderRadius: 'var(--radius-md)',
            background: 'rgba(255, 200, 61, 0.08)',
            border: '1px solid rgba(255, 200, 61, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 10,
            color: 'var(--status-amber)',
            fontSize: 13,
            fontWeight: 600,
            marginBottom: 24,
          }}
        >
          <Loader2 size={18} className="animate-spin" />
          <span>Esperando que el organizador inicie la partida...</span>
        </div>

        {/* Action Button */}
        <button
          onClick={onLeaveRoom}
          className="btn btn-secondary"
          style={{
            width: '100%',
            padding: '12px',
            borderRadius: 'var(--radius-md)',
            color: 'var(--status-red)',
            borderColor: 'rgba(255, 83, 101, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            fontSize: 13,
          }}
        >
          <LogOut size={16} /> Salir de la Sala
        </button>
      </div>
    </div>
  );
};
