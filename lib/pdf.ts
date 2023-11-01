import { Page } from 'puppeteer';
import Gantt from './gantt';
import PDFDocument from 'pdfkit';
import fs from 'fs';
import VARIABLES from './variables';

export default class PDF {

  static async generatePdf(signedInPage: Page, lines: number, columns: number, gridTitleWidth: number) {
    console.log('--> exporting pdf', new Date().toISOString());

    const width = await Gantt.getWidth(signedInPage);
    const height = await Gantt.getHeight(signedInPage);
    const doc = new PDFDocument({ size: [width, height] });
    doc.pipe(fs.createWriteStream(VARIABLES.PDF_PATH));
    console.log('created pdf', VARIABLES.PDF_PATH, 'dimensions', width, 'x', height);

    const chartHeightImg = await Gantt.getVisibleHeight(signedInPage);
    const chartWidthImg = await Gantt.getVisibleWidth(signedInPage);
    const chartGridColumnTitle = await Gantt.getGridTitleWidth(signedInPage);
    let positionY = 0;

    for (let lineIndex = 0; lineIndex < lines; lineIndex++) {
      let positionX = gridTitleWidth;
      console.log('printing title on pdf', lineIndex, '-', 0, 'x', positionY);
      try { // if it does not have the image
        doc.image(`${VARIABLES.PRINT_PARTIAL_PATH}${lineIndex}.jpg`, 0, positionY);
      } catch {}
      
      for (let columnIndex = 0; columnIndex < columns; columnIndex++) {
        console.log('printing image on pdf', lineIndex, columnIndex, '-', positionX, 'x', positionY);
        try { // if it does not have the image
          doc.image(`${VARIABLES.PRINT_PARTIAL_PATH}${lineIndex}-${columnIndex}.jpg`, positionX, positionY);
        } catch {}
        positionX += chartWidthImg - chartGridColumnTitle - VARIABLES.CHART_WIDTH_MARGIN;
      }
  
      positionY += chartHeightImg;
      if (lineIndex > 0) { // from the second image, remove the space of header
        positionY -= VARIABLES.CHART_HEADER_HEIGHT + VARIABLES.CHART_BOTTOM_BORDER;
      }
    }
    
    doc.end();
  }
}
