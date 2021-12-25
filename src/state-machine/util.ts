import {Page} from 'puppeteer';
import {config} from '../config';
import {logger} from '../logger';
import {Link} from '../store/model';
import {State} from './state';
import {promises as fs} from 'fs';
import path from 'path';
import {v4 as uuidv4} from 'uuid';

export const asyncFilter = async <T>(
  arr: T[],
  predicate: (element: T) => Promise<boolean>
) => {
  const results = await Promise.all(arr.map(predicate));

  return arr.filter((_v, index) => results[index]);
};

export const asyncFirst = async <T>(
  arr: T[],
  predicate: (element: T) => Promise<boolean>
) => {
  const results = await Promise.all(arr.map(predicate));

  return arr.find((_v, index) => results[index]);
};

export const asyncMaxPrioritized = async <T extends State>(
  arr: T[],
  predicate: (element: T) => Promise<boolean>
) => {
  const results = await asyncFilter(arr, predicate);

  if (results.length <= 0) return undefined;

  return results.reduce((prev, curr) =>
    prev.priority >= curr.priority ? prev : curr
  );
};

export const screenshot = async (link: Link, page: Page, fullPage = false) => {
  const uuid = uuidv4();
  const name = `${uuid}-${link.series}-${Date.now()}`;
  await fs.mkdir(config.page.screenshotDir, {recursive: true});
  link.screenshot = path.join(config.page.screenshotDir, `${name}.png`);
  await page.screenshot({path: link.screenshot, fullPage});

  const data = {
    ...link,
    url: page.url(),
  };
  const bodyHTML = await page.evaluate(() => document.body.innerHTML);

  await fs.writeFile(
    `${config.page.screenshotDir}/${name}.json`,
    JSON.stringify(data)
  );

  await fs.writeFile(`${config.page.screenshotDir}/${name}.html`, bodyHTML);
};
