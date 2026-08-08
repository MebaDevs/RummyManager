import React, { useState } from 'react';
import { useGame } from '../context/GameContext';
import { Save, Volume2, Clock, ShieldAlert, Check } from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const { globalSettings, updateGlobalSettings } = useGame();
  const [settings, setSettings] = useState({ ...globalSettings });
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSave = () => {
    updateGlobalSettings(settings);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  return (
    <div style={{ maxWidth: 700, margin: '0 auto', padding: '36px 20px' }}>
      <h2 style={{ fontSize: 32, marginBottom: 8 }} className="font-display">
        Ajustes Globales
      </h2>
      <p style={{ color: 'var(--text-secondary)', marginBottom: 28 }}>
        Configura los valores por defecto que se aplicarán al crear nuevas partidas de Rummy.
      </p>

      {savedSuccess && (
        <div
          style={{
            background: 'rgba(53, 229, 138, 0.15)',
            border: '1px solid var(--status-green)',
            color: '#6ef0ae',
            padding: '12px 18px',
            borderRadius: 'var(--radius-md)',
            marginBottom: 24,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
          }}
        >
          <Check size={20} />
          <span>¡Ajustes guardados correctamente!</span>
        </div>
      )}

      <div className="glass-panel" style={{ padding: 28 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Default Turn Time */}
          <div>
            <label style={{ fontSize: 15, fontWeight: 600, marginBottom: 6, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Clock size={18} color="var(--status-green)" /> Tiempo por turno predeterminado
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginTop: 8 }}>
              <input
                type="range"
                min="30"
                max="300"
                step="15"
                value={settings.turnTimeLimitSeconds}
                onChange={(e) => setSettings({ ...settings, turnTimeLimitSeconds: Number(e.target.value) })}
                style={{ flex: 1, accentColor: 'var(--status-green)' }}
              />
              <span className="font-mono" style={{ fontWeight: 700, fontSize: 16, width: 80, textAlign: 'right' }}>
                {settings.turnTimeLimitSeconds}s
              </span>
            </div>
          </div>

          {/* Timeout Penalty */}
          <div>
            <label style={{ fontSize: 15, fontWeight: 600, marginBottom: 6, display: 'flex', alignItems: 'center', gap: 8 }}>
              Penalización por Timeout por defecto
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginTop: 8 }}>
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={settings.timeoutPenalty}
                onChange={(e) => setSettings({ ...settings, timeoutPenalty: Number(e.target.value) })}
                style={{ flex: 1, accentColor: 'var(--status-amber)' }}
              />
              <span className="font-mono" style={{ fontWeight: 700, fontSize: 16, width: 80, textAlign: 'right' }}>
                +{settings.timeoutPenalty} pts
              </span>
            </div>
          </div>

          {/* Auto Advance on Timeout */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 12, borderTop: '1px solid var(--panel-border)' }}>
            <div>
              <label style={{ fontSize: 15, fontWeight: 600 }}>
                Avanzar turno automáticamente en Timeout
              </label>
              <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                Si está desactivado (recomendado), el jugador mantiene su turno tras agotar el tiempo y cronometra el tiempo excedido hasta finalizar su jugada.
              </p>
            </div>
            <input
              type="checkbox"
              checked={settings.autoAdvanceOnTimeout}
              onChange={(e) => setSettings({ ...settings, autoAdvanceOnTimeout: e.target.checked })}
              style={{ width: 22, height: 22, accentColor: 'var(--accent-purple)', cursor: 'pointer' }}
            />
          </div>

          {/* Game Error Penalty */}
          <div>
            <label style={{ fontSize: 15, fontWeight: 600, marginBottom: 6, display: 'flex', alignItems: 'center', gap: 8 }}>
              <ShieldAlert size={18} color="var(--status-red)" /> Sanción Error de Juego (+150 pts)
            </label>
            <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
              El estándar oficial de Rummy es +150 puntos y exclusión de la ronda actual.
            </p>
          </div>

          {/* Sound Notification */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 16, borderTop: '1px solid var(--panel-border)' }}>
            <div>
              <label style={{ fontSize: 15, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Volume2 size={18} /> Sonidos y Alertas Auditivas
              </label>
              <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                Sonidos sintetizados con Web Audio API (conteo regresivo, buzzer y victoria).
              </p>
            </div>
            <input
              type="checkbox"
              checked={settings.soundEnabled}
              onChange={(e) => setSettings({ ...settings, soundEnabled: e.target.checked })}
              style={{ width: 22, height: 22, accentColor: 'var(--accent-purple)', cursor: 'pointer' }}
            />
          </div>

          <button onClick={handleSave} className="btn btn-primary btn-lg" style={{ marginTop: 12 }}>
            <Save size={20} /> Guardar Preferencias
          </button>
        </div>
      </div>
    </div>
  );
};
