import {HTTPRequest, HTTPResponse, Page} from 'puppeteer';
import {promises as fs} from 'fs';
import path from 'path';
import {config} from '../config';

export const logRequest = async (response: HTTPResponse, page: Page) => {
  await fs.mkdir(config.page.screenshotDir, {recursive: true});
  const request = response.request();
  if (request.resourceType() !== 'fetch' && request.resourceType() !== 'xhr')
    return;
  const cookies = (await page.cookies())
    .map(cookie => JSON.stringify(cookie))
    .join(',');
  const data = `${new Date().toLocaleTimeString()};; ${request.method()};; ${response.status()};; ${request.url()};; ${request.resourceType()};; '${JSON.stringify(
    request.headers()
  )}';; '${request.postData()}';; ${cookies};;'${JSON.stringify(
    response.headers()
  )}'\n`;

  fs.appendFile(
    path.join(
      config.page.screenshotDir,
      `stream_headless_${config.browser.isHeadless}.csv`
    ),
    data
  );
};
