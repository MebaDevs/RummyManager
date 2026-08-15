import React, { useEffect, useRef } from 'react';
import { Trophy, Star, Plus, Home } from 'lucide-react';
import { Game } from '../domain/models';
import { globalAudioNotifier } from '../infrastructure/audio/WebAudioNotifier';
import confetti from 'canvas-confetti';

interface GameFinishedModalProps {
  isOpen: boolean;
  game: Game;
  isGuest?: boolean;
  onNewGame: () => void;
  onGoHome: () => void;
}

export const GameFinishedModal: React.FC<GameFinishedModalProps> = ({
  isOpen,
  game,
  isGuest = false,
  onNewGame,
  onGoHome,
}) => {
  const confettiFired = useRef(false);

  // Calculate final rankings
  const totals: Record<string, number> = {};
  game.players.forEach((p) => { totals[p.id] = 0; });

  // Identify game_error rounds per player (to exclude timeout points)
  const gameErrorRoundsPerPlayer = new Set<string>();
  game.scores.forEach((sc) => {
    if (sc.source === 'game_error') gameErrorRoundsPerPlayer.add(`${sc.playerId}_r${sc.roundNumber}`);
  });

  game.scores.forEach((sc) => {
    if (totals[sc.playerId] !== undefined) {
      if (sc.source === 'timeout' && gameErrorRoundsPerPlayer.has(`${sc.playerId}_r${sc.roundNumber}`)) return;
      totals[sc.playerId] += sc.points;
    }
  });

  const rankings = game.players
    .map((p) => ({ player: p, totalPoints: totals[p.id] || 0 }))
    .sort((a, b) => a.totalPoints - b.totalPoints);

  const winner = rankings[0];
  const podiumMedals = ['🥇', '🥈', '🥉'];

  useEffect(() => {
    if (isOpen && !confettiFired.current) {
      confettiFired.current = true;
      globalAudioNotifier.playVictoryFanfare();
      // Fire confetti burst
      const fire = (particleRatio: number, opts: confetti.Options) => {
        confetti({ origin: { y: 0.6 }, ...opts, particleCount: Math.floor(200 * particleRatio) });
      };
      setTimeout(() => {
        fire(0.25, { spread: 26, startVelocity: 55 });
        fire(0.2, { spread: 60 });
        fire(0.35, { spread: 100, decay: 0.91, scalar: 0.8 });
        fire(0.1, { spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.2 });
        fire(0.1, { spread: 120, startVelocity: 45 });
      }, 200);
    }
    if (!isOpen) {
      confettiFired.current = false;
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.85)',
        backdropFilter: 'blur(12px)',
        zIndex: 500,
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
          padding: '36px 32px',
          background: '#0d121c',
          border: '1px solid rgba(155,92,255,0.4)',
          boxShadow: '0 0 60px rgba(155,92,255,0.2)',
          textAlign: 'center',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Background glow */}
        <div
          style={{
            position: 'absolute',
            top: '-40%',
            left: '50%',
            transform: 'translateX(-50%)',
            width: 400,
            height: 300,
            background: 'radial-gradient(circle, rgba(155,92,255,0.18) 0%, transparent 70%)',
            pointerEvents: 'none',
          }}
        />

        {/* Trophy Icon */}
        <div
          style={{
            width: 72,
            height: 72,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #ffc83d 0%, #ff8c00 100%)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 16,
            boxShadow: '0 0 32px rgba(255,200,61,0.5)',
          }}
        >
          <Trophy size={36} color="#000" />
        </div>

        {/* Title */}
        <h2
          className="font-display"
          style={{
            fontSize: 30,
            fontWeight: 900,
            marginBottom: 6,
            background: 'linear-gradient(135deg, #ffc83d, #ff8c00)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          ¡Partida Finalizada!
        </h2>

        {/* Winner */}
        <p style={{ color: 'var(--text-secondary)', marginBottom: 4, fontSize: 14 }}>
          Ganador de la Partida
        </p>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 12,
            padding: '12px 24px',
            borderRadius: 999,
            background: `linear-gradient(135deg, ${winner.player.avatarColor}22 0%, ${winner.player.avatarColor}44 100%)`,
            border: `1px solid ${winner.player.avatarColor}88`,
            marginBottom: 28,
          }}
        >
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: '50%',
              background: winner.player.avatarColor,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 900,
              color: '#000',
              fontSize: 18,
              boxShadow: `0 0 16px ${winner.player.avatarColor}`,
            }}
          >
            {winner.player.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: 22 }}>{winner.player.name}</div>
            <div className="font-mono" style={{ fontSize: 13, color: 'var(--text-muted)' }}>
              {winner.totalPoints} pts acumulados
            </div>
          </div>
          <Star size={20} color="#ffc83d" fill="#ffc83d" />
        </div>

        {/* Final Rankings (Solo para Host / Local) */}
        {!isGuest ? (
          <div
            style={{
              background: 'rgba(0,0,0,0.25)',
              borderRadius: 'var(--radius-md)',
              padding: '16px',
              marginBottom: 28,
              border: '1px solid var(--panel-border)',
            }}
          >
            <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 1 }}>
              Clasificación Final
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {rankings.map((r, idx) => (
                <div
                  key={r.player.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-sm)',
                    background: idx === 0 ? 'rgba(255,200,61,0.08)' : 'transparent',
                    border: idx === 0 ? '1px solid rgba(255,200,61,0.3)' : '1px solid transparent',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 18, width: 28, textAlign: 'center' }}>
                      {podiumMedals[idx] || `#${idx + 1}`}
                    </span>
                    <div
                      style={{
                        width: 26,
                        height: 26,
                        borderRadius: '50%',
                        background: r.player.avatarColor,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 800,
                        color: '#000',
                        fontSize: 11,
                      }}
                    >
                      {r.player.name.charAt(0).toUpperCase()}
                    </div>
                    <span style={{ fontWeight: idx === 0 ? 700 : 500, fontSize: 14 }}>{r.player.name}</span>
                  </div>
                  <span
                    className="font-mono"
                    style={{
                      fontSize: 13,
                      fontWeight: 700,
                      color: idx === 0 ? '#ffc83d' : 'var(--text-secondary)',
                    }}
                  >
                    {r.totalPoints} pts
                  </span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div
            style={{
              padding: '16px',
              borderRadius: 'var(--radius-md)',
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid var(--panel-border)',
              marginBottom: 28,
              fontSize: 14,
              color: 'var(--text-secondary)',
            }}
          >
            🏁 La partida ha concluido. ¡Gracias por participar!
          </div>
        )}

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: 12 }}>
          <button
            onClick={onGoHome}
            className="btn btn-secondary"
            style={{ flex: 1 }}
          >
            <Home size={18} /> Inicio
          </button>
          {!isGuest && (
            <button
              onClick={onNewGame}
              className="btn btn-primary"
              style={{ flex: 2 }}
            >
              <Plus size={18} /> Nueva Partida
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
