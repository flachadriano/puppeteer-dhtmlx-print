import PDFDocument from "pdfkit";
import fs from 'fs';
import { Page } from "puppeteer";

const IMG_FILE = 'chart.jpg';
const PDF_FILE = 'chart.pdf';

const CHART_ID = '#gantt';
const GRID_CHART_CLASS = '.gantt_layout_cell.grid_cell';
const TIMELINE_CHART_CLASS = '.gantt_layout_cell.timeline_cell';

const IMAGE_SEGMENT_PX = 1000;

async function changeElWidth(page: any, cssClass: string, newWidth: string) {
    let el = await page.$(cssClass);
    await el.evaluate((el: any, newWidth: string) => el.style.width = newWidth, newWidth);
}

async function changeElHeight(page: any, cssClass: string, newHeight: string) {
    let el = await page.$(cssClass);
    await el.evaluate((el: any, newHeight: string) => el.style.height = newHeight, newHeight);
}

interface PreparedPageData {
   startedX: number;
   startedY: number;
   chartWidth: number;
   chartHeight: number;
   widthImages?: number;
   heightImages?: number;
}

export async function getChartProperties(signedInPage: Page): Promise<PreparedPageData> {
   console.log('--> start page preparation to print gantt chart');

   // get sizes of left column of chart to use the width
   const gridEl: any = await signedInPage.$(GRID_CHART_CLASS);
   const gridBBox: any = await gridEl.boundingBox();

   // get sizes of the timeline of chart to use the width
   const timelineEl: any = await signedInPage.$(TIMELINE_CHART_CLASS);
   await changeElWidth(signedInPage, TIMELINE_CHART_CLASS, '');
   const timelineBBox: any = await timelineEl.boundingBox();

   const contentEl: any = await signedInPage.$('.gantt_task_bg');
   const contentBBox: any = await contentEl.boundingBox();

   console.log('contentBBox', contentBBox);
   console.log('gridBBox', gridBBox);
   console.log('timelineBBox', timelineBBox);

   const width = gridBBox.width + timelineBBox.width;
   const height = contentBBox.height;

   console.log('--> page prepared to print');   
   return Promise.resolve({
      startedX: 60,
      startedY: 410,
      chartWidth: width,
      chartHeight: height
   });
}

export async function printGanttImages(signedInPage: Page, pageData: PreparedPageData) {
   console.log('--> starting print chart images');
   console.log('pageData', pageData);

   await changeElWidth(signedInPage, CHART_ID, `${pageData.chartWidth}px`);
   await changeElHeight(signedInPage, CHART_ID, `${pageData.chartHeight}px`);

   await signedInPage.setViewport({
      width: pageData.chartWidth,
      height: pageData.chartHeight,
      deviceScaleFactor: 1
   });

   await signedInPage.waitForTimeout(10000);

   const widthCut = IMAGE_SEGMENT_PX;
   const heightCut = IMAGE_SEGMENT_PX;
   const widthImages = pageData.chartWidth / widthCut;
   const heightImages = pageData.chartHeight / heightCut;

   pageData.widthImages = widthImages;
   pageData.heightImages = heightImages;

   for (let heightIndex = 0; heightIndex < heightImages; heightIndex++) {
      for (let widthIndex = 0; widthIndex < widthImages; widthIndex++) {
         const outputFile = `./output/${widthIndex}-${heightIndex}-${IMG_FILE}`;
         console.log('printing image', outputFile, widthImages);
         await signedInPage.screenshot({
            path: outputFile,
            clip: {
               x: pageData.startedX + (widthIndex * widthCut),
               y: pageData.startedY + (heightIndex * heightCut),
               width: widthCut,
               height: heightCut
            }
         });
      }
   }

   console.log('--> all gantt chart images printed');
   return pageData;
}

export async function printGanttPdf(pageData: PreparedPageData) {
   console.log('--> start pdf printing process');
   
   const doc = new PDFDocument({
      size: [pageData.chartWidth, pageData.chartHeight]
   });
   doc.pipe(fs.createWriteStream(`./output/${PDF_FILE}`));
   for (let heightIndex = 0; heightIndex < (pageData.heightImages || 0); heightIndex++) {
      for (let widthIndex = 0; widthIndex < (pageData.widthImages || 0); widthIndex++) {
         console.log(`print image ${widthIndex}-${heightIndex}-${IMG_FILE}`);
         doc.image(`./output/${widthIndex}-${heightIndex}-${IMG_FILE}`, widthIndex * IMAGE_SEGMENT_PX, heightIndex * IMAGE_SEGMENT_PX);
      }
   }
   doc.end();

   console.log('--> printed chart pdf');
}
