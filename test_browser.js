import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('BROWSER CONSOLE:', msg.text()));
  page.on('pageerror', error => console.log('BROWSER ERROR:', error.message));

  console.log('Navigating to http://localhost:3000/');
  await page.goto('http://localhost:3000/', { waitUntil: 'networkidle2' });
  
  // Set localStorage to bypass onboarding
  await page.evaluate(() => {
    localStorage.setItem('halalscan-storage', JSON.stringify({ state: { hasOnboarded: true, madhab: 'General' }, version: 0 }));
  });
  
  console.log('Navigating to chat...');
  await page.goto('http://localhost:3000/chat', { waitUntil: 'networkidle2' });

  console.log('Typing message...');
  await page.waitForSelector('input[type="text"]');
  await page.type('input[type="text"]', 'hello');
  
  console.log('Submitting...');
  await page.click('button[type="submit"]');
  
  console.log('Waiting for response...');
  await new Promise(resolve => setTimeout(resolve, 5000));
  
  await browser.close();
})();
