import React, { useState } from 'react';
import { useGame } from '../context/GameContext';
import { HeaderInfoStrip } from '../components/HeaderInfoStrip';
import { CentralTimerTable } from '../components/CentralTimerTable';
import { BottomToolbar } from '../components/BottomToolbar';
import { ScoreboardDrawer } from '../components/ScoreboardDrawer';
import { RoundSummaryModal } from '../components/RoundSummaryModal';
import { usePreciseTimer } from '../hooks/usePreciseTimer';
import { globalAudioNotifier } from '../infrastructure/audio/WebAudioNotifier';
import { useRummyEngine } from '../hooks/useRummyEngine';

export const ActiveGamePage: React.FC = () => {
  const { activeGame, updateGameState, setCurrentPage } = useGame();
  const [isScoreboardOpen, setIsScoreboardOpen] = useState(false);
  const [isRoundModalOpen, setIsRoundModalOpen] = useState(false);

  // Hook connecting pure TS GameEngine with React state
  const {
    game,
    finishTurn,
    timeoutTurn,
    registerGameError,
    togglePause,
    finishRound,
    startNextRound,
  } = useRummyEngine(activeGame);

  // Keep global audio notification settings synced
  globalAudioNotifier.setEnabled(game.settings.soundEnabled);

  // High precision timestamp timer hook
  const timerState = usePreciseTimer({
    currentTurn: game.currentTurn,
    timeLimitSeconds: game.settings.turnTimeLimitSeconds,
    warningSeconds: game.settings.warningSeconds,
    soundEnabled: game.settings.soundEnabled,
    playWarningSound: () => globalAudioNotifier.playWarningBeep(),
    playTimeoutSound: () => globalAudioNotifier.playTimeoutBuzzer(),
    onTimeout: () => {
      const updated = timeoutTurn();
      updateGameState(updated);
    },
  });

  if (!activeGame) {
    return (
      <div style={{ maxWidth: 600, margin: '80px auto', textAlign: 'center', padding: 32 }}>
        <h2 style={{ fontSize: 28, marginBottom: 12 }} className="font-display">
          No hay ninguna partida activa
        </h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: 28 }}>
          Crea una nueva partida para comenzar a gestionar el tiempo y la puntuación de tus jugadores.
        </p>
        <button onClick={() => setCurrentPage('new_game')} className="btn btn-primary btn-lg">
          Crear Nueva Partida
        </button>
      </div>
    );
  }

  const activeTurnPlayerId = game.currentTurn?.playerId || game.players[0]?.id || '';

  const handleToggleScoreboard = () => {
    setIsScoreboardOpen(!isScoreboardOpen);
  };

  const handleEndTurn = () => {
    globalAudioNotifier.playTick();
    const updated = finishTurn();
    updateGameState(updated);
  };

  const handleTogglePause = () => {
    const updated = togglePause();
    updateGameState(updated);
  };

  const handleGameError = () => {
    globalAudioNotifier.playGameErrorChime();
    const updated = registerGameError(activeTurnPlayerId);
    updateGameState(updated);
  };

  const handleFinishRoundAction = (winnerPlayerId: string, handPointsMap: Record<string, number>) => {
    const updated = finishRound(winnerPlayerId, handPointsMap);
    updateGameState(updated);
  };

  const handleStartNextRoundAction = () => {
    const updated = startNextRound();
    updateGameState(updated);
  };

  return (
    <div
      style={{
        maxWidth: 1280,
        margin: '0 auto',
        padding: '24px 24px 40px 24px',
        position: 'relative',
      }}
    >
      {/* 3. Encabezado Superior de Partida (Header Info Strip) */}
      <HeaderInfoStrip
        game={game}
        isScoreboardOpen={isScoreboardOpen}
        onToggleScoreboard={handleToggleScoreboard}
      />

      {/* 4. Mesa Central de Juego (Área Principal con Temporizador SVG) */}
      <CentralTimerTable
        players={game.players}
        activePlayerId={activeTurnPlayerId}
        timerState={timerState}
      />

      {/* 5. Barra Inferior de Botones de Acción (Bottom Control Toolbar) */}
      <BottomToolbar
        isPaused={timerState.isPaused}
        onEndTurn={handleEndTurn}
        onTogglePause={handleTogglePause}
        onGameError={handleGameError}
      />

      {/* Extra Round Completion Action */}
      <div style={{ textAlign: 'center', marginTop: 12 }}>
        <button
          onClick={() => setIsRoundModalOpen(true)}
          className="btn btn-secondary btn-sm"
          style={{ borderRadius: 999 }}
        >
          🏆 Declarar Ganador de Ronda
        </button>
      </div>

      {/* 6. Panel Lateral Desplegable (Tabla de Puntuación - Right Drawer) */}
      <ScoreboardDrawer
        game={game}
        isOpen={isScoreboardOpen}
        onClose={() => setIsScoreboardOpen(false)}
        onToggle={handleToggleScoreboard}
      />

      {/* Modal de Cierre de Ronda */}
      <RoundSummaryModal
        game={game}
        isOpen={isRoundModalOpen}
        onClose={() => setIsRoundModalOpen(false)}
        onFinishRound={handleFinishRoundAction}
        onStartNextRound={handleStartNextRoundAction}
      />
    </div>
  );
};
