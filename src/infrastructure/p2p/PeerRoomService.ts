import { Game, Player } from '../../domain/models';

export type PeerRole = 'host' | 'guest' | 'none';

export type PeerActionType =
  | 'FINISH_TURN'
  | 'TOGGLE_PAUSE'
  | 'REGISTER_ERROR'
  | 'FINISH_ROUND'
  | 'START_NEXT_ROUND'
  | 'REORDER_PLAYERS'
  | 'TIMEOUT_TURN';

export interface LobbyInfo {
  lobbyPlayers: Player[];
  isGameStarted: boolean;
}

export interface PeerMessage {
  type: 'STATE_UPDATE' | 'ACTION' | 'HEARTBEAT' | 'JOIN_INFO' | 'JOIN_LOBBY' | 'LEAVE_LOBBY' | 'LOBBY_STATE';
  game?: Game;
  hostNow?: number;
  lobbyInfo?: LobbyInfo;
  joinPlayerName?: string;
  joinPlayerColor?: string;
  action?: {
    type: PeerActionType;
    payload?: any;
  };
  senderPlayerId?: string;
  senderName?: string;
}

export type StateUpdateCallback = (game: Game) => void;
export type LobbyUpdateCallback = (lobbyInfo: LobbyInfo) => void;
export type GuestJoinLobbyCallback = (player: { name: string; color?: string; peerId: string }) => void;
export type GuestConnectCallback = (conn: DataConnection) => void;
export type GuestDisconnectCallback = (peerId: string) => void;
export type ActionCallback = (action: { type: PeerActionType; payload?: any }, senderPlayerId?: string) => void;
export type ConnectionStatusCallback = (connectedCount: number, peers: string[]) => void;

import Peer, { DataConnection } from 'peerjs';

const PEER_PREFIX = 'rummy_room_v1_';

export class PeerRoomService {
  private peer: Peer | null = null;
  private role: PeerRole = 'none';
  private roomCode: string = '';
  private guestConnection: DataConnection | null = null;
  private hostConnections: Map<string, DataConnection> = new Map();
  private onStateUpdate: StateUpdateCallback | null = null;
  private onLobbyUpdate: LobbyUpdateCallback | null = null;
  private onGuestJoinLobby: GuestJoinLobbyCallback | null = null;
  private onGuestConnect: GuestConnectCallback | null = null;
  private onGuestDisconnect: GuestDisconnectCallback | null = null;
  private onGuestAction: ActionCallback | null = null;
  private onConnectionChange: ConnectionStatusCallback | null = null;
  private heartbeatTimer: any = null;
  private reconnectTimer: any = null;
  private isReconnecting: boolean = false;
  private clockOffset: number = 0;

  public getRole(): PeerRole {
    return this.role;
  }

  public getRoomCode(): string {
    return this.roomCode;
  }

  public getClockOffset(): number {
    return this.clockOffset;
  }

  public isConnected(): boolean {
    if (this.role === 'host') return !!this.peer && !this.peer.disconnected;
    if (this.role === 'guest') return !!this.guestConnection && this.guestConnection.open;
    return false;
  }

  /**
   * Helper to generate a friendly 4-digit code (e.g. "4829")
   */
  public static generateRoomCode(): string {
    return Math.floor(1000 + Math.random() * 9000).toString();
  }

  /**
   * Host creates a room using a code (or generates one)
   */
  public async createRoom(
    code: string,
    callbacks: {
      onGuestAction: ActionCallback;
      onGuestJoinLobby?: GuestJoinLobbyCallback;
      onGuestConnect?: GuestConnectCallback;
      onGuestDisconnect?: GuestDisconnectCallback;
      onConnectionChange: ConnectionStatusCallback;
    }
  ): Promise<string> {
    this.destroy();

    this.role = 'host';
    this.roomCode = code.toUpperCase().trim();
    this.onGuestAction = callbacks.onGuestAction;
    this.onGuestJoinLobby = callbacks.onGuestJoinLobby || null;
    this.onGuestConnect = callbacks.onGuestConnect || null;
    this.onGuestDisconnect = callbacks.onGuestDisconnect || null;
    this.onConnectionChange = callbacks.onConnectionChange;

    const peerId = `${PEER_PREFIX}${this.roomCode}`;

    return new Promise((resolve, reject) => {
      this.peer = new Peer(peerId, { debug: 1 });

      this.peer.on('open', (id) => {
        console.log(`[P2P Host] Room created. Peer ID: ${id}`);
        this.startHeartbeat();
        resolve(this.roomCode);
      });

      this.peer.on('connection', (conn) => {
        console.log(`[P2P Host] Incoming connection from ${conn.peer}`);
        this.handleHostConnection(conn);
      });

      this.peer.on('error', (err: any) => {
        console.error('[P2P Host] Peer error:', err);
        if (err.type === 'unavailable-id') {
          reject(new Error('El código de sala ya está en uso. Intenta con otro código.'));
        } else {
          reject(err);
        }
      });
    });
  }

