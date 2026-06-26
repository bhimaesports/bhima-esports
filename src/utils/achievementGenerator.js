import { jsPDF } from 'jspdf';

/**
 * Generates a portrait layout Achievement Award PDF
 * @param {Object} data 
 * @param {string} data.title
 * @param {string} data.award_type 
 * @param {string} data.player_name
 * @param {string} data.tournament_name
 * @param {string} data.issued_date
 * @param {boolean} [previewMode=false]
 * @returns {Promise<string|Blob>}
 */
export async function generateAchievement(data, previewMode = false) {
  // A4 Portrait: 210 x 297 mm
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const width = doc.internal.pageSize.getWidth();
  const height = doc.internal.pageSize.getHeight();
  const centerX = width / 2;

  // 1. Dark Theme Background
  doc.setFillColor(15, 15, 15);
  doc.rect(0, 0, width, height, 'F');

  // 2. Neon Lime Borders & Geometric Accents
  doc.setDrawColor(215, 255, 0);
  doc.setLineWidth(2);
  doc.rect(10, 10, width - 20, height - 20); // Outer border
  doc.setLineWidth(0.5);
  doc.rect(15, 15, width - 30, height - 30); // Inner border

  // Corner accents
  doc.setLineWidth(3);
  doc.line(10, 30, 10, 10);
  doc.line(10, 10, 30, 10);
  doc.line(width - 30, 10, width - 10, 10);
  doc.line(width - 10, 10, width - 10, 30);
  doc.line(10, height - 30, 10, height - 10);
  doc.line(10, height - 10, 30, height - 10);
  doc.line(width - 30, height - 10, width - 10, height - 10);
  doc.line(width - 10, height - 10, width - 10, height - 30);

  // 3. Organization Header
  doc.setTextColor(215, 255, 0);
  doc.setFontSize(28);
  doc.setFont('helvetica', 'bold');
  doc.text('BHIMA ESPORTS', centerX, 45, { align: 'center', renderingMode: 'fill' });
  
  doc.setTextColor(150, 150, 150);
  doc.setFontSize(10);
  doc.text('OFFICIAL GAMING AWARD', centerX, 55, { align: 'center', charSpace: 2 });

  // 4. Achievement Badge / Icon Area
  doc.setDrawColor(215, 255, 0);
  doc.setFillColor(30, 30, 30);
  doc.circle(centerX, 90, 20, 'FD');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.text('⭐', centerX, 93, { align: 'center' }); // Placeholder for actual graphic

  // 5. Award Type (Dynamic)
  doc.setTextColor(215, 255, 0);
  doc.setFontSize(36);
  doc.text((data.award_type || 'OUTSTANDING ACHIEVEMENT').toUpperCase(), centerX, 135, { align: 'center' });

  // 6. Presented To
  doc.setTextColor(200, 200, 200);
  doc.setFontSize(14);
  doc.text('PRESENTED TO', centerX, 155, { align: 'center', charSpace: 1 });

  // 7. Player Name (Auto-scaling)
  let nameSize = 48;
  doc.setFontSize(nameSize);
  const name = (data.player_name || 'PLAYER NAME').toUpperCase();
  while (doc.getTextWidth(name) > width - 40 && nameSize > 20) {
    nameSize -= 2;
    doc.setFontSize(nameSize);
  }
  doc.setTextColor(255, 255, 255);
  doc.text(name, centerX, 175, { align: 'center' });

  // 8. Separator Line
  doc.setDrawColor(215, 255, 0);
  doc.setLineWidth(1);
  doc.line(centerX - 40, 185, centerX + 40, 185);

  // 9. Details (Title & Tournament)
  doc.setTextColor(200, 200, 200);
  doc.setFontSize(16);
  doc.text('FOR', centerX, 200, { align: 'center', charSpace: 1 });
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  const title = (data.title || 'ACHIEVEMENT TITLE').toUpperCase();
  doc.text(title, centerX, 215, { align: 'center' });

  if (data.tournament_name) {
    doc.setTextColor(150, 150, 150);
    doc.setFontSize(14);
    doc.text(`AT ${data.tournament_name.toUpperCase()}`, centerX, 230, { align: 'center' });
  }

  // 10. Footer Details
  doc.setTextColor(150, 150, 150);
  doc.setFontSize(10);
  const issued = data.issued_date ? new Date(data.issued_date).toLocaleDateString() : new Date().toLocaleDateString();
  doc.text(`ISSUED: ${issued}`, 30, height - 35);
  doc.text(`AWARD ID: ${data.achievement_code || 'PENDING'}`, width - 30, height - 35, { align: 'right' });

  if (previewMode) {
    return doc.output('datauristring');
  } else {
    // Generate Blob for direct download/viewing
    return doc.output('blob');
  }
}
