import fs from 'fs';
import PDFDocument from 'pdfkit';
import { Page } from 'puppeteer';
import VARIABLES from './variables';
import Gantt from './gantt';

export async function printGanttScroll(signedInPage: Page, chartWidth: number, chartHeight: number) {
  await signedInPage.setViewport({
    width: VARIABLES.BROWSER_PAGE_WIDTH,
    height: VARIABLES.BROWSER_PAGE_HEIGHT,
    deviceScaleFactor: 1
  });
  console.log('changed browser dimensions to ', VARIABLES.BROWSER_PAGE_WIDTH, 'x', VARIABLES.BROWSER_PAGE_HEIGHT);
  await signedInPage.waitForTimeout(1000);

  await signedInPage.screenshot({
    path: './output/loaded-project-scroll.png',
    clip: { x: 0, y: 0, width: VARIABLES.BROWSER_PAGE_WIDTH, height: VARIABLES.BROWSER_PAGE_HEIGHT }
 });

  const gridEl: any = await signedInPage.$(VARIABLES.CHART_TASK_TITLE_CLASS);
  const gridBbox: any = await gridEl.boundingBox();
  
  const lines = chartHeight / VARIABLES.PAGE_PRINT_HEIGHT;
  const columns = chartWidth / VARIABLES.PAGE_PRINT_WIDTH;
  console.log('lines', lines, 'columns', columns);

  const chartVerticalScrollbarEl = await signedInPage.$(VARIABLES.CHART_VERTICAL_SCROLL_CLASS);
  const chartHorizontalScrollbarEl = await signedInPage.$(VARIABLES.CHART_HORIZONTAL_SCROLL_CLASS);

  // the chart can be viewed without scroll
  if (!chartVerticalScrollbarEl && !chartHorizontalScrollbarEl) {
    console.log('not scroll bars');
    
    await signedInPage.screenshot({
      path: `${VARIABLES.PRINT_PARTIAL_PATH}0.jpg`,
      clip: {
        x: VARIABLES.CHART_START_POSITION_X,
        y: VARIABLES.CHART_START_POSITION_y - 50,
        width: VARIABLES.PAGE_PRINT_WIDTH,
        height: VARIABLES.PAGE_PRINT_HEIGHT
      }
    });
    await generatePdf(signedInPage, 1, 0, 0);

  } else if (!chartVerticalScrollbarEl) {
    console.log('not vertical scroll bar');
    await generateScreenshots(signedInPage, 1, columns);
    await generatePdf(signedInPage, 1, columns, gridBbox.width);

  } else if (!chartHorizontalScrollbarEl) {
    console.log('with vertical scroll bar and not horizontal scroll bar');
    await generateScreenshots(signedInPage, lines, 1);
    await generatePdf(signedInPage, lines, 1, gridBbox.width);

  } else {
    console.log('all scroll bars');
    await generateScreenshots(signedInPage, lines, columns);
    await generatePdf(signedInPage, lines, columns, gridBbox.width);
  }
}

async function generateScreenshots(signedInPage: Page, lines: number, columns: number) {
  console.log('--> printing');
  
  const chartVerticalScrollbarEl = await signedInPage.$(VARIABLES.CHART_VERTICAL_SCROLL_CLASS);
  const chartHorizontalScrollbarEl = await signedInPage.$(VARIABLES.CHART_HORIZONTAL_SCROLL_CLASS);

  for (let lineIndex = 0; lineIndex < lines; lineIndex++) {
    chartVerticalScrollbarEl && await chartVerticalScrollbarEl.evaluate((el: any, newPosition) => el.scrollTop = newPosition, VARIABLES.PAGE_PRINT_HEIGHT * lineIndex);
    chartHorizontalScrollbarEl && await chartHorizontalScrollbarEl.evaluate((el: any, newPosition) => el.scrollLeft = newPosition, 0);
    await Gantt.printGridTitle(signedInPage, lineIndex);

    for (let columnIndex = 0; columnIndex < columns; columnIndex++) {
      chartHorizontalScrollbarEl && await chartHorizontalScrollbarEl.evaluate((el: any, newWidth) => el.scrollLeft = newWidth, VARIABLES.PAGE_PRINT_WIDTH * columnIndex);
      await Gantt.printTimeline(signedInPage, lineIndex, columnIndex);
    }
  }
}

async function generatePdf(signedInPage: Page, lines: number, columns: number, gridTitleWidth: number) {
  console.log('--> exporting pdf');
  
  const width = await Gantt.getWidth(signedInPage);
  const height = await Gantt.getHeight(signedInPage);
  const doc = new PDFDocument({
    size: [width, height]
  });
  doc.pipe(fs.createWriteStream(VARIABLES.PDF_PATH));
  console.log('created pdf', VARIABLES.PDF_PATH, 'dimensions', width, 'x', height);
  
  const chartHeightImg = await Gantt.getVisibleHeight(signedInPage);
  let positionY = 0;

  for (let lineIndex = 0; lineIndex < lines; lineIndex++) {
    let positionX = gridTitleWidth;
    console.log('printing title on pdf', lineIndex, '-', 0, 'x', positionY);
    doc.image(`${VARIABLES.PRINT_PARTIAL_PATH}${lineIndex}.jpg`, 0, positionY);
    
    for (let columnIndex = 0; columnIndex < columns; columnIndex++) {
      console.log('printing image on pdf', lineIndex, columnIndex, '-', positionX, 'x', positionY);
      doc.image(`${VARIABLES.PRINT_PARTIAL_PATH}${lineIndex}-${columnIndex}.jpg`, positionX, positionY);
      positionX += VARIABLES.PAGE_PRINT_WIDTH;
    }

    positionY += chartHeightImg;
  }

  doc.end();
}
