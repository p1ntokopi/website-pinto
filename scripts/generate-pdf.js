const { chromium } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

let marked;
try {
  marked = require('marked');
} catch (e) {
  // If marked is still installing or not yet ready, fallback
  console.log('Loading marked module...');
}

const BRAND_LOGO_PATH = path.join(__dirname, '..', 'public', 'Pintokupi.webp');
let logoBase64 = '';
if (fs.existsSync(BRAND_LOGO_PATH)) {
  logoBase64 = `data:image/webp;base64,${fs.readFileSync(BRAND_LOGO_PATH).toString('base64')}`;
}

function preprocessMarkdown(mdContent, basePath) {
  // Convert GitHub alerts to styled HTML
  let processed = mdContent;

  processed = processed.replace(
    /> \[!NOTE\]\s*\n((?:> .*\n?)+)/g,
    (_, body) => {
      const cleanBody = body.replace(/^> ?/gm, '');
      return `<div class="alert-box alert-note"><div class="alert-title">CATATAN PENTING</div><div class="alert-content">${cleanBody}</div></div>\n`;
    }
  );

  processed = processed.replace(
    /> \[!IMPORTANT\]\s*\n((?:> .*\n?)+)/g,
    (_, body) => {
      const cleanBody = body.replace(/^> ?/gm, '');
      return `<div class="alert-box alert-important"><div class="alert-title">PERHATIAN KHUSUS</div><div class="alert-content">${cleanBody}</div></div>\n`;
    }
  );

  processed = processed.replace(
    /> \[!WARNING\]\s*\n((?:> .*\n?)+)/g,
    (_, body) => {
      const cleanBody = body.replace(/^> ?/gm, '');
      return `<div class="alert-box alert-warning"><div class="alert-title">PERINGATAN OPERASIONAL</div><div class="alert-content">${cleanBody}</div></div>\n`;
    }
  );

  processed = processed.replace(
    /> \[!CAUTION\]\s*\n((?:> .*\n?)+)/g,
    (_, body) => {
      const cleanBody = body.replace(/^> ?/gm, '');
      return `<div class="alert-box alert-caution"><div class="alert-title">LARANGAN KERAS</div><div class="alert-content">${cleanBody}</div></div>\n`;
    }
  );

  // Convert image references to inline base64 or absolute paths so Playwright renders them perfectly
  processed = processed.replace(/!\[(.*?)\]\((.*?)\)/g, (match, alt, imgPath) => {
    let resolved = imgPath;
    if (!imgPath.startsWith('http') && !imgPath.startsWith('data:')) {
      const absPath = path.resolve(basePath, imgPath);
      if (fs.existsSync(absPath)) {
        const ext = path.extname(absPath).toLowerCase();
        let mime = 'image/png';
        if (ext === '.svg') mime = 'image/svg+xml';
        else if (ext === '.webp') mime = 'image/webp';
        else if (ext === '.jpg' || ext === '.jpeg') mime = 'image/jpeg';
        const base64Data = fs.readFileSync(absPath).toString('base64');
        resolved = `data:${mime};base64,${base64Data}`;
      }
    }
    return `<div class="doc-image-container"><img src="${resolved}" alt="${alt}" class="doc-image" /><div class="doc-image-caption">${alt}</div></div>`;
  });

  return processed;
}

