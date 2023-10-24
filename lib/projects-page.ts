import { Page } from "puppeteer";

export async function accessProjectsPage(page: Page) {
    await page.$eval('button[aria-label=menu]', el => el.click());
    await page.waitForSelector('a[role=button]', { timeout: 0 });
    console.log('menu opened');

    await page.$eval('a[role=button]', el => el.click());
    await page.waitForSelector('.MuiGrid-root', { timeout: 0 });
    console.log('projects page accessed');
}

export async function accessProjectPage(signedInPage: Page, projectId: number) {
    console.log('--> start accessing project page');

    const pagePath = `${process.env.ENDPOINT_URL}/projetos/${projectId}/detalhe`;
    console.log('pagePath', pagePath);
    await signedInPage.goto(pagePath, { timeout: 0 });

    console.log('waiting to load project page');
    await signedInPage.waitForSelector('.MuiButtonBase-root.MuiButton-root.MuiButton-text', { timeout: 0 });

    await signedInPage.evaluate(() => {
        (document.querySelectorAll('.MuiButtonBase-root.MuiButton-root.MuiButton-text')[10] as any).click();
    });
    
    console.log('waiting to load planning page');
    try {
        await signedInPage.waitForSelector('div[aria-label=Tipo]', { timeout: 210000 });
    } catch {}

    await signedInPage.screenshot({
        path: './output/loaded-project.png',
        clip: { x: 0, y: 0, width: 2000, height: 2000 }
     });

    console.log('--> project planning page with loaded gantt chart is ready');
}
