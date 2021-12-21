import {createCursor} from 'ghost-cursor';
import {Browser, Page} from 'puppeteer';
import {logger} from './logger';
import {Link, Store} from './store/model';
import {config} from './config';
import {NvidiaDE} from './store/model/nvidia-de';
import {Notebooksbilliger} from './store/model/notebooksbilliger';

export async function addToCartAndCheckout(
  browser: Browser,
  link: Link,
  store: Store,
  page: Page
) {
  if (!config.store.autoPurchase) return;

  switch (store.name) {
    case NvidiaDE.name:
      await checkoutNvidiaDe(store, page);
      break;
    case Notebooksbilliger.name:
      await checkoutNotebooksbilliger(store, page);
      break;
    default:
      logger.debug('no checkout function found');
  }
}
async function checkoutNvidiaDe(store: Store, page: Page) {}

async function checkoutNotebooksbilliger(store: Store, page: Page) {
  logger.debug('start checkout notebooksbilliger');

  const cursor = createCursor(page);

  if (store.hasCookieWall && store.labels.cookie) {
    logger.debug('accepting cookies');
    const cookieAcceptButtonSelector = '#uc-btn-deny-banner';
    await page.waitForSelector(cookieAcceptButtonSelector);
    await cursor.click(cookieAcceptButtonSelector);
  }

  // add to cart
  const addToCartButtonSelector = ".shopping_cart_btn button[type='submit']";
  await page.waitForSelector(addToCartButtonSelector);
  await cursor.click(addToCartButtonSelector);

  // wait for overlay
  const toCartButtonSelector = 'a#cartlayer_link_checkout';
  await page.waitForSelector(toCartButtonSelector);
  await cursor.click(toCartButtonSelector);

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

  await cursor.click(loginButtonSelector);

  // manchmal kommt die produktseite wieder
  console.log(page.url());

  /** address selecttion */
  await page.waitForFunction(
    "document.querySelector('div#delivery_private') && document.querySelector('div#delivery_private').style.display != 'none'"
  );

  const selectAddressSelector = 'button.nbx-btn.choose-address-button';
  await page.waitForSelector(selectAddressSelector);

  //   await new Promise(res => setTimeout(res, 2000));
  await cursor.click(selectAddressSelector);

  /** delivery method selection */
  // standarmäßig wird Vorkasse bei Bezahlmethode ausgewählt
  // von der Zahlungsmethode abhängige Versandmethode
  // Vorkasse: #ship2moneyorder_55 -> shiphermesmoneyorderlabel_55
  const deliveryMethodSelector = 'div[id^="ship2moneyorder"]';
  await page.waitForFunction(
    `document.querySelector('${deliveryMethodSelector}') && document.querySelector('${deliveryMethodSelector}').style.display != 'none'`
  );

  const conditionsSelector =
    '#checkout_box_terms_and_conditions label[for="conditions"] span';
  await page.waitForSelector(conditionsSelector);
  await cursor.click(conditionsSelector);

  const continueSelector =
    'div#checkout-process-button-section>#button_bottom>button[type="submit"]';
  await page.waitForSelector(continueSelector);
  await cursor.click(continueSelector);

  const confirmPurchaseSelector = 'input[type="submit"]#checkout_submit';
  await page.waitForSelector(confirmPurchaseSelector);

  if (!config.purchase.testRun) {
    await cursor.click(confirmPurchaseSelector);
    logger.info('Purchase complete notebooksbilliger');
  } else {
    (await page.$(confirmPurchaseSelector))?.evaluate(element => {
      element.style.background = 'black';
    });
  }

  return true;
  //
}
