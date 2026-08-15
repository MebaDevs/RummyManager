import React, { useState } from 'react';
import { Wifi, Copy, Check, X, Users, Play, ArrowUp, ArrowDown, Trash2, Plus } from 'lucide-react';
import { Player } from '../domain/models';
import { useModalBackHandler } from '../hooks/useModalBackHandler';

interface CreateRoomModalProps {
  isOpen: boolean;
  roomCode: string;
  connectedCount: number;
  lobbyPlayers: Player[];
  isHost: boolean;
  onClose: () => void;
  onAddLocalPlayer: (name: string) => void;
  onRemovePlayer: (playerId: string) => void;
  onReorderPlayers: (newOrderedIds: string[]) => void;
  onStartGame: () => void;
}

export const CreateRoomModal: React.FC<CreateRoomModalProps> = ({
  isOpen,
  roomCode,
  connectedCount,
  lobbyPlayers,
  isHost,
  onClose,
  onAddLocalPlayer,
  onRemovePlayer,
  onReorderPlayers,
  onStartGame,
}) => {
  const [copied, setCopied] = useState(false);
  const [newPlayerName, setNewPlayerName] = useState('');

  useModalBackHandler(isOpen, onClose);

  if (!isOpen) return null;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(roomCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareUrl = `${window.location.origin}${window.location.pathname}?room=${roomCode}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleAddLocal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlayerName.trim()) return;
    onAddLocalPlayer(newPlayerName.trim());
    setNewPlayerName('');
  };

  const movePlayer = (index: number, direction: 'up' | 'down') => {
    const newIdx = direction === 'up' ? index - 1 : index + 1;
    if (newIdx < 0 || newIdx >= lobbyPlayers.length) return;

    const copy = [...lobbyPlayers];
    const temp = copy[index];
    copy[index] = copy[newIdx];
    copy[newIdx] = temp;

    onReorderPlayers(copy.map((p) => p.id));
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.85)',
        backdropFilter: 'blur(12px)',
        zIndex: 250,
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
          maxWidth: 520,
          padding: 32,
          position: 'relative',
          background: '#0d121c',
          maxHeight: '90vh',
          overflowY: 'auto',
        }}
      >
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

        {/* Header Icon & Title */}
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: '50%',
              background: 'rgba(53, 229, 138, 0.15)',
              color: 'var(--status-green)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 12,
            }}
          >
            <Wifi size={30} />
          </div>

          <h3 style={{ fontSize: 24, fontWeight: 800, marginBottom: 6 }} className="font-display">
            Sala de Espera (Lobby)
          </h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: 13 }}>
            {isHost
              ? `Comparte el código para que los demás celulares se unan (${connectedCount} dispositivo(s) conectado(s)). Reordena sus asientos antes de iniciar.`
              : 'Conectado a la sala. Esperando a que el organizador ordene los asientos e inicie la partida.'}
          </p>
        </div>

        {/* Room Code Display Box */}
        <div
          style={{
            background: 'rgba(255, 255, 255, 0.04)',
            border: '2px dashed var(--accent-purple)',
            borderRadius: 'var(--radius-lg)',
            padding: '16px',
            textAlign: 'center',
            marginBottom: 16,
          }}
        >
          <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 4, fontWeight: 700 }}>
            CÓDIGO DE SALA
          </div>
          <div
            className="font-mono"
            style={{
              fontSize: 40,
              fontWeight: 900,
              letterSpacing: 8,
              color: 'var(--status-amber)',
              textShadow: '0 0 20px rgba(255, 200, 61, 0.3)',
            }}
          >
            {roomCode}
          </div>

          <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginTop: 12 }}>
            <button
              onClick={handleCopyCode}
              className="btn btn-secondary btn-sm"
              style={{ fontSize: 12 }}
            >
              {copied ? <Check size={14} color="var(--status-green)" /> : <Copy size={14} />}
              {copied ? '¡Copiado!' : 'Copiar Código'}
            </button>
            <button
              onClick={handleCopyLink}
              className="btn btn-secondary btn-sm"
              style={{ fontSize: 12 }}
            >
              <Copy size={14} /> Copiar Enlace
            </button>
          </div>
        </div>

        {/* Joined Players Section */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <h4 style={{ fontSize: 15, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
              <Users size={18} color="var(--status-green)" />
              Jugadores Unidos ({lobbyPlayers.length})
            </h4>
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              El 1º de la lista inicia la partida
            </span>
          </div>

          {lobbyPlayers.length === 0 ? (
            <div
              style={{
                padding: '24px 16px',
                borderRadius: 'var(--radius-md)',
                background: 'rgba(255,255,255,0.02)',
                border: '1px dashed var(--panel-border)',
                textAlign: 'center',
                color: 'var(--text-muted)',
                fontSize: 14,
              }}
            >
              Esperando a que los celulares ingresen el código {roomCode}...
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {lobbyPlayers.map((p, idx) => (
                <div
                  key={p.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 14px',
                    borderRadius: 'var(--radius-md)',
                    background: idx === 0 ? 'rgba(53, 229, 138, 0.1)' : 'rgba(255,255,255,0.03)',
                    border: idx === 0 ? '1px solid var(--status-green)' : '1px solid var(--panel-border)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--text-muted)', width: 20 }}>
                      #{idx + 1}
                    </span>
                    <div
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: '50%',
                        background: p.avatarColor,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 800,
                        color: '#000',
                        fontSize: 14,
                      }}
                    >
                      {p.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 15 }}>{p.name}</div>
                      {idx === 0 && (
                        <span style={{ fontSize: 10, color: 'var(--status-green)', fontWeight: 700 }}>
                          🟢 INICIA RONDA 1
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Host Controls for Seat Reordering */}
                  {isHost && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <button
                        onClick={() => movePlayer(idx, 'up')}
                        disabled={idx === 0}
                        className="btn btn-secondary btn-sm"
                        style={{ padding: '4px 8px', opacity: idx === 0 ? 0.3 : 1 }}
                        title="Subir asiento"
                      >
                        <ArrowUp size={14} />
                      </button>
                      <button
                        onClick={() => movePlayer(idx, 'down')}
                        disabled={idx === lobbyPlayers.length - 1}
                        className="btn btn-secondary btn-sm"
                        style={{ padding: '4px 8px', opacity: idx === lobbyPlayers.length - 1 ? 0.3 : 1 }}
                        title="Bajar asiento"
                      >
                        <ArrowDown size={14} />
                      </button>
                      <button
                        onClick={() => onRemovePlayer(p.id)}
                        className="btn btn-secondary btn-sm"
                        style={{ padding: '4px 8px', color: 'var(--status-red)' }}
                        title="Quitar jugador"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Add Local Player Form (Host Only) */}
        {isHost && (
          <form onSubmit={handleAddLocal} style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
            <input
              type="text"
              placeholder="Agregar otro jugador local..."
              value={newPlayerName}
              onChange={(e) => setNewPlayerName(e.target.value)}
              style={{
                flex: 1,
                padding: '10px 14px',
                borderRadius: 'var(--radius-md)',
                background: 'rgba(0,0,0,0.5)',
                border: '1px solid var(--panel-border)',
                color: '#fff',
                fontSize: 14,
              }}
            />
            <button
              type="submit"
              disabled={!newPlayerName.trim()}
              className="btn btn-secondary"
              style={{ padding: '10px 14px', fontSize: 13 }}
            >
              <Plus size={16} /> Añadir
            </button>
          </form>
        )}

        {/* Start Game Action */}
        {isHost ? (
          <button
            onClick={onStartGame}
            disabled={lobbyPlayers.length < 2}
            className="btn btn-primary btn-lg"
            style={{ width: '100%', opacity: lobbyPlayers.length < 2 ? 0.5 : 1 }}
          >
            <Play size={20} /> 🚀 Iniciar Partida de Rummy ({lobbyPlayers.length} Jugadores)
          </button>
        ) : (
          <div
            style={{
              padding: '16px',
              borderRadius: 'var(--radius-md)',
              background: 'rgba(53, 229, 138, 0.1)',
              border: '1px solid var(--status-green)',
              textAlign: 'center',
              fontSize: 14,
              fontWeight: 600,
              color: 'var(--status-green)',
            }}
          >
            ⏳ ¡Estás conectado! Esperando a que el organizador inicie el juego...
          </div>
        )}
      </div>
    </div>
  );
};
