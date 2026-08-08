import React, { useState } from 'react';
import { Trophy, CheckCircle, ArrowRight, X } from 'lucide-react';
import { Game } from '../domain/models';
import confetti from 'canvas-confetti';
import { globalAudioNotifier } from '../infrastructure/audio/WebAudioNotifier';

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
  const [handPoints, setHandPoints] = useState<Record<string, number>>({});
  const [step, setStep] = useState<'select_winner' | 'enter_points' | 'summary'>('select_winner');

  if (!isOpen || !currentRound) return null;

  const activePlayers = game.players;
  const isRoundAlreadyCompleted = currentRound.status === 'completed';

  const handleSelectWinner = (pid: string) => {
    setWinnerId(pid);
    setStep('enter_points');

    // Initialize hand points for non-winner players
    const initialPoints: Record<string, number> = {};
    activePlayers.forEach((p) => {
      if (p.id !== pid) {
        initialPoints[p.id] = 0;
      }
    });
    setHandPoints(initialPoints);
  };

  const handlePointChange = (pid: string, val: number) => {
    setHandPoints({
      ...handPoints,
      [pid]: Math.max(0, val),
    });
  };

  const handleSubmitRoundScores = () => {
    globalAudioNotifier.playVictoryFanfare();
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
    });

    onFinishRound(winnerId, handPoints);
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
          <h3 style={{ fontSize: 24, fontWeight: 800 }} className="font-display">
            Cierre de Ronda {currentRound.number}
          </h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
            {currentRound.objective.name}
          </p>
        </div>

        {/* STEP 1: Select Winner */}
        {step === 'select_winner' && !isRoundAlreadyCompleted && (
          <div>
            <h4 style={{ fontSize: 16, marginBottom: 14, color: 'var(--text-primary)' }}>
              ¿Quién ganó la ronda? (Bajó todas sus cartas)
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
              {activePlayers.map((p) => {
                const isOut = currentRound.playerStates[p.id]?.status === 'out_by_error';
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
                      background: winnerId === p.id ? 'rgba(53, 229, 138, 0.15)' : 'rgba(255,255,255,0.03)',
                      border: winnerId === p.id ? '1px solid var(--status-green)' : '1px solid var(--panel-border)',
                      cursor: isOut ? 'not-allowed' : 'pointer',
                      opacity: isOut ? 0.5 : 1,
                      textAlign: 'left',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: '50%',
                          background: p.avatarColor,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#000',
                          fontWeight: 800,
                        }}
                      >
                        {p.name.charAt(0)}
                      </div>
                      <span style={{ fontWeight: 600, fontSize: 15 }}>{p.name}</span>
                    </div>

                    {isOut ? (
                      <span className="badge badge-red">FUERA (+150)</span>
                    ) : (
                      <span className="badge badge-green">Ganador (+0 pts)</span>
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
            <h4 style={{ fontSize: 16, marginBottom: 6 }}>Puntos de cartas retenidas</h4>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 20 }}>
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
                        padding: '12px 16px',
                        borderRadius: 'var(--radius-md)',
                        background: 'rgba(53, 229, 138, 0.1)',
                        border: '1px solid var(--status-green)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}
                    >
                      <span style={{ fontWeight: 700 }}>🏆 {p.name} (Ganador)</span>
                      <span className="font-mono" style={{ fontWeight: 800, color: 'var(--status-green)' }}>
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
                        padding: '12px 16px',
                        borderRadius: 'var(--radius-md)',
                        background: 'rgba(255, 83, 101, 0.1)',
                        border: '1px solid var(--status-red)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}
                    >
                      <span>⚠️ {p.name} (Error de juego)</span>
                      <span className="font-mono" style={{ fontWeight: 800, color: 'var(--status-red)' }}>
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
                      background: 'rgba(255,255,255,0.03)',
                      border: '1px solid var(--panel-border)',
                    }}
                  >
                    <span style={{ fontWeight: 600 }}>{p.name}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <input
                        type="number"
                        min="0"
                        max="500"
                        value={handPoints[p.id] ?? 0}
                        onChange={(e) => handlePointChange(p.id, Number(e.target.value))}
                        style={{
                          width: 80,
                          padding: '8px 12px',
                          borderRadius: 'var(--radius-sm)',
                          background: 'rgba(0,0,0,0.5)',
                          border: '1px solid var(--panel-border)',
                          color: '#fff',
                          textAlign: 'center',
                          fontSize: 16,
                          fontWeight: 700,
                        }}
                      />
                      <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>pts</span>
                    </div>
                  </div>
                );
              })}
            </div>

            <button onClick={handleSubmitRoundScores} className="btn btn-success btn-lg" style={{ width: '100%' }}>
              <CheckCircle size={20} /> Confirmar Puntuaciones de Ronda
            </button>
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
