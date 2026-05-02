import puppeteer from 'puppeteer';

(async () => {
    try {
        const browser = await puppeteer.launch({ args: ['--no-sandbox'] });
        const page = await browser.newPage();
        await page.goto('http://localhost:3000');
        // wait for some time
        await new Promise(r => setTimeout(r, 2000));
        const num = await page.$eval('#hud-number', el => el.innerText);
        const name = await page.$eval('#hud-name', el => el.innerText);
        
        console.log("HUD Number:", num);
        console.log("HUD Name:", name);
        
        // Wait 7 more seconds to see if state changes
        await new Promise(r => setTimeout(r, 7000));
        const num2 = await page.$eval('#hud-number', el => el.innerText);
        console.log("HUD Number later:", num2);

        const hasNonZeroHeights = await page.evaluate(() => {
            const arr = window._test_maps ? window._test_maps[0] : null;
            if (!arr) return false;
            let max = 0;
            for(let i=0; i<arr.length; i++) if(arr[i]>max) max = arr[i];
            return max;
        });
        console.log("Max height:", hasNonZeroHeights);

        await browser.close();
    } catch(e) {
        console.error(e);
        process.exit(1);
    }
})();
