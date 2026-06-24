/**
 * Certificate Generator – produces HTML-based certificates with dynamic styles,
 * themes, custom borders, watermarks, custom signatures, seals, and QR codes.
 */

export function generateCertificateHTML(cert) {
  // Parse JSON columns
  let colors = { accent: '#D7FF00', text: '#ffffff', bg_start: '#0f0f23', bg_end: '#16213e', border: '#D7FF00' };
  try {
    if (cert.colors) {
      colors = typeof cert.colors === 'string' ? JSON.parse(cert.colors) : cert.colors;
    }
  } catch {}

  let typography = { title_font: 'Orbitron', body_font: 'Rajdhani' };
  try {
    if (cert.typography) {
      typography = typeof cert.typography === 'string' ? JSON.parse(cert.typography) : cert.typography;
    }
  } catch {}

  let sponsorLogos = [];
  try {
    if (cert.sponsor_logos) {
      sponsorLogos = typeof cert.sponsor_logos === 'string' ? JSON.parse(cert.sponsor_logos) : cert.sponsor_logos;
    }
  } catch {}

  const defaultTypeLabels = {
    participation: 'Certificate of Participation',
    winner: 'Certificate of Achievement',
    mvp: 'Most Valuable Player Award',
  };

  const titleText = cert.title || defaultTypeLabels[cert.type] || 'Certificate';
  const qrEnabled = cert.qr_code_enabled !== 0;

  // Signatures
  const sigName1 = cert.signature_name || 'Bhima Esports Convener';
  const sigDes1 = cert.signature_designation || 'Convener';
  const sigName2 = cert.signature_name_2 || 'Bhima Hostel Warden';
  const sigDes2 = cert.signature_designation_2 || 'Warden';

  // Verification URL
  const verifyUrl = `http://localhost:5173/verify/${cert.cert_id}`;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=120x120&color=215-255-0&bgcolor=15-15-35&data=${encodeURIComponent(verifyUrl)}`;

  // Custom border style
  let borderStyle = '3px solid ' + colors.accent;
  if (cert.border_design === 'double') {
    borderStyle = '6px double ' + colors.accent;
  } else if (cert.border_design === 'dashed') {
    borderStyle = '3px dashed ' + colors.accent;
  } else if (cert.border_design === 'neon-glow') {
    borderStyle = '3px solid ' + colors.accent + '; box-shadow: 0 0 20px ' + colors.accent + ', inset 0 0 20px ' + colors.accent;
  }

  // Logo position layout
  let logoFlexDirection = 'column';
  if (cert.logo_position === 'left') {
    logoFlexDirection = 'row';
  } else if (cert.logo_position === 'right') {
    logoFlexDirection = 'row-reverse';
  }

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${titleText} - ${cert.player_name}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&family=Rajdhani:wght@400;600;700&family=Montserrat:wght@400;700&family=Great+Vibes&display=swap');

    * { margin: 0; padding: 0; box-sizing: border-box; }

    body {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      background: #050505;
      font-family: '${typography.body_font || 'Rajdhani'}', sans-serif;
    }

    .certificate-container {
      position: relative;
      width: 1000px;
      height: 700px;
      display: flex;
      justify-content: center;
      align-items: center;
      padding: 10px;
    }

    .certificate {
      width: 100%;
      height: 100%;
      background: linear-gradient(135deg, ${colors.bg_start || '#0f0f23'} 0%, ${colors.bg_end || '#16213e'} 100%);
      border: ${borderStyle};
      border-radius: 12px;
      padding: 40px 50px;
      position: relative;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: space-between;
    }

    .certificate::before {
      content: '';
      position: absolute;
      top: 15px; left: 15px; right: 15px; bottom: 15px;
      border: 1px solid ${colors.accent}33;
      border-radius: 8px;
      pointer-events: none;
      z-index: 1;
    }

    /* Watermark text */
    ${cert.watermark_text ? `
    .certificate::after {
      content: '${cert.watermark_text}';
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%) rotate(-25deg);
      font-family: '${typography.title_font || 'Orbitron'}', monospace;
      font-size: 90px;
      font-weight: 900;
      color: ${colors.accent}07;
      white-space: nowrap;
      pointer-events: none;
      z-index: 0;
    }
    ` : ''}

    .header-section {
      width: 100%;
      display: flex;
      flex-direction: ${logoFlexDirection};
      align-items: center;
      justify-content: center;
      gap: 20px;
      z-index: 2;
    }

    .logo-container img {
      height: ${cert.logo_size || 80}px;
      width: auto;
      object-fit: contain;
    }

    .org-name {
      font-family: '${typography.title_font || 'Orbitron'}', sans-serif;
      font-size: 20px;
      font-weight: 700;
      color: ${colors.accent};
      letter-spacing: 6px;
      text-transform: uppercase;
    }

    .body-section {
      width: 100%;
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      margin-top: 10px;
      z-index: 2;
    }

    .cert-title {
      font-family: '${typography.title_font || 'Orbitron'}', sans-serif;
      font-size: 34px;
      font-weight: 900;
      color: ${colors.text || '#ffffff'};
      text-transform: uppercase;
      letter-spacing: 3px;
      margin-bottom: 12px;
    }

    .presented-to {
      font-size: 15px;
      color: #888899;
      letter-spacing: 4px;
      text-transform: uppercase;
      margin-bottom: 10px;
    }

    .player-name {
      font-family: '${typography.title_font || 'Orbitron'}', sans-serif;
      font-size: 38px;
      font-weight: 900;
      color: ${colors.accent};
      text-transform: uppercase;
      letter-spacing: 2px;
      margin-bottom: 6px;
    }

    .roll-number {
      font-size: 14px;
      color: #a1a1aa;
      letter-spacing: 2px;
      margin-bottom: 15px;
    }

    .details {
      color: #d1d1d6;
      font-size: 16px;
      line-height: 1.6;
      max-width: 750px;
    }

    .details strong {
      color: #ffffff;
      font-weight: 700;
    }

    .footer-section {
      width: 100%;
      display: flex;
      align-items: flex-end;
      justify-content: space-between;
      margin-top: 20px;
      z-index: 2;
    }

    .signatures-block {
      display: flex;
      gap: 60px;
    }

    .signature-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      width: 150px;
    }

    .signature-line {
      width: 100%;
      height: 1px;
      background: #444;
      margin-bottom: 8px;
      position: relative;
    }

    .signature-image {
      position: absolute;
      bottom: 2px;
      left: 50%;
      transform: translateX(-50%);
      max-height: 45px;
      max-width: 120px;
      object-fit: contain;
      pointer-events: none;
    }

    .signature-item .name {
      font-size: 14px;
      color: #fff;
      font-weight: 600;
    }

    .signature-item .desg {
      font-size: 11px;
      color: #666;
      text-transform: uppercase;
      letter-spacing: 1px;
      margin-top: 2px;
    }

    /* Verification Box */
    .verification-box {
      display: flex;
      align-items: center;
      gap: 15px;
      background: rgba(255, 255, 255, 0.02);
      border: 1px solid rgba(255, 255, 255, 0.05);
      padding: 10px 15px;
      border-radius: 8px;
    }

    .qr-code {
      width: 64px;
      height: 64px;
      border: 1px solid ${colors.accent}44;
      border-radius: 4px;
    }

    .verify-details {
      text-align: left;
      font-family: monospace;
      font-size: 11px;
      color: #888;
      line-height: 1.4;
    }

    .verify-details strong {
      color: ${colors.accent};
    }

    /* Status Revoked Overlay */
    .status-revoked-overlay {
      position: absolute;
      inset: 0;
      background: rgba(200, 0, 0, 0.15);
      backdrop-filter: blur(1px);
      z-index: 10;
      display: flex;
      justify-content: center;
      align-items: center;
      pointer-events: none;
    }

    .status-revoked-stamp {
      border: 6px double #ff3b30;
      color: #ff3b30;
      font-family: '${typography.title_font || 'Orbitron'}', sans-serif;
      font-size: 60px;
      font-weight: 900;
      text-transform: uppercase;
      padding: 10px 30px;
      transform: rotate(-15deg);
      border-radius: 12px;
      box-shadow: 0 0 20px rgba(255, 59, 48, 0.3);
      background: rgba(10, 5, 5, 0.85);
    }

    /* Sponsor Logos */
    .sponsors-bar {
      display: flex;
      gap: 15px;
      justify-content: center;
      align-items: center;
      margin-top: 10px;
    }

    .sponsor-logo {
      height: 25px;
      width: auto;
      opacity: 0.6;
      filter: grayscale(1);
    }

    @media print {
      body { background: transparent; }
      .certificate-container { padding: 0; width: 100vw; height: 100vh; }
      .certificate { border-radius: 0; border: none; box-shadow: none; }
    }
  </style>
</head>
<body>
  <div class="certificate-container">
    ${cert.status === 'revoked' ? `
    <div class="status-revoked-overlay">
      <div class="status-revoked-stamp">REVOKED</div>
    </div>
    ` : ''}

    <div class="certificate">
      <div class="header-section">
        <div class="logo-container">
          <img src="${cert.logo_url || colors.accent === '#FFD700' ? '/assets/logo.png' : '/assets/logo.png'}" alt="Logo" />
        </div>
        <div class="org-name">Bhima Esports</div>
      </div>

      <div class="body-section">
        <div class="cert-title">${titleText}</div>
        <div class="presented-to">This is proudly presented to</div>
        <div class="player-name">${cert.player_name}</div>
        ${cert.roll_number ? `<div class="roll-number">Roll No: ${cert.roll_number}</div>` : ''}
        <div class="details">
          ${cert.description_text || `For outstanding performance and dedication in the <strong>${cert.tournament_name || 'BHIMA ESPORTS Tournament'}</strong> representing team <strong>${cert.team_name || 'N/A'}</strong> from the Department of <strong>${cert.department || 'N/A'}</strong>.`}
        </div>
        
        ${sponsorLogos.length > 0 ? `
        <div class="sponsors-bar">
          ${sponsorLogos.map(logo => `<img src="${logo}" class="sponsor-logo" alt="Sponsor" />`).join('')}
        </div>
        ` : ''}
      </div>

      <div class="footer-section">
        <div class="signatures-block">
          <div class="signature-item">
            <div class="signature-line">
              ${cert.signature_image ? `<img src="${cert.signature_image}" class="signature-image" alt="Signature" />` : ''}
            </div>
            <div class="name">${sigName1}</div>
            <div class="desg">${sigDes1}</div>
          </div>
          <div class="signature-item">
            <div class="signature-line">
              ${cert.signature_image_2 ? `<img src="${cert.signature_image_2}" class="signature-image" alt="Signature 2" />` : ''}
            </div>
            <div class="name">${sigName2}</div>
            <div class="desg">${sigDes2}</div>
          </div>
        </div>

        ${qrEnabled ? `
        <div class="verification-box">
          <div class="verify-details">
            ID: <strong>${cert.cert_id}</strong><br />
            Status: <strong>${cert.status.toUpperCase()}</strong><br />
            Verify at Bhima Esports
          </div>
          <img src="${qrCodeUrl}" class="qr-code" alt="Verification QR Code" />
        </div>
        ` : `
        <div style="font-family: monospace; font-size: 11px; color: #555;">
          ID: ${cert.cert_id}
        </div>
        `}
      </div>
    </div>
  </div>
</body>
</html>`;
}

export default { generateCertificateHTML };