  /**
   * Guest joins an existing room by code with automatic reconnect
   */
  public async joinRoom(
    code: string,
    callbacks: {
      onStateUpdate: StateUpdateCallback;
      onLobbyUpdate?: LobbyUpdateCallback;
      onConnectionChange: ConnectionStatusCallback;
    },
    playerName?: string
  ): Promise<void> {
    this.destroy();

    this.role = 'guest';
    this.roomCode = code.toUpperCase().trim();
    this.onStateUpdate = callbacks.onStateUpdate;
    this.onLobbyUpdate = callbacks.onLobbyUpdate || null;
    this.onConnectionChange = callbacks.onConnectionChange;

    const hostPeerId = `${PEER_PREFIX}${this.roomCode}`;
    return this.connectGuestToHost(hostPeerId, playerName);
  }

  private connectGuestToHost(hostPeerId: string, playerName?: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.peer && !this.peer.destroyed) {
        this.peer.destroy();
      }

      this.peer = new Peer({ debug: 1 });

      let timeoutTimer: any = setTimeout(() => {
        if (this.role === 'guest') {
          this.scheduleReconnect(hostPeerId, playerName);
        }
        reject(new Error('Tiempo de espera agotado. Intentando reconectar...'));
      }, 8000);

      this.peer.on('open', () => {
        if (!this.peer || this.role !== 'guest') return;
        const conn = this.peer.connect(hostPeerId, { reliable: true });
        this.guestConnection = conn;

        conn.on('open', () => {
          clearTimeout(timeoutTimer);
          this.isReconnecting = false;
          if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
          console.log(`[P2P Guest] Connected to host ${hostPeerId}`);
          if (this.onConnectionChange) this.onConnectionChange(1, [hostPeerId]);
          this.startHeartbeat();
          if (playerName) {
            this.sendJoinLobby(playerName);
          }
          resolve();
        });

        conn.on('data', (data) => {
          this.handleGuestMessage(data as PeerMessage);
        });

        conn.on('close', () => {
          console.log('[P2P Guest] Disconnected from host, scheduling reconnect...');
          if (this.onConnectionChange) this.onConnectionChange(0, []);
          this.scheduleReconnect(hostPeerId, playerName);
        });

        conn.on('error', (err) => {
          console.error('[P2P Guest] Connection error:', err);
          clearTimeout(timeoutTimer);
          this.scheduleReconnect(hostPeerId, playerName);
          reject(err);
        });
      });

