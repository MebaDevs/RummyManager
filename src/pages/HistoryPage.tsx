import React, { useEffect, useState } from 'react';
import { useGame } from '../context/GameContext';
import { GameSummary } from '../domain/models';
import { Trophy, Calendar, Users, Trash2 } from 'lucide-react';

export const HistoryPage: React.FC = () => {
  const { repository, setCurrentPage } = useGame();
  const [games, setGames] = useState<GameSummary[]>([]);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    const list = await repository.getAllGames();
    setGames(list);
  };

  const handleDelete = async (id: string) => {
    await repository.deleteGame(id);
    await loadHistory();
  };

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '36px 20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h2 style={{ fontSize: 32 }} className="font-display">
            Historial de Partidas
          </h2>
          <p style={{ color: 'var(--text-secondary)' }}>
            Revisa partidas guardadas, ganadores y desgloses anteriores.
          </p>
        </div>
      </div>

      {games.length === 0 ? (
        <div className="glass-panel" style={{ padding: 48, textAlign: 'center' }}>
          <Trophy size={48} color="var(--text-muted)" style={{ marginBottom: 16 }} />
          <h3 style={{ fontSize: 20, marginBottom: 8 }}>No hay partidas guardadas</h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 24 }}>
            Cuando juegues tu primera partida local, aparecerá aquí con sus detalles.
          </p>
          <button onClick={() => setCurrentPage('new_game')} className="btn btn-primary btn-lg">
            Crear Partida
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {games.map((g) => (
            <div
              key={g.id}
              className="glass-panel"
              style={{
                padding: 20,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: 16,
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                  <h4 style={{ fontSize: 18, fontWeight: 700 }}>{g.name}</h4>
                  <span className={`badge ${g.status === 'finished' ? 'badge-purple' : 'badge-green'}`}>
                    {g.status === 'finished' ? 'Finalizada' : 'En Curso'}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: 16, fontSize: 13, color: 'var(--text-secondary)' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Users size={14} /> {g.playerNames.join(', ')}
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Calendar size={14} /> {new Date(g.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                {g.winnerName && (
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: 11, color: 'var(--status-amber)', fontWeight: 700 }}>GANADOR</span>
                    <div style={{ fontSize: 15, fontWeight: 700 }}>🏆 {g.winnerName}</div>
                  </div>
                )}
                <button
                  onClick={() => handleDelete(g.id)}
                  className="btn btn-secondary btn-sm"
                  style={{ color: 'var(--status-red)' }}
                  title="Eliminar partida"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
