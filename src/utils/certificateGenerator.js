/**
 * Frontend Certificate Generator 
 * Generates HTML for live previews of the 5 Premium Esports Templates.
 */

export function generateCertificateHTML(cert) {
  const templateId = Number(cert.template_id) || 1;
  const qrEnabled = cert.qr_code_enabled !== false;

  // Verification URL
  const verifyUrl = `http://localhost:5173/verify/${cert.cert_id || 'PREVIEW-ID'}`;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=120x120&color=215-255-0&bgcolor=15-15-35&data=${encodeURIComponent(verifyUrl)}`;

  const fonts = `@import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&family=Rajdhani:wght@400;600;700;800&family=Montserrat:wght@400;700;900&display=swap');`;

  let templateCSS = '';
  let templateHTML = '';

  const safeStr = (str, fallback) => str || fallback || '';

  if (templateId === 1) {
    // ── TEMPLATE 1: CYBER NEON CERTIFICATE ──
    templateCSS = `
      .certificate {
        background: #FFFFFF;
        border: 4px solid #000000;
        box-shadow: inset 0 0 0 10px #F4F4F4;
        color: #000000;
        padding: 50px;
        position: relative;
        overflow: hidden;
      }
      .certificate::before {
        content: '';
        position: absolute;
        top: 20px; left: 20px; right: 20px; bottom: 20px;
        border: 2px dashed rgba(0, 0, 0, 0.1);
        pointer-events: none;
      }
      .hud-corner {
        position: absolute;
        width: 50px; height: 50px;
        border: 5px solid #000000;
      }
      .hud-tl { top: 15px; left: 15px; border-right: none; border-bottom: none; }
      .hud-tr { top: 15px; right: 15px; border-left: none; border-bottom: none; }
      .hud-bl { bottom: 15px; left: 15px; border-right: none; border-top: none; }
      .hud-br { bottom: 15px; right: 15px; border-left: none; border-top: none; }
      
      .title {
        font-family: 'Orbitron', sans-serif;
        font-size: 48px;
        font-weight: 900;
        color: #000000;
        text-transform: uppercase;
        letter-spacing: 4px;
        background: #D7FF00;
        display: inline-block;
        padding: 5px 20px;
        border: 2px solid #000;
        transform: skewX(-10deg);
      }
      .subtitle {
        font-family: 'Rajdhani', sans-serif;
        font-size: 20px;
        color: #333333;
        text-transform: uppercase;
        letter-spacing: 8px;
        margin-top: 15px;
        font-weight: 800;
      }
      .player {
        font-family: 'Orbitron', sans-serif;
        font-size: 56px;
        font-weight: 900;
        color: #000000;
        margin: 30px 0;
        text-transform: uppercase;
        letter-spacing: 2px;
      }
      .badge-section {
        margin: 20px 0;
        padding: 10px 30px;
        background: #000000;
        border: 2px solid #D7FF00;
        display: inline-block;
        border-radius: 4px;
      }
      .badge-text {
        font-family: 'Orbitron', sans-serif;
        font-size: 24px;
        color: #D7FF00;
        font-weight: 700;
      }
      .details {
        font-family: 'Rajdhani', sans-serif;
        font-size: 20px;
        color: #444444;
        max-width: 800px;
        line-height: 1.6;
        margin: 20px auto;
        font-weight: 600;
      }
      .details strong { color: #000000; font-weight: 800; border-bottom: 2px solid #D7FF00; padding-bottom: 2px; }
    `;

    templateHTML = `
      <div class="hud-corner hud-tl"></div>
      <div class="hud-corner hud-tr"></div>
      <div class="hud-corner hud-bl"></div>
      <div class="hud-corner hud-br"></div>
      
      <div style="width: 100%; display: flex; justify-content: space-between; align-items: flex-start; z-index: 2; position: relative;">
        <img src="/assets/logo.png" style="height: 80px; filter: invert(1);" alt="Logo" onerror="this.style.display='none'" />
        <div style="text-align: right; font-family: 'Orbitron', sans-serif; color: #000; font-size: 14px; font-weight: 700;">
          ID: ${safeStr(cert.cert_id, 'PREVIEW')}<br/>DATE: ${safeStr(cert.issued_date, new Date().toISOString().split('T')[0])}
        </div>
      </div>

      <div style="text-align: center; z-index: 2; position: relative; margin-top: -20px;">
        <div class="title">${safeStr(cert.title, 'CYBER NEON CERTIFICATE')}</div>
        <div class="subtitle">BHIMA ESPORTS</div>
        
        <div class="player">${safeStr(cert.player_name, 'PLAYER NAME')}</div>
        
        ${cert.achievement_badge || cert.award_type ? `
          <div class="badge-section">
            <div class="badge-text">${safeStr(cert.achievement_badge, '🏆')} ${cert.award_type ? cert.award_type.replace(/_/g, ' ').toUpperCase() : 'ACHIEVEMENT'}</div>
          </div>
        ` : ''}

        <div class="details">
          For outstanding performance securing <strong>${safeStr(cert.position, 'Position')}</strong> representing team <strong>${safeStr(cert.team_name, 'TEAM NAME')}</strong> 
          from the Department of <strong>${safeStr(cert.department, 'DEPARTMENT')}</strong> 
          in the <strong>${safeStr(cert.tournament_name, 'TOURNAMENT NAME')}</strong>.
        </div>
      </div>

      <div style="width: 100%; display: flex; justify-content: center; align-items: center; margin-top: auto; z-index: 2; position: relative;">
        ${qrEnabled ? `<img src="${qrCodeUrl}" style="width: 80px; height: 80px; border: 2px solid #D7FF00; padding: 4px;" />` : ''}
      </div>
    `;
  } 
  else if (templateId === 2) {
    // ── TEMPLATE 2: CHAMPIONSHIP CERTIFICATE ──
    templateCSS = `
      .certificate {
        background: radial-gradient(circle at center, #1a1a00 0%, #050505 100%);
        border: 4px solid #FFD700;
        box-shadow: inset 0 0 60px rgba(255, 215, 0, 0.15);
        color: #fff;
        padding: 50px;
        position: relative;
        overflow: hidden;
      }
      .certificate::before {
        content: '';
        position: absolute;
        top: 15px; left: 15px; right: 15px; bottom: 15px;
        border: 2px solid rgba(255, 215, 0, 0.5);
      }
      .title {
        font-family: 'Montserrat', sans-serif;
        font-size: 52px;
        font-weight: 900;
        color: #FFD700;
        text-transform: uppercase;
        letter-spacing: 6px;
        text-shadow: 2px 2px 0px #000;
      }
      .subtitle {
        font-family: 'Montserrat', sans-serif;
        font-size: 18px;
        color: #D7FF00;
        text-transform: uppercase;
        letter-spacing: 10px;
        margin-top: 5px;
      }
      .player {
        font-family: 'Orbitron', sans-serif;
        font-size: 64px;
        font-weight: 900;
        color: #fff;
        margin: 20px 0;
        text-transform: uppercase;
        text-shadow: 0 0 20px rgba(255, 215, 0, 0.3);
      }
      .details {
        font-family: 'Rajdhani', sans-serif;
        font-size: 22px;
        color: #ccc;
        max-width: 800px;
        line-height: 1.5;
        margin: 10px auto;
      }
      .details strong { color: #FFD700; font-weight: 700; }
      .badge-icon {
        font-size: 80px;
        margin: 10px 0;
        filter: drop-shadow(0 0 10px rgba(255,215,0,0.5));
      }
    `;

    templateHTML = `
      <div style="text-align: center; z-index: 2; position: relative; display: flex; flex-direction: column; align-items: center; height: 100%; justify-content: center;">
        <img src="/assets/logo.png" style="height: 100px; margin-bottom: 20px;" alt="Logo" onerror="this.style.display='none'" />
        
        <div class="subtitle">BHIMA ESPORTS CHAMPIONSHIP</div>
        <div class="title">${safeStr(cert.title, 'CHAMPION')}</div>
        
        <div class="badge-icon">${safeStr(cert.achievement_badge, '🏆')}</div>
        
        <div class="player">${safeStr(cert.player_name, 'PLAYER NAME')}</div>
        
        <div class="details">
          Has proven their absolute dominance and secured <strong>${safeStr(cert.position, 'Position')}</strong> in the <strong>${safeStr(cert.tournament_name, 'TOURNAMENT')}</strong>.<br/>
          Representing <strong>${safeStr(cert.team_name, 'TEAM NAME')}</strong> from <strong>${safeStr(cert.department, 'DEPARTMENT')}</strong>.
        </div>

        <div style="margin-top: 40px; display: flex; justify-content: space-between; width: 80%; align-items: center; border-top: 1px solid rgba(255,215,0,0.3); padding-top: 20px;">
          <div style="font-family: 'Orbitron', sans-serif; color: #FFD700; font-size: 16px;">
            DATE: ${safeStr(cert.issued_date, new Date().toISOString().split('T')[0])}
          </div>
          ${qrEnabled ? `<img src="${qrCodeUrl}" style="width: 80px; height: 80px; border: 2px solid #FFD700;" />` : ''}
          <div style="font-family: 'Orbitron', sans-serif; color: #FFD700; font-size: 16px;">
            ID: ${safeStr(cert.cert_id, 'PREVIEW')}
          </div>
        </div>
      </div>
    `;
  }
  else if (templateId === 3) {
    // ── TEMPLATE 3: FUTURISTIC ESPORTS ──
    templateCSS = `
      .certificate {
        background: #020205;
        border: 1px solid #333;
        color: #fff;
        padding: 50px;
        position: relative;
        overflow: hidden;
      }
      .grid-bg {
        position: absolute;
        inset: 0;
        background-size: 40px 40px;
        background-image: linear-gradient(to right, rgba(215, 255, 0, 0.05) 1px, transparent 1px),
                          linear-gradient(to bottom, rgba(215, 255, 0, 0.05) 1px, transparent 1px);
        pointer-events: none;
      }
      .glow-orb {
        position: absolute;
        width: 600px; height: 600px;
        background: radial-gradient(circle, rgba(215,255,0,0.15) 0%, rgba(0,0,0,0) 70%);
        top: 50%; left: 50%;
        transform: translate(-50%, -50%);
        pointer-events: none;
      }
      .title-box {
        background: rgba(215, 255, 0, 0.1);
        border-left: 5px solid #D7FF00;
        padding: 10px 30px;
        margin-bottom: 30px;
        display: inline-block;
      }
      .title {
        font-family: 'Rajdhani', sans-serif;
        font-size: 40px;
        font-weight: 800;
        color: #D7FF00;
        text-transform: uppercase;
        letter-spacing: 5px;
      }
      .player {
        font-family: 'Orbitron', sans-serif;
        font-size: 60px;
        font-weight: 900;
        color: #fff;
        text-transform: uppercase;
        margin-bottom: 20px;
      }
      .data-grid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 20px;
        margin: 30px auto;
        max-width: 800px;
      }
      .data-item {
        background: rgba(255,255,255,0.02);
        border: 1px solid rgba(255,255,255,0.1);
        padding: 15px;
        text-align: center;
      }
      .data-label {
        font-family: 'Rajdhani', sans-serif;
        font-size: 14px;
        color: #888;
        text-transform: uppercase;
        margin-bottom: 5px;
      }
      .data-value {
        font-family: 'Orbitron', sans-serif;
        font-size: 20px;
        color: #D7FF00;
        font-weight: 700;
      }
    `;

    templateHTML = `
      <div class="grid-bg"></div>
      <div class="glow-orb"></div>
      
      <div style="z-index: 2; position: relative; height: 100%; display: flex; flex-direction: column; justify-content: space-between;">
        <div style="display: flex; justify-content: space-between; align-items: flex-start;">
          <img src="/assets/logo.png" style="height: 60px;" alt="Logo" onerror="this.style.display='none'" />
          ${qrEnabled ? `<img src="${qrCodeUrl}" style="width: 60px; height: 60px;" />` : ''}
        </div>

        <div style="text-align: center;">
          <div class="title-box">
            <div class="title">${safeStr(cert.title, 'FUTURISTIC ESPORTS AWARD')}</div>
          </div>
          
          <div style="font-family: 'Rajdhani'; color: #888; font-size: 20px; text-transform: uppercase; letter-spacing: 4px;">SYSTEM IDENTIFIED PLAYER</div>
          <div class="player">${safeStr(cert.player_name, 'PLAYER NAME')}</div>
          
          <div class="data-grid">
            <div class="data-item">
              <div class="data-label">TEAM ALIAS</div>
              <div class="data-value">${safeStr(cert.team_name, 'N/A')}</div>
            </div>
            <div class="data-item">
              <div class="data-label">DEPARTMENT</div>
              <div class="data-value">${safeStr(cert.department, 'N/A')}</div>
            </div>
            <div class="data-item">
              <div class="data-label">POSITION</div>
              <div class="data-value">${safeStr(cert.position, 'N/A')}</div>
            </div>
          </div>
          <div style="font-family: 'Rajdhani'; color: #aaa; margin-top: 5px; font-size: 18px; text-transform: uppercase;">TOURNAMENT: ${safeStr(cert.tournament_name, 'N/A')}</div>
          
          ${cert.achievement_badge || cert.award_type ? `
            <div style="font-family: 'Orbitron'; font-size: 24px; color: #fff; margin-top: 20px;">
              <span style="color: #D7FF00;">>></span> ${safeStr(cert.achievement_badge, '🏆')} ${cert.award_type ? cert.award_type.toUpperCase() : 'AWARD'} <span style="color: #D7FF00;"><<</span>
            </div>
          ` : ''}
        </div>

        <div style="display: flex; justify-content: space-between; border-top: 1px solid #333; padding-top: 15px; font-family: 'Rajdhani'; color: #666; font-size: 16px;">
          <div>SEQ_ID: ${safeStr(cert.cert_id, 'PREVIEW')}</div>
          <div>TIMESTAMP: ${safeStr(cert.issued_date, new Date().toISOString().split('T')[0])}</div>
        </div>
      </div>
    `;
  }
  else if (templateId === 4) {
    // ── TEMPLATE 4: ACHIEVEMENT AWARD ──
    templateCSS = `
      .certificate {
        background: #000;
        border: 2px solid #222;
        color: #fff;
        padding: 60px;
        position: relative;
        overflow: hidden;
      }
      .neon-frame {
        position: absolute;
        inset: 20px;
        border: 2px solid #D7FF00;
        border-radius: 20px;
        box-shadow: 0 0 20px rgba(215, 255, 0, 0.2), inset 0 0 20px rgba(215, 255, 0, 0.2);
        pointer-events: none;
      }
      .top-badge {
        position: absolute;
        top: 0; left: 50%;
        transform: translate(-50%, -50%);
        background: #000;
        padding: 0 30px;
        font-size: 60px;
      }
      .title {
        font-family: 'Montserrat', sans-serif;
        font-size: 36px;
        font-weight: 900;
        color: #fff;
        text-transform: uppercase;
        letter-spacing: 8px;
        margin-top: 40px;
      }
      .player {
        font-family: 'Orbitron', sans-serif;
        font-size: 50px;
        font-weight: 700;
        color: #D7FF00;
        text-transform: uppercase;
        margin: 30px 0;
        border-bottom: 2px solid rgba(215, 255, 0, 0.3);
        padding-bottom: 10px;
        display: inline-block;
      }
      .desc {
        font-family: 'Rajdhani', sans-serif;
        font-size: 24px;
        color: #aaa;
        max-width: 700px;
        line-height: 1.6;
        margin: 0 auto;
      }
      .desc strong { color: #fff; }
    `;

    templateHTML = `
      <div class="neon-frame">
        <div class="top-badge">${safeStr(cert.achievement_badge, '🏅')}</div>
      </div>
      
      <div style="z-index: 2; position: relative; height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center;">
        <img src="/assets/logo.png" style="height: 70px; margin-bottom: 10px;" alt="Logo" onerror="this.style.display='none'" />
        
        <div class="title">${safeStr(cert.title, 'ACHIEVEMENT AWARD')}</div>
        <div style="font-family: 'Rajdhani'; color: #D7FF00; font-size: 20px; margin-top: 10px; letter-spacing: 4px;">ELITE PLAYER RECOGNITION</div>
        
        <div class="player">${safeStr(cert.player_name, 'PLAYER NAME')}</div>
        
        <div class="desc">
          Awarded for demonstrating exceptional skill and securing <strong>${safeStr(cert.position, 'Position')}</strong> for team <strong>${safeStr(cert.team_name, 'N/A')}</strong> 
          (${safeStr(cert.department, 'N/A')}) during the <strong>${safeStr(cert.tournament_name, 'Tournament')}</strong>.
        </div>

        <div style="margin-top: 50px; display: flex; justify-content: space-around; width: 100%; align-items: center;">
          <div style="font-family: 'Orbitron'; color: #666; font-size: 14px;">DATE<br/><span style="color:#D7FF00; font-size: 18px;">${safeStr(cert.issued_date, new Date().toISOString().split('T')[0])}</span></div>
          ${qrEnabled ? `<img src="${qrCodeUrl}" style="width: 80px; height: 80px; border-radius: 8px;" />` : ''}
          <div style="font-family: 'Orbitron'; color: #666; font-size: 14px;">CERT_ID<br/><span style="color:#D7FF00; font-size: 18px;">${safeStr(cert.cert_id, 'PREVIEW')}</span></div>
        </div>
      </div>
    `;
  }
  else if (templateId === 5) {
    // ── TEMPLATE 5: MVP AWARD ──
    templateCSS = `
      .certificate {
        background: linear-gradient(180deg, #111 0%, #000 100%);
        border: 3px solid #D7FF00;
        color: #fff;
        padding: 50px;
        position: relative;
        overflow: hidden;
      }
      .mvp-bg {
        position: absolute;
        top: 50%; left: 50%;
        transform: translate(-50%, -50%);
        font-family: 'Orbitron', sans-serif;
        font-size: 300px;
        font-weight: 900;
        color: rgba(215, 255, 0, 0.03);
        pointer-events: none;
        z-index: 0;
      }
      .title {
        font-family: 'Orbitron', sans-serif;
        font-size: 50px;
        font-weight: 900;
        color: #D7FF00;
        text-transform: uppercase;
        letter-spacing: 5px;
        margin-top: 10px;
      }
      .player {
        font-family: 'Orbitron', sans-serif;
        font-size: 70px;
        font-weight: 900;
        color: #fff;
        text-transform: uppercase;
        text-shadow: 0 5px 15px rgba(0,0,0,0.5);
        margin: 20px 0;
      }
      .stats-box {
        display: inline-block;
        background: rgba(215, 255, 0, 0.1);
        border: 2px solid #D7FF00;
        padding: 15px 40px;
        border-radius: 10px;
        margin-top: 20px;
      }
      .stats-title {
        font-family: 'Rajdhani', sans-serif;
        color: #D7FF00;
        font-size: 24px;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 2px;
      }
    `;

    templateHTML = `
      <div class="mvp-bg">MVP</div>
      
      <div style="z-index: 2; position: relative; height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center;">
        <img src="/assets/logo.png" style="height: 90px;" alt="Logo" onerror="this.style.display='none'" />
        
        <div class="title">MOST VALUABLE PLAYER</div>
        <div style="font-family: 'Rajdhani'; color: #aaa; font-size: 22px; letter-spacing: 4px; text-transform: uppercase; margin-top: 5px;">
          ${safeStr(cert.tournament_name, 'BHIMA ESPORTS TOURNAMENT')}
        </div>
        
        <div class="player">${safeStr(cert.player_name, 'PLAYER NAME')}</div>
        
        <div style="font-family: 'Rajdhani'; font-size: 26px; color: #ccc;">
          ${safeStr(cert.team_name, 'Team Name')} | ${safeStr(cert.department, 'Department')}
        </div>
        
        <div style="font-family: 'Orbitron'; font-size: 20px; color: #D7FF00; margin-top: 10px;">
          POSITION: ${safeStr(cert.position, 'MVP')}
        </div>

        <div class="stats-box">
          <div class="stats-title">PERFORMANCE HIGHLIGHTS</div>
          <div style="font-family: 'Orbitron'; font-size: 16px; color: #fff; margin-top: 10px;">
            OUTSTANDING COMBAT MASTERY AND STRATEGIC BRILLIANCE
          </div>
        </div>

        <div style="margin-top: auto; display: flex; justify-content: space-between; width: 100%; align-items: flex-end;">
          <div style="font-family: 'Orbitron'; color: #D7FF00; font-size: 14px; text-align: left;">
            ID: ${safeStr(cert.cert_id, 'PREVIEW')}<br/>
            DATE: ${safeStr(cert.issued_date, new Date().toISOString().split('T')[0])}
          </div>
          ${qrEnabled ? `<img src="${qrCodeUrl}" style="width: 70px; height: 70px; border: 2px solid #D7FF00; padding: 2px;" />` : ''}
        </div>
      </div>
    `;
  }

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${cert.title || 'Certificate Preview'}</title>
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
      border-radius: 12px;
    }

    ${templateCSS}
  </style>
</head>
<body>
  <div class="certificate-container">
    <div class="certificate">
      ${templateHTML}
    </div>
  </div>
</body>
</html>`;
}
