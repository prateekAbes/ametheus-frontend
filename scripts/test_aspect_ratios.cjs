const { chromium } = require('playwright-core');
const fs = require('fs');
const path = require('path');
const http = require('http');

// Generate SVG images of various aspect ratios with clear geometric markers and text
function createTestSvg(width, height, label, color) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
    <defs>
      <linearGradient id="g_${width}_${height}" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${color}"/>
        <stop offset="100%" stop-color="#020617"/>
      </linearGradient>
    </defs>
    <rect width="${width}" height="${height}" fill="url(#g_${width}_${height})"/>
    <rect x="20" y="20" width="${width - 40}" height="${height - 40}" fill="none" stroke="white" stroke-width="8"/>
    <circle cx="${width/2}" cy="${height/2}" r="${Math.min(width, height) / 3}" fill="none" stroke="#3ef2ff" stroke-width="6" stroke-dasharray="16 16"/>
    <circle cx="${width/2}" cy="${height/2}" r="24" fill="#3ef2ff"/>
    <text x="${width/2}" y="${height/2 - 35}" font-family="system-ui, sans-serif" font-weight="900" font-size="${Math.max(28, Math.min(width, height)/10)}" fill="#ffffff" text-anchor="middle" dominant-baseline="central">${label}</text>
    <text x="${width/2}" y="${height/2 + 45}" font-family="monospace" font-weight="700" font-size="${Math.max(20, Math.min(width, height)/16)}" fill="#3ef2ff" text-anchor="middle" dominant-baseline="central">${width}x${height} (${(width/height).toFixed(2)}:1)</text>
    <line x1="0" y1="0" x2="${width}" y2="${height}" stroke="rgba(255,255,255,0.2)" stroke-width="4"/>
    <line x1="${width}" y1="0" x2="0" y2="${height}" stroke="rgba(255,255,255,0.2)" stroke-width="4"/>
  </svg>`;
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
}

const TEST_IMAGES = [
  { name: '16:9 Widescreen', ratio: '16/9', src: createTestSvg(1920, 1080, '16:9 WIDESCREEN', '#1e3a8a') },
  { name: '4:3 Standard', ratio: '4/3', src: createTestSvg(1600, 1200, '4:3 STANDARD', '#0f766e') },
  { name: '1:1 Square', ratio: '1/1', src: createTestSvg(1000, 1000, '1:1 SQUARE', '#6b21a8') },
  { name: '3:4 Portrait', ratio: '3/4', src: createTestSvg(750, 1000, '3:4 PORTRAIT', '#9d174d') },
  { name: '9:16 Vertical Story', ratio: '9/16', src: createTestSvg(1080, 1920, '9:16 VERTICAL', '#c2410c') },
];

// Read compiled CSS from dist/
const distDir = path.resolve(__dirname, '../dist');
let cssContent = '';
if (fs.existsSync(distDir)) {
  const assets = fs.readdirSync(path.join(distDir, 'assets'));
  const cssFile = assets.find(f => f.endsWith('.css'));
  if (cssFile) {
    cssContent = fs.readFileSync(path.join(distDir, 'assets', cssFile), 'utf8');
  }
}

// Build a standalone test HTML page that mirrors exact React components
function generateHtml() {
  return `<!DOCTYPE html>
<html lang="en" class="dark">
<head>
  <meta charset="UTF-8">
  <title>Ametheus Aspect Ratio & Ambient Display Verification</title>
  <style>
    ${cssContent}
    body {
      background-color: #05060a;
      color: #f1f5f9;
      font-family: system-ui, sans-serif;
      padding: 30px;
    }
    .test-section {
      margin-bottom: 60px;
    }
    .section-title {
      font-size: 24px;
      font-weight: 900;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      margin-bottom: 8px;
      color: #3ef2ff;
      border-bottom: 1px solid rgba(255,255,255,0.1);
      padding-bottom: 8px;
    }
    .section-subtitle {
      font-size: 13px;
      color: #94a3b8;
      margin-bottom: 24px;
      font-family: monospace;
    }
    .grid-container {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 24px;
    }
  </style>
