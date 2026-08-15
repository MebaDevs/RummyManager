import React, { useState } from 'react';
import { useGame } from '../context/GameContext';
import { HeaderInfoStrip } from '../components/HeaderInfoStrip';
import { CentralTimerTable } from '../components/CentralTimerTable';
import { BottomToolbar } from '../components/BottomToolbar';
import { ScoreboardDrawer } from '../components/ScoreboardDrawer';
import { RoundSummaryModal } from '../components/RoundSummaryModal';
import { ConfirmationModal } from '../components/ConfirmationModal';
import { ReorderPlayersModal } from '../components/ReorderPlayersModal';
import { GameFinishedModal } from '../components/GameFinishedModal';
import { usePreciseTimer } from '../hooks/usePreciseTimer';
import { globalAudioNotifier } from '../infrastructure/audio/WebAudioNotifier';
import { useRummyEngine } from '../hooks/useRummyEngine';
import { Users, Trophy } from 'lucide-react';

export const ActiveGamePage: React.FC = () => {
  const { activeGame, updateGameState, quitCurrentGame, setCurrentPage } = useGame();
  const [isScoreboardOpen, setIsScoreboardOpen] = useState(false);
  const [isRoundModalOpen, setIsRoundModalOpen] = useState(false);
  const [isReorderModalOpen, setIsReorderModalOpen] = useState(false);
  const [showErrorConfirmModal, setShowErrorConfirmModal] = useState(false);
  const [showQuitConfirmModal, setShowQuitConfirmModal] = useState(false);

  // Hook connecting pure TS GameEngine with React state
  const {
    game,
    finishTurn,
    timeoutTurn,
    registerGameError,
    togglePause,
    finishRound,
    startNextRound,
    reorderPlayers,
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
  const activeTurnPlayer = game.players.find((p) => p.id === activeTurnPlayerId);

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

  const handleConfirmGameError = () => {
    setShowErrorConfirmModal(false);
    globalAudioNotifier.playGameErrorChime();
    const updated = registerGameError(activeTurnPlayerId);
    updateGameState(updated);
  };

  const handleConfirmQuitMatch = async () => {
    setShowQuitConfirmModal(false);
    await quitCurrentGame();
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  };

  const handleOpenDeclareWinner = () => {
    scrollToTop();
    // Auto-pause the timer while scores are being entered
    if (game.status === 'playing') {
      const updated = togglePause();
      updateGameState(updated);
    }
    setIsRoundModalOpen(true);
  };

  const handleFinishRoundAction = (winnerPlayerId: string, handPointsMap: Record<string, number>) => {
    scrollToTop();
    const updated = finishRound(winnerPlayerId, handPointsMap);
    updateGameState(updated);
  };

  const handleStartNextRoundAction = () => {
    scrollToTop();
    const updated = startNextRound();
    updateGameState(updated);
  };

  return (
    <div
      className="active-game-container"
      style={{
        maxWidth: 1280,
        margin: '0 auto',
        padding: '16px 16px 32px 16px',
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
        game={game}
        players={game.players}
        activePlayerId={activeTurnPlayerId}
        timerState={timerState}
      />

      {/* 5. Barra Inferior de Botones de Acción (Bottom Control Toolbar) */}
      <div className="bottom-toolbar-container">
        <BottomToolbar
          isPaused={timerState.isPaused}
          onEndTurn={handleEndTurn}
          onTogglePause={handleTogglePause}
          onGameError={() => setShowErrorConfirmModal(true)}
        />
      </div>

      {/* Extra Actions Bar (Round Winner & Reorder Players) */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: 10, marginTop: 12, marginBottom: 16, flexWrap: 'wrap', width: '100%' }}>
        <button
          onClick={handleOpenDeclareWinner}
          className="btn btn-secondary"
          style={{ flex: '1 1 140px', padding: '10px 14px', borderRadius: 'var(--radius-md)', fontSize: 13 }}
        >
          <Trophy size={16} color="var(--status-amber)" /> Declarar Ganador
        </button>
        <button
          onClick={() => setIsReorderModalOpen(true)}
          className="btn btn-secondary"
          style={{ flex: '1 1 140px', padding: '10px 14px', borderRadius: 'var(--radius-md)', fontSize: 13 }}
        >
          <Users size={16} color="var(--accent-purple)" /> Reordenar Asientos
        </button>
      </div>

      {/* 6. Panel Lateral Desplegable (Tabla de Puntuación - Right Drawer) */}
      <ScoreboardDrawer
        game={game}
        isOpen={isScoreboardOpen}
        onClose={() => setIsScoreboardOpen(false)}
        onToggle={handleToggleScoreboard}
      />

      {/* Modal de Reordenamiento de Asientos de Jugadores */}
      <ReorderPlayersModal
        isOpen={isReorderModalOpen}
        players={game.players}
        onClose={() => setIsReorderModalOpen(false)}
        onSaveOrder={(newIds) => {
          const updated = reorderPlayers(newIds);
          updateGameState(updated);
        }}
      />

      {/* Modal de Cierre de Ronda */}
      <RoundSummaryModal
        game={game}
        isOpen={isRoundModalOpen}
        onClose={() => setIsRoundModalOpen(false)}
        onFinishRound={handleFinishRoundAction}
        onStartNextRound={handleStartNextRoundAction}
      />

      {/* Modal de Partida Finalizada */}
      <GameFinishedModal
        isOpen={game.status === 'finished'}
        game={game}
        onNewGame={() => setCurrentPage('new_game')}
        onGoHome={() => setCurrentPage('home')}
      />

      {/* Confirmation Modal for +150 Game Error */}
      <ConfirmationModal
        isOpen={showErrorConfirmModal}
        title="⚠️ Sanción Error de Juego (+150 pts)"
        message={`¿Confirmas aplicar +150 puntos de penalización a "${activeTurnPlayer?.name || 'Jugador'}" y sacarlo de la ronda actual?`}
        confirmText="Aplicar +150 y Excluir"
        cancelText="Cancelar"
        isDanger={true}
        onConfirm={handleConfirmGameError}
        onCancel={() => setShowErrorConfirmModal(false)}
      />

      {/* Confirmation Modal for Quitting Match */}
      <ConfirmationModal
        isOpen={showQuitConfirmModal}
        title="Finalizar Partida Actual"
        message="¿Estás seguro de que deseas abandonar la partida en curso? Toda la puntuación acumulada se guardará en el historial."
        confirmText="Finalizar Partida"
        cancelText="Volver al juego"
        isDanger={true}
        onConfirm={handleConfirmQuitMatch}
        onCancel={() => setShowQuitConfirmModal(false)}
      />
    </div>
  );
};
