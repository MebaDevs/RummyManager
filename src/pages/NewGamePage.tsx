import React, { useState, useEffect } from 'react';
import { useGame } from '../context/GameContext';
import { Player, GameSettings, GameSummary } from '../domain/models';
import { AVATAR_COLORS } from '../domain/rules/defaultRounds';
import { Plus, Trash2, UserCheck, Play, Settings, AlertCircle, Clock, Volume2, ShieldAlert, Users, History, Check, X, GripVertical } from 'lucide-react';
import { useSortable } from '../hooks/useSortable';

export const NewGamePage: React.FC = () => {
  const { globalSettings, createNewGame, repository, setCurrentPage } = useGame();

  const [players, setPlayers] = useState<Player[]>([]);
  const [newPlayerName, setNewPlayerName] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [settings, setSettings] = useState<GameSettings>({ ...globalSettings });

  const [lastGame, setLastGame] = useState<GameSummary | null>(null);

  // Pointer-events + touch based drag-to-sort (no HTML5 DnD API)
  const { draggingIndex, overIndex, handleHandleMouseDown, handleHandleTouchStart, handleItemMouseEnter, setRowRef } = useSortable(
    players,
    (reordered) => setPlayers(reordered.map((p, idx) => ({ ...p, isInitialPlayer: idx === 0 })))
  );

  useEffect(() => {
    loadPastPlayers();
  }, []);

  const loadPastPlayers = async () => {
    const games = await repository.getAllGames();
    if (games.length > 0) {
      setLastGame(games[0]);
    } else {
      setLastGame(null);
    }
  };

  const handleAddPlayerByName = (nameToAdd: string) => {
    const trimmed = nameToAdd.trim();
    if (!trimmed) return;

    if (players.some((p) => p.name.toLowerCase() === trimmed.toLowerCase())) {
      setErrorMsg(`"${trimmed}" ya está en la lista de jugadores.`);
      return;
    }
    if (players.length >= 8) {
      setErrorMsg('El número máximo de jugadores permitido es 8.');
      return;
    }

    const autoColor = AVATAR_COLORS[players.length % AVATAR_COLORS.length];
    const newPlayer: Player = {
      id: `p_${Date.now()}_${players.length}`,
      name: trimmed,
      avatarColor: autoColor,
      isInitialPlayer: players.length === 0,
    };

    setPlayers((prev) => {
      const updated = [...prev, newPlayer];
      return updated.map((p, idx) => ({ ...p, isInitialPlayer: idx === 0 }));
    });
    setErrorMsg('');
  };

  const handleImportMatchPlayers = (gameSummary: GameSummary) => {
    const newAdded: Player[] = [...players];
    gameSummary.playerNames.forEach((name) => {
      if (!newAdded.some((p) => p.name.toLowerCase() === name.toLowerCase()) && newAdded.length < 8) {
        newAdded.push({
          id: `p_${Date.now()}_${newAdded.length}`,
          name,
          avatarColor: AVATAR_COLORS[newAdded.length % AVATAR_COLORS.length],
          isInitialPlayer: newAdded.length === 0,
        });
      }
    });
    setPlayers(newAdded.map((p, idx) => ({ ...p, isInitialPlayer: idx === 0 })));
    setErrorMsg('');
  };

  const handleAddPlayer = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    handleAddPlayerByName(newPlayerName);
    setNewPlayerName('');
  };

  const handleRemovePlayer = (id: string) => {
    const updated = players.filter((p) => p.id !== id);
    setPlayers(updated.map((p, idx) => ({ ...p, isInitialPlayer: idx === 0 })));
    setErrorMsg('');
  };

  const handleStartGame = async () => {
    if (players.length < 2) {
      setErrorMsg('Debes agregar al menos 2 jugadores para iniciar la partida.');
      return;
    }
    await createNewGame(players, settings);
  };

  return (
    <div style={{ maxWidth: 980, margin: '0 auto', padding: '36px 20px' }}>
      <h2 style={{ fontSize: 32, marginBottom: 8 }} className="font-display">
        Configuración de Partida
      </h2>
      <p style={{ color: 'var(--text-secondary)', marginBottom: 24 }}>
        Agrega o importa jugadores de la última partida. Arrastra el ícono ⠿ para reordenar los asientos.
      </p>

      {errorMsg && (
        <div
          style={{
            background: 'rgba(255, 83, 101, 0.15)',
            border: '1px solid var(--status-red)',
            color: '#ff8593',
            padding: '12px 18px',
            borderRadius: 'var(--radius-md)',
            marginBottom: 24,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
          }}
        >
          <AlertCircle size={20} />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* QUICK IMPORT SECTION — LATEST GAME ONLY */}
      {lastGame && lastGame.playerNames.length > 0 && (
        <div
          className="glass-panel"
          style={{ padding: '20px 24px', marginBottom: 24, borderColor: 'rgba(155, 92, 255, 0.3)', background: 'rgba(155, 92, 255, 0.06)' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <History size={20} color="var(--accent-purple)" />
            <h3 style={{ fontSize: 16, fontWeight: 700 }}>Jugadores de la última partida</h3>
          </div>

          <div style={{ marginBottom: 14 }}>
            <span style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>
              Importar mesa completa de la última partida:
            </span>
            <button
              onClick={() => handleImportMatchPlayers(lastGame)}
              className="btn btn-secondary btn-sm"
              style={{ borderRadius: 999 }}
            >
              <Users size={14} /> Cargar {lastGame.playerNames.join(', ')}
            </button>
          </div>

          <div>
            <span style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>
              O agrega jugadores individualmente:
            </span>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {lastGame.playerNames.map((name) => {
                const isAlreadyAdded = players.some((p) => p.name.toLowerCase() === name.toLowerCase());
                return (
                  <button
                    key={name}
                    onClick={() => !isAlreadyAdded && handleAddPlayerByName(name)}
                    disabled={isAlreadyAdded}
                    className={`btn btn-sm ${isAlreadyAdded ? 'btn-secondary' : 'btn-primary'}`}
                    style={{ borderRadius: 999, opacity: isAlreadyAdded ? 0.4 : 1, cursor: isAlreadyAdded ? 'default' : 'pointer' }}
                  >
                    {isAlreadyAdded ? <Check size={14} /> : <Plus size={14} />} {name}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24 }}>
        {/* Players Section */}
        <div className="glass-panel" style={{ padding: 24 }}>
          <h3 style={{ fontSize: 20, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <UserCheck size={20} color="var(--accent-purple)" /> Registro de Jugadores ({players.length})
          </h3>

          {/* Add Player Form */}
          <form onSubmit={handleAddPlayer} style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
            <input
              type="text"
              placeholder="Nombre del jugador (ej. Sebas)..."
              value={newPlayerName}
              onChange={(e) => setNewPlayerName(e.target.value)}
              style={{
                flex: 1,
                padding: '12px 16px',
                borderRadius: 'var(--radius-md)',
                background: 'rgba(0,0,0,0.4)',
                border: '1px solid var(--panel-border)',
                color: '#fff',
                fontSize: 15,
                outline: 'none',
              }}
            />
            <button type="submit" className="btn btn-primary">
              <Plus size={18} /> Agregar
            </button>
          </form>

          {/* Players List */}
          {players.length === 0 ? (
            <div
              style={{
                padding: '32px 16px',
                textAlign: 'center',
                background: 'rgba(0,0,0,0.2)',
                borderRadius: 'var(--radius-md)',
                border: '1px dashed var(--panel-border)',
              }}
            >
              <Users size={36} color="var(--text-muted)" style={{ marginBottom: 8 }} />
              <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
                La lista está vacía. Selecciona un jugador anterior arriba o escribe un nuevo nombre.
              </p>
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Mínimo 2 jugadores, máximo 8.</span>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 380, overflowY: 'auto' }}>
              {players.map((player, index) => {
                const isDraggingThisRow = draggingIndex === index;
                const isOverThisRow = overIndex === index && draggingIndex !== null && draggingIndex !== index;
                return (
                  <div
                    key={player.id}
                    ref={(el) => setRowRef(index, el as HTMLElement | null)}
                    onMouseEnter={() => handleItemMouseEnter(index)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 14px',
                      borderRadius: 'var(--radius-md)',
                      background: isOverThisRow
                        ? 'rgba(155, 92, 255, 0.22)'
                        : player.isInitialPlayer
                        ? 'rgba(155, 92, 255, 0.12)'
                        : 'rgba(255, 255, 255, 0.03)',
                      border: isOverThisRow
                        ? '2px dashed var(--accent-purple)'
                        : player.isInitialPlayer
                        ? '1px solid var(--accent-purple)'
                        : '1px solid var(--panel-border)',
                      opacity: isDraggingThisRow ? 0.4 : 1,
                      transition: 'border 0.1s, background 0.1s, opacity 0.1s',
                      cursor: draggingIndex !== null ? 'grabbing' : 'default',
                      userSelect: 'none',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      {/* Drag Handle */}
                      <div
                        onMouseDown={() => handleHandleMouseDown(index)}
                        onTouchStart={(e) => handleHandleTouchStart(e, index)}
                        style={{
                          color: 'var(--text-muted)',
                          cursor: 'grab',
                          display: 'flex',
                          alignItems: 'center',
                          padding: '8px 4px',
                          flexShrink: 0,
                          touchAction: 'none',
                        }}
                        title="Arrastra para reordenar"
                      >
                        <GripVertical size={18} />
                      </div>

                      {/* Position number */}
                      <span className="font-mono" style={{ fontSize: 12, color: 'var(--text-muted)', width: 16, textAlign: 'center' }}>
                        {index + 1}
                      </span>

                      {/* Avatar */}
                      <div
                        style={{
                          width: 32, height: 32, borderRadius: '50%',
                          background: player.avatarColor,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontWeight: 800, color: '#000', fontSize: 14,
                          boxShadow: `0 0 8px ${player.avatarColor}`,
                          flexShrink: 0,
                        }}
                      >
                        {player.name.charAt(0).toUpperCase()}
                      </div>

                      {/* Name & badge */}
                      <div>
                        <span style={{ fontWeight: 600 }}>{player.name}</span>
                        {player.isInitialPlayer && (
                          <span className="badge badge-purple" style={{ marginLeft: 8, fontSize: 10 }}>
                            Inicia R1
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Delete */}
                    <button
                      onClick={() => handleRemovePlayer(player.id)}
                      className="btn btn-secondary btn-sm"
                      style={{ color: 'var(--status-red)', flexShrink: 0 }}
                      title="Eliminar jugador"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Settings Section */}
        <div className="glass-panel" style={{ padding: 24 }}>
          <h3 style={{ fontSize: 20, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Settings size={20} color="var(--status-amber)" /> Reglas y Tiempos
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Turn Timer Slider */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <label style={{ fontSize: 14, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Clock size={16} /> Tiempo por turno:
                </label>
                <span className="font-mono" style={{ fontWeight: 700, color: 'var(--status-green)' }}>
                  {settings.turnTimeLimitSeconds} seg ({Math.floor(settings.turnTimeLimitSeconds / 60)}m {settings.turnTimeLimitSeconds % 60}s)
                </span>
              </div>
              <input
                type="range"
                min="30" max="300" step="15"
                value={settings.turnTimeLimitSeconds}
                onChange={(e) => setSettings({ ...settings, turnTimeLimitSeconds: Number(e.target.value) })}
                style={{ width: '100%', accentColor: 'var(--status-green)' }}
              />
            </div>

            {/* Timeout Penalty Slider */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <label style={{ fontSize: 14, color: 'var(--text-secondary)' }}>Penalización por Timeout:</label>
                <span className="font-mono" style={{ fontWeight: 700, color: 'var(--status-amber)' }}>
                  +{settings.timeoutPenalty} pts
                </span>
              </div>
              <input
                type="range"
                min="0" max="100" step="5"
                value={settings.timeoutPenalty}
                onChange={(e) => setSettings({ ...settings, timeoutPenalty: Number(e.target.value) })}
                style={{ width: '100%', accentColor: 'var(--status-amber)' }}
              />
            </div>

            {/* Auto Advance Toggle */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <label style={{ fontSize: 14, color: 'var(--text-secondary)', display: 'block', fontWeight: 600 }}>
                  Avanzar turno automáticamente en Timeout
                </label>
                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  {settings.autoAdvanceOnTimeout
                    ? 'Pasa el turno de inmediato al agotar tiempo.'
                    : 'Desactivado: El jugador conserva su turno y cronometra el tiempo excedido.'}
                </span>
              </div>
              <input
                type="checkbox"
                checked={settings.autoAdvanceOnTimeout}
                onChange={(e) => setSettings({ ...settings, autoAdvanceOnTimeout: e.target.checked })}
                style={{ width: 20, height: 20, accentColor: 'var(--accent-purple)', cursor: 'pointer' }}
              />
            </div>

            {/* Game Error Penalty */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <label style={{ fontSize: 14, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <ShieldAlert size={16} color="var(--status-red)" /> Sanción Error de Juego:
                </label>
                <span className="font-mono" style={{ fontWeight: 700, color: 'var(--status-red)' }}>
                  +{settings.gameErrorPenalty} pts (Elimina de ronda)
                </span>
              </div>
            </div>

            {/* Sound Toggle */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 10, borderTop: '1px solid var(--panel-border)' }}>
              <label style={{ fontSize: 14, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Volume2 size={18} /> Efectos de Sonido
              </label>
              <input
                type="checkbox"
                checked={settings.soundEnabled}
                onChange={(e) => setSettings({ ...settings, soundEnabled: e.target.checked })}
                style={{ width: 20, height: 20, accentColor: 'var(--accent-purple)', cursor: 'pointer' }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 14, marginTop: 32, flexWrap: 'wrap' }}>
        <button onClick={() => setCurrentPage('home')} className="btn btn-secondary btn-lg">
          <X size={20} /> Cancelar
        </button>
        <button
          onClick={handleStartGame}
          className="btn btn-success btn-lg"
          disabled={players.length < 2}
          style={{ opacity: players.length < 2 ? 0.5 : 1, cursor: players.length < 2 ? 'not-allowed' : 'pointer' }}
        >
          <Play size={20} /> Comenzar Partida Ahora
        </button>
      </div>
    </div>
  );
};
