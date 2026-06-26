import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../utils/api';
import { formatDate } from '../../utils/helpers';
import Button from '../../components/UI/Button';
import Card from '../../components/UI/Card';
import { generateCertificateHTML } from '../../utils/certificateGenerator';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

export default function AdminCertificates() {
  const [activeTab, setActiveTab] = useState('generator');
  const [certs, setCerts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');

  const [form, setForm] = useState({
    type: 'certificate',
    template_id: 1,
    player_name: '',
    department: '',
    team_name: '',
    tournament_name: 'Bhima Winter Clash 2026',
    position: 'Champion',
    title: 'GAMING ACHIEVEMENT',
    award_type: 'Champion',
    issued_date: new Date().toISOString().split('T')[0],
    cert_id: `BMA-${new Date().getFullYear()}-${Math.floor(Math.random()*10000).toString().padStart(4, '0')}`,
    achievement_badge: '🏆',
  });

  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editForm, setEditForm] = useState(null);

  const templatesList = [
    { id: 1, name: 'Cyber Neon' },
    { id: 3, name: 'Futuristic Esports' },
    { id: 2, name: 'Championship Gold' },
    { id: 4, name: 'Achievement Award' },
    { id: 5, name: 'MVP Award' }
  ];

  const badgeOptions = ['🏆', '🏅', '🥇', '🥈', '🥉', '🎖️', '⭐', '🔥', '👑', '🎯', '⚔️', '🛡️'];

  const positions = ['Champion', 'Runner-Up', 'MVP', 'Top Fragger', 'Kill Leader', 'Best Captain', 'Department Champion', 'Participant', 'Finalist'];

  useEffect(() => {
    if (activeTab === 'issued') fetchCerts();
  }, [search, activeTab]);

  const fetchCerts = async () => {
    setLoading(true);
    try {
      const data = await api.get('/certificates', { search });
      setCerts(data.certificates || []);
    } catch (error) {
      console.error('Error fetching certs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      await api.post('/certificates', {
        ...form,
        type: form.type,
      });
      alert(`${form.type === 'certificate' ? 'Certificate' : 'Achievement'} Generated Successfully!`);
      setActiveTab('issued');
    } catch (error) {
      console.error('Generation error:', error);
      alert('Failed to generate certificate.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this certificate?')) return;
    try {
      await api.delete(`/certificates/${id}`);
      fetchCerts();
    } catch (err) {
      console.error('Delete error', err);
    }
  };

  const openEditModal = (cert) => {
    setEditForm({
      id: cert.id,
      player_name: cert.player_name || '',
      team_name: cert.team_name || '',
      department: cert.department || '',
      tournament_name: cert.tournament_name || '',
      position: cert.position || '',
      issued_date: cert.issued_date ? new Date(cert.issued_date).toISOString().split('T')[0] : '',
    });
    setEditModalOpen(true);
  };

  const handleEditSave = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      await api.put(`/certificates/${editForm.id}`, {
        player_name: editForm.player_name,
        team_name: editForm.team_name,
        department: editForm.department,
        tournament_name: editForm.tournament_name,
        position: editForm.position,
        issued_date: editForm.issued_date,
      });
      setEditModalOpen(false);
      fetchCerts();
      alert('Certificate updated successfully.');
    } catch (err) {
      console.error('Update error:', err);
      alert('Failed to update certificate.');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = async (cert) => {
    try {
      const htmlStr = generateCertificateHTML(cert);
      const isAchievement = cert.type === 'achievement';
      const width = isAchievement ? 700 : 1000;
      const height = isAchievement ? 1000 : 700;
      const orientation = isAchievement ? 'portrait' : 'landscape';

      const iframe = document.createElement('iframe');
      iframe.style.position = 'fixed';
      iframe.style.right = '-10000px';
      iframe.style.width = width + 'px';
      iframe.style.height = height + 'px';
      document.body.appendChild(iframe);
      
      iframe.contentWindow.document.open();
      iframe.contentWindow.document.write(htmlStr);
      iframe.contentWindow.document.close();
      
      setTimeout(async () => {
        try {
          const body = iframe.contentWindow.document.body;
          const canvas = await html2canvas(body, { 
            scale: 2, 
            useCORS: true,
            logging: false,
            backgroundColor: '#050505'
          });
          const imgData = canvas.toDataURL('image/png');
          const pdf = new jsPDF({
            orientation: orientation,
            unit: 'px',
            format: [width, height]
          });
          pdf.addImage(imgData, 'PNG', 0, 0, width, height);
          pdf.save(`${cert.cert_id}.pdf`);
        } catch(e) {
          console.error("PDF Gen Error:", e);
          alert('Failed to generate PDF. Make sure images are loaded.');
        } finally {
          document.body.removeChild(iframe);
        }
      }, 1000);
    } catch (err) {
      console.error(err);
      alert('Failed to initialize PDF generation.');
    }
  };

  return (
    <div className="page-wrapper space-y-6">
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
      >
        <div>
          <h1 className="text-3xl font-display font-bold text-white tracking-wider">
            Achievement <span className="text-neon-lime">System</span>
          </h1>
          <p className="text-gray-400 mt-1">Manage and generate premium esports certificates</p>
        </div>
        
        <div className="flex space-x-4">
          <Button 
            variant={activeTab === 'generator' ? 'primary' : 'outline'} 
            onClick={() => setActiveTab('generator')}
          >
            + Generate New
          </Button>
          <Button 
            variant={activeTab === 'issued' ? 'primary' : 'outline'} 
            onClick={() => setActiveTab('issued')}
          >
            Issued Database
          </Button>
        </div>
      </motion.div>

      <AnimatePresence mode="wait">
        {activeTab === 'generator' && (
          <motion.div 
            key="generator"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="grid grid-cols-1 xl:grid-cols-12 gap-6"
          >
            <Card className="p-6 xl:col-span-4 h-fit border-gray-800 bg-[#0a0a0a]">
              <h2 className="text-xl font-bold text-white mb-6 border-b border-gray-800 pb-4">Generator Settings</h2>
              
              <form onSubmit={handleGenerate} className="space-y-4">
                <div className="flex gap-4 mb-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="radio" 
                      name="cert_type" 
                      value="certificate"
                      checked={form.type === 'certificate'}
                      onChange={(e) => setForm({...form, type: e.target.value})}
                      className="accent-neon-lime"
                    />
                    <span className="text-gray-300 font-medium">Certificate</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="radio" 
                      name="cert_type" 
                      value="achievement"
                      checked={form.type === 'achievement'}
                      onChange={(e) => setForm({...form, type: e.target.value})}
                      className="accent-neon-lime"
                    />
                    <span className="text-gray-300 font-medium">Achievement</span>
                  </label>
                </div>
                
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Select Theme Template</label>
                  <div className="grid grid-cols-1 gap-2">
                    {templatesList.map(t => (
                      <div 
                        key={t.id}
                        onClick={() => setForm({...form, template_id: t.id})}
                        className={`cursor-pointer border p-2 rounded flex items-center gap-3 transition-colors ${form.template_id === t.id ? 'border-neon-lime bg-neon-lime/10' : 'border-gray-800 hover:border-gray-600 bg-black/30'}`}
                      >
                        <div className={`w-3 h-3 rounded-full border ${form.template_id === t.id ? 'border-neon-lime bg-neon-lime' : 'border-gray-500'}`}></div>
                        <span className={`font-medium text-sm ${form.template_id === t.id ? 'text-neon-lime' : 'text-gray-300'}`}>{t.name}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="block text-sm text-gray-400 mb-1">Player Name</label>
                    <input 
                      type="text" 
                      className="w-full bg-gray-900 border border-gray-800 rounded px-3 py-2 text-white focus:border-neon-lime outline-none"
                      value={form.player_name}
                      onChange={e => setForm({...form, player_name: e.target.value})}
                      required
                      placeholder="e.g. Scump"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Department</label>
                    <input 
                      type="text" 
                      className="w-full bg-gray-900 border border-gray-800 rounded px-3 py-2 text-white focus:border-neon-lime outline-none"
                      value={form.department}
                      onChange={e => setForm({...form, department: e.target.value})}
                      placeholder="e.g. CSE"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Team</label>
                    <input 
                      type="text" 
                      className="w-full bg-gray-900 border border-gray-800 rounded px-3 py-2 text-white focus:border-neon-lime outline-none"
                      value={form.team_name}
                      onChange={e => setForm({...form, team_name: e.target.value})}
                      placeholder="e.g. OpTic"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-1">Tournament</label>
                  <input 
                    type="text" 
                    className="w-full bg-gray-900 border border-gray-800 rounded px-3 py-2 text-white focus:border-neon-lime outline-none"
                    value={form.tournament_name}
                    onChange={e => setForm({...form, tournament_name: e.target.value})}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Achievement / Position</label>
                    <select
                      className="w-full bg-gray-900 border border-gray-800 rounded px-3 py-2 text-white focus:border-neon-lime outline-none"
                      style={{ colorScheme: 'dark' }}
                      value={positions.includes(form.position) ? form.position : 'Other'}
                      onChange={e => {
                        const val = e.target.value;
                        if(val === 'Other') {
                          setForm({...form, position: '', award_type: ''});
                        } else {
                          setForm({...form, position: val, award_type: val});
                        }
                      }}
                    >
                      {positions.map(p => <option key={p} value={p} className="bg-gray-900 text-white">{p}</option>)}
                      <option value="Other" className="bg-gray-900 text-white">Other (Custom)</option>
                    </select>
                  </div>
                  {!positions.includes(form.position) && form.position !== '' && form.position !== undefined ? (
                    <div>
                      <label className="block text-sm text-gray-400 mb-1">Custom Achievement</label>
                      <input 
                        type="text" 
                        className="w-full bg-gray-900 border border-gray-800 rounded px-3 py-2 text-white focus:border-neon-lime outline-none"
                        value={form.position}
                        onChange={e => setForm({...form, position: e.target.value, award_type: e.target.value})}
                      />
                    </div>
                  ) : (
                    <div>
                      <label className="block text-sm text-gray-400 mb-1">Badge</label>
                      <select
                        className="w-full bg-gray-900 border border-gray-800 rounded px-3 py-2 text-white focus:border-neon-lime outline-none text-xl"
                        style={{ colorScheme: 'dark' }}
                        value={form.achievement_badge}
                        onChange={e => setForm({...form, achievement_badge: e.target.value})}
                      >
                        {badgeOptions.map(b => <option key={b} value={b} className="bg-gray-900 text-white">{b}</option>)}
                      </select>
                    </div>
                  )}
                  {(!positions.includes(form.position) && form.position !== '' && form.position !== undefined) && (
                    <div className="col-span-2">
                      <label className="block text-sm text-gray-400 mb-1">Badge</label>
                      <select
                        className="w-full bg-gray-900 border border-gray-800 rounded px-3 py-2 text-white focus:border-neon-lime outline-none text-xl"
                        style={{ colorScheme: 'dark' }}
                        value={form.achievement_badge}
                        onChange={e => setForm({...form, achievement_badge: e.target.value})}
                      >
                        {badgeOptions.map(b => <option key={b} value={b} className="bg-gray-900 text-white">{b}</option>)}
                      </select>
                    </div>
                  )}
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Date</label>
                    <input 
                      type="date" 
                      className="w-full bg-gray-900 border border-gray-800 rounded px-3 py-2 text-white focus:border-neon-lime outline-none"
                      value={form.issued_date}
                      onChange={e => setForm({...form, issued_date: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Certificate ID</label>
                    <input 
                      type="text" 
                      className="w-full bg-gray-900 border border-gray-800 rounded px-3 py-2 text-white focus:border-neon-lime outline-none"
                      value={form.cert_id}
                      onChange={e => setForm({...form, cert_id: e.target.value})}
                    />
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-800">
                  <Button type="submit" variant="primary" className="w-full" disabled={loading}>
                    {loading ? 'Generating...' : 'Issue Certificate'}
                  </Button>
                </div>
              </form>
            </Card>

            <Card className="p-0 xl:col-span-8 bg-[#050505] overflow-hidden border border-gray-800 h-fit">
              <div className="bg-gray-900 px-4 py-3 flex justify-between items-center border-b border-gray-800">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  <span className="ml-4 text-sm font-mono text-gray-400">Live Preview (Scale: 1000x700)</span>
                </div>
                <Button size="sm" variant="outline" onClick={() => {
                  const blob = new Blob([generateCertificateHTML(form)], {type: 'text/html'});
                  const url = URL.createObjectURL(blob);
                  window.open(url, '_blank');
                }}>
                  Open Full Preview
                </Button>
              </div>
              <div className="w-full overflow-auto bg-black flex justify-center items-center py-10" style={{ minHeight: '600px' }}>
                <div style={{ width: '1000px', height: '700px', transformOrigin: 'top center', transform: 'scale(0.8)' }}>
                  <iframe 
                    srcDoc={generateCertificateHTML(form)}
                    style={{ width: '1000px', height: '700px', border: 'none', background: 'transparent' }}
                    title="Live Preview"
                  />
                </div>
              </div>
            </Card>
          </motion.div>
        )}

        {activeTab === 'issued' && (
          <motion.div
            key="issued"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <Card className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-white">Issued Database</h2>
                <input 
                  type="text"
                  placeholder="Search by name, ID..."
                  className="bg-gray-900 border border-gray-800 rounded px-4 py-2 text-white focus:border-neon-lime outline-none"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-gray-800 text-gray-400 text-sm">
                      <th className="py-3 px-4 font-medium uppercase">ID</th>
                      <th className="py-3 px-4 font-medium uppercase">Player</th>
                      <th className="py-3 px-4 font-medium uppercase">Award</th>
                      <th className="py-3 px-4 font-medium uppercase">Template</th>
                      <th className="py-3 px-4 font-medium uppercase">Date</th>
                      <th className="py-3 px-4 font-medium uppercase text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr><td colSpan="6" className="py-8 text-center text-gray-500">Loading...</td></tr>
                    ) : certs.length === 0 ? (
                      <tr><td colSpan="6" className="py-8 text-center text-gray-500">No certificates found.</td></tr>
                    ) : certs.map((c) => (
                      <tr key={c.id} className="border-b border-gray-800/50 hover:bg-white/5 transition-colors">
                        <td className="py-3 px-4 font-mono text-xs text-gray-400">{c.cert_id}</td>
                        <td className="py-3 px-4">
                          <div className="font-bold text-white">{c.player_name}</div>
                          <div className="text-xs text-neon-lime">{c.team_name}</div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <span className="text-xl">{c.achievement_badge || '🏆'}</span>
                            <span className="text-sm text-gray-300">{c.title || c.award_type || c.position || 'Award'}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-400">
                          Theme {c.template_id || 1}
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-400">{formatDate(c.issued_date)}</td>
                        <td className="py-3 px-4 text-right space-x-2">
                          <Button variant="outline" size="sm" onClick={() => handleDownloadPDF(c)}>
                            PDF
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => openEditModal(c)}>
                            Edit
                          </Button>
                          <Button variant="danger" size="sm" onClick={() => handleDelete(c.id)}>
                            Del
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit Certificate Modal */}
      {editModalOpen && editForm && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.85)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 5000,
          padding: '20px',
        }}>
          <div className="glass-dark" style={{
            width: '100%',
            maxWidth: '500px',
            borderRadius: '12px',
            border: '1px solid var(--border)',
            padding: '24px',
            background: '#0a0a0a',
          }}>
            <h2 className="text-xl font-bold text-white mb-6 border-b border-gray-800 pb-4">Edit Certificate</h2>
            <form onSubmit={handleEditSave} className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Player Name</label>
                <input 
                  type="text" 
                  className="w-full bg-gray-900 border border-gray-800 rounded px-3 py-2 text-white focus:border-neon-lime outline-none"
                  value={editForm.player_name}
                  onChange={e => setEditForm({...editForm, player_name: e.target.value})}
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Team Name</label>
                  <input 
                    type="text" 
                    className="w-full bg-gray-900 border border-gray-800 rounded px-3 py-2 text-white focus:border-neon-lime outline-none"
                    value={editForm.team_name}
                    onChange={e => setEditForm({...editForm, team_name: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Department</label>
                  <input 
                    type="text" 
                    className="w-full bg-gray-900 border border-gray-800 rounded px-3 py-2 text-white focus:border-neon-lime outline-none"
                    value={editForm.department}
                    onChange={e => setEditForm({...editForm, department: e.target.value})}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Tournament Name</label>
                <input 
                  type="text" 
                  className="w-full bg-gray-900 border border-gray-800 rounded px-3 py-2 text-white focus:border-neon-lime outline-none"
                  value={editForm.tournament_name}
                  onChange={e => setEditForm({...editForm, tournament_name: e.target.value})}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Position / Award</label>
                  <input 
                    type="text" 
                    className="w-full bg-gray-900 border border-gray-800 rounded px-3 py-2 text-white focus:border-neon-lime outline-none"
                    value={editForm.position}
                    onChange={e => setEditForm({...editForm, position: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Date</label>
                  <input 
                    type="date" 
                    className="w-full bg-gray-900 border border-gray-800 rounded px-3 py-2 text-white focus:border-neon-lime outline-none"
                    value={editForm.issued_date}
                    onChange={e => setEditForm({...editForm, issued_date: e.target.value})}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-4 mt-2 border-t border-gray-800">
                <Button type="button" variant="outline" onClick={() => setEditModalOpen(false)}>Cancel</Button>
                <Button type="submit" variant="primary">Save Changes</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
