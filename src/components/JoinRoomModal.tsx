import React, { useState, useEffect } from 'react';
import { Wifi, X, LogIn, AlertCircle } from 'lucide-react';
import { useModalBackHandler } from '../hooks/useModalBackHandler';

interface JoinRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  onJoinRoom: (code: string, playerName: string) => Promise<void>;
  initialCode?: string;
}

export const JoinRoomModal: React.FC<JoinRoomModalProps> = ({
  isOpen,
  onClose,
  onJoinRoom,
  initialCode = '',
}) => {
  const [code, setCode] = useState(initialCode);
  const [playerName, setPlayerName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useModalBackHandler(isOpen, onClose);

  useEffect(() => {
    if (initialCode) {
      setCode(initialCode.toUpperCase());
    }
  }, [initialCode]);

  if (!isOpen) return null;

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = code.trim().toUpperCase();
    const cleanName = playerName.trim();

    if (!cleanCode || cleanCode.length < 3) {
      setError('Ingresa un código de sala válido');
      return;
    }

    if (!cleanName) {
      setError('Ingresa tu nombre de jugador');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await onJoinRoom(cleanCode, cleanName);
      setLoading(false);
      onClose();
    } catch (err: any) {
      setLoading(false);
      setError(err.message || 'No se pudo conectar a la sala. Verifica el código.');
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.8)',
        backdropFilter: 'blur(10px)',
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
          maxWidth: 440,
          padding: 32,
          position: 'relative',
          background: '#0d121c',
          textAlign: 'center',
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

        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: '50%',
            background: 'rgba(155, 92, 255, 0.15)',
            color: 'var(--accent-purple)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 16,
          }}
        >
          <Wifi size={30} />
        </div>

        <h3 style={{ fontSize: 24, fontWeight: 800, marginBottom: 8 }} className="font-display">
          Unirse a Sala Multidispositivo
        </h3>
        <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 24 }}>
          Ingresa el código de 4 dígitos y tu nombre para unirte a la mesa.
        </p>

        <form onSubmit={handleJoin}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 20 }}>
            <div>
              <label style={{ display: 'block', textAlign: 'left', fontSize: 12, color: 'var(--text-muted)', marginBottom: 6, fontWeight: 700 }}>
                CÓDIGO DE SALA
              </label>
              <input
                type="text"
                maxLength={6}
                placeholder="Ej. 4829"
                value={code}
                onChange={(e) => {
                  setCode(e.target.value.toUpperCase());
                  setError(null);
                }}
                style={{
                  width: '100%',
                  padding: '14px',
                  fontSize: 24,
                  fontWeight: 900,
                  letterSpacing: 4,
                  textAlign: 'center',
                  borderRadius: 'var(--radius-md)',
                  background: 'rgba(0,0,0,0.5)',
                  border: error ? '1px solid var(--status-red)' : '1px solid var(--panel-border)',
                  color: 'var(--status-amber)',
                  textTransform: 'uppercase',
                }}
                autoFocus
              />
            </div>

            <div>
              <label style={{ display: 'block', textAlign: 'left', fontSize: 12, color: 'var(--text-muted)', marginBottom: 6, fontWeight: 700 }}>
                TU NOMBRE DE JUGADOR
              </label>
              <input
                type="text"
                maxLength={20}
                placeholder="Ej. Luis"
                value={playerName}
                onChange={(e) => {
                  setPlayerName(e.target.value);
                  setError(null);
                }}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  fontSize: 16,
                  fontWeight: 600,
                  borderRadius: 'var(--radius-md)',
                  background: 'rgba(0,0,0,0.5)',
                  border: '1px solid var(--panel-border)',
                  color: '#fff',
                }}
              />
            </div>
          </div>

          {error && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '10px 14px',
                borderRadius: 'var(--radius-sm)',
                background: 'rgba(255, 83, 101, 0.15)',
                border: '1px solid var(--status-red)',
                color: 'var(--status-red)',
                fontSize: 13,
                marginBottom: 20,
                textAlign: 'left',
              }}
            >
              <AlertCircle size={18} style={{ flexShrink: 0 }} />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !code.trim() || !playerName.trim()}
            className="btn btn-primary btn-lg"
            style={{ width: '100%', opacity: loading || !code.trim() || !playerName.trim() ? 0.6 : 1 }}
          >
            {loading ? (
              'Conectando a la sala...'
            ) : (
              <>
                <LogIn size={20} /> Entrar a la Sala
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
