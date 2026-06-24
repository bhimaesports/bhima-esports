import { useState, useEffect, useRef } from 'react';
import api from '../../utils/api';
import { formatDate } from '../../utils/helpers';
import Button from '../../components/UI/Button';
import Card from '../../components/UI/Card';
import Badge from '../../components/UI/Badge';

// Libraries for client-side PDF/ZIP generation
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

const DEPARTMENTS = ['AIML', 'BME', 'CSE', 'CIVIL', 'ECE', 'EEE', 'MECH', 'MIN'];
const FONTS = ['Orbitron', 'Rajdhani', 'Montserrat', 'Great Vibes'];
const BORDERS = [
  { id: 'solid', label: 'Solid Neon line' },
  { id: 'double', label: 'Double Gold line' },
  { id: 'dashed', label: 'Dashed line' },
  { id: 'neon-glow', label: 'Neon Cyber Glow' }
];

export default function AdminCertificates() {
  const [activeTab, setActiveTab] = useState('issued'); // 'issued', 'templates', 'editor'

  // Certificates list states
  const [certs, setCerts] = useState([]);
  const [loadingCerts, setLoadingCerts] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCerts, setTotalCerts] = useState(0);

  // Selection states
  const [selectedCerts, setSelectedCerts] = useState([]);

  // Templates states
  const [templates, setTemplates] = useState([]);
  const [loadingTemplates, setLoadingTemplates] = useState(true);

  // Editor states
  const [editingTemplateId, setEditingTemplateId] = useState(null);
  const [templateForm, setTemplateForm] = useState({
    name: '',
    title: '',
    description_template: '',
    signature_name: '',
    signature_designation: '',
    signature_name_2: '',
    signature_designation_2: '',
    signature_image: '',
    signature_image_2: '',
    colors: {
      accent: '#D7FF00',
      text: '#ffffff',
      bg_start: '#0f0f23',
      bg_end: '#16213e',
      border: '#D7FF00',
    },
    typography: {
      title_font: 'Orbitron',
      body_font: 'Rajdhani',
    },
    logo_url: '',
    logo_size: 80,
    logo_position: 'top',
    seal_url: '',
    watermark_text: '',
    border_design: 'solid',
    sponsor_logos: [],
    is_default: false,
  });

  // Issue Certificate Modal from Template
  const [issueModalOpen, setIssueModalOpen] = useState(false);
  const [selectedTemplateForIssue, setSelectedTemplateForIssue] = useState(null);
  const [issueForm, setIssueForm] = useState({
    player_name: '',
    roll_number: '',
    team_name: '',
    department: '',
    tournament_name: '',
    tournament_date: '',
    position: '',
    award_type: '', // e.g. winner, participation, mvp, custom
    title: '',
    description_text: '',
  });

  // Edit Certificate Modal
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingCert, setEditingCert] = useState(null);

  // Revocation Reason Modal
  const [revokeModalOpen, setRevokeModalOpen] = useState(false);
  const [revokeCertId, setRevokeCertId] = useState(null);
  const [revokeReason, setRevokeReason] = useState('');
  const [isBulkRevoke, setIsBulkRevoke] = useState(false);

  // Generation status overlays
  const [generationProgress, setGenerationProgress] = useState(null); // { current, total, text }
  const [actionLoading, setActionLoading] = useState(false);

  // Ref for fitting scaled preview in visual editor
  const previewParentRef = useRef(null);
  const [previewScale, setPreviewScale] = useState(1);

  // Fetch issued certificates
  const fetchCertificates = async () => {
    try {
      setLoadingCerts(true);
      const data = await api.get('/certificates', {
        search: search || undefined,
        type: typeFilter || undefined,
        status: statusFilter || undefined,
        department: deptFilter || undefined,
        page,
        limit: 15,
      });
      setCerts(data.certificates || []);
      setTotalPages(data.pagination?.pages || 1);
      setTotalCerts(data.pagination?.total || 0);
    } catch (err) {
      console.error('Fetch certificates error:', err);
    } finally {
      setLoadingCerts(false);
    }
  };

  // Fetch templates
  const fetchTemplates = async () => {
    try {
      setLoadingTemplates(true);
      const data = await api.get('/certificates/templates');
      setTemplates(data.templates || []);
    } catch (err) {
      console.error('Fetch templates error:', err);
    } finally {
      setLoadingTemplates(false);
    }
  };

  useEffect(() => {
    fetchCertificates();
  }, [search, typeFilter, statusFilter, deptFilter, page]);

  useEffect(() => {
    if (activeTab === 'templates') {
      fetchTemplates();
    }
  }, [activeTab]);

  // Adjust preview scaling
  useEffect(() => {
    if (activeTab === 'editor') {
      const resizeObserver = new ResizeObserver((entries) => {
        for (let entry of entries) {
          const width = entry.contentRect.width;
          const targetScale = Math.min(1, (width - 40) / 1000);
          setPreviewScale(targetScale);
        }
      });
      if (previewParentRef.current) {
        resizeObserver.observe(previewParentRef.current);
      }
      return () => resizeObserver.disconnect();
    }
  }, [activeTab]);

  // Checkbox selections helpers
  const handleSelectCert = (certId) => {
    setSelectedCerts(prev =>
      prev.includes(certId) ? prev.filter(id => id !== certId) : [...prev, certId]
    );
  };

  const handleSelectAllCerts = () => {
    if (selectedCerts.length === certs.length) {
      setSelectedCerts([]);
    } else {
      setSelectedCerts(certs.map(c => c.cert_id));
    }
  };

  // Base64 file loaders
  const handleFileLoad = (e, field) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert('File size exceeds 2MB limit. Please choose a smaller file.');
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        setTemplateForm(prev => ({ ...prev, [field]: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  // Add signature text placeholders logic
  const handleSelectPresetDesc = (preset) => {
    setTemplateForm(prev => ({ ...prev, description_template: preset }));
  };

  // CRUD Templates
  const handleOpenNewTemplate = () => {
    setEditingTemplateId(null);
    setTemplateForm({
      name: 'New Custom Template',
      title: 'Certificate of Achievement',
      description_template: 'For outstanding performance and dedication in the {{tournament_name}} representing team {{team_name}} from the Department of {{department}}.',
      signature_name: 'Bhima Esports Convener',
      signature_designation: 'Convener',
      signature_name_2: 'Bhima Hostel Warden',
      signature_designation_2: 'Warden',
      signature_image: '',
      signature_image_2: '',
      colors: {
        accent: '#D7FF00',
        text: '#ffffff',
        bg_start: '#0f0f23',
        bg_end: '#16213e',
        border: '#D7FF00',
      },
      typography: {
        title_font: 'Orbitron',
        body_font: 'Rajdhani',
      },
      logo_url: '',
      logo_size: 80,
      logo_position: 'top',
      seal_url: '',
      watermark_text: 'BHIMA ESPORTS',
      border_design: 'solid',
      sponsor_logos: [],
      is_default: false,
    });
    setActiveTab('editor');
  };

  const handleEditTemplate = (t) => {
    setEditingTemplateId(t.id);
    let parsedColors = { accent: '#D7FF00', text: '#ffffff', bg_start: '#0f0f23', bg_end: '#16213e', border: '#D7FF00' };
    try { if (t.colors) parsedColors = typeof t.colors === 'string' ? JSON.parse(t.colors) : t.colors; } catch {}

    let parsedTypo = { title_font: 'Orbitron', body_font: 'Rajdhani' };
    try { if (t.typography) parsedTypo = typeof t.typography === 'string' ? JSON.parse(t.typography) : t.typography; } catch {}

    let parsedSponsors = [];
    try { if (t.sponsor_logos) parsedSponsors = typeof t.sponsor_logos === 'string' ? JSON.parse(t.sponsor_logos) : t.sponsor_logos; } catch {}

    setTemplateForm({
      name: t.name || '',
      title: t.title || '',
      description_template: t.description_template || '',
      signature_name: t.signature_name || '',
      signature_designation: t.signature_designation || '',
      signature_name_2: t.signature_name_2 || '',
      signature_designation_2: t.signature_designation_2 || '',
      signature_image: t.signature_image || '',
      signature_image_2: t.signature_image_2 || '',
      colors: parsedColors,
      typography: parsedTypo,
      logo_url: t.logo_url || '',
      logo_size: t.logo_size || 80,
      logo_position: t.logo_position || 'top',
      seal_url: t.seal_url || '',
      watermark_text: t.watermark_text || '',
      border_design: t.border_design || 'solid',
      sponsor_logos: parsedSponsors,
      is_default: t.is_default === 1,
    });
    setActiveTab('editor');
  };

  const handleSaveTemplate = async () => {
    try {
      setActionLoading(true);
      if (editingTemplateId) {
        await api.put(`/certificates/templates/${editingTemplateId}`, templateForm);
        alert('Template saved successfully!');
      } else {
        await api.post('/certificates/templates', templateForm);
        alert('Template created successfully!');
      }
      setActiveTab('templates');
    } catch (err) {
      alert(err.message || 'Failed to save template.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCloneTemplate = async (id) => {
    try {
      setActionLoading(true);
      await api.post(`/certificates/templates/${id}/clone`);
      fetchTemplates();
    } catch (err) {
      alert(err.message || 'Clone failed.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteTemplate = async (id) => {
    if (!window.confirm('Delete this template? Existing certificates using this template will preserve their issued layout, but this template layout cannot be used again.')) return;
    try {
      setActionLoading(true);
      await api.delete(`/certificates/templates/${id}`);
      fetchTemplates();
    } catch (err) {
      alert(err.message || 'Delete failed.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSetDefaultTemplate = async (template) => {
    try {
      setActionLoading(true);
      await api.put(`/certificates/templates/${template.id}`, {
        ...template,
        colors: typeof template.colors === 'string' ? JSON.parse(template.colors) : template.colors,
        typography: typeof template.typography === 'string' ? JSON.parse(template.typography) : template.typography,
        sponsor_logos: typeof template.sponsor_logos === 'string' ? JSON.parse(template.sponsor_logos) : template.sponsor_logos,
        is_default: true
      });
      fetchTemplates();
    } catch (err) {
      alert(err.message || 'Setting default failed.');
    } finally {
      setActionLoading(false);
    }
  };

  // Issue Certificate logic
  const handleOpenIssueModal = (t = null) => {
    // Select default template if none passed
    const activeTemplate = t || templates.find(x => x.is_default) || templates[0];
    if (!activeTemplate) {
      alert('Please create a certificate template first.');
      return;
    }
    setSelectedTemplateForIssue(activeTemplate);

    let parsedColors = { accent: '#D7FF00', text: '#ffffff', bg_start: '#0f0f23', bg_end: '#16213e', border: '#D7FF00' };
    try { if (activeTemplate.colors) parsedColors = typeof activeTemplate.colors === 'string' ? JSON.parse(activeTemplate.colors) : activeTemplate.colors; } catch {}

    let parsedTypo = { title_font: 'Orbitron', body_font: 'Rajdhani' };
    try { if (activeTemplate.typography) parsedTypo = typeof activeTemplate.typography === 'string' ? JSON.parse(activeTemplate.typography) : activeTemplate.typography; } catch {}

    let parsedSponsors = [];
    try { if (activeTemplate.sponsor_logos) parsedSponsors = typeof activeTemplate.sponsor_logos === 'string' ? JSON.parse(activeTemplate.sponsor_logos) : activeTemplate.sponsor_logos; } catch {}

    setIssueForm({
      player_name: '',
      roll_number: '',
      team_name: '',
      department: '',
      tournament_name: '',
      tournament_date: new Date().toISOString().split('T')[0],
      position: '',
      award_type: activeTemplate.name?.toLowerCase().includes('winner') ? 'winner' : activeTemplate.name?.toLowerCase().includes('mvp') ? 'mvp' : 'participation',
      title: activeTemplate.title || '',
      description_text: '',
    });
    setIssueModalOpen(true);
  };

  // Update description template placeholder fields in real-time when inputs change
  useEffect(() => {
    if (!selectedTemplateForIssue) return;
    const descTemplate = selectedTemplateForIssue.description_template || '';
    const formatted = descTemplate
      .replace('{{player_name}}', issueForm.player_name || '_________')
      .replace('{{team_name}}', issueForm.team_name || '_________')
      .replace('{{department}}', issueForm.department || '_________')
      .replace('{{tournament_name}}', issueForm.tournament_name || '_________')
      .replace('{{position}}', issueForm.position || '_________')
      .replace('{{date}}', issueForm.tournament_date || '_________');
    
    setIssueForm(prev => ({ ...prev, description_text: formatted }));
  }, [issueForm.player_name, issueForm.team_name, issueForm.department, issueForm.tournament_name, issueForm.tournament_date, issueForm.position, selectedTemplateForIssue]);

  const handleIssueSubmit = async (e) => {
    e.preventDefault();
    try {
      setActionLoading(true);
      const payload = {
        ...issueForm,
        template_id: selectedTemplateForIssue.id,
        type: selectedTemplateForIssue.name?.toLowerCase().includes('winner') ? 'winner' : selectedTemplateForIssue.name?.toLowerCase().includes('mvp') ? 'mvp' : 'participation',
        colors: typeof selectedTemplateForIssue.colors === 'string' ? JSON.parse(selectedTemplateForIssue.colors) : selectedTemplateForIssue.colors,
        typography: typeof selectedTemplateForIssue.typography === 'string' ? JSON.parse(selectedTemplateForIssue.typography) : selectedTemplateForIssue.typography,
        logo_url: selectedTemplateForIssue.logo_url,
        logo_size: selectedTemplateForIssue.logo_size,
        logo_position: selectedTemplateForIssue.logo_position,
        seal_url: selectedTemplateForIssue.seal_url,
        watermark_text: selectedTemplateForIssue.watermark_text,
        border_design: selectedTemplateForIssue.border_design,
        signature_name: selectedTemplateForIssue.signature_name,
        signature_designation: selectedTemplateForIssue.signature_designation,
        signature_name_2: selectedTemplateForIssue.signature_name_2,
        signature_designation_2: selectedTemplateForIssue.signature_designation_2,
        signature_image: selectedTemplateForIssue.signature_image,
        signature_image_2: selectedTemplateForIssue.signature_image_2,
        sponsor_logos: typeof selectedTemplateForIssue.sponsor_logos === 'string' ? JSON.parse(selectedTemplateForIssue.sponsor_logos) : selectedTemplateForIssue.sponsor_logos,
      };

      await api.post('/certificates', payload);
      setIssueModalOpen(false);
      alert('Certificate issued successfully!');
      fetchCertificates();
    } catch (err) {
      alert(err.message || 'Issue failed.');
    } finally {
      setActionLoading(false);
    }
  };

  // Revoke/Restore/Reissue/Duplicate Actions
  const handleOpenRevokeModal = (certId, bulk = false) => {
    setRevokeCertId(certId);
    setIsBulkRevoke(bulk);
    setRevokeReason('');
    setRevokeModalOpen(true);
  };

  const handleRevokeSubmit = async (e) => {
    e.preventDefault();
    try {
      setActionLoading(true);
      if (isBulkRevoke) {
        for (const certId of selectedCerts) {
          const cert = certs.find(c => c.cert_id === certId);
          if (cert) {
            await api.patch(`/certificates/${cert.id}/status`, { status: 'revoked', revocation_reason: revokeReason });
          }
        }
        alert('Selected certificates revoked.');
        setSelectedCerts([]);
      } else {
        await api.patch(`/certificates/${revokeCertId}/status`, { status: 'revoked', revocation_reason: revokeReason });
        alert('Certificate revoked.');
      }
      setRevokeModalOpen(false);
      fetchCertificates();
    } catch (err) {
      alert(err.message || 'Revocation failed.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRestoreCert = async (cert) => {
    if (!window.confirm('Restore certificate validity and status to Active?')) return;
    try {
      setActionLoading(true);
      await api.patch(`/certificates/${cert.id}/status`, { status: 'active' });
      alert('Certificate restored successfully!');
      fetchCertificates();
    } catch (err) {
      alert(err.message || 'Restore failed.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReissueCert = async (cert) => {
    if (!window.confirm('Reissue certificate? The current certificate will be marked "Reissued" (invalidated) and a new identical certificate with a fresh ID and current date will be generated.')) return;
    try {
      setActionLoading(true);
      const res = await api.post(`/certificates/${cert.id}/reissue`);
      alert(`Reissued successfully. New Certificate ID: ${res.certificate?.cert_id}`);
      fetchCertificates();
    } catch (err) {
      alert(err.message || 'Reissue failed.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDuplicateCert = async (cert) => {
    try {
      setActionLoading(true);
      await api.post(`/certificates/${cert.id}/duplicate`);
      alert('Certificate duplicated successfully.');
      fetchCertificates();
    } catch (err) {
      alert(err.message || 'Duplicate failed.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteCert = async (cert) => {
    if (!window.confirm('WARNING: Permanently delete this certificate record? This is a destructive operation.')) return;
    try {
      setActionLoading(true);
      await api.delete(`/certificates/${cert.id}`);
      alert('Certificate record deleted.');
      fetchCertificates();
    } catch (err) {
      alert(err.message || 'Delete failed.');
    } finally {
      setActionLoading(false);
    }
  };

  // Edit Certificate modal
  const handleOpenEditCertModal = (cert) => {
    setEditingCert(cert);
    setIssueForm({
      player_name: cert.player_name || '',
      roll_number: cert.roll_number || '',
      team_name: cert.team_name || '',
      department: cert.department || '',
      tournament_name: cert.tournament_name || '',
      tournament_date: cert.tournament_date || '',
      position: cert.position || '',
      award_type: cert.award_type || cert.type || '',
      title: cert.title || '',
      description_text: cert.description_text || '',
    });
    setEditModalOpen(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      setActionLoading(true);
      await api.put(`/certificates/${editingCert.id}`, issueForm);
      setEditModalOpen(false);
      alert('Certificate updated successfully!');
      fetchCertificates();
    } catch (err) {
      alert(err.message || 'Failed to update certificate.');
    } finally {
      setActionLoading(false);
    }
  };

  // CLIENT SIDE PDF GENERATION HELPER
  const renderCertHTMLForPDF = (cert) => {
    let colors = { accent: '#D7FF00', text: '#ffffff', bg_start: '#0f0f23', bg_end: '#16213e', border: '#D7FF00' };
    try {
      if (cert.colors) colors = typeof cert.colors === 'string' ? JSON.parse(cert.colors) : cert.colors;
    } catch {}

    let typography = { title_font: 'Orbitron', body_font: 'Rajdhani' };
    try {
      if (cert.typography) typography = typeof cert.typography === 'string' ? JSON.parse(cert.typography) : cert.typography;
    } catch {}

    let borderStyle = '3px solid ' + colors.accent;
    if (cert.border_design === 'double') borderStyle = '6px double ' + colors.accent;
    else if (cert.border_design === 'dashed') borderStyle = '3px dashed ' + colors.accent;
    else if (cert.border_design === 'neon-glow') borderStyle = '3px solid ' + colors.accent + '; box-shadow: 0 0 20px ' + colors.accent + ', inset 0 0 20px ' + colors.accent;

    const logoFlexDirection = cert.logo_position === 'left' ? 'row' : cert.logo_position === 'right' ? 'row-reverse' : 'column';
    const verifyUrl = `http://localhost:5173/verify/${cert.cert_id}`;
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=120x120&color=${colors.accent.replace('#', '')}&bgcolor=15-15-35&data=${encodeURIComponent(verifyUrl)}`;

    return `
      <div class="pdf-cert-wrapper" style="
        width: 1000px;
        height: 700px;
        padding: 10px;
        background: #050505;
        display: flex;
        align-items: center;
        justify-content: center;
        box-sizing: border-box;
      ">
        <div class="pdf-cert-inner" style="
          width: 100%;
          height: 100%;
          background: linear-gradient(135deg, ${colors.bg_start || '#0f0f23'} 0%, ${colors.bg_end || '#16213e'} 100%);
          border: ${borderStyle};
          border-radius: 12px;
          padding: 40px 50px;
          position: relative;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: space-between;
          box-sizing: border-box;
          font-family: '${typography.body_font || 'Rajdhani'}', sans-serif;
          color: ${colors.text || '#ffffff'};
          overflow: hidden;
        ">
          <!-- Inner frame border -->
          <div style="
            content: '';
            position: absolute;
            top: 15px; left: 15px; right: 15px; bottom: 15px;
            border: 1px solid ${colors.accent}25;
            border-radius: 8px;
            pointer-events: none;
            z-index: 1;
          "></div>

          <!-- Revoked watermark if needed -->
          ${cert.status === 'revoked' ? `
            <div style="
              position: absolute;
              inset: 0;
              background: rgba(200, 0, 0, 0.15);
              z-index: 10;
              display: flex;
              justify-content: center;
              align-items: center;
            ">
              <div style="
                border: 6px double #ff3b30;
                color: #ff3b30;
                font-family: '${typography.title_font || 'Orbitron'}', sans-serif;
                font-size: 60px;
                font-weight: 900;
                padding: 10px 30px;
                transform: rotate(-15deg);
                border-radius: 12px;
                box-shadow: 0 0 20px rgba(255, 59, 48, 0.3);
                background: rgba(10, 5, 5, 0.85);
              ">REVOKED</div>
            </div>
          ` : ''}

          <!-- Watermark Text -->
          ${cert.watermark_text ? `
            <div style="
              position: absolute;
              top: 50%;
              left: 50%;
              transform: translate(-50%, -50%) rotate(-25deg);
              font-family: '${typography.title_font || 'Orbitron'}', monospace;
              font-size: 90px;
              font-weight: 900;
              color: ${colors.accent}05;
              white-space: nowrap;
              pointer-events: none;
              z-index: 0;
            ">${cert.watermark_text}</div>
          ` : ''}

          <!-- Header -->
          <div style="
            width: 100%;
            display: flex;
            flex-direction: ${logoFlexDirection};
            align-items: center;
            justify-content: center;
            gap: 20px;
            z-index: 2;
          ">
            <div>
              <img src="${cert.logo_url || '/assets/logo.png'}" style="height: ${cert.logo_size || 80}px; width: auto; object-fit: contain;" />
            </div>
            <div style="
              font-family: '${typography.title_font || 'Orbitron'}', sans-serif;
              font-size: 20px;
              font-weight: 700;
              color: ${colors.accent};
              letter-spacing: 6px;
              text-transform: uppercase;
            ">Bhima Esports</div>
          </div>

          <!-- Body -->
          <div style="
            width: 100%;
            display: flex;
            flex-direction: column;
            align-items: center;
            text-align: center;
            margin-top: 10px;
            z-index: 2;
          ">
            <div style="
              font-family: '${typography.title_font || 'Orbitron'}', sans-serif;
              font-size: 32px;
              font-weight: 900;
              color: ${colors.text || '#ffffff'};
              text-transform: uppercase;
              letter-spacing: 3px;
              margin-bottom: 12px;
            ">${cert.title || 'Certificate'}</div>
            <div style="font-size: 14px; color: #888899; letter-spacing: 4px; text-transform: uppercase; margin-bottom: 10px;">
              This is proudly presented to
            </div>
            <div style="
              font-family: '${typography.title_font || 'Orbitron'}', sans-serif;
              font-size: 36px;
              font-weight: 900;
              color: ${colors.accent};
              text-transform: uppercase;
              letter-spacing: 2px;
              margin-bottom: 6px;
            ">${cert.player_name}</div>
            ${cert.roll_number ? `<div style="font-size: 13px; color: #a1a1aa; letter-spacing: 2px; margin-bottom: 12px;">Roll No: ${cert.roll_number}</div>` : ''}
            <div style="color: #d1d1d6; font-size: 15px; line-height: 1.6; max-width: 750px;">
              ${cert.description_text || `For outstanding participation in the Bhima Esports championship.`}
            </div>
          </div>

          <!-- Footer -->
          <div style="
            width: 100%;
            display: flex;
            align-items: flex-end;
            justify-content: space-between;
            margin-top: 20px;
            z-index: 2;
          ">
            <div style="display: flex; gap: 50px;">
              <div style="display: flex; flex-direction: column; align-items: center; text-align: center; width: 150px;">
                <div style="width: 100%; height: 1px; background: #444; margin-bottom: 8px; position: relative;">
                  ${cert.signature_image ? `<img src="${cert.signature_image}" style="position: absolute; bottom: 2px; left: 50%; transform: translateX(-50%); max-height: 45px; max-width: 120px; object-fit: contain;" />` : ''}
                </div>
                <div style="font-size: 13px; color: #fff; font-weight: 600;">${cert.signature_name || 'Convener'}</div>
                <div style="font-size: 10px; color: #666; text-transform: uppercase; letter-spacing: 1px; margin-top: 2px;">
                  ${cert.signature_designation || 'Convener'}
                </div>
              </div>
              <div style="display: flex; flex-direction: column; align-items: center; text-align: center; width: 150px;">
                <div style="width: 100%; height: 1px; background: #444; margin-bottom: 8px; position: relative;">
                  ${cert.signature_image_2 ? `<img src="${cert.signature_image_2}" style="position: absolute; bottom: 2px; left: 50%; transform: translateX(-50%); max-height: 45px; max-width: 120px; object-fit: contain;" />` : ''}
                </div>
                <div style="font-size: 13px; color: #fff; font-weight: 600;">${cert.signature_name_2 || 'Warden'}</div>
                <div style="font-size: 10px; color: #666; text-transform: uppercase; letter-spacing: 1px; margin-top: 2px;">
                  ${cert.signature_designation_2 || 'Warden'}
                </div>
              </div>
            </div>

            ${cert.qr_code_enabled !== 0 ? `
              <div style="
                display: flex;
                align-items: center;
                gap: 12px;
                background: rgba(255, 255, 255, 0.02);
                border: 1px solid rgba(255, 255, 255, 0.05);
                padding: 8px 12px;
                border-radius: 6px;
              ">
                <div style="text-align: left; font-family: monospace; font-size: 10px; color: #888; line-height: 1.4;">
                  ID: <strong style="color: ${colors.accent};">${cert.cert_id}</strong><br />
                  Status: <strong>${cert.status.toUpperCase()}</strong><br />
                  Verify at Bhima Esports
                </div>
                <img src="${qrCodeUrl}" style="width: 50px; height: 50px; border: 1px solid ${colors.accent}44; border-radius: 4px;" />
              </div>
            ` : `
              <div style="font-family: monospace; font-size: 11px; color: #555;">ID: ${cert.cert_id}</div>
            `}
          </div>
        </div>
      </div>
    `;
  };

  const handleDownloadPDF = async (cert) => {
    try {
      setGenerationProgress({ current: 1, total: 1, text: `Generating PDF for ${cert.player_name}...` });

      // Inject temporary offscreen element
      const tempDiv = document.createElement('div');
      tempDiv.style.position = 'absolute';
      tempDiv.style.left = '-9999px';
      tempDiv.style.top = '-9999px';
      tempDiv.innerHTML = renderCertHTMLForPDF(cert);
      document.body.appendChild(tempDiv);

      // Give images and WebFonts a split second to resolve
      await new Promise(resolve => setTimeout(resolve, 800));

      const certElement = tempDiv.querySelector('.pdf-cert-wrapper');
      const canvas = await html2canvas(certElement, {
        useCORS: true,
        scale: 2, // High DPI print resolution
      });

      document.body.removeChild(tempDiv);

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4',
      });

      pdf.addImage(imgData, 'PNG', 0, 0, 297, 210);
      pdf.save(`${cert.cert_id}_${cert.player_name.replace(/\s+/g, '_')}.pdf`);
    } catch (err) {
      console.error(err);
      alert('Failed to generate high-resolution PDF.');
    } finally {
      setGenerationProgress(null);
    }
  };

  const handleBulkDownloadPDFs = async () => {
    if (selectedCerts.length === 0) return;
    try {
      const zip = new JSZip();
      const total = selectedCerts.length;
      
      for (let i = 0; i < total; i++) {
        const certId = selectedCerts[i];
        const cert = certs.find(c => c.cert_id === certId);
        if (!cert) continue;

        setGenerationProgress({
          current: i + 1,
          total,
          text: `Rendering cert ${i + 1} of ${total}: ${cert.player_name}...`
        });

        const tempDiv = document.createElement('div');
        tempDiv.style.position = 'absolute';
        tempDiv.style.left = '-9999px';
        tempDiv.style.top = '-9999px';
        tempDiv.innerHTML = renderCertHTMLForPDF(cert);
        document.body.appendChild(tempDiv);

        await new Promise(resolve => setTimeout(resolve, 600));

        const certElement = tempDiv.querySelector('.pdf-cert-wrapper');
        const canvas = await html2canvas(certElement, {
          useCORS: true,
          scale: 2,
        });

        document.body.removeChild(tempDiv);

        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF({
          orientation: 'landscape',
          unit: 'mm',
          format: 'a4',
        });
        pdf.addImage(imgData, 'PNG', 0, 0, 297, 210);

        const pdfBlob = pdf.output('blob');
        const fileName = `${cert.cert_id}_${cert.player_name.replace(/\s+/g, '_')}.pdf`;
        zip.file(fileName, pdfBlob);
      }

      setGenerationProgress({ current: total, total, text: 'Zipping packages...' });
      const content = await zip.generateAsync({ type: 'blob' });
      saveAs(content, `Bhima_Esports_Issued_Certificates.zip`);
      
      setSelectedCerts([]);
    } catch (err) {
      console.error(err);
      alert('Failed to compile bulk downloads.');
    } finally {
      setGenerationProgress(null);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedCerts.length === 0) return;
    if (!window.confirm(`WARNING: Permanently delete the ${selectedCerts.length} selected certificate records? This cannot be undone.`)) return;

    try {
      setActionLoading(true);
      for (const certId of selectedCerts) {
        const cert = certs.find(c => c.cert_id === certId);
        if (cert) {
          await api.delete(`/certificates/${cert.id}`);
        }
      }
      alert('Selected certificate records deleted successfully.');
      setSelectedCerts([]);
      fetchCertificates();
    } catch (err) {
      alert(err.message || 'Bulk delete failed.');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: 'var(--text-2xl)', fontWeight: 900, textTransform: 'uppercase', color: 'var(--neon)' }}>
            📜 Credentials & Certificates
          </h1>
          <p style={{ color: 'var(--text-secondary)' }}>
            Manage visual layout designs, create new templates, or lookup/issue awards.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <Button variant="outline" onClick={handleOpenNewTemplate}>
            🎨 New Template
          </Button>
          <Button variant="primary" onClick={() => handleOpenIssueModal()}>
            + Issue Award
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="tab-container" style={{ borderBottom: '1px solid var(--border)', display: 'flex', gap: '12px' }}>
        <button
          onClick={() => setActiveTab('issued')}
          className={`tab-btn ${activeTab === 'issued' ? 'active' : ''}`}
          style={{
            padding: '12px 20px',
            background: 'transparent',
            border: 'none',
            borderBottom: activeTab === 'issued' ? '2.5px solid var(--neon)' : '2.5px solid transparent',
            color: activeTab === 'issued' ? 'var(--neon)' : 'var(--text-secondary)',
            fontWeight: 800,
            textTransform: 'uppercase',
            cursor: 'pointer'
          }}
        >
          🎟️ Issued Records
        </button>
        <button
          onClick={() => setActiveTab('templates')}
          className={`tab-btn ${activeTab === 'templates' ? 'active' : ''}`}
          style={{
            padding: '12px 20px',
            background: 'transparent',
            border: 'none',
            borderBottom: activeTab === 'templates' ? '2.5px solid var(--neon)' : '2.5px solid transparent',
            color: activeTab === 'templates' ? 'var(--neon)' : 'var(--text-secondary)',
            fontWeight: 800,
            textTransform: 'uppercase',
            cursor: 'pointer'
          }}
        >
          🎨 Layout Templates
        </button>
        {activeTab === 'editor' && (
          <button
            className="tab-btn active"
            style={{
              padding: '12px 20px',
              background: 'transparent',
              border: 'none',
              borderBottom: '2.5px solid var(--neon)',
              color: 'var(--neon)',
              fontWeight: 800,
              textTransform: 'uppercase',
              cursor: 'default'
            }}
          >
            🛠️ Visual Design Editor
          </button>
        )}
      </div>

      {/* ─── TAB 1: ISSUED CERTIFICATES ───────────────────────────────────────── */}
      {activeTab === 'issued' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          {/* Filters Toolbar */}
          <div className="glass-dark" style={{
            padding: 'var(--space-4)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border)',
            display: 'flex',
            flexWrap: 'wrap',
            gap: '12px',
            alignItems: 'center'
          }}>
            <input
              type="text"
              className="form-input"
              placeholder="Search Name, ID, Team..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ flex: '1', minWidth: '200px', margin: 0 }}
            />
            <select
              className="form-input"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              style={{ width: '160px', margin: 0 }}
            >
              <option value="">All Types</option>
              <option value="participation">Participation</option>
              <option value="winner">Winner</option>
              <option value="mvp">MVP</option>
            </select>
            <select
              className="form-input"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{ width: '140px', margin: 0 }}
            >
              <option value="">All Statuses</option>
              <option value="active">Active</option>
              <option value="revoked">Revoked</option>
              <option value="reissued">Reissued</option>
            </select>
            <select
              className="form-input"
              value={deptFilter}
              onChange={(e) => setDeptFilter(e.target.value)}
              style={{ width: '160px', margin: 0 }}
            >
              <option value="">All Departments</option>
              {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>

          {/* Bulk Toolbar */}
          {selectedCerts.length > 0 && (
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '12px 16px',
              background: 'rgba(215,255,0,0.06)',
              border: '1.5px solid var(--neon)',
              borderRadius: 'var(--radius-md)',
            }}>
              <span style={{ fontWeight: 700, color: 'var(--neon)', fontSize: 'var(--text-sm)' }}>
                ⚡ {selectedCerts.length} certificates selected
              </span>
              <div style={{ display: 'flex', gap: '8px' }}>
                <Button variant="primary" size="sm" onClick={handleBulkDownloadPDFs}>
                  Download ZIP
                </Button>
                <Button variant="outline" size="sm" onClick={() => handleOpenRevokeModal(null, true)}>
                  Revoke Selected
                </Button>
                <Button variant="danger" size="sm" onClick={handleBulkDelete}>
                  Delete Selected
                </Button>
              </div>
            </div>
          )}

          {/* Issued List Table */}
          {loadingCerts ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-12)' }}>
              <div className="loading-spinner" />
            </div>
          ) : certs.length === 0 ? (
            <Card style={{ border: '1px solid var(--border)', textAlign: 'center', padding: 'var(--space-12)', color: 'var(--text-secondary)' }}>
              No issued certificate records match the filter criteria.
            </Card>
          ) : (
            <div className="table-responsive glass-dark" style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)' }}>
              <table className="table" style={{ margin: 0 }}>
                <thead>
                  <tr>
                    <th style={{ width: '40px', textAlign: 'center' }}>
                      <input
                        type="checkbox"
                        checked={selectedCerts.length === certs.length && certs.length > 0}
                        onChange={handleSelectAllCerts}
                        style={{ cursor: 'pointer' }}
                      />
                    </th>
                    <th>Certificate ID</th>
                    <th>Player & Team Info</th>
                    <th>Award Details</th>
                    <th>Tournament</th>
                    <th>Issued Date</th>
                    <th>Status</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {certs.map((c) => (
                    <tr key={c.id} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ textAlign: 'center' }}>
                        <input
                          type="checkbox"
                          checked={selectedCerts.includes(c.cert_id)}
                          onChange={() => handleSelectCert(c.cert_id)}
                          style={{ cursor: 'pointer' }}
                        />
                      </td>
                      <td style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--neon)' }}>
                        <a href={`/verify/${c.cert_id}`} target="_blank" rel="noopener noreferrer" style={{ color: 'inherit', textDecoration: 'underline' }}>
                          {c.cert_id}
                        </a>
                      </td>
                      <td>
                        <div style={{ fontWeight: 800 }}>{c.player_name}</div>
                        <span style={{ fontSize: 'var(--text-2xs)', color: 'var(--text-secondary)' }}>
                          Roll: {c.roll_number || 'N/A'} • Team: {c.team_name || 'N/A'} ({c.department || 'N/A'})
                        </span>
                      </td>
                      <td style={{ textTransform: 'capitalize', fontWeight: 700 }}>
                        <span style={{ color: c.type === 'winner' ? 'var(--gold)' : c.type === 'mvp' ? '#FF6B35' : 'var(--neon)' }}>
                          {c.award_type || c.type}
                        </span>
                        {c.position && <div style={{ fontSize: 'var(--text-2xs)', color: 'var(--text-secondary)' }}>{c.position}</div>}
                      </td>
                      <td style={{ fontSize: 'var(--text-sm)' }}>
                        <div>{c.tournament_name}</div>
                        <span style={{ fontSize: 'var(--text-2xs)', color: 'var(--text-secondary)' }}>Date: {c.tournament_date || 'N/A'}</span>
                      </td>
                      <td style={{ fontSize: 'var(--text-xs)', fontFamily: 'var(--font-mono)' }}>
                        {formatDate(c.issued_date)}
                      </td>
                      <td>
                        <Badge variant={c.status === 'active' ? 'live' : c.status === 'reissued' ? 'upcoming' : 'banned'}>
                          {c.status}
                        </Badge>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                          <Button variant="outline" size="sm" onClick={() => handleDownloadPDF(c)} style={{ padding: '3px 8px', fontSize: 'var(--text-2xs)' }}>
                            PDF
                          </Button>
                          <Button variant="primary" size="sm" onClick={() => handleOpenEditCertModal(c)} style={{ padding: '3px 8px', fontSize: 'var(--text-2xs)' }}>
                            Edit
                          </Button>
                          {c.status === 'active' ? (
                            <Button variant="outline" size="sm" onClick={() => handleOpenRevokeModal(c.id, false)} style={{ padding: '3px 8px', fontSize: 'var(--text-2xs)' }}>
                              Revoke
                            </Button>
                          ) : c.status === 'revoked' ? (
                            <Button variant="primary" size="sm" onClick={() => handleRestoreCert(c)} style={{ padding: '3px 8px', fontSize: 'var(--text-2xs)' }}>
                              Restore
                            </Button>
                          ) : null}
                          <Button variant="outline" size="sm" onClick={() => handleReissueCert(c)} style={{ padding: '3px 8px', fontSize: 'var(--text-2xs)' }}>
                            Reissue
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => handleDuplicateCert(c)} style={{ padding: '3px 8px', fontSize: 'var(--text-2xs)' }}>
                            Clone
                          </Button>
                          <Button variant="danger" size="sm" onClick={() => handleDeleteCert(c)} style={{ padding: '3px 8px', fontSize: 'var(--text-2xs)' }}>
                            Del
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'var(--space-2)' }}>
              <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
                Page {page} of {totalPages} ({totalCerts} total)
              </span>
              <div style={{ display: 'flex', gap: '8px' }}>
                <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
                  Previous
                </Button>
                <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ─── TAB 2: TEMPLATES LIST ───────────────────────────────────────────── */}
      {activeTab === 'templates' && (
        <div>
          {loadingTemplates ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-12)' }}>
              <div className="loading-spinner" />
            </div>
          ) : templates.length === 0 ? (
            <Card style={{ border: '1px solid var(--border)', textAlign: 'center', padding: 'var(--space-12)', color: 'var(--text-secondary)' }}>
              No layout templates found. Press "Create Template" to build one.
            </Card>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
              {templates.map((t) => {
                let parsedColors = { accent: '#D7FF00' };
                try { if (t.colors) parsedColors = typeof t.colors === 'string' ? JSON.parse(t.colors) : t.colors; } catch {}

                return (
                  <Card key={t.id} style={{
                    border: t.is_default ? '1.5px solid var(--neon)' : '1px solid var(--border)',
                    background: 'linear-gradient(135deg, rgba(15,15,35,0.7) 0%, rgba(20,20,50,0.4) 100%)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    minHeight: '200px'
                  }}>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                        <h3 style={{ fontSize: 'var(--text-md)', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text)' }}>
                          {t.name}
                        </h3>
                        {t.is_default === 1 && (
                          <Badge variant="live">DEFAULT</Badge>
                        )}
                      </div>
                      <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', lineHeight: 1.4, marginBottom: '16px' }}>
                        Title: <strong>{t.title}</strong><br />
                        Border: <span style={{ textTransform: 'capitalize' }}>{t.border_design}</span><br />
                        Accent: <span style={{ color: parsedColors.accent, fontWeight: 700 }}>{parsedColors.accent}</span>
                      </p>
                    </div>

                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', borderTop: '1px solid var(--border)', paddingTop: '12px', marginTop: 'auto' }}>
                      <Button variant="primary" size="sm" onClick={() => handleEditTemplate(t)} style={{ flex: 1, padding: '6px' }}>
                        Edit Layout
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleOpenIssueModal(t)} style={{ padding: '6px' }}>
                        Issue
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleCloneTemplate(t.id)} style={{ padding: '6px' }}>
                        Clone
                      </Button>
                      {t.is_default !== 1 && (
                        <Button variant="outline" size="sm" onClick={() => handleSetDefaultTemplate(t)} style={{ padding: '6px', fontSize: '11px' }}>
                          Set Default
                        </Button>
                      )}
                      {t.is_default !== 1 && (
                        <Button variant="danger" size="sm" onClick={() => handleDeleteTemplate(t.id)} style={{ padding: '6px' }}>
                          Del
                        </Button>
                      )}
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ─── TAB 3: VISUAL DESIGN EDITOR ─────────────────────────────────────── */}
      {activeTab === 'editor' && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1.2fr',
          gap: '24px',
          alignItems: 'start',
          '@media (maxWidth: 992px)': { gridTemplateColumns: '1fr' }
        }}>
          {/* Controls Panel */}
          <Card style={{ maxHeight: '85vh', overflowY: 'auto', border: '1px solid var(--border)' }}>
            <h3 style={{ color: 'var(--neon)', fontWeight: 800, textTransform: 'uppercase', marginBottom: '16px' }}>
              ⚙️ Layout Configuration
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="form-group">
                <label className="form-label">Template Name</label>
                <input
                  type="text"
                  className="form-input"
                  value={templateForm.name}
                  onChange={(e) => setTemplateForm(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Certificate Title Text</label>
                <input
                  type="text"
                  className="form-input"
                  value={templateForm.title}
                  onChange={(e) => setTemplateForm(prev => ({ ...prev, title: e.target.value }))}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Description Template Text</label>
                <textarea
                  className="form-input"
                  rows="4"
                  value={templateForm.description_template}
                  onChange={(e) => setTemplateForm(prev => ({ ...prev, description_template: e.target.value }))}
                  style={{ resize: 'vertical' }}
                />
                <span style={{ fontSize: 'var(--text-2xs)', color: 'var(--text-secondary)' }}>
                  Placeholders: <code>{`{{player_name}}`}</code>, <code>{`{{team_name}}`}</code>, <code>{`{{department}}`}</code>, <code>{`{{tournament_name}}`}</code>, <code>{`{{position}}`}</code>, <code>{`{{date}}`}</code>.
                </span>
                {/* presets */}
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '8px' }}>
                  <button
                    type="button"
                    onClick={() => handleSelectPresetDesc('For outstanding performance and dedication in the {{tournament_name}} representing team {{team_name}} from the Department of {{department}}.')}
                    style={{ fontSize: '10px', background: 'rgba(255,255,255,0.05)', color: '#aaa', border: '1px solid var(--border)', padding: '3px 6px', borderRadius: '3px', cursor: 'pointer' }}
                  >
                    Preset: General
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSelectPresetDesc('For achieving {{position}} in the {{tournament_name}} representing team {{team_name}} ({{department}}) held on {{date}}.')}
                    style={{ fontSize: '10px', background: 'rgba(255,255,255,0.05)', color: '#aaa', border: '1px solid var(--border)', padding: '3px 6px', borderRadius: '3px', cursor: 'pointer' }}
                  >
                    Preset: Placement
                  </button>
                </div>
              </div>

              {/* Color Settings */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">Accent Highlight</label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input
                      type="color"
                      value={templateForm.colors.accent}
                      onChange={(e) => setTemplateForm(prev => ({ ...prev, colors: { ...prev.colors, accent: e.target.value } }))}
                      style={{ width: '40px', height: '38px', padding: 0, border: 'none', background: 'transparent', cursor: 'pointer' }}
                    />
                    <input
                      type="text"
                      className="form-input"
                      value={templateForm.colors.accent}
                      onChange={(e) => setTemplateForm(prev => ({ ...prev, colors: { ...prev.colors, accent: e.target.value } }))}
                      style={{ margin: 0 }}
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Text Color</label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input
                      type="color"
                      value={templateForm.colors.text}
                      onChange={(e) => setTemplateForm(prev => ({ ...prev, colors: { ...prev.colors, text: e.target.value } }))}
                      style={{ width: '40px', height: '38px', padding: 0, border: 'none', background: 'transparent', cursor: 'pointer' }}
                    />
                    <input
                      type="text"
                      className="form-input"
                      value={templateForm.colors.text}
                      onChange={(e) => setTemplateForm(prev => ({ ...prev, colors: { ...prev.colors, text: e.target.value } }))}
                      style={{ margin: 0 }}
                    />
                  </div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">Gradient Start</label>
                  <input
                    type="color"
                    className="form-input"
                    value={templateForm.colors.bg_start}
                    onChange={(e) => setTemplateForm(prev => ({ ...prev, colors: { ...prev.colors, bg_start: e.target.value } }))}
                    style={{ padding: 0, height: '38px', width: '100%', border: 'none', background: 'transparent', cursor: 'pointer' }}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Gradient End</label>
                  <input
                    type="color"
                    className="form-input"
                    value={templateForm.colors.bg_end}
                    onChange={(e) => setTemplateForm(prev => ({ ...prev, colors: { ...prev.colors, bg_end: e.target.value } }))}
                    style={{ padding: 0, height: '38px', width: '100%', border: 'none', background: 'transparent', cursor: 'pointer' }}
                  />
                </div>
              </div>

              {/* Typography / Border */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">Title Font</label>
                  <select
                    className="form-input"
                    value={templateForm.typography.title_font}
                    onChange={(e) => setTemplateForm(prev => ({ ...prev, typography: { ...prev.typography, title_font: e.target.value } }))}
                  >
                    {FONTS.map(f => <option key={f} value={f}>{f}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Body Font</label>
                  <select
                    className="form-input"
                    value={templateForm.typography.body_font}
                    onChange={(e) => setTemplateForm(prev => ({ ...prev, typography: { ...prev.typography, body_font: e.target.value } }))}
                  >
                    {FONTS.map(f => <option key={f} value={f}>{f}</option>)}
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">Border Style</label>
                  <select
                    className="form-input"
                    value={templateForm.border_design}
                    onChange={(e) => setTemplateForm(prev => ({ ...prev, border_design: e.target.value }))}
                  >
                    {BORDERS.map(b => <option key={b.id} value={b.id}>{b.label}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Watermark Text</label>
                  <input
                    type="text"
                    className="form-input"
                    value={templateForm.watermark_text}
                    onChange={(e) => setTemplateForm(prev => ({ ...prev, watermark_text: e.target.value }))}
                  />
                </div>
              </div>

              {/* Branding Image URL uploads */}
              <div className="form-group">
                <label className="form-label">Custom Logo Image URL</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="/assets/logo.png"
                  value={templateForm.logo_url}
                  onChange={(e) => setTemplateForm(prev => ({ ...prev, logo_url: e.target.value }))}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">Logo Size ({templateForm.logo_size}px)</label>
                  <input
                    type="range"
                    min="40"
                    max="160"
                    step="5"
                    value={templateForm.logo_size}
                    onChange={(e) => setTemplateForm(prev => ({ ...prev, logo_size: Number(e.target.value) }))}
                    style={{ width: '100%', height: '38px', accentColor: 'var(--neon)' }}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Logo Position</label>
                  <select
                    className="form-input"
                    value={templateForm.logo_position}
                    onChange={(e) => setTemplateForm(prev => ({ ...prev, logo_position: e.target.value }))}
                  >
                    <option value="top">Top Center</option>
                    <option value="left">Left Aligned</option>
                    <option value="right">Right Aligned</option>
                  </select>
                </div>
              </div>

              {/* Signatures */}
              <div style={{ border: '1px solid var(--border)', padding: '12px', borderRadius: 'var(--radius-md)' }}>
                <h4 style={{ margin: '0 0 10px 0', fontSize: 'var(--text-sm)', color: 'var(--neon)' }}>
                  ✍️ Signature 1 (Primary)
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '8px' }}>
                  <div className="form-group">
                    <label className="form-label" style={{ fontSize: '11px' }}>Name</label>
                    <input
                      type="text"
                      className="form-input text-xs"
                      value={templateForm.signature_name}
                      onChange={(e) => setTemplateForm(prev => ({ ...prev, signature_name: e.target.value }))}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label" style={{ fontSize: '11px' }}>Designation</label>
                    <input
                      type="text"
                      className="form-input text-xs"
                      value={templateForm.signature_designation}
                      onChange={(e) => setTemplateForm(prev => ({ ...prev, signature_designation: e.target.value }))}
                    />
                  </div>
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ fontSize: '11px' }}>Upload Signature Image (PNG)</label>
                  <input
                    type="file"
                    accept="image/png"
                    onChange={(e) => handleFileLoad(e, 'signature_image')}
                    style={{ fontSize: '11px' }}
                  />
                  {templateForm.signature_image && (
                    <div style={{ marginTop: '6px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '10px', color: 'var(--neon)' }}>✓ Loaded image</span>
                      <button
                        type="button"
                        onClick={() => setTemplateForm(prev => ({ ...prev, signature_image: '' }))}
                        style={{ background: 'transparent', border: 'none', color: 'var(--error)', cursor: 'pointer', fontSize: '11px' }}
                      >
                        Remove
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div style={{ border: '1px solid var(--border)', padding: '12px', borderRadius: 'var(--radius-md)' }}>
                <h4 style={{ margin: '0 0 10px 0', fontSize: 'var(--text-sm)', color: 'var(--neon)' }}>
                  ✍️ Signature 2 (Secondary)
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '8px' }}>
                  <div className="form-group">
                    <label className="form-label" style={{ fontSize: '11px' }}>Name</label>
                    <input
                      type="text"
                      className="form-input text-xs"
                      value={templateForm.signature_name_2}
                      onChange={(e) => setTemplateForm(prev => ({ ...prev, signature_name_2: e.target.value }))}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label" style={{ fontSize: '11px' }}>Designation</label>
                    <input
                      type="text"
                      className="form-input text-xs"
                      value={templateForm.signature_designation_2}
                      onChange={(e) => setTemplateForm(prev => ({ ...prev, signature_designation_2: e.target.value }))}
                    />
                  </div>
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ fontSize: '11px' }}>Upload Signature Image (PNG)</label>
                  <input
                    type="file"
                    accept="image/png"
                    onChange={(e) => handleFileLoad(e, 'signature_image_2')}
                    style={{ fontSize: '11px' }}
                  />
                  {templateForm.signature_image_2 && (
                    <div style={{ marginTop: '6px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '10px', color: 'var(--neon)' }}>✓ Loaded image</span>
                      <button
                        type="button"
                        onClick={() => setTemplateForm(prev => ({ ...prev, signature_image_2: '' }))}
                        style={{ background: 'transparent', border: 'none', color: 'var(--error)', cursor: 'pointer', fontSize: '11px' }}
                      >
                        Remove
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
                <Button variant="outline" onClick={() => setActiveTab('templates')} style={{ flex: 1 }}>
                  Cancel
                </Button>
                <Button variant="primary" onClick={handleSaveTemplate} disabled={actionLoading} style={{ flex: 1.5 }}>
                  {actionLoading ? 'Saving...' : 'Save Template'}
                </Button>
              </div>
            </div>
          </Card>

          {/* Scale-Fitting A4 Live Preview panel */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h3 style={{ color: 'var(--neon)', fontWeight: 800, textTransform: 'uppercase', margin: 0 }}>
              👁️ Live A4 Preview
            </h3>

            <div
              id="preview-parent"
              ref={previewParentRef}
              style={{
                width: '100%',
                background: '#000',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-lg)',
                padding: '20px',
                height: `${700 * previewScale + 40}px`,
                position: 'relative',
                overflow: 'hidden',
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'flex-start'
              }}
            >
              {/* Scaled Preview Frame */}
              <div style={{
                transform: `scale(${previewScale})`,
                transformOrigin: 'top left',
                width: '1000px',
                height: '700px',
                position: 'absolute',
                top: '20px',
                left: '20px',
                pointerEvents: 'none'
              }}>
                <div style={{
                  width: '100%',
                  height: '100%',
                  background: `linear-gradient(135deg, ${templateForm.colors.bg_start} 0%, ${templateForm.colors.bg_end} 100%)`,
                  border: templateForm.border_design === 'double'
                    ? `6px double ${templateForm.colors.accent}`
                    : templateForm.border_design === 'dashed'
                      ? `3px dashed ${templateForm.colors.accent}`
                      : templateForm.border_design === 'neon-glow'
                        ? `3px solid ${templateForm.colors.accent}`
                        : `3px solid ${templateForm.colors.accent}`,
                  boxShadow: templateForm.border_design === 'neon-glow'
                    ? `0 0 20px ${templateForm.colors.accent}, inset 0 0 20px ${templateForm.colors.accent}`
                    : 'none',
                  borderRadius: '12px',
                  padding: '40px 50px',
                  position: 'relative',
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  color: templateForm.colors.text,
                  fontFamily: templateForm.typography.body_font,
                  boxSizing: 'border-box'
                }}>
                  {/* Outer safety border border */}
                  <div style={{
                    position: 'absolute',
                    top: '15px', left: '15px', right: '15px', bottom: '15px',
                    border: `1.5px solid ${templateForm.colors.accent}25`,
                    borderRadius: '8px',
                    pointerEvents: 'none'
                  }}></div>

                  {/* Watermark text */}
                  {templateForm.watermark_text && (
                    <div style={{
                      position: 'absolute',
                      top: '50%',
                      left: '50%',
                      transform: 'translate(-50%, -50%) rotate(-25deg)',
                      fontFamily: templateForm.typography.title_font,
                      fontSize: '90px',
                      fontWeight: 900,
                      color: `${templateForm.colors.accent}04`,
                      whiteSpace: 'nowrap',
                      pointerEvents: 'none',
                      zIndex: 0
                    }}>
                      {templateForm.watermark_text}
                    </div>
                  )}

                  {/* Header */}
                  <div style={{
                    width: '100%',
                    display: 'flex',
                    flexDirection: templateForm.logo_position === 'left' ? 'row' : templateForm.logo_position === 'right' ? 'row-reverse' : 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '20px',
                    zIndex: 1
                  }}>
                    <img
                      src={templateForm.logo_url || '/assets/logo.png'}
                      alt="Logo"
                      style={{ height: `${templateForm.logo_size}px`, width: 'auto', objectFit: 'contain' }}
                    />
                    <div style={{
                      fontFamily: templateForm.typography.title_font,
                      fontSize: '20px',
                      fontWeight: 700,
                      color: templateForm.colors.accent,
                      letterSpacing: '6px',
                      textTransform: 'uppercase'
                    }}>
                      Bhima Esports
                    </div>
                  </div>

                  {/* Body */}
                  <div style={{
                    width: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    textAlign: 'center',
                    zIndex: 1
                  }}>
                    <div style={{
                      fontFamily: templateForm.typography.title_font,
                      fontSize: '32px',
                      fontWeight: 900,
                      textTransform: 'uppercase',
                      letterSpacing: '3px',
                      marginBottom: '12px'
                    }}>
                      {templateForm.title || 'Certificate Title'}
                    </div>
                    <div style={{ fontSize: '14px', color: '#888899', letterSpacing: '4px', textTransform: 'uppercase', marginBottom: '10px' }}>
                      This is proudly presented to
                    </div>
                    <div style={{
                      fontFamily: templateForm.typography.title_font,
                      fontSize: '36px',
                      fontWeight: 900,
                      color: templateForm.colors.accent,
                      textTransform: 'uppercase',
                      letterSpacing: '2px',
                      marginBottom: '6px'
                    }}>
                      JOHN DOE
                    </div>
                    <div style={{ fontSize: '13px', color: '#a1a1aa', letterSpacing: '2px', marginBottom: '12px' }}>
                      Roll No: 22BT21004
                    </div>
                    <div style={{ color: '#d1d1d6', fontSize: '15px', lineHeight: '1.6', maxWidth: '750px' }}>
                      {templateForm.description_template
                        .replace('{{player_name}}', 'JOHN DOE')
                        .replace('{{team_name}}', 'CSE STRIKERS')
                        .replace('{{department}}', 'CSE')
                        .replace('{{tournament_name}}', 'BGMI Hostel Championship')
                        .replace('{{position}}', '1st Place')
                        .replace('{{date}}', new Date().toISOString().split('T')[0])}
                    </div>
                  </div>

                  {/* Footer */}
                  <div style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'flex-end',
                    justifyContent: 'space-between',
                    zIndex: 1
                  }}>
                    <div style={{ display: 'flex', gap: '50px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', width: '150px' }}>
                        <div style={{ width: '100%', height: '1px', background: '#444', marginBottom: '8px', position: 'relative' }}>
                          {templateForm.signature_image && (
                            <img src={templateForm.signature_image} alt="Sig 1" style={{ position: 'absolute', bottom: '2px', left: '50%', transform: 'translateX(-50%)', maxHeight: '45px', maxWidth: '120px', objectFit: 'contain' }} />
                          )}
                        </div>
                        <div style={{ fontSize: '13px', color: '#fff', fontWeight: 600 }}>{templateForm.signature_name}</div>
                        <div style={{ fontSize: '10px', color: '#666', textTransform: 'uppercase', letterSpacing: '1px', marginTop: '2px' }}>
                          {templateForm.signature_designation}
                        </div>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', width: '150px' }}>
                        <div style={{ width: '100%', height: '1px', background: '#444', marginBottom: '8px', position: 'relative' }}>
                          {templateForm.signature_image_2 && (
                            <img src={templateForm.signature_image_2} alt="Sig 2" style={{ position: 'absolute', bottom: '2px', left: '50%', transform: 'translateX(-50%)', maxHeight: '45px', maxWidth: '120px', objectFit: 'contain' }} />
                          )}
                        </div>
                        <div style={{ fontSize: '13px', color: '#fff', fontWeight: 600 }}>{templateForm.signature_name_2}</div>
                        <div style={{ fontSize: '10px', color: '#666', textTransform: 'uppercase', letterSpacing: '1px', marginTop: '2px' }}>
                          {templateForm.signature_designation_2}
                        </div>
                      </div>
                    </div>

                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      background: 'rgba(255, 255, 255, 0.02)',
                      border: '1px solid rgba(255, 255, 255, 0.05)',
                      padding: '8px 12px',
                      borderRadius: '6px'
                    }}>
                      <div style={{ textAlign: 'left', fontFamily: 'monospace', fontSize: '10px', color: '#888', lineHeight: '1.4' }}>
                        ID: <strong style={{ color: templateForm.colors.accent }}>BE-CERT-MOCK</strong><br />
                        Status: <strong>ACTIVE</strong><br />
                        Verify at Bhima Esports
                      </div>
                      <div style={{
                        width: '50px',
                        height: '50px',
                        border: `1px solid ${templateForm.colors.accent}44`,
                        background: '#0a0a1a',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '20px'
                      }}>
                        📱
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL: ISSUE CERTIFICATE ───────────────────────────────────────── */}
      {issueModalOpen && (
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
            maxWidth: '550px',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border)',
            padding: 'var(--space-6)',
            maxHeight: '90vh',
            overflowY: 'auto'
          }}>
            <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 800, textTransform: 'uppercase', color: 'var(--neon)', marginBottom: '16px' }}>
              📜 Issue Award Certificate
            </h2>
            <div style={{ marginBottom: '16px', fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
              Layout: <strong>{selectedTemplateForIssue?.name}</strong> • Title: <strong>{selectedTemplateForIssue?.title}</strong>
            </div>

            <form onSubmit={handleIssueSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div className="form-group">
                <label className="form-label">Player Full Name</label>
                <input
                  type="text"
                  className="form-input"
                  required
                  placeholder="e.g. John Doe"
                  value={issueForm.player_name}
                  onChange={(e) => setIssueForm(prev => ({ ...prev, player_name: e.target.value }))}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">Roll Number (Optional)</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. 22BT21004"
                    value={issueForm.roll_number}
                    onChange={(e) => setIssueForm(prev => ({ ...prev, roll_number: e.target.value }))}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Team Name (Optional)</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. CSE Strikers"
                    value={issueForm.team_name}
                    onChange={(e) => setIssueForm(prev => ({ ...prev, team_name: e.target.value }))}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">Department (Optional)</label>
                  <select
                    className="form-input"
                    value={issueForm.department}
                    onChange={(e) => setIssueForm(prev => ({ ...prev, department: e.target.value }))}
                  >
                    <option value="">Select Department...</option>
                    {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Award Type</label>
                  <select
                    className="form-input"
                    value={issueForm.award_type}
                    onChange={(e) => setIssueForm(prev => ({ ...prev, award_type: e.target.value }))}
                  >
                    <option value="participation">Participation</option>
                    <option value="winner">Winner</option>
                    <option value="mvp">MVP</option>
                    <option value="runner-up">Runner Up</option>
                    <option value="custom">Custom Type</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">Tournament Name</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. VALORANT Championship"
                    value={issueForm.tournament_name}
                    onChange={(e) => setIssueForm(prev => ({ ...prev, tournament_name: e.target.value }))}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Tournament Date</label>
                  <input
                    type="date"
                    className="form-input"
                    value={issueForm.tournament_date}
                    onChange={(e) => setIssueForm(prev => ({ ...prev, tournament_date: e.target.value }))}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Position / Subtitle (Optional)</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. 1st Place, Runner-Up, Finals MVP"
                  value={issueForm.position}
                  onChange={(e) => setIssueForm(prev => ({ ...prev, position: e.target.value }))}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Generated Live Preview Text</label>
                <div style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid var(--border)',
                  padding: '12px',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: 'var(--text-xs)',
                  lineHeight: 1.5,
                  color: 'var(--text-secondary)'
                }}>
                  {issueForm.description_text}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '8px' }}>
                <Button type="button" variant="outline" onClick={() => setIssueModalOpen(false)}>Cancel</Button>
                <Button type="submit" variant="primary" disabled={actionLoading}>
                  {actionLoading ? 'Issuing...' : 'Generate Certificate'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── MODAL: EDIT CERTIFICATE ────────────────────────────────────────── */}
      {editModalOpen && (
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
            maxWidth: '550px',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border)',
            padding: 'var(--space-6)',
            maxHeight: '90vh',
            overflowY: 'auto'
          }}>
            <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 800, textTransform: 'uppercase', color: 'var(--neon)', marginBottom: '16px' }}>
              📝 Edit Certificate Fields
            </h2>
            <div style={{ marginBottom: '16px', fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
              ID: <strong>{editingCert?.cert_id}</strong>
            </div>

            <form onSubmit={handleEditSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div className="form-group">
                <label className="form-label">Player Full Name</label>
                <input
                  type="text"
                  className="form-input"
                  required
                  value={issueForm.player_name}
                  onChange={(e) => setIssueForm(prev => ({ ...prev, player_name: e.target.value }))}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">Roll Number</label>
                  <input
                    type="text"
                    className="form-input"
                    value={issueForm.roll_number}
                    onChange={(e) => setIssueForm(prev => ({ ...prev, roll_number: e.target.value }))}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Team Name</label>
                  <input
                    type="text"
                    className="form-input"
                    value={issueForm.team_name}
                    onChange={(e) => setIssueForm(prev => ({ ...prev, team_name: e.target.value }))}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">Department</label>
                  <select
                    className="form-input"
                    value={issueForm.department}
                    onChange={(e) => setIssueForm(prev => ({ ...prev, department: e.target.value }))}
                  >
                    <option value="">Select Department...</option>
                    {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Award Type</label>
                  <input
                    type="text"
                    className="form-input"
                    value={issueForm.award_type}
                    onChange={(e) => setIssueForm(prev => ({ ...prev, award_type: e.target.value }))}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">Tournament Name</label>
                  <input
                    type="text"
                    className="form-input"
                    value={issueForm.tournament_name}
                    onChange={(e) => setIssueForm(prev => ({ ...prev, tournament_name: e.target.value }))}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Tournament Date</label>
                  <input
                    type="date"
                    className="form-input"
                    value={issueForm.tournament_date}
                    onChange={(e) => setIssueForm(prev => ({ ...prev, tournament_date: e.target.value }))}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">Position</label>
                  <input
                    type="text"
                    className="form-input"
                    value={issueForm.position}
                    onChange={(e) => setIssueForm(prev => ({ ...prev, position: e.target.value }))}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Title Header</label>
                  <input
                    type="text"
                    className="form-input"
                    value={issueForm.title}
                    onChange={(e) => setIssueForm(prev => ({ ...prev, title: e.target.value }))}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Description Text</label>
                <textarea
                  className="form-input"
                  rows="3"
                  value={issueForm.description_text}
                  onChange={(e) => setIssueForm(prev => ({ ...prev, description_text: e.target.value }))}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '8px' }}>
                <Button type="button" variant="outline" onClick={() => setEditModalOpen(false)}>Cancel</Button>
                <Button type="submit" variant="primary" disabled={actionLoading}>
                  {actionLoading ? 'Updating...' : 'Save Changes'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── MODAL: REVOKE REASON ───────────────────────────────────────────── */}
      {revokeModalOpen && (
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
            maxWidth: '450px',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border)',
            padding: 'var(--space-6)',
          }}>
            <h3 style={{ color: 'var(--error)', fontWeight: 800, textTransform: 'uppercase', marginBottom: '12px' }}>
              🛑 Revoke Certificate
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)', lineHeight: 1.5, marginBottom: '16px' }}>
              Are you sure you want to revoke {isBulkRevoke ? `the ${selectedCerts.length} selected certificates` : `certificate ID: ${certs.find(c => c.id === revokeCertId)?.cert_id || 'this certificate'}`}?
              Revoking will display a red "REVOKED" stamp overlay on public validation checks.
            </p>

            <form onSubmit={handleRevokeSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div className="form-group">
                <label className="form-label">Reason for Revocation</label>
                <input
                  type="text"
                  className="form-input"
                  required
                  placeholder="e.g. Conduct violation, incorrect participant data"
                  value={revokeReason}
                  onChange={(e) => setRevokeReason(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '8px' }}>
                <Button type="button" variant="outline" onClick={() => setRevokeModalOpen(false)}>Cancel</Button>
                <Button type="submit" variant="danger" disabled={actionLoading}>
                  {actionLoading ? 'Revoking...' : 'Revoke Certificate'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── OVERLAY: PROGRESS LOADER ───────────────────────────────────────── */}
      {generationProgress && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.9)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          color: '#fff',
        }}>
          <div className="loading-spinner" style={{ width: '60px', height: '60px', borderLeftColor: 'var(--neon)' }} />
          <h3 style={{ color: 'var(--neon)', fontWeight: 800, textTransform: 'uppercase', marginTop: '24px', letterSpacing: '2px' }}>
            Generating Certificates
          </h3>
          <p style={{ color: '#aaa', marginTop: '8px', fontSize: 'var(--text-sm)' }}>
            {generationProgress.text}
          </p>
          <div style={{
            width: '300px',
            height: '4px',
            background: 'rgba(255,255,255,0.1)',
            borderRadius: '2px',
            marginTop: '20px',
            overflow: 'hidden'
          }}>
            <div style={{
              width: `${(generationProgress.current / generationProgress.total) * 100}%`,
              height: '100%',
              background: 'var(--neon)',
              transition: 'width 0.2s ease'
            }} />
          </div>
          <span style={{ fontSize: '11px', color: '#666', marginTop: '8px' }}>
            {generationProgress.current} / {generationProgress.total} Complete
          </span>
        </div>
      )}
    </div>
  );
}
