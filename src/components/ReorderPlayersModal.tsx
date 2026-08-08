import React, { useState } from 'react';
import { RefreshCw, X, Check, GripVertical } from 'lucide-react';
import { Player } from '../domain/models';
import { useSortable } from '../hooks/useSortable';

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

<<<<<<< HEAD
  const { draggingIndex, overIndex, handleHandleMouseDown, handleHandleTouchStart, handleItemMouseEnter, setRowRef } = useSortable(
=======
  const { draggingIndex, overIndex, handleHandleMouseDown, handleItemMouseEnter } = useSortable(
>>>>>>> 802d29080402ee4f73cf83aad327aa8b327db203
    orderedList,
    (reordered) => setOrderedList(reordered)
  );

  if (!isOpen) return null;

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
        style={{ width: '100%', maxWidth: 480, padding: 28, position: 'relative', background: '#0d121c' }}
      >
        <button
          onClick={onClose}
          style={{ position: 'absolute', top: 16, right: 16, background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
        >
          <X size={18} />
        </button>

        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <div
            style={{
              width: 44, height: 44, borderRadius: '50%',
              background: 'rgba(155, 92, 255, 0.15)', color: 'var(--accent-purple)',
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 10,
            }}
          >
            <RefreshCw size={22} />
          </div>
          <h3 style={{ fontSize: 20, fontWeight: 800 }} className="font-display">
            Reordenar Asientos
          </h3>
          <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
            Mantén presionado el ícono <strong>⠿</strong> y arrastra para cambiar el orden.
          </p>
        </div>

        {/* Sortable Players List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 24, maxHeight: 320, overflowY: 'auto' }}>
          {orderedList.map((player, idx) => {
            const isDraggingThisRow = draggingIndex === idx;
            const isOverThisRow = overIndex === idx && draggingIndex !== null && draggingIndex !== idx;
            return (
              <div
                key={player.id}
<<<<<<< HEAD
                ref={(el) => setRowRef(idx, el as HTMLElement | null)}
=======
>>>>>>> 802d29080402ee4f73cf83aad327aa8b327db203
                onMouseEnter={() => handleItemMouseEnter(idx)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '10px 14px',
                  borderRadius: 'var(--radius-md)',
                  background: isOverThisRow ? 'rgba(155,92,255,0.22)' : 'rgba(255,255,255,0.03)',
                  border: isOverThisRow ? '2px dashed var(--accent-purple)' : '1px solid var(--panel-border)',
                  opacity: isDraggingThisRow ? 0.4 : 1,
                  transition: 'border 0.1s, background 0.1s, opacity 0.1s',
                  cursor: draggingIndex !== null ? 'grabbing' : 'default',
                  userSelect: 'none',
                }}
              >
                {/* Drag handle */}
                <div
                  onMouseDown={() => handleHandleMouseDown(idx)}
<<<<<<< HEAD
                  onTouchStart={(e) => handleHandleTouchStart(e, idx)}
                  style={{ color: 'var(--text-muted)', cursor: 'grab', display: 'flex', alignItems: 'center', flexShrink: 0, padding: '8px 4px', touchAction: 'none' }}
=======
                  style={{ color: 'var(--text-muted)', cursor: 'grab', display: 'flex', alignItems: 'center', flexShrink: 0, padding: '4px 2px' }}
>>>>>>> 802d29080402ee4f73cf83aad327aa8b327db203
                  title="Arrastra para reordenar"
                >
                  <GripVertical size={18} />
                </div>

                <span className="font-mono" style={{ fontSize: 12, color: 'var(--text-muted)', width: 20 }}>
                  #{idx + 1}
                </span>
                <div
                  style={{
                    width: 28, height: 28, borderRadius: '50%', background: player.avatarColor,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#000', fontWeight: 800, fontSize: 12, flexShrink: 0,
                  }}
                >
                  {player.name.charAt(0)}
                </div>
                <span style={{ fontWeight: 600, fontSize: 14 }}>{player.name}</span>
              </div>
            );
          })}
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
