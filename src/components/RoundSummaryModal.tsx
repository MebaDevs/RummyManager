import React, { useState, useRef } from 'react';
import { Trophy, CheckCircle, ArrowRight, X } from 'lucide-react';
import { Game } from '../domain/models';
import confetti from 'canvas-confetti';
import { globalAudioNotifier } from '../infrastructure/audio/WebAudioNotifier';
import { useModalBackHandler } from '../hooks/useModalBackHandler';

interface RoundSummaryModalProps {
  game: Game;
  isOpen: boolean;
  onClose: () => void;
  onFinishRound: (winnerPlayerId: string, handPointsMap: Record<string, number>) => void;
  onStartNextRound: () => void;
}

export const RoundSummaryModal: React.FC<RoundSummaryModalProps> = ({
  game,
  isOpen,
  onClose,
  onFinishRound,
  onStartNextRound,
}) => {
  const currentRound = game.rounds[game.currentRoundIndex];
  const [winnerId, setWinnerId] = useState<string>(game.players[0]?.id || '');
  const [handPoints, setHandPoints] = useState<Record<string, string>>({});
  const [step, setStep] = useState<'select_winner' | 'enter_points' | 'summary'>('select_winner');

  // Refs for Tab / mobile-Next focus management
  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const confirmBtnRef = useRef<HTMLButtonElement | null>(null);

  useModalBackHandler(isOpen, onClose);

  if (!isOpen || !currentRound) return null;

  const activePlayers = game.players;
  const isRoundAlreadyCompleted = currentRound.status === 'completed';

  const handleSelectWinner = (pid: string) => {
    setWinnerId(pid);
    setStep('enter_points');

    // Initialize hand points for non-winner players (empty string = not yet entered)
    const initialPoints: Record<string, string> = {};
    activePlayers.forEach((p) => {
      if (p.id !== pid) {
        initialPoints[p.id] = '';
      }
    });
    setHandPoints(initialPoints);
  };

  const handlePointChange = (pid: string, raw: string) => {
    // Allow only digits (no letters, no minus, no decimals)
    const digits = raw.replace(/\D/g, '');
    setHandPoints({
      ...handPoints,
      [pid]: digits,
    });
  };

  // Active players who need to enter points (not winner, not out_by_error)
  const pointsPlayers = activePlayers.filter((p) => {
    const isWinner = p.id === winnerId;
    const isOut = currentRound.playerStates[p.id]?.status === 'out_by_error';
    return !isWinner && !isOut;
  });

  // Confirm is enabled only when every points-player has a value > 0
  const canConfirm = pointsPlayers.every((p) => {
    const val = handPoints[p.id];
    return val !== '' && val !== undefined && Number(val) > 0;
  });

  // Move focus to the next empty input (in pointsPlayers order) or to the confirm button
  const focusNextEmptyOrButton = (currentPid: string) => {
    const currentIdx = pointsPlayers.findIndex((p) => p.id === currentPid);
    // Search from next position, wrapping around
    for (let offset = 1; offset <= pointsPlayers.length; offset++) {
      const idx = (currentIdx + offset) % pointsPlayers.length;
      const candidate = pointsPlayers[idx];
      const val = handPoints[candidate.id];
      if (!val || Number(val) === 0) {
        inputRefs.current[candidate.id]?.focus();
        return;
      }
    }
    // All filled → focus confirm button
    confirmBtnRef.current?.focus();
  };

  const handleSubmitRoundScores = () => {
    if (!canConfirm) return;

    globalAudioNotifier.playVictoryFanfare();
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
    });

    // Convert string values to numbers for the engine
    const numericPoints: Record<string, number> = {};
    Object.entries(handPoints).forEach(([pid, val]) => {
      numericPoints[pid] = Number(val) || 0;
    });

    onFinishRound(winnerId, numericPoints);
    setStep('summary');
  };

  const handleNextRoundAction = () => {
    onStartNextRound();
    setStep('select_winner');
    onClose();
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(8px)',
        zIndex: 200,
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
          padding: 32,
          position: 'relative',
          background: '#0d121c',
          maxHeight: '90vh',
          overflowY: 'auto',
        }}
      >
        {/* Close button */}
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

        {/* Modal Header */}
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: '50%',
              background: 'rgba(255, 200, 61, 0.15)',
              color: 'var(--status-amber)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 12,
            }}
          >
            <Trophy size={28} />
          </div>
          <h3 style={{ fontSize: 24, fontWeight: 800, color: '#ffffff' }} className="font-display">
            Cierre de Ronda {currentRound.number}
          </h3>
          <p style={{ color: 'rgba(255, 255, 255, 0.75)', fontSize: 14, fontWeight: 500 }}>
            {currentRound.objective.name}
          </p>
        </div>

        {/* STEP 1: Select Winner */}
        {step === 'select_winner' && !isRoundAlreadyCompleted && (
          <div>
            <h4 style={{ fontSize: 16, marginBottom: 14, color: '#ffffff', fontWeight: 700 }}>
              ¿Quién ganó la ronda? (Bajó todas sus cartas)
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
              {activePlayers.map((p) => {
                const isOut = currentRound.playerStates[p.id]?.status === 'out_by_error';
                const isWinner = winnerId === p.id;
                return (
                  <button
                    key={p.id}
                    onClick={() => !isOut && handleSelectWinner(p.id)}
                    disabled={isOut}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '14px 18px',
                      borderRadius: 'var(--radius-md)',
                      background: isWinner ? 'rgba(53, 229, 138, 0.18)' : 'rgba(255, 255, 255, 0.05)',
                      border: isWinner ? '2px solid var(--status-green)' : '1px solid rgba(255, 255, 255, 0.15)',
                      cursor: isOut ? 'not-allowed' : 'pointer',
                      opacity: isOut ? 0.5 : 1,
                      textAlign: 'left',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div
                        style={{
                          width: 34,
                          height: 34,
                          borderRadius: '50%',
                          background: p.avatarColor,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#000',
                          fontWeight: 800,
                          fontSize: 15,
                        }}
                      >
                        {p.name.charAt(0).toUpperCase()}
                      </div>
                      <span style={{ fontWeight: 700, fontSize: 16, color: '#ffffff' }}>{p.name}</span>
                    </div>

                    {isOut ? (
                      <span className="badge badge-red" style={{ fontWeight: 700 }}>FUERA (+150)</span>
                    ) : (
                      <span className="badge badge-green" style={{ fontWeight: 700 }}>Ganador (+0 pts)</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* STEP 2: Enter Hand Points for Remaining Players */}
        {step === 'enter_points' && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <button
                onClick={() => setStep('select_winner')}
                style={{
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: 'var(--radius-sm)',
                  color: '#ffffff',
                  fontWeight: 600,
                  cursor: 'pointer',
                  padding: '6px 12px',
                  fontSize: 13,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                }}
              >
                ← Cambiar ganador
              </button>
              <h4 style={{ fontSize: 16, margin: 0, color: '#ffffff', fontWeight: 700 }}>Puntos de cartas retenidas</h4>
            </div>
            <p style={{ fontSize: 13, color: 'rgba(255, 255, 255, 0.75)', marginBottom: 20 }}>
              El ganador suma 0 pts. Ingresa el total de cartas para los demás jugadores activos.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 28 }}>
              {activePlayers.map((p) => {
                const isWinner = p.id === winnerId;
                const isOut = currentRound.playerStates[p.id]?.status === 'out_by_error';

                if (isWinner) {
                  return (
                    <div
                      key={p.id}
                      style={{
                        padding: '14px 18px',
                        borderRadius: 'var(--radius-md)',
                        background: 'rgba(53, 229, 138, 0.15)',
                        border: '1px solid var(--status-green)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}
                    >
                      <span style={{ fontWeight: 800, color: '#ffffff', fontSize: 15 }}>🏆 {p.name} (Ganador)</span>
                      <span className="font-mono" style={{ fontWeight: 800, color: 'var(--status-green)', fontSize: 16 }}>
                        0 pts
                      </span>
                    </div>
                  );
                }

                if (isOut) {
                  return (
                    <div
                      key={p.id}
                      style={{
                        padding: '14px 18px',
                        borderRadius: 'var(--radius-md)',
                        background: 'rgba(255, 83, 101, 0.15)',
                        border: '1px solid var(--status-red)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}
                    >
                      <span style={{ fontWeight: 700, color: '#ffffff', fontSize: 15 }}>⚠️ {p.name} (Error de juego)</span>
                      <span className="font-mono" style={{ fontWeight: 800, color: 'var(--status-red)', fontSize: 16 }}>
                        +150 pts
                      </span>
                    </div>
                  );
                }

                return (
                  <div
                    key={p.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '12px 16px',
                      borderRadius: 'var(--radius-md)',
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.12)',
                    }}
                  >
                    <span style={{ fontWeight: 700, color: '#ffffff', fontSize: 16 }}>{p.name}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <input
                        ref={(el) => { inputRefs.current[p.id] = el; }}
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        placeholder="—"
                        maxLength={4}
                        enterKeyHint={canConfirm ? 'done' : 'next'}
                        value={handPoints[p.id] ?? ''}
                        onChange={(e) => handlePointChange(p.id, e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Tab') {
                            e.preventDefault();
                            focusNextEmptyOrButton(p.id);
                          } else if (e.key === 'Enter') {
                            if (canConfirm) handleSubmitRoundScores();
                            else focusNextEmptyOrButton(p.id);
                          }
                        }}
                        style={{
                          width: 84,
                          padding: '10px 12px',
                          borderRadius: 'var(--radius-sm)',
                          background: '#000000',
                          border: `2px solid ${
                            !handPoints[p.id] || Number(handPoints[p.id]) === 0
                              ? 'var(--status-amber)'
                              : 'var(--status-green)'
                          }`,
                          color: '#ffffff',
                          textAlign: 'center',
                          fontSize: 18,
                          fontWeight: 800,
                        }}
                      />
                      <span style={{ fontSize: 14, color: 'rgba(255, 255, 255, 0.8)', fontWeight: 700 }}>pts</span>
                    </div>
                  </div>
                );
              })}
            </div>

            <button
              ref={confirmBtnRef}
              onClick={handleSubmitRoundScores}
              disabled={!canConfirm}
              className="btn btn-success btn-lg"
              style={{
                width: '100%',
                opacity: canConfirm ? 1 : 0.45,
                cursor: canConfirm ? 'pointer' : 'not-allowed',
              }}
            >
              <CheckCircle size={20} /> Confirmar Puntuaciones de Ronda
            </button>
            {!canConfirm && (
              <p style={{ textAlign: 'center', marginTop: 10, fontSize: 13, color: 'var(--status-amber)' }}>
                ⚠️ Todos los jugadores deben tener puntos mayores a 0
              </p>
            )}
          </div>
        )}

        {/* STEP 3: Summary / Next Round Action */}
        {(step === 'summary' || isRoundAlreadyCompleted) && (
          <div style={{ textAlign: 'center' }}>
            <div
              style={{
                padding: 20,
                borderRadius: 'var(--radius-md)',
                background: 'rgba(53, 229, 138, 0.1)',
                border: '1px solid var(--status-green)',
                marginBottom: 24,
              }}
            >
              <h4 style={{ fontSize: 18, color: 'var(--status-green)', marginBottom: 6 }}>
                ¡Ronda {currentRound.number} Completada!
              </h4>
              <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
                Los puntajes han sido registrados. Todos los jugadores han sido reactivados.
              </p>
            </div>

            {game.currentRoundIndex < game.rounds.length - 1 ? (
              <button onClick={handleNextRoundAction} className="btn btn-primary btn-lg" style={{ width: '100%' }}>
                Iniciar Ronda {currentRound.number + 1} <ArrowRight size={20} />
              </button>
            ) : (
              <div style={{ padding: 16, background: 'rgba(155, 92, 255, 0.15)', borderRadius: 'var(--radius-md)' }}>
                <h4 style={{ fontSize: 20, color: 'var(--accent-purple)', marginBottom: 8 }}>
                  🏁 ¡Juego Completado!
                </h4>
                <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 16 }}>
                  Revisa la tabla de puntuación para ver al ganador final.
                </p>
                <button onClick={onClose} className="btn btn-secondary btn-lg" style={{ width: '100%' }}>
                  Ver Marcador Final
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
