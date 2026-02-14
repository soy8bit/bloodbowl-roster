import { useState } from 'react';
import type { Roster, GameRecord, SPPRecord } from '../types';
import { SPP_VALUES, emptySPP, calculateTotalSPP } from '../utils/progressionUtils';
import { useLang } from '../i18n';
import teamsRaw from '../data/teams.json';

interface TeamBasic { name: string; id: string }
const teamsList = (teamsRaw as TeamBasic[]).map(t => t.name).sort();

interface Props {
  roster: Roster;
  onAddGame: (game: GameRecord) => void;
  onUpdateGame: (gameId: string, game: GameRecord) => void;
  onDeleteGame: (gameId: string) => void;
  onAddPlayerSPP: (uid: string, sppDelta: Partial<SPPRecord>) => void;
}

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 9);
}

type SPPKey = keyof SPPRecord;
const SPP_KEYS: SPPKey[] = ['cp', 'td', 'def', 'int', 'bh', 'si', 'kill', 'mvp'];

export default function GamesTab({ roster, onAddGame, onUpdateGame, onDeleteGame, onAddPlayerSPP }: Props) {
  const { lang, t } = useLang();
  const games = roster.games || [];

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form state
  const [opponentName, setOpponentName] = useState('');
  const [opponentRace, setOpponentRace] = useState('');
  const [tdScored, setTdScored] = useState(0);
  const [tdConceded, setTdConceded] = useState(0);
  const [casualties, setCasualties] = useState(0);
  const [result, setResult] = useState<'W' | 'T' | 'L'>('W');
  const [notes, setNotes] = useState('');
  const [playerSPP, setPlayerSPP] = useState<Record<string, Partial<SPPRecord>>>({});

  const resetForm = () => {
    setOpponentName('');
    setOpponentRace('');
    setTdScored(0);
    setTdConceded(0);
    setCasualties(0);
    setResult('W');
    setNotes('');
    setPlayerSPP({});
    setEditingId(null);
    setShowForm(false);
  };

  const loadGame = (game: GameRecord) => {
    setOpponentName(game.opponentName);
    setOpponentRace(game.opponentRace);
    setTdScored(game.tdScored);
    setTdConceded(game.tdConceded);
    setCasualties(game.casualties);
    setResult(game.result);
    setNotes(game.notes);
    setPlayerSPP(game.playerSPP || {});
    setEditingId(game.id);
    setShowForm(true);
  };

  const updatePlayerSPPField = (uid: string, key: SPPKey, value: number) => {
    setPlayerSPP((prev) => {
      const current = prev[uid] || {};
      const updated = { ...current, [key]: Math.max(0, value) };
      // If mvp, ensure only one player has it
      if (key === 'mvp' && value > 0) {
        const cleaned: Record<string, Partial<SPPRecord>> = {};
        for (const [id, spp] of Object.entries(prev)) {
          if (id !== uid) {
            cleaned[id] = { ...spp, mvp: 0 };
          }
        }
        cleaned[uid] = updated;
        return cleaned;
      }
      return { ...prev, [uid]: updated };
    });
  };

  const handleSubmit = () => {
    const gameId = editingId || generateId();
    const game: GameRecord = {
      id: gameId,
      date: editingId ? (games.find(g => g.id === editingId)?.date || Date.now()) : Date.now(),
      opponentName,
      opponentRace,
      tdScored,
      tdConceded,
      casualties,
      result,
      notes,
      playerSPP,
    };

    if (editingId) {
      // When updating, we need to reverse old SPP first, then apply new
      const oldGame = games.find(g => g.id === editingId);
      if (oldGame) {
        // Reverse old SPP
        for (const [uid, spp] of Object.entries(oldGame.playerSPP)) {
          const reversed: Partial<SPPRecord> = {};
          for (const key of SPP_KEYS) {
            if (spp[key]) reversed[key] = -(spp[key]!);
          }
          onAddPlayerSPP(uid, reversed);
        }
      }
      onUpdateGame(gameId, game);
    } else {
      onAddGame(game);
    }

    // Apply SPP to players
    for (const [uid, spp] of Object.entries(playerSPP)) {
      const hasValues = Object.values(spp).some(v => v && v > 0);
      if (hasValues) onAddPlayerSPP(uid, spp);
    }

    resetForm();
  };

  const handleDelete = (gameId: string) => {
    const game = games.find(g => g.id === gameId);
    if (game) {
      // Reverse SPP
      for (const [uid, spp] of Object.entries(game.playerSPP)) {
        const reversed: Partial<SPPRecord> = {};
        for (const key of SPP_KEYS) {
          if (spp[key]) reversed[key] = -(spp[key]!);
        }
        onAddPlayerSPP(uid, reversed);
      }
    }
    onDeleteGame(gameId);
  };

  // Summary stats
  const totalGames = games.length;
  const wins = games.filter(g => g.result === 'W').length;
  const ties = games.filter(g => g.result === 'T').length;
  const losses = games.filter(g => g.result === 'L').length;
  const totalTD = games.reduce((s, g) => s + g.tdScored, 0);
  const totalCas = games.reduce((s, g) => s + g.casualties, 0);

  const sppLabels: Record<SPPKey, string> = {
    cp: 'CP', td: 'TD', def: 'DEF', int: 'INT', bh: 'BH', si: 'SI', kill: 'KILL', mvp: 'MVP',
  };
  const sppTips: Record<SPPKey, string> = {
    cp: t.tipCP, td: t.tipTD, def: t.tipDEF, int: t.tipINT, bh: t.tipBH, si: t.tipSI, kill: t.tipKILL, mvp: t.tipMVP,
  };

  return (
    <div className="games-tab">
      {/* Summary */}
      {totalGames > 0 && (
        <div className="games-summary">
          <span className="games-summary-item"><strong>{lang === 'es' ? 'PJ' : 'GP'}:</strong> {totalGames}</span>
          <span className="games-summary-item games-w"><strong>W:</strong> {wins}</span>
          <span className="games-summary-item games-t"><strong>T:</strong> {ties}</span>
          <span className="games-summary-item games-l"><strong>L:</strong> {losses}</span>
          <span className="games-summary-item"><strong>TD:</strong> {totalTD}</span>
          <span className="games-summary-item"><strong>{lang === 'es' ? 'Bajas' : 'Cas'}:</strong> {totalCas}</span>
        </div>
      )}

      {/* New game button */}
      {!showForm && (
        <button className="btn-primary btn-new-game" onClick={() => setShowForm(true)}>
          + {lang === 'es' ? 'Registrar Partido' : 'Record Game'}
        </button>
      )}

      {/* Game Form */}
      {showForm && (
        <div className="game-form">
          <h4 className="game-form-title">
            {editingId
              ? (lang === 'es' ? 'Editar Partido' : 'Edit Game')
              : (lang === 'es' ? 'Nuevo Partido' : 'New Game')}
          </h4>

          <div className="game-form-grid">
            <div className="game-form-field">
              <label>{lang === 'es' ? 'Oponente' : 'Opponent'}</label>
              <input
                type="text"
                value={opponentName}
                onChange={(e) => setOpponentName(e.target.value)}
                placeholder={lang === 'es' ? 'Nombre del equipo rival' : 'Opponent team name'}
              />
            </div>
            <div className="game-form-field">
              <label>{lang === 'es' ? 'Raza' : 'Race'}</label>
              <select value={opponentRace} onChange={(e) => setOpponentRace(e.target.value)}>
                <option value="">{lang === 'es' ? 'Seleccionar...' : 'Select...'}</option>
                {teamsList.map((name) => (
                  <option key={name} value={name}>{name}</option>
                ))}
              </select>
            </div>
            <div className="game-form-field">
              <label>TD {lang === 'es' ? 'anotados' : 'scored'}</label>
              <input type="number" min={0} value={tdScored} onChange={(e) => setTdScored(Math.max(0, +e.target.value))} />
            </div>
            <div className="game-form-field">
              <label>TD {lang === 'es' ? 'recibidos' : 'conceded'}</label>
              <input type="number" min={0} value={tdConceded} onChange={(e) => setTdConceded(Math.max(0, +e.target.value))} />
            </div>
            <div className="game-form-field">
              <label>{lang === 'es' ? 'Bajas' : 'Casualties'}</label>
              <input type="number" min={0} value={casualties} onChange={(e) => setCasualties(Math.max(0, +e.target.value))} />
            </div>
            <div className="game-form-field">
              <label>{lang === 'es' ? 'Resultado' : 'Result'}</label>
              <div className="result-btns">
                {(['W', 'T', 'L'] as const).map((r) => (
                  <button
                    key={r}
                    className={`result-btn result-${r.toLowerCase()} ${result === r ? 'selected' : ''}`}
                    onClick={() => setResult(r)}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="game-form-field game-form-notes">
            <label>{lang === 'es' ? 'Notas' : 'Notes'}</label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
          </div>

          {/* Player SPP Assignment */}
          <div className="game-spp-section">
            <h4 className="game-spp-title">{lang === 'es' ? 'SPP por Jugador' : 'Player SPP'}</h4>
            <div className="game-spp-table-wrapper">
              <table className="game-spp-table">
                <thead>
                  <tr>
                    <th>{lang === 'es' ? 'Jugador' : 'Player'}</th>
                    {SPP_KEYS.map((key) => (
                      <th key={key} className="spp-col-header" title={sppTips[key]}>{sppLabels[key]}</th>
                    ))}
                    <th>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {roster.players.map((player) => {
                    const pSpp = playerSPP[player.uid] || {};
                    const rowTotal = SPP_KEYS.reduce((sum, k) => sum + (pSpp[k] || 0) * SPP_VALUES[k], 0);
                    return (
                      <tr key={player.uid}>
                        <td className="spp-player-name">{player.name || player.position}</td>
                        {SPP_KEYS.map((key) => (
                          <td key={key} className="spp-input-cell">
                            {key === 'mvp' ? (
                              <input
                                type="checkbox"
                                checked={(pSpp.mvp || 0) > 0}
                                onChange={(e) => updatePlayerSPPField(player.uid, 'mvp', e.target.checked ? 1 : 0)}
                              />
                            ) : (
                              <input
                                type="number"
                                className="spp-input"
                                min={0}
                                value={pSpp[key] || 0}
                                onChange={(e) => updatePlayerSPPField(player.uid, key, +e.target.value)}
                              />
                            )}
                          </td>
                        ))}
                        <td className="spp-total-cell">{rowTotal}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div className="game-form-actions">
            <button className="btn-secondary" onClick={resetForm}>{lang === 'es' ? 'Cancelar' : 'Cancel'}</button>
            <button className="btn-primary" onClick={handleSubmit} disabled={!opponentName.trim()}>
              {editingId
                ? (lang === 'es' ? 'Actualizar' : 'Update')
                : (lang === 'es' ? 'Guardar' : 'Save')}
            </button>
          </div>
        </div>
      )}

      {/* Game History */}
      {games.length > 0 && !showForm && (
        <div className="games-history">
          <h4 className="games-history-title">{lang === 'es' ? 'Historial de Partidos' : 'Game History'}</h4>
          {[...games].reverse().map((game) => (
            <div key={game.id} className={`game-card game-result-${game.result.toLowerCase()}`}>
              <div className="game-card-header">
                <span className={`game-result-badge result-${game.result.toLowerCase()}`}>{game.result}</span>
                <span className="game-opponent">{game.opponentName}</span>
                {game.opponentRace && <span className="game-race">({game.opponentRace})</span>}
                <span className="game-score">{game.tdScored} - {game.tdConceded}</span>
              </div>
              <div className="game-card-meta">
                <span>{lang === 'es' ? 'Bajas' : 'Cas'}: {game.casualties}</span>
                <span>{new Date(game.date).toLocaleDateString()}</span>
              </div>
              {game.notes && <div className="game-card-notes">{game.notes}</div>}
              {/* Show players who earned SPP */}
              {Object.entries(game.playerSPP).some(([, spp]) => Object.values(spp).some(v => v && v > 0)) && (
                <div className="game-card-spp">
                  {Object.entries(game.playerSPP).map(([uid, spp]) => {
                    const total = SPP_KEYS.reduce((s, k) => s + (spp[k] || 0) * SPP_VALUES[k], 0);
                    if (total === 0) return null;
                    const player = roster.players.find(p => p.uid === uid);
                    if (!player) return null;
                    const parts = SPP_KEYS.filter(k => (spp[k] || 0) > 0).map(k => `${(spp[k] || 0)} ${sppLabels[k]}`);
                    return (
                      <span key={uid} className="game-spp-player">
                        {player.name || player.position}: {parts.join(', ')} ({total} SPP)
                      </span>
                    );
                  })}
                </div>
              )}
              <div className="game-card-actions">
                <button className="btn-small" onClick={() => loadGame(game)}>
                  {lang === 'es' ? 'Editar' : 'Edit'}
                </button>
                <button className="btn-small btn-danger" onClick={() => handleDelete(game.id)}>
                  {lang === 'es' ? 'Eliminar' : 'Delete'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
