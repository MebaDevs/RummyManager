import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Game, GameSettings, Player, RoundObjective } from '../domain/models';
import { DEFAULT_GAME_SETTINGS } from '../domain/rules/defaultRounds';
import { LocalGameRepository } from '../repository/LocalGameRepository';
import { IGameRepository } from '../repository/IGameRepository';
import { RummyEngine } from '../domain/engine/RummyEngine';

export type PageView = 'home' | 'new_game' | 'active_game' | 'history' | 'settings';

export type PeerRole = 'host' | 'guest' | 'none';

interface GameContextType {
  currentPage: PageView;
  setCurrentPage: (page: PageView) => void;
  activeGame: Game | null;
  setActiveGame: (game: Game | null) => void;
  globalSettings: GameSettings;
  updateGlobalSettings: (settings: GameSettings) => void;
  repository: IGameRepository;
  engine: RummyEngine;
  loadActiveGame: () => Promise<void>;
  createNewGame: (players: Player[], settings: GameSettings, customRounds?: RoundObjective[]) => Promise<Game>;
  updateGameState: (updatedGame: Game) => Promise<void>;
  quitCurrentGame: () => Promise<void>;
  // P2P Fields and Methods
  p2pRole: PeerRole;
  roomCode: string;
  connectedPeersCount: number;
  lobbyPlayers: Player[];
  createP2PRoom: (customCode?: string) => Promise<string>;
  joinP2PRoom: (code: string, playerName: string) => Promise<void>;
  leaveP2PRoom: () => void;
  addLocalPlayerToLobby: (name: string) => void;
  removePlayerFromLobby: (playerId: string) => void;
  reorderLobbyPlayers: (newOrderedIds: string[]) => void;
  startP2PGameFromLobby: (settings?: GameSettings, customRounds?: RoundObjective[]) => Promise<Game>;
  resetP2PGameToLobby: () => Promise<void>;
  dispatchP2PAction: (type: import('../infrastructure/p2p/PeerRoomService').PeerActionType, payload?: any) => void;
}

import { globalPeerRoomService, PeerActionType } from '../infrastructure/p2p/PeerRoomService';

const repository = new LocalGameRepository();
const engine = new RummyEngine();

const GameContext = createContext<GameContextType | undefined>(undefined);

