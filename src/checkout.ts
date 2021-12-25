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
        await checkoutNvidiaDe(store, page, link, cursor);
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
async function checkoutNvidiaDe(
  store: Store,
  page: Page,
  link: Link,
  cursor: GhostCursor
) {
  logger.info('start checkout nvidia-de');

  const buySelector = 'div.buy a.featured-buy-link';
  await page.waitForSelector(buySelector);
  await cursor.click(buySelector);

  // await checkoutNotebooksbilliger(store, page, link, cursor);

  const stateMachine = new NotebooksbilligerStateMachine({
    page,
    store,
    link,
    cursor,
  });
  await stateMachine?.initialize();
  await stateMachine?.doCheckout();
}

async function checkoutNotebooksbilliger(
  store: Store,
  page: Page,
  link: Link,
  cursor: GhostCursor
) {
  logger.info('start checkout notebooksbilliger');

  link.url = page.url();

  if (store.hasCookieWall && store.labels.cookie) {
    logger.info('accepting cookies');
    const cookieAcceptButtonSelector = '#uc-btn-deny-banner';
    await page.waitForSelector(cookieAcceptButtonSelector);
    await cursor.click(cookieAcceptButtonSelector);

    logger.info('cookies accepted');
  }
  // wait to be visible?

  // add to cart
  logger.info('adding to cart');
  const addToCartButtonSelector = ".shopping_cart_btn button[type='submit']";
  await page.waitForSelector(addToCartButtonSelector);
  await clickNavigate(page, cursor, addToCartButtonSelector);

  logger.info('added to cart');

  // wait for overlay
  logger.info('wait for to cart popup');
  const toCartButtonSelector = 'a#cartlayer_link_checkout';
  await page.waitForSelector(toCartButtonSelector);
  await clickNavigate(page, cursor, toCartButtonSelector);

  logger.info('typing login');
  const emailSelector = 'form input[type="email"]#f_email_address';
  await page.waitForSelector(emailSelector);

  const passwordSelector = 'form input[type="password"]#f_password';
  await page.waitForSelector(passwordSelector);

  const loginButtonSelector = 'form button[name="login"]';
  await page.waitForSelector(loginButtonSelector);

  await page.type(emailSelector, config.purchase.email, {
    delay: 20,
  });

  await page.type(passwordSelector, config.purchase.password, {
    delay: 20,
  });

  await clickNavigate(page, cursor, loginButtonSelector);

  // manchmal kommt die produktseite wieder
  if (page.url().startsWith(link.url)) {
    const toCartButtonSelector = 'a#cartlayer_link_checkout';
    await page.waitForSelector(toCartButtonSelector);
    await clickNavigate(page, cursor, toCartButtonSelector);
  }

  /** address selection */
  logger.info('selecting address');
  if (
    await pageIncludesLabels(
      page,
      {text: ['client has been blocked by bot protection']},
      {
        requireVisible: true,
        selector: 'body',
        type: 'textContent',
      }
    )
  )
    throw new Error('bot detection');
  await page.waitForFunction(
    "document.querySelector('div#delivery_private') && document.querySelector('div#delivery_private').style.display != 'none'"
  );

  const selectAddressSelector = 'button.nbx-btn.choose-address-button';
  await page.waitForSelector(selectAddressSelector);
  await cursor.click(selectAddressSelector);

  /** delivery method selection */
  // standarmäßig wird Vorkasse bei Bezahlmethode ausgewählt
  // von der Zahlungsmethode abhängige Versandmethode
  // Vorkasse: #ship2moneyorder_55 -> shiphermesmoneyorderlabel_55
  // Kreditkarte: #idpaycreditcard
  logger.info('selecting payment method');
  const paymentMethodSelector = 'div#idpaycreditcard';
  await page.waitForFunction(
    `document.querySelector('${paymentMethodSelector}') && document.querySelector('${paymentMethodSelector}').style.display != 'none'`
  );
  await cursor.click(paymentMethodSelector);

  logger.info('selecting delivery');

  const deliveryMethodSelector = 'div[id^="ship2creditcard"]';
  await page.waitForFunction(
    `document.querySelector('${deliveryMethodSelector}') && document.querySelector('${deliveryMethodSelector}').style.display != 'none'`
  );

  logger.info('accepting conditions');
  const conditionsSelector =
    '#checkout_box_terms_and_conditions label[for="conditions"] span';
  await page.waitForSelector(conditionsSelector);
  await cursor.click(conditionsSelector);

  logger.info('clicking continue');
  const continueSelector =
    'div#checkout-process-button-section>#button_bottom>button[type="submit"]';
  await page.waitForSelector(continueSelector);
  await clickNavigate(page, cursor, continueSelector);

  logger.info('confirming purchase');
  const confirmPurchaseSelector = 'input[type="submit"]#checkout_submit';
  await page.waitForSelector(confirmPurchaseSelector);

  if (!config.purchase.testRun) {
    await clickNavigate(page, cursor, confirmPurchaseSelector);
    logger.info('Purchase complete notebooksbilliger');
  } else {
    (await page.$(confirmPurchaseSelector))?.evaluate(element => {
      (element as HTMLElement).style.background = 'black';
    });
    logger.info('test run complete');
  }

  await screenshot(link, page, true);

  if (page.url().includes('threedssvc.pay1.de/3ds')) {
    // https://threedssvc.pay1.de/3ds/3ds2/device/174dcaba-d20c-4e8c-8f75-b50df9f16932
    sendCustomTelegramMessage(
      `ASHALAMALA ALA NOREY!\nPurchase almost complete, confirmation might be missing.\n${link.brand}, ${link.series}, ${link.price}, ${link.url}`
    );
    await page.waitForNavigation({timeout: 300000});
  }

  if (page.url().includes('www.notebooksbilliger.de/kasse/erfolgreich')) {
    // https://www.notebooksbilliger.de/kasse/erfolgreich
    await screenshot(link, page, true);

    sendCustomTelegramMessage(
      `ASHALAMALA ALA NOREY!\nPurchase complete, no confirmation necessary.\n${link.brand}, ${link.series}, ${link.price}, ${link.url}`
    );

    checkoutStatus.amount -= 1;
  }

  return true;
  //
}

const screenshot = async (link: Link, page: Page, fullPage = false) => {
  logger.debug('ℹ saving screenshot');

  await fs.mkdir(config.page.screenshotDir, {recursive: true});
  link.screenshot = path.join(
    config.page.screenshotDir,
    `success-${Date.now()}.png`
  );
  await page.screenshot({path: link.screenshot, fullPage});
};

const clickNavigate = async (
  page: Page,
  cursor: GhostCursor,
  selector: string
) => {
  await Promise.all([page.waitForNavigation(), cursor.click(selector)]);
};
