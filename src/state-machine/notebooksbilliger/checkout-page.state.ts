import {config} from '../../config';
import {logger} from '../../logger';
import {sendCustomTelegramMessage} from '../../messaging/telegram';
import {State} from '../state';

export class CheckoutPage extends State {
  name = 'CheckoutPage';
  isFinaleState = false;

  async isInCurrentState(): Promise<boolean> {
    return this.page().url() === 'https://www.notebooksbilliger.de/kasse';
  }

  async doTransition(): Promise<boolean> {
    // warte bis delivery freigeschalten ist
    await this.page().waitForFunction(
      "document.querySelector('div#delivery_private') && document.querySelector('div#delivery_private').style.display != 'none'"
    );

    // Adresse auswählen
    const selectAddressSelector = 'button.nbx-btn.choose-address-button';
    await this.page().waitForSelector(selectAddressSelector);
    await this.cursor().click(selectAddressSelector);

    // Zahlungsmethode auswählen
    const paymentMethodSelector = 'div#idpaycreditcard';
    await this.page().waitForFunction(
      `document.querySelector('${paymentMethodSelector}') && document.querySelector('${paymentMethodSelector}').style.display != 'none'`
    );
    await this.cursor().click(paymentMethodSelector);

    // Versandmethode abwarten
    const deliveryMethodSelector = 'div[id^="ship2creditcard"]';
    await this.page().waitForFunction(
      `document.querySelector('${deliveryMethodSelector}') && document.querySelector('${deliveryMethodSelector}').style.display != 'none'`
    );

    // AGBs annehmen
    const conditionsSelector =
      '#checkout_box_terms_and_conditions label[for="conditions"] span';
    await this.page().waitForSelector(conditionsSelector);
    await this.cursor().click(conditionsSelector);

    // Weiter klicken
    const continueSelector =
      'div#checkout-process-button-section>#button_bottom>button[type="submit"]';
    await this.page().waitForSelector(continueSelector);
    await this.clickNavigate(continueSelector);

    return true;
  }
}

export class LastConfirmationPage extends State {
  name = 'LastConfirmationPage';

  public get isFinaleState() {
    return config.purchase.testRun ? true : false;
  }

  async isInCurrentState(): Promise<boolean> {
    return (
      this.page().url() ===
      'https://www.notebooksbilliger.de/kasse/zusammenfassung'
    );
  }
  async doTransition(): Promise<boolean> {
    const confirmPurchaseSelector = 'input[type="submit"]#checkout_submit';
    await this.page().waitForSelector(confirmPurchaseSelector);

    if (config.purchase.testRun) {
      (await this.page().$(confirmPurchaseSelector))?.evaluate(element => {
        (element as HTMLElement).style.background = 'black';
      });
      logger.info('Test run complete');
      this.stateMachine.onPurchaseComplete();
      return true;
    }

    await this.clickNavigate(confirmPurchaseSelector);
    logger.info('Purchase complete');
    return true;
  }
}

export class SuccessPage extends State {
  name = 'SuccessPage';
  isFinaleState = true;

  async isInCurrentState(): Promise<boolean> {
    return this.page()
      .url()
      .includes('www.notebooksbilliger.de/kasse/erfolgreich');
  }

  async doTransition(): Promise<boolean> {
    sendCustomTelegramMessage(
      `ASHALAMALA ALA NOREY!\nPurchase complete, no confirmation necessary.\n${
        this.link().brand
      }, ${this.link().series}, ${this.link().price}, ${this.link().url}`
    );

    await this.stateMachine.onPurchaseComplete();
    return true;
  }
}
