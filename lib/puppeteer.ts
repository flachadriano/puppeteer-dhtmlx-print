import puppeteer from "puppeteer";

export async function getNewInstance() {
   return await puppeteer.launch({
        executablePath: process.env.CHROME_PATH,
        args: ['--no-sandbox'],
    });
}