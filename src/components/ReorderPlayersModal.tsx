import React, { useState } from 'react';
import { RefreshCw, X, ArrowUp, ArrowDown, Check } from 'lucide-react';
import { Player } from '../domain/models';
import { useModalBackHandler } from '../hooks/useModalBackHandler';

interface ReorderPlayersModalProps {
  isOpen: boolean;
  players: Player[];
  onClose: () => void;
  onSaveOrder: (newOrderedIds: string[]) => void;
}

export const ReorderPlayersModal: React.FC<ReorderPlayersModalProps> = ({
  isOpen,
  players,
  onClose,
  onSaveOrder,
}) => {
  const [orderedList, setOrderedList] = useState<Player[]>(players);

  useModalBackHandler(isOpen, onClose);

  if (!isOpen) return null;

  const handleMove = (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= orderedList.length) return;

    const copy = [...orderedList];
    const temp = copy[index];
    copy[index] = copy[newIndex];
    copy[newIndex] = temp;
    setOrderedList(copy);
  };

  const handleSave = () => {
    onSaveOrder(orderedList.map((p) => p.id));
    onClose();
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(8px)',
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
          maxWidth: 480,
          padding: 28,
          position: 'relative',
          background: '#0d121c',
        }}
      >
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: 16,
            right: 16,
            background: 'none',
            border: 'none',
            color: 'var(--text-muted)',
            cursor: 'pointer',
          }}
        >
          <X size={18} />
        </button>

        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: '50%',
              background: 'rgba(155, 92, 255, 0.15)',
              color: 'var(--accent-purple)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 10,
            }}
          >
            <RefreshCw size={22} />
          </div>
          <h3 style={{ fontSize: 20, fontWeight: 800 }} className="font-display">
            Reordenar Asientos de Jugadores
          </h3>
          <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
            Ajusta el orden de la mesa en tiempo real. Esto no afecta los puntos ni el turno activo.
          </p>
        </div>

        {/* Players List with Up / Down Controls */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 24, maxHeight: 320, overflowY: 'auto' }}>
          {orderedList.map((player, idx) => (
            <div
              key={player.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 14px',
                borderRadius: 'var(--radius-md)',
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid var(--panel-border)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span className="font-mono" style={{ fontSize: 13, color: 'var(--text-muted)', width: 20 }}>
                  #{idx + 1}
                </span>
                <div
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: '50%',
                    background: player.avatarColor,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#000',
                    fontWeight: 800,
                    fontSize: 12,
                  }}
                >
                  {player.name.charAt(0)}
                </div>
                <span style={{ fontWeight: 600, fontSize: 14 }}>{player.name}</span>
              </div>

              <div style={{ display: 'flex', gap: 4 }}>
                <button
                  type="button"
                  onClick={() => handleMove(idx, 'up')}
                  disabled={idx === 0}
                  className="btn btn-secondary btn-sm"
                  style={{ opacity: idx === 0 ? 0.3 : 1 }}
                  title="Subir posición"
                >
                  <ArrowUp size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => handleMove(idx, 'down')}
                  disabled={idx === orderedList.length - 1}
                  className="btn btn-secondary btn-sm"
                  style={{ opacity: idx === orderedList.length - 1 ? 0.3 : 1 }}
                  title="Bajar posición"
                >
                  <ArrowDown size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={onClose} className="btn btn-secondary" style={{ flex: 1 }}>
            Cancelar
          </button>
          <button onClick={handleSave} className="btn btn-primary" style={{ flex: 1 }}>
            <Check size={18} /> Guardar Orden
          </button>
        </div>
      </div>
    </div>
  );
};
