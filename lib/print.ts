import { Page } from 'puppeteer';
import VARIABLES from './variables';

export default class Print {
    static async wholePage(page: Page) {    
        return;    
        await page.screenshot({
            path: `./output/loaded-project-scroll-${new Date().getTime()}.png`,
            clip: { x: 0, y: 0, width: VARIABLES.BROWSER_PAGE_WIDTH, height: VARIABLES.BROWSER_PAGE_HEIGHT }
        });
    }

    static async wholePageVar(page: Page, data: any) {
        await page.screenshot({
            path: `./output/teste-${data}.png`,
            clip: { x: 0, y: 0, width: VARIABLES.BROWSER_PAGE_WIDTH, height: VARIABLES.BROWSER_PAGE_HEIGHT }
        });
    }
}