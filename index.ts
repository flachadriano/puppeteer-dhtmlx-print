import express, { Request } from 'express';
import cors from 'cors';
import { getNewInstance } from "./lib/puppeteer";
import getNewSignedInPage from "./lib/sign-in";
import { accessProjectPage } from "./lib/projects-page";
import { getChartProperties, printGanttImages, printGanttPdf } from './lib/print-gantt';
import { imgApi } from './api/img';

require('dotenv').config({ path: './.env.local' });

const app = express();
app.use(cors());

app.get('/img', imgApi);

// valid test with: 46
app.get('/project/:id', async (req: Request) => {
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
      console.log('-->>> ended project printing', new Date().toISOString());
   }
});

const port = process.env.SERVER_PORT;
app.listen(port, () => {
   console.log(`Server listening on port: ${port}`);
});
