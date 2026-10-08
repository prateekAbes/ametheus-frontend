const fs = require('fs');
const path = require('path');
const playwright = require('playwright-core');

function createIco(images) {
  // images: array of { width, height, buffer }
  const headerSize = 6;
  const dirEntrySize = 16;
  const count = images.length;
  const header = Buffer.alloc(headerSize);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // icon type
  header.writeUInt16LE(count, 4);

  let currentOffset = headerSize + count * dirEntrySize;
  const entries = [];
  for (const img of images) {
    const entry = Buffer.alloc(dirEntrySize);
    entry.writeUInt8(img.width >= 256 ? 0 : img.width, 0);
    entry.writeUInt8(img.height >= 256 ? 0 : img.height, 1);
    entry.writeUInt8(0, 2); // color count
    entry.writeUInt8(0, 3); // reserved
    entry.writeUInt16LE(1, 4); // color planes
    entry.writeUInt16LE(32, 6); // bpp
    entry.writeUInt32LE(img.buffer.length, 8); // size of image
    entry.writeUInt32LE(currentOffset, 12); // offset
    entries.push(entry);
    currentOffset += img.buffer.length;
  }

  return Buffer.concat([
    header,
    ...entries,
    ...images.map(img => img.buffer)
  ]);
}

async function run() {
  const browser = await playwright.chromium.launch({ channel: 'chrome' });
  const page = await browser.newPage();

  const srcPath = path.resolve(__dirname, '../public/icon-512x512.png');
  const srcBase64 = fs.readFileSync(srcPath).toString('base64');

  const targets = [
    { name: 'favicon-16x16.png', size: 16 },
    { name: 'favicon-32x32.png', size: 32 },
    { name: 'favicon-48x48.png', size: 48 },
    { name: 'favicon-96x96.png', size: 96 },
    { name: 'favicon-144x144.png', size: 144 },
    { name: 'favicon-192x192.png', size: 192 },
    { name: 'ametheus-icon.png', size: 192 },
    { name: 'apple-touch-icon.png', size: 180 },
    { name: 'favicon.png', size: 96 },
    { name: 'favicon-512x512.png', size: 512 },
    { name: 'icon-512x512.png', size: 512 }
  ];

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { margin: 0; background: transparent; }
          canvas { display: block; }
        </style>
      </head>
      <body>
        <img id="source" src="data:image/png;base64,${srcBase64}" />
      </body>
    </html>
  `;

  await page.setContent(html);

  // Wait for image to load
  await page.waitForFunction(() => {
    const img = document.getElementById('source');
    return img && img.complete && img.naturalWidth > 0;
  });

  const generatedBuffers = {};

  for (const target of targets) {
    const pngBuffer = await page.evaluate(async (sz) => {
      const img = document.getElementById('source');
      const canvas = document.createElement('canvas');
      canvas.width = sz;
      canvas.height = sz;
      const ctx = canvas.getContext('2d');
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, sz, sz);
      return new Promise((resolve) => {
        canvas.toBlob((blob) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result.split(',')[1]);
          reader.readAsDataURL(blob);
        }, 'image/png');
      });
    }, target.size);

    const buf = Buffer.from(pngBuffer, 'base64');
    generatedBuffers[target.name] = buf;
    if (!generatedBuffers[target.size]) {
      generatedBuffers[target.size] = buf;
    }
  }

  // Create favicon.ico with 16, 32, 48
  const icoBuffer = createIco([
    { width: 16, height: 16, buffer: generatedBuffers[16] },
    { width: 32, height: 32, buffer: generatedBuffers[32] },
    { width: 48, height: 48, buffer: generatedBuffers[48] }
  ]);

  const outputDirs = [
    path.resolve(__dirname, '../public'),
    path.resolve(__dirname, '../../frontend/public')
  ];

  for (const dir of outputDirs) {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    for (const [name, buf] of Object.entries(generatedBuffers)) {
      if (typeof name === 'string' && name.endsWith('.png')) {
        const dest = path.join(dir, name);
        fs.writeFileSync(dest, buf);
        console.log(`Saved ${dest} (${buf.length} bytes)`);
      }
    }

    const icoDest = path.join(dir, 'favicon.ico');
    fs.writeFileSync(icoDest, icoBuffer);
    console.log(`Saved ${icoDest} (${icoBuffer.length} bytes)`);
  }

  await browser.close();
  console.log('All favicons successfully generated!');
}

run().catch((err) => {
  console.error('Error generating favicons:', err);
  process.exit(1);
});
