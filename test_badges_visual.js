import { spawn } from 'child_process';
import puppeteer from 'puppeteer';

const port = 3199;
const baseUrl = `http://127.0.0.1:${port}`;

const waitForServer = async () => {
  const deadline = Date.now() + 45_000;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(baseUrl);
      if (response.ok) return;
    } catch {
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }
  throw new Error(`Vite server did not become ready at ${baseUrl}`);
};

const stopServer = async (server) => {
  if (!server.pid) return;
  if (process.platform === 'win32') {
    spawn('taskkill', ['/PID', String(server.pid), '/T', '/F'], { stdio: 'ignore' });
    return;
  }
  server.kill('SIGTERM');
};

const storageState = {
  state: {
    hasOnboarded: true,
    isDarkMode: false,
    madhab: "Shafi'i",
    language: 'English',
    userProfile: { name: 'Guest User', email: 'guest@example.com', avatar: null },
    scans: [
      {
        id: 'haram',
        date: new Date().toISOString(),
        barcode: '1',
        name: 'Red Candy',
        brand: 'Demo',
        image: null,
        ingredients: 'sugar, E120',
        verdict: 'NON-COMPLIANT',
        confidence: 98,
        flagged_ingredients: ['E120'],
        reason: 'One or more ingredients were classified as haram.',
        recommendation: 'Avoid this product.',
      },
      {
        id: 'review',
        date: new Date().toISOString(),
        barcode: '2',
        name: 'Gummies',
        brand: 'Demo',
        image: null,
        ingredients: 'sugar, gelatin',
        verdict: 'HALAL COMPLIANT',
        confidence: 84,
        flagged_ingredients: [],
        reason: 'No haram ingredient was detected.',
        recommendation: 'Check certification separately if needed.',
      },
      {
        id: 'halal',
        date: new Date().toISOString(),
        barcode: '3',
        name: 'Rice Crackers',
        brand: 'Demo',
        image: null,
        ingredients: 'rice, salt',
        verdict: 'HALAL COMPLIANT',
        confidence: 94,
        flagged_ingredients: [],
        reason: 'All ingredients were classified as halal.',
        recommendation: 'Product is compliant.',
      },
    ],
  },
  version: 0,
};

const server = spawn(process.execPath, ['./node_modules/vite/bin/vite.js', `--port=${port}`, '--host=127.0.0.1'], {
  stdio: 'ignore',
});

try {
  await waitForServer();
  const browser = await puppeteer.launch({
    headless: true,
    pipe: true,
    timeout: 90_000,
    protocolTimeout: 90_000,
    args: ['--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu'],
  });
  const page = await browser.newPage();
  await page.setRequestInterception(true);
  page.on('request', request => {
    if (request.url().endsWith('/api/history')) {
      request.respond({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ history: [] }),
      });
      return;
    }
    request.continue();
  });
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 1 });
  await page.goto(baseUrl, { waitUntil: 'networkidle0' });
  await page.evaluate(value => localStorage.setItem('halalscan-storage', JSON.stringify(value)), storageState);
  await page.goto(`${baseUrl}/history`, { waitUntil: 'networkidle0' });

  const badgeTexts = await page.$$eval(
    '.bg-red-600, .bg-green-600, .bg-amber-600',
    nodes => nodes.map(node => node.textContent?.trim()).filter(Boolean)
  );
  const bodyText = await page.$eval('body', node => node.textContent || '');
  await browser.close();

  for (const expected of ['HARAM', 'HALAL']) {
    if (!badgeTexts.includes(expected)) {
      throw new Error(`Expected visible badge ${expected}; got ${JSON.stringify(badgeTexts)}`);
    }
  }
  for (const forbidden of ['NON-COMPLIANT', 'HALAL COMPLIANT', 'REQUIRES REVIEW']) {
    if (badgeTexts.some(text => text?.includes(forbidden))) {
      throw new Error(`Long rubric label leaked into main badge: ${forbidden}`);
    }
  }
  if (!bodyText.includes('Non-compliant: haram trigger detected')) {
    throw new Error('Expected secondary compliance text for HARAM scan.');
  }
  if (badgeTexts.includes('MASHBOOH')) {
    throw new Error(`MASHBOOH should not appear in binary product badges: ${JSON.stringify(badgeTexts)}`);
  }

  console.log('badge visual smoke: passed', badgeTexts);
} finally {
  await stopServer(server);
}
