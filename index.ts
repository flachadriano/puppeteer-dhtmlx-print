const express = require('express');
const puppeteer = require('puppeteer');
const cors = require('cors');
const app = express();
import PDFDocument from "pdfkit";
const fs = require('fs');

require('dotenv').config();

const baseUrl = process.env.ENDPOINT_URL;
const port = process.env.SERVER_PORT;

app.use(cors());

const IMG_FILE = 'chart.jpg';
const PDF_FILE = 'chart.pdf';

// to endpoint https://dhtmlx.com/docs/products/dhtmlxGantt/01_basic.html
//const CHART_ID = '#gantt_here';

// to endpoint file:///usr/src/app/output/project.html
const CHART_ID = '#gantt';

const GRID_CHART_CLASS = '.gantt_layout_cell.grid_cell';
const TIMELINE_CHART_CLASS = '.gantt_layout_cell.timeline_cell';

async function changeElWidth(page: any, cssClass: string, newWidth: string) {
   let el = await page.$(cssClass);
   await el.evaluate((el: any, newWidth: string) => el.style.width = newWidth, newWidth);
}

async function changeElHeight(page: any, cssClass: string, newHeight: string) {
   let el = await page.$(cssClass);
   await el.evaluate((el: any, newHeight: string) => el.style.height = newHeight, newHeight);
}

async function generatePdfFromUrl() {
   const browser = await puppeteer.launch({
      executablePath: '/usr/bin/google-chrome',
      args: ['--no-sandbox'],
   });

   // render page
   let page: any = await browser.newPage();
   await page.goto(baseUrl);
   await page.waitForTimeout(2000);

   // get sizes of the full chart, to use the height
   const chartEl: any = await page.$(CHART_ID);
   await changeElHeight(page, CHART_ID, '100%')
   const chartBBox: any = await chartEl.boundingBox();

   // get sizes of left column of chart to use the width
   const gridEl: any = await page.$(GRID_CHART_CLASS);
   const gridBBox: any = await gridEl.boundingBox();

   // get sizes of the timeline of chart to use the width
   const timelineEl: any = await page.$(TIMELINE_CHART_CLASS);
   await changeElWidth(page, TIMELINE_CHART_CLASS, '');
   const timelineBBox: any = await timelineEl.boundingBox();

   const contentEl: any = await page.$('.gantt_task_bg');
   const contentBBox: any = await contentEl.boundingBox();

   console.log('bbox');
   console.log('chart', chartBBox);
   console.log('grid', gridBBox);
   console.log('timeline', timelineBBox);

   const width = gridBBox.width + timelineBBox.width;
   const height = contentBBox.height;

   page = await browser.newPage();
   await page.goto(baseUrl);
   await page.waitForTimeout(2000);
   await page.setViewport({ width, height, deviceScaleFactor: 1 });

   // change the width to extend the timeline to the whole content
   await changeElWidth(page, '.gantt_layout_root', `${width}px`);
   await changeElWidth(page, '.gantt_layout_x', `${width}px`);
   await changeElWidth(page, TIMELINE_CHART_CLASS, `${width}px`);

   // change the height to extend the timeline to the whole content
   await changeElHeight(page, '.gantt_layout_root', `${height}px`);
   await changeElHeight(page, '.gantt_layout_x', `${height}px`);
   await changeElHeight(page, '.grid_cell', `${height}px`);
   await changeElHeight(page, '.grid_cell .gantt_layout_content', `${height}px`);
   await changeElHeight(page, '.gantt_grid', `${height}px`);
   await changeElHeight(page, '.gantt_grid_data', `${height}px`);
   await changeElHeight(page, '.timeline_cell', `${height}px`);
   await changeElHeight(page, '.timeline_cell .gantt_layout_content', `${height}px`);
   await changeElHeight(page, '.gantt_task', `${height}px`);
   await changeElHeight(page, '.gantt_data_area', `${height}px`);
   await changeElHeight(page, '.gantt_task_bg', `${height}px`);

   let images = 0;
   const quantityImages = width / 10000;
   for (; images < quantityImages; images++) {
      const outputFile = `./output/${images}-${IMG_FILE}`;
      console.log('printing image', outputFile);
      await page.screenshot({
         path: outputFile,
         clip: {
            x: chartBBox.x + (images * 10000),
            y: chartBBox.y - 100,
            width: 10000,
            height: height
         }
      });
   }

   await browser.close();

   printPdf(width, height, images);
}

async function printPdf(width: number, height: number, images: number) {

   console.log('width =', width, ' height =', height);
   const doc = new PDFDocument({
      size: [width + 150, height + 150] // 150 for margins
   });
   doc.pipe(fs.createWriteStream(`./output/${PDF_FILE}`));
   for (let i = 0; i < images; i++) {
      doc.image(`./output/${i}-${IMG_FILE}`, i * 10000, 0);
   }
   doc.end();
}

app.get('/img', async (req: any, res: any) => {
   try {
      await generatePdfFromUrl();
      res.download(`./output/${PDF_FILE}`, PDF_FILE, (err: any) => {
         if (err) {
            console.error(`Error sending IMG to client: ${err}`);
         } else {
            console.log(`IMG sent to client`);
         }
      });
   } catch (err: any) {
      console.log('err', err);
      console.error(`Error generating IMG: ${err}`);
      res.status(500).send(`Error generating IMG: ${err}`);
   }
});

app.listen(port, () => {
   console.log(`Server listening on port: ${port}`);
});
