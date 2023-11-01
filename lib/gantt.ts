import { Page } from 'puppeteer';
import VARIABLES from './variables';

export default class Gantt {
    static async getChartInfo(page: Page) {
        const ganttEl: any = await page.$(VARIABLES.CHART_WRAPPER_CLASS);
        const ganttBbox = await ganttEl.boundingBox();
        page.waitForTimeout(300);

        return ganttBbox;
    }

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

    static async getVisibleTimelineWidth(page: Page) {
        const el: any = await page.$(VARIABLES.CHART_TIMELINE_VISIBLE_CLASS);
        const widthStr = await el.evaluate((e: any) => e.style.width);
        return parseInt(widthStr.replace('px', ''), 10);
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

    static async getHeightWithoutScrollbar(page: Page) {
        const contentEl: any = await page.$(VARIABLES.CHART_VERTICAL_WITHOUT_SCROLL_CLASS);
        const bbox = await contentEl.boundingBox();

        await page.waitForTimeout(300);
        return bbox.height;
    }

    static async getVisibleWidth(page: Page) {
        const contentEl: any = await page.$(VARIABLES.CHART_WRAPPER_CLASS);
        const bbox = await contentEl.boundingBox();

        await page.waitForTimeout(300);
        return bbox.width;
    }

    static async getHeight(page: Page) {
        const verticalScrollbar = await this.getVerticalScrollbar(page);
        
        if (verticalScrollbar) {
            return await this.getVerticalScrollbarHeight(page);
        } else {
            return await this.getHeightWithoutScrollbar(page);
        }
    }

    static async getLinesToPrint(page: Page) {
        const height = await Gantt.getHeight(page)
        return height / await Gantt.getVisibleHeight(page);
    }

    static async getColumnsToPrint(page: Page) {
        const width = await Gantt.getWidth(page);
        return width / await this.getVisibleWidth(page);
    }

    static async getGridTitleWidth(page: Page) {
        const gridEl: any = await page.$(VARIABLES.CHART_TASK_TITLE_CLASS);
        const gridBbox: any = await gridEl.boundingBox();
        
        await page.waitForTimeout(300);
        return gridBbox.width;
    }

    static async printGridTitle(page: Page, x: number, y: number, line: number) {
        const gridTitleWidth = await this.getGridTitleWidth(page) - VARIABLES.CHART_RIGHT_BORDER;
        let height = await this.getVisibleHeight(page);
        height = line == 0 ? height : height - VARIABLES.CHART_HEADER_HEIGHT - VARIABLES.CHART_BOTTOM_BORDER;
        
        const posY = line == 0 ? y : y + VARIABLES.CHART_HEADER_HEIGHT;
        console.log('printing title   ', line, '-', 'position:', x, 'x', posY, 'size:', gridTitleWidth, 'x', height);
        await page.screenshot({
            path: `${VARIABLES.PRINT_PARTIAL_PATH}${line}.jpg`,
            clip: {
                x,
                y: posY,
                width: gridTitleWidth,
                height
            }
        });
        await page.waitForTimeout(300);
    }

    static async printGridTItleLastLine(page: Page, x: number, yStart: number, line: number, lines: number) {
        const width = await this.getGridTitleWidth(page) - VARIABLES.CHART_RIGHT_BORDER;
        const height = await this.getVisibleHeight(page);
        const rest = lines % 1;
        const restHeight = rest * height;
        const restHeightDiff = Math.ceil(height - restHeight + VARIABLES.CHART_HEADER_HEIGHT - VARIABLES.CHART_BOTTOM_BORDER);
        const heightPrint = restHeight;

        const y = Math.ceil(yStart + restHeightDiff);
        if (heightPrint > 0) {
            console.log('printing title last', line, 'position:', x, 'x', y, 'size:', width, 'x', heightPrint);
            await page.screenshot({
                path: `${VARIABLES.PRINT_PARTIAL_PATH}${line}.jpg`,
                clip: { x, y, width, height: heightPrint }
            });
            await page.waitForTimeout(300);
        } else {
            console.log('printing title last - no');
        }
    }

    static async printTimeline(page: Page, startX: number, yStart: number, line: number, column: number) {
        const gridTitleWidth = await this.getGridTitleWidth(page);
        let width = await this.getVisibleWidth(page);
        width = width - gridTitleWidth - VARIABLES.CHART_RIGHT_BORDER;
        let height = await this.getVisibleHeight(page);
        height = line == 0 ? height : height - VARIABLES.CHART_HEADER_HEIGHT - VARIABLES.CHART_BOTTOM_BORDER;

        const x = startX + gridTitleWidth;
        const y = line == 0 ? yStart : yStart + VARIABLES.CHART_HEADER_HEIGHT;
        console.log('printing timeline', line, column, 'position:', x, 'x', y, 'size:', width, 'x', height);

        await page.screenshot({
            path: `${VARIABLES.PRINT_PARTIAL_PATH}${line}-${column}.JPG`,
            clip: { x, y, width, height }
        });
        await page.waitForTimeout(300);
    }

    static async printTimelineLastColumn(page: Page, startX: number, yStart: number, line: number, column: number, columns: number) {
        const gridTitleWidth = await this.getGridTitleWidth(page);
        let width = await this.getVisibleWidth(page);
        width -= gridTitleWidth;
        let height = await this.getVisibleHeight(page);
        height = line == 0 ? height : height - VARIABLES.CHART_HEADER_HEIGHT - VARIABLES.CHART_BOTTOM_BORDER;

        const rest = columns % 1;
        const restWidth = Math.ceil(rest * width);

        let x = startX;
        x += restWidth - VARIABLES.CHART_RIGHT_BORDER - 30;
        const y = line == 0 ? yStart : yStart + VARIABLES.CHART_HEADER_HEIGHT;
        console.log('printing timeline', line, column, 'position:', x, 'x', y, 'size:', width, 'x', height);

        await page.screenshot({
            path: `${VARIABLES.PRINT_PARTIAL_PATH}${line}-${column}.JPG`,
            clip: { x, y, width, height }
        });
        await page.waitForTimeout(300);
    }

    static async printTimelineLastLine(page: Page, startX: number, startY: number, line: number, column: number, lines: number) {
        const height = await this.getVisibleHeight(page);
        const gridTitleWidth = await this.getGridTitleWidth(page);
        const width = await this.getWidth(page) - VARIABLES.CHART_RIGHT_BORDER;
        const rest = lines % 1;
        const restHeight = Math.ceil(rest * height);
        const restHeightDiff = Math.ceil(height - restHeight + VARIABLES.CHART_HEADER_HEIGHT - VARIABLES.CHART_BOTTOM_BORDER);
        const printHeight = restHeight;

        const x = startX + gridTitleWidth;
        const y = startY + restHeightDiff;
        if (printHeight > 0) {
            console.log('printing timeline last', line, column, 'position:', x, 'x', y, 'size:', width - gridTitleWidth, 'x', printHeight);

            await page.screenshot({
                path: `${VARIABLES.PRINT_PARTIAL_PATH}${line}-${column}.JPG`,
                clip: {
                    x,
                    y,
                    width: width - gridTitleWidth - VARIABLES.CHART_RIGHT_BORDER,
                    height: printHeight
                }
            });
            await page.waitForTimeout(300);
        } else {
            console.log('printing timeline last - no');
        }
    }

    static async printTimelineLastLineColumn(page: Page, startX: number, startY: number, line: number, column: number, lines: number, columns: number) {
        const height = await this.getVisibleHeight(page);
        const gridTitleWidth = await this.getGridTitleWidth(page);
        const width = await this.getWidth(page) - VARIABLES.CHART_RIGHT_BORDER;
        const rest = lines % 1;
        const restHeight = Math.ceil(rest * height);
        const restHeightDiff = Math.ceil(height - restHeight + VARIABLES.CHART_HEADER_HEIGHT - VARIABLES.CHART_BOTTOM_BORDER);
        const printHeight = restHeight;

        const restCol = columns % 1;
        const restWidth = Math.ceil(restCol * width);

        const x = startX + gridTitleWidth + restWidth;
        const y = startY + restHeightDiff;
        if (printHeight > 0) {
            console.log('printing timeline last', line, column, 'position:', x, 'x', y, 'size:', width - gridTitleWidth, 'x', printHeight);

            await page.screenshot({
                path: `${VARIABLES.PRINT_PARTIAL_PATH}${line}-${column}.JPG`,
                clip: {
                    x,
                    y,
                    width: width - gridTitleWidth - VARIABLES.CHART_RIGHT_BORDER,
                    height: printHeight
                }
            });
            await page.waitForTimeout(300);
        } else {
            console.log('printing timeline last - no');
        }
    }
}
