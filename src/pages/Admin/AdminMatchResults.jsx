import { useState, useEffect } from 'react';
import api from '../../utils/api';
import { formatDate } from '../../utils/helpers';
import Button from '../../components/UI/Button';
import Card from '../../components/UI/Card';

export default function AdminMatchResults() {
  const [tournaments, setTournaments] = useState([]);
  const [selectedTourneyId, setSelectedTourneyId] = useState('');
  const [matches, setMatches] = useState([]);
  const [matchesLoading, setMatchesLoading] = useState(false);

  // New Match Form
  const [matchNumber, setMatchNumber] = useState('');
  const [matchDate, setMatchDate] = useState('');

  // Results Entry Modal
  const [entryMatch, setEntryMatch] = useState(null);
  const [registeredTeams, setRegisteredTeams] = useState([]);
  const [teamsLoading, setTeamsLoading] = useState(false);
  const [resultsData, setResultsData] = useState([]); // Array of { team_id, rank, kills }

  // Load Tournaments
  useEffect(() => {
    api.get('/tournaments')
      .then((data) => {
        const list = data.tournaments || data || [];
        setTournaments(list);
        if (list.length > 0) setSelectedTourneyId(list[0].id.toString());
      })
      .catch(() => {});
  }, []);

  // Load Matches when tournament changes
  const fetchMatches = async () => {
    if (!selectedTourneyId) return;
    try {
      setMatchesLoading(true);
      const data = await api.get('/matches', { tournament_id: selectedTourneyId });
      setMatches(data.matches || data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setMatchesLoading(false);
    }
  };

  useEffect(() => {
    fetchMatches();
  }, [selectedTourneyId]);

  const handleCreateMatch = async (e) => {
    e.preventDefault();
    if (!selectedTourneyId || !matchNumber) return;
    try {
      await api.post('/matches', {
        tournament_id: parseInt(selectedTourneyId),
        match_number: parseInt(matchNumber),
        date: matchDate || null,
        status: 'upcoming',
      });
      setMatchNumber('');
      setMatchDate('');
      fetchMatches();
    } catch (err) {
      alert(err.message || 'Failed to create match.');
    }
  };

  const handleOpenResults = async (match) => {
    setEntryMatch(match);
    setTeamsLoading(true);
    try {
      // Load approved registrations for this tournament
      const data = await api.get('/registrations', {
        tournament_id: selectedTourneyId,
        status: 'approved',
      });
      const list = data.registrations || data || [];
      setRegisteredTeams(list);

      // Pre-fill results data from existing results or draft
      const selectedTourney = tournaments.find(t => t.id.toString() === selectedTourneyId);
      const isClashSquad = selectedTourney?.mode === 'cs';
      const existingResults = match.results || [];
      const prefilled = list.map(reg => {
        const matchRes = existingResults.find(r => r.team_id === reg.team_id);
        const hasResult = !!matchRes;
        return {
          team_id: reg.team_id,
          team_name: reg.team_name,
          team_code: reg.team_code,
          rank: matchRes ? matchRes.rank.toString() : (isClashSquad ? '1' : '12'),
          kills: matchRes ? matchRes.kills.toString() : '0',
          participated: hasResult ? true : (isClashSquad ? false : true),
        };
      });
      setResultsData(prefilled);
    } catch (err) {
      console.error(err);
    } finally {
      setTeamsLoading(false);
    }
  };

  const handleResultChange = (idx, field, value) => {
    setResultsData(prev => {
      const copy = [...prev];
      copy[idx] = { ...copy[idx], [field]: value };
      return copy;
    });
  };

  const handleResultsSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        results: resultsData
          .filter(r => r.participated)
          .map(r => ({
            team_id: r.team_id,
            rank: parseInt(r.rank),
            kills: parseInt(r.kills),
          }))
      };
      if (payload.results.length === 0) {
        alert('Please select at least one participating team.');
        return;
      }
      await api.post(`/matches/${entryMatch.id}/results`, payload);
      setEntryMatch(null);
      fetchMatches();
    } catch (err) {
      alert(err.message || 'Failed to submit results.');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      <div>
        <h1 style={{ fontSize: 'var(--text-2xl)', fontWeight: 900, textTransform: 'uppercase', color: 'var(--neon)' }}>
          ⚔️ Match & Score Entry
        </h1>
        <p style={{ color: 'var(--text-secondary)' }}>Record tournament match results and trigger leaderboard points calculations.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 'var(--space-6)', flexWrap: 'wrap' }}>
        {/* Matches Grid */}
        <Card style={{ border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ textTransform: 'uppercase', fontSize: 'var(--text-base)', fontWeight: 800, color: 'var(--neon)' }}>
              🎮 Match Schedule
            </h3>
            <select
              className="form-input"
              value={selectedTourneyId}
              onChange={(e) => setSelectedTourneyId(e.target.value)}
              style={{ width: '220px' }}
            >
              {tournaments.map(t => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>

          {matchesLoading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-8)' }}>
              <div className="loading-spinner" />
            </div>
          ) : matches.length === 0 ? (
            <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)', textAlign: 'center', padding: '20px 0' }}>
              No matches scheduled for this tournament.
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              {matches.map((m) => (
                <div key={m.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: 'var(--space-3)' }}>
                  <div>
                    <strong style={{ fontSize: 'var(--text-sm)' }}>Match #{m.match_number}</strong>
                    <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
                      Date: {formatDate(m.date)}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <span style={{
                      padding: '2px 8px',
                      borderRadius: 'var(--radius-sm)',
                      background: m.status === 'completed' ? 'rgba(255,255,255,0.05)' : 'rgba(255,165,0,0.05)',
                      color: m.status === 'completed' ? 'var(--text-secondary)' : 'var(--warning)',
                      fontSize: 'var(--text-xs)',
                      textTransform: 'uppercase',
                      fontWeight: 700,
                    }}>
                      {m.status}
                    </span>
                    <Button variant="primary" size="sm" onClick={() => handleOpenResults(m)}>
                      Enter Scores
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Create Match Panel */}
        <Card style={{ border: '1px solid var(--border)', height: 'fit-content' }}>
          <h3 style={{ textTransform: 'uppercase', fontSize: 'var(--text-base)', fontWeight: 800, color: 'var(--text)', marginBottom: 'var(--space-4)' }}>
            ➕ Schedule Match
          </h3>
          <form onSubmit={handleCreateMatch} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            <div className="form-group">
              <label className="form-label">Match Number</label>
              <input
                type="number"
                className="form-input"
                required
                min="1"
                placeholder="e.g. 1"
                value={matchNumber}
                onChange={(e) => setMatchNumber(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Match Date</label>
              <input
                type="date"
                className="form-input"
                value={matchDate}
                onChange={(e) => setMatchDate(e.target.value)}
              />
            </div>

            <Button type="submit" variant="primary" style={{ width: '100%' }}>
              Create Match Slot
            </Button>
          </form>
        </Card>
      </div>

      {/* Results Entry Modal */}
      {entryMatch && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.85)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 'var(--z-modal)',
          padding: 'var(--space-4)',
        }}>
          <div className="glass-dark" style={{
            width: '100%',
            maxWidth: '650px',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border)',
            padding: 'var(--space-6)',
            maxHeight: '90vh',
            overflowY: 'auto',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)' }}>
              <h2 style={{ fontSize: 'var(--text-md)', fontWeight: 800, textTransform: 'uppercase', color: 'var(--neon)' }}>
                ⚔️ Match #{entryMatch.match_number} Score Entry
              </h2>
              <button onClick={() => setEntryMatch(null)} style={{ background: 'transparent', border: 'none', color: 'var(--text)', fontSize: 'var(--text-lg)', cursor: 'pointer' }}>✕</button>
            </div>

            {teamsLoading ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-8)' }}>
                <div className="loading-spinner" />
              </div>
            ) : registeredTeams.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '20px' }}>
                <p style={{ color: 'var(--text-secondary)' }}>No approved teams found for this tournament.</p>
                <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>Go to Registrations management and approve teams first.</p>
              </div>
            ) : (
              <form onSubmit={handleResultsSubmit}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', marginBottom: 'var(--space-6)' }}>
                  {resultsData.map((res, idx) => (
                    <div key={res.team_id} style={{
                      display: 'grid',
                      gridTemplateColumns: '2fr 1fr 1fr 1fr',
                      gap: 'var(--space-3)',
                      alignItems: 'center',
                      padding: 'var(--space-3)',
                      background: res.participated ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.005)',
                      opacity: res.participated ? 1 : 0.5,
                      border: '1px solid var(--border)',
                      borderRadius: 'var(--radius-md)',
                      transition: 'all 0.2s ease',
                    }}>
                      <div>
                        <strong style={{ fontSize: 'var(--text-sm)' }}>{res.team_name}</strong>
                        <div style={{ fontSize: 'var(--text-2xs)', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>{res.team_code}</div>
                      </div>
                      <div className="form-group" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <input
                          type="checkbox"
                          id={`part-${res.team_id}`}
                          checked={res.participated}
                          onChange={(e) => handleResultChange(idx, 'participated', e.target.checked)}
                          style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                        />
                        <label htmlFor={`part-${res.team_id}`} className="form-label" style={{ margin: 0, cursor: 'pointer', fontSize: '11px', textTransform: 'uppercase', fontWeight: 700 }}>
                          Played
                        </label>
                      </div>
                      <div className="form-group" style={{ margin: 0 }}>
                        <label className="form-label" style={{ fontSize: '10px' }}>Rank</label>
                        <input
                          type="number"
                          className="form-input"
                          min="1"
                          required={res.participated}
                          disabled={!res.participated}
                          value={res.rank}
                          onChange={(e) => handleResultChange(idx, 'rank', e.target.value)}
                        />
                      </div>
                      <div className="form-group" style={{ margin: 0 }}>
                        <label className="form-label" style={{ fontSize: '10px' }}>Kills</label>
                        <input
                          type="number"
                          className="form-input"
                          min="0"
                          required={res.participated}
                          disabled={!res.participated}
                          value={res.kills}
                          onChange={(e) => handleResultChange(idx, 'kills', e.target.value)}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                  <Button type="button" variant="outline" onClick={() => setEntryMatch(null)}>Cancel</Button>
                  <Button type="submit" variant="primary">Submit Results</Button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
