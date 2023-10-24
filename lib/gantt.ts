import { Page } from 'puppeteer';
import VARIABLES from './variables';

export default class Gantt {
    static async getVerticalScrollbar(page: Page) {
        return await page.$(VARIABLES.CHART_VERTICAL_SCROLL_CLASS);
    }

    static async getVerticalScrollbarHeight(page: Page) {
        const el: any = await page.$(VARIABLES.CHART_VERTICAL_SCROLL_HEIGHT_CLASS);
        const heightStr = await el.evaluate((e: any) => e.style.height);
        return parseInt(heightStr.replace('px', ''), 10);
    }

    static async getHorizontalScrollbar(page: Page) {
        return await page.$(VARIABLES.CHART_HORIZONTAL_SCROLL_CLASS);
    }

    static async getWidth(page: Page) {
        const gridEl: any = await page.$(VARIABLES.CHART_GRID_TITLE_CLASS);
        const gridBBox: any = await gridEl.boundingBox();

        const timelineEl: any = await page.$(VARIABLES.CHART_TIMELINE_CLASS);
        const timelineBBox: any = await timelineEl.boundingBox();

        await page.waitForTimeout(300);
        return gridBBox.width + timelineBBox.width;
    }

    static async getVisibleHeight(page: Page) {
        const contentEl: any = await page.$(VARIABLES.CHART_WRAPPER_CLASS);
        const bbox = await contentEl.boundingBox();

        await page.waitForTimeout(300);
        return bbox.height;
    }

    static async getHeight(page: Page) {
        const verticalScrollbar = await this.getVerticalScrollbar(page);
        
        if (verticalScrollbar) {
            return await this.getVerticalScrollbarHeight(page);
        } else {
            return await this.getVisibleHeight(page);
        }
    }

    static async getGridTitleWidth(page: Page) {
        const gridEl: any = await page.$(VARIABLES.CHART_TASK_TITLE_CLASS);
        const gridBbox: any = await gridEl.boundingBox();
        
        await page.waitForTimeout(300);
        return gridBbox.width;
    }

    static async printGridTitle(page: Page, line: number) {
        const width = await this.getGridTitleWidth(page);
        const height = await this.getVisibleHeight(page);
        console.log('printing title', line, '-', width, 'x', height);

        await page.screenshot({
            path: `${VARIABLES.PRINT_PARTIAL_PATH}${line}.jpg`,
            clip: {
                x: VARIABLES.CHART_START_POSITION_X,
                y: VARIABLES.CHART_START_POSITION_y,
                width: width,
                height: height
            }
        });
        await page.waitForTimeout(300);
    }

    static async printTimeline(page: Page, line: number, column: number) {
        console.log('printing timeline', line, column);

        await page.screenshot({
            path: `${VARIABLES.PRINT_PARTIAL_PATH}${line}-${column}.JPG`,
            clip: {
                x: VARIABLES.CHART_START_POSITION_X + await this.getGridTitleWidth(page),
                y: VARIABLES.CHART_START_POSITION_y,
                width: VARIABLES.PAGE_PRINT_WIDTH,
                height: VARIABLES.PAGE_PRINT_HEIGHT
            }
        });
        await page.waitForTimeout(300);
    }
}
