import { Browser } from "puppeteer";

export default async function getNewSignedInPage(browser: Browser) {
    console.log('--> start signIn process');
    const page = await browser.newPage();

    console.log('process.env.ENDPOINT_URL', process.env.ENDPOINT_URL);
    await page.goto(process.env.ENDPOINT_URL || '', { timeout: 0 });
    await page.waitForSelector('.MuiInputBase-input', { timeout: 0 });
    
    console.log('process.env.ENDPOINT_USER', '******');
    await page.focus('input[name=cpf]');
    await page.keyboard.type(process.env.ENDPOINT_USER || '');

    console.log('process.env.ENDPOINT_PASS', '******');
    await page.focus('input[name=password]');
    await page.keyboard.type(process.env.ENDPOINT_PASS || '');

    await page.$eval('button[type=submit]', el => el.click());
    await page.waitForSelector('button[aria-label=menu]', { timeout: 0 });
    console.log('--> signed in');

    return page;
}