function buildHtmlTemplate({ title, subtitle, documentType, version, date, bodyHtml }) {
  return `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <title>${title}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,600;0,700;1,600&family=Plus+Jakarta+Sans:ital,wght@0,400;0,500;0,600;0,700;1,400&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet">
  <style>
    @page {
      size: A4;
      margin: 20mm 18mm 20mm 18mm;
      @bottom-right {
        content: counter(page);
      }
    }

    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    body {
      font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 9.5pt;
      line-height: 1.55;
      color: #171513;
      background-color: #FFFFFF;
      margin: 0;
      padding: 0;
    }

    /* Cover Page */
    .cover-page {
      page-break-after: always;
      height: 250mm;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      padding: 25mm 15mm 15mm 15mm;
      border: 1px solid #E5E1DA;
      background: linear-gradient(180deg, #F7F5F0 0%, #FFFFFF 100%);
      position: relative;
    }

    .cover-header {
      display: flex;
      align-items: center;
      gap: 16px;
      border-bottom: 2px solid #8B5E3C;
      padding-bottom: 20px;
    }

    .cover-logo {
      height: 64px;
      width: auto;
      object-fit: contain;
    }

    .cover-brand-text {
      display: flex;
      flex-direction: column;
    }

    .cover-brand-name {
      font-family: 'Cormorant Garamond', Georgia, serif;
      font-size: 28pt;
      font-weight: 700;
      color: #171513;
      line-height: 1;
      letter-spacing: 0.5px;
    }

    .cover-brand-tagline {
      font-size: 9pt;
      font-weight: 600;
      color: #8B5E3C;
      text-transform: uppercase;
      letter-spacing: 2px;
      margin-top: 4px;
    }

    .cover-body {
      margin-top: 40px;
      flex-grow: 1;
    }

    .cover-badge {
      display: inline-block;
      background-color: #EAD9C5;
      color: #8B5E3C;
      font-size: 8pt;
      font-weight: 700;
      letter-spacing: 1.5px;
      text-transform: uppercase;
      padding: 4px 12px;
      border-radius: 4px;
      margin-bottom: 16px;
    }

    .cover-title {
      font-family: 'Cormorant Garamond', Georgia, serif;
      font-size: 32pt;
      font-weight: 700;
      color: #171513;
      line-height: 1.15;
      margin: 0 0 16px 0;
    }

    .cover-subtitle {
      font-size: 12.5pt;
      font-weight: 500;
      color: #6E6A63;
      line-height: 1.45;
      margin: 0 0 30px 0;
      max-width: 90%;
    }

    .cover-meta-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 16px;
      background-color: #FFFFFF;
      border: 1px solid #E5E1DA;
      border-radius: 6px;
      padding: 16px 20px;
      margin-top: 30px;
    }

    .cover-meta-item {
      display: flex;
      flex-direction: column;
    }

    .cover-meta-label {
      font-size: 7.5pt;
      font-weight: 700;
      color: #8B5E3C;
      text-transform: uppercase;
      letter-spacing: 1px;
    }

    .cover-meta-value {
      font-size: 9.5pt;
      font-weight: 600;
      color: #171513;
      margin-top: 2px;
    }

    .cover-footer {
      border-top: 1px solid #E5E1DA;
      padding-top: 15px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 8pt;
      color: #6E6A63;
    }

    /* Headings */
    h1 {
      font-family: 'Cormorant Garamond', Georgia, serif;
      font-size: 20pt;
      font-weight: 700;
      color: #171513;
      border-bottom: 1.5px solid #8B5E3C;
      padding-bottom: 6px;
      margin-top: 24pt;
      margin-bottom: 12pt;
      page-break-before: always;
      break-after: avoid;
    }

    h2 {
      font-family: 'Cormorant Garamond', Georgia, serif;
      font-size: 15pt;
      font-weight: 700;
      color: #171513;
      margin-top: 16pt;
      margin-bottom: 8pt;
      break-after: avoid;
    }

    h3 {
      font-size: 11pt;
      font-weight: 700;
      color: #8B5E3C;
      margin-top: 12pt;
      margin-bottom: 6pt;
      break-after: avoid;
    }

    h4 {
      font-size: 10pt;
      font-weight: 700;
      color: #171513;
      margin-top: 10pt;
      margin-bottom: 4pt;
      break-after: avoid;
    }

    p {
      margin-top: 0;
      margin-bottom: 8pt;
      text-align: justify;
    }

    ul, ol {
      margin-top: 0;
      margin-bottom: 10pt;
      padding-left: 20px;
    }

    li {
      margin-bottom: 3pt;
    }

    /* Tables */
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 12pt 0;
      font-size: 8.5pt;
      page-break-inside: avoid;
    }

    th {
      background-color: #171513;
      color: #FFFFFF;
      font-weight: 600;
      text-align: left;
      padding: 6pt 8pt;
      border: 1px solid #171513;
      letter-spacing: 0.3px;
    }

    td {
      padding: 5pt 8pt;
      border: 1px solid #E5E1DA;
      vertical-align: top;
    }

    tr:nth-child(even) td {
      background-color: #F7F5F0;
    }

    /* Alerts */
    .alert-box {
      border-left: 4px solid #8B5E3C;
      background-color: #F7F5F0;
      padding: 8pt 12pt;
      margin: 10pt 0;
      border-radius: 0 6px 6px 0;
      page-break-inside: avoid;
    }

    .alert-note {
      border-left-color: #3B82F6;
      background-color: #EFF6FF;
    }

    .alert-important {
      border-left-color: #8B5E3C;
      background-color: #FDF8F3;
    }

    .alert-warning {
      border-left-color: #F59E0B;
      background-color: #FFFBEB;
    }

    .alert-caution {
      border-left-color: #EF4444;
      background-color: #FEF2F2;
    }

    .alert-title {
      font-size: 8pt;
      font-weight: 700;
      letter-spacing: 1px;
      text-transform: uppercase;
      margin-bottom: 3pt;
      color: #171513;
    }

    .alert-note .alert-title { color: #1D4ED8; }
    .alert-important .alert-title { color: #8B5E3C; }
    .alert-warning .alert-title { color: #B45309; }
    .alert-caution .alert-title { color: #DC2626; }

    .alert-content p:last-child {
      margin-bottom: 0;
    }

    /* Code Blocks & Monospace */
    code {
      font-family: 'JetBrains Mono', 'Courier New', monospace;
      font-size: 8.5pt;
      background-color: #F7F5F0;
      color: #8B5E3C;
      padding: 1pt 3pt;
      border-radius: 3px;
      border: 1px solid #E5E1DA;
    }

    pre {
      font-family: 'JetBrains Mono', 'Courier New', monospace;
      font-size: 8pt;
      background-color: #171513;
      color: #F7F5F0;
      padding: 10pt 12pt;
      border-radius: 6px;
      overflow-x: auto;
      margin: 10pt 0;
      line-height: 1.45;
      page-break-inside: avoid;
    }

    pre code {
      background-color: transparent;
      color: #F7F5F0;
      padding: 0;
      border: none;
    }

    /* Images & Diagrams */
    .doc-image-container {
      margin: 14pt 0;
      text-align: center;
      page-break-inside: avoid;
    }

    .doc-image {
      max-width: 100%;
      height: auto;
      max-height: 115mm;
      border: 1px solid #E5E1DA;
      border-radius: 6px;
      box-shadow: 0 2px 6px rgba(0,0,0,0.04);
    }

    .doc-image-caption {
      font-size: 8pt;
      font-weight: 600;
      color: #6E6A63;
      margin-top: 5pt;
      font-style: italic;
    }

    hr {
      border: none;
      border-top: 1px solid #E5E1DA;
      margin: 16pt 0;
    }

    blockquote {
      margin: 10pt 0;
      padding: 6pt 12pt;
      border-left: 3px solid #8B5E3C;
      color: #6E6A63;
      font-style: italic;
      background-color: #F7F5F0;
    }
  </style>
</head>
<body>

  <!-- Official Cover Page -->
  <div class="cover-page">
    <div class="cover-header">
      ${logoBase64 ? `<img src="${logoBase64}" class="cover-logo" alt="Pinto Kopi Logo" />` : ''}
      <div class="cover-brand-text">
        <span class="cover-brand-name">PINTÖ KUPI</span>
        <span class="cover-brand-tagline">Roasted and Eatery · Bogor</span>
      </div>
    </div>

    <div class="cover-body">
      <div class="cover-badge">${documentType}</div>
      <h1 class="cover-title" style="page-break-before: avoid; border: none; padding: 0;">${title}</h1>
      <p class="cover-subtitle">${subtitle}</p>

      <div class="cover-meta-grid">
        <div class="cover-meta-item">
          <span class="cover-meta-label">Situs Produksi</span>
          <span class="cover-meta-value">https://pintokupi.my.id</span>
        </div>
        <div class="cover-meta-item">
          <span class="cover-meta-label">Versi Dokumen</span>
          <span class="cover-meta-value">Versi ${version} (Production Release)</span>
        </div>
        <div class="cover-meta-item">
          <span class="cover-meta-label">Tanggal Efektif</span>
          <span class="cover-meta-value">${date}</span>
        </div>
        <div class="cover-meta-item">
          <span class="cover-meta-label">Klasifikasi Akses</span>
          <span class="cover-meta-value">Official Internal Handbook</span>
        </div>
      </div>
    </div>

    <div class="cover-footer">
      <span>Jl. Flamboyan No. 8, Tajur Halang, Bogor</span>
      <span>© 2026 P1NTO Kopi. Seluruh Hak Cipta Dilindungi.</span>
    </div>
  </div>

  <!-- Body Content -->
  <div class="content-body">
    ${bodyHtml}
  </div>

</body>
</html>`;
}

