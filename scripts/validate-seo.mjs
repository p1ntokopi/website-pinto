import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const sitemapPath = path.join(rootDir, '.next', 'server', 'app', 'sitemap.xml.body');
const robotsPath = path.join(rootDir, '.next', 'server', 'app', 'robots.txt.body');

let failures = 0;

function assert(condition, message) {
  if (!condition) {
    console.error(`❌ FAIL: ${message}`);
    failures++;
  } else {
    console.log(`✅ PASS: ${message}`);
  }
}

console.log('\n========================================');
console.log('🔍 RUNNING PRODUCTION SEO & SITEMAP VALIDATION');
console.log('========================================\n');

// 1. SITEMAP VALIDATION
if (!fs.existsSync(sitemapPath)) {
  console.error(`⚠️ Sitemap build artifact not found at: ${sitemapPath}. Run 'npm run build' first.`);
  failures++;
} else {
  const sitemapContent = fs.readFileSync(sitemapPath, 'utf8');

  assert(!sitemapContent.includes('localhost'), 'sitemap.xml does NOT contain localhost');
  assert(!sitemapContent.includes('127.0.0.1'), 'sitemap.xml does NOT contain 127.0.0.1');
  assert(!sitemapContent.includes('www.pintokupi.my.id'), 'sitemap.xml does NOT use www (uses apex domain)');
  assert(sitemapContent.includes('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'), 'sitemap.xml contains valid XML namespace');

  const locMatches = [...sitemapContent.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1]);
  assert(locMatches.length > 0, `sitemap.xml contains ${locMatches.length} URLs`);

  const nonProduction = locMatches.filter(url => !url.startsWith('https://pintokupi.my.id'));
  assert(nonProduction.length === 0, `All sitemap URLs start with https://pintokupi.my.id (found invalid: ${nonProduction.join(', ')})`);

  const expectedPaths = ['', '/cafe', '/coffee', '/menu', '/story', '/locations'];
  for (const p of expectedPaths) {
    const full = `https://pintokupi.my.id${p}`;
    assert(locMatches.includes(full), `sitemap includes expected public route: ${full}`);
  }

  const forbiddenSegments = ['/admin', '/api', '/auth', '/t/'];
  for (const f of forbiddenSegments) {
    const leaked = locMatches.filter(url => url.includes(f));
    assert(leaked.length === 0, `sitemap does NOT leak private path '${f}'`);
  }
}

// 2. ROBOTS.TXT VALIDATION
if (!fs.existsSync(robotsPath)) {
  console.error(`⚠️ Robots build artifact not found at: ${robotsPath}. Run 'npm run build' first.`);
  failures++;
} else {
  const robotsContent = fs.readFileSync(robotsPath, 'utf8');

  assert(!robotsContent.includes('localhost'), 'robots.txt does NOT contain localhost');
  assert(!robotsContent.includes('127.0.0.1'), 'robots.txt does NOT contain 127.0.0.1');
  assert(robotsContent.includes('Sitemap: https://pintokupi.my.id/sitemap.xml'), 'robots.txt sitemap points to https://pintokupi.my.id/sitemap.xml');
  assert(robotsContent.includes('Allow: /'), 'robots.txt allows public root');
  assert(robotsContent.includes('Disallow: /admin/'), 'robots.txt disallows /admin/');
  assert(robotsContent.includes('Disallow: /api/'), 'robots.txt disallows /api/');
  assert(robotsContent.includes('Disallow: /auth/'), 'robots.txt disallows /auth/');
  assert(robotsContent.includes('Disallow: /t/'), 'robots.txt disallows /t/');
}

console.log('\n========================================');
if (failures === 0) {
  console.log('🎉 ALL PRODUCTION SEO AUDIT CHECKS PASSED!');
  console.log('========================================\n');
  process.exit(0);
} else {
  console.error(`❌ ${failures} SEO VALIDATION CHECK(S) FAILED.`);
  console.log('========================================\n');
  process.exit(1);
}
