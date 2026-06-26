/**
 * Certificate Generator – produces HTML-based certificates with dynamic styles,
 * themes, custom borders, watermarks, custom signatures, seals, and QR codes.
 * REDESIGNED: Smart Layout Engine & Premium Esports Aesthetics
 */

export function generateCertificateHTML(cert) {
  const qrEnabled = cert.qr_code_enabled !== 0;

  // Verification URL
  const verifyUrl = `http://localhost:5173/verify/${cert.cert_id}`;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=120x120&color=215-255-0&bgcolor=15-15-35&data=${encodeURIComponent(verifyUrl)}`;

  // Determine Orientation & Dimensions based on type
  const isAchievement = cert.type === 'achievement';
  const width = isAchievement ? 700 : 1000;
  const height = isAchievement ? 1000 : 700;
  const containerClass = isAchievement ? 'achievement-layout' : 'certificate-layout';

  // Base typography
  const fonts = `@import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&family=Rajdhani:wght@400;500;600;700;800&family=Montserrat:wght@400;700;900&display=swap');`;

  let templateCSS = '';
  let templateHTML = '';

  if (!isAchievement) {
    // ── LANDSCAPE CERTIFICATES ──
    templateCSS = `
      .certificate {
        background: linear-gradient(135deg, #050505 0%, #111 100%);
        border: 2px solid #D7FF00;
        box-shadow: inset 0 0 40px rgba(215, 255, 0, 0.05), 0 0 30px rgba(215, 255, 0, 0.2);
        color: #fff;
        padding: 50px;
        position: relative;
        overflow: hidden;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        align-items: center;
        height: 100%;
        width: 100%;
      }
      .certificate::before {
        content: '';
        position: absolute;
        top: 15px; left: 15px; right: 15px; bottom: 15px;
        border: 1px dashed rgba(215, 255, 0, 0.2);
        pointer-events: none;
      }
      .header-section {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        width: 100%;
        z-index: 2;
      }
      .logo { height: 80px; }
      .meta-data {
        text-align: right;
        font-family: 'Orbitron', sans-serif;
        color: #D7FF00;
        font-size: 14px;
        opacity: 0.8;
      }
      .body-section {
        flex: 1;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        width: 100%;
        max-width: 800px;
        text-align: center;
        z-index: 2;
        padding: 20px 0;
      }
      .title {
        font-family: 'Orbitron', sans-serif;
        font-size: 48px;
        font-weight: 900;
        color: #D7FF00;
        text-transform: uppercase;
        letter-spacing: 4px;
        text-shadow: 0 0 10px rgba(215, 255, 0, 0.3);
      }
      .subtitle {
        font-family: 'Rajdhani', sans-serif;
        font-size: 20px;
        color: #888;
        text-transform: uppercase;
        letter-spacing: 8px;
        margin-top: 10px;
        margin-bottom: 30px;
      }
      .player-container {
        width: 100%;
        text-align: center;
        margin: 20px 0;
      }
      .player {
        font-family: 'Orbitron', sans-serif;
        font-size: 64px;
        font-weight: 900;
        color: #fff;
        text-transform: uppercase;
        letter-spacing: 2px;
        white-space: nowrap;
      }
      .details {
        font-family: 'Rajdhani', sans-serif;
        font-size: 22px;
        color: #bbb;
        line-height: 1.6;
        margin-top: 20px;
      }
      .details strong { color: #fff; font-weight: 700; }
      .footer-section {
        display: flex;
        justify-content: center;
        align-items: center;
        width: 100%;
        z-index: 2;
      }
      .qr-box {
        width: 80px; height: 80px;
        border: 2px solid #D7FF00;
        padding: 4px;
      }
      .badge-section {
        padding: 5px 20px;
        background: rgba(215, 255, 0, 0.1);
        border: 1px solid #D7FF00;
        display: inline-block;
        border-radius: 4px;
        margin: 10px 0;
      }
      .badge-text {
        font-family: 'Orbitron', sans-serif;
        font-size: 20px;
        color: #D7FF00;
        font-weight: 700;
      }
    `;

    templateHTML = `
      <div class="header-section">
        <img src="/assets/logo.png" class="logo" alt="Logo" onerror="this.style.display='none'" />
        <div class="meta-data">
          ID: ${cert.cert_id}<br/>DATE: ${cert.issued_date}
        </div>
      </div>

      <div class="body-section">
        <div class="title-container" style="width: 100%;">
          <div class="title auto-shrink">${cert.title || 'OFFICIAL CERTIFICATE'}</div>
        </div>
        <div class="subtitle">BHIMA ESPORTS</div>
        
        <div class="player-container">
          <div class="player auto-shrink">${cert.player_name}</div>
        </div>
        
        ${cert.achievement_badge || cert.award_type ? `
          <div class="badge-section">
            <div class="badge-text">${cert.achievement_badge || '🏆'} ${cert.award_type ? cert.award_type.replace(/_/g, ' ').toUpperCase() : 'ACHIEVEMENT'}</div>
          </div>
        ` : ''}

        <div class="details">
          For outstanding performance representing team <strong>${cert.team_name || 'N/A'}</strong> 
          from the Department of <strong>${cert.department || 'N/A'}</strong> 
          in the <strong>${cert.tournament_name || 'Tournament'}</strong>.
        </div>
      </div>

      <div class="footer-section">
        ${qrEnabled ? `<img src="${qrCodeUrl}" class="qr-box" />` : ''}
      </div>
    `;
  } else {
    // ── PORTRAIT ACHIEVEMENTS ──
    templateCSS = `
      .certificate {
        background: #020205;
        border: 3px solid #222;
        color: #fff;
        padding: 50px;
        position: relative;
        overflow: hidden;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        align-items: center;
        height: 100%;
        width: 100%;
      }
      .grid-bg {
        position: absolute;
        inset: 0;
        background-size: 40px 40px;
        background-image: linear-gradient(to right, rgba(215, 255, 0, 0.03) 1px, transparent 1px),
                          linear-gradient(to bottom, rgba(215, 255, 0, 0.03) 1px, transparent 1px);
        pointer-events: none;
        z-index: 0;
      }
      .neon-frame {
        position: absolute;
        inset: 20px;
        border: 2px solid #D7FF00;
        border-radius: 12px;
        box-shadow: 0 0 20px rgba(215, 255, 0, 0.1), inset 0 0 20px rgba(215, 255, 0, 0.1);
        pointer-events: none;
        z-index: 1;
      }
      .top-badge-container {
        z-index: 2;
        margin-top: 20px;
        margin-bottom: 20px;
      }
      .top-badge {
        font-size: 100px;
        filter: drop-shadow(0 0 20px rgba(215,255,0,0.4));
      }
      .content-wrapper {
        z-index: 2;
        flex: 1;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        width: 100%;
        max-width: 600px;
        text-align: center;
      }
      .logo { height: 70px; margin-bottom: 30px; }
      .title-container { width: 100%; margin-bottom: 10px; }
      .title {
        font-family: 'Montserrat', sans-serif;
        font-size: 42px;
        font-weight: 900;
        color: #fff;
        text-transform: uppercase;
        letter-spacing: 6px;
        white-space: nowrap;
      }
      .subtitle {
        font-family: 'Rajdhani', sans-serif;
        color: #D7FF00;
        font-size: 22px;
        letter-spacing: 4px;
        text-transform: uppercase;
        margin-bottom: 40px;
      }
      .player-container { width: 100%; margin-bottom: 30px; }
      .player {
        font-family: 'Orbitron', sans-serif;
        font-size: 56px;
        font-weight: 900;
        color: #D7FF00;
        text-transform: uppercase;
        white-space: nowrap;
        border-bottom: 2px solid rgba(215, 255, 0, 0.3);
        padding-bottom: 10px;
        display: inline-block;
      }
      .desc {
        font-family: 'Rajdhani', sans-serif;
        font-size: 24px;
        color: #aaa;
        line-height: 1.6;
      }
      .desc strong { color: #fff; font-weight: 600; }
      .footer-section {
        z-index: 2;
        display: flex;
        justify-content: space-between;
        align-items: flex-end;
        width: 100%;
        padding: 0 20px;
      }
      .meta-block {
        font-family: 'Orbitron', sans-serif;
        color: #666;
        font-size: 14px;
        text-transform: uppercase;
      }
      .meta-block span {
        display: block;
        color: #D7FF00;
        font-size: 18px;
        margin-top: 5px;
      }
      .qr-box {
        width: 80px; height: 80px;
        border-radius: 8px;
      }
    `;

    templateHTML = `
      <div class="grid-bg"></div>
      <div class="neon-frame"></div>
      
      <div class="top-badge-container">
        <div class="top-badge">${cert.achievement_badge || '🏅'}</div>
      </div>
      
      <div class="content-wrapper">
        <img src="/assets/logo.png" class="logo" alt="Logo" onerror="this.style.display='none'" />
        
        <div class="title-container">
          <div class="title auto-shrink">${cert.title || 'ACHIEVEMENT AWARD'}</div>
        </div>
        <div class="subtitle">ELITE PLAYER RECOGNITION</div>
        
        <div class="player-container">
          <div class="player auto-shrink">${cert.player_name}</div>
        </div>
        
        <div class="desc">
          Awarded for demonstrating exceptional skill and contributing significantly to team <strong>${cert.team_name || 'N/A'}</strong> 
          (${cert.department || 'N/A'}) during the <strong>${cert.tournament_name || 'Tournament'}</strong>.
        </div>
      </div>

      <div class="footer-section">
        <div class="meta-block" style="text-align: left;">
          DATE
          <span>${cert.issued_date}</span>
        </div>
        ${qrEnabled ? `<img src="${qrCodeUrl}" class="qr-box" />` : ''}
        <div class="meta-block" style="text-align: right;">
          CERT_ID
          <span>${cert.cert_id}</span>
        </div>
      </div>
    `;
  }

  // Inject Smart Layout Engine Script
  const smartLayoutScript = `
    <script>
      function scaleText() {
        const elements = document.querySelectorAll('.auto-shrink');
        elements.forEach(el => {
          let container = el.parentElement;
          if (!container) return;
          
          let fontSize = parseFloat(window.getComputedStyle(el).fontSize);
          let safetyLimit = 0;
          
          // Shrink font until element width fits inside container
          while (el.scrollWidth > container.clientWidth && fontSize > 12 && safetyLimit < 100) {
            fontSize -= 1;
            el.style.fontSize = fontSize + 'px';
            safetyLimit++;
          }
        });
      }
      
      // Run once DOM is loaded, and wait 100ms for fonts to render
      window.onload = () => {
        setTimeout(scaleText, 100);
      };
    </script>
  `;

  // Base HTML wrapper
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${cert.title || 'Certificate'} - ${cert.player_name}</title>
  <style>
    ${fonts}
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      background: #050505;
      font-family: 'Rajdhani', sans-serif;
    }
    .container {
      position: relative;
      width: ${width}px;
      height: ${height}px;
      display: flex;
      justify-content: center;
      align-items: center;
      padding: 0;
    }
    .certificate {
      width: 100%;
      height: 100%;
      border-radius: 0;
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
      font-family: 'Orbitron', sans-serif;
      font-size: 60px;
      font-weight: 900;
      text-transform: uppercase;
      padding: 10px 30px;
      transform: rotate(-15deg);
      border-radius: 12px;
      box-shadow: 0 0 20px rgba(255, 59, 48, 0.3);
      background: rgba(10, 5, 5, 0.85);
    }

    @media print {
      body { background: transparent; }
      .container { padding: 0; width: 100vw; height: 100vh; }
      .certificate { border: none; box-shadow: none; }
    }

    /* Inject Template Specific CSS */
    ${templateCSS}
  </style>
</head>
<body>
  <div class="container ${containerClass}">
    ${cert.status === 'revoked' ? `
    <div class="status-revoked-overlay">
      <div class="status-revoked-stamp">REVOKED</div>
    </div>
    ` : ''}

    <div class="certificate">
      ${templateHTML}
    </div>
  </div>
  ${smartLayoutScript}
</body>
</html>`;
}

export default { generateCertificateHTML };