async function generatePdf(markdownPath, pdfOutputPath, meta) {
  console.log(`Generating PDF for ${path.basename(markdownPath)}...`);
  const rawMd = fs.readFileSync(markdownPath, 'utf-8');
  const basePath = path.dirname(markdownPath);
  const preprocessed = preprocessMarkdown(rawMd, basePath);
  
  if (!marked) {
    marked = require('marked');
  }
  const bodyHtml = marked.parse(preprocessed);

  const fullHtml = buildHtmlTemplate({
    ...meta,
    bodyHtml,
  });

  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  // Set content and wait for network/fonts
  await page.setContent(fullHtml, { waitUntil: 'load' });
  await page.waitForTimeout(1500);

  const headerTemplate = `
    <div style="font-size: 7.5pt; font-family: 'Plus Jakarta Sans', sans-serif; color: #8B5E3C; width: 100%; border-bottom: 1px solid #E5E1DA; padding-bottom: 3px; margin: 0 18mm; display: flex; justify-content: space-between;">
      <span style="font-weight: 700;">P1NTO KOPI — OFFICIAL SYSTEM MANUAL</span>
      <span style="color: #6E6A63;">pintokupi.my.id</span>
    </div>
  `;

  const footerTemplate = `
    <div style="font-size: 7.5pt; font-family: 'Plus Jakarta Sans', sans-serif; color: #6E6A63; width: 100%; border-top: 1px solid #E5E1DA; padding-top: 3px; margin: 0 18mm; display: flex; justify-content: space-between;">
      <span>Internal Operational Document · Versi ${meta.version}</span>
      <span>Halaman <span class="pageNumber"></span> dari <span class="totalPages"></span></span>
    </div>
  `;

  await page.pdf({
    path: pdfOutputPath,
    format: 'A4',
    printBackground: true,
    margin: {
      top: '18mm',
      bottom: '18mm',
      left: '0mm',
      right: '0mm',
    },
    displayHeaderFooter: true,
    headerTemplate,
    footerTemplate,
  });

  await browser.close();
  const stats = fs.statSync(pdfOutputPath);
  console.log(`PDF Generated successfully: ${pdfOutputPath} (${Math.round(stats.size / 1024)} KB)`);
}

