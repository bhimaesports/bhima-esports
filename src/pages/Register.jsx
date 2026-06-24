import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import Button from '../components/UI/Button';
import Card from '../components/UI/Card';

const DEPARTMENTS = [
  { id: 1, name: 'Artificial Intelligence & Machine Learning', code: 'AIML' },
  { id: 2, name: 'Biomedical Engineering', code: 'BME' },
  { id: 3, name: 'Computer Science & Engineering', code: 'CSE' },
  { id: 4, name: 'Civil Engineering', code: 'CIVIL' },
  { id: 5, name: 'Electronics & Communication Engineering', code: 'ECE' },
  { id: 6, name: 'Electrical & Electronics Engineering', code: 'EEE' },
  { id: 7, name: 'Mechanical Engineering', code: 'MECH' },
  { id: 8, name: 'Mining Engineering', code: 'MIN' },
];

const YEARS = [
  { value: 1, label: '1st Year' },
  { value: 2, label: '2nd Year' },
  { value: 3, label: '3rd Year' },
  { value: 4, label: '4th Year' },
];

export default function Register() {
  const [tournaments, setTournaments] = useState([]);
  const [tournamentsLoading, setTournamentsLoading] = useState(true);
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successData, setSuccessData] = useState(null);
  const [logoFile, setLogoFile] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    tournament_id: '',
    team_name: '',
    department_id: '',
    year: '1',
    captain_name: '',
    captain_roll: '',
    captain_phone: '',
    leader_uid: '',
    leader_ign: '',
    motto: '',
    players: [
      { name: '', roll_number: '', uid: '', year: '1' }, // Player 1 (Captain)
      { name: '', roll_number: '', uid: '', year: '1' }, // Player 2
      { name: '', roll_number: '', uid: '', year: '1' }, // Player 3
      { name: '', roll_number: '', uid: '', year: '1' }, // Player 4
      { name: '', roll_number: '', uid: '', year: '1' }, // Player 5
      { name: '', roll_number: '', uid: '', year: '1' }, // Player 6 (Substitute)
    ]
  });

  useEffect(() => {
    api.get('/tournaments', { status: 'open' })
      .then((data) => {
        const list = data.tournaments || data || [];
        setTournaments(list);
        if (list.length > 0) {
          setFormData(prev => ({ ...prev, tournament_id: list[0].id.toString() }));
        }
      })
      .catch(() => {})
      .finally(() => setTournamentsLoading(false));
  }, []);

  const handleTextChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handlePlayerChange = (index, field, value) => {
    setFormData(prev => {
      const list = [...prev.players];
      list[index] = { ...list[index], [field]: value };
      return { ...prev, players: list };
    });
  };

  const validateStep = () => {
    setError('');
    if (step === 1) {
      if (!formData.tournament_id) return 'Please select a tournament.';
      if (!formData.team_name.trim()) return 'Team name is required.';
      if (!formData.department_id) return 'Department is required.';
      if (!formData.year) return 'Year is required.';
    }
    if (step === 2) {
      if (!formData.captain_name.trim()) return 'Captain name is required.';
      if (!formData.captain_roll.trim()) return 'Captain Roll/Registration number is required.';
      if (!formData.captain_phone.trim()) return 'Captain mobile number is required.';
    }
    if (step === 3) {
      // Validate players 1-4 are filled (minimum 4 players for squad)
      for (let i = 0; i < 4; i++) {
        if (!formData.players[i].name.trim() || !formData.players[i].roll_number.trim()) {
          return `Please fill name and roll number for Player ${i + 1}.`;
        }
      }
    }
    if (step === 4) {
      if (!formData.leader_uid.trim()) return 'In-Game Player UID is required.';
      if (!formData.leader_ign.trim()) return 'In-Game Character Name (IGN) is required.';
    }
    return '';
  };

  const nextStep = () => {
    const err = validateStep();
    if (err) {
      setError(err);
      return;
    }
    setStep(prev => prev + 1);
  };

  const prevStep = () => {
    setError('');
    setStep(prev => prev - 1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const err = validateStep();
    if (err) {
      setError(err);
      return;
    }

    setLoading(true);
    setError('');

    // Filter empty optional players (5 and 6)
    const activePlayers = formData.players.filter((p, index) => {
      if (index < 4) return true; // Keep first 4 players
      return p.name.trim() !== '' && p.roll_number.trim() !== '';
    }).map(p => ({
      name: p.name.trim(),
      roll_number: p.roll_number.trim(),
      uid: p.uid.trim() || null,
      year: parseInt(p.year)
    }));

    // Auto sync Captain details to Player 1 if empty
    if (!activePlayers[0].name) {
      activePlayers[0].name = formData.captain_name;
      activePlayers[0].roll_number = formData.captain_roll;
      activePlayers[0].uid = formData.leader_uid;
    }

    try {
      const data = new FormData();
      data.append('tournament_id', formData.tournament_id);
      data.append('team_name', formData.team_name.trim());
      data.append('department_id', formData.department_id);
      data.append('year', formData.year);
      data.append('captain_name', formData.captain_name.trim());
      data.append('captain_roll', formData.captain_roll.trim());
      data.append('captain_phone', formData.captain_phone.trim());
      data.append('leader_uid', formData.leader_uid.trim());
      data.append('leader_ign', formData.leader_ign.trim());
      data.append('motto', formData.motto.trim());
      data.append('players', JSON.stringify(activePlayers));
      if (logoFile) {
        data.append('logo', logoFile);
      }

      const result = await api.post('/registrations', data);
      setSuccessData(result);
      setStep(6);
    } catch (err) {
      setError(err.message || 'Registration failed. Make sure the tournament is open and the team name is unique.');
    } finally {
      setLoading(false);
    }
  };

  if (tournamentsLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-16)' }}>
        <div className="loading-spinner" />
      </div>
    );
  }

  if (tournaments.length === 0 && step !== 6) {
    return (
      <div className="page-wrapper container" style={{ paddingTop: 'var(--space-12)', paddingBottom: 'var(--space-16)', textAlign: 'center' }}>
        <div className="glass-dark" style={{ padding: 'var(--space-12)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)' }}>
          <h2 style={{ color: 'var(--neon)', textTransform: 'uppercase', marginBottom: 'var(--space-4)' }}>No Open Tournaments</h2>
          <p style={{ color: 'var(--text-secondary)' }}>There are no tournaments currently accepting registrations. Check back soon!</p>
          <Link to="/tournaments" style={{ display: 'inline-block', marginTop: 'var(--space-6)' }}>
            <Button variant="outline">View All Tournaments</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="page-wrapper container" style={{ paddingTop: 'var(--space-12)', paddingBottom: 'var(--space-16)' }}>
      <div className="section-header" style={{ marginBottom: 'var(--space-8)' }}>
        <div className="accent-line" />
        <h1>Register</h1>
        <p>Complete the form to register your department squad.</p>
      </div>

      {step < 6 && (
        <div style={{ maxWidth: '650px', margin: '0 auto' }}>
          {/* Progress Bar */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-8)', position: 'relative' }}>
            <div style={{
              position: 'absolute',
              top: '50%',
              left: 0,
              right: 0,
              height: '2px',
              background: 'var(--border)',
              zIndex: 1,
              transform: 'translateY(-50%)',
            }} />
            <div style={{
              position: 'absolute',
              top: '50%',
              left: 0,
              width: `${((step - 1) / 4) * 100}%`,
              height: '2px',
              background: 'var(--neon)',
              zIndex: 2,
              transform: 'translateY(-50%)',
              transition: 'width 0.3s ease',
            }} />

            {[1, 2, 3, 4, 5].map((s) => (
              <div
                key={s}
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  background: step >= s ? 'var(--neon)' : 'var(--bg-primary)',
                  border: '2px solid',
                  borderColor: step >= s ? 'var(--neon)' : 'var(--border)',
                  color: step >= s ? 'var(--bg-primary)' : 'var(--text-secondary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                  fontSize: 'var(--text-xs)',
                  zIndex: 3,
                  transition: 'all 0.3s ease',
                }}
              >
                {s}
              </div>
            ))}
          </div>

          <Card style={{ border: '1px solid var(--border)' }}>
            <form onSubmit={handleSubmit}>
              {/* Step 1: Tournament & Team Info */}
              {step === 1 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                  <h3 style={{ textTransform: 'uppercase', color: 'var(--neon)', fontSize: 'var(--text-md)', marginBottom: 'var(--space-2)' }}>Step 1: Team & Tournament Info</h3>
                  <div className="form-group">
                    <label className="form-label">Select Tournament</label>
                    <select
                      className="form-input"
                      name="tournament_id"
                      value={formData.tournament_id}
                      onChange={handleTextChange}
                      required
                    >
                      {tournaments.map(t => (
                        <option key={t.id} value={t.id}>{t.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Team Name</label>
                    <input
                      type="text"
                      className="form-input"
                      name="team_name"
                      value={formData.team_name}
                      onChange={handleTextChange}
                      placeholder="e.g. CSE Titans"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Department</label>
                    <select
                      className="form-input"
                      name="department_id"
                      value={formData.department_id}
                      onChange={handleTextChange}
                      required
                    >
                      <option value="">Choose department...</option>
                      {DEPARTMENTS.map(d => (
                        <option key={d.id} value={d.id}>{d.name} ({d.code})</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Year of Study</label>
                    <select
                      className="form-input"
                      name="year"
                      value={formData.year}
                      onChange={handleTextChange}
                      required
                    >
                      {YEARS.map(y => (
                        <option key={y.value} value={y.value}>{y.label}</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {/* Step 2: Captain Info */}
              {step === 2 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                  <h3 style={{ textTransform: 'uppercase', color: 'var(--neon)', fontSize: 'var(--text-md)', marginBottom: 'var(--space-2)' }}>Step 2: Captain Info</h3>
                  <div className="form-group">
                    <label className="form-label">Captain Name</label>
                    <input
                      type="text"
                      className="form-input"
                      name="captain_name"
                      value={formData.captain_name}
                      onChange={handleTextChange}
                      placeholder="Enter full name"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Captain Roll/Registration No.</label>
                    <input
                      type="text"
                      className="form-input"
                      name="captain_roll"
                      value={formData.captain_roll}
                      onChange={handleTextChange}
                      placeholder="e.g. 22BT210034"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">WhatsApp Mobile Number</label>
                    <input
                      type="tel"
                      className="form-input"
                      name="captain_phone"
                      value={formData.captain_phone}
                      onChange={handleTextChange}
                      placeholder="e.g. 9876543210"
                      required
                    />
                  </div>
                </div>
              )}

              {/* Step 3: Team Roster */}
              {step === 3 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                  <h3 style={{ textTransform: 'uppercase', color: 'var(--neon)', fontSize: 'var(--text-md)', marginBottom: 'var(--space-2)' }}>Step 3: Team Roster (Min 4, Max 6)</h3>
                  <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-xs)', marginBottom: 'var(--space-2)' }}>
                    Player 1 is automatically the Team Captain. Fill details for Players 1-4. Players 5 & 6 are optional substitutes.
                  </p>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', maxHeight: '350px', overflowY: 'auto', paddingRight: '10px' }}>
                    {formData.players.map((p, idx) => (
                      <div key={idx} style={{ padding: 'var(--space-4)', background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)' }}>
                        <h4 style={{ fontSize: 'var(--text-sm)', color: 'var(--text)', marginBottom: 'var(--space-2)' }}>
                          Player {idx + 1} {idx === 0 && '(Captain)'} {idx >= 4 && '(Substitute)'}
                        </h4>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
                          <div className="form-group">
                            <label className="form-label">Full Name</label>
                            <input
                              type="text"
                              className="form-input"
                              value={p.name}
                              onChange={(e) => handlePlayerChange(idx, 'name', e.target.value)}
                              placeholder="Name"
                              required={idx < 4}
                            />
                          </div>
                          <div className="form-group">
                            <label className="form-label">Roll Number</label>
                            <input
                              type="text"
                              className="form-input"
                              value={p.roll_number}
                              onChange={(e) => handlePlayerChange(idx, 'roll_number', e.target.value)}
                              placeholder="Roll No"
                              required={idx < 4}
                            />
                          </div>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)', marginTop: 'var(--space-2)' }}>
                          <div className="form-group">
                            <label className="form-label">In-Game Character UID</label>
                            <input
                              type="text"
                              className="form-input"
                              value={p.uid}
                              onChange={(e) => handlePlayerChange(idx, 'uid', e.target.value)}
                              placeholder="UID (Optional)"
                            />
                          </div>
                          <div className="form-group">
                            <label className="form-label">Year</label>
                            <select
                              className="form-input"
                              value={p.year}
                              onChange={(e) => handlePlayerChange(idx, 'year', e.target.value)}
                            >
                              {YEARS.map(y => (
                                <option key={y.value} value={y.value}>{y.label}</option>
                              ))}
                            </select>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Step 4: Game details */}
              {step === 4 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                  <h3 style={{ textTransform: 'uppercase', color: 'var(--neon)', fontSize: 'var(--text-md)', marginBottom: 'var(--space-2)' }}>Step 4: Game Details</h3>
                  <div className="form-group">
                    <label className="form-label">Captain In-Game Player UID</label>
                    <input
                      type="text"
                      className="form-input"
                      name="leader_uid"
                      value={formData.leader_uid}
                      onChange={handleTextChange}
                      placeholder="e.g. 523689451"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Captain In-Game Character Name (IGN)</label>
                    <input
                      type="text"
                      className="form-input"
                      name="leader_ign"
                      value={formData.leader_ign}
                      onChange={handleTextChange}
                      placeholder="e.g. 𝕭𝖍𝖎𝖒𝖆_𝕭𝖔𝖘𝖘"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Team Logo Image File</label>
                    <input
                      type="file"
                      accept="image/*"
                      className="form-input"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          setLogoFile(e.target.files[0]);
                        }
                      }}
                      style={{ padding: '6px' }}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Team Motto / Description</label>
                    <textarea
                      className="form-input"
                      name="motto"
                      value={formData.motto}
                      onChange={handleTextChange}
                      placeholder="Enter team motto (optional)"
                      rows="3"
                      style={{ resize: 'none' }}
                    />
                  </div>
                </div>
              )}

              {/* Step 5: Review & Submit */}
              {step === 5 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                  <h3 style={{ textTransform: 'uppercase', color: 'var(--neon)', fontSize: 'var(--text-md)', marginBottom: 'var(--space-2)' }}>Step 5: Review details</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
                    <div style={{ borderBottom: '1px solid var(--border)', paddingBottom: '5px' }}>
                      <span style={{ color: 'var(--text)' }}>Tournament:</span>{' '}
                      {tournaments.find(t => t.id.toString() === formData.tournament_id)?.name}
                    </div>
                    <div style={{ borderBottom: '1px solid var(--border)', paddingBottom: '5px' }}>
                      <span style={{ color: 'var(--text)' }}>Team Name:</span> {formData.team_name}
                    </div>
                    <div style={{ borderBottom: '1px solid var(--border)', paddingBottom: '5px' }}>
                      <span style={{ color: 'var(--text)' }}>Department:</span>{' '}
                      {DEPARTMENTS.find(d => d.id.toString() === formData.department_id)?.name}
                    </div>
                    <div style={{ borderBottom: '1px solid var(--border)', paddingBottom: '5px' }}>
                      <span style={{ color: 'var(--text)' }}>Captain:</span> {formData.captain_name} ({formData.captain_roll})
                    </div>
                    <div style={{ borderBottom: '1px solid var(--border)', paddingBottom: '5px' }}>
                      <span style={{ color: 'var(--text)' }}>Captain Phone:</span> {formData.captain_phone}
                    </div>
                    <div style={{ borderBottom: '1px solid var(--border)', paddingBottom: '5px' }}>
                      <span style={{ color: 'var(--text)' }}>Captain UID & IGN:</span> {formData.leader_uid} ({formData.leader_ign})
                    </div>
                    {logoFile && (
                      <div style={{ borderBottom: '1px solid var(--border)', paddingBottom: '5px' }}>
                        <span style={{ color: 'var(--text)' }}>Team Logo Selected:</span> {logoFile.name}
                      </div>
                    )}
                    <div>
                      <span style={{ color: 'var(--text)' }}>Players:</span>
                      <ul style={{ paddingLeft: '20px', marginTop: '5px' }}>
                        {formData.players.filter((p, i) => i < 4 || p.name.trim()).map((p, idx) => (
                          <li key={idx}>{p.name} ({p.roll_number}) {idx >= 4 && '(Substitute)'}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {error && (
                <div style={{
                  padding: 'var(--space-3)',
                  background: 'rgba(255,68,68,0.08)',
                  border: '1px solid rgba(255,68,68,0.2)',
                  borderRadius: 'var(--radius-md)',
                  color: 'var(--error)',
                  fontSize: 'var(--text-sm)',
                  marginTop: 'var(--space-4)',
                }}>
                  ⚠️ {error}
                </div>
              )}

              {/* Actions */}
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 'var(--space-6)', borderTop: '1px solid var(--border)', paddingTop: 'var(--space-4)' }}>
                {step > 1 ? (
                  <Button type="button" variant="outline" onClick={prevStep}>Back</Button>
                ) : <div />}

                {step < 5 ? (
                  <Button type="button" variant="primary" onClick={nextStep}>Continue</Button>
                ) : (
                  <Button type="submit" variant="primary" loading={loading}>Submit Registration</Button>
                )}
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* Step 6: Success Page */}
      {step === 6 && successData && (
        <div style={{ maxWidth: '550px', margin: '0 auto', textAlign: 'center' }}>
          <div style={{ fontSize: '4rem', marginBottom: 'var(--space-2)', animation: 'pulse 1s infinite' }}>🏆</div>
          <h2 style={{ color: 'var(--neon)', textTransform: 'uppercase', fontSize: 'var(--text-2xl)', fontWeight: 900, marginBottom: 'var(--space-2)' }}>
            Registration Successful!
          </h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-6)' }}>
            Your registration request has been submitted and is currently pending admin approval.
          </p>

          <Card style={{ border: '1px solid var(--border)', textAlign: 'left', display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            <div>
              <span style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-xs)', textTransform: 'uppercase' }}>Registration ID</span>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-base)', color: 'var(--neon)', fontWeight: 700 }}>
                {successData.registration_number}
              </div>
            </div>
            <div>
              <span style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-xs)', textTransform: 'uppercase' }}>Team Code</span>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-base)', color: 'var(--text)', fontWeight: 700 }}>
                {successData.team_id}
              </div>
            </div>
            <div>
              <span style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-xs)', textTransform: 'uppercase' }}>Team Name</span>
              <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text)', fontWeight: 500 }}>
                {formData.team_name}
              </div>
            </div>
          </Card>

          <div style={{ marginTop: 'var(--space-8)' }}>
            <Link to="/tournaments">
              <Button variant="primary">Return to Tournaments</Button>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