export const GameProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentPage, setCurrentPageRaw] = useState<PageView>('home');
  const [activeGame, setActiveGameRaw] = useState<Game | null>(null);
  const activeGameRef = React.useRef<Game | null>(activeGame);
  const [globalSettings, setGlobalSettings] = useState<GameSettings>(DEFAULT_GAME_SETTINGS);

  const setActiveGame = (game: Game | null) => {
    activeGameRef.current = game;
    setActiveGameRaw(game);
  };

  // Helper to read initial P2P session synchronously on mount
  const getInitialP2PSession = () => {
    try {
      const saved = localStorage.getItem('rummy_p2p_session');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return null;
  };

  const initialSession = getInitialP2PSession();

  // P2P Room & Lobby State
  const [p2pRole, setP2pRole] = useState<PeerRole>(initialSession?.role || 'none');
  const [roomCode, setRoomCode] = useState<string>(initialSession?.roomCode || '');
  const [connectedPeersCount, setConnectedPeersCount] = useState<number>(0);
  const [lobbyPlayers, setLobbyPlayersRaw] = useState<Player[]>([]);
  const lobbyPlayersRef = React.useRef<Player[]>(lobbyPlayers);

  const setLobbyPlayers: React.Dispatch<React.SetStateAction<Player[]>> = (action) => {
    setLobbyPlayersRaw((prev) => {
      const next = typeof action === 'function' ? action(prev) : action;
      lobbyPlayersRef.current = next;
      return next;
    });
  };

  // Avatar color palette for players
  const avatarColors = ['#9b5cff', '#35e58a', '#ffc83d', '#ff5365', '#48a7ff', '#ff943d'];

  const setCurrentPage = (page: PageView, pushHistory = true) => {
    setCurrentPageRaw(page);
    if (pushHistory && window.history.state?.page !== page) {
      window.history.pushState({ page }, '');
    }
  };

  useEffect(() => {
    loadActiveGame();

    const handlePopStatePage = (e: PopStateEvent) => {
      if (e.state?.page) {
        setCurrentPageRaw(e.state.page);
      } else if (!e.state?.modalOpen) {
        setCurrentPageRaw('home');
      }
    };

    window.addEventListener('popstate', handlePopStatePage);
    return () => window.removeEventListener('popstate', handlePopStatePage);
  }, []);

  const loadActiveGame = async () => {
    const existing = await repository.getActiveGame();
    if (existing) {
      setActiveGame(existing);
    }
  };

  const updateGlobalSettings = (newSettings: GameSettings) => {
    setGlobalSettings(newSettings);
    localStorage.setItem('rummy_global_settings', JSON.stringify(newSettings));
  };

  const updateGameState = async (updatedGame: Game) => {
    setActiveGame(updatedGame);
    await repository.saveGame(updatedGame);

    // If host, broadcast state to all connected guests
    if (globalPeerRoomService.getRole() === 'host') {
      globalPeerRoomService.broadcastState(updatedGame);
    }
  };

  const createNewGame = async (
    players: Player[],
    settings: GameSettings,
    customRounds?: RoundObjective[]
  ): Promise<Game> => {
    const freshEngine = new RummyEngine();
    freshEngine.initializeGame(players, settings, customRounds);
    const startedGame = freshEngine.startGame();

    await repository.saveGame(startedGame);
    setActiveGame(startedGame);
    setCurrentPage('active_game');

    // If host, broadcast new game to all guests
    if (globalPeerRoomService.getRole() === 'host') {
      globalPeerRoomService.broadcastState(startedGame);
    }

    return startedGame;
  };

  const quitCurrentGame = async () => {
    if (activeGame) {
      const updatedGame: Game = {
        ...activeGame,
        status: 'finished',
        updatedAt: new Date().toISOString(),
      };
      await repository.saveGame(updatedGame);
      if (globalPeerRoomService.getRole() === 'host') {
        globalPeerRoomService.broadcastState(updatedGame);
      }
    }
    await repository.clearActiveGame();
    setActiveGame(null);
    leaveP2PRoom();
  };

  // --- P2P ROOM & LOBBY METHODS ---

  const P2P_SESSION_KEY = 'rummy_p2p_session';

  const saveP2PSession = (role: PeerRole, code: string, playerName?: string) => {
    localStorage.setItem(P2P_SESSION_KEY, JSON.stringify({ role, roomCode: code, playerName }));
  };

  const clearP2PSession = () => {
    localStorage.removeItem(P2P_SESSION_KEY);
  };

  // Auto-reconnect to P2P room if page was reloaded or closed
  useEffect(() => {
    const saved = localStorage.getItem(P2P_SESSION_KEY);
    if (saved) {
      try {
        const session = JSON.parse(saved);
        if (session.role === 'host' && session.roomCode) {
          createP2PRoom(session.roomCode).catch((err) => {
            console.warn('[P2P Restore] Host room restore attempt warning:', err);
          });
        } else if (session.role === 'guest' && session.roomCode && session.playerName) {
          joinP2PRoom(session.roomCode, session.playerName).catch((err) => {
            console.warn('[P2P Restore] Guest room rejoin attempt warning:', err);
          });
        }
      } catch (err) {
        console.error('[P2P Restore] Error parsing saved P2P session:', err);
      }
    }
  }, []);

  const createP2PRoom = async (customCode?: string): Promise<string> => {
    const code = customCode || globalPeerRoomService.constructor.prototype.constructor.generateRoomCode();

    const createdCode = await globalPeerRoomService.createRoom(code, {
      onGuestJoinLobby: (guest) => {
        // Host receives a guest joining the lobby
        setLobbyPlayers((prev) => {
          const existingIdx = prev.findIndex(
            (p) => p.peerId === guest.peerId || p.name.toLowerCase() === guest.name.toLowerCase()
          );
          let updatedList: Player[];
          if (existingIdx !== -1) {
            updatedList = [...prev];
            updatedList[existingIdx] = {
              ...updatedList[existingIdx],
              peerId: guest.peerId,
            };
          } else {
            const newPlayer: Player = {
              id: `p_p2p_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
              name: guest.name.trim(),
              avatarColor: guest.color || avatarColors[prev.length % avatarColors.length],
              isInitialPlayer: prev.length === 0,
              peerId: guest.peerId,
            };
            updatedList = [...prev, newPlayer];
          }

          globalPeerRoomService.broadcastLobbyState({
            lobbyPlayers: updatedList,
            isGameStarted: !!activeGameRef.current && activeGameRef.current.status !== 'finished',
          });
          return updatedList;
        });
      },
      onGuestDisconnect: (peerId) => {
        if (!activeGameRef.current || activeGameRef.current.status === 'setup') {
          setLobbyPlayers((prev) => {
            const updatedList = prev.filter((p) => p.peerId !== peerId);
            globalPeerRoomService.broadcastLobbyState({
              lobbyPlayers: updatedList,
              isGameStarted: false,
            });
            return updatedList;
          });
        }
      },
      onGuestConnect: (conn) => {
        const currentGame = activeGameRef.current;
        if (currentGame) {
          conn.send({
            type: 'STATE_UPDATE',
            game: currentGame,
            hostNow: Date.now(),
          });
        } else {
          conn.send({
            type: 'LOBBY_STATE',
            lobbyInfo: {
              lobbyPlayers: lobbyPlayersRef.current,
              isGameStarted: false,
            },
          });
        }
      },
      onGuestAction: (action, senderPlayerId) => {
        const currentGame = activeGameRef.current;
        if (!currentGame) return;
        const currentEngine = new RummyEngine(currentGame);
        let updated: Game | null = null;

        switch (action.type) {
          case 'FINISH_TURN':
            updated = currentEngine.finishTurn();
            break;
          case 'TOGGLE_PAUSE':
            updated = currentEngine.togglePause();
            break;
          case 'REGISTER_ERROR':
            updated = currentEngine.registerGameError(action.payload?.targetPlayerId || senderPlayerId);
            break;
          case 'FINISH_ROUND':
            updated = currentEngine.finishRound(action.payload.winnerPlayerId, action.payload.handPointsMap);
            break;
          case 'START_NEXT_ROUND':
            updated = currentEngine.startNextRound();
            break;
          case 'REORDER_PLAYERS':
            updated = currentEngine.reorderPlayers(action.payload.newOrderedIds);
            break;
          case 'TIMEOUT_TURN':
            updated = currentEngine.timeoutTurn();
            break;
        }

        if (updated) {
          updateGameState(updated);
        }
      },
      onConnectionChange: (count) => {
        setConnectedPeersCount(count);
      },
    });

    setP2pRole('host');
    setRoomCode(createdCode);
    saveP2PSession('host', createdCode);

    return createdCode;
  };

  const joinP2PRoom = async (code: string, playerName: string): Promise<void> => {
    await globalPeerRoomService.joinRoom(
      code,
      {
        onLobbyUpdate: (lobbyInfo) => {
          setLobbyPlayers(lobbyInfo.lobbyPlayers);
          if (!lobbyInfo.isGameStarted) {
            setActiveGame(null);
          }
        },
        onStateUpdate: (remoteGame) => {
          setActiveGame(remoteGame);
          setCurrentPage('active_game', false);
        },
        onConnectionChange: (count) => {
          setConnectedPeersCount(count);
        },
      },
      playerName
    );

    setP2pRole('guest');
    setRoomCode(code.toUpperCase());
    saveP2PSession('guest', code.toUpperCase(), playerName);

    // Send player name to host
    globalPeerRoomService.sendJoinLobby(playerName);
  };

  const addLocalPlayerToLobby = (name: string) => {
    if (!name.trim()) return;
    setLobbyPlayers((prev) => {
      const newPlayer: Player = {
        id: `p_local_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        name: name.trim(),
        avatarColor: avatarColors[prev.length % avatarColors.length],
        isInitialPlayer: prev.length === 0,
      };
      const updated = [...prev, newPlayer];
      if (globalPeerRoomService.getRole() === 'host') {
        globalPeerRoomService.broadcastLobbyState({
          lobbyPlayers: updated,
          isGameStarted: !!activeGame && activeGame.status !== 'finished',
        });
      }
      return updated;
    });
  };

  const removePlayerFromLobby = (playerId: string) => {
    setLobbyPlayers((prev) => {
      const updated = prev.filter((p) => p.id !== playerId);
      if (globalPeerRoomService.getRole() === 'host') {
        globalPeerRoomService.broadcastLobbyState({
          lobbyPlayers: updated,
          isGameStarted: !!activeGame && activeGame.status !== 'finished',
        });
      }
      return updated;
    });
  };

  const reorderLobbyPlayers = (newOrderedIds: string[]) => {
    setLobbyPlayers((prev) => {
      const map = new Map(prev.map((p) => [p.id, p]));
      const reordered: Player[] = [];
      newOrderedIds.forEach((id) => {
        const p = map.get(id);
        if (p) reordered.push(p);
      });
      // Add any missing
      prev.forEach((p) => {
        if (!newOrderedIds.includes(p.id)) reordered.push(p);
      });
      if (globalPeerRoomService.getRole() === 'host') {
        globalPeerRoomService.broadcastLobbyState({
          lobbyPlayers: reordered,
          isGameStarted: !!activeGame && activeGame.status !== 'finished',
        });
      }
      return reordered;
    });
  };

  const startP2PGameFromLobby = async (
    settings?: GameSettings,
    customRounds?: RoundObjective[]
  ): Promise<Game> => {
    if (lobbyPlayers.length < 2) {
      throw new Error('Se requieren al menos 2 jugadores para iniciar la partida.');
    }
    const finalSettings = settings || globalSettings;
    const game = await createNewGame(lobbyPlayers, finalSettings, customRounds);
    return game;
  };

  const resetP2PGameToLobby = async () => {
    await repository.clearActiveGame();
    setActiveGame(null);
    if (globalPeerRoomService.getRole() === 'host') {
      globalPeerRoomService.broadcastLobbyState({
        lobbyPlayers: lobbyPlayersRef.current,
        isGameStarted: false,
      });
    }
  };

  const leaveP2PRoom = () => {
    if (p2pRole === 'guest') {
      globalPeerRoomService.sendLeaveLobby();
    }
    globalPeerRoomService.destroy();
    setP2pRole('none');
    setRoomCode('');
    setConnectedPeersCount(0);
    setLobbyPlayers([]);
    clearP2PSession();
    setCurrentPage('home');
  };

  const dispatchP2PAction = (type: PeerActionType, payload?: any) => {
    if (p2pRole === 'guest') {
      globalPeerRoomService.sendActionToHost(type, payload);
    }
  };

  return (
    <GameContext.Provider
      value={{
        currentPage,
        setCurrentPage,
        activeGame,
        setActiveGame,
        globalSettings,
        updateGlobalSettings,
        repository,
        engine,
        loadActiveGame,
        createNewGame,
        updateGameState,
        quitCurrentGame,
        p2pRole,
        roomCode,
        connectedPeersCount,
        lobbyPlayers,
        createP2PRoom,
        joinP2PRoom,
        leaveP2PRoom,
        addLocalPlayerToLobby,
        removePlayerFromLobby,
        reorderLobbyPlayers,
        startP2PGameFromLobby,
        resetP2PGameToLobby,
        dispatchP2PAction,
      }}
    >
      {children}
    </GameContext.Provider>
  );
};

export const useGame = (): GameContextType => {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
};