</head>
<body>
  <div style="max-width: 1400px; margin: 0 auto;">
    <header style="margin-bottom: 40px; border-bottom: 2px solid #3ef2ff; padding-bottom: 16px;">
      <h1 style="font-size: 32px; font-weight: 900; text-transform: uppercase; margin: 0; color: #fff;">
        Ametheus — Universal Aspect Ratio & Rendering Verification
      </h1>
      <p style="color: #94a3b8; font-family: monospace; font-size: 13px; margin-top: 6px;">
        Testing 16:9, 4:3, 1:1, 3:4, and 9:16 uploads inside TournamentCard (16:9 container) and GameCard (4:5 container).
      </p>
    </header>

    <!-- SECTION 1: TOURNAMENT CARDS (aspect-[16/9] container) -->
    <div class="test-section">
      <div class="section-title">1. Tournament Cards (16:9 Container Geometry)</div>
      <div class="section-subtitle">Verifying that non-16:9 artwork (square, 4:3, portrait, vertical) is completely visible without top/bottom cropping or blank voids</div>
      <div class="grid-container">
        ${TEST_IMAGES.map((img, idx) => `
          <div class="group relative flex h-full flex-col overflow-hidden border border-white/10 bg-surface transition-colors duration-300 hover:border-white/25">
            <div class="relative overflow-hidden bg-graphite aspect-[16/9]">
              <!-- DynamicImage mode="ambient" -->
              <div class="relative size-full overflow-hidden">
                <!-- Ambient Backdrop Layer -->
                <img src="${img.src}" alt="" aria-hidden="true" class="absolute inset-0 size-full object-cover blur-2xl opacity-40 scale-125 pointer-events-none select-none" />
                <!-- Contained Foreground Layer -->
                <img src="${img.src}" alt="${img.name}" class="size-full opacity-85 transition-transform duration-700 group-hover:scale-105 object-contain object-center relative z-0" />
              </div>
              <div class="absolute inset-0 pointer-events-none" style="background: linear-gradient(to top, #12141d, transparent 65%), linear-gradient(120deg, #3ef2ff33, transparent 50%);"></div>
              <div class="absolute left-4 top-4 flex flex-wrap gap-1.5">
                <span class="inline-flex items-center gap-1.5 border border-white/15 bg-surface/90 px-2 py-0.5 font-mono text-[10px] font-extrabold uppercase tracking-widest text-ink backdrop-blur-sm">
                  ${img.name}
                </span>
              </div>
              <span class="absolute right-4 top-3 font-display text-sm font-black tracking-[0.15em] text-cyan">TEST-${idx + 1}</span>
            </div>
            <div class="relative flex flex-1 flex-col p-5">
              <h3 class="font-display font-black uppercase text-2xl leading-[0.92]">Tournament #${idx + 1} (${img.ratio})</h3>
              <div class="mt-2 font-mono text-[11px] text-dim">Single Master Upload · Ambient Adaptive</div>
              <div class="mt-auto grid grid-cols-2 gap-3 pt-4 border-t border-white/10 mt-4">
                <div>
                  <span class="font-mono text-[10px] text-dim block">Prize Pool</span>
                  <span class="font-display text-xl font-black text-cyan">₹1,00,000</span>
                </div>
                <div>
                  <span class="font-mono text-[10px] text-dim block">Teams</span>
                  <span class="font-display text-xl font-black">16/32</span>
                </div>
              </div>
            </div>
          </div>
        `).join('')}
      </div>
    </div>

    <!-- SECTION 2: GAME CARDS (aspect-[4/5] portrait container) -->
    <div class="test-section">
      <div class="section-title">2. Game Cards (4:5 Portrait Container Geometry)</div>
      <div class="section-subtitle">Verifying that widescreen 16:9, 4:3, 1:1, and 9:16 artwork fits 4:5 cards with zero left/right clipping or subject loss</div>
      <div class="grid-container" style="grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));">
        ${TEST_IMAGES.map((img, idx) => `
          <div class="group relative flex aspect-[4/5] flex-col justify-between overflow-hidden border border-white/10 bg-surface p-6 transition-all duration-500 hover:border-cyan/50">
            <!-- DynamicImage mode="ambient" -->
            <div class="absolute inset-0 size-full overflow-hidden">
              <!-- Ambient Backdrop Layer -->
              <img src="${img.src}" alt="" aria-hidden="true" class="absolute inset-0 size-full object-cover blur-2xl opacity-35 scale-125 pointer-events-none select-none" />
              <!-- Contained Foreground Layer -->
              <img src="${img.src}" alt="${img.name}" class="size-full opacity-80 grayscale-[35%] transition-[transform,opacity] duration-700 group-hover:scale-105 group-hover:opacity-95 group-hover:grayscale-0 object-contain object-center relative z-0" />
            </div>
            <div class="absolute inset-0 pointer-events-none" style="background: linear-gradient(to top, #05060a 15%, transparent 65%), radial-gradient(ellipse at 0% 100%, #3ef2ff44, transparent 60%);"></div>
            <span class="absolute inset-x-0 top-0 h-[2px] origin-left scale-x-0 transition-transform duration-500 group-hover:scale-x-100" style="background: #3ef2ff;"></span>
            
            <div class="relative z-10 flex items-center justify-between">
              <span class="font-mono text-xs text-dim">0${idx + 1} · ${img.name}</span>
              <span class="border border-white/15 bg-surface/90 px-2 py-0.5 font-mono text-[9px] uppercase tracking-wider text-cyan">ACTIVE</span>
            </div>

            <div class="relative z-10">
              <h3 class="font-display font-black uppercase text-3xl leading-[0.88] text-white">GAME ${idx + 1}</h3>
              <p class="font-mono text-[11px] text-cyan mt-1">${img.ratio} Asset (${img.name})</p>
              <div class="mt-4 flex items-center justify-between border-t border-white/10 pt-3">
                <span class="font-mono text-[10px] text-dim uppercase">Cross-Platform</span>
                <span class="font-display text-sm font-extrabold text-cyan">ENTER →</span>
              </div>
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  </div>
</body>
</html>`;
}

async function run() {
  const html = generateHtml();
  const testHtmlPath = path.resolve(__dirname, 'test_aspect_ratios.html');
  fs.writeFileSync(testHtmlPath, html, 'utf8');

  // Start local HTTP server to serve the page
  const server = http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(html);
  });

  await new Promise(resolve => server.listen(4892, '127.0.0.1', resolve));
  console.log('Test server listening on http://127.0.0.1:4892');

  // Launch browser using edge or chromium from playwright
  let browser;
  try {
    browser = await chromium.launch({
      headless: true,
      channel: 'msedge'
    });
  } catch {
    browser = await chromium.launch({
      headless: true,
      channel: 'chrome'
    });
  }

  const page = await browser.newPage({
    viewport: { width: 1440, height: 1600 }
  });

  await page.goto('http://127.0.0.1:4892');
  await page.waitForTimeout(500);

  // Take screenshot of desktop verification
  const screenshotDesktop = 'C:/Users/PRATEEK/.gemini/antigravity/brain/64c83c2b-2d0d-44c2-b64a-253d711cf8a9/aspect_ratio_verification_desktop.png';
  await page.screenshot({ path: screenshotDesktop, fullPage: true });
  console.log('Saved desktop verification screenshot to:', screenshotDesktop);

  // Test mobile viewport
  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(300);
  const screenshotMobile = 'C:/Users/PRATEEK/.gemini/antigravity/brain/64c83c2b-2d0d-44c2-b64a-253d711cf8a9/aspect_ratio_verification_mobile.png';
  await page.screenshot({ path: screenshotMobile, fullPage: true });
  console.log('Saved mobile verification screenshot to:', screenshotMobile);

  // Measure rendered images to guarantee no distortion
  const measurements = await page.evaluate(() => {
    const results = [];
    const fgImages = document.querySelectorAll('.grid-container img.object-contain');
    fgImages.forEach((img) => {
      const rect = img.getBoundingClientRect();
      const style = window.getComputedStyle(img);
      results.push({
        alt: img.alt,
        objectFit: style.objectFit,
        width: rect.width,
        height: rect.height,
        naturalWidth: img.naturalWidth,
        naturalHeight: img.naturalHeight,
      });
    });
    return results;
  });

  console.log('Measured foreground images:');
  console.log(JSON.stringify(measurements, null, 2));

  await browser.close();
  server.close();
  fs.unlinkSync(testHtmlPath);
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