async function main() {
  const pintoDir = path.join(__dirname, '..', 'docs', 'pinto');

  // Document A: Owner & Admin Operations Manual
  await generatePdf(
    path.join(pintoDir, 'P1NTO_OWNER_ADMIN_MANUAL.md'),
    path.join(pintoDir, 'P1NTO_OWNER_ADMIN_MANUAL.pdf'),
    {
      title: 'Sistem Operasional & Panduan Penggunaan',
      subtitle: 'Buku Panduan Standar Operasional Prosedur (SOP) Pemesanan Cashier-First, Hak Akses & Akun Staf, Manajemen Meja, dan Struk Hemat Kertas Pinto Kupi',
      documentType: 'BUKU PANDUAN OPERASIONAL (OWNER & ADMIN)',
      version: '1.1.0',
      date: '20 September 2026',
    }
  );

  // Document B: System Technical Documentation
  await generatePdf(
    path.join(pintoDir, 'P1NTO_SYSTEM_DOCUMENTATION.md'),
    path.join(pintoDir, 'P1NTO_SYSTEM_DOCUMENTATION.pdf'),
    {
      title: 'Dokumentasi Sistem & Referensi Teknis',
      subtitle: 'Spesifikasi Arsitektur Next.js 16, PostgreSQL/Supabase Data Layer, Security Definer RPCs, Mesin Status Pesanan, dan Integrasi Printer ESC/POS',
      documentType: 'REFERENSI TEKNIS SISTEM & ARSITEKTUR',
      version: '1.1.0',
      date: '20 September 2026',
    }
  );
}

main().catch(err => {
  console.error('PDF Generation Error:', err);
  process.exit(1);
});
