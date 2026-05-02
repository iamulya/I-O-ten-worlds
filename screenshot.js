import puppeteer from 'puppeteer';
(async () => {
    const browser = await puppeteer.launch({ args: ['--no-sandbox'] });
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 720 });
    await page.goto('http://localhost:3000');
    await new Promise(r => setTimeout(r, 2000));
    await page.screenshot({path: 'screenshot_2s.png'});
    await new Promise(r => setTimeout(r, 4000));
    await page.screenshot({path: 'screenshot_6s.png'});
    await browser.close();
})();