      this.peer.on('error', (err: any) => {
        console.error('[P2P Guest] Peer error:', err);
        clearTimeout(timeoutTimer);
        this.scheduleReconnect(hostPeerId, playerName);
        reject(new Error('No se pudo conectar a la sala. Reintentando...'));
      });
    });
  }

  private scheduleReconnect(hostPeerId: string, playerName?: string) {
    if (this.role !== 'guest' || !this.roomCode || this.isReconnecting) return;

    this.isReconnecting = true;
    if (this.onConnectionChange) this.onConnectionChange(0, []);

    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);

    this.reconnectTimer = setTimeout(() => {
      if (this.role === 'guest' && this.roomCode) {
        console.log(`[P2P Guest] Auto-reconnecting to room ${this.roomCode}...`);
        this.isReconnecting = false;
        this.connectGuestToHost(hostPeerId, playerName).catch((err) => {
          console.warn('[P2P Guest] Reconnect attempt failed:', err);
        });
      }
    }, 2500);
  }

  /**
   * Host broadcasts full Game state to all connected guests
   */
  public broadcastState(game: Game): void {
    if (this.role !== 'host') return;

    const msg: PeerMessage = {
      type: 'STATE_UPDATE',
      game,
      hostNow: Date.now(),
    };

    this.hostConnections.forEach((conn) => {
      if (conn.open) {
        conn.send(msg);
      }
    });
  }

  /**
   * Host broadcasts current Lobby state (players list, isGameStarted)
   */
  public broadcastLobbyState(lobbyInfo: LobbyInfo): void {
    if (this.role !== 'host') return;

    const msg: PeerMessage = {
      type: 'LOBBY_STATE',
      lobbyInfo,
    };

    this.hostConnections.forEach((conn) => {
      if (conn.open) {
        conn.send(msg);
      }
    });
  }

  /**
   * Guest sends join lobby message with player name
   */
  public sendJoinLobby(name: string, color?: string): void {
    if (this.role !== 'guest' || !this.guestConnection || !this.guestConnection.open) return;

    const msg: PeerMessage = {
      type: 'JOIN_LOBBY',
      joinPlayerName: name,
      joinPlayerColor: color,
    };

    this.guestConnection.send(msg);
  }

  /**
   * Guest sends leave lobby message to host before disconnecting
   */
  public sendLeaveLobby(): void {
    if (this.role !== 'guest' || !this.guestConnection || !this.guestConnection.open) return;

    const msg: PeerMessage = {
      type: 'LEAVE_LOBBY',
    };

    try {
      this.guestConnection.send(msg);
    } catch (err) {
      console.warn('[P2P Guest] Error sending leave lobby message:', err);
    }
  }

  /**
   * Guest sends an action request to the Host
   */
  public sendActionToHost(type: PeerActionType, payload?: any, playerId?: string): void {
    if (this.role !== 'guest' || !this.guestConnection || !this.guestConnection.open) {
      console.warn('[P2P Guest] Cannot send action: not connected to host');
      return;
    }

    const msg: PeerMessage = {
      type: 'ACTION',
      action: { type, payload },
      senderPlayerId: playerId,
    };

    this.guestConnection.send(msg);
  }

  /**
   * Disconnect and clean up resources
   */
  public destroy(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }

    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    this.isReconnecting = false;

    if (this.guestConnection) {
      this.guestConnection.close();
      this.guestConnection = null;
    }

    this.hostConnections.forEach((conn) => conn.close());
    this.hostConnections.clear();

    if (this.peer) {
      this.peer.destroy();
      this.peer = null;
    }

    this.role = 'none';
    this.roomCode = '';
  }

  // --- PRIVATE HELPERS ---

  private handleHostConnection(conn: DataConnection): void {
    conn.on('open', () => {
      this.hostConnections.set(conn.peer, conn);
      this.notifyConnectionChange();
      if (this.onGuestConnect) {
        this.onGuestConnect(conn);
      }
    });

    conn.on('data', (data) => {
      const msg = data as PeerMessage;
      if (msg.type === 'JOIN_LOBBY' && msg.joinPlayerName && this.onGuestJoinLobby) {
        this.onGuestJoinLobby({
          name: msg.joinPlayerName,
          color: msg.joinPlayerColor,
          peerId: conn.peer,
        });
      } else if (msg.type === 'LEAVE_LOBBY') {
        this.hostConnections.delete(conn.peer);
        this.notifyConnectionChange();
        if (this.onGuestDisconnect) {
          this.onGuestDisconnect(conn.peer);
        }
      } else if (msg.type === 'ACTION' && msg.action && this.onGuestAction) {
        this.onGuestAction(msg.action, msg.senderPlayerId);
      }
    });

    conn.on('close', () => {
      this.hostConnections.delete(conn.peer);
      this.notifyConnectionChange();
      if (this.onGuestDisconnect) {
        this.onGuestDisconnect(conn.peer);
      }
    });

    conn.on('error', () => {
      this.hostConnections.delete(conn.peer);
      this.notifyConnectionChange();
      if (this.onGuestDisconnect) {
        this.onGuestDisconnect(conn.peer);
      }
    });
  }

  private handleGuestMessage(msg: PeerMessage): void {
    if (msg.hostNow) {
      this.clockOffset = Date.now() - msg.hostNow;
    }
    if (msg.type === 'STATE_UPDATE' && msg.game && this.onStateUpdate) {
      this.onStateUpdate(msg.game);
    } else if (msg.type === 'LOBBY_STATE' && msg.lobbyInfo && this.onLobbyUpdate) {
      this.onLobbyUpdate(msg.lobbyInfo);
    }
  }

  private notifyConnectionChange(): void {
    if (this.onConnectionChange) {
      const peerIds = Array.from(this.hostConnections.keys());
      this.onConnectionChange(peerIds.length, peerIds);
    }
  }

  private startHeartbeat(): void {
    if (this.heartbeatTimer) clearInterval(this.heartbeatTimer);
    this.heartbeatTimer = setInterval(() => {
      if (this.role === 'host') {
        this.hostConnections.forEach((conn) => {
          if (conn.open) conn.send({ type: 'HEARTBEAT' });
        });
      } else if (this.role === 'guest' && this.guestConnection?.open) {
        this.guestConnection.send({ type: 'HEARTBEAT' });
      }
    }, 15000);
  }
}

export const globalPeerRoomService = new PeerRoomService();
