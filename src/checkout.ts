import {createCursor, GhostCursor} from 'ghost-cursor';
import {Browser, Page} from 'puppeteer';
import {logger} from './logger';
import {Link, Store} from './store/model';
import {config} from './config';
import {NvidiaDE} from './store/model/nvidia-de';
import {Notebooksbilliger} from './store/model/notebooksbilliger';
import {promises as fs} from 'fs';
import path from 'path';
import {pageIncludesLabels} from './store/includes-labels';
import {sendCustomTelegramMessage} from './messaging/telegram';
import {NotebooksbilligerStateMachine} from './state-machine/notebooksbilliger/notebooksbillger.state-machine';
import {StateMachine} from './state-machine/state-machine';
import {NvidiaDeStateMachine} from './state-machine/nvidia-de/nvidia-de.state-machine';

const checkoutStatus = {
  maxPrice: 1600,
  amount: 2,
};

export async function addToCartAndCheckout(
  browser: Browser,
  link: Link,
  store: Store,
  page: Page
): Promise<boolean> {
  if (!config.store.autoPurchase) return false;

  if (link.price && link.price > checkoutStatus.maxPrice) {
    logger.info('Buying cancelled due to max price cap');
    return false;
  }

  if (checkoutStatus.amount <= 0) {
    logger.info('Buying cancelled du to amount cap');
    return false;
  }

  const cursor = createCursor(page);

  let stateMachine: StateMachine | undefined = undefined;

  try {
    switch (store.name) {
      case NvidiaDE.name:
        stateMachine = new NvidiaDeStateMachine({
          page,
          store,
          link,
          cursor,
        });
        break;
      case Notebooksbilliger.name:
        stateMachine = new NotebooksbilligerStateMachine({
          page,
          store,
          link,
          cursor,
        });

        break;
    }

    if (!stateMachine) return false;

    await stateMachine.initialize();
    return await stateMachine.doCheckout();
  } catch (exp) {
    console.log(exp);
    logger.error(exp);
    logger.error(page.url());
  }
  return false;
}
