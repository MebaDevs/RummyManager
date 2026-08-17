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
import { CreateRoomModal } from '../components/CreateRoomModal';
import { JoinRoomModal } from '../components/JoinRoomModal';
import { Users, Trophy, Wifi } from 'lucide-react';

export const ActiveGamePage: React.FC = () => {
  const {
    activeGame,
    setActiveGame,
    updateGameState,
    quitCurrentGame,
    setCurrentPage,
    p2pRole,
    roomCode,
    connectedPeersCount,
    lobbyPlayers,
    createP2PRoom,
    joinP2PRoom,
    addLocalPlayerToLobby,
    removePlayerFromLobby,
    reorderLobbyPlayers,
    resetP2PGameToLobby,
    dispatchP2PAction,
  } = useGame();

  const [isScoreboardOpen, setIsScoreboardOpen] = useState(false);
  const [isRoundModalOpen, setIsRoundModalOpen] = useState(false);
  const [isReorderModalOpen, setIsReorderModalOpen] = useState(false);
  const [showErrorConfirmModal, setShowErrorConfirmModal] = useState(false);
  const [showQuitConfirmModal, setShowQuitConfirmModal] = useState(false);

  // P2P Modals
  const [isCreateRoomOpen, setIsCreateRoomOpen] = useState(false);
  const [isJoinRoomOpen, setIsJoinRoomOpen] = useState(false);

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
    removeScoreEntry,
    clearTimeoutPenalties,
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
      if (p2pRole !== 'guest') {
        const updated = timeoutTurn();
        updateGameState(updated);
      }
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
    if (p2pRole === 'guest') {
      dispatchP2PAction('FINISH_TURN');
      const updated = finishTurn();
      setActiveGame(updated);
    } else {
      const updated = finishTurn();
      updateGameState(updated);
    }
  };

  const handleTogglePause = () => {
    if (p2pRole === 'guest') {
      dispatchP2PAction('TOGGLE_PAUSE');
      const updated = togglePause();
      setActiveGame(updated);
    } else {
      const updated = togglePause();
      updateGameState(updated);
    }
  };

  const handleConfirmGameError = () => {
    setShowErrorConfirmModal(false);
    globalAudioNotifier.playGameErrorChime();
    if (p2pRole === 'guest') {
      dispatchP2PAction('REGISTER_ERROR', { targetPlayerId: activeTurnPlayerId });
      const updated = registerGameError(activeTurnPlayerId);
      setActiveGame(updated);
    } else {
      const updated = registerGameError(activeTurnPlayerId);
      updateGameState(updated);
    }
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
    if (game.status === 'playing') {
      if (p2pRole === 'guest') {
        dispatchP2PAction('TOGGLE_PAUSE');
      } else {
        const updated = togglePause();
        updateGameState(updated);
      }
    }
    setIsRoundModalOpen(true);
  };

  const handleFinishRoundAction = (winnerPlayerId: string, handPointsMap: Record<string, number>) => {
    scrollToTop();
    if (p2pRole === 'guest') {
      dispatchP2PAction('FINISH_ROUND', { winnerPlayerId, handPointsMap });
    } else {
      const updated = finishRound(winnerPlayerId, handPointsMap);
      updateGameState(updated);
    }
  };

  const handleStartNextRoundAction = () => {
    scrollToTop();
    if (p2pRole === 'guest') {
      dispatchP2PAction('START_NEXT_ROUND');
    } else {
      const updated = startNextRound();
      updateGameState(updated);
    }
  };

  const handleOpenP2PModal = async () => {
    if (p2pRole === 'host') {
      setIsCreateRoomOpen(true);
    } else if (p2pRole === 'guest') {
      setIsJoinRoomOpen(true);
    } else {
      // Create room as host
      try {
        await createP2PRoom();
        setIsCreateRoomOpen(true);
      } catch (err) {
        console.error('Error creating P2P room:', err);
      }
    }
  };

  return (
    <div
      className="active-game-container"
      style={{
        maxWidth: p2pRole === 'guest' ? 580 : 1280,
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
        p2pRole={p2pRole}
        roomCode={roomCode}
        connectedPeersCount={connectedPeersCount}
        onOpenP2PModal={handleOpenP2PModal}
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
          isGuest={p2pRole === 'guest'}
          onEndTurn={handleEndTurn}
          onTogglePause={handleTogglePause}
          onGameError={() => setShowErrorConfirmModal(true)}
        />
      </div>

      {/* Extra Actions Bar (Solo para Host / Local) */}
      {p2pRole !== 'guest' && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: 10, marginTop: 12, marginBottom: 16, flexWrap: 'wrap', width: '100%' }}>
          <button
            onClick={handleOpenDeclareWinner}
            className="btn btn-secondary"
            style={{ flex: '1 1 130px', padding: '10px 14px', borderRadius: 'var(--radius-md)', fontSize: 13 }}
          >
            <Trophy size={16} color="var(--status-amber)" /> Declarar Ganador
          </button>
          <button
            onClick={() => setIsReorderModalOpen(true)}
            className="btn btn-secondary"
            style={{ flex: '1 1 130px', padding: '10px 14px', borderRadius: 'var(--radius-md)', fontSize: 13 }}
          >
            <Users size={16} color="var(--accent-purple)" /> Reordenar Asientos
          </button>
          <button
            onClick={handleOpenP2PModal}
            className="btn btn-secondary"
            style={{
              flex: '1 1 130px',
              padding: '10px 14px',
              borderRadius: 'var(--radius-md)',
              fontSize: 13,
              borderColor: p2pRole !== 'none' ? 'var(--status-green)' : 'var(--panel-border)',
              color: p2pRole !== 'none' ? 'var(--status-green)' : '#fff',
            }}
          >
            <Wifi size={16} color={p2pRole !== 'none' ? 'var(--status-green)' : 'var(--status-amber)'} />
            {p2pRole === 'host' ? `Sala: ${roomCode}` : 'Conectar Móviles'}
          </button>
        </div>
      )}

      {/* 6. Panel Lateral Desplegable (Tabla de Puntuación - Right Drawer) (Solo Host / Local) */}
      {p2pRole !== 'guest' && (
        <ScoreboardDrawer
          game={game}
          isOpen={isScoreboardOpen}
          onClose={() => setIsScoreboardOpen(false)}
          onToggle={handleToggleScoreboard}
          onRemoveScoreEntry={(scoreId) => {
            const updated = removeScoreEntry(scoreId);
            updateGameState(updated);
          }}
          onClearTimeoutPenalties={(playerId) => {
            const updated = clearTimeoutPenalties(playerId);
            updateGameState(updated);
          }}
        />
      )}

      {/* Modal de Reordenamiento de Asientos de Jugadores */}
      <ReorderPlayersModal
        isOpen={isReorderModalOpen}
        players={game.players}
        onClose={() => setIsReorderModalOpen(false)}
        onSaveOrder={(newIds) => {
          if (p2pRole === 'guest') {
            dispatchP2PAction('REORDER_PLAYERS', { newOrderedIds: newIds });
          } else {
            const updated = reorderPlayers(newIds);
            updateGameState(updated);
          }
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
        isGuest={p2pRole === 'guest'}
        onNewGame={async () => {
          if (p2pRole === 'host') {
            await resetP2PGameToLobby();
            setIsCreateRoomOpen(true);
          } else {
            setCurrentPage('new_game');
          }
        }}
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

      {/* Modales de Sala Multidispositivo P2P */}
      <CreateRoomModal
        isOpen={isCreateRoomOpen}
        roomCode={roomCode}
        connectedCount={connectedPeersCount}
        lobbyPlayers={lobbyPlayers}
        isHost={p2pRole === 'host'}
        onClose={() => setIsCreateRoomOpen(false)}
        onAddLocalPlayer={addLocalPlayerToLobby}
        onRemovePlayer={removePlayerFromLobby}
        onReorderPlayers={reorderLobbyPlayers}
        onStartGame={() => setIsCreateRoomOpen(false)}
      />

      <JoinRoomModal
        isOpen={isJoinRoomOpen}
        onClose={() => setIsJoinRoomOpen(false)}
        onJoinRoom={async (code, name) => {
          await joinP2PRoom(code, name);
        }}
      />
    </div>
  );
};
