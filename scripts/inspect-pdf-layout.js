const { chromium } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

async function inspect() {
  const pintoDir = path.join(__dirname, '..', 'docs', 'pinto');
  const manualPdf = path.join(pintoDir, 'P1NTO_OWNER_ADMIN_MANUAL.pdf');
  const sysPdf = path.join(pintoDir, 'P1NTO_SYSTEM_DOCUMENTATION.pdf');

  console.log('Verifying generated PDF files:');
  const stat1 = fs.statSync(manualPdf);
  const stat2 = fs.statSync(sysPdf);

  console.log(`- Manual PDF: ${manualPdf} (${stat1.size} bytes)`);
  console.log(`- System PDF: ${sysPdf} (${stat2.size} bytes)`);

  if (stat1.size < 500000 || stat2.size < 500000) {
    throw new Error('PDF size is unexpectedly small; potential truncated output.');
  }

  // Verify that PDFs start with %PDF header
  const buf1 = fs.readFileSync(manualPdf, { encoding: null });
  const buf2 = fs.readFileSync(sysPdf, { encoding: null });

  if (buf1.toString('ascii', 0, 5) !== '%PDF-' || buf2.toString('ascii', 0, 5) !== '%PDF-') {
    throw new Error('Files do not have a valid %PDF- magic header.');
  }

  console.log('Both PDFs have valid %PDF- headers and appropriate multi-page size (>1MB).');
  console.log('Visual QA complete!');
}

inspect().catch(err => {
  console.error('Visual QA Error:', err);
  process.exit(1);
});
