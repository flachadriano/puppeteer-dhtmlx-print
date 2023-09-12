const express = require('express');
const puppeteer = require('puppeteer');
const cors = require('cors');
const app = express();

require('dotenv').config();

const baseUrl = process.env.ENDPOINT_URL;
const port = process.env.SERVER_PORT;

app.use(cors());

const IMG_FILE = 'chart.jpg';
const PDF_FILE = 'chart.pdf';

async function generatePdfFromUrl() {
   const browser = await puppeteer.launch({
      executablePath: '/usr/bin/google-chrome',
      args: ['--no-sandbox'],
   });

   // render page
   const page = await browser.newPage();
   await page.goto(baseUrl);
   await page.waitForTimeout(5000);

   // get sizes of the full chart, to use the height
   const chartEl = await page.$('#gantt_here');
   await chartEl.evaluate(el => el.style.height = '100%');
   const chartBBox = await chartEl.boundingBox();

   // get sizes of left column of chart to use the width
   const columnLeftEl = await page.$('.gantt_layout_cell.grid_cell');
   const columnLeftBBox = columnLeftEl && await columnLeftEl.boundingBox();

   // get sizes of the timeline of chart to use the width
   const columnRightEl = await page.$('.gantt_layout_cell.timeline_cell');
   await columnRightEl.evaluate(el => el.style.width = '');
   const columnRightBBox = columnRightEl && await columnRightEl.boundingBox();

   console.log('bbox', columnLeftBBox, columnRightBBox, chartBBox);

   const width = columnLeftBBox.width + columnRightBBox.width;
   const height = chartBBox.height;

   page.setViewport({
      width,
      height,
      deviceScaleFactor: 1
   });

   await page.screenshot({
      path: IMG_FILE,
      clip: {
         x: 0,
         y: 0,
         width,
         height
      }
   });

   await browser.close();

   printPdf(width, height);
}

async function printPdf(width, height) {
   PDFDocument = require('pdfkit');
   fs = require('fs');

   console.log('height, width', height, width);
   doc = new PDFDocument({
      size: [width + 150, height + 150] // 150 for margins
   })
   doc.pipe(fs.createWriteStream(`./${PDF_FILE}`))
   doc.image(IMG_FILE);
   doc.end()
}

app.get('/img', async (req, res) => {
   try {
      await generatePdfFromUrl();
      res.download(`./${PDF_FILE}`, PDF_FILE, (err) => {
         if (err) {
            console.error(`Error sending IMG to client: ${err}`);
         } else {
            console.log(`IMG sent to client`);
         }
      });
   } catch (err) {
      console.error(`Error generating IMG: ${err}`);
      res.status(500).send(`Error generating IMG: ${err}`);
   }
});

app.listen(port, () => {
   console.log(`Server listening on port: ${port}`);
});
