import express, { Request, Response } from 'express';
import cors from 'cors';
import { getNewInstance } from "./lib/puppeteer";
import getNewSignedInPage from "./lib/sign-in";
import { accessProjectPage } from "./lib/projects-page";
import { getChartProperties, printGanttImages, printGanttPdf } from './lib/print-gantt';
import { imgApi } from './api/img';
import { printGanttScroll } from './lib/print-gantt-scroll';

require('dotenv').config({ path: './.env.local' });

const app = express();
app.use(cors());

app.get('/img', imgApi);

// small chart with: 46
// big chart with: 49
app.get('/project/:id', async (req: Request, res: Response) => {
   console.log('-->>> start project printing', new Date().toISOString());   
   const browser = await getNewInstance();
   try {
      const signedInPage = await getNewSignedInPage(browser);
      const projectId = +req.params.id;
      await accessProjectPage(signedInPage, projectId);
      let pageData = await getChartProperties(signedInPage);
      pageData = await printGanttImages(signedInPage, pageData);
      await printGanttPdf(pageData);
   } finally {
      await browser.close();
      res.status(200).json({ message: 'success' });
      console.log('-->>> ended project printing', new Date().toISOString());
   }
});
// 9
// small chart with: 46
// vertical scroll: 21 (3797x4182)
// horizontal scroll: 51 (7360x3282)
// both scrolls: 58 (27142x92780)
// big chart with: 49
app.get('/project-scroll/:id', async (req: Request, res: Response) => {
   const startProcessing: any = new Date();
   console.log('-->>> start project printing', startProcessing.toISOString());   
   const browser = await getNewInstance();
   try {
      const signedInPage = await getNewSignedInPage(browser);
      const projectId = +req.params.id;
      await accessProjectPage(signedInPage, projectId);
      await printGanttScroll(signedInPage);
   } finally {
      await browser.close();
      res.status(200).json({ message: 'success' });
      const endProcessing: any = new Date();
      console.log('-->>> ended project printing', endProcessing.toISOString(), '-', Math.ceil(Math.abs(endProcessing - startProcessing) / 1000), 's');
   }
});

const port = process.env.SERVER_PORT;
app.listen(port, () => {
   console.log(`Server listening on port: ${port}`);
});
