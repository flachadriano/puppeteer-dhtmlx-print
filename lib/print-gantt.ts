import PDFDocument from "pdfkit";
import fs from 'fs';
import { Page } from "puppeteer";
import VARIABLES from "./variables";

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
   pageWidth?: number;
   pageHeight?: number;
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

async function printGanttImagesFullPageWide(signedInPage: Page, pageData: PreparedPageData) {
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
}

async function printChart(signedInPage: Page, outputPath: string, x: number, y: number, width: number, height: number): Promise<boolean> {
   try {
      await signedInPage.screenshot({
         path: outputPath,
         clip: { x, y, width, height }
      });
      return true;
   } catch {
      return false;
   }
}

async function printGanttImagesScroll(signedInPage: Page, pageData: PreparedPageData) {
   const widthCut = VARIABLES.PAGE_PRINT_WIDTH;
   const heightCut = VARIABLES.PAGE_PRINT_HEIGHT;
   const widthImages = pageData.chartWidth / widthCut;
   const heightImages = pageData.chartHeight / heightCut;

   pageData.widthImages = widthImages;
   pageData.heightImages = heightImages;

   const chartScrollbarEl = await signedInPage.$(VARIABLES.CHART_HORIZONTAL_SCROLL_CLASS);

   if (!chartScrollbarEl) {
      throw Error('Chart horizontal scroll bar not found');
   }

   for (let heightIndex = 0; heightIndex < heightImages; heightIndex++) {
      for (let widthIndex = 0; widthIndex < widthImages; widthIndex++) {
         const outputFile = `./output/${widthIndex}-${heightIndex}-${IMG_FILE}`;
         console.log('printing image', outputFile, widthImages);

         await chartScrollbarEl.evaluate((el: any, newWidth) => el.scrollLeft = newWidth, widthCut * widthIndex);
         await signedInPage.waitForTimeout(1000);

         for (let i = 0; i < 5; i++) {
            const printed = await printChart(signedInPage, outputFile, pageData.startedX, pageData.startedY, widthCut, heightCut);
            if (printed) break;
            console.log('tried ', i);
            
         }
      }
   }
}

export async function printGanttImages(signedInPage: Page, pageData: PreparedPageData) {
   console.log('--> starting print chart images');
   console.log('pageData', pageData);

   await changeElWidth(signedInPage, CHART_ID, `${pageData.pageWidth || pageData.chartWidth}px`);
   await changeElHeight(signedInPage, CHART_ID, `${pageData.pageHeight || pageData.chartHeight}px`);

   await signedInPage.setViewport({
      width: pageData.chartWidth,
      height: pageData.chartHeight,
      deviceScaleFactor: 1
   });

   if (pageData.pageWidth) {
      printGanttImagesScroll(signedInPage, pageData);
   } else {
      printGanttImagesFullPageWide(signedInPage, pageData);
      await signedInPage.waitForTimeout(10000);
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
