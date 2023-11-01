import { Page } from 'puppeteer';
import VARIABLES from './variables';
import Gantt from './gantt';
import Print from './print';
import PDF from './pdf';

export async function printGanttScroll(signedInPage: Page) {
  await signedInPage.setViewport({
    width: VARIABLES.BROWSER_PAGE_WIDTH,
    height: VARIABLES.BROWSER_PAGE_HEIGHT,
    deviceScaleFactor: 1
  });
  console.log('changed browser dimensions to', VARIABLES.BROWSER_PAGE_WIDTH, 'x', VARIABLES.BROWSER_PAGE_HEIGHT);
  await signedInPage.waitForTimeout(1000);

  Print.wholePage(signedInPage);

  const gridEl: any = await signedInPage.$(VARIABLES.CHART_TASK_TITLE_CLASS);
  const gridBbox: any = await gridEl.boundingBox();
  
  const width = await Gantt.getWidth(signedInPage);
  const height = await Gantt.getHeight(signedInPage)
  const lines = await Gantt.getLinesToPrint(signedInPage);
  const columns = await Gantt.getColumnsToPrint(signedInPage);
  console.log('chart dimensions:', width, 'x', height);
  console.log('lines', lines, 'columns', columns);

  const chartVerticalScrollbarEl = await signedInPage.$(VARIABLES.CHART_VERTICAL_SCROLL_CLASS);
  const chartHorizontalScrollbarEl = await signedInPage.$(VARIABLES.CHART_HORIZONTAL_SCROLL_CLASS);

  // the chart can be viewed without scroll
  if (!chartVerticalScrollbarEl && !chartHorizontalScrollbarEl) {
    console.log('not scroll bars');
    const el: any = await signedInPage.$('#gantt');
    const elBbox = await el.boundingBox();
    signedInPage.waitForTimeout(300);

    await signedInPage.screenshot({
      path: `${VARIABLES.PRINT_PARTIAL_PATH}0.jpg`,
      clip: {
        x: elBbox.x,
        y: elBbox.y,
        width: VARIABLES.PAGE_PRINT_WIDTH,
        height: VARIABLES.PAGE_PRINT_HEIGHT
      }
    });
    await PDF.generatePdf(signedInPage, 1, 0, 0);

  } else if (!chartVerticalScrollbarEl) {
    console.log('not vertical scroll bar');
    await generateScreenshots(signedInPage, 1, columns);
    await PDF.generatePdf(signedInPage, 1, columns, gridBbox.width);

  } else if (!chartHorizontalScrollbarEl) {
    console.log('with vertical scroll bar and not horizontal scroll bar');
    await generateScreenshots(signedInPage, lines, 1);
    await PDF.generatePdf(signedInPage, lines, 1, gridBbox.width);

  } else {
    console.log('all scroll bars');
    await generateScreenshots(signedInPage, lines, columns);
    await PDF.generatePdf(signedInPage, lines, columns, gridBbox.width);
  }
}

async function generateScreenshots(signedInPage: Page, lines: number, columns: number) {
  console.log('--> printing', new Date().toISOString());
  
  const ganttInfo = await Gantt.getChartInfo(signedInPage);
  const chartHorizontalScrollbarEl = await signedInPage.$(VARIABLES.CHART_HORIZONTAL_SCROLL_CLASS);
  const chartVerticalScrollbarEl = await signedInPage.$(VARIABLES.CHART_VERTICAL_SCROLL_CLASS);
  const widthScroll = await Gantt.getVisibleTimelineWidth(signedInPage);
  console.log('widthScroll', widthScroll);
  const heightScroll = ganttInfo.height - VARIABLES.CHART_HEADER_HEIGHT - VARIABLES.CHART_BOTTOM_BORDER;
  console.log('heightScroll', heightScroll);

  for (let lineIndex = 0; lineIndex < lines; lineIndex++) {
    chartHorizontalScrollbarEl && await chartHorizontalScrollbarEl.evaluate((el: any, newPosition) => el.scrollLeft = newPosition, 0);

    if (lineIndex + 1 > lines) {
      await Gantt.printGridTItleLastLine(signedInPage, ganttInfo.x, ganttInfo.y, lineIndex, lines);
    } else {
      await Gantt.printGridTitle(signedInPage, ganttInfo.x, ganttInfo.y, lineIndex);
    }
    
    for (let columnIndex = 0; columnIndex < columns; columnIndex++) {
      Print.wholePageVar(signedInPage, `${lineIndex}-${columnIndex}`);

      if (lineIndex + 1 > lines) {
        if (columnIndex + 1 > columns) {
          await Gantt.printTimelineLastLineColumn(signedInPage, ganttInfo.x, ganttInfo.y, lineIndex, columnIndex, lines, columns);
        } else {
          await Gantt.printTimelineLastLine(signedInPage, ganttInfo.x, ganttInfo.y, lineIndex, columnIndex, lines);
        }
      } else if (columnIndex + 1 > columns) {
        await Gantt.printTimelineLastColumn(signedInPage, ganttInfo.x, ganttInfo.y, lineIndex, columnIndex, columns);
      } else {
        await Gantt.printTimeline(signedInPage, ganttInfo.x, ganttInfo.y, lineIndex, columnIndex);
      }

      chartHorizontalScrollbarEl && await chartHorizontalScrollbarEl.evaluate((el: any, w) => el.scrollLeft = parseInt(el.scrollLeft, 10) + w, widthScroll - VARIABLES.CHART_RIGHT_BORDER - VARIABLES.CHART_WIDTH_MARGIN);
    }

    chartVerticalScrollbarEl && await chartVerticalScrollbarEl.evaluate((el: any, h) => el.scrollTop = parseInt(el.scrollTop, 10) + h, heightScroll);
  }
}
