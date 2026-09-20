const fs = require('fs');
const path = require('path');

const DOCS_DIR = path.join(__dirname, '..', 'docs', 'pinto');

function checkFile(relPath, minSize = 100) {
  const fullPath = path.join(DOCS_DIR, relPath);
  if (!fs.existsSync(fullPath)) {
    console.error(`[FAIL] File missing: ${relPath}`);
    return false;
  }
  const stat = fs.statSync(fullPath);
  if (stat.size < minSize) {
    console.error(`[FAIL] File suspiciously small (${stat.size} bytes): ${relPath}`);
    return false;
  }
  console.log(`[PASS] ${relPath} (${Math.round(stat.size / 1024)} KB)`);
  return true;
}

function checkMarkdownLinks(mdFileName) {
  const fullPath = path.join(DOCS_DIR, mdFileName);
  const content = fs.readFileSync(fullPath, 'utf8');
  const imgRegex = /!\[(.*?)\]\((.*?)\)/g;
  let match;
  let allPass = true;

  console.log(`\nValidating image references in ${mdFileName}:`);
  while ((match = imgRegex.exec(content)) !== null) {
    const imgPath = match[2];
    if (imgPath.startsWith('http') || imgPath.startsWith('data:')) continue;
    const resolvedPath = path.resolve(DOCS_DIR, imgPath);
    if (fs.existsSync(resolvedPath)) {
      console.log(`  ✓ ${imgPath}`);
    } else {
      console.error(`  ✗ Missing image: ${imgPath} (resolved: ${resolvedPath})`);
      allPass = false;
    }
  }
  return allPass;
}

function runAudit() {
  console.log('=== P1NTO KOPI DOCUMENTATION CONSISTENCY AUDIT ===\n');

  const filesToCheck = [
    'README.md',
    'P1NTO_OWNER_ADMIN_MANUAL.md',
    'P1NTO_SYSTEM_DOCUMENTATION.md',
    'P1NTO_OWNER_ADMIN_MANUAL.pdf',
    'P1NTO_SYSTEM_DOCUMENTATION.pdf',
    'assets/Pintokupi.webp',
    'diagrams/flow_cashier_first.svg',
    'diagrams/order_lifecycle.svg',
    'diagrams/session_billing.svg',
    'diagrams/table_state_model.svg',
    'diagrams/architecture_system.svg',
    'screenshots/01_homepage.png',
    'screenshots/02_public_menu.png',
    'screenshots/03_table_qr_no_session.png',
    'screenshots/04_admin_login.png',
  ];

  let passed = true;
  for (const f of filesToCheck) {
    if (!checkFile(f)) passed = false;
  }

  if (!checkMarkdownLinks('P1NTO_OWNER_ADMIN_MANUAL.md')) passed = false;
  if (!checkMarkdownLinks('P1NTO_SYSTEM_DOCUMENTATION.md')) passed = false;

  if (passed) {
    console.log('\n>>> ALL DOCUMENTATION CHECKS PASSED! <<<');
  } else {
    console.error('\n>>> SOME DOCUMENTATION CHECKS FAILED! <<<');
    process.exit(1);
  }
}

runAudit();
